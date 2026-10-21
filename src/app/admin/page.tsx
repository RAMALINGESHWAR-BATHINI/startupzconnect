import Link from 'next/link';

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Total Users', value: '—', note: 'Real-time counts require database integration.' },
    { label: 'Admin Assignments', value: '—', note: 'Configure roles in /admin/roles.' },
    { label: 'Pending Approvals', value: '—', note: 'Review requests in /admin/approvals.' },
    { label: 'Security Incidents', value: '—', note: 'View incidents in /admin/security.' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.note}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/users" className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition">
            Manage Users
          </Link>
          <Link href="/admin/roles" className="p-4 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-700 hover:bg-purple-100 transition">
            Manage Roles
          </Link>
          <Link href="/admin/approvals" className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700 hover:bg-amber-100 transition">
            Review Approvals
          </Link>
          <Link href="/admin/audit-logs" className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition">
            View Audit Logs
          </Link>
          <Link href="/admin/security" className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 hover:bg-red-100 transition">
            Security Events
          </Link>
          <Link href="/admin/settings" className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700 hover:bg-indigo-100 transition">
            Settings
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
        <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
          <li>All admin actions are enforced server-side and audited.</li>
          <li>Role assignments require independent approval for sensitive roles (GLOBAL_ADMIN, SEC_ADMIN, DATA_ADMIN).</li>
          <li>Dashboard values show "—" until live database integration is configured.</li>
          <li>Never share admin credentials or session tokens.</li>
        </ul>
      </div>
    </div>
  );
}
