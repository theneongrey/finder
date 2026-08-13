import React from 'react';

/** Thin rounded progress track with a teal fill — used for "3 von 5 bewertet". */
export function ProgressBar({ percent, height = 9 }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div style={{ width: '100%', height, background: 'var(--cream-300)', borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', background: 'var(--accent)', borderRadius: height / 2, width: p + '%' }} />
    </div>
  );
}
