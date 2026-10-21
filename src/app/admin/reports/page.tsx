'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, Flag, Trash2, CheckCircle } from 'lucide-react';

export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!authLoading && user && user.role !== 'ADMIN') router.push('/dashboard');
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => { api.get('/admin/reports').then(r => setReports(r.data || [])).finally(() => setLoading(false)); }, []);

  const decide = async (id: number, action: 'remove_content' | 'dismiss') => {
    setActing(a => ({ ...a, [id]: true }));
    try {
      await api.patch(`/admin/reports/${id}`, { action });
      setReports(prev => prev.filter(r => r.id !== id));
    } finally { setActing(a => ({ ...a, [id]: false })); }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center"><Flag className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-white">Content Reports</h1>
          <p className="text-slate-400 text-sm">Flagged content stays live until reviewed here (policy §6.3).</p>
        </div>
      </div>
      {reports.length === 0 ? (
        <p className="text-center text-slate-400 py-20">No pending reports.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r: any) => (
            <div key={r.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-amber text-xs">{r.contentType}</span>
                <span className="text-xs text-slate-500">Reported by {r.reporter?.name}</span>
              </div>
              <p className="text-sm text-white mb-2">"{r.reason}"</p>
              {r.review && (
                <div className="p-3 rounded-lg bg-slate-900/60 mb-3">
                  <p className="text-xs text-slate-500 mb-1">Review on {r.review.startup?.name}:</p>
                  <p className="text-sm text-slate-300">{r.review.reviewText}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => decide(r.id, 'dismiss')} disabled={acting[r.id]}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-60 text-slate-300 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Dismiss (keep content)
                </button>
                <button onClick={() => decide(r.id, 'remove_content')} disabled={acting[r.id]}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 disabled:opacity-60 text-red-400 text-sm font-medium">
                  <Trash2 className="w-4 h-4" /> Remove Content
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
