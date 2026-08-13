import React from 'react';

/**
 * Text/date/time input in Votean's rounded-hairline style. Native <input type="date">/
 * type="time"> get the same treatment — no custom picker is built.
 */
export function Input({ type = 'text', value, onChange, placeholder, background = 'var(--bg-input)', style, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid var(--border-hairline-strong)',
        background,
        borderRadius: 'var(--radius-sm)',
        padding: '11px 14px',
        fontSize: 'var(--fs-body-xs)',
        fontFamily: 'var(--font-body)',
        color: 'var(--text-primary)',
        ...style,
      }}
      {...rest}
    />
  );
}
