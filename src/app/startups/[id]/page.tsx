'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Building2, Briefcase, Users, TrendingUp, ArrowLeft, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function StartupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collabMsg, setCollabMsg] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  const [investMsg, setInvestMsg] = useState('');
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get(`/startups/${id}`)
      .then(res => setStartup(res.data))
      .catch(() => router.push('/startups'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const submit = async (type: string, data: object) => {
    if (!user) { router.push('/login'); return; }
    setSubmitting(s => ({ ...s, [type]: true }));
    setFeedback(f => ({ ...f, [type]: '' }));
    try {
      await api.post(`/${type}`, data);
      setFeedback(f => ({ ...f, [type]: 'Success! Your request has been submitted.' }));
    } catch (err: any) {
      setFeedback(f => ({ ...f, [type]: err?.response?.data?.error || 'Something went wrong.' }));
    } finally {
      setSubmitting(s => ({ ...s, [type]: false }));
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;
  if (!startup) return null;

  const isOwner = user?.id === startup.founderId;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to startups
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-10 p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
          {startup.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{startup.name}</h1>
            {startup.domain && (
              <span className="px-3 py-1 rounded-full text-sm font-medium border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                {startup.domain}
              </span>
            )}
          </div>
          <p className="text-slate-400 mb-4 leading-relaxed">{startup.description || 'No description provided.'}</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span>👤 Founded by <span className="text-slate-300 font-medium">{startup.founder?.name}</span></span>
            <span>📧 {startup.founder?.email}</span>
            <span>💼 {startup._count?.collaborationRequests || 0} collaboration requests</span>
            <span>💰 {startup._count?.investmentInterests || 0} investors interested</span>
          </div>
        </div>
        {isOwner && (
          <Link href={`/dashboard/startups/${startup.id}/manage`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            Manage <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: jobs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-400" /> Open Positions</h2>
            {startup.jobOpenings?.length === 0 ? (
              <p className="text-slate-500 text-sm">No open positions at this time.</p>
            ) : (
              <div className="space-y-3">
                {startup.jobOpenings?.map((job: any) => (
                  <Link href={`/jobs/${job.id}`} key={job.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-900 hover:border-indigo-500/30 transition-all group">
                    <div>
                      <p className="font-medium text-white group-hover:text-indigo-300 transition-colors">{job.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{job.skills} · {job.type}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Open</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: action panels */}
        <div className="space-y-5">
          {/* Collaborate */}
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-purple-400" /> Collaborate</h3>
            <textarea value={collabMsg} onChange={e => setCollabMsg(e.target.value)} rows={3}
              placeholder="Tell them why you want to collaborate..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 text-sm resize-none mb-3 transition-colors" />
            {feedback.collaboration && (
              <p className={`text-xs mb-2 ${feedback.collaboration.startsWith('Success') ? 'text-emerald-400' : 'text-red-400'}`}>{feedback.collaboration}</p>
            )}
            <button onClick={() => submit('collaboration', { startupId: startup.id, message: collabMsg })}
              disabled={submitting.collaboration}
              className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {submitting.collaboration ? <><Loader2 className="w-3 h-3 animate-spin" /> Sending...</> : 'Send Request'}
            </button>
          </div>

          {/* Invest */}
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Express Interest</h3>
            <input type="number" value={investAmount} onChange={e => setInvestAmount(e.target.value)}
              placeholder="Amount (USD, optional)"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm mb-2 transition-colors" />
            <textarea value={investMsg} onChange={e => setInvestMsg(e.target.value)} rows={2}
              placeholder="Your investment thesis..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm resize-none mb-3 transition-colors" />
            {feedback.investments && (
              <p className={`text-xs mb-2 ${feedback.investments.startsWith('Success') ? 'text-emerald-400' : 'text-red-400'}`}>{feedback.investments}</p>
            )}
            <button onClick={() => submit('investments', { startupId: startup.id, amount: investAmount, message: investMsg })}
              disabled={submitting.investments}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {submitting.investments ? <><Loader2 className="w-3 h-3 animate-spin" /> Submitting...</> : 'Invest Interest'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
