'use client';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { User, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, ChevronRight, ChevronLeft, CheckCircle, FileText, Building2, Briefcase, Building, Users, Percent, Ticket, ExternalLink, CheckCircle2, Info } from 'lucide-react';
import { ROLE_FIELDS, SIGNUP_ROLES, validateRegistrationProfile } from '@/lib/registration-rules';
import { getLegalDocsRead, clearLegalDocsRead, type LegalDoc } from '@/lib/legal-consent';

const roleIcons: Record<string, React.ElementType> = {
  STUDENT: Building2,
  PROFESSIONAL: Briefcase,
  STARTUP: Building,
  INVESTOR: Percent,
  MENTOR: Users,
  OTHER: FileText,
};

const steps = ['account', 'profile', 'terms', 'review'];

const DOC_META: Record<LegalDoc, { label: string; href: string }> = {
  terms: { label: 'Terms of Service', href: '/terms' },
  privacy: { label: 'Privacy Policy', href: '/privacy' },
};

export default function RegisterWizard() {
  const { register } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' as string });
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [docsRead, setDocsRead] = useState<Record<LegalDoc, boolean>>({ terms: false, privacy: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const role = form.role;
  const roleSpecs = ROLE_FIELDS[role as keyof typeof ROLE_FIELDS] ?? [];
  const step = steps[stepIndex];

  const bothDocsRead = docsRead.terms && docsRead.privacy;

  // The legal documents are opened in a separate tab, so the read-state is
  // carried through localStorage. Pick it up on focus and via the cross-tab
  // `storage` event.
  useEffect(() => {
    const sync = () => setDocsRead(getLegalDocsRead());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

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
    if (step === 'terms') return bothDocsRead && acceptTerms;
    return true;
  }, [step, form, profile, role, acceptTerms, bothDocsRead]);

  // Returns false and sets an explanatory message instead of silently advancing.
  const validateCurrentStep = (): boolean => {
    if (step === 'account') {
      if (!form.name.trim()) { setError('Please enter your full name.'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Please enter a valid email address.'); return false; }
      if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return false; }
      return true;
    }
    if (step === 'profile') {
      const result = validateRegistrationProfile(role, { ...form, ...profile });
      if (!result.ok) {
        setError(Object.values(result.errors)[0]);
        return false;
      }
      return true;
    }
    if (step === 'terms') {
      if (!docsRead.terms || !docsRead.privacy) {
        setError('You must open and read both the Terms of Service and the Privacy Policy before you can tick the agreement box.');
        return false;
      }
      if (!acceptTerms) {
        setError('Please tick the agreement box to confirm you have read and accept the Terms of Service and Privacy Policy.');
        return false;
      }
      return true;
    }
    return true;
  };

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

    if (!docsRead.terms || !docsRead.privacy) {
      setError('You must open and read both the Terms of Service and the Privacy Policy before you can create an account.');
      return;
    }

    if (!acceptTerms) {
      setError('Please tick the agreement box to confirm you have read and accept the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role, acceptTerms, profile);
      clearLegalDocsRead();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError('');
    if (!validateCurrentStep()) return;
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const prevStep = () => { setError(''); setStepIndex((i) => Math.max(i - 1, 0)); };

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
            <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-5">
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
                <button type="button" onClick={nextStep} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                  Continue to Profile<ChevronRight className="w-4 h-4" />
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

              <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-4">
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
                  <button type="submit" disabled={loading}
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

              <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <p className="text-xs font-medium text-slate-300">Legal Agreement</p>

                {(['terms', 'privacy'] as LegalDoc[]).map((doc) => (
                  <div key={doc} className="flex items-center justify-between gap-3">
                    <Link href={DOC_META[doc].href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                      Read the full {DOC_META[doc].label} <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    {docsRead[doc]
                      ? <span className="flex items-center gap-1.5 text-xs text-emerald-400 flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4" /> Read
                        </span>
                      : <span className="flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0">
                          <Info className="w-3.5 h-3.5" /> Not opened yet
                        </span>}
                  </div>
                ))}

                {!bothDocsRead && (
                  <p className="text-xs text-amber-400">
                    Open both documents in a new tab and read them. The agreement box unlocks once both pages
                    have been opened — then come back here.
                  </p>
                )}

                <label className={`flex items-start gap-3 pt-2 border-t border-white/5 ${bothDocsRead ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                  <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                    disabled={!bothDocsRead}
                    className="mt-0.5 w-4 h-4 accent-indigo-500 rounded disabled:opacity-40 disabled:cursor-not-allowed" />
                  <span className={`text-xs ${bothDocsRead ? 'text-slate-400' : 'text-slate-600'}`}>
                    I have read and agree to the Terms of Service and Privacy Policy.
                  </span>
                </label>
              </div>

              <div className="flex justify-between pt-2">
                <button type="button" onClick={prevStep}
                  className="w-48 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-white/10 bg-white/[0.02] text-white hover:bg-white/5 transition-colors text-sm">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="button" onClick={nextStep}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
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
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-sm text-slate-400">Terms &amp; Privacy accepted</span>
                  <span className={`text-sm ${acceptTerms ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {acceptTerms ? 'Yes' : 'Not yet'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

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
