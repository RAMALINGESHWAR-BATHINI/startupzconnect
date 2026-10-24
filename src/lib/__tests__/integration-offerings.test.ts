import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '@/lib/prisma';
import { signAccessToken } from '@/lib/auth';


describe('integration: offerings auth', () => {
  let userA: any, userB: any, orgA: any, orgB: any, tokenA: string, tokenB: string;

  beforeAll(async () => {
    userA = await prisma.user.create({ data: { name: 'A', email: 'a@test.com', password: 'x', role: 'USER' } });
    userB = await prisma.user.create({ data: { name: 'B', email: 'b@test.com', password: 'x', role: 'USER' } });
    orgA = await prisma.organization.create({ data: { name: 'OrgA' } });
    orgB = await prisma.organization.create({ data: { name: 'OrgB' } });
    await prisma.organizationMembership.create({ data: { organizationId: orgA.id, userId: userA.id, role: 'OWNER' } });
    await prisma.organizationMembership.create({ data: { organizationId: orgB.id, userId: userB.id, role: 'OWNER' } });
    tokenA = signAccessToken({ id: userA.id, email: userA.email, role: 'USER' }) as string;
    tokenB = signAccessToken({ id: userB.id, email: userB.email, role: 'USER' }) as string;
  });

  it('unauthenticated create returns 401', async () => {
    (globalThis as any).__setCookieToken(null);
    const { POST } = await import('@/app/api/organizations/[id]/offerings/route');
    const req = new Request(`http://x/api/organizations/${orgA.id}/offerings`, { method: 'POST', body: JSON.stringify({ title: 't', description: 'd', category: 'c' }), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req, { params: Promise.resolve({ id: String(orgA.id) }) });
    expect(res.status).toBe(401);
  });

  it('non-member cannot create offering in orgB', async () => {
    (globalThis as any).__setCookieToken(tokenA);
    const { POST } = await import('@/app/api/organizations/[id]/offerings/route');
    const req = new Request(`http://x/api/organizations/${orgB.id}/offerings`, { method: 'POST', body: JSON.stringify({ title: 't', description: 'd', category: 'c' }), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req, { params: Promise.resolve({ id: String(orgB.id) }) });
    expect(res.status).toBe(403);
  });

  it('member creates offering in own org', async () => {
    (globalThis as any).__setCookieToken(tokenA);
    const { POST } = await import('@/app/api/organizations/[id]/offerings/route');
    const req = new Request(`http://x/api/organizations/${orgA.id}/offerings`, { method: 'POST', body: JSON.stringify({ title: 't', description: 'd', category: 'c' }), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req, { params: Promise.resolve({ id: String(orgA.id) }) });
    expect(res.status).toBe(201);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
