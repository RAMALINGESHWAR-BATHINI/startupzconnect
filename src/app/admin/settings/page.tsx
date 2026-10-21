'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminSettingsPage() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/settings')
      .then((res: any) => setData(res.data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading settings...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Multi-device Sessions', value: data.features?.multiDeviceSessions ? 'Enabled' : 'Disabled' },
            { label: 'Turnstile', value: data.features?.turnstile ? 'Configured' : 'Not configured' },
            { label: 'Private R2 Bucket', value: data.features?.r2PrivateBucket ? 'Configured' : 'Not configured' },
          ].map((f) => (
            <div key={f.label} className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase">{f.label}</div>
              <div className="text-sm font-medium text-gray-900">{f.value}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-500">{data.note}</p>
      </div>
    </div>
  );
}
