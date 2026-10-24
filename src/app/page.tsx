'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Search, Building2, Users, TrendingUp, Zap, Shield, Globe, Rocket, Briefcase, Sparkles } from 'lucide-react';
import api from '@/lib/api';

export default function Home() {
  const [stats, setStats] = useState<{ startups: number; jobs: number; investments: number } | null>(null);

  useEffect(() => {
    // Fetch real counts from the API
Promise.all([
  api.get('/startups', { params: { limit: 1 } }),
  api.get('/jobs', { params: { limit: 1 } }),
  api.get('/investments'),
]).then(([s, j, i]) => {
  setStats({ startups: s.data.total || 0, jobs: j.data.total || 0, investments: i.data.total || 0 });
}).catch(() => {});
  }, []);

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K+` : n > 0 ? `${n}+` : '—';

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center text-center px-4 pt-28 pb-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium text-sm mb-8 border border-indigo-500/20 backdrop-blur-sm">
          <Zap className="w-3.5 h-3.5" />
          Built for startups &amp; investors
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <img src="/favicon.ico" alt="startupZconnect logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg shadow-indigo-500/30" />
            <span className="gradient-text-hero">startupZconnect</span>
          </div>
          <span className="gradient-text-accent">Connect. Collaborate. Build.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Discover innovative startups, collaborate with visionary founders,
          land your next tech role, and express investment interest — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/startups" className="group flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50">
            Explore Startups <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/register" className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-base transition-all border border-white/10">
            Join the Network
          </Link>
        </div>

{/* Real stats cards below */}
      </section>

      {/* Stats Cards */}
      <section className="max-w-6xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10', title: stats ? fmt(stats.startups) : '…', sub: 'Active startups listed across all domains' },
          { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', title: stats ? fmt(stats.jobs) : '…', sub: 'Open positions across cutting-edge startups' },
          { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: stats ? fmt(stats.investments) : '…', sub: 'Active investment opportunities' },
        ].map(({ icon: Icon, color, bg, title, sub }) => (
          <div key={sub} className="group p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-5 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{sub}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16 pb-32">
        <h2 className="text-3xl font-bold text-center text-white mb-4">Everything you need to grow</h2>
        <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">From discovery to investment, we cover every step of your startup journey.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Search, title: 'Smart Discovery', desc: 'Find startups, companies, and jobs by name, domain, or description.', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { icon: Users, title: 'Collaboration Hub', desc: 'Connect with startup founders and explore collaboration opportunities.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { icon: TrendingUp, title: 'Investment Opportunities', desc: 'Discover promising startups and express interest in potential investments.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Building2, title: 'Startup Careers', desc: 'Explore startup jobs and manage your applications.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: Sparkles, title: 'Startup Showcase', desc: 'Build your startup profile to highlight your vision, products, and progress.', color: 'text-rose-400', bg: 'bg-rose-500/10' },
            { icon: Globe, title: 'Startup Network', desc: 'Discover founders, investors, and ecosystem connections to grow your network.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

