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
  Key,
} from 'lucide-react';
import { AHPLogo, AHPCasteloIcon } from './AHPLogo';
import {
  initiateTwoFactorLogin,
  verifyTwoFactorCode,
  resendTwoFactorCode,
  getFailedAttemptsInfo,
  requestPasswordResetCode,
  completePasswordReset,
  LoginResult,
} from '../utils/auth';
import { AuthSession } from '../types';

interface EnterLoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

type LoginStep = 'credentials' | 'two_factor' | 'reset_request' | 'reset_verify' | 'reset_success';

export const EnterLoginPage: React.FC<EnterLoginPageProps> = ({ onLoginSuccess }) => {
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');

  // Credentials
  const [email, setEmail] = useState('portal.ahp@gmail.com');
  const [password, setPassword] = useState('AHP@Logistica2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [loginSuccessFlash, setLoginSuccessFlash] = useState(false);

  // 2FA state
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [simulatedEmailCode, setSimulatedEmailCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Password Reset state
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
    if (loginStep === 'two_factor' && resendCooldown > 0) {
      setCanResend(false);
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else if (resendCooldown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [loginStep, resendCooldown]);

  // Focus code input when entering 2FA step
  useEffect(() => {
    if (loginStep === 'two_factor') {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    }
  }, [loginStep]);

  // Handle Step 1: Submit Credentials & Initiate 2FA
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
        setLoginStep('two_factor');
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
        if (result.remainingSeconds) {
          setLockoutSeconds(result.remainingSeconds);
        }
      }
    }, 400);
  };

  // Handle Step 2: Verify 6-Digit 2FA Code
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

  // Resend 2FA code
  const handleResend2FACode = () => {
    if (!canResend) return;
    const res = resendTwoFactorCode(twoFactorEmail);
    if (res.success && res.simulatedCode) {
      setSimulatedEmailCode(res.simulatedCode);
      setResendCooldown(30);
      setErrorMessage(null);
    } else {
      setErrorMessage(res.error || 'Failed to resend verification code.');
    }
  };

  // -------------------------------------------------------------
  // RESET PASSWORD FLOW
  // -------------------------------------------------------------
  const handleOpenResetPassword = () => {
    setResetEmail(email || 'portal.ahp@gmail.com');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetSimulatedCode(null);
    setErrorMessage(null);
    setLoginStep('reset_request');
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
        setLoginStep('reset_verify');
      } else {
        setErrorMessage(result.error || 'Could not initiate password reset.');
      }
    }, 400);
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
        setResetSuccessMessage('Your password has been successfully reset! You can now log in.');
        setLoginStep('reset_success');
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      {/* Top Simple Header */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-xs">
            <AHPCasteloIcon className="w-full h-full text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">
                Aldeias Históricas de Portugal
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                Official Logistics
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Flyer Stock &amp; Regional Tourism Offices Supply Chain
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>2-Factor Security Active</span>
          </div>
        </div>
      </header>

      {/* Main Login / 2FA / Password Reset Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Card Frame */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all">
            {/* Institution Badge */}
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-700/80 flex items-center justify-center p-2.5 shadow-inner">
                <AHPCasteloIcon className="w-full h-full text-emerald-400" />
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* VIEW 1: CREDENTIALS LOGIN FORM */}
            {/* ------------------------------------------------------------- */}
            {loginStep === 'credentials' && (
              <div className="space-y-5">
                <div className="text-center">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Workstation Sign-In
                  </h1>
                  <p className="text-xs text-neutral-400 mt-1">
                    Enter authorized operator credentials to access stock logistics.
                  </p>
                </div>

                {/* Lockout Warning Alert */}
                {lockoutSeconds > 0 && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                    <Clock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-300">Terminal Temporarily Locked</p>
                      <p className="text-red-200 text-[11px] mt-0.5 leading-relaxed">
                        Multiple failed attempts. For safety, please wait {lockoutSeconds} seconds before re-trying.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Alert */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-200 leading-relaxed">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Institutional Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        disabled={lockoutSeconds > 0 || isLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="portal.ahp@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-700/80 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-neutral-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleOpenResetPassword}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={lockoutSeconds > 0 || isLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-neutral-950 border border-neutral-700/80 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded-sm bg-neutral-950 border-neutral-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Keep signed in for 30 days</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || lockoutSeconds > 0}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] font-semibold text-sm text-white shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to 2FA</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Reset Password Footer Link */}
                <div className="pt-3 border-t border-neutral-800 text-center text-xs text-neutral-400">
                  <span>Need to reset or update credentials? </span>
                  <button
                    type="button"
                    onClick={handleOpenResetPassword}
                    className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Reset Password</span>
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 2: TWO-FACTOR AUTHENTICATION (2FA) STEP */}
            {/* ------------------------------------------------------------- */}
            {loginStep === 'two_factor' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[11px] font-semibold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Two-Factor Authentication</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Enter Verification Code
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    A 6-digit verification code has been dispatched to:
                  </p>
                  <p className="text-xs font-mono font-medium text-emerald-400 mt-0.5">
                    {twoFactorEmail}
                  </p>
                </div>

                {/* Simulated Email Helper Box */}
                {simulatedEmailCode && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Inbox className="w-4 h-4 text-emerald-400" />
                        <span>Simulated Email Inbox:</span>
                      </span>
                      <span className="font-mono text-sm tracking-widest font-bold text-white bg-neutral-900/90 px-2 py-0.5 rounded border border-emerald-500/40">
                        {simulatedEmailCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTwoFactorCode(simulatedEmailCode)}
                      className="w-full py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Auto-Fill Code ({simulatedEmailCode})</span>
                    </button>
                  </div>
                )}

                {/* Error Alert */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-200 leading-relaxed">{errorMessage}</p>
                  </div>
                )}

                {/* 2FA Input Form */}
                <form onSubmit={handleVerify2FASubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5 text-center">
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
                      className="w-full py-3 px-4 bg-neutral-950 border border-neutral-700 rounded-xl text-center text-2xl sm:text-3xl font-mono tracking-[0.4em] font-bold text-emerald-400 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    />
                    <p className="text-[11px] text-neutral-400 text-center mt-1.5">
                      Valid for 10 minutes &bull; Numeric code only
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={twoFactorCode.length < 6 || isLoading}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      twoFactorCode.length < 6 || isLoading
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] shadow-emerald-950/50'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Validating Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify &amp; Enter Portal</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('credentials');
                        setErrorMessage(null);
                      }}
                      className="text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Login</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResend2FACode}
                      disabled={!canResend}
                      className={`flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                        canResend
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : 'text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{canResend ? 'Resend Code' : `Resend in ${resendCooldown}s`}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 3: RESET PASSWORD - STEP 1 (REQUEST CODE) */}
            {/* ------------------------------------------------------------- */}
            {loginStep === 'reset_request' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-700/50 text-[11px] font-semibold mb-2">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Password Reset</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Reset Account Password
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Enter the registered institutional email to receive an authorization code.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-200 leading-relaxed">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleRequestResetCodeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Institutional Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="portal.ahp@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !resetEmail}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] font-semibold text-sm text-white shadow-lg shadow-blue-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Security Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Request Reset Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('credentials');
                        setErrorMessage(null);
                      }}
                      className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign-In</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 4: RESET PASSWORD - STEP 2 (ENTER CODE & SET NEW PASSWORD) */}
            {/* ------------------------------------------------------------- */}
            {loginStep === 'reset_verify' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[11px] font-semibold mb-2">
                    <Key className="w-3.5 h-3.5" />
                    <span>Set New Password</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Verify Code &amp; Update
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Code sent to <span className="text-emerald-400 font-mono">{resetEmail}</span>
                  </p>
                </div>

                {/* Simulated Reset Code Preview Helper */}
                {resetSimulatedCode && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Inbox className="w-4 h-4 text-emerald-400" />
                        <span>Verification Email:</span>
                      </span>
                      <span className="font-mono text-sm tracking-widest font-bold text-white bg-neutral-900/90 px-2 py-0.5 rounded border border-emerald-500/40">
                        {resetSimulatedCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetCode(resetSimulatedCode)}
                      className="w-full py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Auto-Fill Code ({resetSimulatedCode})</span>
                    </button>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-200 leading-relaxed">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleCompleteResetSubmit} className="space-y-4">
                  {/* 6-Digit Code */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      6-Digit Reset Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full py-2.5 px-3 bg-neutral-950 border border-neutral-700 rounded-xl text-center text-xl font-mono tracking-widest text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      New Password (min. 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || resetCode.length < 6 || !newPassword}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] font-semibold text-sm text-white shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Save New Password</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs text-neutral-400">
                    <button
                      type="button"
                      onClick={() => setLoginStep('reset_request')}
                      className="hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginStep('credentials')}
                      className="hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 5: RESET SUCCESS CONFIRMATION */}
            {/* ------------------------------------------------------------- */}
            {loginStep === 'reset_success' && (
              <div className="space-y-5 text-center animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Password Reset Complete
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {resetSuccessMessage || 'Your account credentials have been updated successfully.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoginStep('credentials');
                    setErrorMessage(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Demo Credentials Assistant */}
            {loginStep === 'credentials' && (
              <div className="mt-6 pt-5 border-t border-neutral-800 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-400 font-medium">Quick Authorized Sign-In:</span>
                  <button
                    type="button"
                    onClick={() => setIsHelpOpen(!isHelpOpen)}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{isHelpOpen ? 'Hide' : 'Show Accounts'}</span>
                  </button>
                </div>

                {isHelpOpen && (
                  <div className="space-y-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-[11px] animate-in fade-in">
                    <div
                      onClick={() => handleFillCredentials('portal.ahp@gmail.com', 'AHP@Logistica2026!')}
                      className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-bold text-white block">AHP Administrator</span>
                        <span className="text-neutral-400 font-mono text-[10px]">portal.ahp@gmail.com</span>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
                        Auto-Fill
                      </span>
                    </div>

                    <div
                      onClick={() => handleFillCredentials('logistica@ahp.pt', 'AHP@Logistica2026!')}
                      className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-bold text-white block">Logistics Coordinator</span>
                        <span className="text-neutral-400 font-mono text-[10px]">logistica@ahp.pt</span>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
                        Auto-Fill
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-neutral-800/80 bg-neutral-900/60 text-xs text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AHPCasteloIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Associação de Desenvolvimento Turístico Aldeias Históricas de Portugal</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Centro 2030</span>
          <span>Portugal 2030</span>
          <span>União Europeia</span>
          <span className="text-neutral-300">&copy; 2026 AHP</span>
        </div>
      </footer>
    </div>
  );
};
