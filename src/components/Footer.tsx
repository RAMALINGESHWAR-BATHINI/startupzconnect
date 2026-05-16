'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5 font-bold text-lg text-white">
          <img src="/favicon.ico" alt="Logo" className="w-6 h-6 rounded-md" />
          <span>startupZ<span className="text-indigo-400">connect</span></span>
        </div>
        
        <div className="flex items-center gap-8 text-sm text-slate-500">
          <Link href="/startups" className="hover:text-white transition-colors">Startups</Link>
          <Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link>
          <Link href="/investments" className="hover:text-white transition-colors">Invest</Link>
          <Link href="/login" className="hover:text-white transition-colors">Login</Link>
        </div>

        <p className="text-sm text-slate-600">
          © 2026 StartupConnect. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
