import type { Metadata } from 'next';
import Link from 'next/link';
import LegalReadTracker from '@/components/LegalReadTracker';

export const metadata: Metadata = {
  title: 'Terms of Service | startupZconnect',
  description: 'The terms governing use of startupZconnect — registration, inspections, investor conduct, reviews, and enforcement.',
};

const Section = ({ num, title, children }: { num: string; title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold text-white mb-3">{num}. {title}</h2>
    <div className="text-slate-400 text-sm leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <LegalReadTracker doc="terms" />
      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-slate-500 text-sm mb-12">Version 1.0 · Effective from launch</p>

      <Section num="1" title="Who We Are">
        <p>startupZconnect is a verified startup networking platform connecting startups, investors, working professionals, and students. We operate a physical inspection and community review system to help every profile on our platform reflect reality.</p>
      </Section>

      <Section num="2" title="Eligibility & Accounts">
        <p>You must be 18 or older, or a legally registered entity, to create an account. Each person or company may hold only one account. All information you provide must be true and current — misrepresenting your team size, address, revenue, or identity results in removal from the platform.</p>
      </Section>

      <Section num="3" title="Startup Registration">
        <p>Startups must provide accurate legal, location, and team information, and submit at least one supporting document (incorporation certificate, GST registration, or DPIIT recognition) for profile activation. Institutional or accelerator-backed startups must name their institution and provide proof of incubation.</p>
      </Section>

      <Section num="4" title="Field Inspection">
        <p>Startups may request a physical inspection by a StartupzConnect Field Agent. Inspection fees (Basic ₹1,000 / Premium ₹3,000) are payable per our current pricing, non-refundable once a visit is completed, with a partial refund if the startup fails inspection. Badges issued through inspection expire after 18 months and require re-inspection to renew. We reserve the right to flag or remove a startup found to have misrepresented material facts during inspection.</p>
      </Section>

      <Section num="5" title="Investor Conduct">
        <p>Investors must provide accurate net worth, thesis, and (where applicable) SEBI registration information for verification. We do not facilitate or guarantee any investment transaction, and are not a SEBI-registered investment advisor or broker. Fake investment interest used to collect startup information is grounds for permanent ban.</p>
      </Section>

      <Section num="6" title="Community Reviews">
        <p>Reviews must reflect genuine, first-hand experience with a startup. We do not tolerate review manipulation, solicited fake reviews, or harassment in review content. Flagged reviews remain visible pending admin review — flagging alone never deletes content.</p>
      </Section>

      <Section num="7" title="Job Postings">
        <p>Only startups with at least a Registered badge may post jobs. Listings requiring payment from applicants, multi-level-marketing roles, or misleading equity promises are prohibited.</p>
      </Section>

      <Section num="8" title="Prohibited Conduct">
        <p>You may not post false information, spam other users, harass or discriminate against anyone, infringe intellectual property, or share confidential platform data (such as a private inspection report) with third parties.</p>
      </Section>

      <Section num="9" title="Fees & Refunds">
        <p>Creating a profile, browsing, applying to jobs, leaving reviews, and basic collaboration requests are permanently free. Paid features (inspection, featured listings, investor deal-flow access) follow the refund schedule published on our pricing page.</p>
      </Section>

      <Section num="10" title="Enforcement & Appeals">
        <p>We may warn, suspend, or permanently ban accounts that violate these terms. Most enforcement actions may be appealed within 14 days by emailing appeals@startupzconnect.com.</p>
      </Section>

      <Section num="11" title="Disclaimers">
        <p>We are a discovery and trust platform — not a licensed investment advisor, recruitment agency, or legal verification authority. Our inspection reports reflect the agent's honest assessment at the time of the visit; we are not liable for changes to a startup's status afterward.</p>
      </Section>

      <Section num="12" title="Changes to These Terms">
        <p>We may update these terms from time to time. Material changes will be emailed to registered users. Continued use of the platform after a change constitutes acceptance of the updated terms.</p>
      </Section>

        <p className="text-slate-500 text-sm mt-12">
          For the complete policy detail — including full inspection, review, and refund rules — see our{' '}
          <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</Link>, the{' '}
          <a
            href="https://github.com/RAMALINGESHWAR-BATHINI/startupzconnect/blob/master/docs/PLATFORM-POLICIES.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300"
          >
            full platform policy
          </a>
          , or contact{' '}
          <span className="text-slate-400">policy@startupzconnect.com</span>.
        </p>
    </div>
  );
}
