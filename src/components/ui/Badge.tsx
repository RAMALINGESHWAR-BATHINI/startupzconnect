import React from 'react';

const BADGE_TIERS: Record<string, { label: string; cls: string; icon: string }> = {
  NONE:          { label: 'Unverified',     cls: 'badge badge-gray',    icon: '○' },
  REGISTERED:    { label: 'Registered',     cls: 'badge badge-blue',    icon: '🔵' },
  FIELD_VERIFIED:{ label: 'Field Verified', cls: 'badge badge-green',   icon: '🟢' },
  TRUSTED:       { label: 'Trusted',        cls: 'badge badge-amber',   icon: '🌟' },
  ELITE:         { label: 'Elite',          cls: 'badge badge-diamond', icon: '💎' },
};

export function BadgeTier({ tier }: { tier: string }) {
  const b = BADGE_TIERS[tier] ?? BADGE_TIERS.NONE;
  return <span className={b.cls}>{b.icon} {b.label}</span>;
}

const STAGE_MAP: Record<string, { label: string; color: string }> = {
  IDEA:        { label: 'Idea Stage',   color: 'badge-gray' },
  MVP:         { label: 'MVP Built',    color: 'badge-blue' },
  PRE_SEED:    { label: 'Pre-Seed',     color: 'badge-purple' },
  SEED:        { label: 'Seed',         color: 'badge-green' },
  SERIES_A:    { label: 'Series A',     color: 'badge-amber' },
  SERIES_B:    { label: 'Series B+',    color: 'badge-diamond' },
  BOOTSTRAPPED:{ label: 'Bootstrapped', color: 'badge-green' },
};

export function StageBadge({ stage }: { stage: string }) {
  const s = STAGE_MAP[stage] ?? { label: stage, color: 'badge-gray' };
  return <span className={`badge ${s.color}`}>{s.label}</span>;
}

const ORIGIN_MAP: Record<string, string> = {
  INDEPENDENT:     '🔨 Independent',
  INSTITUTIONAL:   '🏛 Institutional',
  ACCELERATOR:     '🚀 Accelerator Backed',
  CORPORATE_SPINOFF:'🏢 Corporate Spinoff',
  JV:              '🤝 Joint Venture',
  GOVT_BACKED:     '🇮🇳 Govt. Backed',
};

export function OriginBadge({ origin }: { origin: string }) {
  return <span className="badge badge-gray">{ORIGIN_MAP[origin] ?? origin}</span>;
}
