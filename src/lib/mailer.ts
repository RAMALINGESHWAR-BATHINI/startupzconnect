import nodemailer from 'nodemailer';

const isProd = process.env.NODE_ENV === 'production';

function getTransport() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

export async function sendMail(to: string, subject: string, text: string, html?: string) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'startupzconnect@gmail.com';
  if (!transport) {
    if (!isProd) console.log(`MAIL (dev stub) to ${to}: ${subject}`);
    return false;
  }
  try {
    await transport.sendMail({ from: `StartupzConnect <${from}>`, to, subject, text, html });
    return true;
  } catch (err) {
    console.error('sendMail failed:', err);
    return false;
  }
}

export function emailBackend(): 'smtp' | 'console-stub' {
  return getTransport() ? 'smtp' : 'console-stub';
}
