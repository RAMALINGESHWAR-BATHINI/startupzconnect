'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Loader2, MapPin, Building2, Clock, ClipboardList, Shield } from 'lucide-react';

export default function AgentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
  }, [authLoading, user, router]);

  useEffect(() => {
    api.get('/agent/inspections')
      .then(r => setInspections(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
  );

  const statusColor: Record<string,string> = {
    SCHEDULED: 'badge-blue', IN_PROGRESS: 'badge-amber', SUBMITTED: 'badge-purple',
    APPROVED: 'badge-green', REJECTED: 'badge-gray', FAILED: 'badge-gray',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Field Agent Dashboard</h1>
          <p className="text-slate-400 text-sm">Your assigned inspections</p>
        </div>
      </div>

      {inspections.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">No inspections assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((insp: any) => (
            <Link key={insp.id} href={`/agent/inspections/${insp.id}`}
              className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-indigo-500/30 card-hover">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {insp.startup?.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{insp.startup?.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {insp.startup?.operationalAddress || 'Address not provided'}
                </p>
              </div>
              <span className={`badge ${statusColor[insp.status] || 'badge-gray'}`}>{insp.status.replace('_',' ')}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
