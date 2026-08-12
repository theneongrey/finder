import React from 'react';
import { IconButton } from '../../components/core/IconButton';
import { Avatar } from '../../components/core/Avatar';
import { Icon } from '../../components/core/Icon';
import { Button } from '../../components/core/Button';
import { ProgressBar } from '../../components/core/ProgressBar';
import { Input } from '../../components/core/Input';

const CANDIDATES = [
  { line: 'Mo., 9. Juni 2026, 16:09 Uhr', vote: 'yes', top: true, votes: '1 von 2 Stimmen' },
  { line: 'Mi., 11. Juni 2026, 16:09 Uhr', vote: null, top: false, votes: '0 von 2 Stimmen' },
  { line: 'Freitag, 18:00 Uhr', vote: 'no', top: false, votes: '0 von 2 Stimmen' },
];

export function TopicOverviewScreen({ project, question, onBack, onStartVoting }) {
  return (
    <div style={{ width: '100%', maxWidth: 'var(--mobile-max-width)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(244,241,236,.9)', backdropFilter: 'blur(8px)', padding: '18px 22px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconButton icon="chevron-left" variant="surface" onClick={onBack} />
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.3px', fontFamily: 'var(--font-display)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project}</div>
        <Avatar initial="G" bg="var(--person-1-bg)" fg="var(--person-1-fg)" size={36} />
      </div>

      <div style={{ flex: 1, padding: '6px 22px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 22, padding: '20px 20px 18px', boxShadow: 'var(--shadow-card)', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.3px', fontFamily: 'var(--font-display)' }}>{question}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Aktiv</span>
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 13, fontWeight: 700, padding: '7px 12px', borderRadius: 20, flex: 'none' }}>
              <Icon name="comment" size={14} />3
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 5, marginTop: 14 }}>
            <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>1</span>
            <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>von 2 bewertet</span>
          </div>
          <div style={{ marginTop: 9 }}><ProgressBar percent={50} /></div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
            <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.35 }}>Schließt in 2 Tagen</div>
            <Button variant="primary" icon="refresh" onClick={onStartVoting}>Weiter abstimmen</Button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '24px 0 12px' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Kandidaten</span>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>Sortiert nach Beliebtheit</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CANDIDATES.map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 18, padding: '16px 17px', boxShadow: 'var(--shadow-card-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{c.line}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 'none' }}>
                  {c.vote === 'yes' && <React.Fragment><div style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--green-700)', color: 'var(--positive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={13} /></div><span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--positive)' }}>Ja</span></React.Fragment>}
                  {c.vote === 'no' && <React.Fragment><div style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--red-300)', color: 'var(--negative)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={13} /></div><span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--negative)' }}>Nein</span></React.Fragment>}
                  {!c.vote && <React.Fragment><div style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--sand-400)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>?</div><span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Offen</span></React.Fragment>}
                </div>
              </div>
              {c.top && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--green-badge-bg)', color: 'var(--green-badge-fg)', fontSize: 12.5, fontWeight: 700, padding: '7px 13px', borderRadius: 20, marginTop: 12 }}>
                  <Icon name="trophy" size={14} />Meiste Stimmen
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                <Icon name="users" size={14} />{c.votes}
              </div>
              {c.vote
                ? <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: 13 }}><Icon name="refresh" size={14} />Erneut abstimmen</button>
                : <Button variant="primary" fullWidth icon="play" style={{ marginTop: 14 }}>Abstimmen</Button>}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: '26px 0 12px' }}>Kommentare</div>
        <div style={{ background: '#fff', borderRadius: 18, padding: 14, boxShadow: 'var(--shadow-card-soft)' }}>
          <div style={{ display: 'flex', gap: 9 }}>
            <Input placeholder="Neuer Kommentar..." background="var(--bg-app)" />
            <button style={{ flex: 'none', width: 44, border: 'none', background: 'var(--accent)', color: '#fff', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="send" size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
