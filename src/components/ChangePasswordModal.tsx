import React, { useState } from 'react';
import { KeyRound, X, CheckCircle2, AlertTriangle, Eye, EyeOff, Shield } from 'lucide-react';
import { updateAccountPassword, validatePasswordPolicy, getStoredAccounts } from '../utils/auth';
import { AuthUser } from '../types';
import { AHPCasteloIcon } from './AHPLogo';

interface ChangePasswordModalProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentAccount = getStoredAccounts().find((u) => u.id === user.id);
  const policy = validatePasswordPolicy(newPassword, currentAccount);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!policy.valid) {
      setError(policy.error || 'Password does not satisfy the security policy.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    const result = updateAccountPassword(user.id, currentPassword, newPassword);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onSuccess();
        onClose();
      }, 1500);
    } else {
      setError(result.error || 'Failed to update password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn overflow-hidden relative">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-neutral-900 to-emerald-600" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white flex items-center justify-center shadow-xs">
              <AHPCasteloIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-500 font-medium">Account: {user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Password successfully updated!</p>
              <p className="text-emerald-700 mt-0.5">Your new credentials are now active.</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">New Password</label>
              <span className="text-[11px] text-amber-700 font-medium">Requires Capital & Symbol</span>
            </div>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="e.g. AHP@Seguranca2026!"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900"
            />
          </div>

          {/* Real-time Checklist */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-slate-600 font-semibold block text-[10px] uppercase tracking-wider">
              Institutional Password Rules:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className={`flex items-center gap-1.5 ${policy.hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${policy.hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>Min. 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${policy.hasCapital ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${policy.hasCapital ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>Capital Letter (A-Z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${policy.hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${policy.hasSpecial ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>Special Symbol (!@#$%)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${policy.isNotRepeated && newPassword.length > 0 ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${policy.isNotRepeated && newPassword.length > 0 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>No repeat of previous</span>
              </div>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-amber-700 text-[10px] pt-0.5">
                ⚠️ Passwords do not match.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasswords ? 'Hide characters' : 'Show characters'}</span>
            </button>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-600" />
              Secure Salted Hash
            </span>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={success || !policy.valid || !passwordsMatch}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Save New Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
