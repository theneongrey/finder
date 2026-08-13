import React from 'react';
import { Icon } from '../core/Icon';

/**
 * Yes / Skip / No voting trio from the date-poll voting screen — two large circular
 * buttons flank a plain-text skip link.
 */
export function VoteButtons({ onYes, onSkip, onNo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, width: '100%' }}>
      <button
        onClick={onNo}
        style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid var(--red-200)', background: 'var(--red-100)', color: 'var(--red-700)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
      >
        <Icon name="close" size={24} strokeWidth={2.6} />
      </button>
      <button onClick={onSkip} style={{ border: 'none', background: 'none', color: 'var(--accent)', fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)', fontWeight: 'var(--weight-bold)', cursor: 'pointer' }}>
        Überspringen
      </button>
      <button
        onClick={onYes}
        style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid var(--teal-300)', background: '#fff', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
      >
        <Icon name="heart" size={24} />
      </button>
    </div>
  );
}
