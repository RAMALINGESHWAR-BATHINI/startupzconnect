import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://startupzconnect.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '', '/startups', '/jobs', '/investments', '/cofounders', '/mentors',
    '/events', '/grants', '/press', '/login', '/register',
  ];
  return staticRoutes.map(route => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'hourly',
    priority: route === '' ? 1 : 0.8,
  }));
  // Note: startup/job detail pages (/startups/[id], /jobs/[id]) are dynamic
  // and DB-backed. Once the site has real traffic, extend this by querying
  // prisma.startup.findMany({ select: { id: true, updatedAt: true } }) and
  // prisma.jobOpening.findMany(...) here and mapping them into the array above.
}
