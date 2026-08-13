import React from 'react';
import { Icon } from './Icon';

const VARIANTS = {
  surface: { background: '#fff', color: 'var(--accent)', boxShadow: 'var(--shadow-fab)' },
  ghost: { background: 'transparent', color: 'var(--ink-250)', boxShadow: 'none' },
  dark: { background: 'var(--sand-200)', color: 'var(--ink-500)', boxShadow: 'none' },
};

/**
 * Circular icon-only button — the back button, kebab menu trigger, and sheet close button
 * all use this shape at slightly different sizes/variants.
 */
export function IconButton({ icon, variant = 'surface', size = 36, iconSize, onClick, style }) {
  const v = VARIANTS[variant] || VARIANTS.surface;
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        flex: 'none',
        border: 'none',
        borderRadius: 'var(--radius-circle)',
        background: v.background,
        color: v.color,
        boxShadow: v.boxShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        ...style,
      }}
    >
      <Icon name={icon} size={iconSize || Math.round(size * 0.44)} />
    </button>
  );
}
