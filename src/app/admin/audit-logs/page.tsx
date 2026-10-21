'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs')
      .then((res: any) => setLogs(res.data.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading audit logs...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Logs</h2>
        <p className="text-sm text-gray-500 mb-4">Audit logs are append-only. Ordinary administrators cannot modify or delete records.</p>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Actor</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-600 font-mono">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="py-3 text-gray-600">{l.actorLabel ?? 'system'}</td>
                <td className="py-3 text-gray-900 font-mono">{l.action}</td>
                <td className="py-3 text-gray-600">{l.category}</td>
                <td className="py-3"><span className={`px-2 py-0.5 rounded text-xs ${l.outcome === 'SUCCESS' ? 'bg-green-100 text-green-700' : l.outcome === 'DENIED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{l.outcome}</span></td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">No audit logs found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
