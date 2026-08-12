import React from 'react';
import { BottomSheet } from '../../components/feedback/BottomSheet';
import { SegmentedControl } from '../../components/core/SegmentedControl';
import { Tabs } from '../../components/core/Tabs';
import { Input } from '../../components/core/Input';
import { Avatar } from '../../components/core/Avatar';
import { Badge } from '../../components/core/Badge';

export function ShareSheetContent({ title, itemType, members, onClose }) {
  const [tab, setTab] = React.useState('invite');
  const [access, setAccess] = React.useState('restricted');
  const [role, setRole] = React.useState('contributor');

  return (
    <BottomSheet title="Teilen" subtitle={(itemType === 'project' ? 'Projekt' : 'Umfrage') + ' · ' + title} onClose={onClose}>
      <div style={{ marginTop: 20 }}>
        <Tabs items={[{ value: 'invite', label: 'Einladen' }, { value: 'members', label: 'Mitglieder (' + members.length + ')' }]} value={tab} onChange={setTab} size="sm" />
      </div>

      {tab === 'invite' && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>Sichtbarkeit</div>
          <SegmentedControl options={[{ value: 'restricted', label: 'Nur Eingeladene' }, { value: 'open', label: 'Offen' }]} value={access} onChange={setAccess} />
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 7, lineHeight: 1.4 }}>
            {access === 'restricted' ? 'Nur Personen, die du einlädst, haben Zugriff.' : 'Jede Person mit dem Link kann beitreten.'}
          </div>

          <div style={{ marginTop: 22, borderTop: '1px solid var(--border-hairline)', paddingTop: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>Person einladen</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input placeholder="Name oder E-Mail" />
              <button style={{ flex: 'none', border: 'none', background: 'var(--ink-900)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 700, padding: '0 18px', borderRadius: 12, cursor: 'pointer' }}>Einladen</button>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>Rolle für neue Einladungen</div>
              <SegmentedControl options={[{ value: 'viewer', label: 'Betrachter' }, { value: 'contributor', label: 'Mitwirkend' }, { value: 'manager', label: 'Verwalter' }]} value={role} onChange={setRole} size="sm" />
            </div>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 14 }}>
          {members.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 4px' }}>
              <Avatar initial={m.initial} bg={m.bg} fg={m.fg} size={34} />
              <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
              {i === 0 ? <Badge variant="accent">Ersteller</Badge> : <Badge variant="contributor">Mitwirkend</Badge>}
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
