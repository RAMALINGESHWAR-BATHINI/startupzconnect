import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

const scriptSrcParts = ["'self'"];
if (!isProd) scriptSrcParts.push("'unsafe-eval'");
scriptSrcParts.push("'unsafe-inline'", "https://challenges.cloudflare.com");

const cspDirectives = [
  "default-src 'self'",
  // script-src: unsafe-inline kept temporarily (compatibility debt); unsafe-eval only in dev.
  `script-src ${scriptSrcParts.join(' ')}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Allow images from self, data URIs, blobs, and the public R2 bucket.
  `img-src 'self' data: blob: ${R2_PUBLIC_URL ? R2_PUBLIC_URL : ''}`.trim(),
  // Allow connections to self, the API, R2 public bucket, and Turnstile verification.
  `connect-src 'self' ${R2_PUBLIC_URL ? R2_PUBLIC_URL : ''} https://challenges.cloudflare.com`.trim(),
  "frame-src 'self' https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // object-src: none (no plugins/embed)
  "object-src 'none'",
].filter(Boolean);

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS in production only.
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }] : []),
  {
    key: 'Content-Security-Policy',
    value: cspDirectives.join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
