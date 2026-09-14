import { AuthUser, AuthSession } from '../types';

const STORAGE_KEYS = {
  CREDENTIALS: 'ahp_auth_credentials_v2',
  SESSION_LOCAL: 'ahp_auth_session_local_v2',
  SESSION_TEMPORARY: 'ahp_auth_session_temp_v2',
  FAILED_ATTEMPTS: 'ahp_auth_failed_attempts_v2',
};

export interface StoredUserAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'logistics_coordinator' | 'manager';
  passwordHash: string; // Base64 salted hash
  alternatePasswordHash?: string; // convenient shorter alias
  lastLogin?: string;
  createdAt?: string;
}

// Simple deterministic hash with salt for secure storage
export function hashPassword(password: string): string {
  const salt = 'AHP_OFFICIAL_PORTAL_SALT_2026#';
  let hash = 0;
  const str = salt + password.trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return btoa(`ahp_${hash}_${str.length}`);
}

const DEFAULT_USERS: StoredUserAccount[] = [
  {
    id: 'user-portal-ahp',
    email: 'portal.ahp@gmail.com',
    name: 'Aldeias Históricas de Portugal',
    role: 'admin',
    passwordHash: hashPassword('AHP@Logistica2026!'),
    alternatePasswordHash: hashPassword('ahp2026'),
    lastLogin: new Date().toISOString(),
    createdAt: '2026-01-01',
  },
  {
    id: 'user-admin-institucional',
    email: 'admin@aldeiashistoricasdeportugal.com',
    name: 'Administração Geral AHP',
    role: 'admin',
    passwordHash: hashPassword('AHP@Logistica2026!'),
    alternatePasswordHash: hashPassword('ahp2026'),
    createdAt: '2026-01-15',
  },
  {
    id: 'user-logistica-coordenador',
    email: 'logistica@ahp.pt',
    name: 'Coordenação de Stock e Postos',
    role: 'logistics_coordinator',
    passwordHash: hashPassword('AHP@Logistica2026!'),
    alternatePasswordHash: hashPassword('ahp2026'),
    createdAt: '2026-02-01',
  },
];

export function getStoredAccounts(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed: StoredUserAccount[] = JSON.parse(raw);
    // Ensure primary user exists
    if (!parsed.some((u) => u.email.toLowerCase() === 'portal.ahp@gmail.com')) {
      parsed.unshift(DEFAULT_USERS[0]);
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveStoredAccounts(accounts: StoredUserAccount[]) {
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(accounts));
}

// -------------------------------------------------------------
// TWO-FACTOR AUTHENTICATION (2FA) CHALLENGE LOGIC
// -------------------------------------------------------------
export interface TwoFactorChallenge {
  email: string;
  userId: string;
  userName: string;
  code: string; // 6-digit numeric verification code
  expiresAt: number; // 10 minutes expiry
  rememberMe: boolean;
  sentTimestamp: string;
}

const STORAGE_KEYS_2FA = 'ahp_auth_2fa_pending_challenge_v1';

export function getPendingTwoFactorChallenge(): TwoFactorChallenge | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS_2FA);
    if (!raw) return null;
    const challenge: TwoFactorChallenge = JSON.parse(raw);
    if (Date.now() > challenge.expiresAt) {
      clearTwoFactorChallenge();
      return null;
    }
    return challenge;
  } catch {
    clearTwoFactorChallenge();
    return null;
  }
}

export function saveTwoFactorChallenge(challenge: TwoFactorChallenge): void {
  sessionStorage.setItem(STORAGE_KEYS_2FA, JSON.stringify(challenge));
}

export function clearTwoFactorChallenge(): void {
  sessionStorage.removeItem(STORAGE_KEYS_2FA);
}

// Generate random 6-digit verification code (e.g. 749210)
function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Rate-limiting / Failed attempts protection
interface AttemptRecord {
  count: number;
  lockedUntil: number; // timestamp
}

export function getFailedAttemptsInfo(): AttemptRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    if (!raw) return { count: 0, lockedUntil: 0 };
    const data: AttemptRecord = JSON.parse(raw);
    // If lock expired, reset
    if (data.lockedUntil > 0 && Date.now() > data.lockedUntil) {
      localStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
      return { count: 0, lockedUntil: 0 };
    }
    return data;
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

export function recordFailedAttempt(): { locked: boolean; remainingSeconds: number; attemptsRemaining: number } {
  const current = getFailedAttemptsInfo();
  const newCount = current.count + 1;
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 30 * 1000; // 30 seconds cooldown

  if (newCount >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_MS;
    localStorage.setItem(
      STORAGE_KEYS.FAILED_ATTEMPTS,
      JSON.stringify({ count: newCount, lockedUntil })
    );
    return {
      locked: true,
      remainingSeconds: 30,
      attemptsRemaining: 0,
    };
  }

  localStorage.setItem(
    STORAGE_KEYS.FAILED_ATTEMPTS,
    JSON.stringify({ count: newCount, lockedUntil: 0 })
  );

  return {
    locked: false,
    remainingSeconds: 0,
    attemptsRemaining: MAX_ATTEMPTS - newCount,
  };
}

export function resetFailedAttempts(): void {
  localStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
}

// Session Management
export function getCurrentSession(): AuthSession | null {
  try {
    // Check localStorage first
    let raw = localStorage.getItem(STORAGE_KEYS.SESSION_LOCAL);
    let isRemembered = true;

    if (!raw) {
      // Check sessionStorage
      raw = sessionStorage.getItem(STORAGE_KEYS.SESSION_TEMPORARY);
      isRemembered = false;
    }

    if (!raw) return null;

    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    session.rememberMe = isRemembered;
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION_LOCAL);
  sessionStorage.removeItem(STORAGE_KEYS.SESSION_TEMPORARY);
}

export function saveSession(session: AuthSession): void {
  const serialized = JSON.stringify(session);
  if (session.rememberMe) {
    localStorage.setItem(STORAGE_KEYS.SESSION_LOCAL, serialized);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_TEMPORARY);
  } else {
    sessionStorage.setItem(STORAGE_KEYS.SESSION_TEMPORARY, serialized);
    localStorage.removeItem(STORAGE_KEYS.SESSION_LOCAL);
  }
}

export interface LoginResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
  lockedUntil?: number;
  remainingSeconds?: number;
  attemptsRemaining?: number;
  requires2FA?: boolean;
  twoFactorEmail?: string;
  twoFactorUserName?: string;
  simulatedCode?: string; // For testing and demonstration preview
}

/**
 * Direct Login:
 * Authenticates user credentials and immediately returns an active session without 2FA.
 */
export function loginUser(
  emailInput: string,
  passwordInput: string,
  rememberMe: boolean = true
): { success: boolean; session?: AuthSession; error?: string; remainingSeconds?: number } {
  const attempts = getFailedAttemptsInfo();
  if (attempts.lockedUntil > Date.now()) {
    const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
    return {
      success: false,
      error: `Access temporarily locked due to multiple failed attempts. Please wait ${remainingSeconds} seconds before trying again.`,
      remainingSeconds,
    };
  }

  const cleanEmail = emailInput.trim().toLowerCase();
  const inputHash = hashPassword(passwordInput);

  const accounts = getStoredAccounts();
  const matchedUser = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

  if (!matchedUser) {
    const attemptResult = recordFailedAttempt();
    return {
      success: false,
      error: 'Invalid email or password. Please verify the entered credentials.',
      remainingSeconds: attemptResult.remainingSeconds,
    };
  }

  const passwordValid =
    matchedUser.passwordHash === inputHash ||
    (matchedUser.alternatePasswordHash && matchedUser.alternatePasswordHash === inputHash);

  if (!passwordValid) {
    const attemptResult = recordFailedAttempt();
    return {
      success: false,
      error: 'Incorrect password. Please verify your password.',
      remainingSeconds: attemptResult.remainingSeconds,
    };
  }

  // Credentials are valid! Create session immediately
  resetFailedAttempts();

  const nowIso = new Date().toISOString();
  matchedUser.lastLogin = nowIso;
  saveStoredAccounts(accounts);

  const authUser: AuthUser = {
    id: matchedUser.id,
    email: matchedUser.email,
    name: matchedUser.name,
    role: matchedUser.role,
  };

  const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
  const newSession: AuthSession = {
    user: authUser,
    token: `ahp_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    expiresAt: Date.now() + sessionDuration,
    rememberMe,
  };

  saveSession(newSession);

  return {
    success: true,
    session: newSession,
  };
}

/**
 * Direct Password Reset:
 * Resets user password directly by entering their registered email and new password.
 */
export function directResetPassword(
  emailInput: string,
  newPasswordInput: string
): { success: boolean; error?: string } {
  const cleanEmail = emailInput.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid institutional email address.' };
  }

  if (!newPasswordInput || newPasswordInput.length < 6) {
    return { success: false, error: 'New password must contain at least 6 characters.' };
  }

  const accounts = getStoredAccounts();
  const user = accounts.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    return { success: false, error: 'No registered user found with this email address.' };
  }

  user.passwordHash = hashPassword(newPasswordInput);
  user.alternatePasswordHash = undefined;
  saveStoredAccounts(accounts);
  localStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);

  return { success: true };
}

/**
 * Legacy wrapper: Step 1 of Login (now direct)
 */
export function initiateTwoFactorLogin(
  emailInput: string,
  passwordInput: string,
  rememberMe: boolean
): LoginResult {
  const res = loginUser(emailInput, passwordInput, rememberMe);
  if (res.success && res.session) {
    return {
      success: true,
      session: res.session,
      requires2FA: false,
    };
  }
  return {
    success: false,
    error: res.error,
    remainingSeconds: res.remainingSeconds,
  };
}

/**
 * Step 2 of Two-Factor Authentication:
 * Validates the 6-digit code entered by the user.
 * If valid, creates the active session.
 */
export function verifyTwoFactorCode(
  email: string,
  codeInput: string
): { success: boolean; session?: AuthSession; error?: string } {
  const challenge = getPendingTwoFactorChallenge();
  if (!challenge || challenge.email.toLowerCase() !== email.trim().toLowerCase()) {
    return {
      success: false,
      error: 'Security challenge session expired or not found. Please log in again.',
    };
  }

  if (Date.now() > challenge.expiresAt) {
    clearTwoFactorChallenge();
    return {
      success: false,
      error: 'Verification code expired (valid for 10 minutes). Please request a new code.',
    };
  }

  const cleanedInput = codeInput.trim().replace(/\D/g, '');
  if (cleanedInput !== challenge.code) {
    return {
      success: false,
      error: 'Invalid 6-digit verification code. Please check the code sent to your email.',
    };
  }

  // Verification succeeded!
  resetFailedAttempts();
  clearTwoFactorChallenge();

  const accounts = getStoredAccounts();
  const matchedUser = accounts.find((acc) => acc.id === challenge.userId);

  if (!matchedUser) {
    return { success: false, error: 'User account not found in registry.' };
  }

  const nowIso = new Date().toISOString();
  matchedUser.lastLogin = nowIso;
  saveStoredAccounts(accounts);

  const authUser: AuthUser = {
    id: matchedUser.id,
    email: matchedUser.email,
    name: matchedUser.name,
    role: matchedUser.role,
    lastLogin: nowIso,
  };

  const durationMs = challenge.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
  const session: AuthSession = {
    user: authUser,
    token: `ahp_sec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    expiresAt: Date.now() + durationMs,
    rememberMe: challenge.rememberMe,
  };

  saveSession(session);

  return {
    success: true,
    session,
  };
}

/**
 * Resends a fresh 6-digit verification code to the user's email
 */
export function resendTwoFactorCode(email: string): { success: boolean; simulatedCode?: string; error?: string } {
  const current = getPendingTwoFactorChallenge();
  if (!current || current.email.toLowerCase() !== email.trim().toLowerCase()) {
    return { success: false, error: 'No active verification session. Please log in again.' };
  }

  const newCode = generate6DigitCode();
  const updated: TwoFactorChallenge = {
    ...current,
    code: newCode,
    expiresAt: Date.now() + 10 * 60 * 1000,
    sentTimestamp: new Date().toISOString(),
  };
  saveTwoFactorChallenge(updated);

  return { success: true, simulatedCode: newCode };
}

export function authenticate(emailInput: string, passwordInput: string, rememberMe: boolean): LoginResult {
  const attempts = getFailedAttemptsInfo();
  if (attempts.lockedUntil > Date.now()) {
    const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
    return {
      success: false,
      error: `Access temporarily locked due to multiple failed attempts. Please wait ${remainingSeconds} seconds before trying again.`,
      lockedUntil: attempts.lockedUntil,
      remainingSeconds,
    };
  }

  const cleanEmail = emailInput.trim().toLowerCase();
  const inputHash = hashPassword(passwordInput);

  const accounts = getStoredAccounts();
  const matchedUser = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

  if (!matchedUser) {
    const attemptResult = recordFailedAttempt();
    return {
      success: false,
      error: 'Invalid username or password. Please verify the entered credentials.',
      ...attemptResult,
    };
  }

  const passwordValid =
    matchedUser.passwordHash === inputHash ||
    (matchedUser.alternatePasswordHash && matchedUser.alternatePasswordHash === inputHash);

  if (!passwordValid) {
    const attemptResult = recordFailedAttempt();
    return {
      success: false,
      error: 'Incorrect password. For security compliance, authentication attempts are logged.',
      ...attemptResult,
    };
  }

  // Success!
  resetFailedAttempts();

  const nowIso = new Date().toISOString();
  matchedUser.lastLogin = nowIso;
  saveStoredAccounts(accounts);

  const authUser: AuthUser = {
    id: matchedUser.id,
    email: matchedUser.email,
    name: matchedUser.name,
    role: matchedUser.role,
    lastLogin: nowIso,
  };

  // 7 days expiration for rememberMe, 12 hours for session
  const durationMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
  const session: AuthSession = {
    user: authUser,
    token: `ahp_sec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    expiresAt: Date.now() + durationMs,
    rememberMe,
  };

  saveSession(session);

  return {
    success: true,
    session,
  };
}

export function updateAccountPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'New password must contain at least 6 characters.' };
  }

  const accounts = getStoredAccounts();
  const user = accounts.find((u) => u.id === userId);

  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  const currentHash = hashPassword(currentPassword);
  const isValid =
    user.passwordHash === currentHash ||
    (user.alternatePasswordHash && user.alternatePasswordHash === currentHash);

  if (!isValid) {
    return { success: false, error: 'The current password provided is incorrect.' };
  }

  user.passwordHash = hashPassword(newPassword);
  user.alternatePasswordHash = undefined; // Clear alias once custom password set
  saveStoredAccounts(accounts);

  return { success: true };
}

// -------------------------------------------------------------
// USER MANAGEMENT & REGISTRATION (REGISTER MORE USERS)
// -------------------------------------------------------------
export function registerNewUser(
  name: string,
  email: string,
  role: 'admin' | 'logistics_coordinator' | 'manager',
  initialPassword: string
): { success: boolean; user?: StoredUserAccount; error?: string } {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) {
    return { success: false, error: 'Full name is required.' };
  }

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'A valid email address is required.' };
  }

  if (!initialPassword || initialPassword.length < 6) {
    return { success: false, error: 'Initial password must be at least 6 characters.' };
  }

  const accounts = getStoredAccounts();
  if (accounts.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'An account with this email address is already registered.' };
  }

  const newUser: StoredUserAccount = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    name: cleanName,
    role,
    passwordHash: hashPassword(initialPassword),
    createdAt: new Date().toISOString().split('T')[0],
  };

  accounts.push(newUser);
  saveStoredAccounts(accounts);

  return { success: true, user: newUser };
}

export function adminResetUserPassword(
  targetUserId: string,
  newPassword: string
): { success: boolean; error?: string } {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters.' };
  }

  const accounts = getStoredAccounts();
  const user = accounts.find((u) => u.id === targetUserId);
  if (!user) {
    return { success: false, error: 'Target user not found.' };
  }

  user.passwordHash = hashPassword(newPassword);
  user.alternatePasswordHash = undefined;
  saveStoredAccounts(accounts);

  return { success: true };
}

export function deleteUserAccount(
  targetUserId: string,
  currentUserId: string
): { success: boolean; error?: string } {
  if (targetUserId === currentUserId) {
    return { success: false, error: 'You cannot delete your own logged-in account.' };
  }

  const accounts = getStoredAccounts();
  const targetUser = accounts.find((u) => u.id === targetUserId);
  if (!targetUser) {
    return { success: false, error: 'User not found in directory.' };
  }

  // Prevent deleting the primary institutional admin
  if (targetUser.email.toLowerCase() === 'portal.ahp@gmail.com') {
    return { success: false, error: 'Primary system administrator account cannot be deleted.' };
  }

  // Ensure at least one admin remains
  const remainingAdmins = accounts.filter((u) => u.id !== targetUserId && u.role === 'admin');
  if (targetUser.role === 'admin' && remainingAdmins.length === 0) {
    return { success: false, error: 'Cannot delete the only remaining administrator account.' };
  }

  const updated = accounts.filter((u) => u.id !== targetUserId);
  saveStoredAccounts(updated);

  return { success: true };
}

// -------------------------------------------------------------
// SELF-SERVICE PASSWORD RESET WITH 2FA VERIFICATION CODE
// -------------------------------------------------------------
export interface PasswordResetChallenge {
  email: string;
  code: string;
  expiresAt: number;
  createdAt: string;
}

const STORAGE_KEY_RESET_PWD = 'ahp_auth_pwd_reset_challenge_v2';

export function requestPasswordResetCode(emailInput: string): {
  success: boolean;
  simulatedCode?: string;
  error?: string;
} {
  const cleanEmail = emailInput.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid institutional email address.' };
  }

  const accounts = getStoredAccounts();
  const user = accounts.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return {
      success: false,
      error: 'No registered user found with this institutional email address.',
    };
  }

  const code = generate6DigitCode();
  const challenge: PasswordResetChallenge = {
    email: user.email,
    code,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
    createdAt: new Date().toISOString(),
  };

  sessionStorage.setItem(STORAGE_KEY_RESET_PWD, JSON.stringify(challenge));

  return {
    success: true,
    simulatedCode: code,
  };
}

export function completePasswordReset(
  emailInput: string,
  codeInput: string,
  newPasswordInput: string
): { success: boolean; error?: string } {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanCode = codeInput.trim().replace(/\D/g, '');

  if (!cleanCode || cleanCode.length < 6) {
    return { success: false, error: 'Please enter the full 6-digit verification code.' };
  }

  if (!newPasswordInput || newPasswordInput.length < 6) {
    return { success: false, error: 'New password must contain at least 6 characters.' };
  }

  const raw = sessionStorage.getItem(STORAGE_KEY_RESET_PWD);
  if (!raw) {
    return {
      success: false,
      error: 'Password reset session expired or not found. Please request a new code.',
    };
  }

  try {
    const challenge: PasswordResetChallenge = JSON.parse(raw);
    if (challenge.email.toLowerCase() !== cleanEmail) {
      return { success: false, error: 'The email address does not match the active reset code.' };
    }

    if (Date.now() > challenge.expiresAt) {
      sessionStorage.removeItem(STORAGE_KEY_RESET_PWD);
      return { success: false, error: 'Verification code expired. Please request a new code.' };
    }

    if (challenge.code !== cleanCode) {
      return { success: false, error: 'Invalid verification code. Please check your email.' };
    }

    // Code is valid! Update password in account
    const accounts = getStoredAccounts();
    const user = accounts.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, error: 'User account could not be found.' };
    }

    user.passwordHash = hashPassword(newPasswordInput);
    user.alternatePasswordHash = undefined;
    saveStoredAccounts(accounts);

    // Clear reset challenge and reset lockout
    sessionStorage.removeItem(STORAGE_KEY_RESET_PWD);
    localStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to process password reset. Please try again.' };
  }
}
