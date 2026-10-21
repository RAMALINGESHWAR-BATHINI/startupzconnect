import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminPermissionsPage() {
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/permissions?userId=${encodeURIComponent(userId)}`);
      setData(res.data);
    } catch {
      setError('Failed to load permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Permissions Lookup</h2>
        <p className="text-sm text-gray-500 mb-4">Permissions are derived from assigned roles. Enter a user ID to view their effective roles and permissions.</p>
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-48"
          />
          <button onClick={lookup} disabled={loading} className="bg-gray-900 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
            Lookup
          </button>
        </div>
      </div>

      {data && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">User {data.userId}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-xs text-gray-500 uppercase mb-2">Roles</p>
              <ul className="text-sm space-y-1">
                {(data.roles ?? []).map((r: string) => (
                  <li key={r} className="font-medium text-gray-800">{r}</li>
                ))}
                {(data.roles ?? []).length === 0 && <li className="text-sm text-gray-400">None</li>}
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-xs text-gray-500 uppercase mb-2">Permissions</p>
              <ul className="text-sm space-y-1">
                {(data.permissions ?? []).map((p: string) => (
                  <li key={p} className="text-gray-700">{p}</li>
                ))}
                {(data.permissions ?? []).length === 0 && <li className="text-sm text-gray-400">None</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {error && <div className="p-4 text-red-600">{error}</div>}
      {loading && <div className="p-4">Looking up...</div>}
    </div>
  );
}
