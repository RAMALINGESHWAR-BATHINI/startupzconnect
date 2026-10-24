'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PasswordStrength from '@/components/PasswordStrength';
import { passwordStrength } from '@/lib/password-policy';
import { Lock, Loader2, AlertCircle, CheckCircle, ArrowLeft, LogOut, ShieldAlert,
  Mail, Monitor, Trash2, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [logoutAllMsg, setLogoutAllMsg] = useState('');

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!user) return;
    api.get('/auth/profile').then(r => setEmailVerified(!!r.data.user?.emailVerified)).catch(() => {});
  }, [user]);

  if (!authLoading && !user) { router.push('/login'); return null; }
  if (authLoading || !user) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSuccess(false);
    if (passwords.next.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (passwords.next !== passwords.confirm) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await api.put('/auth/password', { currentPassword: passwords.current, newPassword: passwords.next });
      setPwSuccess(true);
      setPasswords({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setPwError(err?.response?.data?.error || 'Failed to change password.');
    } finally { setPwLoading(false); }
  };

  const handleResendVerification = async () => {
    setResendLoading(true); setResendMsg('');
    try {
      const res = await api.post('/auth/resend-verification', { email: user.email });
      setResendMsg(res.data.message);
    } catch { setResendMsg('Failed to resend. Please try again.'); }
    finally { setResendLoading(false); }
  };

  const handleLogoutAll = async () => {
    setLogoutAllLoading(true); setLogoutAllMsg('');
    try {
      await api.post('/auth/logout-all');
      router.push('/login');
    } catch { setLogoutAllMsg('Failed to log out of all devices.'); setLogoutAllLoading(false); }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(''); setDeleteLoading(true);
    try {
      await api.delete('/auth/account', { data: { password: deletePassword } });
      router.push('/');
    } catch (err: any) {
      setDeleteError(err?.response?.data?.error || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

      {/* Email Verification */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-400" /> Email Verification
        </h2>
        {emailVerified === null ? (
          <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
        ) : emailVerified ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <ShieldCheck className="w-4 h-4" /> Your email is verified.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertCircle className="w-4 h-4" /> Your email is not verified yet.
            </div>
            {resendMsg && <p className="text-xs text-slate-400">{resendMsg}</p>}
            <button onClick={handleResendVerification} disabled={resendLoading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center gap-2">
              {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Resend Verification Email
            </button>
          </div>
        )}
      </div>

      {/* Password Change */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-6">
        <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-400" /> Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {pwError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />Password changed successfully!
            </div>
          )}
          {[
            { label: 'Current Password', key: 'current' },
            { label: 'New Password', key: 'next' },
            { label: 'Confirm New Password', key: 'confirm' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
              <input type="password" required minLength={key === 'current' ? 1 : 8}
                value={passwords[key as keyof typeof passwords]}
                onChange={e => setPasswords({ ...passwords, [key]: e.target.value.replace(/\s/g, '') })}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
              {key === 'next' && <PasswordStrength password={passwords.next} />}
            </div>
          ))}
          <button type="submit" disabled={pwLoading || passwordStrength(passwords.next).score < 2 || passwords.next !== passwords.confirm}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors mt-2">
            {pwLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" /> Account Info
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Email</span>
            <span className="text-white font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Role</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{user.role}</span>
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-blue-400" /> Sessions
        </h2>
        <p className="text-sm text-slate-400 mb-4">If you think your account was accessed from a device you don't recognize, sign out everywhere and change your password.</p>
        {logoutAllMsg && <p className="text-xs text-red-400 mb-3">{logoutAllMsg}</p>}
        <button onClick={handleLogoutAll} disabled={logoutAllLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 disabled:opacity-60 text-amber-400 text-sm font-medium transition-colors">
          {logoutAllLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Monitor className="w-4 h-4" />} Log Out of All Devices
        </button>
      </div>

      {/* Logout (this device) */}
      <button onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 text-slate-300 font-medium text-sm transition-colors mb-6">
        <LogOut className="w-4 h-4" /> Sign Out (this device)
      </button>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
        <h2 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> Danger Zone
        </h2>
        <p className="text-sm text-slate-400 mb-4">Permanently delete your account and all associated data — startups, applications, reviews, everything. This cannot be undone.</p>

        {!deleteConfirmOpen ? (
          <button onClick={() => setDeleteConfirmOpen(true)}
            className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors">
            Delete My Account
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="space-y-3">
            {deleteError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{deleteError}
              </div>
            )}
            <label className="block text-sm font-medium text-slate-300">Enter your password to confirm</label>
            <input type="password" required value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-red-500/20 text-white text-sm focus:outline-none focus:border-red-500 transition-colors" />
            <div className="flex gap-3">
              <button type="button" onClick={() => { setDeleteConfirmOpen(false); setDeletePassword(''); setDeleteError(''); }}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={deleteLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
