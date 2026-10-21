'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, Loader2, MapPin, Video, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

const TYPE_LABELS: Record<string,string> = { DEMO_DAY:'Demo Day', PITCH_COMPETITION:'Pitch Competition', MEETUP:'Meetup', WORKSHOP:'Workshop', OTHER:'Event' };

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvped, setRsvped] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api.get('/events').then(r => setEvents(r.data || [])).finally(() => setLoading(false));
  }, []);

  const rsvp = async (id: number) => {
    if (!user) { window.location.href = '/login'; return; }
    try { await api.post(`/events/${id}/rsvp`); setRsvped(r => ({ ...r, [id]: true })); } catch {}
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Events</h1>
        <p className="text-slate-400">Demo days, pitch competitions, and meetups across the network.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No upcoming events" sub="Startups can post events from their manage page." />
      ) : (
        <div className="space-y-4">
          {events.map((ev: any) => (
            <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="w-16 text-center flex-shrink-0">
                <p className="text-2xl font-bold text-white">{new Date(ev.eventDate).getDate()}</p>
                <p className="text-xs text-slate-500 uppercase">{new Date(ev.eventDate).toLocaleDateString('en-IN', { month: 'short' })}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-purple text-xs">{TYPE_LABELS[ev.type]}</span>
                  {ev.startup?.name && <span className="text-xs text-slate-500">by {ev.startup.name}</span>}
                  {!ev.startup?.name && <span className="text-xs text-slate-500">by {ev.organizerName}</span>}
                </div>
                <p className="font-semibold text-white">{ev.title}</p>
                {ev.description && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{ev.description}</p>}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                  {ev.isVirtual ? <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Virtual</span> : ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>}
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ev._count?.rsvps || 0} attending</span>
                </div>
              </div>
              <button onClick={() => rsvp(ev.id)} disabled={rsvped[ev.id]}
                className="flex-shrink-0 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {rsvped[ev.id] ? "You're in!" : 'RSVP'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
