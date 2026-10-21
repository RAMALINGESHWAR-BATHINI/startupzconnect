'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Lock, Loader2, AlertCircle, CheckCircle, ArrowLeft, LogOut, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

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

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

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
                onChange={e => setPasswords({ ...passwords, [key]: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
          ))}
          <button type="submit" disabled={pwLoading}
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

      {/* Logout */}
      <button onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-medium text-sm transition-colors">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}
