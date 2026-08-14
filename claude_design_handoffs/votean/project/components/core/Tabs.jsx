import React from 'react';

/**
 * Underline tab row — top-level Überblick/Projekte/Umfragen nav and the
 * ShareSheet's Einladen/Mitglieder sub-tabs share this pattern.
 */
export function Tabs({ items, value, onChange, size = 'md' }) {
  return (
    <div style={{ display: 'flex', gap: size === 'sm' ? 22 : 24, borderBottom: '1px solid var(--border-hairline)' }}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            style={{
              border: 'none',
              background: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: size === 'sm' ? 'var(--fs-body-sm)' : 'var(--fs-body)',
              fontWeight: active ? 'var(--weight-bold)' : 'var(--weight-semibold)',
              cursor: 'pointer',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              padding: '0 0 12px',
              marginBottom: -1,
              borderBottom: active ? '2.5px solid var(--accent)' : '2.5px solid transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {item.label}
            {item.count != null ? (
              <span
                style={{
                  fontSize: 'var(--fs-caption-sm)',
                  fontWeight: 'var(--weight-bold)',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  background: active ? 'var(--accent-tint)' : 'var(--cream-300)',
                  padding: '1px 7px',
                  borderRadius: 10,
                }}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
