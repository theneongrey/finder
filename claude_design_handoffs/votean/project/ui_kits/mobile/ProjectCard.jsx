import React from 'react';
import { Avatar } from '../../components/core/Avatar';
import { AvatarStack } from '../../components/core/AvatarStack';
import { Badge } from '../../components/core/Badge';
import { IconButton } from '../../components/core/IconButton';
import { Menu } from '../../components/feedback/Menu';
import { Icon } from '../../components/core/Icon';

export function ProjectCard({ project, onOpen, onShare }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const n = project.topics || 0;
  return (
    <div style={{ position: 'relative', background: '#fff', border: '1px solid var(--border-hairline-soft)', borderRadius: 'var(--radius-3xl)', padding: '20px 20px 18px', boxShadow: 'var(--shadow-card)', cursor: 'pointer' }} onClick={onOpen}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
        <Avatar initial={project.owner.initial} bg={project.owner.bg} fg={project.owner.fg} size={28} />
        <div style={{ fontSize: 13, color: 'var(--ink-500)', fontWeight: 600 }}>{project.owner.name}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{project.time}</span>
          <IconButton icon="kebab" variant="ghost" size={26} iconSize={16} onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }} />
        </div>
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.3px', lineHeight: 1.18, fontFamily: 'var(--font-display)' }}>{project.name}</div>
      {project.description ? <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{project.description}</p> : null}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
        <AvatarStack members={project.members} max={4} />
        <Badge variant="accent">{n === 1 ? '1 Umfrage' : n + ' Umfragen'}</Badge>
      </div>
      <Menu
        open={menuOpen}
        onClose={(e) => { setMenuOpen(false); }}
        items={[
          { icon: 'share', label: 'Teilen', onClick: () => { setMenuOpen(false); onShare && onShare(); } },
          { icon: 'edit', label: 'Bearbeiten', onClick: () => setMenuOpen(false) },
          { icon: 'trash', label: 'Löschen', onClick: () => setMenuOpen(false), danger: true },
        ]}
      />
    </div>
  );
}
