'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Building2, Loader2, AlertCircle, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

const DOMAINS = ['AI','FinTech','HealthTech','EdTech','SaaS','E-commerce','Logistics','CleanTech','GameTech','Other'];
const STAGES = [
  { value: 'IDEA', label: 'Idea Stage', desc: 'Concept only, not yet building' },
  { value: 'MVP', label: 'MVP Built', desc: 'Minimum viable product exists' },
  { value: 'PRE_SEED', label: 'Pre-Seed', desc: 'Early funding or bootstrapped' },
  { value: 'SEED', label: 'Seed', desc: 'Seed funding raised' },
  { value: 'SERIES_A', label: 'Series A', desc: 'Series A raised' },
  { value: 'SERIES_B', label: 'Series B+', desc: 'Series B or beyond' },
  { value: 'BOOTSTRAPPED', label: 'Bootstrapped / Profitable', desc: 'Self-funded, generating revenue' },
];
const ORIGINS = [
  { value: 'INDEPENDENT', label: 'Independent / Self-Built', desc: 'Founded independently without institutional backing' },
  { value: 'INSTITUTIONAL', label: 'Institutionally Incubated', desc: 'Born inside a college or research institution' },
  { value: 'ACCELERATOR', label: 'Accelerator Backed', desc: 'Part of an accelerator program (YC, T-Hub, etc.)' },
  { value: 'CORPORATE_SPINOFF', label: 'Corporate Spinoff', desc: 'Spun out of an existing company' },
  { value: 'JV', label: 'Joint Venture', desc: 'Co-built by two or more entities' },
  { value: 'GOVT_BACKED', label: 'Government Backed', desc: 'Startup India, SIDBI, state schemes etc.' },
];

const STEPS = ['Basic Info', 'Origin & Legal', 'Stage & Team', 'Showcase'];

export default function CreateStartupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', domain: '', description: '',
    originType: 'INDEPENDENT', institutionName: '',
    registrationId: '', registeredAddress: '', operationalAddress: '',
    foundedDate: '', stage: 'IDEA', employeeCount: '1',
    websiteUrl: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    if (step === 0) {
      if (!form.name.trim() || form.name.trim().length < 2) return 'Startup name must be at least 2 characters.';
      if (!form.description.trim() || form.description.trim().length < 20) return 'Please add a description (min 20 characters).';
    }
    if (step === 1) {
      if (['INSTITUTIONAL','ACCELERATOR'].includes(form.originType) && !form.institutionName.trim())
        return 'Please enter the institution/accelerator name.';
    }
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await api.post('/startups', {
        ...form,
        employeeCount: parseInt(form.employeeCount) || 1,
      });
      router.push(`/startups/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create startup.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {step > 0 ? 'Back' : 'Cancel'}
      </button>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
              ${i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-white' : 'text-slate-500'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-emerald-600' : 'bg-slate-800'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Register Your Startup</h1>
            <p className="text-slate-400 text-sm">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* STEP 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Startup Name *</label>
              <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. NeuralMed AI"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Domain / Industry</label>
              <select value={form.domain} onChange={e => set('domain', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm transition-colors">
                <option value="">Select domain</option>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">What does your startup do? *</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5}
                maxLength={2000} placeholder="Describe the problem you solve and who you solve it for..."
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none transition-colors" />
              <p className="text-xs text-slate-600 mt-1">{form.description.length}/2000</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Website (optional)</label>
              <input type="url" value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)}
                placeholder="https://yourstartup.com"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
            </div>
          </div>
        )}

        {/* STEP 1: Origin & Legal */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Startup Origin *</label>
              <div className="space-y-2">
                {ORIGINS.map(o => (
                  <label key={o.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.originType === o.value ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-white/10 hover:border-white/20'}`}>
                    <input type="radio" name="originType" value={o.value} checked={form.originType === o.value}
                      onChange={() => set('originType', o.value)} className="mt-0.5 accent-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-white">{o.label}</p>
                      <p className="text-xs text-slate-400">{o.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {['INSTITUTIONAL','ACCELERATOR'].includes(form.originType) && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {form.originType === 'INSTITUTIONAL' ? 'Institution Name *' : 'Accelerator Name *'}
                </label>
                <input type="text" value={form.institutionName} onChange={e => set('institutionName', e.target.value)}
                  placeholder={form.originType === 'INSTITUTIONAL' ? 'e.g. IIT Hyderabad' : 'e.g. T-Hub, Y Combinator'}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Company Registration ID (CIN / LLPIN / GST)</label>
              <input type="text" value={form.registrationId} onChange={e => set('registrationId', e.target.value)}
                placeholder="e.g. U72200TG2023PTC123456"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
              <p className="text-xs text-slate-500 mt-1">Required for Registered badge. Verified by our team.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Registered Address</label>
                <textarea value={form.registeredAddress} onChange={e => set('registeredAddress', e.target.value)} rows={3}
                  placeholder="Legal registered address"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Operational Address</label>
                <textarea value={form.operationalAddress} onChange={e => set('operationalAddress', e.target.value)} rows={3}
                  placeholder="Where your team actually works"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none transition-colors" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Stage & Team */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Current Stage *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STAGES.map(s => (
                  <label key={s.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.stage === s.value ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-white/10 hover:border-white/20'}`}>
                    <input type="radio" name="stage" value={s.value} checked={form.stage === s.value}
                      onChange={() => set('stage', s.value)} className="mt-0.5 accent-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-white">{s.label}</p>
                      <p className="text-xs text-slate-400">{s.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Founded Date</label>
                <input type="date" value={form.foundedDate} onChange={e => set('foundedDate', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Team Size</label>
                <input type="number" min="1" max="10000" value={form.employeeCount}
                  onChange={e => set('employeeCount', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Showcase */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-sm text-indigo-300">
              Almost done! Once your startup is created, you can add team members, post work logs, and request a field inspection from your dashboard.
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">Review your startup details</h3>
              {[
                ['Name', form.name],
                ['Domain', form.domain || 'Not selected'],
                ['Origin', ORIGINS.find(o => o.value === form.originType)?.label || ''],
                form.institutionName ? ['Institution', form.institutionName] : null,
                form.registrationId ? ['Registration ID', form.registrationId] : null,
                ['Stage', STAGES.find(s => s.value === form.stage)?.label || ''],
                ['Team Size', form.employeeCount],
                form.foundedDate ? ['Founded', form.foundedDate] : null,
                form.websiteUrl ? ['Website', form.websiteUrl] : null,
              ].filter(Boolean).map(([k, v]) => (
                <div key={k as string} className="flex justify-between text-sm py-2 border-b border-white/5">
                  <span className="text-slate-400">{k}</span>
                  <span className="text-white font-medium text-right max-w-xs truncate">{v as string}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
          <span className="text-xs text-slate-600">Step {step + 1} of {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><CheckCircle className="w-4 h-4" /> Launch Startup</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
