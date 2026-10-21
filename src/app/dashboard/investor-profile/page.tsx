'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { TrendingUp, Loader2, ArrowLeft, AlertCircle, CheckCircle, Shield } from 'lucide-react';

const NET_WORTH_BRACKETS = [
  { value: '25L-1Cr',  label: '₹25L – ₹1 Crore' },
  { value: '1Cr-5Cr',  label: '₹1 Crore – ₹5 Crore' },
  { value: '5Cr-25Cr', label: '₹5 Crore – ₹25 Crore' },
  { value: '25Cr+',    label: '₹25 Crore+' },
];
const TICKET_SIZES = [
  { value: '1L-10L',   label: '₹1L – ₹10L' },
  { value: '10L-50L',  label: '₹10L – ₹50L' },
  { value: '50L-2Cr',  label: '₹50L – ₹2 Crore' },
  { value: '2Cr+',     label: '₹2 Crore+' },
];
const STAGES = ['IDEA','MVP','PRE_SEED','SEED','SERIES_A','SERIES_B','BOOTSTRAPPED'];
const DOMAINS = ['AI','FinTech','HealthTech','EdTech','SaaS','E-commerce','Logistics','CleanTech','GameTech','Any'];

export default function InvestorProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    investorNetWorth: '',
    investorTicketSize: '',
    investorThesis: '',
    investorSectors: [] as string[],
    investorPastDeals: '',
    sebiRegNumber: '',
    preferredStages: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const toggleArr = (key: keyof typeof form, val: string) => {
    setForm(f => ({
      ...f,
      [key]: (f[key] as string[]).includes(val)
        ? (f[key] as string[]).filter(v => v !== val)
        : [...(f[key] as string[]), val],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.investorNetWorth) { setError('Please select your net worth bracket.'); return; }
    setSaving(true); setError(''); setSuccess(false);
    try {
      await api.put('/auth/investor-profile', {
        ...form,
        investorSectors: form.investorSectors.join(','),
        preferredStages: form.preferredStages.join(','),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save profile.');
    } finally { setSaving(false); }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Investor Profile</h1>
          <p className="text-slate-400 text-sm">Complete your profile to get the Verified Investor badge and access deal flow.</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 mb-8">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-medium text-emerald-300 mb-1">Why we collect this</p>
            <p className="text-slate-400">This information is reviewed by our team to issue your Verified Investor badge. It is never shown publicly — startups only see that you are verified and your thesis. Net worth and SEBI details are for verification only.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />Profile saved! Our team will review and verify within 48 hours.
          </div>
        )}

        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6">
          {/* Net worth */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Investable Net Worth * <span className="text-slate-500 font-normal">(self-declared, confidential)</span></label>
            <div className="grid grid-cols-2 gap-2">
              {NET_WORTH_BRACKETS.map(b => (
                <label key={b.value} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm transition-all ${
                  form.investorNetWorth === b.value ? 'border-emerald-500/60 bg-emerald-500/10 text-white' : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}>
                  <input type="radio" name="networth" value={b.value} checked={form.investorNetWorth === b.value}
                    onChange={() => setForm(f => ({ ...f, investorNetWorth: b.value }))} className="accent-emerald-500" />
                  {b.label}
                </label>
              ))}
            </div>
          </div>

          {/* Ticket size */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Typical Investment Ticket Size</label>
            <div className="grid grid-cols-2 gap-2">
              {TICKET_SIZES.map(t => (
                <label key={t.value} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm transition-all ${
                  form.investorTicketSize === t.value ? 'border-emerald-500/60 bg-emerald-500/10 text-white' : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}>
                  <input type="radio" name="ticket" value={t.value} checked={form.investorTicketSize === t.value}
                    onChange={() => setForm(f => ({ ...f, investorTicketSize: t.value }))} className="accent-emerald-500" />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {/* Preferred stages */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Investment Stages</label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map(s => (
                <button type="button" key={s}
                  onClick={() => toggleArr('preferredStages', s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.preferredStages.includes(s) ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                  }`}>{s.replace('_',' ')}</button>
              ))}
            </div>
          </div>

          {/* Sectors */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Focus Sectors</label>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map(d => (
                <button type="button" key={d}
                  onClick={() => toggleArr('investorSectors', d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.investorSectors.includes(d) ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                  }`}>{d}</button>
              ))}
            </div>
          </div>

          {/* Thesis */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Investment Thesis <span className="text-slate-500 font-normal">(visible to startups)</span></label>
            <textarea value={form.investorThesis} onChange={e => setForm(f => ({ ...f, investorThesis: e.target.value }))} rows={4}
              placeholder="What excites you? What stage do you prefer? What value do you bring beyond capital? (mentorship, network, domain expertise)"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm resize-none transition-colors" />
          </div>

          {/* Past deals */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Past Investments (optional, for verification)</label>
            <textarea value={form.investorPastDeals} onChange={e => setForm(f => ({ ...f, investorPastDeals: e.target.value }))} rows={3}
              placeholder="e.g. Startup A (2022, ₹10L seed), Startup B (2023, angel) — kept confidential, used for verification only"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm resize-none transition-colors" />
          </div>

          {/* SEBI reg */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">SEBI Registration Number <span className="text-slate-500 font-normal">(if registered angel investor)</span></label>
            <input type="text" value={form.sebiRegNumber} onChange={e => setForm(f => ({ ...f, sebiRegNumber: e.target.value }))}
              placeholder="e.g. IN/AIF1/23-24/..."
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition-colors" />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold transition-colors">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> Save Investor Profile</>}
        </button>
      </form>
    </div>
  );
}
