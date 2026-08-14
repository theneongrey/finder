import React from 'react';

/**
 * Bottom-anchored modal sheet shell (used by ShareSheet). Drag handle, title +
 * subtitle + close button header, scrollable body.
 */
export function BottomSheet({ title, subtitle, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--backdrop-scrim)', backdropFilter: 'blur(1px)' }} />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 'var(--mobile-max-width)',
          background: 'var(--bg-sheet)',
          borderRadius: '26px 26px 0 0',
          boxShadow: 'var(--shadow-sheet)',
          padding: '10px 22px 26px',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: 38, height: 4.5, borderRadius: 3, background: 'var(--cream-400)', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: 'var(--fs-display-2xs)', fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: 'var(--tracking-display-sm)', fontFamily: 'var(--font-display)' }}>{title}</div>
            {subtitle ? <div style={{ fontSize: 'var(--fs-ui)', color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</div> : null}
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', border: 'none', background: 'var(--sand-200)', color: 'var(--ink-500)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
