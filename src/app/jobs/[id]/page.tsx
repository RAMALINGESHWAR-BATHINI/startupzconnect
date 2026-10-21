'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Loader2, Briefcase, MapPin, Clock, DollarSign, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { BadgeTier, StageBadge } from '@/components/ui/Badge';

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coverNote, setCoverNote] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isError, setIsError] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(r => setJob(r.data))
      .catch(() => router.push('/jobs'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setSubmitting(true); setFeedback(''); setIsError(false);
    try {
      await api.post(`/jobs/${id}/apply`, { coverNote, resumeUrl: resumeUrl || undefined });
      setApplied(true);
      setFeedback('Application submitted! The startup will review your profile.');
    } catch (err: any) {
      setFeedback(err?.response?.data?.error || 'Failed to apply.'); setIsError(true);
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;
  if (!job) return null;

  const isOwner = user?.id === job.startup?.founderId;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {job.startup?.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-indigo-400 mb-1 font-medium">{job.startup?.name}</p>
                <h1 className="text-2xl font-bold text-white mb-3">{job.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {job.type && <span className="badge badge-gray">{job.type}</span>}
                  {job.location && <span className="badge badge-blue"><MapPin className="w-3 h-3" />{job.location}</span>}
                  <BadgeTier tier={job.startup?.badgeTier || 'NONE'} />
                  <StageBadge stage={job.startup?.stage || 'IDEA'} />
                </div>
              </div>
            </div>

            {(job.salaryMin || job.salaryMax) && (
              <div className="mt-5 flex items-center gap-2 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">
                  ₹{job.salaryMin?.toLocaleString()}{job.salaryMax ? ` – ₹${job.salaryMax.toLocaleString()}` : '+'} / year
                </span>
              </div>
            )}

            {job.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">About this role</h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            )}

            {job.skills && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.split(',').map((s: string) => (
                    <span key={s} className="badge badge-purple">{s.trim()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Apply form */}
          {!isOwner && (
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" /> Apply for this Role
              </h2>
              {applied || !job.isOpen ? (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
                  applied ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-400'}`}>
                  {applied ? <><CheckCircle className="w-4 h-4" /> {feedback}</> : 'This position is no longer accepting applications.'}
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  {feedback && (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${isError ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                      {isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}{feedback}
                    </div>
                  )}
                  <textarea value={coverNote} onChange={e => setCoverNote(e.target.value)} rows={5}
                    placeholder="Tell them why you're a great fit for this role. What experience or skills do you bring? What excites you about this startup?"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none transition-colors" />
                  <input type="url" value={resumeUrl} onChange={e => setResumeUrl(e.target.value)}
                    placeholder="Link to your resume (Google Drive, LinkedIn, portfolio, etc.) — optional"
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
                  {!user ? (
                    <Link href="/login" className="block text-center py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
                      Log in to Apply
                    </Link>
                  ) : (
                    <button type="submit" disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Application'}
                    </button>
                  )}
                </form>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: startup info */}
        <div>
          <Link href={`/startups/${job.startup?.id}`}
            className="block p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-indigo-500/30 card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                {job.startup?.name?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{job.startup?.name}</p>
                <p className="text-xs text-slate-500">{job.startup?.domain}</p>
              </div>
            </div>
            {job.startup?.description && <p className="text-xs text-slate-400 line-clamp-3 mb-4">{job.startup.description}</p>}
            <div className="flex flex-wrap gap-1.5">
              <BadgeTier tier={job.startup?.badgeTier || 'NONE'} />
              <StageBadge stage={job.startup?.stage || 'IDEA'} />
            </div>
            <p className="text-xs text-indigo-400 mt-3">View startup profile →</p>
          </Link>
          <div className="mt-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />Posted {new Date(job.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
