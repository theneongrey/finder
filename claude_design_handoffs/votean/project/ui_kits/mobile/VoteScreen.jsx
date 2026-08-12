import React from 'react';
import { IconButton } from '../../components/core/IconButton';
import { Avatar } from '../../components/core/Avatar';
import { Icon } from '../../components/core/Icon';
import { Button } from '../../components/core/Button';
import { VoteButtons } from '../../components/patterns/VoteButtons';

export function VoteScreen({ project, question, onBack, onOverview, onComplete }) {
  const [votedCount, setVotedCount] = React.useState(0);
  const total = 2;
  const vote = () => {
    const next = Math.min(total, votedCount + 1);
    setVotedCount(next);
    if (next >= total) onComplete && onComplete();
  };
  return (
    <div style={{ width: '100%', maxWidth: 'var(--mobile-max-width)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(244,241,236,.9)', backdropFilter: 'blur(8px)', padding: '18px 22px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconButton icon="chevron-left" variant="surface" onClick={onBack} />
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.3px', fontFamily: 'var(--font-display)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project}</div>
        <Avatar initial="G" bg="var(--person-1-bg)" fg="var(--person-1-fg)" size={36} />
      </div>

      <div style={{ flex: 1, padding: '6px 22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Button variant="outline" icon="grid" onClick={onOverview} style={{ marginTop: 8 }}>zur Übersicht</Button>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 27, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.4px', fontFamily: 'var(--font-display)' }}>{question}</div>
          <div style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 6, fontWeight: 600 }}>{votedCount} / {total} abgestimmt</div>
        </div>

        <div style={{ width: '100%', background: '#fff', borderRadius: 24, padding: '40px 24px', marginTop: 22, boxShadow: 'var(--shadow-card-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: 200, justifyContent: 'center' }}>
          <div style={{ width: 108, height: 108, borderRadius: '50%', border: '2.5px solid var(--teal-ring)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Icon name="clock" size={40} color="var(--accent)" />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>16:09 Uhr</div>
        </div>

        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--border-hairline-strong)', background: '#fff', color: 'var(--ink-600)', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, padding: '9px 18px', borderRadius: 20, cursor: 'pointer', marginTop: 22 }}>
          <Icon name="comment" size={15} />Kommentieren
        </button>

        <div style={{ marginTop: 26, width: '100%' }}>
          <VoteButtons onYes={vote} onSkip={() => {}} onNo={vote} />
        </div>
      </div>
    </div>
  );
}
