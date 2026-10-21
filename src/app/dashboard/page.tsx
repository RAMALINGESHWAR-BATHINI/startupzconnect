'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Briefcase, TrendingUp, Users, Plus,
  Loader2, ArrowRight, Clock
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myStartups, setMyStartups] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [myCollabs, setMyCollabs] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setDataLoading(true);
      const results = await Promise.allSettled([
        (user.role === 'STARTUP' || user.role === 'ADMIN')
          ? api.get('/startups', { params: { limit: 50 } })
          : Promise.resolve(null),
        api.get('/jobs/my/applications'),
        api.get('/investments/my'),
        api.get('/collaboration/my'),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value) {
        const data = results[0].value.data;
        setMyStartups(
          (data.startups || [])
            .filter((s: any) => s.founder?.id === user.id || user.role === 'ADMIN')
            .slice(0, 5)
        );
      }
      if (results[1].status === 'fulfilled') setMyApplications((results[1].value as any).data.slice(0, 5));
      if (results[2].status === 'fulfilled') setMyInvestments((results[2].value as any).data.slice(0, 5));
      if (results[3].status === 'fulfilled') setMyCollabs((results[3].value as any).data.slice(0, 5));
      setDataLoading(false);
    };
    fetchAll();
  }, [user]);

  if (authLoading || !user) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  const statusColor = (status: string) => {
    if (status === 'ACCEPTED') return 'text-emerald-400';
    if (status === 'REJECTED') return 'text-red-400';
    if (status === 'REVIEWED') return 'text-amber-400';
    return 'text-slate-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400">Welcome back, <span className="text-white font-medium">{user.name}</span> ·{' '}
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{user.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/profile"
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-colors">
            Edit Profile
          </Link>
          <Link href="/dashboard/settings"
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-colors">
            Settings
          </Link>
          {(user.role === 'STARTUP' || user.role === 'ADMIN') && (
            <Link href="/dashboard/startups/create"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Create Startup
            </Link>
          )}
        </div>
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : (
        <div className="space-y-10">
          {/* Stats Bar — real data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Your Startups', value: myStartups.length, icon: Building2, color: 'text-blue-400', show: user.role === 'STARTUP' || user.role === 'ADMIN' },
              { label: 'Job Applications', value: myApplications.length, icon: Briefcase, color: 'text-indigo-400', show: true },
              { label: 'Collab Requests', value: myCollabs.length, icon: Users, color: 'text-purple-400', show: true },
              { label: 'Investment Interests', value: myInvestments.length, icon: TrendingUp, color: 'text-emerald-400', show: true },
            ].filter(s => s.show).map(s => (
              <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Startups */}
            {(user.role === 'STARTUP' || user.role === 'ADMIN') && (
              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-white flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-400" /> My Startups</h2>
                  <Link href="/dashboard/startups/create" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">New <Plus className="w-3 h-3" /></Link>
                </div>
                {myStartups.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500 text-sm mb-3">You haven&apos;t created any startups yet.</p>
                    <Link href="/dashboard/startups/create" className="text-indigo-400 text-sm hover:text-indigo-300">Create your first startup →</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myStartups.map(s => (
                      <Link href={`/startups/${s.id}`} key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors truncate">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.domain || 'No domain'}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Collaboration Requests — real data */}
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h2 className="font-semibold text-white mb-5 flex items-center gap-2"><Users className="w-5 h-5 text-purple-400" /> My Collaboration Requests</h2>
              {myCollabs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm mb-3">No collaboration requests yet.</p>
                  <Link href="/startups" className="text-indigo-400 text-sm hover:text-indigo-300">Browse startups →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myCollabs.map((c: any) => (
                    <Link href={`/startups/${c.startup?.id}`} key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {c.startup?.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.startup?.name}</p>
                        <p className="text-xs text-slate-500">{c.startup?.domain || 'General'}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">Pending</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* My Investment Interests — real data */}
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h2 className="font-semibold text-white mb-5 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> My Investment Interests</h2>
              {myInvestments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm mb-3">No investment interests yet.</p>
                  <Link href="/investments" className="text-indigo-400 text-sm hover:text-indigo-300">Express interest →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myInvestments.map((inv: any) => (
                    <Link href={`/startups/${inv.startup?.id}`} key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {inv.startup?.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{inv.startup?.name}</p>
                        <p className="text-xs text-slate-500">{inv.amount ? `$${inv.amount.toLocaleString()}` : 'Amount not specified'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* My Job Applications — real data */}
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-400" /> My Job Applications</h2>
                <Link href="/jobs" className="text-xs text-indigo-400 hover:text-indigo-300">Browse jobs →</Link>
              </div>
              {myApplications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm mb-3">No applications yet.</p>
                  <Link href="/jobs" className="text-indigo-400 text-sm hover:text-indigo-300">Browse open jobs →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myApplications.map((app: any) => (
                    <Link href={`/jobs/${app.job?.id}`} key={app.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors">
                      <Briefcase className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{app.job?.title}</p>
                        <p className="text-xs text-slate-500">{app.job?.startup?.name}</p>
                      </div>
                      <span className={`text-xs font-medium ${statusColor(app.status)}`}>{app.status}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
