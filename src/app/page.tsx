'use client';
import Link from 'next/link';
import { ArrowRight, Search, Building2, Users, TrendingUp, Zap, Shield, Globe } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center text-center px-4 pt-28 pb-24">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium text-sm mb-8 border border-indigo-500/20 backdrop-blur-sm">
          <Zap className="w-3.5 h-3.5" />
          Built for high-growth startups & serious investors
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          <span className="gradient-text-hero">
            Connect With Startups.
          </span>
          <br />
          <span className="gradient-text-accent">
            Build the Future.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          The #1 platform to discover innovative startups, collaborate with visionary founders,
          land your dream tech job, and make smart investment decisions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/startups" className="group flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50">
            Explore Startups <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/register" className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-base transition-all border border-white/10">
            Join the Network
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-6 mt-12 text-sm text-slate-500">
          <span>🚀 10,000+ startups</span>
          <span>•</span>
          <span>💼 50,000+ professionals</span>
          <span>•</span>
          <span>💰 $500M+ in opportunities</span>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10', title: '10,000+', sub: 'Active Startups listed across all domains' },
          { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', title: '50,000+', sub: 'Talented professionals ready to collaborate' },
          { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: '$500M+', sub: 'In investment interests expressed on platform' },
        ].map(({ icon: Icon, color, bg, title, sub }) => (
          <div key={title} className="group p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all">
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
            { icon: Search, title: 'Smart Search', desc: 'Full-text search powered by PostgreSQL across thousands of startups and jobs.', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { icon: Users, title: 'Collaboration Hub', desc: 'Send collaboration requests directly to startup founders and get connected instantly.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { icon: TrendingUp, title: 'Investment Signals', desc: 'Discover promising startups and express investment interest with deal details.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Building2, title: 'Job Board', desc: 'Browse and apply to startup jobs with real-time status tracking on applications.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: Shield, title: 'Secure Auth', desc: 'Enterprise-grade JWT auth with HTTP-only cookies. Your data stays safe.', color: 'text-rose-400', bg: 'bg-rose-500/10' },
            { icon: Globe, title: 'Edge Optimized', desc: 'Powered by Redis caching and indexed PostgreSQL for sub-100ms responses.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
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
