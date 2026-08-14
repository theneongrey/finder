import React from 'react';
import { Icon } from '../core/Icon';

/**
 * Floating dropdown menu triggered by a kebab button (edit/delete/share on cards).
 * Renders a fixed full-screen scrim to close-on-click-outside, positioned near the trigger.
 */
export function Menu({ open, onClose, items, anchorStyle }) {
  if (!open) return null;
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 15 }} />
      <div
        style={{
          position: 'absolute',
          top: 48,
          right: 16,
          background: '#fff',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-overlay)',
          padding: 6,
          minWidth: 160,
          zIndex: 20,
          ...anchorStyle,
        }}
      >
        {items.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              border: 'none',
              background: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--fs-ui)',
              fontWeight: 'var(--weight-semibold)',
              color: item.danger ? 'var(--negative)' : 'var(--ink-700)',
              padding: '9px 10px',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Icon name={item.icon} size={15} />
            {item.label}
          </button>
        ))}
      </div>
    </React.Fragment>
  );
}
