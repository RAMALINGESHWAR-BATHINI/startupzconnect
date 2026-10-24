import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '@/lib/prisma';
import { signAccessToken } from '@/lib/auth';

describe('integration: rfq attachments competing vendor', () => {
  let rfqId2: number, responseId2: number;
  beforeAll(async () => {
    const buyer = await prisma.user.create({ data: { name: 'B3', email: 'b3b@test.com', password: 'x', role: 'USER' } });
    const vendor = await prisma.user.create({ data: { name: 'V2', email: 'v3b@test.com', password: 'x', role: 'USER' } });
    const buyerOrg = await prisma.organization.create({ data: { name: 'BuyerOrg3b' } });
    const vendorOrg = await prisma.organization.create({ data: { name: 'VendorOrg3b' } });
    await prisma.organizationMembership.create({ data: { organizationId: buyerOrg.id, userId: buyer.id, role: 'OWNER' } });
    await prisma.organizationMembership.create({ data: { organizationId: vendorOrg.id, userId: vendor.id, role: 'OWNER' } });
    const rfq = await prisma.rfq.create({ data: { buyerOrganizationId: buyerOrg.id, title: 't', description: 'd', category: 'c', status: 'OPEN' } });
    rfqId2 = rfq.id;
    const resp = await prisma.rfqResponse.create({ data: { rfqId: rfq.id, vendorOrganizationId: vendorOrg.id, message: 'hi', status: 'SUBMITTED', attachments: JSON.stringify(['claims/test-key.pdf']) } });
    responseId2 = resp.id;
  });

  const setToken = (t: string | null) => (globalThis as any).__setCookieToken(t);

  it('competing vendor cannot list attachments', async () => {
    const compUser = await prisma.user.create({ data: { name: 'Comp', email: 'compb@test.com', password: 'x', role: 'USER' } });
    const compOrg = await prisma.organization.create({ data: { name: 'CompOrgb' } });
    await prisma.organizationMembership.create({ data: { organizationId: compOrg.id, userId: compUser.id, role: 'OWNER' } });
    const compToken = signAccessToken({ id: compUser.id, email: compUser.email, role: 'USER' }) as string;
    setToken(compToken);
    const { GET } = await import('@/app/api/rfqs/[id]/responses/[responseId]/attachments/route');
    const res = await GET(new Request(`http://x/api/rfqs/${rfqId2}/responses/${responseId2}/attachments`), { params: Promise.resolve({ id: String(rfqId2), responseId: String(responseId2) }) });
    expect(res.status).toBe(403);
  });

  it('signed url expiry config returns a url string', async () => {
    const { getSignedUrl } = await import('@/lib/storage');
    const url = await getSignedUrl('claims/test-key.pdf', 300);
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
  });
});
