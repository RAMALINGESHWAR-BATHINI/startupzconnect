'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, CheckCircle, FileText, Building2, ExternalLink, ArrowLeft, ArrowRight } from 'lucide-react';
import { getLegalDocsRead, clearLegalDocsRead, type LegalDoc } from '@/lib/legal-consent';
import api from '@/lib/api';
const DOMAINS = ['AI','FinTech','HealthTech','EdTech','SaaS','E-commerce','Logistics','CleanTech','GameTech','Other'];
const STAGES = [
  { value: 'IDEA', label: 'Idea Stage', desc: 'Concept only, not yet building' },
  { value: 'MVP', label: 'MVP Built', desc: 'Minimum viable product exists' },
  { value: 'PRE_SEED', label: 'Pre-Seed', desc: 'Early funding or bootstrapped' },
  { value: 'SEED', label: 'Seed', desc: 'Seed funding raised' },
  { value: 'SERIES_A', label: 'Series A', desc: 'Series A raised' },
  { value: 'SERIES_B', label: 'Series B+', desc: 'Series B or beyond' },
  { value: 'BOOTSTRAPPED', label: 'Bootstrapped / Profitable', desc: 'Self-funded, generating revenue' },
];
const ORIGINS = [
  { value: 'INDEPENDENT', label: 'Independent / Self-Built', desc: 'Founded independently without institutional backing' },
  { value: 'INSTITUTIONAL', label: 'Institutionally Incubated', desc: 'Born inside a college or research institution' },
  { value: 'ACCELERATOR', label: 'Accelerator Backed', desc: 'Part of an accelerator program (YC, T-Hub, etc.)' },
  { value: 'CORPORATE_SPINOFF', label: 'Corporate Spinoff', desc: 'Spun out of an existing company' },
  { value: 'JV', label: 'Joint Venture', desc: 'Co-built by two or more entities' },
  { value: 'GOVT_BACKED', label: 'Government Backed', desc: 'Startup India, SIDBI, state schemes etc.' },
];
const REGISTRATION_TYPES = [
  { value: 'CIN', label: 'CIN' },
  { value: 'LLPIN', label: 'LLPIN' },
  { value: 'GSTIN', label: 'GSTIN' },
  { value: 'DPIIT', label: 'DPIIT Recognition Number' },
  { value: 'UDYAM', label: 'UDYAM Registration Number' },
  { value: 'OTHER', label: 'Other' },
];

const STEPS = ['Account & Basic Info', 'Origin & Legal', 'Stage & Team', 'Showcase & Review'];
type ReviewRow = [string, string];

export default function StartupRegisterUnified() {
  const { user, register } = useAuth();
  const router = useRouter();
  const isAuthenticated = !!user;
  
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState({ 
    name: '', email: '', password: '', confirmPassword: '', role: 'STARTUP' as string 
  });
  
  const [startup, setStartup] = useState({
    name: '', domain: '', description: '',
    originType: 'INDEPENDENT', institutionName: '',
    registrationType: '', registrationId: '', 
    registeredAddress: '', operationalAddress: '',
    foundedDate: '', stage: 'IDEA', employeeCount: '1',
    websiteUrl: '',
  });
  
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [docsRead, setDocsRead] = useState<Record<LegalDoc, boolean>>({ terms: false, privacy: false });
  const [attemptId] = useState(() => (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)));
  
  const bothDocsRead = docsRead.terms && docsRead.privacy;
  
  useEffect(() => {
    const sync = () => setDocsRead(getLegalDocsRead(attemptId));
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [attemptId]);
  
  const setFormField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setStartupField = (k: string, v: string) => setStartup(f => ({ ...f, [k]: v }));
  
  const reviewRows: Array<ReviewRow | null> = [
    !isAuthenticated ? ['Full Name', form.name] : null,
    !isAuthenticated ? ['Email', form.email] : null,
    ['Startup Name', startup.name],
    ['Domain', startup.domain || 'Not selected'],
    ['Description', startup.description.length > 60 ? startup.description.slice(0, 60) + '...' : startup.description],
    ['Origin', ORIGINS.find(o => o.value === startup.originType)?.label || ''],
    startup.institutionName ? ['Institution/Accelerator', startup.institutionName] : null,
    startup.registrationId ? [`Registration (${startup.registrationType || 'ID'})`, startup.registrationId] : null,
    ['Stage', STAGES.find(s => s.value === startup.stage)?.label || ''],
    ['Team Size', startup.employeeCount],
    startup.foundedDate ? ['Founded', startup.foundedDate] : null,
    startup.websiteUrl ? ['Website', startup.websiteUrl] : null,
  ];
  const validate = () => true;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-4">Register Your Startup</h1>
        <p className="text-slate-400 text-sm">Unified flow in progress.</p>
      </div>
    </div>
  );
}

