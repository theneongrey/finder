import React from 'react';

const SIZES = { sm: 27, md: 34, lg: 38 };

/**
 * Round initials avatar. bg/fg should come from the shared person palette
 * (--person-1-bg/fg .. --person-6-bg/fg) assigned round-robin per member.
 */
export function Avatar({ initial, bg = 'var(--person-1-bg)', fg = 'var(--person-1-fg)', size = 'md', ring = false }) {
  const px = typeof size === 'number' ? size : SIZES[size] || SIZES.md;
  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: 'var(--radius-circle)',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        fontWeight: 'var(--weight-bold)',
        fontSize: Math.round(px * 0.4),
        flex: 'none',
        border: ring ? '2.5px solid #fff' : 'none',
        boxSizing: 'border-box',
      }}
    >
      {initial}
    </div>
  );
}
