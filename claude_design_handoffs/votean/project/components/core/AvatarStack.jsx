import React from 'react';
import { Avatar } from './Avatar';

/**
 * Overlapping row of member avatars with a "+N" overflow bubble.
 * Used on project cards, topic cards, and project detail headers.
 */
export function AvatarStack({ members = [], max = 4, size = 'md', onAddClick }) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  const px = size === 'sm' ? 27 : size === 'lg' ? 38 : 29;
  return (
    <div style={{ display: 'flex', paddingLeft: 7 }}>
      {shown.map((m, i) => (
        <div key={i} style={{ marginLeft: -7 }}>
          <Avatar initial={m.initial} bg={m.bg} fg={m.fg} size={px} ring />
        </div>
      ))}
      {extra > 0 ? (
        <div
          style={{
            width: px,
            height: px,
            marginLeft: -7,
            borderRadius: 'var(--radius-circle)',
            background: 'var(--sand-200)',
            color: 'var(--ink-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--weight-bold)',
            fontSize: Math.round(px * 0.36),
            border: '2.5px solid #fff',
            boxSizing: 'border-box',
          }}
        >
          +{extra}
        </div>
      ) : null}
      {onAddClick ? (
        <button
          onClick={onAddClick}
          style={{
            width: px,
            height: px,
            marginLeft: -7,
            borderRadius: 'var(--radius-circle)',
            background: '#fff',
            border: '1.5px dashed var(--sand-500)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1,
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          +
        </button>
      ) : null}
    </div>
  );
}
