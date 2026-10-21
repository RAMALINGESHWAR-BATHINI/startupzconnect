'use client';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-white hover:opacity-90 transition-opacity">
              <img src="/favicon.ico" alt="startupZconnect logo" className="w-8 h-8 rounded-lg" />
              <span>startupZ<span className="text-indigo-400">connect</span></span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Empowering startups, founders, and professionals through meaningful connections, collaboration,
              and career opportunities.
            </p>
          </div>

          {/* Common Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Common Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/startups" className="text-slate-400 hover:text-white transition-colors">Startups</Link></li>
              <li><Link href="/jobs" className="text-slate-400 hover:text-white transition-colors">Jobs</Link></li>
              <li><Link href="/investments" className="text-slate-400 hover:text-white transition-colors">Invest</Link></li>
              <li><Link href="/cofounders" className="text-slate-400 hover:text-white transition-colors">Find a Co-founder</Link></li>
              <li><Link href="/mentors" className="text-slate-400 hover:text-white transition-colors">Mentors</Link></li>
              <li><Link href="/events" className="text-slate-400 hover:text-white transition-colors">Events</Link></li>
              <li><Link href="/grants" className="text-slate-400 hover:text-white transition-colors">Grants &amp; Schemes</Link></li>
              <li><Link href="/press" className="text-slate-400 hover:text-white transition-colors">Press Requests</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/register" className="text-slate-400 hover:text-white transition-colors">Join Us</Link></li>
              <li><Link href="/login" className="text-slate-400 hover:text-white transition-colors">Login</Link></li>
              <li><Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/dashboard/startups/create" className="text-slate-400 hover:text-white transition-colors">Create Startup</Link></li>
              <li><Link href="/dashboard/profile" className="text-slate-400 hover:text-white transition-colors">Profile</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-slate-400">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>startupzconnect@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; 2026 startupZconnect. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
