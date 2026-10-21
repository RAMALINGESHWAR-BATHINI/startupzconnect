import type { Metadata } from 'next';
import StartupDetailClient from './StartupDetailClient';
import prisma from '@/lib/prisma';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const startupId = parseInt(id);
  if (isNaN(startupId)) return { title: 'Startup | startupZconnect' };

  try {
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      select: { name: true, description: true, domain: true },
    });
    if (!startup) return { title: 'Startup Not Found | startupZconnect' };

    return {
      title: `${startup.name} | startupZconnect`,
      description: startup.description?.slice(0, 160) || `${startup.name} — a ${startup.domain || ''} startup on startupZconnect.`,
    };
  } catch {
    // DB unreachable at build/metadata time — fall back gracefully rather than failing the page.
    return { title: 'Startup | startupZconnect' };
  }
}

export default function StartupDetailPage() {
  return <StartupDetailClient />;
}
