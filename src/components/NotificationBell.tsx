'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import api from '@/lib/api';

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    api.get('/notifications').then(r => {
      setNotifications(r.data.notifications || []);
      setUnreadCount(r.data.unreadCount || 0);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    // Light polling — good enough at Phase 1 scale without adding websockets.
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const openNotification = async (n: any) => {
    if (!n.isRead) {
      await api.post(`/notifications/${n.id}/read`).catch(() => {});
      setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      setUnreadCount(c => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAllRead = async () => {
    await api.post('/notifications/read-all').catch(() => {});
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="relative p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-h-[26rem] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 sticky top-0 bg-slate-900">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-10">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((n: any) => (
                <button key={n.id} onClick={() => openNotification(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-indigo-500/5' : ''}`}>
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />}
                    <div className={n.isRead ? 'pl-3.5' : ''}>
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{new Date(n.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
