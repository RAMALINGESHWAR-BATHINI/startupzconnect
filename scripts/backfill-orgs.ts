import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const startups = await prisma.startup.findMany();
  let create = 0, skip = 0, conflict = 0;
  for (const s of startups) {
    if (s.organizationId) {
      // verify membership exists
      const mem = await prisma.organizationMembership.findUnique({ where: { organizationId_userId: { organizationId: s.organizationId, userId: s.founderId } } });
      if (!mem) {
        if (!dryRun) await prisma.organizationMembership.create({ data: { organizationId: s.organizationId, userId: s.founderId, role: 'OWNER' } });
        create++;
      } else {
        if (mem.role !== 'OWNER') { conflict++; console.warn(`CONFLICT: startup ${s.id} founder ${s.founderId} has membership role ${mem.role}`); }
        else skip++;
      }
      continue;
    }
    // find existing org by name to avoid duplicates
    const existingOrg = await prisma.organization.findFirst({ where: { name: s.name } });
    if (existingOrg) {
      console.warn(`SKIP (name collision): startup ${s.id} "${s.name}" matches org ${existingOrg.id}; manual review required.`);
      conflict++;
      continue;
    }
    if (dryRun) { create++; continue; }
    const org = await prisma.organization.create({ data: { name: s.name } });
    await prisma.startup.update({ where: { id: s.id }, data: { organizationId: org.id } });
    await prisma.organizationMembership.create({ data: { organizationId: org.id, userId: s.founderId, role: 'OWNER' } });
    create++;
  }
  console.log(`Dry-run=${dryRun} create=${create} skip=${skip} conflict=${conflict} total=${startups.length}`);
}
main().finally(() => prisma.$disconnect());
