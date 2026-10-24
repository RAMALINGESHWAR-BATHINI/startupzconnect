'use client';
import { useEffect, useState } from 'react';

export default function SavedPage() {
  const [items, setItems] = useState<any[]>([]);
  const [orgId, setOrgId] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/me/saved-organizations');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setError('Failed to load'); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const res = await fetch('/api/me/saved-organizations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: parseInt(orgId) }),
    });
    if (!res.ok) { setError((await res.json()).error || 'Save failed'); return; }
    setOrgId(''); load();
  };

  const unsave = async (id: number) => {
    await fetch(`/api/me/saved-organizations?organizationId=${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Saved Organizations</h1>
      <div className="mb-4 flex gap-2">
        <input className="border p-2" placeholder="Organization ID" value={orgId} onChange={(e) => setOrgId(e.target.value)} />
        <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={save}>Save</button>
      </div>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {items.length === 0 && <p className="text-gray-500">None saved.</p>}
      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id} className="border p-3 rounded flex justify-between">
            <span>{s.organization?.name || s.organizationId}</span>
            <button className="text-red-600" onClick={() => unsave(s.organizationId)}>Unsave</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
