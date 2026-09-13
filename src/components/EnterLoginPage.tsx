import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  HelpCircle,
  Clock,
  Building2,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Inbox,
  ShieldAlert,
  Compass,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { AHPLogo, AHPCasteloIcon } from './AHPLogo';
import {
  initiateTwoFactorLogin,
  verifyTwoFactorCode,
  resendTwoFactorCode,
  getFailedAttemptsInfo,
  requestPasswordResetCode,
  completePasswordReset,
  getStoredAccounts,
  LoginResult,
} from '../utils/auth';
import { AuthSession } from '../types';

interface EnterLoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

type ViewMode = 'login_credentials' | 'login_2fa' | 'reset_request' | 'reset_verify' | 'reset_success';

export const EnterLoginPage: React.FC<EnterLoginPageProps> = ({ onLoginSuccess }) => {
  // Navigation / Mode state
  const [viewMode, setViewMode] = useState<ViewMode>('login_credentials');

  // Credentials State
  const [email, setEmail] = useState('portal.ahp@gmail.com');
  const [password, setPassword] = useState('AHP@Logistica2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [loginSuccessFlash, setLoginSuccessFlash] = useState(false);

  // 2FA State
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [simulatedEmailCode, setSimulatedEmailCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Password Reset State
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSimulatedCode, setResetSimulatedCode] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Check lockout on mount and tick countdown
  useEffect(() => {
    const checkLock = () => {
      const info = getFailedAttemptsInfo();
      if (info.lockedUntil > Date.now()) {
        setLockoutSeconds(Math.ceil((info.lockedUntil - Date.now()) / 1000));
      } else {
        setLockoutSeconds(0);
      }
    };
    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2FA resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (viewMode === 'login_2fa' && resendCooldown > 0) {
      setCanResend(false);
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else if (resendCooldown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [viewMode, resendCooldown]);

  // Focus code input when entering 2FA step
  useEffect(() => {
    if (viewMode === 'login_2fa') {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    }
  }, [viewMode]);

  // -------------------------------------------------------------
  // LOGIN FLOW HANDLERS
  // -------------------------------------------------------------
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const result: LoginResult = initiateTwoFactorLogin(email, password, rememberMe);
      setIsLoading(false);

      if (result.success && result.requires2FA) {
        setTwoFactorEmail(result.twoFactorEmail || email);
        setSimulatedEmailCode(result.simulatedCode || null);
        setResendCooldown(30);
        setViewMode('login_2fa');
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
        if (result.remainingSeconds) {
          setLockoutSeconds(result.remainingSeconds);
        }
      }
    }, 400);
  };

  const handleVerify2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.length < 6) return;

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const result = verifyTwoFactorCode(twoFactorEmail, twoFactorCode);
      setIsLoading(false);

      if (result.success && result.session) {
        setLoginSuccessFlash(true);
        setTimeout(() => {
          onLoginSuccess(result.session!);
        }, 500);
      } else {
        setErrorMessage(result.error || 'Invalid 6-digit verification code.');
      }
    }, 350);
  };

  const handleResend2FACode = () => {
    if (!canResend) return;
    const res = resendTwoFactorCode(twoFactorEmail);
    if (res.success && res.simulatedCode) {
      setSimulatedEmailCode(res.simulatedCode);
      setResendCooldown(30);
      setErrorMessage(null);
    } else {
      setErrorMessage(res.error || 'Failed to resend code.');
    }
  };

  // -------------------------------------------------------------
  // PASSWORD RESET HANDLERS
  // -------------------------------------------------------------
  const handleOpenResetPassword = () => {
    setResetEmail(email || 'portal.ahp@gmail.com');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetSimulatedCode(null);
    setErrorMessage(null);
    setViewMode('reset_request');
  };

  const handleRequestResetCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const result = requestPasswordResetCode(resetEmail);
      setIsLoading(false);

      if (result.success) {
        setResetSimulatedCode(result.simulatedCode || null);
        setViewMode('reset_verify');
      } else {
        setErrorMessage(result.error || 'Could not initiate password reset.');
      }
    }, 450);
  };

  const handleCompleteResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (resetCode.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = completePasswordReset(resetEmail, resetCode, newPassword);
      setIsLoading(false);

      if (res.success) {
        setResetSuccessMessage('Your password has been successfully reset! You can now sign in.');
        setViewMode('reset_success');
        // Pre-fill login credentials with updated password
        setEmail(resetEmail);
        setPassword(newPassword);
      } else {
        setErrorMessage(res.error || 'Failed to reset password.');
      }
    }, 450);
  };

  const handleFillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-200 selection:text-black font-sans flex flex-col justify-between overflow-x-hidden relative">
      {/* Subtle Background Silk / Wave Graphics (Monochrome Luxury Aesthetic) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-0">
        <svg
          className="absolute w-[180%] h-[140%] -left-[40%] -top-[20%] text-neutral-800/40 transform -rotate-12"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-200 450 C 300 200, 700 700, 1200 350 C 1450 180, 1650 300, 1900 250"
            stroke="url(#gradient-smoke-1)"
            strokeWidth="120"
            strokeLinecap="round"
            className="blur-2xl"
          />
          <path
            d="M-100 550 C 400 300, 800 800, 1300 450 C 1550 280, 1750 400, 2000 350"
            stroke="url(#gradient-smoke-2)"
            strokeWidth="60"
            strokeLinecap="round"
            className="blur-xl"
          />
          <defs>
            <linearGradient id="gradient-smoke-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#888888" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#111111" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient-smoke-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#555555" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#050505" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Editorial Minimalist Header (Matching reference: LA LOST ARTISTS style) */}
      <header className="relative z-20 w-full px-6 sm:px-12 py-7 flex items-center justify-between border-b border-white/10 backdrop-blur-xs">
        {/* Brand Logo & Monogram */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 border border-white/30 flex items-center justify-center bg-black/60 p-1.5 shadow-2xs">
            <AHPCasteloIcon className="w-full h-full text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif tracking-[0.25em] text-sm uppercase font-semibold text-white">
                AHP
              </span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-light border-l border-white/20 pl-2">
                Logistics
              </span>
            </div>
            <p className="text-[9px] tracking-[0.2em] uppercase text-neutral-400 font-light">
              Aldeias Históricas de Portugal
            </p>
          </div>
        </div>

        {/* Desktop Minimalist Nav Links (Tracked uppercase matching reference image) */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] tracking-[0.22em] uppercase font-light text-neutral-300">
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('login_credentials');
            }}
            className="hover:text-white transition-colors"
          >
            Portal Access
          </a>
          <a
            href="#villages"
            onClick={(e) => {
              e.preventDefault();
              setIsHelpOpen(true);
            }}
            className="hover:text-white transition-colors"
          >
            12 Villages Network
          </a>
          <a
            href="#security"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('login_credentials');
            }}
            className="hover:text-white transition-colors"
          >
            2FA Security
          </a>
          <button
            type="button"
            onClick={handleOpenResetPassword}
            className={`cursor-pointer transition-colors ${
              viewMode.startsWith('reset') ? 'text-white border-b border-white pb-0.5' : 'hover:text-white'
            }`}
          >
            Reset Password
          </button>
        </nav>

        {/* Header Action / Indicator */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenResetPassword}
            className="md:hidden text-[10px] tracking-[0.18em] uppercase text-neutral-300 hover:text-white border border-white/20 px-2.5 py-1"
          >
            Reset
          </button>
          <div className="hidden sm:flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-neutral-400 border border-white/10 px-3 py-1 bg-black/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Secure 2FA Active</span>
          </div>
        </div>
      </header>

      {/* Main Content Area (Editorial Hero Layout matching reference) */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 sm:px-12 py-12 lg:py-20 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* LEFT COLUMN: Large High-Art Typography (Inspired by "7 DAY TRANSFORMATIVE JOURNEY") */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/15 bg-white/5 text-[10px] tracking-[0.25em] uppercase text-neutral-300 font-light">
              <span>Official Institutional Network</span>
              <span className="text-white">&bull;</span>
              <span>12 Historical Villages</span>
            </div>

            <h1
              className="font-serif text-3xl sm:text-5xl lg:text-[3.75rem] font-light tracking-tight text-white leading-[1.12]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              PROMOTIONAL <br />
              <span className="italic font-normal text-neutral-200">MATERIALS</span> &amp; STOCK
              <br />
              <span className="text-neutral-400 font-serif font-light text-2xl sm:text-4xl lg:text-[2.75rem]">
                ACROSS PORTUGAL
              </span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-400 font-light max-w-xl leading-relaxed tracking-wide">
              Centralized warehouse supply chain, real-time tourism office depletion ledger,
              and paperless QR delivery verification across all twelve historical village posts.
            </p>

            {/* Quick Feature Pills */}
            <div className="pt-2 flex flex-wrap gap-4 text-xs tracking-widest uppercase font-light text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-white rounded-full" />
                <span>Two-Factor Auth</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-white rounded-full" />
                <span>Permanent QR Slips</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-white rounded-full" />
                <span>Direct Excel Sync</span>
              </div>
            </div>

            {/* Minimalist Action / Apply Now style button if in reset mode */}
            {viewMode !== 'login_credentials' && (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login_credentials');
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-3 border border-white/40 hover:border-white text-white px-7 py-3 text-xs tracking-[0.2em] uppercase font-light hover:bg-white hover:text-black transition-all cursor-pointer shadow-lg"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Minimalist Editorial Card (Sign In / 2FA / Password Reset) */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto lg:ml-auto">
            <div className="relative bg-black/85 border border-white/20 p-8 sm:p-10 shadow-2xl backdrop-blur-md">
              {/* Corner framing accents for fine-art luxury look */}
              <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
              <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white" />

              {/* MODE 1: CREDENTIALS SIGN-IN */}
              {viewMode === 'login_credentials' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-1">
                      Authentication &bull; Step 1 of 2
                    </span>
                    <h2
                      className="text-2xl sm:text-3xl font-serif font-light text-white tracking-wide"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      Sign In to <span className="italic">Workstation</span>
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1 font-light">
                      Enter authorized operator email and password.
                    </p>
                  </div>

                  {/* Lockout Warning */}
                  {lockoutSeconds > 0 && (
                    <div className="p-3 border border-red-500/60 bg-red-950/40 text-red-200 text-xs flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Terminal Temporarily Locked</p>
                        <p className="text-[11px] text-red-300 mt-0.5">
                          Too many failed attempts. Unlock in {lockoutSeconds} seconds.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Alert */}
                  {errorMessage && (
                    <div className="p-3 border border-red-500/60 bg-red-950/40 text-red-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-200 leading-relaxed text-xs">{errorMessage}</p>
                    </div>
                  )}

                  <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    {/* Email Input */}
                    <div>
                      <label className="block text-[11px] tracking-[0.15em] uppercase text-neutral-300 font-light mb-1.5">
                        Institutional Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="portal.ahp@gmail.com"
                          className="w-full px-3.5 py-2.5 bg-neutral-950/90 border border-white/20 text-white text-xs font-mono placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] tracking-[0.15em] uppercase text-neutral-300 font-light">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={handleOpenResetPassword}
                          className="text-[10px] tracking-wider uppercase text-neutral-400 hover:text-white underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full px-3.5 py-2.5 bg-neutral-950/90 border border-white/20 text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-white transition-colors pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400 font-light">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded-none bg-black border border-white/30 text-white focus:ring-0"
                        />
                        <span>Stay authenticated for 30 days</span>
                      </label>
                    </div>

                    {/* Submit CTA Button (Designed like APPLY NOW in reference) */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading || lockoutSeconds > 0}
                        className="w-full border border-white/50 hover:border-white text-white hover:bg-white hover:text-black py-3 px-6 text-xs tracking-[0.2em] uppercase font-light transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Verifying Credentials...</span>
                          </>
                        ) : (
                          <>
                            <span>Continue to 2FA</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Reset Password Option Footnote */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400 font-light">
                    <span>Need new credentials?</span>
                    <button
                      type="button"
                      onClick={handleOpenResetPassword}
                      className="text-white hover:underline flex items-center gap-1 cursor-pointer font-normal"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: TWO-FACTOR AUTHENTICATION (2FA) */}
              {viewMode === 'login_2fa' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <span className="text-[10px] tracking-[0.25em] uppercase text-emerald-400 font-light block mb-1">
                      Security &bull; Step 2 of 2
                    </span>
                    <h2
                      className="text-2xl sm:text-3xl font-serif font-light text-white tracking-wide"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      Enter <span className="italic">2FA Security Code</span>
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1 font-light">
                      A 6-digit code has been sent to your institutional email:
                    </p>
                    <p className="text-xs font-mono text-white mt-1">{twoFactorEmail}</p>
                  </div>

                  {/* Demo Helper Notification */}
                  {simulatedEmailCode && (
                    <div className="p-3 border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Inbox className="w-3.5 h-3.5" />
                          <span>Simulated Email Inbox:</span>
                        </span>
                        <span className="font-mono text-sm tracking-widest font-bold text-white bg-black/60 px-2 py-0.5 border border-emerald-500/40">
                          {simulatedEmailCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTwoFactorCode(simulatedEmailCode)}
                        className="w-full py-1 text-[11px] tracking-wider uppercase bg-emerald-700 hover:bg-emerald-600 text-white font-medium cursor-pointer transition-colors"
                      >
                        Auto-Fill Code ({simulatedEmailCode})
                      </button>
                    </div>
                  )}

                  {/* Error Alert */}
                  {errorMessage && (
                    <div className="p-3 border border-red-500/60 bg-red-950/40 text-red-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-200 leading-relaxed text-xs">{errorMessage}</p>
                    </div>
                  )}

                  <form onSubmit={handleVerify2FASubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] tracking-[0.15em] uppercase text-neutral-300 font-light mb-1.5 text-center">
                        6-Digit Security Code
                      </label>
                      <input
                        ref={codeInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full py-3 px-4 bg-neutral-950 border border-white/30 text-center text-3xl font-mono tracking-[0.4em] font-bold text-emerald-400 placeholder-neutral-700 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={twoFactorCode.length < 6 || isLoading}
                      className="w-full border border-white/50 hover:border-white text-white hover:bg-white hover:text-black py-3 px-6 text-xs tracking-[0.2em] uppercase font-light transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Validating Code...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify &amp; Enter Portal</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-2 text-[11px] text-neutral-400 font-light">
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('login_credentials');
                          setErrorMessage(null);
                        }}
                        className="hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResend2FACode}
                        disabled={!canResend}
                        className={`flex items-center gap-1 cursor-pointer ${
                          canResend ? 'text-white hover:underline' : 'text-neutral-600 cursor-not-allowed'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{canResend ? 'Resend Code' : `Resend in ${resendCooldown}s`}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MODE 3: RESET PASSWORD - STEP 1 (REQUEST CODE) */}
              {viewMode === 'reset_request' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-1">
                      Account Recovery &bull; Step 1 of 2
                    </span>
                    <h2
                      className="text-2xl sm:text-3xl font-serif font-light text-white tracking-wide"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      Reset Your <span className="italic">Password</span>
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1 font-light leading-relaxed">
                      Enter the institutional email address linked to your account. A 6-digit verification code will be dispatched to authorize the reset.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 border border-red-500/60 bg-red-950/40 text-red-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-200 leading-relaxed text-xs">{errorMessage}</p>
                    </div>
                  )}

                  <form onSubmit={handleRequestResetCodeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] tracking-[0.15em] uppercase text-neutral-300 font-light mb-1.5">
                        Registered Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="portal.ahp@gmail.com"
                        className="w-full px-3.5 py-2.5 bg-neutral-950/90 border border-white/20 text-white text-xs font-mono placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading || !resetEmail}
                        className="w-full border border-white/50 hover:border-white text-white hover:bg-white hover:text-black py-3 px-6 text-xs tracking-[0.2em] uppercase font-light transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Sending Verification Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Request Reset Code</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('login_credentials');
                          setErrorMessage(null);
                        }}
                        className="text-[11px] text-neutral-400 hover:text-white tracking-wider uppercase font-light flex items-center justify-center gap-1 mx-auto cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Return to Sign In</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MODE 4: RESET PASSWORD - STEP 2 (VERIFY CODE & SET NEW PASSWORD) */}
              {viewMode === 'reset_verify' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <span className="text-[10px] tracking-[0.25em] uppercase text-emerald-400 font-light block mb-1">
                      Account Recovery &bull; Step 2 of 2
                    </span>
                    <h2
                      className="text-2xl sm:text-3xl font-serif font-light text-white tracking-wide"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      Set New <span className="italic">Password</span>
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1 font-light">
                      Verification code sent to <span className="text-white font-mono">{resetEmail}</span>
                    </p>
                  </div>

                  {/* Simulated Code Helper for Testing */}
                  {resetSimulatedCode && (
                    <div className="p-3 border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Inbox className="w-3.5 h-3.5" />
                          <span>Verification Email Preview:</span>
                        </span>
                        <span className="font-mono text-sm tracking-widest font-bold text-white bg-black/60 px-2 py-0.5 border border-emerald-500/40">
                          {resetSimulatedCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResetCode(resetSimulatedCode)}
                        className="w-full py-1 text-[11px] tracking-wider uppercase bg-emerald-700 hover:bg-emerald-600 text-white font-medium cursor-pointer transition-colors"
                      >
                        Auto-Fill Code ({resetSimulatedCode})
                      </button>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 border border-red-500/60 bg-red-950/40 text-red-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-200 leading-relaxed text-xs">{errorMessage}</p>
                    </div>
                  )}

                  <form onSubmit={handleCompleteResetSubmit} className="space-y-4">
                    {/* Verification Code */}
                    <div>
                      <label className="block text-[11px] tracking-[0.15em] uppercase text-neutral-300 font-light mb-1.5">
                        6-Digit Reset Code *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/30 text-emerald-400 font-mono text-base tracking-[0.25em] text-center focus:outline-none focus:border-white"
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-[11px] tracking-[0.15em] uppercase text-neutral-300 font-light mb-1.5">
                        New Password (Min 6 Characters) *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/20 text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[11px] tracking-[0.15em] uppercase text-neutral-300 font-light mb-1.5">
                        Confirm New Password *
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/20 text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-white"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading || resetCode.length < 6 || !newPassword}
                        className="w-full border border-white/50 hover:border-white text-white hover:bg-white hover:text-black py-3 px-6 text-xs tracking-[0.2em] uppercase font-light transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Updating Credentials...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Save New Password</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-400">
                      <button
                        type="button"
                        onClick={() => setViewMode('reset_request')}
                        className="hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Change Email</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewMode('login_credentials')}
                        className="hover:text-white cursor-pointer"
                      >
                        Cancel &amp; Sign In
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MODE 5: RESET SUCCESS CONFIRMATION */}
              {viewMode === 'reset_success' && (
                <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 border border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div>
                    <h2
                      className="text-2xl font-serif font-light text-white tracking-wide"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      Password <span className="italic">Reset Successful</span>
                    </h2>
                    <p className="text-xs text-neutral-400 mt-2 font-light leading-relaxed">
                      {resetSuccessMessage || 'Your account credentials have been securely updated.'}
                    </p>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('login_credentials');
                        setErrorMessage(null);
                      }}
                      className="w-full border border-white hover:bg-white hover:text-black text-white py-3 px-6 text-xs tracking-[0.2em] uppercase font-light transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Credentials Assistant Dropdown (Discreet & Collapsible) */}
            <div className="mt-4 text-xs font-light">
              <div className="flex items-center justify-between text-neutral-400 text-[11px] tracking-wider uppercase">
                <span>Authorized Operators</span>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(!isHelpOpen)}
                  className="text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>{isHelpOpen ? 'Hide' : 'Quick Demo Logins'}</span>
                </button>
              </div>

              {isHelpOpen && (
                <div className="mt-2 space-y-1.5 bg-neutral-950 border border-white/15 p-3 text-[11px] animate-in fade-in">
                  <div
                    onClick={() => handleFillCredentials('portal.ahp@gmail.com', 'AHP@Logistica2026!')}
                    className="p-2 border border-white/10 hover:border-white/30 flex items-center justify-between cursor-pointer transition-colors bg-black/40"
                  >
                    <div>
                      <span className="font-semibold text-white block">AHP Administrator</span>
                      <span className="text-neutral-400 font-mono text-[10px]">portal.ahp@gmail.com</span>
                    </div>
                    <span className="text-[10px] border border-white/20 px-1.5 py-0.5 text-neutral-300">
                      Auto-Fill
                    </span>
                  </div>

                  <div
                    onClick={() => handleFillCredentials('logistica@ahp.pt', 'AHP@Logistica2026!')}
                    className="p-2 border border-white/10 hover:border-white/30 flex items-center justify-between cursor-pointer transition-colors bg-black/40"
                  >
                    <div>
                      <span className="font-semibold text-white block">Logistics Coordinator</span>
                      <span className="text-neutral-400 font-mono text-[10px]">logistica@ahp.pt</span>
                    </div>
                    <span className="text-[10px] border border-white/20 px-1.5 py-0.5 text-neutral-300">
                      Auto-Fill
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Atmospheric Monochromatic Historical Landscape Section (Matching the reference Capri landscape) */}
      <section className="relative z-10 border-t border-white/15 bg-neutral-950/80 pt-10 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-light block mb-1">
                Monochromatic Archival Collection
              </span>
              <h3
                className="text-2xl sm:text-3xl font-serif font-light text-white tracking-wide"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                12 Medieval Strongholds <span className="italic">&amp; Granite Fortresses</span>
              </h3>
            </div>
            <p className="text-xs text-neutral-400 max-w-md font-light leading-relaxed">
              Historical villages preserved in granite and schist. Connected through an integrated promotional distribution network.
            </p>
          </div>

          {/* Archival Monochromatic Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Image 1: Monsanto Granite Boulder Fortress */}
            <div className="group relative aspect-4/3 overflow-hidden border border-white/15 bg-black">
              <img
                src="https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=800&auto=format&fit=crop"
                alt="Monsanto Stone Fortress"
                className="w-full h-full object-cover grayscale contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <span className="text-[9px] tracking-[0.2em] uppercase text-neutral-400 block font-light">
                  Beira Baixa
                </span>
                <p className="text-xs font-serif font-medium text-white">Monsanto</p>
              </div>
            </div>

            {/* Image 2: Sortelha Medieval Wall */}
            <div className="group relative aspect-4/3 overflow-hidden border border-white/15 bg-black">
              <img
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop"
                alt="Sortelha Castle Ramparts"
                className="w-full h-full object-cover grayscale contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <span className="text-[9px] tracking-[0.2em] uppercase text-neutral-400 block font-light">
                  Sabugal
                </span>
                <p className="text-xs font-serif font-medium text-white">Sortelha</p>
              </div>
            </div>

            {/* Image 3: Marialva Ancient Ruins */}
            <div className="group relative aspect-4/3 overflow-hidden border border-white/15 bg-black">
              <img
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop"
                alt="Marialva Citadel"
                className="w-full h-full object-cover grayscale contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <span className="text-[9px] tracking-[0.2em] uppercase text-neutral-400 block font-light">
                  Mêda
                </span>
                <p className="text-xs font-serif font-medium text-white">Marialva</p>
              </div>
            </div>

            {/* Image 4: Almeida Vauban Star Fort */}
            <div className="group relative aspect-4/3 overflow-hidden border border-white/15 bg-black">
              <img
                src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop"
                alt="Almeida Vauban Fortress"
                className="w-full h-full object-cover grayscale contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <span className="text-[9px] tracking-[0.2em] uppercase text-neutral-400 block font-light">
                  Beira Alta
                </span>
                <p className="text-xs font-serif font-medium text-white">Almeida</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Minimalist Footer */}
      <footer className="relative z-10 w-full px-6 sm:px-12 py-8 border-t border-white/10 bg-black text-[11px] text-neutral-400 font-light flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AHPCasteloIcon className="w-4 h-4 text-white" />
          <span className="tracking-wider uppercase text-neutral-300">
            Associação de Desenvolvimento Turístico Aldeias Históricas de Portugal
          </span>
        </div>

        <div className="flex items-center gap-6 tracking-widest uppercase text-[10px]">
          <span>Centro 2030</span>
          <span>Portugal 2030</span>
          <span>União Europeia</span>
          <span className="text-neutral-300">&copy; 2026 AHP</span>
        </div>
      </footer>
    </div>
  );
};
