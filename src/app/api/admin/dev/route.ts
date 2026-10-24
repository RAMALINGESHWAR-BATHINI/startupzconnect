import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';

export async function GET(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'dev.health.read' as Permission });
    if (auth instanceof NextResponse) return auth;

    return NextResponse.json({
      health: { status: 'ok', uptime: process.uptime() },
      diagnostics: { nodeVersion: process.version, env: process.env.NODE_ENV },
      integrations: { smtp: !!process.env.SMTP_USER, r2: !!process.env.R2_PRIVATE_BUCKET_NAME, turnstile: !!process.env.TURNSTILE_SECRET_KEY },
      note: 'Deployment status and release history require Cloudflare integration.',
    });
  } catch (err) {
    console.error('GET /admin/dev error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
