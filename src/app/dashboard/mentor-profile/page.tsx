'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Lightbulb, Loader2, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function MentorProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ mentorExpertise: '', mentorAvailability: '2 hrs/month', mentorBio: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.put('/auth/mentor-profile', form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save profile.');
    } finally { setSaving(false); }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center"><Lightbulb className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mentor Profile</h1>
          <p className="text-slate-400 text-sm">Offer founders your time and expertise. Visible in the public mentor directory.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
        {success && <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"><CheckCircle className="w-4 h-4 flex-shrink-0" />Mentor profile is live!</div>}

        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Expertise * <span className="text-slate-500 font-normal">(comma-separated)</span></label>
            <input required value={form.mentorExpertise} onChange={e => setForm(f => ({ ...f, mentorExpertise: e.target.value }))}
              placeholder="e.g. Fundraising, GTM Strategy, B2B SaaS"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Availability</label>
            <input value={form.mentorAvailability} onChange={e => setForm(f => ({ ...f, mentorAvailability: e.target.value }))}
              placeholder="e.g. 2 hrs/month"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio *</label>
            <textarea required rows={5} value={form.mentorBio} onChange={e => setForm(f => ({ ...f, mentorBio: e.target.value }))}
              placeholder="Your background, what you've built or advised on, and how you like to help founders."
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-sm resize-none" />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-semibold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Save Mentor Profile
        </button>
      </form>
    </div>
  );
}
