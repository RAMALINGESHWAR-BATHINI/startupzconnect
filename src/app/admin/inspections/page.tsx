'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, CheckCircle, XCircle, Shield, Building2 } from 'lucide-react';

export default function AdminInspectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!authLoading && user && user.role !== 'ADMIN') router.push('/dashboard');
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    api.get('/admin/inspections')
      .then(r => setInspections(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const decide = async (id: number, approve: boolean) => {
    setActing(a => ({ ...a, [id]: true }));
    try {
      await api.patch(`/admin/inspections/${id}`, { approve });
      setInspections(prev => prev.filter(i => i.id !== id));
    } finally { setActing(a => ({ ...a, [id]: false })); }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-white">Inspection Review Queue</h1>
          <p className="text-slate-400 text-sm">Approve or reject submitted field reports before badges are issued.</p>
        </div>
      </div>

      {inspections.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">No pending reports to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((insp: any) => (
            <div key={insp.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                  {insp.startup?.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{insp.startup?.name}</p>
                  <p className="text-xs text-slate-500">Agent: {insp.agent?.user?.name} · Score: {insp.overallScore?.toFixed(1)}/10</p>
                </div>
                <span className="badge badge-purple">{insp.recommendedBadge?.replace('_',' ')}</span>
              </div>
              {insp.agentNotes && <p className="text-sm text-slate-400 mb-4 p-3 rounded-lg bg-slate-900/50">{insp.agentNotes}</p>}
              <div className="grid grid-cols-5 gap-2 mb-4 text-xs text-center">
                {[['Legit',insp.legitimacyScore],['Team',insp.teamScore],['Product',insp.productScore],['Space',insp.workspaceScore],['Growth',insp.momentumScore]].map(([l,v]) => (
                  <div key={l as string} className="p-2 rounded-lg bg-slate-900/50">
                    <p className="text-slate-500">{l}</p>
                    <p className="text-white font-bold">{v as number}/10</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => decide(insp.id, true)} disabled={acting[insp.id]}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Approve & Issue Badge
                </button>
                <button onClick={() => decide(insp.id, false)} disabled={acting[insp.id]}
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
