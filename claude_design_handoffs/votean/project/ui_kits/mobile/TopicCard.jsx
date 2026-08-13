import React from 'react';
import { AvatarStack } from '../../components/core/AvatarStack';
import { Badge, StatusDot } from '../../components/core/Badge';
import { IconButton } from '../../components/core/IconButton';
import { Menu } from '../../components/feedback/Menu';
import { Button } from '../../components/core/Button';
import { Icon } from '../../components/core/Icon';

export function TopicCard({ topic, onVote, onResults, onShare, hideProjectBadge = false, interactive = true }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closed = topic.status !== 'open';
  const primaryIsResults = closed || topic.voted;

  return (
    <div style={{ position: 'relative', background: '#fff', border: '1px solid var(--border-hairline-soft)', borderRadius: 'var(--radius-3xl)', padding: '18px 20px', boxShadow: 'var(--shadow-card-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {!hideProjectBadge && topic.project ? <Badge variant="accent">{topic.project}</Badge> : null}
        {!hideProjectBadge && !topic.project ? <Badge variant="warning">Ohne Projekt</Badge> : null}
        <span style={{ marginLeft: 'auto' }}>
          <StatusDot label={closed ? 'Beendet' : 'Läuft'} tone={closed ? 'muted' : 'positive'} />
        </span>
        {interactive ? <IconButton icon="kebab" variant="ghost" size={26} iconSize={16} onClick={() => setMenuOpen(v => !v)} /> : null}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.2px', lineHeight: 1.22, fontFamily: 'var(--font-display)' }}>{topic.title}</div>
      {topic.question ? <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{topic.question}</p> : null}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600, flex: 'none' }}>
          <span>{topic.options === 1 ? '1 Option' : topic.options + ' Optionen'}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--sand-400)' }} />
          <span>{topic.votes === 1 ? '1 Stimme' : topic.votes + ' Stimmen'}</span>
        </div>
        <AvatarStack members={topic.members} max={4} size="sm" />
      </div>
      {interactive ? (
        primaryIsResults
          ? <Button variant="subtle" fullWidth onClick={onResults} style={{ marginTop: 16 }}>{closed ? 'Ergebnisse' : 'Zu den Ergebnissen'}</Button>
          : <Button variant="primary" fullWidth onClick={onVote} style={{ marginTop: 16 }}>Abstimmen</Button>
      ) : (
        <div style={{ marginTop: 16 }}>
          <Badge variant="neutral" icon={<Icon name="lock" size={13} />}>{closed ? 'Ergebnisse' : 'Abstimmen'}</Badge>
        </div>
      )}
      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          { icon: 'share', label: 'Teilen', onClick: () => { setMenuOpen(false); onShare && onShare(); } },
          { icon: 'edit', label: 'Bearbeiten', onClick: () => setMenuOpen(false) },
          { icon: 'trash', label: 'Löschen', onClick: () => setMenuOpen(false), danger: true },
        ]}
      />
    </div>
  );
}
