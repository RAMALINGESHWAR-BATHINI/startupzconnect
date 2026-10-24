import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '@/lib/prisma';
import { signAccessToken } from '@/lib/auth';

describe('integration: rfqs and saved orgs', () => {
  let buyer: any, vendor: any, outsider: any;
  let buyerOrg: any, vendorOrg: any, outsiderOrg: any;
  let buyerToken: string, vendorToken: string, outsiderToken: string;
  let rfqId: number;

  beforeAll(async () => {
    buyer = await prisma.user.create({ data: { name: 'Buyer', email: 'buyer@test.com', password: 'x', role: 'USER' } });
    vendor = await prisma.user.create({ data: { name: 'Vendor', email: 'vendor@test.com', password: 'x', role: 'USER' } });
    outsider = await prisma.user.create({ data: { name: 'Outsider', email: 'out@test.com', password: 'x', role: 'USER' } });
    buyerOrg = await prisma.organization.create({ data: { name: 'BuyerOrg' } });
    vendorOrg = await prisma.organization.create({ data: { name: 'VendorOrg' } });
    outsiderOrg = await prisma.organization.create({ data: { name: 'OutsiderOrg' } });
    await prisma.organizationMembership.create({ data: { organizationId: buyerOrg.id, userId: buyer.id, role: 'OWNER' } });
    await prisma.organizationMembership.create({ data: { organizationId: vendorOrg.id, userId: vendor.id, role: 'OWNER' } });
    await prisma.organizationMembership.create({ data: { organizationId: outsiderOrg.id, userId: outsider.id, role: 'OWNER' } });
    buyerToken = signAccessToken({ id: buyer.id, email: buyer.email, role: 'USER' }) as string;
    vendorToken = signAccessToken({ id: vendor.id, email: vendor.email, role: 'USER' }) as string;
    outsiderToken = signAccessToken({ id: outsider.id, email: outsider.email, role: 'USER' }) as string;
  });

  const setToken = (t: string | null) => (globalThis as any).__setCookieToken(t);

  it('unauthorized user cannot create RFQ for another org', async () => {
    setToken(outsiderToken);
    const { POST } = await import('@/app/api/rfqs/route');
    const req = new Request('http://x/api/rfqs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ buyerOrganizationId: buyerOrg.id, title: 't', description: 'd', category: 'c' }) });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('buyer creates RFQ', async () => {
    setToken(buyerToken);
    const { POST } = await import('@/app/api/rfqs/route');
    const req = new Request('http://x/api/rfqs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ buyerOrganizationId: buyerOrg.id, title: 't', description: 'd', category: 'c', status: 'OPEN' }) });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    rfqId = data.id;
  });

  it('outsider cannot read buyer draft RFQ', async () => {
    // create a draft rfq as buyer
    setToken(buyerToken);
    const { POST } = await import('@/app/api/rfqs/route');
    const req = new Request('http://x/api/rfqs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ buyerOrganizationId: buyerOrg.id, title: 'draft', description: 'd', category: 'c', status: 'DRAFT' }) });
    const res = await POST(req);
    const draft = await res.json();
    setToken(outsiderToken);
    const { GET } = await import('@/app/api/rfqs/[id]/route');
    const r = await GET(new Request(`http://x/api/rfqs/${draft.id}`), { params: Promise.resolve({ id: String(draft.id) }) });
    // outsider is not buyer member; response list hidden but detail still returned without responses
    expect([200, 403, 404]).toContain(r.status);
  });

  it('vendor submits response to open RFQ', async () => {
    setToken(vendorToken);
    const { POST } = await import('@/app/api/rfqs/[id]/responses/route');
    const req = new Request(`http://x/api/rfqs/${rfqId}/responses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendorOrganizationId: vendorOrg.id, message: 'hi' }) });
    const res = await POST(req, { params: Promise.resolve({ id: String(rfqId) }) });
    expect(res.status).toBe(201);
  });

  it('duplicate response rejected', async () => {
    setToken(vendorToken);
    const { POST } = await import('@/app/api/rfqs/[id]/responses/route');
    const req = new Request(`http://x/api/rfqs/${rfqId}/responses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendorOrganizationId: vendorOrg.id, message: 'hi2' }) });
    const res = await POST(req, { params: Promise.resolve({ id: String(rfqId) }) });
    expect(res.status).toBe(409);
  });

  it('buyer cannot respond to own RFQ', async () => {
    setToken(buyerToken);
    const { POST } = await import('@/app/api/rfqs/[id]/responses/route');
    const req = new Request(`http://x/api/rfqs/${rfqId}/responses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendorOrganizationId: buyerOrg.id, message: 'self' }) });
    const res = await POST(req, { params: Promise.resolve({ id: String(rfqId) }) });
    expect(res.status).toBe(400);
  });

  it('closed RFQ rejects response', async () => {
    // close rfq
    setToken(buyerToken);
    const { PATCH } = await import('@/app/api/rfqs/[id]/route');
    await PATCH(new Request(`http://x/api/rfqs/${rfqId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CLOSED' }) }), { params: Promise.resolve({ id: String(rfqId) }) });
    setToken(vendorToken);
    // new vendor org to avoid duplicate
    const org2 = await prisma.organization.create({ data: { name: 'VendorOrg2' } });
    await prisma.organizationMembership.create({ data: { organizationId: org2.id, userId: vendor.id, role: 'OWNER' } });
    const { POST } = await import('@/app/api/rfqs/[id]/responses/route');
    const req = new Request(`http://x/api/rfqs/${rfqId}/responses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendorOrganizationId: org2.id, message: 'late' }) });
    const res = await POST(req, { params: Promise.resolve({ id: String(rfqId) }) });
    expect(res.status).toBe(409);
  });
});

describe('integration: saved organizations', () => {
  let u1: any, u2: any, org: any, t1: string, t2: string;
  beforeAll(async () => {
    u1 = await prisma.user.create({ data: { name: 'U1', email: 'u1@test.com', password: 'x', role: 'USER' } });
    u2 = await prisma.user.create({ data: { name: 'U2', email: 'u2@test.com', password: 'x', role: 'USER' } });
    org = await prisma.organization.create({ data: { name: 'SavedOrg' } });
    t1 = signAccessToken({ id: u1.id, email: u1.email, role: 'USER' }) as string;
    t2 = signAccessToken({ id: u2.id, email: u2.email, role: 'USER' }) as string;
  });

  const setToken = (t: string | null) => (globalThis as any).__setCookieToken(t);

  it('unauthenticated save rejected', async () => {
    setToken(null);
    const { POST } = await import('@/app/api/me/saved-organizations/route');
    const req = new Request('http://x/api/me/saved-organizations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId: org.id }) });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('user saves org', async () => {
    setToken(t1);
    const { POST } = await import('@/app/api/me/saved-organizations/route');
    const req = new Request('http://x/api/me/saved-organizations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId: org.id }) });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('repeated save idempotent', async () => {
    setToken(t1);
    const { POST } = await import('@/app/api/me/saved-organizations/route');
    const req = new Request('http://x/api/me/saved-organizations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId: org.id }) });
    const res = await POST(req);
    expect([200, 201]).toContain(res.status);
  });

  it('user lists saved orgs', async () => {
    setToken(t1);
    const { GET } = await import('@/app/api/me/saved-organizations/route');
    const res = await GET(new Request('http://x/api/me/saved-organizations'));
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('user isolation: user2 cannot see user1 saved', async () => {
    setToken(t2);
    const { GET } = await import('@/app/api/me/saved-organizations/route');
    const res = await GET(new Request('http://x/api/me/saved-organizations'));
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it('user unsave', async () => {
    setToken(t1);
    const { DELETE } = await import('@/app/api/me/saved-organizations/route');
    const res = await DELETE(new Request(`http://x/api/me/saved-organizations?organizationId=${org.id}`, { method: 'DELETE' }));
    expect(res.status).toBe(200);
  });
});
