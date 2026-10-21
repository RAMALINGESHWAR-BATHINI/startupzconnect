/**
 * One-time setup script for Phase 1 launch.
 *
 * Run with: npm run db:seed
 *
 * What it does:
 * 1. Creates (or updates) a single ADMIN account from env vars, so you have
 *    a way into /admin/* without ever touching Prisma Studio by hand.
 * 2. Registers that same account as a FieldAgent, since in Phase 1 you are
 *    the only inspector — this unlocks /agent for your own account.
 * 3. Seeds the Grants page with a starter set of real Indian startup
 *    funding schemes, so it isn't empty on day one.
 *
 * Required env vars (put these in .env.local before running):
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 *
 * Safe to re-run: every step is an upsert / existence check, so running
 * this twice won't create duplicates or error out.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdminAndAgent() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin + agent bootstrap.');
    console.warn('   Add them to .env.local and re-run `npm run db:seed` when ready.');
    return;
  }
  if (password.length < 8) {
    console.error('❌ ADMIN_PASSWORD must be at least 8 characters. Aborting admin bootstrap.');
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: { role: 'ADMIN', emailVerified: true },
    create: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: 'ADMIN',
      emailVerified: true, // skip the email flow for the one account that bootstraps everything else
    },
  });
  console.log(`✅ Admin account ready: ${admin.email} (id ${admin.id})`);

  const existingAgent = await prisma.fieldAgent.findUnique({ where: { userId: admin.id } });
  if (!existingAgent) {
    await prisma.fieldAgent.create({
      data: { userId: admin.id, city: 'Hyderabad', isActive: true },
    });
    console.log('✅ Field agent profile created for admin account (edit city in Prisma Studio if needed).');
  } else {
    console.log('✅ Field agent profile already exists for admin account.');
  }
}

async function seedGrants() {
  const count = await prisma.grant.count();
  if (count > 0) {
    console.log(`✅ Grants table already has ${count} entries — skipping seed.`);
    return;
  }

  const grants = [
    {
      name: 'Startup India Seed Fund Scheme (SISFS)',
      provider: 'Govt. of India — DPIIT',
      description: 'Provides financial assistance to startups for proof of concept, prototype development, product trials, and market entry.',
      eligibility: 'DPIIT-recognized startup, incorporated not more than 2 years ago, not received more than ₹10L in other govt. schemes.',
      amountRange: 'Up to ₹20L (grant) + up to ₹50L (convertible debt)',
      applyUrl: 'https://seedfund.startupindia.gov.in/',
    },
    {
      name: 'SIDBI Fund of Funds for Startups (FFS)',
      provider: 'SIDBI',
      description: 'Invests in SEBI-registered Alternative Investment Funds (AIFs) which in turn invest equity in startups — an indirect but significant funding channel.',
      eligibility: 'Startups raising from an AIF that itself is backed by FFS — check with your target VC/fund if they are an FFS-backed AIF.',
      amountRange: 'Varies by fund',
      applyUrl: 'https://www.sidbi.in/',
    },
    {
      name: 'Telangana State Innovation Cell — T-Fund',
      provider: 'Govt. of Telangana / T-Hub',
      description: 'Early-stage funding and incubation support for Telangana-based startups, run alongside T-Hub programs.',
      eligibility: 'Startup registered or operating primarily out of Telangana.',
      amountRange: 'Up to ₹10L',
      applyUrl: 'https://thub.co/',
    },
    {
      name: 'MSME Champions Scheme (CGTMSE-backed loans)',
      provider: 'Ministry of MSME',
      description: 'Collateral-free credit guarantee scheme making it easier for small startups/MSMEs to get bank loans without pledging assets.',
      eligibility: 'Registered as an MSME (Udyam registration).',
      amountRange: 'Loan guarantee up to ₹2 Crore',
      applyUrl: 'https://www.cgtmse.in/',
    },
    {
      name: 'DPIIT Startup India Recognition (tax + compliance benefits)',
      provider: 'Govt. of India — DPIIT',
      description: 'Not a cash grant, but unlocks income tax exemption (80-IAC), self-certification for labour/environment laws, and easier patent filing — most founders skip this and lose real savings.',
      eligibility: 'Private limited company / LLP / partnership firm, incorporated within 10 years, turnover under ₹100 Crore in any year.',
      amountRange: 'Tax exemption on profits for 3 consecutive years',
      applyUrl: 'https://www.startupindia.gov.in/content/sih/en/startup-scheme.html',
    },
    {
      name: 'NIDHI-PRAYAS (Promoting and Accelerating Young and Aspiring Innovators)',
      provider: 'Dept. of Science & Technology (DST)',
      description: 'Grant support for converting an idea or prototype into a working model, before a company is even formally registered.',
      eligibility: 'Individual innovators or very early-stage teams, prototype not yet complete.',
      amountRange: 'Up to ₹10L',
      applyUrl: 'https://www.nidhi-prayas.org/',
    },
  ];

  await prisma.grant.createMany({ data: grants });
  console.log(`✅ Seeded ${grants.length} starter grants.`);
}

async function main() {
  console.log('🌱 Running Phase 1 setup seed...\n');
  await seedAdminAndAgent();
  await seedGrants();
  console.log('\n🌱 Done.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
