import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://startupzconnect.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/admin/', '/agent/', '/api/'] },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
