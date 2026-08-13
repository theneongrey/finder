import React from 'react';
import { Tabs } from '../../components/core/Tabs';
import { Avatar } from '../../components/core/Avatar';
import { Icon } from '../../components/core/Icon';
import { ProjectCard } from './ProjectCard';
import { TopicCard } from './TopicCard';
import { EmptyStateButton } from '../../components/patterns/EmptyStateButton';
import { PROJECTS, TOPICS, PEOPLE } from './data.js';

export function OverviewScreen({ tab, setTab, onOpenProject, onOpenTopic, onShare, onCreatePoll }) {
  const latestProjects = PROJECTS.slice(0, 2);
  const latestTopics = [TOPICS[0], TOPICS[2], TOPICS[3]];

  return (
    <div style={{ width: '100%', maxWidth: 'var(--mobile-max-width)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="logo" size={21} color="var(--accent)" />
            <span style={{ fontSize: 19, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-.3px', fontFamily: 'var(--font-display)' }}>Votean</span>
          </div>
          <Avatar initial="G" bg="var(--person-1-bg)" fg="var(--person-1-fg)" size={38} />
        </div>
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 'var(--fs-display-lg)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-display-lg)', lineHeight: 1.05, fontFamily: 'var(--font-display)' }}>Hallo Giovanni</div>
          <div style={{ fontSize: 14.5, color: 'var(--text-secondary)', marginTop: 5 }}>Hier ist, was bei deinen Leuten gerade ansteht.</div>
        </div>
        <div style={{ marginTop: 22 }}>
          <Tabs
            items={[
              { value: 'overview', label: 'Überblick' },
              { value: 'projects', label: 'Projekte', count: PROJECTS.length },
              { value: 'surveys', label: 'Umfragen', count: TOPICS.length },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
      </div>

      <div style={{ flex: 1, padding: 22 }}>
        {tab === 'overview' && (
          <React.Fragment>
            <SectionHeader label="Neueste Projekte" onSeeAll={() => setTab('projects')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {latestProjects.map((p, i) => <ProjectCard key={i} project={p} onOpen={() => onOpenProject(p)} onShare={() => onShare(p.name, 'project', p.members)} />)}
            </div>
            <div style={{ marginTop: 26 }}><SectionHeader label="Neueste Umfragen" onSeeAll={() => setTab('surveys')} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {latestTopics.map((t, i) => <TopicCard key={i} topic={t} onVote={() => onOpenTopic(t, 'vote')} onResults={() => onOpenTopic(t, 'overview')} onShare={() => onShare(t.title, 'topic', t.members)} />)}
            </div>
          </React.Fragment>
        )}

        {tab === 'projects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PROJECTS.map((p, i) => <ProjectCard key={i} project={p} onOpen={() => onOpenProject(p)} onShare={() => onShare(p.name, 'project', p.members)} />)}
            <EmptyStateButton layout="row" label="Neues Projekt starten" />
          </div>
        )}

        {tab === 'surveys' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {TOPICS.map((t, i) => <TopicCard key={i} topic={t} onVote={() => onOpenTopic(t, 'vote')} onResults={() => onOpenTopic(t, 'overview')} onShare={() => onShare(t.title, 'topic', t.members)} />)}
            <EmptyStateButton layout="row" label="Neue Umfrage erstellen" onClick={onCreatePoll} />
            <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)', marginTop: -4 }}>Auch ohne Projekt möglich</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, onSeeAll }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
      <span style={{ fontSize: 'var(--fs-caption)', fontWeight: 700, color: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-eyebrow)' }}>{label}</span>
      <button onClick={onSeeAll} style={{ border: 'none', background: 'none', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>Alle ansehen</button>
    </div>
  );
}
