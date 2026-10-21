'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Rocket, Menu, X, LogOut, LayoutDashboard, User as UserIcon, Settings,
  ChevronDown, PlusCircle, TrendingUp, Shield, Building2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { BadgeTier } from './ui/Badge';

const NAV_LINKS = [
  { href: '/startups',    label: 'Startups' },
  { href: '/jobs',        label: 'Jobs' },
  { href: '/investments', label: 'Invest' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isFounder = user?.role === 'STARTUP' || user?.role === 'ADMIN';
  const isInvestor = user?.role === 'INVESTOR' || user?.role === 'ADMIN';

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-white">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span>startupZ<span className="text-indigo-400">connect</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
          ))}
          {user && <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>}
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {user.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">{user.name.split(' ')[0]}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-slate-900 border border-white/10 p-2 shadow-2xl backdrop-blur-xl animate-fade-in">
                  <div className="px-3 py-2 mb-2 border-b border-white/5">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Signed in as</p>
                    <p className="text-sm text-white font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <div className="mt-1.5">
                      <span className="badge badge-blue text-xs">{user.role}</span>
                    </div>
                  </div>

                  <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link href="/dashboard/profile" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <UserIcon className="w-4 h-4" /> Edit Profile
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>

                  {isFounder && (<>
                    <div className="my-1 border-t border-white/5" />
                    <Link href="/dashboard/startups/create" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors">
                      <PlusCircle className="w-4 h-4" /> Create Startup
                    </Link>
                    <Link href="/dashboard/inspection/request" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors">
                      <Shield className="w-4 h-4" /> Request Inspection
                    </Link>
                  </>)}

                  {isInvestor && (<>
                    <div className="my-1 border-t border-white/5" />
                    <Link href="/dashboard/investor-profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors">
                      <TrendingUp className="w-4 h-4" /> Investor Profile
                    </Link>
                  </>)}

                  <div className="my-1 border-t border-white/5" />
                  <button onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Log in</Link>
              <Link href="/register" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-slate-950 px-4 py-4 flex flex-col gap-1 text-sm">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors">{l.label}</Link>
          ))}
          {user ? (<>
            <Link href="/dashboard" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5">Dashboard</Link>
            <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5">Profile</Link>
            <Link href="/dashboard/settings" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5">Settings</Link>
            {isFounder && <Link href="/dashboard/startups/create" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-indigo-400">Create Startup</Link>}
            {isFounder && <Link href="/dashboard/inspection/request" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-indigo-400">Request Inspection</Link>}
            {isInvestor && <Link href="/dashboard/investor-profile" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-emerald-400">Investor Profile</Link>}
            <button onClick={() => { logout(); setOpen(false); }} className="text-left px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10">Sign Out</button>
          </>) : (<>
            <Link href="/login" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-slate-300 hover:text-white">Log in</Link>
            <Link href="/register" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-indigo-400 font-semibold">Get Started →</Link>
          </>)}
        </div>
      )}
    </nav>
  );
}
