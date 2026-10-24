import { NextResponse } from 'next/server';
import { notifyAdmin } from '@/lib/alerts';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateToken, hoursFromNow } from '@/lib/tokens';
import { sendMail } from '@/lib/mailer';
import { consume, authKey } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { validatePassword } from '@/lib/password-policy';
import { validateRegistrationProfile } from '@/lib/registration-rules';

const ALLOWED_ROLES = ['STUDENT', 'PROFESSIONAL', 'STARTUP', 'INVESTOR', 'MENTOR', 'ORGANIZATION', 'OTHER'] as const;

// Fields on the User model that can be set directly from registration profile.
const USER_PROFILE_FIELDS = new Set([
  'organization', 'location', 'portfolio', 'bio', 'skills',
  'investorNetWorth', 'investorTicketSize', 'investorThesis', 'investorSectors',
  'investorPastDeals', 'sebiRegNumber', 'mentorExpertise', 'mentorAvailability',
  'mentorBio', 'mentorIsActive',
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, acceptTerms, turnstileToken, profile } = body;

    const ip = (request.headers.get('x-forwarded-for') ?? request.headers.get('cf-connecting-ip') ?? null);

    // Rate limit per email + per IP (fail closed on DB error).
    const rl = await consume(authKey(email ?? null, ip, 'register'), { failClosed: true });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds ?? 900) } }
      );
    }

    // Turnstile verification (fail closed once configured).
    if (process.env.TURNSTILE_SECRET_KEY) {
      const ts = await verifyTurnstile(turnstileToken, ip);
      if (!ts.ok) {
        return NextResponse.json({ error: 'Security check failed. Please try again.' }, { status: 400 });
      }
    }

    // Accept either a profile object (wizard) or flat legacy fields.
    let roleValue = role;
    let profileInput = profile;
    let nameValue = name;
    let emailValue = email;
    let passwordValue = password;
    let acceptTermsValue = acceptTerms;

    if (profileInput && typeof profileInput === 'object') {
      roleValue = profileInput.role;
      nameValue = profileInput.name ?? nameValue;
      emailValue = profileInput.email ?? emailValue;
      passwordValue = profileInput.password ?? passwordValue;
      acceptTermsValue = profileInput.acceptTerms ?? acceptTermsValue;
    }

    if (!nameValue || !emailValue || !passwordValue) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }
    if (!acceptTermsValue) {
      return NextResponse.json({ error: 'You must agree to the Terms of Service and Privacy Policy.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    // Password policy (authoritative server-side).
    const pwCheck = validatePassword(passwordValue, { email: emailValue, name: nameValue });
    if (!pwCheck.ok) {
      return NextResponse.json({ error: pwCheck.errors.join(' ') }, { status: 400 });
    }

    const validated = validateRegistrationProfile(roleValue, profileInput ?? {});
    if (!validated.ok) {
      return NextResponse.json({ error: 'Invalid profile fields.', fields: validated.errors }, { status: 400 });
    }

    // Never accept ADMIN or arbitrary values from client.
    const safeRole = ALLOWED_ROLES.includes(roleValue) ? roleValue : 'STUDENT';

    // Only persist fields that exist on the User model; startup-specific fields
    // (startupName, domain, stage, registrationId, websiteUrl) are collected by
    // the wizard but stored when the founder creates their Startup record later.
    const userProfileData: Record<string, unknown> = {};
    if (validated.ok && validated.clean) {
      for (const [k, v] of Object.entries(validated.clean)) {
        if (USER_PROFILE_FIELDS.has(k)) {
          userProfileData[k] = v;
        }
      }
    }

    const hashedPassword = await bcrypt.hash(passwordValue, 12);
    const emailVerifyToken = generateToken();

    const user = await prisma.user.create({
      data: {
        name: nameValue.trim(),
        email: emailValue.toLowerCase().trim(),
        password: hashedPassword,
        role: safeRole,
        emailVerifyToken,
        emailVerifyExpires: hoursFromNow(24),
        termsAcceptedAt: new Date(),
        ...userProfileData,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/verify-email?token=${emailVerifyToken}`;
    await sendMail(
      user.email,
      'Verify your StartupzConnect email',
      `Hi ${user.name},\n\nWelcome to StartupzConnect! Please verify your email by opening this link:\n${verifyUrl}\n\nThis link expires in 24 hours.`
    );

    return NextResponse.json({ message: 'User registered successfully. Please check your email to verify your account.', user }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }
    console.error('Registration error:', err);
    await notifyAdmin('Registration error', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
