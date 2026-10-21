'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { User, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const roles = [
  { value: 'STUDENT',      label: 'Student', desc: 'Find internships, learn, and connect with startups' },
  { value: 'PROFESSIONAL', label: 'Working Professional', desc: 'Apply for jobs, offer collaboration, mentor' },
  { value: 'STARTUP',      label: 'Startup Founder', desc: 'List your startup, post jobs, raise funds' },
  { value: 'INVESTOR',     label: 'Investor', desc: 'Discover and invest in promising startups' },
  { value: 'MENTOR',       label: 'Mentor', desc: 'Give founders your time and experience, not money' },
  { value: 'OTHER',        label: 'Other', desc: 'Researcher, journalist, accelerator, institution, etc.' },
];

export default function RegisterClient() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!acceptTerms) { setError('Please agree to the Terms of Service and Privacy Policy to continue.'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role, acceptTerms);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <User className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-1 text-sm">Join the verified startup network</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" required minLength={2} maxLength={100}
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Smith"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@startup.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password <span className="text-slate-500 font-normal">(min 8 characters)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} required minLength={8}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">I am a…</label>
              <div className="space-y-2">
                {roles.map(r => (
                  <label key={r.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.role === r.value ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                      onChange={() => setForm({ ...form, role: r.value })} className="mt-0.5 accent-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-white">{r.label}</p>
                      <p className="text-xs text-slate-400">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-indigo-500 rounded" />
              <span className="text-xs text-slate-400">
                I agree to the <Link href="/terms" target="_blank" className="text-indigo-400 hover:text-indigo-300">Terms of Service</Link> and{' '}
                <Link href="/privacy" target="_blank" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</Link>.
              </span>
            </label>

            <button type="submit" disabled={loading || !acceptTerms}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
