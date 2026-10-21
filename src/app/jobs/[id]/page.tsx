import type { Metadata } from 'next';
import JobDetailClient from './JobDetailClient';
import prisma from '@/lib/prisma';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const jobId = parseInt(id);
  if (isNaN(jobId)) return { title: 'Job | startupZconnect' };

  try {
    const job = await prisma.jobOpening.findUnique({
      where: { id: jobId },
      select: { title: true, type: true, startup: { select: { name: true } } },
    });
    if (!job) return { title: 'Job Not Found | startupZconnect' };

    return {
      title: `${job.title} at ${job.startup.name} | startupZconnect`,
      description: `${job.type || 'Open role'} at ${job.startup.name}. Apply on startupZconnect.`,
    };
  } catch {
    return { title: 'Job | startupZconnect' };
  }
}

export default function JobDetailPage() {
  return <JobDetailClient />;
}
