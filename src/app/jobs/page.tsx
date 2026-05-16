'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Search, Briefcase, ChevronLeft, ChevronRight, Loader2, ServerCrash, Clock } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  skills: string;
  type: string;
  startup: { id: number; name: string; domain: string };
  createdAt: string;
}

const typeColors: Record<string, string> = {
  'Full-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Part-time': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Internship': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Contract': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/jobs', { params: { search: query, page, limit: 12 } });
      setJobs(res.data.jobs);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch {
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setQuery(search); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Job Board</h1>
        <p className="text-slate-400">{total > 0 ? `${total.toLocaleString()} open positions` : 'Thousands of open positions'} across cutting-edge startups.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or skills..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
        </div>
        <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">Search</button>
        {query && (
          <button type="button" onClick={() => { setSearch(''); setQuery(''); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">Clear</button>
        )}
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <ServerCrash className="w-12 h-12 text-slate-600" />
          <p className="text-slate-400">{error}</p>
          <button onClick={fetchJobs} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Retry</button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center py-32 gap-3 text-center">
          <Briefcase className="w-12 h-12 text-slate-700" />
          <p className="text-slate-400">No jobs found{query ? ` for "${query}"` : ''}.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {jobs.map(job => (
              <Link href={`/jobs/${job.id}`} key={job.id}
                className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/40 transition-all flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {job.startup?.name?.charAt(0)}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${typeColors[job.type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    {job.type || 'Open'}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1">{job.title}</h2>
                  <p className="text-sm text-slate-400 mb-1">{job.startup?.name}</p>
                  {job.skills && <p className="text-xs text-slate-500 leading-relaxed">{job.skills}</p>}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-3 border-t border-white/5">
                  <Clock className="w-3 h-3" />
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 text-sm transition-colors">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 text-sm transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
