/**
 * Minimal mail-sending stub.
 *
 * This project does not yet have an email provider wired up (see SETUP.md —
 * Resend is the recommended next addition). Until then, verification and
 * reset links are logged to the server console so the flow is fully testable
 * in development. Swap the body of sendMail() for a real Resend/Postmark
 * call when ready — nothing else in the app needs to change.
 */
export async function sendMail(to: string, subject: string, bodyText: string) {
  if (process.env.RESEND_API_KEY) {
    // Example wiring for Resend once RESEND_API_KEY is set:
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ from: 'StartupzConnect <noreply@startupzconnect.com>', to, subject, text: bodyText }),
    // });
  }
  // Always log in dev so the flow is testable without an email provider.
  console.log(`\n─── MAIL (stub) ───\nTo: ${to}\nSubject: ${subject}\n\n${bodyText}\n───────────────────\n`);
}
