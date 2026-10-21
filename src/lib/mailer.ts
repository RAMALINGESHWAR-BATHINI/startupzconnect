/**
 * Email sending via Resend.
 *
 * Requires RESEND_API_KEY and RESEND_FROM_EMAIL in the environment.
 * Without them, emails are logged to the server console instead — fully
 * functional for local development, but nobody receives anything in
 * production until these two env vars are set.
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'StartupzConnect <noreply@startupzconnect.com>';

export async function sendMail(to: string, subject: string, bodyText: string) {
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL,
          to,
          subject,
          text: bodyText,
        }),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error(`Resend API error (${res.status}):`, errBody);
      }
      return;
    } catch (err) {
      console.error('Failed to send email via Resend:', err);
      // Fall through to console logging below so the message isn't silently lost.
    }
  }

  // Dev fallback / failure fallback — always visible in server logs.
  console.log(`\n─── MAIL ${RESEND_API_KEY ? '(send failed, logged instead)' : '(stub — no RESEND_API_KEY set)'} ───\nTo: ${to}\nSubject: ${subject}\n\n${bodyText}\n───────────────────\n`);
}

export function emailBackend(): 'resend' | 'console-stub' {
  return RESEND_API_KEY ? 'resend' : 'console-stub';
}
