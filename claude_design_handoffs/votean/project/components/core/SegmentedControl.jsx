import React from 'react';

/**
 * Track-style segmented toggle (visibility Nur Eingeladene/Offen, role picker,
 * link-role picker). The active segment gets a white pill with a subtle shadow.
 */
export function SegmentedControl({ options, value, onChange, size = 'md' }) {
  return (
    <div style={{ display: 'flex', gap: 6, background: 'var(--cream-300)', padding: 4, borderRadius: 'var(--radius-md)' }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              padding: size === 'sm' ? '8px 4px' : '9px 8px',
              fontFamily: 'var(--font-body)',
              fontSize: size === 'sm' ? 'var(--fs-caption)' : 'var(--fs-ui-sm)',
              fontWeight: active ? 'var(--weight-bold)' : 'var(--weight-semibold)',
              cursor: 'pointer',
              background: active ? '#fff' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: active ? '0 1px 4px rgba(20,24,28,.1)' : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
