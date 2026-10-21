/**
 * What each account type must provide at sign-up. One definition used by the server (authoritative)
 * and the wizard (to render the same steps), so they cannot drift. `clean` only contains the
 * whitelisted fields for the role: anything else the client sends (role, isAdmin, badgeTier, ...) is
 * dropped by construction.
 */
import { isSafeHttpUrl } from './url-safety';

export const SIGNUP_ROLES = ['STUDENT', 'PROFESSIONAL', 'STARTUP', 'INVESTOR', 'MENTOR', 'OTHER'] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const DOMAINS = ['AI', 'FinTech', 'HealthTech', 'EdTech', 'SaaS', 'E-commerce', 'Logistics', 'CleanTech', 'GameTech', 'Other'] as const;
export const STAGES = ['IDEA', 'MVP', 'PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'BOOTSTRAPPED'] as const;
export const NET_WORTH_BRACKETS = ['25L-1Cr', '1Cr-5Cr', '5Cr-25Cr', '25Cr+'] as const;
export const TICKET_SIZES = ['1L-10L', '10L-50L', '50L-2Cr', '2Cr+'] as const;

/**
 * Format checks only. A well-formed number is NOT proof the company exists — the Registered
 * badge must be granted only after an admin verifies a document.
 */
export const REGISTRATION_ID_TYPES: Record<string, { label: string; pattern: RegExp; example: string }> = {
  CIN: { label: 'CIN (Company Identification Number)', pattern: /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/, example: 'U74999TG2020PTC123456' },
  LLPIN: { label: 'LLPIN (LLP Identification Number)', pattern: /^[A-Z]{3}-\d{4}$/, example: 'AAB-1234' },
  GSTIN: { label: 'GSTIN', pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, example: '36ABCDE1234F1Z5' },
  DPIIT: { label: 'DPIIT Startup India recognition', pattern: /^DIPP\d{3,8}$/, example: 'DIPP12345' },
  UDYAM: { label: 'Udyam registration', pattern: /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/, example: 'UDYAM-TG-12-1234567' },
};

export interface FieldSpec { key: string; label: string; required: boolean; kind: 'text' | 'textarea' | 'select' | 'url'; options?: readonly string[]; max: number; min?: number }

const OPT = {
  location: { key: 'location', label: 'Location', required: false, kind: 'text', max: 80 },
  portfolio: { key: 'portfolio', label: 'Portfolio or LinkedIn link', required: false, kind: 'url', max: 200 },
  bio: { key: 'bio', label: 'About you', required: false, kind: 'textarea', max: 500 },
  skills: { key: 'skills', label: 'Skills (comma separated)', required: false, kind: 'text', max: 200 },
} as const satisfies Record<string, FieldSpec>;

export const ROLE_FIELDS: Record<SignupRole, FieldSpec[]> = {
  STUDENT: [{ key: 'organization', label: 'College or institution', required: true, kind: 'text', min: 2, max: 100 }, OPT.skills],
  PROFESSIONAL: [{ key: 'organization', label: 'Current employer (or "Freelance")', required: true, kind: 'text', min: 2, max: 100 }, OPT.skills],
  STARTUP: [
    { key: 'startupName', label: 'Startup name', required: true, kind: 'text', min: 2, max: 100 },
    { key: 'registrationIdType', label: 'Registration ID type', required: true, kind: 'select', options: Object.keys(REGISTRATION_ID_TYPES), max: 10 },
    { key: 'registrationId', label: 'Registration ID', required: true, kind: 'text', min: 5, max: 30 },
    { key: 'domain', label: 'Domain', required: true, kind: 'select', options: DOMAINS, max: 30 },
    { key: 'stage', label: 'Stage', required: true, kind: 'select', options: STAGES, max: 20 },
    { key: 'websiteUrl', label: 'Website', required: false, kind: 'url', max: 200 },
  ],
  INVESTOR: [
    { key: 'investorNetWorth', label: 'Investable net worth', required: true, kind: 'select', options: NET_WORTH_BRACKETS, max: 20 },
    { key: 'investorTicketSize', label: 'Typical ticket size', required: true, kind: 'select', options: TICKET_SIZES, max: 20 },
    { key: 'sebiRegNumber', label: 'SEBI registration number (if any)', required: false, kind: 'text', max: 40 },
    { key: 'investorThesis', label: 'Investment thesis', required: false, kind: 'textarea', max: 1000 },
  ],
  MENTOR: [
    { key: 'mentorExpertise', label: 'Areas of expertise (comma separated)', required: true, kind: 'text', min: 3, max: 200 },
    { key: 'mentorBio', label: 'Your background', required: true, kind: 'textarea', min: 20, max: 1000 },
    { key: 'mentorAvailability', label: 'Availability', required: false, kind: 'text', max: 80 },
  ],
  OTHER: [
    { key: 'organization', label: 'Organization', required: true, kind: 'text', min: 2, max: 100 },
    { key: 'bio', label: 'What brings you to StartupzConnect?', required: true, kind: 'textarea', min: 10, max: 500 },
  ],
};
/** The optional, skippable "complete your profile" step. */
export const OPTIONAL_PROFILE_FIELDS: FieldSpec[] = [OPT.location, OPT.portfolio, OPT.bio];

export function normalizeRegistrationId(v: string): string { return v.trim().toUpperCase(); }
export function validateRegistrationId(type: unknown, value: unknown): string | null {
  if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(REGISTRATION_ID_TYPES, type)) return 'Choose a registration ID type.';
  if (typeof value !== 'string') return 'Registration ID is required.';
  const t = REGISTRATION_ID_TYPES[type];
  return t.pattern.test(normalizeRegistrationId(value)) ? null : `Enter a valid ${type}, for example ${t.example}.`;
}

export type ProfileResult = { ok: true; clean: Record<string, string> } | { ok: false; errors: Record<string, string> };

export function validateRegistrationProfile(role: unknown, input: unknown): ProfileResult {
  if (typeof role !== 'string' || !(SIGNUP_ROLES as readonly string[]).includes(role)) return { ok: false, errors: { role: 'Choose a valid account type.' } };
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const roleSpecs = ROLE_FIELDS[role as SignupRole];
  const specs = [...roleSpecs, ...OPTIONAL_PROFILE_FIELDS.filter(f => !roleSpecs.some(r => r.key === f.key))];
  const errors: Record<string, string> = {};
  const clean: Record<string, string> = {};

  for (const f of specs) {
    const raw = src[f.key];
    if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) { if (f.required) errors[f.key] = `${f.label} is required.`; continue; }
    if (typeof raw !== 'string') { errors[f.key] = `${f.label} is invalid.`; continue; }
    const v = raw.trim();
    if (v.length > f.max) { errors[f.key] = `${f.label} must be at most ${f.max} characters.`; continue; }
    if (f.min && v.length < f.min) { errors[f.key] = `${f.label} must be at least ${f.min} characters.`; continue; }
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(v)) { errors[f.key] = `${f.label} contains invalid characters.`; continue; }
    if (f.kind === 'select' && !f.options!.includes(v)) { errors[f.key] = `${f.label} is invalid.`; continue; }
    if (f.kind === 'url' && !isSafeHttpUrl(v)) { errors[f.key] = `${f.label} must be a valid http(s) link.`; continue; }
    clean[f.key] = v;
  }
  if (role === 'STARTUP' && !errors.registrationId && !errors.registrationIdType) {
    const idError = validateRegistrationId(clean.registrationIdType, clean.registrationId);
    if (idError) errors.registrationId = idError; else clean.registrationId = normalizeRegistrationId(clean.registrationId);
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, clean };
}
