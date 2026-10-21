'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Building2, X } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';

const SCORE_FIELDS = [
  { key: 'legitimacyScore', label: 'Legitimacy', desc: 'Does the address, docs, and setup all check out?' },
  { key: 'teamScore',       label: 'Team Quality', desc: 'Is the team professional and capable-looking?' },
  { key: 'productScore',    label: 'Product Maturity', desc: 'How real and developed is the product?' },
  { key: 'workspaceScore',  label: 'Workspace Quality', desc: 'Is this a real, functional working environment?' },
  { key: 'momentumScore',   label: 'Growth Momentum', desc: 'Is there visible activity and progress?' },
];

const PHOTO_SECTIONS = [
  { key: 'exteriorPhotos', label: 'Office Exterior' },
  { key: 'interiorPhotos', label: 'Office Interior' },
  { key: 'teamPhotos',     label: 'Team Photos' },
  { key: 'productPhotos',  label: 'Product / Work in Progress' },
] as const;

export default function AgentInspectionDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [insp, setInsp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({
    legitimacyScore: 5, teamScore: 5, productScore: 5, workspaceScore: 5, momentumScore: 5,
  });
  const [notes, setNotes] = useState('');
  const [recommendedBadge, setRecommendedBadge] = useState('FIELD_VERIFIED');
  const [photos, setPhotos] = useState<Record<string, string[]>>({
    exteriorPhotos: [], interiorPhotos: [], teamPhotos: [], productPhotos: [],
  });

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
  }, [authLoading, user, router]);

  useEffect(() => {
    api.get(`/agent/inspections/${id}`)
      .then(r => setInsp(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  const addPhoto = (section: string, url: string) => {
    setPhotos(p => ({ ...p, [section]: [...(p[section] || []), url] }));
  };
  const removePhoto = (section: string, url: string) => {
    setPhotos(p => ({ ...p, [section]: (p[section] || []).filter(u => u !== url) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    const overallScore = Object.values(scores).reduce((a,b)=>a+b,0) / Object.values(scores).length;
    try {
      await api.patch(`/agent/inspections/${id}`, {
        ...scores, overallScore, agentNotes: notes, recommendedBadge, status: 'SUBMITTED',
        exteriorPhotos: JSON.stringify(photos.exteriorPhotos),
        interiorPhotos: JSON.stringify(photos.interiorPhotos),
        teamPhotos: JSON.stringify(photos.teamPhotos),
        productPhotos: JSON.stringify(photos.productPhotos),
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit report.');
    } finally { setSubmitting(false); }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>;

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <CheckCircle className="w-14 h-14 text-emerald-400" />
      <h2 className="text-2xl font-bold text-white">Report Submitted!</h2>
      <p className="text-slate-400 max-w-sm">Your inspection report has been sent for admin review before the badge is applied.</p>
      <button onClick={() => router.push('/agent')} className="mt-4 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">Back to Dashboard</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
          {insp?.startup?.name?.charAt(0) || <Building2 className="w-5 h-5" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Inspect: {insp?.startup?.name}</h1>
          <p className="text-slate-400 text-sm">{insp?.startup?.operationalAddress || 'No address on file'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />{error}
          </div>
        )}

        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6">
          {SCORE_FIELDS.map(f => (
            <div key={f.key}>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-slate-300">{f.label}</label>
                <span className="text-sm font-bold text-indigo-400">{scores[f.key]}/10</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{f.desc}</p>
              <input type="range" min="1" max="10" value={scores[f.key]}
                onChange={e => setScores(s => ({ ...s, [f.key]: parseInt(e.target.value) }))}
                className="w-full accent-indigo-500" />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Agent Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5}
              placeholder="Describe what you observed: office condition, team present, product demo, anything noteworthy or concerning..."
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Recommended Badge</label>
            <select value={recommendedBadge} onChange={e => setRecommendedBadge(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none">
              <option value="FIELD_VERIFIED">Field Verified — Passed inspection</option>
              <option value="NONE">Failed — Do not verify</option>
            </select>
          </div>
        </div>

        {/* Photo evidence — the core of what makes a field inspection trustworthy */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6">
          <p className="text-sm font-semibold text-white">Photo Evidence</p>
          {PHOTO_SECTIONS.map(section => (
            <div key={section.key}>
              <label className="block text-sm font-medium text-slate-300 mb-2">{section.label}</label>
              {photos[section.key]?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {photos[section.key].map(url => (
                    <div key={url} className="relative group">
                      <img src={url} alt={section.label} className="w-full aspect-video object-cover rounded-lg bg-slate-800" />
                      <button type="button" onClick={() => removePhoto(section.key, url)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <FileUpload folder="inspections" accept="image/jpeg,image/png,image/webp"
                label={`Add ${section.label.toLowerCase()} photo`}
                onUploaded={url => addPhoto(section.key, url)} />
            </div>
          ))}
        </div>

        <button type="submit" disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Inspection Report'}
        </button>
      </form>
    </div>
  );
}
