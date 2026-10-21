'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Search, Building2, ChevronLeft, ChevronRight, Briefcase, ServerCrash } from 'lucide-react';
import { SkeletonCard } from '@/components/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { BadgeTier, StageBadge } from '@/components/ui/Badge';

const DOMAINS = ['','AI','FinTech','HealthTech','EdTech','SaaS','E-commerce','Logistics','CleanTech','GameTech','Other'];

export default function StartupsClient() {
  const [startups, setStartups] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStartups = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/startups', { params: { search: query, domain, page, limit: 12 } });
      setStartups(res.data.startups);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch { setError('Failed to load startups. Please try again.'); }
    finally { setLoading(false); }
  }, [query, domain, page]);

  useEffect(() => { fetchStartups(); }, [fetchStartups]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setQuery(search); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Browse Startups</h1>
        <p className="text-slate-400">Discover {total > 0 ? total.toLocaleString() : 'innovative'} startups — verified and community reviewed.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-10">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-60">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, domain or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">Search</button>
        </form>
        <select value={domain} onChange={e => { setDomain(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none">
          <option value="">All domains</option>
          {DOMAINS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {(query || domain) && (
          <button type="button" onClick={() => { setSearch(''); setQuery(''); setDomain(''); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
          <ServerCrash className="w-12 h-12 text-slate-600" />
          <p className="text-slate-400">{error}</p>
          <button onClick={fetchStartups} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">Retry</button>
        </div>
      ) : startups.length === 0 ? (
        <EmptyState icon={Building2} title="No startups found" sub={query ? `No results for "${query}"` : 'Try different filters.'} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {startups.map(startup => (
              <Link key={startup.id} href={`/startups/${startup.id}`}
                className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-indigo-500/30 card-hover flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {startup.name.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {startup.domain && <span className="badge badge-blue text-xs">{startup.domain}</span>}
                    <BadgeTier tier={startup.badgeTier} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{startup.name}</h2>
                  </div>
                  <StageBadge stage={startup.stage} />
                  <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed mt-2">{startup.description || 'No description provided.'}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/5">
                  <span>by {startup.founder?.name || 'Unknown'}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {startup._count?.jobOpenings || 0} jobs</span>
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
