'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  Building2, Briefcase, Users, TrendingUp, ArrowLeft, Loader2,
  ExternalLink, Globe, MapPin, Calendar, Star, CheckCircle,
  ClipboardList, UserPlus, BookOpen, AlertCircle, Clock
} from 'lucide-react';
import { BadgeTier, StageBadge, OriginBadge } from '@/components/ui/Badge';
import { StarDisplay } from '@/components/ui/StarRating';

const DOMAIN_COLORS: Record<string, string> = {
  AI:'badge-purple', FinTech:'badge-green', HealthTech:'badge-blue',
  EdTech:'badge-amber', SaaS:'badge-blue', default:'badge-gray',
};

function InfoChip({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-slate-400">
      <Icon className="w-3.5 h-3.5 text-slate-600" />{text}
    </span>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value}/10</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all"
          style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

export default function StartupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [startup, setStartup] = useState<any>(null);
  const [inspection, setInspection] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview'|'team'|'worklog'|'reviews'|'inspection'>('overview');
  const [loading, setLoading] = useState(true);
  const [collabMsg, setCollabMsg] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  const [investMsg, setInvestMsg] = useState('');
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      api.get(`/startups/${id}`),
      api.get(`/startups/${id}/reviews`).catch(() => ({ data: [] })),
    ]).then(([sr, rr]) => {
      setStartup(sr.data);
      setReviews(rr.data || []);
      // Check for approved inspection
      if (sr.data.inspections?.length) {
        const approved = sr.data.inspections.find((i: any) => i.status === 'APPROVED');
        setInspection(approved || null);
      }
    }).catch(() => router.push('/startups'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const submit = async (type: string, data: object) => {
    if (!user) { router.push('/login'); return; }
    setSubmitting(s => ({ ...s, [type]: true }));
    setFeedback(f => ({ ...f, [type]: '' }));
    try {
      await api.post(`/${type}`, data);
      setFeedback(f => ({ ...f, [type]: '✓ Submitted successfully!' }));
    } catch (err: any) {
      setFeedback(f => ({ ...f, [type]: err?.response?.data?.error || 'Something went wrong.' }));
    } finally { setSubmitting(s => ({ ...s, [type]: false })); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );
  if (!startup) return null;

  const isOwner = user?.id === startup.founderId;
  const avgRating = reviews.length
    ? (reviews.reduce((a: number, r: any) => a + r.overallRating, 0) / reviews.length).toFixed(1)
    : null;

  const TABS = [
    { key: 'overview',   label: 'Overview',    icon: Building2 },
    { key: 'team',       label: `Team (${startup.teamMembers?.length || 0})`, icon: Users },
    { key: 'worklog',    label: 'Work Log',    icon: BookOpen },
    { key: 'reviews',    label: `Reviews (${reviews.length})`, icon: Star },
    ...(inspection ? [{ key: 'inspection', label: 'Inspection', icon: ClipboardList }] : []),
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to startups
      </button>

      {/* ── HERO HEADER ── */}
      <div className="p-8 rounded-2xl border border-white/8 bg-white/[0.02] mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0 shadow-lg shadow-indigo-500/20">
            {startup.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-white">{startup.name}</h1>
              {startup.domain && (
                <span className={`badge ${DOMAIN_COLORS[startup.domain] ?? DOMAIN_COLORS.default}`}>
                  {startup.domain}
                </span>
              )}
              <BadgeTier tier={startup.badgeTier} />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <StageBadge stage={startup.stage} />
              <OriginBadge origin={startup.originType} />
              {startup.institutionName && (
                <span className="badge badge-purple">🏛 {startup.institutionName}</span>
              )}
            </div>
            <p className="text-slate-400 leading-relaxed mb-4 max-w-2xl">
              {startup.description || 'No description provided.'}
            </p>
            <div className="flex flex-wrap gap-4">
              {startup.operationalAddress && <InfoChip icon={MapPin} text={startup.operationalAddress} />}
              {startup.foundedDate && <InfoChip icon={Calendar} text={`Founded ${new Date(startup.foundedDate).getFullYear()}`} />}
              <InfoChip icon={Users} text={`${startup.employeeCount} employees`} />
              {startup.websiteUrl && (
                <a href={startup.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Globe className="w-3.5 h-3.5" /> Website
                </a>
              )}
              {avgRating && (
                <span className="flex items-center gap-1.5 text-sm text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> {avgRating} ({reviews.length} reviews)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {isOwner && (
              <Link href={`/dashboard/startups/${startup.id}/manage`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
                <ExternalLink className="w-4 h-4" /> Manage
              </Link>
            )}
            {!isOwner && startup.founder?.email && user && (
              <p className="text-xs text-slate-500">📧 {startup.founder.email}</p>
            )}
          </div>
        </div>

        {/* Traction bar */}
        {(startup.monthlyUsers || startup.monthlyRevenue || startup.totalFundingRaised) && (
          <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {startup.monthlyUsers && (
              <div>
                <p className="text-2xl font-bold text-white">{startup.monthlyUsers.toLocaleString()}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Monthly Users</p>
              </div>
            )}
            {startup.monthlyRevenue && (
              <div>
                <p className="text-2xl font-bold text-emerald-400">₹{(startup.monthlyRevenue/1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Monthly Revenue</p>
              </div>
            )}
            {startup.totalFundingRaised && (
              <div>
                <p className="text-2xl font-bold text-amber-400">₹{(startup.totalFundingRaised/100000).toFixed(1)}L</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Total Raised</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 mb-6 border-b border-white/5 overflow-x-auto pb-px">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── MAIN CONTENT ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Jobs */}
              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-400" /> Open Positions
                </h2>
                {(!startup.jobOpenings || startup.jobOpenings.length === 0) ? (
                  <p className="text-slate-500 text-sm py-4">No open positions right now.</p>
                ) : (
                  <div className="space-y-3">
                    {startup.jobOpenings.filter((j: any) => j.isOpen).map((job: any) => (
                      <Link href={`/jobs/${job.id}`} key={job.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-900 hover:border-indigo-500/30 card-hover group">
                        <div>
                          <p className="font-medium text-white group-hover:text-indigo-300 transition-colors">{job.title}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {job.type && <span className="badge badge-gray text-xs">{job.type}</span>}
                            {job.location && <span className="badge badge-blue text-xs">{job.location}</span>}
                            {job.salaryMin && <span className="text-xs text-emerald-400">₹{job.salaryMin.toLocaleString()}–{job.salaryMax?.toLocaleString()}/yr</span>}
                          </div>
                        </div>
                        <span className="badge badge-green text-xs flex-shrink-0">Open</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Work Log preview */}
              {startup.workLogs?.length > 0 && (
                <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-400" /> Recent Updates
                    </h2>
                    <button onClick={() => setActiveTab('worklog')} className="text-xs text-indigo-400 hover:text-indigo-300">View all →</button>
                  </div>
                  <div className="space-y-3">
                    {startup.workLogs.slice(0, 3).map((log: any) => (
                      <div key={log.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/50">
                        <div className="flex items-center gap-2 mb-1.5">
                          {log.milestone && <span className="badge badge-amber text-xs">🏆 Milestone</span>}
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Week of {new Date(log.weekOf).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                          </span>
                          {log.hoursSpent && <span className="text-xs text-slate-600">{log.hoursSpent}h logged</span>}
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{log.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TEAM TAB */}
          {activeTab === 'team' && (
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" /> The Team
              </h2>
              {(!startup.teamMembers || startup.teamMembers.length === 0) ? (
                <p className="text-slate-500 text-sm py-6 text-center">Team members not added yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {startup.teamMembers.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-slate-900/60">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {m.photoUrl
                          ? <img src={m.photoUrl} alt={m.name} className="w-12 h-12 rounded-xl object-cover" />
                          : m.name.charAt(0)
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                          {m.isFounder && <span className="badge badge-purple text-xs">Founder</span>}
                        </div>
                        {m.role && <p className="text-xs text-slate-500 truncate">{m.role}</p>}
                        {m.linkedin && (
                          <a href={m.linkedin} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">LinkedIn →</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WORK LOG TAB */}
          {activeTab === 'worklog' && (
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" /> Build-in-Public Timeline
              </h2>
              {(!startup.workLogs || startup.workLogs.length === 0) ? (
                <div className="text-center py-10">
                  <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No updates posted yet.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-white/5" />
                  <div className="space-y-6 pl-10">
                    {startup.workLogs.map((log: any) => (
                      <div key={log.id} className="relative">
                        <div className={`absolute -left-[1.65rem] top-1 w-3.5 h-3.5 rounded-full border-2 ${
                          log.milestone ? 'bg-amber-500 border-amber-400' : 'bg-slate-800 border-slate-600'
                        }`} />
                        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {log.milestone && <span className="badge badge-amber text-xs">🏆 Milestone</span>}
                            <span className="text-xs text-slate-500">
                              Week of {new Date(log.weekOf).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                            </span>
                            {log.hoursSpent && <span className="text-xs text-slate-600">{log.hoursSpent}h invested</span>}
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{log.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" /> Community Reviews
                </h2>
                {avgRating && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{avgRating}</p>
                    <StarDisplay value={parseFloat(avgRating)} size="sm" />
                    <p className="text-xs text-slate-500 mt-0.5">{reviews.length} reviews</p>
                  </div>
                )}
              </div>
              {reviews.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No reviews yet. Reviews require a verified visit.</p>
              ) : (
                <div className="space-y-5">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="p-5 rounded-xl border border-white/5 bg-slate-900/50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {r.isAnonymous ? 'Anonymous Visitor' : r.user?.name}
                          </p>
                          <span className="badge badge-gray text-xs mt-1">{r.visitType?.replace('_',' ')}</span>
                          {r.verifiedByCheckIn && <span className="badge badge-green text-xs mt-1 ml-1">✓ Verified Visit</span>}
                        </div>
                        <div className="text-right">
                          <StarDisplay value={r.overallRating} size="sm" />
                          <p className="text-xs text-slate-600 mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mb-3 text-xs text-slate-500">
                        <span>Culture: {'★'.repeat(r.cultureRating)}{'☆'.repeat(5-r.cultureRating)}</span>
                        <span>Transparency: {'★'.repeat(r.transparencyRating)}{'☆'.repeat(5-r.transparencyRating)}</span>
                        <span>Team: {'★'.repeat(r.professionalismRating)}{'☆'.repeat(5-r.professionalismRating)}</span>
                        <span>Product: {'★'.repeat(r.productRating)}{'☆'.repeat(5-r.productRating)}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{r.reviewText}</p>
                      {r.startupResponse && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-xs text-indigo-400 font-medium mb-1">Response from {startup.name}:</p>
                          <p className="text-xs text-slate-400">{r.startupResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INSPECTION TAB */}
          {activeTab === 'inspection' && inspection && (
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Field Inspection Report</h2>
                  <p className="text-xs text-slate-500">
                    Visited {inspection.visitedAt ? new Date(inspection.visitedAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '—'}
                    {' · '}Approved by StartupzConnect
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  ['Legitimacy',  inspection.legitimacyScore],
                  ['Team',        inspection.teamScore],
                  ['Product',     inspection.productScore],
                  ['Workspace',   inspection.workspaceScore],
                  ['Momentum',    inspection.momentumScore],
                ].map(([label, val]) => val && (
                  <ScoreBar key={label as string} label={label as string} value={val as number} />
                ))}
              </div>
              {inspection.overallScore && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 mb-5">
                  <div className="text-3xl font-bold text-indigo-400">{inspection.overallScore.toFixed(1)}</div>
                  <div>
                    <p className="text-sm font-medium text-white">Overall Score</p>
                    <p className="text-xs text-slate-400">Out of 10 · Reviewed by StartupzConnect team</p>
                  </div>
                </div>
              )}
              {inspection.agentNotes && (
                <div className="p-4 rounded-xl border border-white/5 bg-slate-900/50">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Agent Notes</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{inspection.agentNotes}</p>
                </div>
              )}
              {/* Photo grids */}
              {[
                { label: 'Office Exterior', key: 'exteriorPhotos' },
                { label: 'Office Interior', key: 'interiorPhotos' },
                { label: 'Team Photos',     key: 'teamPhotos' },
                { label: 'Product / Work',  key: 'productPhotos' },
              ].map(({ label, key }) => {
                let photos: string[] = [];
                try { photos = JSON.parse(inspection[key] || '[]'); } catch {}
                if (!photos.length) return null;
                return (
                  <div key={key} className="mt-5">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((url: string, i: number) => (
                        <img key={i} src={url} alt={label} className="rounded-lg object-cover aspect-video bg-slate-800" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SIDEBAR: Action panels ── */}
        <div className="space-y-5">
          {/* Stats */}
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">At a Glance</h3>
            <div className="space-y-3">
              {[
                { label: 'Collab Requests', value: startup._count?.collaborationRequests || 0, color: 'text-purple-400' },
                { label: 'Investors Interested', value: startup._count?.investmentInterests || 0, color: 'text-emerald-400' },
                { label: 'Open Jobs', value: startup.jobOpenings?.filter((j:any)=>j.isOpen).length || 0, color: 'text-blue-400' },
                { label: 'Work Log Entries', value: startup.workLogs?.length || 0, color: 'text-amber-400' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">{s.label}</span>
                  <span className={`font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
              {startup.registrationId && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-xs text-slate-600 font-mono">Reg: {startup.registrationId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Collaborate */}
          {!isOwner && (
            <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Collaborate
              </h3>
              <textarea value={collabMsg} onChange={e => setCollabMsg(e.target.value)} rows={3}
                placeholder="What would you like to work on together?"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 text-sm resize-none mb-3 transition-colors" />
              {feedback.collaboration && (
                <p className={`text-xs mb-2 ${feedback.collaboration.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {feedback.collaboration}
                </p>
              )}
              <button onClick={() => submit('collaboration', { startupId: startup.id, message: collabMsg })}
                disabled={submitting.collaboration}
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {submitting.collaboration ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Send Request
              </button>
            </div>
          )}

          {/* Invest */}
          {!isOwner && (
            <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Invest / Fund
              </h3>
              <div className="space-y-2 mb-3">
                <input type="number" value={investAmount} onChange={e => setInvestAmount(e.target.value)}
                  placeholder="Amount in ₹ (optional)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition-colors" />
                <textarea value={investMsg} onChange={e => setInvestMsg(e.target.value)} rows={2}
                  placeholder="Your investment thesis or message..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm resize-none transition-colors" />
              </div>
              {feedback.investments && (
                <p className={`text-xs mb-2 ${feedback.investments.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {feedback.investments}
                </p>
              )}
              <button onClick={() => submit('investments', { startupId: startup.id, amount: investAmount, message: investMsg })}
                disabled={submitting.investments}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {submitting.investments ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                Express Interest
              </button>
            </div>
          )}

          {/* Leave a Review */}
          {!isOwner && user && (
            <div className="p-5 rounded-2xl border border-amber-500/10 bg-amber-500/5">
              <p className="text-sm font-medium text-amber-400 mb-1">Visited this startup?</p>
              <p className="text-xs text-slate-400 mb-3">After a verified check-in, you can leave a review for this startup.</p>
              <Link href={`/startups/${id}/review`}
                className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Star className="w-4 h-4" /> Write a Review
              </Link>
            </div>
          )}

          {/* Request Inspection (owner only) */}
          {isOwner && !inspection && (
            <div className="p-5 rounded-2xl border border-indigo-500/10 bg-indigo-500/5">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-indigo-400 mb-1">Get Field Verified</p>
                  <p className="text-xs text-slate-400">An agent visits your office to verify your startup. Unlocks the Field Verified badge, boosting investor trust significantly.</p>
                </div>
              </div>
              <Link href="/dashboard/inspection/request"
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <ClipboardList className="w-4 h-4" /> Request Inspection
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
