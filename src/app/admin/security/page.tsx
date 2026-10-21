import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminSecurityPage() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/security')
      .then((res: any) => setData(res.data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading security data...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
            <div className="text-xs text-red-500 font-semibold uppercase">Active Sessions</div>
            <div className="text-2xl font-bold text-gray-900">{data.activeSessions ?? '—'}</div>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
            <div className="text-xs text-amber-500 font-semibold uppercase">Auth Failures</div>
            <div className="text-2xl font-bold text-gray-900">{data.recentAuthFailures ?? '—'}</div>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="text-xs text-blue-500 font-semibold uppercase">Incidents</div>
            <div className="text-2xl font-bold text-gray-900">{data.incidents?.length ?? '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
