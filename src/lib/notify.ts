import prisma from '@/lib/prisma';

/** Creates an in-app notification. Never throws — a failed notification should
 * never break the action that triggered it (e.g. approving an inspection). */
export async function notifyUser(userId: number, title: string, message: string, link?: string) {
  try {
    await prisma.notification.create({ data: { userId, title, message, link: link || null } });
  } catch (err) {
    console.error('notifyUser failed:', err);
  }
}
