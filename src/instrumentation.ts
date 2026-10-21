/**
 * Next.js instrumentation hook — catches uncaught server-side errors
 * (API routes, server components) that would otherwise only show up in
 * raw server logs, and routes them through the same alert channel as
 * everything else (see src/lib/alerts.ts).
 */
export async function onRequestError(err: unknown, request: { path?: string }) {
  const { notifyAdmin } = await import('@/lib/alerts');
  await notifyAdmin(`Uncaught server error on ${request?.path ?? 'unknown route'}`, err);
}
