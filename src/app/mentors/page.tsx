'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Lightbulb, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MentorsPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mentors').then(r => setMentors(r.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Mentors</h1>
        <p className="text-slate-400">Experienced operators offering time, not money.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : mentors.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No mentors listed yet" sub="Mentor profiles will appear here once created." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mentors.map((m: any) => (
            <div key={m.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold text-lg mb-4">
                {m.name.charAt(0)}
              </div>
              <p className="font-semibold text-white mb-1">{m.name}</p>
              {m.mentorAvailability && <p className="text-xs text-slate-500 mb-3">{m.mentorAvailability}</p>}
              <p className="text-sm text-slate-400 line-clamp-3 mb-4">{m.mentorBio}</p>
              <div className="flex flex-wrap gap-1.5">
                {m.mentorExpertise?.split(',').map((s: string) => <span key={s} className="badge badge-amber text-xs">{s.trim()}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
