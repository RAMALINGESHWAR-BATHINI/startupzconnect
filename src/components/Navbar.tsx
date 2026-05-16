'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Rocket, Menu, X, LogOut, LayoutDashboard, User as UserIcon, Settings, ChevronDown, PlusCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-white">
          <img src="/favicon.ico" alt="startupZconnect Logo" className="w-8 h-8 rounded-lg" />
          <span>startupZ<span className="text-indigo-400">connect</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link href="/startups" className="hover:text-white transition-colors">Startups</Link>
          <Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link>
          <Link href="/investments" className="hover:text-white transition-colors">Invest</Link>
          {user && <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>}
        </div>

        {/* Desktop Auth / User Dropdown */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                  {user.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">{user.name.split(' ')[0]}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-white/10 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-200">
                  <div className="px-3 py-2 mb-2 border-b border-white/5">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Account</p>
                    <p className="text-sm text-white font-semibold truncate">{user.email}</p>
                  </div>
                  
                  <Link href="/dashboard/profile" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <UserIcon className="w-4 h-4" /> Profile Details
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Settings className="w-4 h-4" /> Account Settings
                  </Link>
                  
                  {(user.role === 'FOUNDER' || user.role === 'ADMIN') && (
                    <Link href="/dashboard/startups/create" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors">
                      <PlusCircle className="w-4 h-4" /> Create Startup
                    </Link>
                  )}

                  <div className="my-1 border-t border-white/5" />
                  
                  <button onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
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

        {/* Mobile toggle */}
        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-slate-950 px-4 py-4 flex flex-col gap-3 text-sm">
          <Link href="/startups" className="text-slate-300 hover:text-white" onClick={() => setOpen(false)}>Browse Startups</Link>
          <Link href="/jobs" className="text-slate-300 hover:text-white" onClick={() => setOpen(false)}>Jobs</Link>
          <Link href="/investments" className="text-slate-300 hover:text-white" onClick={() => setOpen(false)}>Invest</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-slate-300 hover:text-white" onClick={() => setOpen(false)}>Dashboard</Link>
              <Link href="/dashboard/profile" className="text-slate-300 hover:text-white" onClick={() => setOpen(false)}>My Profile</Link>
              <Link href="/dashboard/settings" className="text-slate-300 hover:text-white" onClick={() => setOpen(false)}>Settings</Link>
              <button onClick={() => { logout(); setOpen(false); }} className="text-left text-red-400 hover:text-red-300">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-300 hover:text-white" onClick={() => setOpen(false)}>Log in</Link>
              <Link href="/register" className="text-indigo-400 font-semibold" onClick={() => setOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
