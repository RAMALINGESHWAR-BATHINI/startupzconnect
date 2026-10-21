'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, FileCheck, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function AdminDocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!authLoading && user && user.role !== 'ADMIN') router.push('/dashboard');
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => { api.get('/admin/documents').then(r => setDocs(r.data || [])).finally(() => setLoading(false)); }, []);

  const decide = async (id: number, approve: boolean) => {
    setActing(a => ({ ...a, [id]: true }));
    try {
      await api.patch(`/admin/documents/${id}`, { approve });
      setDocs(prev => prev.filter(d => d.id !== id));
    } finally { setActing(a => ({ ...a, [id]: false })); }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center"><FileCheck className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-white">Document Verification Queue</h1>
          <p className="text-slate-400 text-sm">Approving a first document unlocks the Registered badge (policy §3.2).</p>
        </div>
      </div>
      {docs.length === 0 ? (
        <p className="text-center text-slate-400 py-20">No pending documents to review.</p>
      ) : (
        <div className="space-y-4">
          {docs.map((d: any) => (
            <div key={d.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{d.startup?.name}</p>
                  <p className="text-xs text-slate-500">{d.docType} · Reg. ID on file: {d.startup?.registrationId || 'none'}</p>
                </div>
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
                  View Document <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="flex gap-3">
                <button onClick={() => decide(d.id, true)} disabled={acting[d.id]}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Verify
                </button>
                <button onClick={() => decide(d.id, false)} disabled={acting[d.id]}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 disabled:opacity-60 text-red-400 text-sm font-medium">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
