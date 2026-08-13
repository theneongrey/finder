import React from 'react';
import { IconButton } from '../../components/core/IconButton';
import { Avatar } from '../../components/core/Avatar';
import { Icon } from '../../components/core/Icon';
import { Input } from '../../components/core/Input';
import { Button } from '../../components/core/Button';
import { Card } from '../../components/core/Card';

const TYPES = [
  { key: 'weekday', label: 'Wochentag', icon: 'refresh' },
  { key: 'date', label: 'Kalendertag', icon: 'calendar' },
  { key: 'time', label: 'Uhrzeit', icon: 'clock' },
];

export function CreatePollScreen({ onBack }) {
  const [question, setQuestion] = React.useState('');
  const [type, setType] = React.useState(null);

  return (
    <div style={{ width: '100%', maxWidth: 'var(--mobile-max-width)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(244,241,236,.9)', backdropFilter: 'blur(8px)', padding: '18px 22px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconButton icon="chevron-left" variant="surface" onClick={onBack} />
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.3px', fontFamily: 'var(--font-display)', flex: 1 }}>Terminumfrage erstellen</div>
        <Avatar initial="G" bg="var(--person-1-bg)" fg="var(--person-1-fg)" size={36} />
      </div>

      <div style={{ flex: 1, padding: '6px 22px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '14px 0 8px' }}>Deine Frage</div>
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Wann?" style={{ padding: '14px 16px', fontSize: 16 }} />

        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '22px 0 9px' }}>Art der Terminoptionen</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
          {TYPES.map((t) => {
            const active = type === t.key;
            return (
              <button key={t.key} onClick={() => setType(t.key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border-hairline)', background: active ? 'var(--accent-tint)' : '#fff', borderRadius: 16, padding: '13px 6px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <Icon name={t.icon} size={19} color={active ? 'var(--accent)' : 'var(--text-tertiary)'} />
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 600, color: active ? 'var(--accent)' : 'var(--ink-500)', textAlign: 'center', lineHeight: 1.2 }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {type && (
          <React.Fragment>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '24px 0 11px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: '.6px' }}>Terminoptionen</span>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>Mind. 1 Termin</span>
            </div>
            <Card accentBorder padding={17}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>{type === 'weekday' ? 'Wochentag' : type === 'date' ? 'Datum' : 'Uhrzeit'}</div>
              <Input type={type === 'date' ? 'date' : type === 'time' ? 'time' : 'text'} placeholder={type === 'weekday' ? 'Montag' : ''} />
            </Card>
            <button style={{ width: '100%', border: '1.5px dashed var(--teal-300)', background: 'rgba(231,242,243,.5)', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--accent)', fontSize: 14.5, fontWeight: 700, marginTop: 12 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--teal-100)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, lineHeight: 1 }}>+</span>
              Termin hinzufügen
            </button>
          </React.Fragment>
        )}
      </div>

      <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(180deg, rgba(244,241,236,0), var(--bg-app) 26%)', padding: '16px 22px 22px' }}>
        <Button variant="primary" icon="send" fullWidth>Terminumfrage erstellen</Button>
      </div>
    </div>
  );
}
