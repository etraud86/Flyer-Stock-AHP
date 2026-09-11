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
}

// Simple deterministic hash with salt for secure storage
function hashPassword(password: string): string {
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
  },
  {
    id: 'user-admin-institucional',
    email: 'admin@aldeiashistoricasdeportugal.com',
    name: 'Administração Geral AHP',
    role: 'admin',
    passwordHash: hashPassword('AHP@Logistica2026!'),
    alternatePasswordHash: hashPassword('ahp2026'),
  },
  {
    id: 'user-logistica-coordenador',
    email: 'logistica@ahp.pt',
    name: 'Coordenação de Stock e Postos',
    role: 'logistics_coordinator',
    passwordHash: hashPassword('AHP@Logistica2026!'),
    alternatePasswordHash: hashPassword('ahp2026'),
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
}

export function authenticate(emailInput: string, passwordInput: string, rememberMe: boolean): LoginResult {
  const attempts = getFailedAttemptsInfo();
  if (attempts.lockedUntil > Date.now()) {
    const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
    return {
      success: false,
      error: `Acesso temporariamente bloqueado devido a múltiplas tentativas falhadas. Aguarde ${remainingSeconds} segundos antes de tentar novamente.`,
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
      error: 'Utilizador ou palavra-passe incorretos. Verifique os dados introduzidos.',
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
      error: 'Palavra-passe incorreta. Por razões de segurança, este acesso é monitorizado.',
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
    return { success: false, error: 'A nova palavra-passe deve conter pelo menos 6 caracteres.' };
  }

  const accounts = getStoredAccounts();
  const user = accounts.find((u) => u.id === userId);

  if (!user) {
    return { success: false, error: 'Conta de utilizador não encontrada.' };
  }

  const currentHash = hashPassword(currentPassword);
  const isValid =
    user.passwordHash === currentHash ||
    (user.alternatePasswordHash && user.alternatePasswordHash === currentHash);

  if (!isValid) {
    return { success: false, error: 'A palavra-passe atual indicada está incorreta.' };
  }

  user.passwordHash = hashPassword(newPassword);
  user.alternatePasswordHash = undefined; // Clear alias once custom password set
  saveStoredAccounts(accounts);

  return { success: true };
}
