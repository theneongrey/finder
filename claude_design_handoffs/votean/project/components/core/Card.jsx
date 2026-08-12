import React from 'react';

/**
 * Base white surface card — the foundation under ProjectCard/TopicCard and most
 * grouped content. accentBorder adds the 4px left teal border used on the
 * question-summary and create-poll-option cards.
 */
export function Card({ padding = 20, radius = 'var(--radius-3xl)', accentBorder = false, style, children }) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--surface-card)',
        borderRadius: radius,
        padding,
        boxShadow: 'var(--shadow-card-soft)',
        border: accentBorder ? 'none' : '1px solid var(--border-hairline-soft)',
        borderLeft: accentBorder ? '4px solid var(--accent)' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
