import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Key,
} from 'lucide-react';
import { AHPCasteloIcon } from './AHPLogo';
import { InstitutionalCoFinancingLogos } from './InstitutionalCoFinancingLogos';
import {
  loginUser,
  directResetPassword,
  getFailedAttemptsInfo,
} from '../utils/auth';
import { AuthSession } from '../types';

interface EnterLoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

type LoginView = 'login' | 'reset_password' | 'reset_success';

export const EnterLoginPage: React.FC<EnterLoginPageProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<LoginView>('login');

  // Login form state - starts empty every time as requested by user
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
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

  // Direct Sign-In (no 2FA)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const result = loginUser(email, password, rememberMe);
      setIsLoading(false);

      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
        if (result.remainingSeconds) {
          setLockoutSeconds(result.remainingSeconds);
        }
      }
    }, 300);
  };

  // Direct Password Reset
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetEmail || !resetEmail.includes('@')) {
      setErrorMessage('Please enter a valid institutional email address.');
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
      const result = directResetPassword(resetEmail, newPassword);
      setIsLoading(false);

      if (result.success) {
        setResetSuccessMessage('Password reset successfully! You can now sign in with your new credentials.');
        setEmail(resetEmail);
        setPassword(newPassword);
        setView('reset_success');
      } else {
        setErrorMessage(result.error || 'Failed to reset password.');
      }
    }, 400);
  };

  const handleFillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      {/* Header */}
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

        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
          <span className="px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-medium">
            Central Management Platform
          </span>
        </div>
      </header>

      {/* Main Login / Reset Password Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Institution Badge */}
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-700/80 flex items-center justify-center p-2.5 shadow-inner">
                <AHPCasteloIcon className="w-full h-full text-emerald-400" />
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* VIEW 1: SIGN IN FORM */}
            {/* ------------------------------------------------------------- */}
            {view === 'login' && (
              <div className="space-y-5">
                <div className="text-center">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Workstation Sign-In
                  </h1>
                  <p className="text-xs text-neutral-400 mt-1">
                    Enter authorized operator credentials to access stock logistics.
                  </p>
                </div>

                {/* Lockout Alert */}
                {lockoutSeconds > 0 && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                    <Clock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-300">Terminal Temporarily Locked</p>
                      <p className="text-red-200 text-[11px] mt-0.5 leading-relaxed">
                        Multiple failed attempts. Please wait {lockoutSeconds} seconds before trying again.
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

                <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                        autoComplete="off"
                        autoFocus
                        disabled={lockoutSeconds > 0 || isLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email (e.g. portal.ahp@gmail.com)"
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
                        onClick={() => {
                          setResetEmail(email || 'portal.ahp@gmail.com');
                          setErrorMessage(null);
                          setView('reset_password');
                        }}
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

                  {/* Institutional Security Notice */}
                  <div className="text-[11px] text-neutral-500 pt-1 flex items-center justify-between">
                    <span>Credentials required on each session access</span>
                    <span className="font-mono text-neutral-400">AHP Security</span>
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
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Workstation</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Reset Password Footer Link */}
                <div className="pt-3 border-t border-neutral-800 text-center text-xs text-neutral-400">
                  <span>Need to reset or change your password? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email || 'portal.ahp@gmail.com');
                      setErrorMessage(null);
                      setView('reset_password');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Reset Password</span>
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 2: PASSWORD RESET FORM */}
            {/* ------------------------------------------------------------- */}
            {view === 'reset_password' && (
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
                    Enter your registered institutional email address and choose a new password.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-200 leading-relaxed">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleResetSubmit} className="space-y-4">
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
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      New Password (min. 6 characters)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-10 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                        <Key className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !resetEmail || newPassword.length < 6}
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

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setView('login');
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
            {/* VIEW 3: RESET SUCCESS CONFIRMATION */}
            {/* ------------------------------------------------------------- */}
            {view === 'reset_success' && (
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
                    setView('login');
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
            {view === 'login' && (
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

      {/* Footer with Centro 2030 and Provere logos */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-neutral-800/80 bg-neutral-900/60 text-xs text-neutral-400 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-center md:text-left">
          <AHPCasteloIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium text-neutral-300">
            Associação de Desenvolvimento Turístico Aldeias Históricas de Portugal
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <InstitutionalCoFinancingLogos showLabels={false} />
          <span className="text-neutral-400 text-[11px] font-mono">&copy; 2026 AHP</span>
        </div>
      </footer>
    </div>
  );
};
