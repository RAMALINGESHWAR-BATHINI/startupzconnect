import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  if (process.env.DB) {
    const adapter = new PrismaD1(process.env.DB as any);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

// Fix #22: always reuse the singleton (not just in dev)
const prisma = globalThis.__prisma ?? createPrismaClient();
globalThis.__prisma = prisma;

export default prisma;
