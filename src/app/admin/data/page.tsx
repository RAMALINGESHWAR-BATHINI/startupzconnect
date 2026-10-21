'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminDataPage() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/data')
      .then((res: any) => setData(res.data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading data...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="text-xs text-blue-500 font-semibold uppercase">Users</div>
            <div className="text-2xl font-bold text-gray-900">{data.userCount ?? '—'}</div>
          </div>
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <div className="text-xs text-indigo-500 font-semibold uppercase">Startups</div>
            <div className="text-2xl font-bold text-gray-900">{data.startupCount ?? '—'}</div>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
            <div className="text-xs text-purple-500 font-semibold uppercase">Pending Exports</div>
            <div className="text-2xl font-bold text-gray-900">{data.pendingExports ?? '—'}</div>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500">{data.note}</p>
      </div>
    </div>
  );
}
