import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { type Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/notify';

export async function POST(request: Request) {
  try {
    const req = request as any;
    const auth = await authorizeAdmin(req, { permission: 'users.notify' as Permission });
    if (auth instanceof NextResponse) return auth;

    const { email, title, message } = await request.json();
    if (!email || !title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Email, title, and message are required.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!targetUser) return NextResponse.json({ error: 'No user found with that email.' }, { status: 404 });

    await notifyUser(targetUser.id, title.trim(), message.trim());
    return NextResponse.json({ message: `Notification sent to ${targetUser.name}.` });
  } catch (err) {
    console.error('POST /admin/notify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
