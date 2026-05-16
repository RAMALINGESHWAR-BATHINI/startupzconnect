'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User, Mail, Briefcase, Globe, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    skills: '',
    bio: '',
    portfolio: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        skills: '', // In a real app, fetch these from backend
        bio: '',
        portfolio: '',
        location: ''
      });
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      // await api.put('/auth/profile', form); // Implementation would be on backend
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Edit Profile</h1>
        <p className="text-slate-400">Update your information and how others see you.</p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:border-indigo-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email (Read-only)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={form.email} readOnly
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-slate-500 text-sm outline-none cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
            <input type="text" value={user.role} readOnly
              className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-indigo-400 font-bold text-sm outline-none cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Skills (e.g., React, Node.js, Python)</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <textarea value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} rows={2}
                placeholder="List your top skills..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:border-indigo-500 outline-none resize-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={4}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:border-indigo-500 outline-none resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Portfolio / LinkedIn</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })}
                  placeholder="https://..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:border-indigo-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="City, Country"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            {success && (
              <p className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Profile updated successfully!
              </p>
            )}
            <button type="submit" disabled={loading}
              className="ml-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
