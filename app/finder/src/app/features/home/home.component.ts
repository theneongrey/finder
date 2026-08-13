import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

const GERMAN_NAMES = [
  'Emma','Hannah','Mia','Sofia','Lena','Anna','Laura','Lea','Marie','Julia',
  'Sarah','Lisa','Lara','Jana','Katharina','Sandra','Nina','Sabrina','Melanie','Jessica',
  'Lukas','Felix','Leon','Jonas','Maximilian','Tim','Jan','Nico','Daniel','Thomas',
  'Michael','Stefan','Andreas','Tobias','Sebastian','Christian','Markus','Florian','Simon','David',
  'Liam','Noah','Elias','Finn','Ben','Paul','Max','Moritz','Julian','Fabian',
  'Leonie','Amelie','Emilia','Maja','Clara','Johanna','Charlotte','Alina','Lina','Maria',
  'Farah','Marco','Samir','Leyla','Yuna','Niklas','Philip','Luisa','Elena','Nora',
  'Valeria','Luis','Omar','Yasmin','Kerim','Dilara','Mehmet','Aylin','Deniz','Sven',
  'Petra','Renate','Klaus','Günter','Monika','Helga','Werner','Dieter','Ursula','Gabi',
  'Kilian','Oskar','Leo','Theo','Emil','Frieda','Mathilda','Maren','Svenja','Tanja',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PPL: Record<string, { i: string; bg: string; fg: string }> = {
  G: { i: 'G', bg: '#d7eef0', fg: '#1f7a8c' },
  F: { i: 'F', bg: '#f4dfe2', fg: '#b56374' },
  M: { i: 'M', bg: '#f6e7cf', fg: '#b3863a' },
  L: { i: 'L', bg: '#e6e0f3', fg: '#6f5aa6' },
  N: { i: 'N', bg: '#dcecd9', fg: '#4f7a4a' },
  S: { i: 'S', bg: '#d9e4f2', fg: '#4a6da6' },
};

const DEMO = [
  { label: 'Gardasee', voters: ['F', 'M', 'S', 'L'] },
  { label: 'Prag',     voters: ['G', 'N'] },
  { label: 'Nordsee',  voters: ['M'] },
];
const DEMO_SEQ: number[][][] = [
  [[], [], []],
  [[0], [], []],
  [[0], [0], []],
  [[0, 1], [0], []],
  [[0, 1], [0, 1], [0]],
  [[0, 1, 2], [0, 1], [0]],
  [[0, 1, 2, 3], [0, 1], [0]],
];
const DEMO_TOTAL_VOTERS = 7;

const STEPS = [
  { n: '1', title: 'Frage stellen', text: 'Termin, Auswahl oder Ja/Nein. Optionen eintippen, fertig — in unter einer Minute steht die Umfrage.' },
  { n: '2', title: 'Link teilen', text: 'Ein Link in den Gruppenchat. Wer abstimmt, braucht kein Konto und keine App.' },
  { n: '3', title: 'Ergebnis sehen', text: 'Live siehst du, wer schon abgestimmt hat und wer noch fehlt. Am Ende steht eine Entscheidung.' },
];

const FEATURES = [
  { title: 'Jede Art von Frage', text: 'Termin, freie Auswahl, Ja/Nein oder Bewertung — passend zur Entscheidung.', iconBg: '#d7eef0', iconFg: '#1f7a8c', icon: 'check-list' },
  { title: 'Beitreten per Link', text: 'Eingeladene öffnen den Link, geben ihre E-Mail ein — das Konto entsteht dabei automatisch.', iconBg: '#f4dfe2', iconFg: '#b56374', icon: 'share' },
  { title: 'Sieht, wer noch fehlt', text: 'Offene Stimmen auf einen Blick, mit freundlichem Stupser statt Nachfragen.', iconBg: '#f6e7cf', iconFg: '#b3863a', icon: 'clock' },
  { title: 'Alles an einem Ort', text: 'Umfragen bleiben nach der Entscheidung erhalten — als Gedächtnis der Gruppe.', iconBg: '#e6e0f3', iconFg: '#6f5aa6', icon: 'grid' },
];

const IDEAS = [
  {
    id: 'wohnen', tab: 'Wohnzimmer einrichten', short: 'Wohnzimmer',
    who: 'Zu zweit', tintBg: '#f4dfe2', tintFg: '#a8566a',
    headline: 'Zwei Meinungen, ein Sofa.',
    story: 'Neue Wohnung, leeres Wohnzimmer. Statt 40 Screenshots im Chat legt ihr eine Umfrage an, jeder stimmt in Ruhe ab — und am Abend steht die Entscheidung schwarz auf weiß.',
    cta: 'Wohn-Umfrage starten',
    pollKind: 'Auswahl · 2 Personen',
    question: 'Welches Sofa nehmen wir?',
    options: [{ label: 'Samtsofa, petrol', n: 2 }, { label: 'Cord-Ecksofa, sand', n: 1 }, { label: 'Modulsofa, grau', n: 0 }],
    total: 2, voters: ['G', 'F'], votersLine: 'Beide haben abgestimmt',
    points: ['Fotos, Links und Preise stehen direkt an der Option', 'Jeder entscheidet für sich — ohne sich zu beeinflussen', 'Mehrere Umfragen pro Raum: Sofa, Lampe, Teppich'],
  },
  {
    id: 'trip', tab: 'Wochenendtrip planen', short: 'Wochenendtrip',
    who: 'Gruppe · 6 Leute', tintBg: '#d7eef0', tintFg: '#1f7a8c',
    headline: 'Sechs Kalender, ein Wochenende.',
    story: 'Erst der Termin, dann das Ziel. Zwei Umfragen, ein Link in der Gruppe — und niemand muss mehr durch 200 Nachrichten scrollen.',
    cta: 'Trip-Umfrage starten',
    pollKind: 'Auswahl · 6 Personen',
    question: 'Wohin fahren wir im September?',
    options: [{ label: 'Gardasee', n: 4 }, { label: 'Prag', n: 3 }, { label: 'Nordsee', n: 2 }, { label: 'Zu Hause bleiben', n: 0 }],
    total: 6, voters: ['G', 'F', 'M', 'L'], votersLine: '5 von 6 haben abgestimmt',
    points: ['Terminumfrage findet den Tag, an dem wirklich alle können', 'Mitmachen per Link — E-Mail eingeben genügt', 'Erinnerung an alle, die noch fehlen'],
  },
  {
    id: 'geschenk', tab: 'Gemeinsames Geschenk', short: 'Geschenk',
    who: 'Freundeskreis · 5 Leute', tintBg: '#f6e7cf', tintFg: '#a8742a',
    headline: 'Ein Geschenk, keine Doppelkäufe.',
    story: 'Fünf Ideen sammeln, alle stimmen ab, die zwei mit den meisten Stimmen werden gekauft. Und die Person, die beschenkt wird, sieht die Umfrage einfach nicht.',
    cta: 'Geschenk-Umfrage starten',
    pollKind: 'Auswahl · 5 Personen',
    question: 'Was schenken wir Yuna?',
    options: [{ label: 'Konzertkarten', n: 4 }, { label: 'Wochenende im Spa', n: 3 }, { label: 'Kochkurs', n: 1 }],
    total: 5, voters: ['F', 'M', 'L', 'S'], votersLine: '4 von 5 haben abgestimmt',
    points: ['Vorschläge kommen von allen, nicht nur vom Organisator', 'Budget als Notiz an der Umfrage', 'Ergebnis bleibt als Beleg erhalten'],
  },
  {
    id: 'team', tab: 'Team-Entscheidung', short: 'Team-Termin',
    who: 'Team · 9 Leute', tintBg: '#dcecd9', tintFg: '#4f7a4a',
    headline: 'Entscheiden statt vertagen.',
    story: 'Der Kick-off-Termin, das Sommerfest, das neue Tool: kurze Umfrage, klare Deadline, sichtbares Ergebnis. Keine Meeting-Schleife, keine Mail-Kette.',
    cta: 'Team-Umfrage starten',
    pollKind: 'Terminumfrage · 9 Personen',
    question: 'Wann machen wir das Offsite?',
    options: [{ label: 'Do., 17. September', n: 8 }, { label: 'Fr., 18. September', n: 5 }, { label: 'Do., 24. September', n: 3 }],
    total: 9, voters: ['G', 'M', 'N', 'S'], votersLine: '8 von 9 haben abgestimmt',
    points: ['Deadline setzen — danach schließt die Umfrage automatisch', 'Zwischenstand erst nach der eigenen Stimme sichtbar', 'Ergebnis als Link in Slack oder Mail teilen'],
  },
];

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  readonly email = signal('');
  readonly emailError = signal(false);
  readonly emailSent = signal(false);
  readonly scrolled = signal(false);
  readonly ideaIdx = signal(1);
  readonly floatName = signal('');
  readonly demoStep = signal(0);
  readonly codeN = signal(0);
  readonly ideaVisible = signal(true);

  private nameQueue: string[] = [];
  private nameIdx = 0;
  private nameTimer: ReturnType<typeof setInterval> | undefined;
  private demoTimer: ReturnType<typeof setInterval> | undefined;
  private codeTimer: ReturnType<typeof setInterval> | undefined;
  private ideaTimer: ReturnType<typeof setInterval> | undefined;

  private static readonly CODE = ['4', '8', '2', '1', '9', '6'];

  readonly steps = STEPS;

  readonly floatVisible = signal(true);

  readonly codeBoxes = computed(() => {
    const n = this.codeN();
    return HomeComponent.CODE.map((v, i) => ({
      v: i < n ? v : '',
      bg: i < n ? 'rgba(159,194,207,.16)' : 'rgba(255,255,255,.05)',
      border: i === n ? '#9fc2cf' : (i < n ? 'rgba(159,194,207,.5)' : 'rgba(255,255,255,.14)'),
    }));
  });

  readonly codeHint = computed(() =>
    this.codeN() >= 6 ? 'Angemeldet – ohne Passwort.' : 'Code eingeben, fertig.',
  );

  ngOnInit(): void {
    this.nameQueue = shuffle(GERMAN_NAMES);
    this.floatName.set(this.nameQueue[0]);

    this.nameTimer = setInterval(() => {
      this.floatVisible.set(false);
      setTimeout(() => {
        this.nameIdx = (this.nameIdx + 1) % this.nameQueue.length;
        this.floatName.set(this.nameQueue[this.nameIdx]);
        this.floatVisible.set(true);
      }, 220);
    }, 2200);

    this.demoTimer = setInterval(() => {
      this.demoStep.update(s => (s + 1) % (DEMO_SEQ.length + 2));
    }, 1800);

    this.codeTimer = setInterval(() => {
      this.codeN.update(n => (n >= 7 ? 0 : n + 1));
    }, 520);

    this.ideaTimer = setInterval(() => {
      this.ideaVisible.set(false);
      setTimeout(() => {
        this.ideaIdx.update(i => (i + 1) % IDEAS.length);
        this.ideaVisible.set(true);
      }, 300);
    }, 3500);
  }

  ngOnDestroy(): void {
    clearInterval(this.nameTimer);
    clearInterval(this.demoTimer);
    clearInterval(this.codeTimer);
    clearInterval(this.ideaTimer);
  }
  readonly features = FEATURES;
  readonly ideas = IDEAS;
  readonly faces = ['G', 'F', 'M', 'L', 'N'].map((k, i) => ({
    ...PPL[k], ml: i === 0 ? '0' : '-9px',
  }));

  readonly currentIdea = computed(() => {
    const idea = IDEAS[this.ideaIdx()];
    const maxN = Math.max(...idea.options.map(o => o.n)) || 1;
    return {
      ...idea,
      optionsFormatted: idea.options.map(o => ({
        ...o,
        pct: Math.round((o.n / maxN) * 100) + '%',
        fill: o.n === maxN ? 'rgba(31,122,140,.13)' : 'rgba(20,24,28,.045)',
        border: o.n === maxN ? '#bcdfe3' : 'rgba(20,24,28,.07)',
        numColor: o.n === maxN ? '#1f7a8c' : '#a39e96',
        weight: o.n === maxN ? '700' : '600',
        numLabel: o.n === 0 ? '–' : String(o.n),
      })),
      votersFormatted: idea.voters.map((k, i) => ({
        ...PPL[k], ml: i === 0 ? '0' : '-8px',
      })),
    };
  });

  readonly demoState = computed(() => {
    const seqI = Math.min(this.demoStep(), DEMO_SEQ.length - 1);
    const seq = DEMO_SEQ[seqI];
    const counts = DEMO.map((_, i) => (seq[i] || []).length);
    const total = counts.reduce((a, b) => a + b, 0);
    const maxCount = Math.max(...counts, 1);
    const leadIdx = counts.indexOf(maxCount);

    const options = DEMO.map((d, i) => {
      const n = counts[i];
      const isLead = i === leadIdx && n > 0;
      return {
        label: d.label,
        n,
        numLabel: n === 0 ? '–' : String(n),
        numColor: isLead ? '#1f7a8c' : '#a39e96',
        weight: isLead ? '700' : '600',
        pct: Math.round((n / maxCount) * 100) + '%',
        fill: isLead ? 'rgba(31,122,140,.13)' : 'rgba(20,24,28,.045)',
        border: isLead ? '#bcdfe3' : 'rgba(20,24,28,.08)',
        chips: (seq[i] || []).map(vi => PPL[d.voters[vi]]),
      };
    });

    return {
      options,
      voted: `${total} von ${DEMO_TOTAL_VOTERS} haben abgestimmt`,
      pct: Math.round((total / DEMO_TOTAL_VOTERS) * 100) + '%',
    };
  });

  onScroll(e: Event): void {
    const el = e.target as HTMLElement;
    this.scrolled.set(el.scrollTop > 20);
  }

  onStart(): void {
    const v = this.email().trim();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) {
      this.emailError.set(true);
      return;
    }
    this.emailSent.set(true);
    this.emailError.set(false);
    this.router.navigate(['/auth/request-email'], { queryParams: { email: v } });
  }

  onEmailChange(val: string): void {
    this.email.set(val);
    this.emailError.set(false);
    this.emailSent.set(false);
  }

  onEmailKey(e: KeyboardEvent): void {
    if (e.key === 'Enter') this.onStart();
  }

  selectIdea(i: number): void {
    clearInterval(this.ideaTimer);
    this.ideaIdx.set(i);
    this.ideaVisible.set(true);
    this.ideaTimer = setInterval(() => {
      this.ideaVisible.set(false);
      setTimeout(() => {
        this.ideaIdx.update(idx => (idx + 1) % IDEAS.length);
        this.ideaVisible.set(true);
      }, 300);
    }, 3500);
  }

  scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToEmail(): void {
    const el = document.getElementById('home-email');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el.focus(), 420);
    }
  }
}
