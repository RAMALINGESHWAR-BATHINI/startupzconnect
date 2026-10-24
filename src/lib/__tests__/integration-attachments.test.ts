import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '@/lib/prisma';
import { signAccessToken } from '@/lib/auth';

describe('integration: rfq attachments', () => {
  let buyer: any, vendor: any, outsider: any, buyerOrg: any, vendorOrg: any, outsiderOrg: any;
  let buyerToken: string, vendorToken: string, outsiderToken: string;
  let rfqId: number, responseId: number;

  beforeAll(async () => {
    buyer = await prisma.user.create({ data: { name: 'B', email: 'b2@test.com', password: 'x', role: 'USER' } });
    vendor = await prisma.user.create({ data: { name: 'V', email: 'v2@test.com', password: 'x', role: 'USER' } });
    outsider = await prisma.user.create({ data: { name: 'O', email: 'o2@test.com', password: 'x', role: 'USER' } });
    buyerOrg = await prisma.organization.create({ data: { name: 'BuyerOrg2' } });
    vendorOrg = await prisma.organization.create({ data: { name: 'VendorOrg2' } });
    outsiderOrg = await prisma.organization.create({ data: { name: 'OutsiderOrg2' } });
    await prisma.organizationMembership.create({ data: { organizationId: buyerOrg.id, userId: buyer.id, role: 'OWNER' } });
    await prisma.organizationMembership.create({ data: { organizationId: vendorOrg.id, userId: vendor.id, role: 'OWNER' } });
    await prisma.organizationMembership.create({ data: { organizationId: outsiderOrg.id, userId: outsider.id, role: 'OWNER' } });
    buyerToken = signAccessToken({ id: buyer.id, email: buyer.email, role: 'USER' }) as string;
    vendorToken = signAccessToken({ id: vendor.id, email: vendor.email, role: 'USER' }) as string;
    outsiderToken = signAccessToken({ id: outsider.id, email: outsider.email, role: 'USER' }) as string;

    // create rfq + response
    const rfq = await prisma.rfq.create({ data: { buyerOrganizationId: buyerOrg.id, title: 't', description: 'd', category: 'c', status: 'OPEN' } });
    rfqId = rfq.id;
    const resp = await prisma.rfqResponse.create({ data: { rfqId, vendorOrganizationId: vendorOrg.id, message: 'hi', status: 'SUBMITTED' } });
    responseId = resp.id;
  });

  const setToken = (t: string | null) => (globalThis as any).__setCookieToken(t);

  it('unauthenticated upload rejected', async () => {
    setToken(null);
    const { POST } = await import('@/app/api/rfqs/[id]/responses/[responseId]/attachments/route');
    const form = new FormData();
    form.append('file', new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'a.pdf');
    const req = new Request(`http://x/api/rfqs/${rfqId}/responses/${responseId}/attachments`, { method: 'POST', body: form });
    const res = await POST(req, { params: Promise.resolve({ id: String(rfqId), responseId: String(responseId) }) });
    expect(res.status).toBe(401);
  });

  it('unrelated org cannot upload', async () => {
    setToken(outsiderToken);
    const { POST } = await import('@/app/api/rfqs/[id]/responses/[responseId]/attachments/route');
    const form = new FormData();
    form.append('file', new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'a.pdf');
    const req = new Request(`http://x/api/rfqs/${rfqId}/responses/${responseId}/attachments`, { method: 'POST', body: form });
    const res = await POST(req, { params: Promise.resolve({ id: String(rfqId), responseId: String(responseId) }) });
    expect(res.status).toBe(403);
  });

  it('invalid file type rejected', async () => {
    setToken(vendorToken);
    const { POST } = await import('@/app/api/rfqs/[id]/responses/[responseId]/attachments/route');
    const form = new FormData();
    form.append('file', new Blob(['hello'], { type: 'text/plain' }), 'a.txt');
    const req = new Request(`http://x/api/rfqs/${rfqId}/responses/${responseId}/attachments`, { method: 'POST', body: form });
    const res = await POST(req, { params: Promise.resolve({ id: String(rfqId), responseId: String(responseId) }) });
    expect(res.status).toBe(415);
  });

  it('vendor uploads valid file', async () => {
    setToken(vendorToken);
    const { POST } = await import('@/app/api/rfqs/[id]/responses/[responseId]/attachments/route');
    const form = new FormData();
    form.append('file', new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'a.pdf');
    const req = new Request(`http://x/api/rfqs/${rfqId}/responses/${responseId}/attachments`, { method: 'POST', body: form });
    const res = await POST(req, { params: Promise.resolve({ id: String(rfqId), responseId: String(responseId) }) });
    expect(res.status).toBe(201);
  });

  it('outsider cannot download attachments', async () => {
    setToken(outsiderToken);
    const { GET } = await import('@/app/api/rfqs/[id]/responses/[responseId]/attachments/route');
    const res = await GET(new Request(`http://x/api/rfqs/${rfqId}/responses/${responseId}/attachments`), { params: Promise.resolve({ id: String(rfqId), responseId: String(responseId) }) });
    expect(res.status).toBe(403);
  });

  it('buyer can list attachments', async () => {
    setToken(buyerToken);
    const { GET } = await import('@/app/api/rfqs/[id]/responses/[responseId]/attachments/route');
    const res = await GET(new Request(`http://x/api/rfqs/${rfqId}/responses/${responseId}/attachments`), { params: Promise.resolve({ id: String(rfqId), responseId: String(responseId) }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
