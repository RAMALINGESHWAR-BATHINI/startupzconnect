'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const ADMIN_NAV = [
  { key: 'admin', label: 'Dashboard', href: '/admin', permission: 'admin.dashboard.read' },
  { key: 'users', label: 'Users', href: '/admin/users', permission: 'admin.users.read' },
  { key: 'roles', label: 'Roles', href: '/admin/roles', permission: 'admin.roles.read' },
  { key: 'security', label: 'Security', href: '/admin/security', permission: 'security.events.read' },
  { key: 'data', label: 'Data', href: '/admin/data', permission: 'data.database_health.read' },
  { key: 'design', label: 'Design', href: '/admin/design', permission: 'design.settings.read' },
  { key: 'dev', label: 'Dev', href: '/admin/dev', permission: 'dev.health.read' },
  { key: 'audit-logs', label: 'Audit Logs', href: '/admin/audit-logs', permission: 'audit.logs.read' },
  { key: 'approvals', label: 'Approvals', href: '/admin/approvals', permission: 'admin.approvals.read' },
  { key: 'settings', label: 'Settings', href: '/admin/settings', permission: 'admin.settings.read' },
];

interface AdminLayoutProps { children: React.ReactNode }

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const { logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    api.get('/auth/me')
      .then((res: any) => {
        setUser(res.data.user);
        setPermissions(res.data.user?.permissions ?? []);
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const can = (permission: string) => permissions.includes(permission);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="text-xl font-bold text-blue-700">StartupzConnect</div>
          <div className="text-xs text-gray-500 mt-1">Admin Control Center</div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {ADMIN_NAV.filter((n) => can(n.permission)).map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.key}
                href={n.href}
                className={`flex items-center px-4 py-3 text-sm rounded-lg transition ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">{navIcon(n.key)}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">{user.email}</div>
          <div className="text-xs font-medium capitalize">{user.adminRoles?.join(', ') || 'user'}</div>
          <button
            onClick={() => { api.post('/auth/logout-all').then(() => { logout().catch(() => {}); setUser(null); router.push('/login'); router.refresh(); }).catch(() => { logout().catch(() => {}); setUser(null); router.push('/login'); router.refresh(); }); }}
            className="w-full text-xs text-red-600 hover:text-red-800 underline mt-2"
          >
            Logout all devices
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentPageLabel(pathname)}</h1>
            <p className="text-gray-500 text-sm">Admin Control Center &bull; {user.adminRoles?.join(', ') || 'user'}</p>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

function navIcon(key: string) {
  const icons: Record<string, string> = {
    admin: '📊', users: '👥', roles: '🔑', security: '🛡️', data: '🗄️',
    design: '🎨', dev: '⚙️', 'audit-logs': '📋', approvals: '✅', settings: '⚙️',
  };
  return icons[key] || '📄';
}

function currentPageLabel(path: string) {
  const labels: Record<string, string> = {
    '/admin': 'Dashboard', '/admin/users': 'User Management', '/admin/roles': 'Role Management',
    '/admin/security': 'Security', '/admin/data': 'Data', '/admin/design': 'Design',
    '/admin/dev': 'Dev', '/admin/audit-logs': 'Audit Logs', '/admin/approvals': 'Approvals',
    '/admin/settings': 'Settings',
  };
  return labels[path] || 'Admin';
}
