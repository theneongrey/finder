import React from 'react';

/**
 * Dashed-border "add new" affordance. `layout="row"` is the full-width list-end button
 * (Neues Projekt starten); `layout="tile"` is the icon-on-top grid tile (poll-type picker).
 */
export function EmptyStateButton({ layout = 'row', icon = 'plus', label, onClick }) {
  if (layout === 'tile') {
    return (
      <button
        onClick={onClick}
        style={{
          border: '1.5px dashed var(--sand-500)',
          background: 'rgba(255,255,255,.4)',
          borderRadius: 'var(--radius-xl)',
          padding: '18px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 9,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon === 'calendar' ? 'M3.5 5h17v15.5H3.5z' : 'M12 5v14M5 12h14'}></path></svg>
        </span>
        <span style={{ fontSize: 'var(--fs-ui)', fontWeight: 'var(--weight-bold)', color: 'var(--ink-700)', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        border: '1.5px dashed var(--sand-500)',
        background: 'rgba(255,255,255,.4)',
        borderRadius: 'var(--radius-3xl)',
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        color: 'var(--ink-600)',
        fontSize: 'var(--fs-body)',
        fontWeight: 'var(--weight-bold)',
      }}
    >
      <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, lineHeight: 1, fontWeight: 500 }}>+</span>
      {label}
    </button>
  );
}
