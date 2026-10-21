'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Landmark, Loader2, ExternalLink, Calendar } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function GrantsClient() {
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/grants').then(r => setGrants(r.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Grants & Government Schemes</h1>
        <p className="text-slate-400">Curated funding opportunities most founders never hear about.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : grants.length === 0 ? (
        <EmptyState icon={Landmark} title="No grants listed yet" sub="Our team is curating schemes — check back soon." />
      ) : (
        <div className="space-y-4">
          {grants.map((g: any) => (
            <div key={g.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs text-indigo-400 font-medium mb-1">{g.provider}</p>
                  <h2 className="font-semibold text-white text-lg">{g.name}</h2>
                </div>
                {g.amountRange && <span className="badge badge-green flex-shrink-0">{g.amountRange}</span>}
              </div>
              <p className="text-sm text-slate-400 mb-3">{g.description}</p>
              <p className="text-xs text-slate-500 mb-4"><span className="font-medium text-slate-400">Eligibility:</span> {g.eligibility}</p>
              <div className="flex items-center justify-between">
                {g.deadline && <span className="flex items-center gap-1 text-xs text-amber-400"><Calendar className="w-3 h-3" /> Deadline: {new Date(g.deadline).toLocaleDateString('en-IN')}</span>}
                {g.applyUrl && (
                  <a href={g.applyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 ml-auto">
                    Apply <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
