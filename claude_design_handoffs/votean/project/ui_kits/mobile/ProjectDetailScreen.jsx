import React from 'react';
import { IconButton } from '../../components/core/IconButton';
import { Avatar } from '../../components/core/Avatar';
import { AvatarStack } from '../../components/core/AvatarStack';
import { Button } from '../../components/core/Button';
import { TopicCard } from './TopicCard';
import { EmptyStateButton } from '../../components/patterns/EmptyStateButton';

export function ProjectDetailScreen({ project, onBack, onOpenTopic, onShare }) {
  return (
    <div style={{ width: '100%', maxWidth: 'var(--mobile-max-width)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(244,241,236,.9)', backdropFilter: 'blur(8px)', padding: '18px 22px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconButton icon="chevron-left" variant="surface" onClick={onBack} />
        <div style={{ fontSize: 21, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.3px', fontFamily: 'var(--font-display)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
        <Avatar initial={project.owner.initial} bg={project.owner.bg} fg={project.owner.fg} size={36} />
      </div>

      <div style={{ flex: 1, padding: '4px 22px 32px' }}>
        {project.description ? <p style={{ fontSize: 15, color: 'var(--ink-600)', lineHeight: 1.5, margin: '2px 0 0' }}>{project.description}</p> : null}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: '.7px' }}>{project.members.length} Mitglieder</span>
          <Button variant="dark" icon="share" onClick={onShare}>Teilen</Button>
        </div>

        <div style={{ marginTop: 13 }}>
          <AvatarStack members={project.members} max={6} size="lg" onAddClick={onShare} />
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: '.7px', margin: '28px 0 14px' }}>Aktuelle Umfragen</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(project.projectTopics || DEFAULT_TOPICS).map((t, i) => (
            <TopicCard key={i} topic={t} hideProjectBadge onVote={() => onOpenTopic(t, 'vote')} onResults={() => onOpenTopic(t, 'overview')} />
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: '.7px', margin: '28px 0 14px' }}>Neue Umfrage erstellen</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 11 }}>
          <EmptyStateButton layout="tile" label="Termin" />
          <EmptyStateButton layout="tile" icon="calendar" label="Ja/Nein" />
          <EmptyStateButton layout="tile" label="Bewertung" />
        </div>
      </div>
    </div>
  );
}

const DEFAULT_TOPICS = [
  { title: 'Urlaubsziel', question: 'Was könnte man sich in etwa vorstellen?', status: 'open', options: 6, votes: 1, voted: false, members: [{ initial: 'G', bg: 'var(--person-1-bg)', fg: 'var(--person-1-fg)' }] },
  { title: 'Wann?', question: '', status: 'open', options: 2, votes: 0, voted: false, members: [{ initial: 'G', bg: 'var(--person-1-bg)', fg: 'var(--person-1-fg)' }] },
];
