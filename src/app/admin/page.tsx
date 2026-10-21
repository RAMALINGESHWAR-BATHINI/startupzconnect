'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Loader2, ClipboardList, FileCheck, Flag, Building, Users, Building2, ArrowRight, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminHomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msgForm, setMsgForm] = useState({ email: '', title: '', message: '' });
  const [sending, setSending] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState('');
  const [msgError, setMsgError] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'ADMIN') router.push('/dashboard');
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => { api.get('/admin/summary').then(r => setSummary(r.data)).finally(() => setLoading(false)); }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true); setMsgFeedback(''); setMsgError(false);
    try {
      const res = await api.post('/admin/notify', msgForm);
      setMsgFeedback(res.data.message);
      setMsgForm({ email: '', title: '', message: '' });
    } catch (err: any) {
      setMsgFeedback(err?.response?.data?.error || 'Failed to send.'); setMsgError(true);
    } finally { setSending(false); }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  const queues = [
    { href: '/admin/inspections', label: 'Inspection Reports', count: summary?.pendingInspections || 0, icon: ClipboardList, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { href: '/admin/documents',   label: 'Document Verification', count: summary?.pendingDocuments || 0, icon: FileCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { href: '/admin/reports',     label: 'Content Reports', count: summary?.pendingReports || 0, icon: Flag, color: 'text-red-400', bg: 'bg-red-500/10' },
    { href: '/admin/institutions', label: 'Institution Partners', count: summary?.institutionCount || 0, icon: Building, color: 'text-purple-400', bg: 'bg-purple-500/10', noUrgency: true },
  ];

  const totalPending = (summary?.pendingInspections || 0) + (summary?.pendingDocuments || 0) + (summary?.pendingReports || 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Admin</h1>
        <p className="text-slate-400">
          {totalPending > 0
            ? <span className="text-amber-400 font-medium">{totalPending} item{totalPending !== 1 ? 's' : ''} need your attention</span>
            : 'All queues are clear.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <Building2 className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{summary?.totalStartups ?? '—'}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Startups</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <Users className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-white">{summary?.totalUsers ?? '—'}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Users</p>
        </div>
      </div>

      <div className="space-y-3">
        {queues.map(q => (
          <Link key={q.href} href={q.href}
            className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-indigo-500/30 card-hover">
            <div className={`w-11 h-11 rounded-xl ${q.bg} flex items-center justify-center flex-shrink-0`}>
              <q.icon className={`w-5 h-5 ${q.color}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">{q.label}</p>
              {!q.noUrgency && q.count > 0 && <p className="text-xs text-amber-400">{q.count} pending</p>}
              {!q.noUrgency && q.count === 0 && <p className="text-xs text-slate-500">All clear</p>}
              {q.noUrgency && <p className="text-xs text-slate-500">{q.count} registered</p>}
            </div>
            {!q.noUrgency && q.count > 0 && (
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center flex-shrink-0">{q.count}</span>
            )}
            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Direct message a user */}
      <div className="mt-10 p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-indigo-400" /> Send a Direct Notification
        </h2>
        <form onSubmit={sendMessage} className="space-y-3">
          {msgFeedback && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${msgError ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
              {msgError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}{msgFeedback}
            </div>
          )}
          <input required type="email" placeholder="Recipient's email *" value={msgForm.email}
            onChange={e => setMsgForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500" />
          <input required placeholder="Title *" value={msgForm.title}
            onChange={e => setMsgForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500" />
          <textarea required rows={3} placeholder="Message *" value={msgForm.message}
            onChange={e => setMsgForm(f => ({ ...f, message: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:border-indigo-500" />
          <button type="submit" disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
          </button>
        </form>
      </div>
    </div>
  );
}
