'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Bell, Loader2, CheckCheck, ArrowLeft } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const fetchAll = () => api.get('/notifications').then(r => setNotifications(r.data.notifications || [])).finally(() => setLoading(false));
  useEffect(() => { fetchAll(); }, []);

  const openNotification = async (n: any) => {
    if (!n.isRead) {
      await api.post(`/notifications/${n.id}/read`).catch(() => {});
      setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }
    if (n.link) router.push(n.link);
  };

  const markAllRead = async () => {
    await api.post('/notifications/read-all').catch(() => {});
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" sub="Updates about your startups, reviews, and inspections will show up here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <button key={n.id} onClick={() => openNotification(n)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${!n.isRead ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
              <div className="flex items-start gap-3">
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />}
                <div className={!n.isRead ? '' : 'pl-5'}>
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-sm text-slate-400 mt-1">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-2">{new Date(n.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
