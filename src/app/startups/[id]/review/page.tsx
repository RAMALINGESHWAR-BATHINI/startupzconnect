'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Star, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { StarInput } from '@/components/ui/StarRating';

const VISIT_TYPES = [
  { value: 'JOB_INTERVIEW', label: 'Job Interview' },
  { value: 'OFFICE_VISIT',  label: 'Office Visit' },
  { value: 'INVESTOR_MEETING', label: 'Investor Meeting' },
  { value: 'COLLABORATION', label: 'Collaboration' },
  { value: 'EMPLOYEE',      label: 'I work / worked here' },
];

const RATING_FIELDS = [
  { key: 'cultureRating',       label: 'Culture & Work Environment' },
  { key: 'transparencyRating',  label: 'Founder Transparency & Communication' },
  { key: 'professionalismRating', label: 'Team Professionalism' },
  { key: 'productRating',       label: 'Product & Vision Clarity' },
  { key: 'overallRating',       label: 'Overall Experience' },
];

export default function WriteReviewPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    visitType: 'OFFICE_VISIT',
    cultureRating: 0, transparencyRating: 0,
    professionalismRating: 0, productRating: 0, overallRating: 0,
    reviewText: '', isAnonymous: false,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    api.get(`/startups/${id}`)
      .then(r => setStartup(r.data))
      .catch(() => router.push('/startups'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const setRating = (key: string, val: number) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (RATING_FIELDS.some(f => !form[f.key as keyof typeof form])) {
      setError('Please rate all categories before submitting.'); return;
    }
    if (form.reviewText.trim().length < 50) {
      setError('Please write at least 50 characters in your review.'); return;
    }
    setSubmitting(true);
    try {
      await api.post(`/startups/${id}/reviews`, { ...form, startupId: parseInt(id as string) });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit review.');
    } finally { setSubmitting(false); }
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 flex items-center justify-center mb-2">
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-white">Review Submitted!</h2>
      <p className="text-slate-400 max-w-xs">Thank you. Your review helps others make better decisions about collaborating with or joining {startup?.name}.</p>
      <button onClick={() => router.push(`/startups/${id}`)}
        className="mt-4 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
        Back to Startup
      </button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
          {startup?.name?.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Review {startup?.name}</h1>
          <p className="text-slate-400 text-sm">Share your honest experience. Reviews require a verified visit.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">How did you visit? *</label>
            <div className="grid grid-cols-2 gap-2">
              {VISIT_TYPES.map(t => (
                <label key={t.value} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm transition-all ${
                  form.visitType === t.value ? 'border-indigo-500/60 bg-indigo-500/10 text-white' : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}>
                  <input type="radio" name="visitType" value={t.value} checked={form.visitType === t.value}
                    onChange={() => setForm(f => ({ ...f, visitType: t.value }))} className="accent-indigo-500" />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {RATING_FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{f.label} *</label>
              <StarInput value={form[f.key as keyof typeof form] as number} onChange={v => setRating(f.key, v)} />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Your Review * <span className="text-slate-500 font-normal">(min 50 characters)</span>
            </label>
            <textarea value={form.reviewText} onChange={e => setForm(f => ({ ...f, reviewText: e.target.value }))} rows={5}
              placeholder="Describe your experience honestly. What was the culture like? Did the product match claims? How professional was the team?"
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-sm resize-none transition-colors" />
            <p className={`text-xs mt-1 ${form.reviewText.length < 50 ? 'text-slate-600' : 'text-emerald-400'}`}>
              {form.reviewText.length}/500
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isAnonymous}
              onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
              className="w-4 h-4 accent-indigo-500 rounded" />
            <div>
              <p className="text-sm text-white">Submit anonymously</p>
              <p className="text-xs text-slate-500">Your name won't appear publicly. We still verify your visit internally.</p>
            </div>
          </label>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-semibold transition-colors">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Star className="w-4 h-4" /> Submit Review</>}
        </button>
      </form>
    </div>
  );
}
