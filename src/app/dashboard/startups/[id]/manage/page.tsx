'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { Building2, Loader2, AlertCircle, CheckCircle, ArrowLeft, Trash2, Users,
  BookOpen, Plus, TrendingUp, Briefcase, UserPlus, ClipboardList, FileCheck, Handshake, ExternalLink, Check, X } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';

const DOMAINS = ['AI','FinTech','HealthTech','EdTech','SaaS','E-commerce','Logistics','CleanTech','GameTech','Other'];
const STAGES  = ['IDEA','MVP','PRE_SEED','SEED','SERIES_A','SERIES_B','BOOTSTRAPPED'];

type Tab = 'details' | 'team' | 'worklog' | 'traction' | 'documents' | 'collabs';

export default function ManageStartupPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('details');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isError, setIsError] = useState(false);

  // Details form
  const [details, setDetails] = useState({ name:'', domain:'', description:'', stage:'IDEA', employeeCount:'1', websiteUrl:'', monthlyUsers:'', monthlyRevenue:'', totalFundingRaised:'' });

  // Team form
  const [newMember, setNewMember] = useState({ name:'', role:'', linkedin:'', photoUrl:'', isFounder: false });
  const [addingMember, setAddingMember] = useState(false);

  // Worklog form
  const [logForm, setLogForm] = useState({ weekOf:'', summary:'', hoursSpent:'', milestone: false });
  const [addingLog, setAddingLog] = useState(false);

  // Documents (Registered badge verification)
  const [documents, setDocuments] = useState<any[]>([]);
  const [docForm, setDocForm] = useState({ docType: 'INCORPORATION', fileUrl: '' });
  const [addingDoc, setAddingDoc] = useState(false);

  // Startup-to-startup collaboration inbox
  const [collabRequests, setCollabRequests] = useState<any[]>([]);
  const [actingCollab, setActingCollab] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    api.get(`/startups/${id}`)
      .then(res => {
        const s = res.data;
        if (s.founderId !== user.id && user.role !== 'ADMIN') { router.push('/dashboard'); return; }
        setStartup(s);
        setDetails({
          name: s.name || '', domain: s.domain || '', description: s.description || '',
          stage: s.stage || 'IDEA', employeeCount: String(s.employeeCount || 1),
          websiteUrl: s.websiteUrl || '', monthlyUsers: s.monthlyUsers ? String(s.monthlyUsers) : '',
          monthlyRevenue: s.monthlyRevenue ? String(s.monthlyRevenue) : '',
          totalFundingRaised: s.totalFundingRaised ? String(s.totalFundingRaised) : '',
        });
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
    api.get(`/startups/${id}/documents`).then(r => setDocuments(r.data || [])).catch(() => {});
    api.get(`/startups/${id}/collab-requests`).then(r => setCollabRequests(r.data || [])).catch(() => {});
  }, [id, user, authLoading, router]);

  const flash = (msg: string, err = false) => { setFeedback(msg); setIsError(err); setTimeout(() => setFeedback(''), 4000); };

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.patch(`/startups/${id}`, { ...details, employeeCount: parseInt(details.employeeCount) || 1, monthlyUsers: details.monthlyUsers ? parseInt(details.monthlyUsers) : undefined, monthlyRevenue: details.monthlyRevenue ? parseFloat(details.monthlyRevenue) : undefined, totalFundingRaised: details.totalFundingRaised ? parseFloat(details.totalFundingRaised) : undefined });
      setStartup((s: any) => ({ ...s, ...res.data }));
      flash('Startup updated successfully!');
    } catch (err: any) { flash(err?.response?.data?.error || 'Update failed.', true); }
    finally { setSaving(false); }
  };

  const addTeamMember = async (e: React.FormEvent) => {
    e.preventDefault(); setAddingMember(true);
    try {
      const res = await api.post(`/startups/${id}/team`, newMember);
      setStartup((s: any) => ({ ...s, teamMembers: [...(s.teamMembers || []), res.data] }));
      setNewMember({ name:'', role:'', linkedin:'', photoUrl:'', isFounder: false });
      flash('Team member added!');
    } catch (err: any) { flash(err?.response?.data?.error || 'Failed to add member.', true); }
    finally { setAddingMember(false); }
  };

  const removeTeamMember = async (memberId: number) => {
    try {
      await api.delete(`/startups/${id}/team`, { data: { memberId } });
      setStartup((s: any) => ({ ...s, teamMembers: s.teamMembers.filter((m: any) => m.id !== memberId) }));
      flash('Member removed.');
    } catch { flash('Failed to remove.', true); }
  };

  const addWorkLog = async (e: React.FormEvent) => {
    e.preventDefault(); setAddingLog(true);
    try {
      const res = await api.post(`/startups/${id}/worklog`, logForm);
      setStartup((s: any) => ({ ...s, workLogs: [res.data, ...(s.workLogs || [])] }));
      setLogForm({ weekOf:'', summary:'', hoursSpent:'', milestone: false });
      flash('Work log added!');
    } catch (err: any) { flash(err?.response?.data?.error || 'Failed to add log.', true); }
    finally { setAddingLog(false); }
  };

  const addDocument = async (e: React.FormEvent) => {
    e.preventDefault(); setAddingDoc(true);
    try {
      const res = await api.post(`/startups/${id}/documents`, docForm);
      setDocuments(docs => [res.data, ...docs]);
      setDocForm({ docType: 'INCORPORATION', fileUrl: '' });
      flash('Document submitted for review!');
    } catch (err: any) { flash(err?.response?.data?.error || 'Failed to submit document.', true); }
    finally { setAddingDoc(false); }
  };

  const decideCollab = async (reqId: number, status: 'ACCEPTED' | 'REJECTED') => {
    setActingCollab(a => ({ ...a, [reqId]: true }));
    try {
      await api.patch(`/startups/${id}/collab-requests/${reqId}`, { status });
      setCollabRequests(rs => rs.map(r => r.id === reqId ? { ...r, status } : r));
    } finally { setActingCollab(a => ({ ...a, [reqId]: false })); }
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
  );

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'details',   label: 'Details',  icon: Building2 },
    { key: 'team',      label: `Team (${startup?.teamMembers?.length || 0})`, icon: Users },
    { key: 'worklog',   label: 'Work Log', icon: BookOpen },
    { key: 'traction',  label: 'Traction', icon: TrendingUp },
    { key: 'documents', label: `Documents (${documents.length})`, icon: FileCheck },
    { key: 'collabs',   label: `Collab Requests (${collabRequests.filter((r:any)=>r.status==='PENDING').length})`, icon: Handshake },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          {startup?.name?.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{startup?.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Link href={`/startups/${id}`} className="text-xs text-indigo-400 hover:text-indigo-300">View public page →</Link>
            <span className="text-slate-700 text-xs">·</span>
            <Link href="/dashboard/inspection/request" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              <ClipboardList className="w-3 h-3" /> Request Inspection
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-6 border ${isError ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          {isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {feedback}
        </div>
      )}

      {/* DETAILS TAB */}
      {tab === 'details' && (
        <form onSubmit={saveDetails} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Startup Name *</label>
              <input required minLength={2} maxLength={100} value={details.name} onChange={e => setDetails(d => ({...d,name:e.target.value}))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Domain</label>
              <select value={details.domain} onChange={e => setDetails(d => ({...d,domain:e.target.value}))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm">
                <option value="">Select domain</option>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea value={details.description} onChange={e => setDetails(d => ({...d,description:e.target.value}))} rows={4} maxLength={2000}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Stage</label>
              <select value={details.stage} onChange={e => setDetails(d => ({...d,stage:e.target.value}))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm">
                {STAGES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Team Size</label>
              <input type="number" min="1" value={details.employeeCount} onChange={e => setDetails(d => ({...d,employeeCount:e.target.value}))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Website</label>
              <input type="url" value={details.websiteUrl} onChange={e => setDetails(d => ({...d,websiteUrl:e.target.value}))} placeholder="https://"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm" />
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <button type="button" onClick={async () => { if(confirm('Delete this startup? Cannot be undone.')) { await api.delete(`/startups/${id}`); router.push('/dashboard'); }}}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-sm hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Save Changes
            </button>
          </div>
        </form>
      )}

      {/* TEAM TAB */}
      {tab === 'team' && (
        <div className="space-y-5">
          <form onSubmit={addTeamMember} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4 text-teal-400" /> Add Team Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input required placeholder="Full Name *" value={newMember.name} onChange={e => setNewMember(m => ({...m,name:e.target.value}))}
                className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 text-sm" />
              <input placeholder="Role (e.g. CTO)" value={newMember.role} onChange={e => setNewMember(m => ({...m,role:e.target.value}))}
                className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 text-sm" />
              <input placeholder="LinkedIn URL" value={newMember.linkedin} onChange={e => setNewMember(m => ({...m,linkedin:e.target.value}))}
                className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 text-sm" />
              <div className="sm:col-span-2">
                <FileUpload folder="team-photos" accept="image/jpeg,image/png,image/webp" label="Upload photo (optional)"
                  currentUrl={newMember.photoUrl} onUploaded={url => setNewMember(m => ({...m, photoUrl: url}))}
                  onClear={() => setNewMember(m => ({...m, photoUrl: ''}))} />
              </div>
              <label className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/10 cursor-pointer">
                <input type="checkbox" checked={newMember.isFounder} onChange={e => setNewMember(m => ({...m,isFounder:e.target.checked}))} className="accent-teal-500" />
                <span className="text-sm text-slate-300">Mark as Founder</span>
              </label>
            </div>
            <button type="submit" disabled={addingMember}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-medium transition-colors">
              {addingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Member
            </button>
          </form>

          <div className="space-y-3">
            {(startup?.teamMembers || []).map((m: any) => (
              <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{m.name}</p>
                    {m.isFounder && <span className="badge badge-purple text-xs">Founder</span>}
                  </div>
                  {m.role && <p className="text-xs text-slate-500">{m.role}</p>}
                </div>
                <button onClick={() => removeTeamMember(m.id)} className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!startup?.teamMembers || startup.teamMembers.length === 0) && (
              <p className="text-center text-slate-500 text-sm py-6">No team members added yet.</p>
            )}
          </div>
        </div>
      )}

      {/* WORKLOG TAB */}
      {tab === 'worklog' && (
        <div className="space-y-5">
          <form onSubmit={addWorkLog} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-400" /> Post Weekly Update</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Week of *</label>
                <input type="date" required value={logForm.weekOf} onChange={e => setLogForm(f => ({...f,weekOf:e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-purple-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Hours Invested</label>
                <input type="number" min="0" max="168" placeholder="e.g. 40" value={logForm.hoursSpent} onChange={e => setLogForm(f => ({...f,hoursSpent:e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 text-sm" />
              </div>
            </div>
            <textarea required minLength={20} value={logForm.summary} onChange={e => setLogForm(f => ({...f,summary:e.target.value}))} rows={4}
              placeholder="What did you build, test, learn, or ship this week? Be specific — investors read this."
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 text-sm resize-none mb-3" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={logForm.milestone} onChange={e => setLogForm(f => ({...f,milestone:e.target.checked}))} className="accent-amber-500" />
                <span className="text-sm text-slate-300">🏆 Mark as Milestone</span>
              </label>
              <button type="submit" disabled={addingLog}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-medium transition-colors">
                {addingLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Post Update
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {(startup?.workLogs || []).map((log: any) => (
              <div key={log.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2">
                  {log.milestone && <span className="badge badge-amber text-xs">🏆 Milestone</span>}
                  <span className="text-xs text-slate-500">Week of {new Date(log.weekOf).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>
                  {log.hoursSpent && <span className="text-xs text-slate-600">{log.hoursSpent}h</span>}
                </div>
                <p className="text-sm text-slate-300">{log.summary}</p>
              </div>
            ))}
            {(!startup?.workLogs || startup.workLogs.length === 0) && (
              <p className="text-center text-slate-500 text-sm py-6">No updates yet. Post your first weekly update.</p>
            )}
          </div>
        </div>
      )}

      {/* TRACTION TAB */}
      {tab === 'traction' && (
        <form onSubmit={saveDetails} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-5">
          <p className="text-sm text-slate-400">These numbers appear on your public profile and help investors evaluate traction. Share what you're comfortable with — you can update anytime.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Monthly Active Users</label>
              <input type="number" min="0" placeholder="e.g. 1500" value={details.monthlyUsers} onChange={e => setDetails(d => ({...d,monthlyUsers:e.target.value}))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Monthly Revenue (₹)</label>
              <input type="number" min="0" placeholder="e.g. 50000" value={details.monthlyRevenue} onChange={e => setDetails(d => ({...d,monthlyRevenue:e.target.value}))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Total Funding Raised (₹)</label>
              <input type="number" min="0" placeholder="e.g. 2000000" value={details.totalFundingRaised} onChange={e => setDetails(d => ({...d,totalFundingRaised:e.target.value}))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Save Traction Data
            </button>
          </div>
        </form>
      )}

      {/* DOCUMENTS TAB */}
      {tab === 'documents' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
            <p className="text-sm text-slate-300">Submit a document link (Google Drive, Dropbox, etc. — set to "anyone with the link can view"). Our team verifies it manually; approval unlocks the <span className="text-indigo-300 font-medium">Registered</span> badge.</p>
          </div>
          <form onSubmit={addDocument} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={docForm.docType} onChange={e => setDocForm(f => ({...f, docType: e.target.value}))}
                className="px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none sm:col-span-1">
                <option value="INCORPORATION">Certificate of Incorporation</option>
                <option value="GST">GST Registration</option>
                <option value="DPIIT">DPIIT Startup India Cert.</option>
                <option value="SHOP_ACT">Shop & Establishment Act</option>
                <option value="OTHER">Other</option>
              </select>
              <div className="sm:col-span-2">
                <FileUpload folder="documents" accept="application/pdf,image/jpeg,image/png" label="Upload document (PDF or image, max 10MB)"
                  currentUrl={docForm.fileUrl} onUploaded={url => setDocForm(f => ({...f, fileUrl: url}))}
                  onClear={() => setDocForm(f => ({...f, fileUrl: ''}))} />
              </div>
            </div>
            <p className="text-xs text-slate-500">Or paste a link instead (Google Drive, Dropbox — set to "anyone with the link can view"):</p>
            <input type="url" placeholder="https://drive.google.com/..." value={docForm.fileUrl} onChange={e => setDocForm(f => ({...f, fileUrl: e.target.value}))}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 text-sm" />
            <button type="submit" disabled={addingDoc}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium">
              {addingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Submit for Verification
            </button>
          </form>
          <div className="space-y-3">
            {documents.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div>
                  <p className="text-sm font-medium text-white">{d.docType.replace('_',' ')}</p>
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    View link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <span className={`badge text-xs ${d.status === 'VERIFIED' ? 'badge-green' : d.status === 'REJECTED' ? 'badge-gray' : 'badge-amber'}`}>{d.status}</span>
              </div>
            ))}
            {documents.length === 0 && <p className="text-center text-slate-500 text-sm py-6">No documents submitted yet.</p>}
          </div>
        </div>
      )}

      {/* COLLAB REQUESTS TAB */}
      {tab === 'collabs' && (
        <div className="space-y-3">
          {collabRequests.length === 0 && <p className="text-center text-slate-500 text-sm py-10">No collaboration requests yet.</p>}
          {collabRequests.map((r: any) => (
            <div key={r.id} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(r.fromStartup?.name || r.user?.name || '?').charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {r.fromStartup ? `${r.fromStartup.name} (startup)` : r.user?.name}
                  </p>
                  <span className={`badge text-xs ${r.status === 'ACCEPTED' ? 'badge-green' : r.status === 'REJECTED' ? 'badge-gray' : 'badge-amber'}`}>{r.status}</span>
                </div>
              </div>
              {r.message && <p className="text-sm text-slate-400 mb-3">{r.message}</p>}
              {r.status === 'PENDING' && (
                <div className="flex gap-3">
                  <button onClick={() => decideCollab(r.id, 'ACCEPTED')} disabled={actingCollab[r.id]}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-medium">
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button onClick={() => decideCollab(r.id, 'REJECTED')} disabled={actingCollab[r.id]}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-60 text-slate-300 text-xs font-medium">
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
