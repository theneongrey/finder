import React from 'react';
import { Icon } from './Icon';

const VARIANTS = {
  primary: { background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none', boxShadow: 'var(--shadow-accent-btn)' },
  dark: { background: 'var(--ink-900)', color: '#fff', border: 'none', boxShadow: 'none' },
  outline: { background: '#fff', color: 'var(--accent)', border: '1.5px solid var(--accent)', boxShadow: 'none' },
  subtle: { background: 'var(--bg-panel)', color: 'var(--ink-600)', border: '1px solid var(--sand-300)', boxShadow: 'none' },
  ghost: { background: 'transparent', color: 'var(--accent)', border: 'none', boxShadow: 'none' },
};

/**
 * Primary UI button. Pill-radius, bold Hanken Grotesk label, optional leading icon.
 * variant: primary (teal, main CTA) | dark (ink, secondary CTA like "Teilen") |
 * outline (teal border) | subtle (sand fill, e.g. "Ergebnisse") | ghost (text-only link button).
 */
export function Button({ variant = 'primary', icon, fullWidth = false, disabled = false, onClick, children, style }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : undefined,
        border: v.border,
        background: v.background,
        color: v.color,
        boxShadow: v.boxShadow,
        fontFamily: 'var(--font-body)',
        fontSize: variant === 'ghost' ? 'var(--fs-ui-sm)' : 'var(--fs-body-xs)',
        fontWeight: 'var(--weight-bold)',
        padding: variant === 'ghost' ? 0 : '12px 18px',
        borderRadius: variant === 'ghost' ? 0 : 'var(--radius-md)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon ? <Icon name={icon} size={15} /> : null}
      {children}
    </button>
  );
}
