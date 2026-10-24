import { vi } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const tmpDb = path.join(process.cwd(), 'prisma', 'test-' + process.pid + '-' + Date.now() + '.db');
process.env.DATABASE_URL = 'file:' + tmpDb;

try { if (fs.existsSync(tmpDb)) fs.unlinkSync(tmpDb); } catch {}
execSync('npx prisma db push --skip-generate', { stdio: 'pipe', env: { ...process.env, DATABASE_URL: 'file:' + tmpDb } });

process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-1234567890';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-1234567890';

let cookieStore: Record<string, string> = {};
export function setCookieToken(token: string | null) {
  if (token) cookieStore.accessToken = token; else delete cookieStore.accessToken;
}
(globalThis as any).__setCookieToken = setCookieToken;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieStore[name] ? { value: cookieStore[name] } : undefined),
  }),
}));
