'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Rocket, User, Mail, Lock, AlertCircle, Loader2, ChevronDown, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'USER',
    startupName: '',
    startupDomain: '',
    skills: '',
    experience: 'Student',
    investmentRange: '10K-50K',
    interestedDomains: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      // In a real app, we'd also save the extra fields to a profile model here
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'USER', label: 'Developer / Student', desc: 'Find jobs, collaborate with startups' },
    { value: 'FOUNDER', label: 'Startup Founder', desc: 'List your startup, post jobs, find co-founders' },
    { value: 'INVESTOR', label: 'Investor', desc: 'Discover and invest in promising startups' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-white/10 mb-4 overflow-hidden">
            <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-1 text-sm">Join the future of startup collaboration</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@startup.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">I am a...</label>
              <div className="grid gap-2">
                {roles.map(r => (
                  <label key={r.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${form.role === r.value ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-slate-900 hover:border-white/20'}`}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                      onChange={() => setForm({ ...form, role: r.value })} className="mt-0.5 accent-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-white">{r.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Role-Specific Fields */}
            {form.role === 'FOUNDER' && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Startup Name</label>
                  <input type="text" value={form.startupName} onChange={e => setForm({ ...form, startupName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Startup Domain</label>
                  <input type="text" value={form.startupDomain} onChange={e => setForm({ ...form, startupDomain: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm" />
                </div>
              </div>
            )}

            {form.role === 'USER' && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Skills (e.g., Java, React, ML)</label>
                  <input type="text" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Experience</label>
                  <select value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm">
                    <option>Student</option>
                    <option>Fresher</option>
                    <option>1-3 Years</option>
                    <option>3+ Years</option>
                  </select>
                </div>
              </div>
            )}

            {form.role === 'INVESTOR' && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Investment Range</label>
                  <select value={form.investmentRange} onChange={e => setForm({ ...form, investmentRange: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm">
                    <option>10K-50K</option>
                    <option>50K-200K</option>
                    <option>200K-1M</option>
                    <option>1M+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Interested Domains</label>
                  <input type="text" value={form.interestedDomains} onChange={e => setForm({ ...form, interestedDomains: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm" />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create account'}
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
