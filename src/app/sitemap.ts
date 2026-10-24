import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://startupzconnect.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '', '/startups', '/jobs', '/investments', '/cofounders', '/mentors',
    '/events', '/grants', '/press', '/login', '/register', '/terms', '/privacy',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(route => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'hourly',
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic entries. Wrapped in try/catch so a DB hiccup never breaks the
  // whole sitemap — static routes still get returned either way.
  try {
    const [startups, jobs] = await Promise.all([
      prisma.startup.findMany({ select: { id: true, updatedAt: true } }),
      prisma.jobOpening.findMany({ where: { isOpen: true }, select: { id: true, createdAt: true } }),
    ]);

    const startupEntries: MetadataRoute.Sitemap = startups.map(s => ({
      url: `${BASE_URL}/startups/${s.id}`,
      lastModified: s.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    const jobEntries: MetadataRoute.Sitemap = jobs.map(j => ({
      url: `${BASE_URL}/jobs/${j.id}`,
      lastModified: j.createdAt,
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

    return [...staticEntries, ...startupEntries, ...jobEntries];
  } catch (err) {
    console.error('sitemap: failed to load dynamic routes, returning static only', err);
    return staticEntries;
  }
}


