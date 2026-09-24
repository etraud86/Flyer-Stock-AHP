import React, { useState } from 'react';
import {
  KeyRound,
  X,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  UserPlus,
  Users,
  Shield,
  Trash2,
  RotateCcw,
  Sparkles,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Check,
  Building2,
  ShieldAlert,
  Pencil,
} from 'lucide-react';
import {
  updateAccountPassword,
  registerNewUser,
  getStoredAccounts,
  adminResetUserPassword,
  deleteUserAccount,
  updateUserAccount,
  validatePasswordPolicy,
  generateCompliantPassword,
  StoredUserAccount,
} from '../utils/auth';
import { AuthUser } from '../types';
import { AHPLogo, AHPCasteloIcon } from './AHPLogo';

interface UserManagementModalProps {
  currentUser: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
  onUserUpdated?: (user: AuthUser) => void;
  initialTab?: 'change_password' | 'register_user' | 'users_list';
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSuccessToast,
  onUserUpdated,
  initialTab = 'change_password',
}) => {
  const [activeTab, setActiveTab] = useState<'change_password' | 'register_user' | 'users_list'>(
    initialTab
  );

  // Accounts list state
  const [accounts, setAccounts] = useState<StoredUserAccount[]>(() => getStoredAccounts());

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [changePassSuccess, setChangePassSuccess] = useState(false);

  // Register User state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<string>('logistics_coordinator');
  const [isCustomRegRole, setIsCustomRegRole] = useState<boolean>(false);
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);

  // Admin Reset User Password state
  const [resetTargetUserId, setResetTargetUserId] = useState<string | null>(null);
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Edit User Directory State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<string>('logistics_coordinator');
  const [isCustomEditRole, setIsCustomEditRole] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshAccounts = () => {
    setAccounts(getStoredAccounts());
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError(null);

    if (!newPassword || newPassword.trim().length === 0) {
      setChangePassError('Please enter a new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePassError('New password and confirmation do not match.');
      return;
    }

    const result = updateAccountPassword(currentUser.id, currentPassword, newPassword);

    if (result.success) {
      setChangePassSuccess(true);
      onSuccessToast('Password successfully updated!');
      setTimeout(() => {
        setChangePassSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1800);
    } else {
      setChangePassError(result.error || 'Failed to update password.');
    }
  };

  const handleRegisterUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const result = registerNewUser(regName, regEmail, regRole, regPassword);
    if (result.success && result.user) {
      setRegSuccess(true);
      refreshAccounts();
      onSuccessToast(`User ${result.user.name} registered successfully!`);
      setTimeout(() => {
        setRegSuccess(false);
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setActiveTab('users_list');
      }, 1500);
    } else {
      setRegError(result.error || 'Failed to register new user.');
    }
  };

  const handleGenerateStrongPassword = () => {
    const pass = generateCompliantPassword();
    setRegPassword(pass);
    setRegShowPassword(true);
  };

  const handleAdminResetPassword = (userId: string) => {
    const targetUser = accounts.find((u) => u.id === userId);
    const policy = validatePasswordPolicy(resetNewPass, targetUser);
    if (!policy.valid) {
      setResetError(policy.error || 'Password does not meet institutional requirements.');
      return;
    }
    const res = adminResetUserPassword(userId, resetNewPass);
    if (res.success) {
      setResetSuccess('Password reset successfully!');
      refreshAccounts();
      onSuccessToast('User password reset successfully!');
      setTimeout(() => {
        setResetTargetUserId(null);
        setResetNewPass('');
        setResetSuccess(null);
        setResetError(null);
      }, 1500);
    } else {
      setResetError(res.error || 'Failed to reset password.');
    }
  };

  const handleDeleteUser = (userId: string) => {
    const res = deleteUserAccount(userId, currentUser.id);
    if (res.success) {
      refreshAccounts();
      onSuccessToast('User account removed.');
    } else {
      alert(res.error || 'Cannot delete user.');
    }
  };

  const startEditingUser = (user: StoredUserAccount) => {
    setResetTargetUserId(null); // Close password reset if open
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setIsCustomEditRole(!['admin', 'logistics_coordinator', 'manager'].includes(user.role));
    setEditError(null);
    setEditSuccess(null);
  };

  const cancelEditingUser = () => {
    setEditingUserId(null);
    setEditError(null);
    setEditSuccess(null);
  };

  const handleQuickChangeRole = (userId: string, newRole: string) => {
    const res = updateUserAccount(userId, { role: newRole });
    if (res.success && res.user) {
      refreshAccounts();
      const roleLabel = newRole === 'admin'
        ? 'Admin'
        : newRole === 'logistics_coordinator'
        ? 'Logistics Coordinator'
        : newRole === 'manager'
        ? 'Regional Manager'
        : newRole;
      onSuccessToast(`Role updated to "${roleLabel}" for ${res.user.name}`);
      if (currentUser.id === userId && onUserUpdated) {
        onUserUpdated({
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          role: res.user.role,
        });
      }
    } else {
      alert(res.error || 'Failed to update account role.');
    }
  };

  const handleSaveUserEdit = (userId: string) => {
    setEditError(null);
    setEditSuccess(null);

    const result = updateUserAccount(userId, {
      name: editName,
      email: editEmail,
      role: editRole,
    });

    if (result.success && result.user) {
      setEditSuccess('User account updated successfully!');
      refreshAccounts();
      onSuccessToast(`User "${result.user.name}" updated successfully!`);
      if (currentUser.id === userId && onUserUpdated) {
        onUserUpdated({
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        });
      }
      setTimeout(() => {
        setEditingUserId(null);
        setEditSuccess(null);
      }, 1000);
    } else {
      setEditError(result.error || 'Failed to update user profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-800 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 text-neutral-100">
        {/* Top Accent Gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-neutral-900 to-emerald-600 shrink-0" />

        {/* Modal Header - Black Base */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center shadow-md">
              <AHPCasteloIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Users &amp; Security Administration</h3>
              <p className="text-xs text-neutral-400">
                Manage passwords, register operators &bull; Active: {currentUser.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Responsive horizontal scroll) */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/70 px-4 pt-2 gap-1 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('change_password')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all cursor-pointer whitespace-nowrap border-t-2 ${
              activeTab === 'change_password'
                ? 'bg-neutral-900 text-white border-emerald-500'
                : 'text-neutral-400 hover:text-white border-transparent hover:bg-neutral-900/50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>Change My Password</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('register_user')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all cursor-pointer whitespace-nowrap border-t-2 ${
              activeTab === 'register_user'
                ? 'bg-neutral-900 text-white border-emerald-500'
                : 'text-neutral-400 hover:text-white border-transparent hover:bg-neutral-900/50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Register New User</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('users_list');
              refreshAccounts();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all cursor-pointer whitespace-nowrap border-t-2 ${
              activeTab === 'users_list'
                ? 'bg-neutral-900 text-white border-emerald-500'
                : 'text-neutral-400 hover:text-white border-transparent hover:bg-neutral-900/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Users Directory ({accounts.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-neutral-200">
          {/* TAB 1: CHANGE MY PASSWORD */}
          {activeTab === 'change_password' && (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 max-w-lg mx-auto">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Secure Password Change</p>
                  <p className="mt-0.5 text-neutral-400">
                    Passwords must be at least 6 characters and are salted with cryptographic standard AHP enterprise encryption.
                  </p>
                </div>
              </div>

              {changePassError && (
                <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{changePassError}</span>
                </div>
              )}

              {changePassSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Password successfully updated and encrypted!</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-9 pr-10 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              {(() => {
                const targetAccount = accounts.find((u) => u.id === currentUser.id);
                const policy = validatePasswordPolicy(newPassword, targetAccount);
                const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

                return (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-neutral-300">
                          New Password *
                        </label>
                        <span className="text-[10px] text-amber-400 font-medium">
                          Requires Capital &amp; Special Symbol
                        </span>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="e.g. AHP@Seguranca2026!"
                          className="w-full pl-9 pr-10 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full pl-9 pr-10 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                    </div>

                    {/* Policy checklist */}
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-[11px]">
                      <span className="text-neutral-400 font-semibold block text-[10px] uppercase tracking-wider">
                        Security Rules:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className={`flex items-center gap-1.5 ${policy.hasMinLength ? 'text-emerald-400' : 'text-neutral-500'}`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${policy.hasMinLength ? 'text-emerald-400' : 'text-neutral-600'}`} />
                          <span>At least 8 chars</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${policy.hasCapital ? 'text-emerald-400' : 'text-neutral-500'}`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${policy.hasCapital ? 'text-emerald-400' : 'text-neutral-600'}`} />
                          <span>Capital (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${policy.hasSpecial ? 'text-emerald-400' : 'text-neutral-500'}`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${policy.hasSpecial ? 'text-emerald-400' : 'text-neutral-600'}`} />
                          <span>Special Symbol (!@#$)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${policy.isNotRepeated && newPassword.length > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${policy.isNotRepeated && newPassword.length > 0 ? 'text-emerald-400' : 'text-neutral-600'}`} />
                          <span>No repeat</span>
                        </div>
                      </div>
                      {confirmPassword.length > 0 && !passwordsMatch && (
                        <p className="text-amber-400 text-[10px] pt-0.5">⚠️ Passwords do not match.</p>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={changePassSuccess || !policy.valid || !passwordsMatch}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Save New Password</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          )}

          {/* TAB 2: REGISTER NEW USER */}
          {activeTab === 'register_user' && (
            <form onSubmit={handleRegisterUserSubmit} className="space-y-4 max-w-lg mx-auto">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-300 flex items-start gap-3">
                <UserPlus className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Create New Institutional Account</p>
                  <p className="mt-0.5 text-neutral-400">
                    Registered users can immediately access the workstation with their assigned credentials.
                  </p>
                </div>
              </div>

              {regError && (
                <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>New user created successfully!</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Helena Matos"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Institutional Email */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Institutional Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. helena.matos@ahp.pt"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Account Role *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomRegRole(!isCustomRegRole)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline"
                  >
                    {isCustomRegRole ? 'Choose preset role' : 'Write custom role'}
                  </button>
                </div>
                {isCustomRegRole ? (
                  <input
                    type="text"
                    required
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    placeholder="e.g. Field Supervisor, Regional Auditor, Staff Coordinator"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                ) : (
                  <select
                    value={['admin', 'logistics_coordinator', 'manager'].includes(regRole) ? regRole : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomRegRole(true);
                      } else {
                        setRegRole(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="logistics_coordinator">Logistics Coordinator (Standard)</option>
                    <option value="admin">Administrator (Full Rights)</option>
                    <option value="manager">Regional Tourism Manager</option>
                    <option value="custom">Custom Role... (Write any custom title)</option>
                  </select>
                )}
              </div>

              {/* Password with Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Initial Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateStrongPassword}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Generate Compliant</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={regShowPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="e.g. AHP@Operador2026!"
                    className="w-full pl-9 pr-10 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {(() => {
                const regPolicy = validatePasswordPolicy(regPassword);
                return (
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-[11px]">
                    <span className="text-neutral-400 font-semibold block text-[10px] uppercase tracking-wider">
                      Required Password Rules:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className={`flex items-center gap-1.5 ${regPolicy.hasMinLength ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${regPolicy.hasMinLength ? 'text-emerald-400' : 'text-neutral-600'}`} />
                        <span>Min. 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${regPolicy.hasCapital ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${regPolicy.hasCapital ? 'text-emerald-400' : 'text-neutral-600'}`} />
                        <span>Capital Letter (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${regPolicy.hasSpecial ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${regPolicy.hasSpecial ? 'text-emerald-400' : 'text-neutral-600'}`} />
                        <span>Special Symbol (!@#$)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Salted encryption</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={regSuccess || !validatePasswordPolicy(regPassword).valid || !regName || !regEmail}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register &amp; Activate User</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ALL USERS DIRECTORY */}
          {activeTab === 'users_list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Registered Users &amp; Operators</h4>
                  <p className="text-xs text-neutral-400">
                    Accounts authorized to access the FlyerStock portal and log distributions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('register_user')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add User</span>
                </button>
              </div>

              {resetError && (
                <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div className="space-y-2.5">
                {accounts.map((acc) => {
                  const isCurrent = acc.id === currentUser.id;
                  const isResettingThis = resetTargetUserId === acc.id;
                  const isEditingThis = editingUserId === acc.id;

                  return (
                    <div
                      key={acc.id}
                      className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-2.5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {acc.name ? acc.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white">{acc.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                                  You
                                </span>
                              )}
                              <div className="flex items-center gap-1">
                                <select
                                  value={acc.role}
                                  onChange={(e) => handleQuickChangeRole(acc.id, e.target.value)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                                    acc.role === 'admin'
                                      ? 'bg-amber-950/90 text-amber-300 border-amber-700/80 hover:bg-amber-900/90'
                                      : acc.role === 'manager'
                                      ? 'bg-blue-950/90 text-blue-300 border-blue-700/80 hover:bg-blue-900/90'
                                      : 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/90'
                                  }`}
                                  title="Click to directly change account role"
                                >
                                  <option value="admin" className="bg-neutral-900 text-amber-300 font-bold">Admin (Full Rights)</option>
                                  <option value="logistics_coordinator" className="bg-neutral-900 text-emerald-300 font-bold">Logistics Coordinator</option>
                                  <option value="manager" className="bg-neutral-900 text-blue-300 font-bold">Regional Manager</option>
                                  {!['admin', 'logistics_coordinator', 'manager'].includes(acc.role) && (
                                    <option value={acc.role} className="bg-neutral-900 text-purple-300 font-bold">{acc.role.toUpperCase()}</option>
                                  )}
                                </select>
                              </div>
                            </div>
                            <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{acc.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditingThis) {
                                cancelEditingUser();
                              } else {
                                startEditingUser(acc);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
                              isEditingThis
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700 hover:text-white'
                            }`}
                            title="Edit user details in directory"
                          >
                            <Pencil className="w-3 h-3 text-emerald-400" />
                            <span>{isEditingThis ? 'Close Edit' : 'Edit'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (isResettingThis) {
                                setResetTargetUserId(null);
                              } else {
                                cancelEditingUser();
                                setResetTargetUserId(acc.id);
                                setResetNewPass('');
                              }
                            }}
                            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Reset password for this user"
                          >
                            <RotateCcw className="w-3 h-3 text-neutral-400" />
                            <span>{isResettingThis ? 'Cancel' : 'Reset Pass'}</span>
                          </button>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(acc.id)}
                              className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                              title="Delete account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Edit User Form Inline */}
                      {isEditingThis && (
                        <div className="mt-2.5 pt-3 border-t border-neutral-800 space-y-3 bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-700/60 animate-in fade-in">
                          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-md">
                                <Pencil className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-white block leading-tight">Edit Directory User</span>
                                <span className="text-[10px] text-neutral-400">Update operator name, email address, or administrative privileges</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={cancelEditingUser}
                              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {editError && (
                            <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-lg text-red-200 text-xs flex items-center gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              <span>{editError}</span>
                            </div>
                          )}

                          {editSuccess && (
                            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{editSuccess}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                                Full Name / Operator *
                              </label>
                              <div className="relative">
                                <User className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  required
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="e.g. Aldeias Históricas de Portugal"
                                  className="w-full pl-8 pr-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                                Email Address *
                              </label>
                              <div className="relative">
                                <Mail className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="email"
                                  required
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  placeholder="e.g. portal.ahp@gmail.com"
                                  className="w-full pl-8 pr-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-semibold text-neutral-300">
                                Account Role &amp; Permissions *
                              </label>
                              <button
                                type="button"
                                onClick={() => setIsCustomEditRole(!isCustomEditRole)}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline"
                              >
                                {isCustomEditRole ? 'Select preset role' : 'Write custom role name'}
                              </button>
                            </div>

                            {isCustomEditRole ? (
                              <input
                                type="text"
                                required
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                placeholder="e.g. Director of Operations, Regional Auditor, Supervisor"
                                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            ) : (
                              <select
                                value={['admin', 'logistics_coordinator', 'manager'].includes(editRole) ? editRole : 'custom'}
                                onChange={(e) => {
                                  if (e.target.value === 'custom') {
                                    setIsCustomEditRole(true);
                                  } else {
                                    setEditRole(e.target.value);
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                              >
                                <option value="admin">Administrator (Full Rights &amp; Directory Control)</option>
                                <option value="logistics_coordinator">Logistics Coordinator (Standard Distribution Logging)</option>
                                <option value="manager">Regional Tourism Manager (Analytics &amp; Circuit Auditing)</option>
                                <option value="custom">Custom Role... (Write any custom title)</option>
                              </select>
                            )}
                            <span className="text-[10px] text-neutral-400 mt-1 block">
                              Account role is fully editable for all users at any time.
                            </span>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800">
                            <button
                              type="button"
                              onClick={cancelEditingUser}
                              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveUserEdit(acc.id)}
                              disabled={!editName.trim() || !editEmail.trim()}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save Changes</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Reset Password Form Inline */}
                      {isResettingThis && (
                        <div className="mt-2 pt-2 border-t border-neutral-800/80 space-y-2 animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={resetNewPass}
                              onChange={(e) => setResetNewPass(e.target.value)}
                              placeholder="e.g. AHP@Seguranca2026!"
                              className="flex-1 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => setResetNewPass(generateCompliantPassword())}
                              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
                            >
                              Auto-Generate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminResetPassword(acc.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap"
                            >
                              Save
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-400">
                            Must contain at least 8 characters, 1 capital letter, 1 special character, and cannot repeat previous password.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
