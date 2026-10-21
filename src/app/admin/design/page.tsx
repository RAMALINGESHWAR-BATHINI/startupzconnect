import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminDesignPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/design')
      .then((res: any) => setSettings(res.data.settings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading design settings...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Site Settings</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Key</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Value</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s) => (
              <tr key={s.key} className="border-b border-gray-100">
                <td className="py-3 text-sm text-gray-900 font-mono">{s.key}</td>
                <td className="py-3 text-sm text-gray-600 font-mono">{s.draft ?? '—'}</td>
              </tr>
            ))}
            {settings.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-gray-500 text-sm">No settings configured.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
