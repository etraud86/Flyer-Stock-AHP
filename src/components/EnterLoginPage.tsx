import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AHPLogo, AHPCasteloIcon } from './AHPLogo';
import { authenticate, getFailedAttemptsInfo, LoginResult } from '../utils/auth';
import { AuthSession } from '../types';

interface EnterLoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const EnterLoginPage: React.FC<EnterLoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('portal.ahp@gmail.com');
  const [password, setPassword] = useState('AHP@Logistica2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [loginSuccessFlash, setLoginSuccessFlash] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMessage(null);
    setIsLoading(true);

    // Simulate authentic network handshake verification (300ms)
    setTimeout(() => {
      const result: LoginResult = authenticate(email, password, rememberMe);
      setIsLoading(false);

      if (result.success && result.session) {
        setLoginSuccessFlash(true);
        setTimeout(() => {
          onLoginSuccess(result.session!);
        }, 400);
      } else {
        setErrorMessage(result.error || 'Invalid credentials.');
        if (result.remainingSeconds && result.remainingSeconds > 0) {
          setLockoutSeconds(result.remainingSeconds);
        }
      }
    }, 350);
  };

  const handleFillCredentials = (userEmail: string, pass: string) => {
    setEmail(userEmail);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex flex-col justify-between relative overflow-hidden text-neutral-100 selection:bg-emerald-500 selection:text-white">
      {/* Background Architectural Castle Watermark */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none text-white select-none">
        <AHPCasteloIcon className="w-[750px] h-[750px]" />
      </div>

      {/* Subtle architectural background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(30,58,138,0.08),transparent_50%)] pointer-events-none" />

      {/* Top Bar with Security & Proprietary Notice */}
      <header className="relative z-10 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px] tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              SECURE SSL 256-BIT PORTAL
            </span>
            <span className="text-neutral-500 hidden sm:inline">&bull;</span>
            <span className="text-neutral-400 font-medium hidden sm:inline">
              Exclusive Logistics &amp; Management Area
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-400/90 font-medium">
            <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
              PRIVATE SOFTWARE &bull; NOT OPEN SOURCE
            </span>
          </div>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Institutional Card */}
          <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 relative overflow-hidden">
            {/* Top decorative accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600" />

            {/* Header Brand Section */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-neutral-950 border border-neutral-800 mb-4 shadow-xl">
                <AHPCasteloIcon className="h-12 w-auto text-white" />
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Flyer Stock AHP
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">
                1 Destination That Is 12 &bull; Promotional Flyers &amp; Tourism Offices Logistics
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-800/80 border border-neutral-700/60 text-[11px] text-neutral-300 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restricted Access Authentication</span>
              </div>
            </div>

            {/* Error / Lockout Alert Banner */}
            {errorMessage && (
              <div
                id="login-error-banner"
                className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-300">Authentication Failure</p>
                  <p className="mt-0.5 text-red-200/90 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Lockout active notice */}
            {lockoutSeconds > 0 && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-300">Access Temporarily Locked</p>
                  <p className="mt-0.5 text-amber-200/90">
                    Please wait <strong>{lockoutSeconds} seconds</strong> before submitting another
                    attempt.
                  </p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Username Input */}
              <div>
                <label
                  htmlFor="login-email-input"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Institutional Email / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="portal.ahp@gmail.com"
                    disabled={lockoutSeconds > 0 || isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password-input"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Need assistance?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={lockoutSeconds > 0 || isLoading}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Session Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    id="remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-emerald-500/40 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <span>Keep signed in on this workstation</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                id="btn-login-submit"
                type="submit"
                disabled={lockoutSeconds > 0 || isLoading}
                className={`w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  loginSuccessFlash
                    ? 'bg-emerald-600 hover:bg-emerald-600'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying credentials...</span>
                  </>
                ) : loginSuccessFlash ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                    <span>Access Authorized! Loading...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to System</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Access Credentials Assistant Drawer */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsHelpOpen(!isHelpOpen)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Pre-configured Access Credentials
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {isHelpOpen ? 'Hide' : 'View'}
                </span>
              </button>

              {isHelpOpen && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">System Administrator</p>
                      <p className="text-slate-400 font-mono text-[11px]">portal.ahp@gmail.com</p>
                      <p className="text-slate-400 font-mono text-[11px]">
                        Pass: <span className="text-emerald-400">AHP@Logistica2026!</span> (or{' '}
                        <span className="text-emerald-400">ahp2026</span>)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFillCredentials('portal.ahp@gmail.com', 'AHP@Logistica2026!')}
                      className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/40 text-emerald-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Fill
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">Logistics &amp; Circuits</p>
                      <p className="text-slate-400 font-mono text-[11px]">logistica@ahp.pt</p>
                      <p className="text-slate-400 font-mono text-[11px]">
                        Pass: <span className="text-emerald-400">AHP@Logistica2026!</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFillCredentials('logistica@ahp.pt', 'AHP@Logistica2026!')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Fill
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Proprietary & Non-Open Source Legal Notice */}
            <div className="mt-5 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300/90 leading-relaxed">
              <p className="font-semibold text-amber-200 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                CONFIDENTIALITY NOTICE &bull; PROPRIETARY SOFTWARE
              </p>
              This logistics platform and its underlying data are the exclusive property of{' '}
              <strong>Aldeias Históricas de Portugal</strong>. Access is strictly limited to
              authorized personnel and operators. This software is proprietary (not open source)
              and any reproduction, unauthorized extraction, or redistribution is strictly forbidden.
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="relative z-10 w-full border-t border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md py-3.5 px-4 text-center text-xs text-neutral-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AHPCasteloIcon className="w-3.5 h-3.5 text-neutral-400" />
            <p>
              &copy; {new Date().getFullYear()} <strong>Aldeias Históricas de Portugal</strong> &bull;
              Tourism Development Association. All rights reserved.
            </p>
          </div>
          <p className="text-[11px] text-neutral-400 flex items-center gap-2">
            <span>Network of 12 Historical Villages</span>
            <span>&bull;</span>
            <span>AES Encrypted Logistics Engine</span>
          </p>
        </div>
      </footer>

      {/* Forgot Password / Institutional Assistance Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-amber-400">
                <AHPCasteloIcon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Credential Assistance</h3>
                <p className="text-xs text-slate-400">Historical Villages Institutional Support</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                For security compliance and promotional inventory protection across the 12 Historical
                Villages network, password recovery is managed by the System Administrator:
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1.5">
                <p className="text-slate-400">
                  Support Email:{' '}
                  <span className="text-emerald-400 font-semibold">portal.ahp@gmail.com</span>
                </p>
                <p className="text-slate-400">
                  AHP Headquarters:{' '}
                  <span className="text-slate-200">
                    Aldeias Históricas de Portugal - Tourism Development Association
                  </span>
                </p>
                <p className="text-slate-400">
                  Default Access Password:{' '}
                  <span className="text-amber-400 font-semibold">AHP@Logistica2026!</span>
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                If you previously modified your credentials and cannot recall them, you may reset the
                session or contact administrative headquarters.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  handleFillCredentials('portal.ahp@gmail.com', 'AHP@Logistica2026!');
                  setIsForgotPasswordOpen(false);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Fill Official Credentials
              </button>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
