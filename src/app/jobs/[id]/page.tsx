'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Briefcase, Building2, Loader2 } from 'lucide-react';

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(res => setJob(res.data))
      .catch(() => router.push('/jobs'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const apply = async () => {
    if (!user) { router.push('/login'); return; }
    setApplying(true);
    setFeedback('');
    try {
      await api.post(`/jobs/${id}/apply`, {});
      setFeedback('✅ Application submitted! The startup will review your profile.');
    } catch (err: any) {
      setFeedback(`❌ ${err?.response?.data?.error || 'Failed to apply.'}`);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;
  if (!job) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </button>

      <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] mb-6">
        <div className="flex items-start gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {job.startup?.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{job.title}</h1>
            <p className="text-slate-400 text-sm">{job.startup?.name} · {job.type || 'Open Role'}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          {job.skills && (
            <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
              <p className="text-slate-400 mb-1 font-medium text-xs uppercase tracking-wider">Skills Required</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {job.skills.split(',').map((s: string) => (
                  <span key={s} className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs">{s.trim()}</span>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
            <p className="text-slate-400 mb-1 font-medium text-xs uppercase tracking-wider">About the company</p>
            <p className="text-slate-300 mt-1">{job.startup?.description || 'No description available.'}</p>
          </div>
        </div>
      </div>

      {feedback && (
        <p className={`mb-4 text-sm px-4 py-3 rounded-lg border ${feedback.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {feedback}
        </p>
      )}

      <button onClick={apply} disabled={applying}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
        {applying ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</> : <><Briefcase className="w-4 h-4" /> Apply Now</>}
      </button>
    </div>
  );
}
