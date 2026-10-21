import type { Metadata } from 'next';
import Link from 'next/link';
import LegalReadTracker from '@/components/LegalReadTracker';

export const metadata: Metadata = {
  title: 'Privacy Policy | startupZconnect',
  description: 'What startupZconnect collects, how inspection photos and documents are used, and what we never share.',
};

const Section = ({ num, title, children }: { num: string; title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold text-white mb-3">{num}. {title}</h2>
    <div className="text-slate-400 text-sm leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <LegalReadTracker doc="privacy" />
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-slate-500 text-sm mb-12">Version 1.0 · Effective from launch</p>

      <Section num="1" title="What We Collect">
        <ul className="list-disc list-inside space-y-1">
          <li>Registration information: name, email, phone, company details</li>
          <li>Documents uploaded for startup verification (incorporation certificates, GST, etc.)</li>
          <li>Photos taken during a field inspection — exterior, interior, team, and product photos</li>
          <li>Platform activity: profile views, job applications, messages, reviews</li>
          <li>Investor-specific details: net worth bracket, investment thesis, SEBI registration, where provided</li>
        </ul>
      </Section>

      <Section num="2" title="How Inspection Photos & Documents Are Used">
        <p>Photos and documents collected during a field inspection are used solely to produce your inspection report and verify your startup's Registered / Field Verified badge. Full inspection reports — including agent notes and photos — are visible only to you and to Verified Investors by default; a summary and badge are the only parts shown publicly, unless you choose to make the full report public.</p>
      </Section>

      <Section num="3" title="What We Do Not Do">
        <ul className="list-disc list-inside space-y-1">
          <li>We do not sell your data to third parties</li>
          <li>We do not share investor financial information with startups</li>
          <li>We do not reveal anonymous reviewer identities to the startup being reviewed</li>
          <li>We do not use your verification documents for any purpose beyond verification</li>
        </ul>
      </Section>

      <Section num="4" title="File Storage">
        <p>Uploaded photos and documents are stored on Cloudflare R2 object storage. Access to raw files is restricted to our verification team and, where a report is shared, the specific parties that report is shared with.</p>
      </Section>

      <Section num="5" title="Data Retention">
        <p>Active account data is retained while your account is active. Inspection reports and photos are retained for 5 years after your last inspection, for dispute and audit purposes. Deleted account data is purged within 30 days, except where retention is required for fraud investigation.</p>
      </Section>

      <Section num="6" title="Your Rights">
        <p>You may request a copy of your data, correct inaccurate information, or delete your account entirely (Settings → Danger Zone). Deleting your account cascades through your startups, applications, reviews, and other associated records.</p>
      </Section>

      <Section num="7" title="Cookies & Sessions">
        <p>We use HTTP-only session cookies for authentication (access and refresh tokens). We do not use third-party advertising or tracking cookies.</p>
      </Section>

      <Section num="8" title="Contact">
        <p>Questions about this policy can be sent to <span className="text-slate-300">policy@startupzconnect.com</span>. See also our <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">Terms of Service</Link>.</p>
      </Section>
    </div>
  );
}
