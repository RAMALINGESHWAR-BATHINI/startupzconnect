'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminGrantsPage() {
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/grants')
      .then((res: any) => setGrants(res.data.grants ?? []))
      .catch(() => setError('Failed to load grants.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading grants...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Grants</h2>
        <p className="text-sm text-gray-500 mb-4">Active role assignments. Sensitive roles (GLOBAL_ADMIN, SEC_ADMIN, DATA_ADMIN) require independent approval.</p>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Granted At</th>
            </tr>
          </thead>
          <tbody>
            {grants.length === 0 ? (
              <tr><td colSpan={3} className="py-4 text-center text-sm text-gray-500">No active grants.</td></tr>
            ) : (
              grants.map((g) => (
                <tr key={`${g.userId}-${g.role}`} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-900">{g.user?.email ?? g.userId}</td>
                  <td className="py-3 text-sm text-gray-900 font-medium">{g.role}</td>
                  <td className="py-3 text-sm text-gray-600">{new Date(g.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
