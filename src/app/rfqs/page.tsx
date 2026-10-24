'use client';
import { useEffect, useState } from 'react';

export default function RfqsPage() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [buyerOrgId, setBuyerOrgId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rfqs');
      const data = await res.json();
      setRfqs(Array.isArray(data) ? data : []);
    } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/rfqs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerOrganizationId: parseInt(buyerOrgId), title, description, category, status: 'OPEN' }),
    });
    if (!res.ok) { setError((await res.json()).error || 'Create failed'); return; }
    setTitle(''); setDescription(''); setCategory(''); setBuyerOrgId('');
    load();
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">RFQs</h1>
      <form onSubmit={create} className="mb-6 space-y-2">
        <input className="border p-2 w-full" placeholder="Buyer Organization ID" value={buyerOrgId} onChange={(e) => setBuyerOrgId(e.target.value)} required />
        <input className="border p-2 w-full" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="border p-2 w-full" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input className="border p-2 w-full" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
        <button className="bg-green-600 text-white px-3 py-2 rounded" type="submit">Create RFQ</button>
      </form>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {loading && <p>Loading...</p>}
      {rfqs.length === 0 && !loading && <p className="text-gray-500">No RFQs.</p>}
      <ul className="space-y-2">
        {rfqs.map((r) => (
          <li key={r.id} className="border p-3 rounded">
            <strong>{r.title}</strong> <span className="text-sm text-gray-500">({r.status})</span>
            <p className="text-sm">{r.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
