'use client';
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { User, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, ChevronRight, ChevronLeft, CheckCircle, FileText, Building2, Briefcase, Building, Users, Percent, Ticket } from 'lucide-react';
import { ROLE_FIELDS, SIGNUP_ROLES, validateRegistrationProfile } from '@/lib/registration-rules';

const roleIcons: Record<string, React.ElementType> = {
  STUDENT: Building2,
  PROFESSIONAL: Briefcase,
  STARTUP: Building,
  INVESTOR: Percent,
  MENTOR: Users,
  OTHER: FileText,
};

const steps = ['account', 'profile', 'terms', 'review'];

export default function RegisterWizard() {
  const { register } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' as string });
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);

  const role = form.role;
  const roleSpecs = ROLE_FIELDS[role as keyof typeof ROLE_FIELDS] ?? [];
  const step = steps[stepIndex];

  const isValidStep = useCallback((): boolean => {
    if (step === 'account') {
      if (!form.name || !form.email || !form.password) return false;
      if (form.password.length < 8) return false;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return false;
      return true;
    }
    if (step === 'profile') {
      const result = validateRegistrationProfile(role, { ...form, ...profile });
      return result.ok;
    }
    if (step === 'terms') return acceptTerms;
    return true;
  }, [step, form, profile, role, acceptTerms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 'profile') {
      const result = validateRegistrationProfile(role, { ...form, ...profile });
      if (!result.ok) {
        setError(Object.values(result.errors)[0]);
        return;
      }
    }

    if (!acceptTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role, acceptTerms, profile);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (!isValidStep()) return;
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const prevStep = () => setStepIndex((i) => Math.max(i - 1, 0));

  const progress = ((stepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="w-full mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-2 uppercase font-semibold">
            {steps.map((s, i) => (
              <span key={s} className={`font-medium ${i <= stepIndex ? 'text-indigo-500' : 'text-slate-400'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            ))}
          </div>
          <div className="h-1 bg-slate-900/10 rounded-full overflow-hidden">
            <div className={`h-full bg-indigo-600 transition-all duration-300`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          {step === 'account' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
                <p className="text-slate-400 text-sm">Join the verified startup network</p>
              </div>

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
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" required
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                  {SIGNUP_ROLES.map((r) => {
                    const Icon = roleIcons[r];
                    return (
                      <label key={r}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.role === r ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                        <input type="radio" name="role" value={r} checked={form.role === r}
                          onChange={() => setForm({ ...form, role: r })} className="mt-0.5 accent-indigo-500" />
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-white">{r}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button type="button" onClick={handleSubmit} disabled={loading || !isValidStep()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Continue to Profile'}
                </button>
              </div>
            </form>
          )}

          {step === 'profile' && (
            <div className="space-y-5">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Tell us about yourself</h1>
                <p className="text-slate-400 text-sm">These details help match you with the right startups, jobs, and investors.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {roleSpecs.map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    {f.kind === 'select' ? (
                      <select required={f.required} value={profile[f.key] ?? ''} onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                        className="w-full pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm">
                        <option value="">{f.required ? 'Select…' : 'Optional'}</option>
                        {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.kind === 'url' ? (
                      <div className="relative">
                        <input type="url" required={f.required} minLength={f.min ?? 0} maxLength={f.max}
                          value={profile[f.key] ?? ''} onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                          placeholder={`https://example.com/${f.label.toLowerCase()}`}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      </div>
                    ) : f.kind === 'textarea' ? (
                      <textarea required={f.required} minLength={f.min ?? 0} maxLength={f.max}
                        value={profile[f.key] ?? ''} onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                        rows={3} placeholder={f.label}
                        className="w-full pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
                    ) : (
                      <input type="text" required={f.required} minLength={f.min ?? 0} maxLength={f.max}
                        value={profile[f.key] ?? ''} onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                        placeholder={f.label}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
                    )}
                  </div>
                ))}

                <div className="flex justify-between pt-2">
                  <button type="button" onClick={prevStep}
                    className="w-48 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-white/10 bg-white/[0.02] text-white hover:bg-white/5 transition-colors text-sm">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="submit" disabled={loading || !isValidStep()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                    Continue {stepIndex === steps.length - 2 ? 'to Terms' : ''}<ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'terms' && (
            <div className="space-y-5">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Terms &amp; Privacy</h1>
                <p className="text-slate-400 text-sm">Please review and accept our terms before creating your account.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              <div className="bg-slate-900/20 border border-white/10 rounded-xl p-6 max-h-64 overflow-y-auto text-sm text-slate-300 leading-relaxed">
                <p className="mb-4"><strong>Terms of Service.</strong> By creating an account, you agree to our Terms of Service and Privacy Policy. You must be at least 13 years old to use StartupzConnect.</p>
                <p className="mb-4"><strong>Data collection.</strong> We collect your name, email, and profile information to provide the service. Verification documents are stored privately and accessed only through short-lived signed URLs.</p>
                <p className="mb-4"><strong>Security.</strong> Passwords are hashed with bcrypt. Sessions are device-scoped and can be revoked at any time from your account settings.</p>
                <p className="mb-0"><strong>Admin roles.</strong> Administrative access is granted only through server-side approval and is recorded in the audit log.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-indigo-500 rounded" />
                <span className="text-xs text-slate-400">
                  I agree to the <Link href="/terms" target="_blank" className="text-indigo-400 hover:text-indigo-300">Terms of Service</Link> and{' '}
                  <Link href="/privacy" target="_blank" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</Link>.
                </span>
              </label>

              <div className="flex justify-between pt-2">
                <button type="button" onClick={prevStep}
                  className="w-48 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-white/10 bg-white/[0.02] text-white hover:bg-white/5 transition-colors text-sm">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="button" onClick={nextStep} disabled={!acceptTerms}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                  Review &amp; Submit<ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-5">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Review your account</h1>
                <p className="text-slate-400 text-sm">Confirm your details before creating your account.</p>
              </div>

              <div className="bg-slate-900/20 border border-white/10 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Name</span>
                  <span className="text-sm text-white">{form.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Email</span>
                  <span className="text-sm text-white">{form.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Account type</span>
                  <span className="text-sm text-white">{form.role}</span>
                </div>
                {Object.entries(profile).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Profile details</p>
                    {Object.entries(profile).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{key}</span>
                        <span className="text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between pt-2">
                  <button type="button" onClick={prevStep}
                    className="w-48 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-white/10 bg-white/[0.02] text-white hover:bg-white/5 transition-colors text-sm">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
