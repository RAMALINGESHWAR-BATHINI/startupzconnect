'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Search, Building2, ChevronLeft, ChevronRight, Briefcase, Loader2, ServerCrash } from 'lucide-react';

interface Startup {
  id: number;
  name: string;
  domain: string;
  description: string;
  founder: { name: string };
  _count: { jobOpenings: number };
  createdAt: string;
}

const domainColors: Record<string, string> = {
  AI: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  FinTech: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  HealthTech: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  EdTech: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  SaaS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  default: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function StartupsPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/startups', { params: { search: query, page, limit: 12 } });
      const data = res.data;
      setStartups(data.startups);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      setError('Failed to load startups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => { fetchStartups(); }, [fetchStartups]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Browse Startups</h1>
        <p className="text-slate-400">Discover {total > 0 ? total.toLocaleString() : 'thousands of'} innovative startups across every domain.</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, domain or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
          />
        </div>
        <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
          Search
        </button>
        {query && (
          <button type="button" onClick={() => { setSearch(''); setQuery(''); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">
            Clear
          </button>
        )}
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
          <ServerCrash className="w-12 h-12 text-slate-600" />
          <p className="text-slate-400">{error}</p>
          <button onClick={fetchStartups} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">Retry</button>
        </div>
      ) : startups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-3">
          <Building2 className="w-12 h-12 text-slate-700" />
          <p className="text-slate-400">No startups found{query ? ` for "${query}"` : ''}.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {startups.map(startup => {
              const colorClass = domainColors[startup.domain] || domainColors.default;
              return (
                <Link key={startup.id} href={`/startups/${startup.id}`}
                  className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/40 transition-all flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {startup.name.charAt(0)}
                    </div>
                    {startup.domain && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass}`}>
                        {startup.domain}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1.5">{startup.name}</h2>
                    <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{startup.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/5">
                    <span>by {startup.founder?.name || 'Unknown'}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {startup._count?.jobOpenings || 0} jobs</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
