import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'admin.settings.read' as Permission });
    if (auth instanceof NextResponse) return auth;

    return NextResponse.json({
      features: { multiDeviceSessions: true, turnstile: !!process.env.TURNSTILE_SECRET_KEY, r2PrivateBucket: !!process.env.R2_PRIVATE_BUCKET_NAME },
      note: 'TLS, HSTS, WAF and Cloudflare Access are infrastructure-level settings managed in the Cloudflare dashboard.',
    });
  } catch (err) {
    console.error('GET /admin/settings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
