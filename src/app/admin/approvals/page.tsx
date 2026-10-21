'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/access-requests')
      .then((res: any) => setRequests(res.data.requests ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading approvals...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Access Requests</h2>
        <p className="text-sm text-gray-500 mb-4">Delegated approvals automatically notify GLOBAL_ADMIN for tracking.</p>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Reason</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Expires</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-900 font-mono">{r.type}</td>
                <td className="py-3"><span className={`px-2 py-0.5 rounded text-xs ${r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span></td>
                <td className="py-3 text-gray-600">{r.reason}</td>
                <td className="py-3 text-gray-600 font-mono">{new Date(r.expiresAt).toLocaleString()}</td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-500">No access requests found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
