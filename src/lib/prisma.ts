import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

const prismaClientSingleton = () => {
  // If we're running in Cloudflare and the DB binding exists in process.env
  if (process.env.DB) {
    const adapter = new PrismaD1(process.env.DB as any);
    return new PrismaClient({ adapter });
  }
  
  // Fallback for local development
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
