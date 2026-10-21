/**
 * Validation for Design-admin managed content. Strict: unknown properties are rejected, links must be
 * internal paths (content can never carry a javascript: or off-site link), text is length-limited, and
 * everything is rendered through React's normal escaping — never as HTML.
 */
import type { Permission } from './permissions';

export const SETTING_KEYS = ['branding', 'theme', 'navigation', 'homepage'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];
export const SETTING_PERMISSION: Record<SettingKey, Permission> = {
  branding: 'design.content.edit', navigation: 'design.content.edit', homepage: 'design.content.edit', theme: 'design.theme.update',
};
export const DEFAULT_SETTINGS: Record<SettingKey, Record<string, unknown>> = {
  branding: { siteName: 'StartupzConnect', tagline: 'Connect with startups, hire, collaborate and raise funds.' },
  theme: { accent: '#6366f1' },
  navigation: { links: [] },
  homepage: {
    heroTitle: 'Connect with startups. Build what comes next.',
    heroSubtitle: 'Find verified startups, open roles, collaborators and investors in one place.',
    primaryCtaLabel: 'Explore startups', primaryCtaHref: '/startups', showStats: true, showFeatures: true,
  },
};

const INTERNAL_PATH = /^\/(?!\/)[A-Za-z0-9\-._~\/?#=&%]{0,199}$/;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;
type R = { ok: true; value: Record<string, unknown> } | { ok: false; errors: string[] };

function text(errors: string[], o: any, k: string, min: number, max: number): string | undefined {
  const v = o[k];
  if (typeof v !== 'string') { errors.push(`${k} must be text.`); return; }
  const t = v.trim();
  if (t.length < min || t.length > max) errors.push(`${k} must be ${min === 0 ? 'at most' : `${min} to`} ${max} characters.`);
  if (CONTROL.test(t)) errors.push(`${k} contains invalid characters.`);
  return t;
}
function href(errors: string[], v: unknown, label: string): string | undefined {
  if (typeof v !== 'string' || !INTERNAL_PATH.test(v)) { errors.push(`${label} must be a path on this site, such as /startups.`); return; }
  return v;
}
function onlyKeys(errors: string[], o: object, allowed: string[]) {
  for (const k of Object.keys(o)) if (!allowed.includes(k)) errors.push(`Unknown field: ${k}.`);
}

export function validateSetting(key: unknown, value: unknown): R {
  if (typeof key !== 'string' || !(SETTING_KEYS as readonly string[]).includes(key)) return { ok: false, errors: ['Unknown setting.'] };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, errors: ['Invalid value.'] };
  const o = value as any; const errors: string[] = [];
  let out: Record<string, unknown> = {};
  if (key === 'branding') {
    onlyKeys(errors, o, ['siteName', 'tagline']);
    out = { siteName: text(errors, o, 'siteName', 1, 60), tagline: text(errors, o, 'tagline', 0, 140) };
  } else if (key === 'theme') {
    onlyKeys(errors, o, ['accent']);
    if (typeof o.accent !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(o.accent)) errors.push('accent must be a hex colour such as #6366f1.');
    out = { accent: o.accent };
  } else if (key === 'navigation') {
    onlyKeys(errors, o, ['links']);
    if (!Array.isArray(o.links) || o.links.length > 6) errors.push('links must be a list of at most 6 items.');
    else out = { links: o.links.map((l: any, i: number) => {
      if (!l || typeof l !== 'object') { errors.push(`Link ${i + 1} is invalid.`); return null; }
      onlyKeys(errors, l, ['label', 'href']);
      return { label: text(errors, l, 'label', 1, 24), href: href(errors, l.href, `Link ${i + 1}`) };
    }) };
  } else {
    onlyKeys(errors, o, ['heroTitle', 'heroSubtitle', 'primaryCtaLabel', 'primaryCtaHref', 'showStats', 'showFeatures']);
    if (typeof o.showStats !== 'boolean' || typeof o.showFeatures !== 'boolean') errors.push('showStats and showFeatures must be true or false.');
    out = {
      heroTitle: text(errors, o, 'heroTitle', 1, 90), heroSubtitle: text(errors, o, 'heroSubtitle', 0, 240),
      primaryCtaLabel: text(errors, o, 'primaryCtaLabel', 1, 30), primaryCtaHref: href(errors, o.primaryCtaHref, 'Button link'),
      showStats: o.showStats, showFeatures: o.showFeatures,
    };
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: out };
}
