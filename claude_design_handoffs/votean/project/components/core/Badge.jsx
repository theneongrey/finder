import React from 'react';

const VARIANTS = {
  accent: { background: 'var(--accent-tint)', color: 'var(--accent)' },
  neutral: { background: 'var(--sand-100)', color: 'var(--ink-400)' },
  warning: { background: 'var(--amber-100)', color: 'var(--warning)' },
  viewer: { background: 'var(--sand-100)', color: 'var(--ink-400)' },
  contributor: { background: 'var(--accent-tint)', color: 'var(--accent)' },
  manager: { background: 'var(--purple-badge-bg)', color: 'var(--purple-fg)' },
  success: { background: 'var(--green-badge-bg)', color: 'var(--green-badge-fg)' },
};

/**
 * Small pill badge. Used for project/topic count chips, "Ohne Projekt", role labels
 * (viewer/contributor/manager), and the "Meiste Stimmen" trophy callout.
 */
export function Badge({ variant = 'neutral', icon, children }) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: v.background,
        color: v.color,
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--fs-ui-sm)',
        fontWeight: 'var(--weight-bold)',
        padding: '6px 13px',
        borderRadius: 'var(--radius-pill)',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </span>
  );
}

/** Status pill with a leading colored dot — "Läuft" (open, green) / "Beendet" (closed, muted). */
export function StatusDot({ label, tone = 'positive' }) {
  const color = tone === 'positive' ? 'var(--positive)' : 'var(--text-muted)';
  const dot = tone === 'positive' ? 'var(--positive-strong)' : 'var(--sand-500)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'var(--fs-caption-sm)', fontWeight: 'var(--weight-bold)', color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />
      {label}
    </span>
  );
}
