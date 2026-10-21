'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/users')
      .then((res: any) => setUsers(res.data.users ?? []))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading users...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Admin Roles</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 text-sm text-gray-900">#{u.id}</td>
                <td className="py-3 text-sm text-gray-900">{u.name}</td>
                <td className="py-3 text-sm text-gray-600">{u.email}</td>
                <td className="py-3 text-sm"><span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{u.role}</span></td>
                <td className="py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span></td>
                <td className="py-3 text-sm">{u.adminRoles?.length ? u.adminRoles.join(', ') : '<em className="text-gray-400">none</em>'}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-gray-500 text-sm">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
