/**
 * Lightweight error alerting for a solo founder running Phase 1.
 *
 * Rather than requiring a Sentry account and SDK install, this posts to any
 * incoming webhook URL (a Slack "Incoming Webhook" is the easiest to set up —
 * takes 2 minutes, no paid plan needed). Set ERROR_WEBHOOK_URL in the
 * environment to start receiving alerts; without it, errors still go to
 * console.error as before, so nothing breaks if you skip this.
 *
 * This is intentionally simple. If you outgrow it, swap the body of
 * notifyAdmin() for a real Sentry/Bugsnag call — nothing else needs to change,
 * since every call site already routes through this one function.
 */
const WEBHOOK_URL = process.env.ERROR_WEBHOOK_URL;

export async function notifyAdmin(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ALERT] ${context}:`, error);

  if (!WEBHOOK_URL) return;

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Slack-compatible payload shape; most webhook receivers accept a bare `text` field.
      body: JSON.stringify({ text: `🚨 *StartupzConnect error* — ${context}\n\`\`\`${message}\`\`\`` }),
    });
  } catch (webhookErr) {
    // Never let a failed alert attempt mask the original error.
    console.error('Failed to send error alert webhook:', webhookErr);
  }
}
