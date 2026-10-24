'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

const SUBJECTS = ['General Inquiry','Account/Login Issue','Startup Listing','Feedback/Suggestion','Security Issue','Other'];

export default function ContactPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (user?.email) setEmail(user.email); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !message) { setError('Email and message are required.'); return; }
    setLoading(true);
    try {
      await api.post('/contact', { email, subject, message });
      setSuccess('Message sent successfully.');
      setMessage('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to send message.');
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Contact Us</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {success && <div className="text-emerald-400 text-sm">{success}</div>}
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm">
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Message</label>
            <textarea required maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} rows={5} className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm disabled:opacity-60">
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
        <p className="text-slate-500 text-xs mt-4">Or email us directly at <a href="mailto:startupzconnect@gmail.com" className="text-indigo-400">startupzconnect@gmail.com</a></p>
      </div>
    </main>
  );
}
