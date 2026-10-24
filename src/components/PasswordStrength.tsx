'use client';
import { passwordStrength, validatePassword, MIN_PASSWORD_LENGTH } from '@/lib/password-policy';

export default function PasswordStrength({ password }: { password: string }) {
  const { score, label } = passwordStrength(password);
  const checks = [
    { ok: password.length >= MIN_PASSWORD_LENGTH, text: 'Minimum length' },
    { ok: /[A-Z]/.test(password), text: 'Uppercase letter' },
    { ok: /[a-z]/.test(password), text: 'Lowercase letter' },
    { ok: /\d/.test(password), text: 'Number' },
    { ok: /[^A-Za-z0-9]/.test(password), text: 'Special character' },
  ];
  return (
    <div className="mt-2 text-xs">
      <div className="mb-1 text-slate-400">Strength: <span className="font-medium text-white">{label}</span></div>
      <ul className="space-y-1">
        {checks.map((c, i) => (
          <li key={i} className={c.ok ? 'text-emerald-400' : 'text-slate-500'}>{c.ok ? '✓' : '•'} {c.text}</li>
        ))}
      </ul>
    </div>
  );
}
