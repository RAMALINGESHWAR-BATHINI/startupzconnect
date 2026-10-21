import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminDevPage() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dev')
      .then((res: any) => setData(res.data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading dev data...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Health</h2>
        <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
          <div className="text-xs text-green-600 font-semibold uppercase">Status</div>
          <div className="text-2xl font-bold text-gray-900">{data.health?.status ?? '—'}</div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Integrations</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {Object.entries(data.integrations ?? {}).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{String(v)}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-sm text-gray-500">{data.note}</p>
      </div>
    </div>
  );
}
