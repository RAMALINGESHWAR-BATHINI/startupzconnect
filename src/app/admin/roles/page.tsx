import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/roles')
      .then((res: any) => setRoles(res.data.roles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading roles...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Administrator Roles</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Active</th>
              <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Sensitive</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-b border-gray-100">
                <td className="py-3 text-sm text-gray-900 font-medium">{r.id}</td>
                <td className="py-3 text-sm text-gray-600">{r.description}</td>
                <td className="py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{String(r.active)}</span></td>
                <td className="py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${r.sensitive ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{String(r.sensitive)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Permissions</h2>
        <p className="text-sm text-gray-500">Permissions are defined in src/lib/permissions.ts and enforced server-side. Custom role definitions are managed through the registry.</p>
      </div>
    </div>
  );
}
