import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SupportedLanguage, setStoredLanguage } from '../../common/i18n/languages';

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
  { labelKey: 'home.demo.opt0', voters: ['F', 'M', 'S', 'L'] },
  { labelKey: 'home.demo.opt1', voters: ['G', 'N'] },
  { labelKey: 'home.demo.opt2', voters: ['M'] },
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
  { n: '1', titleKey: 'home.steps.0.title', textKey: 'home.steps.0.text' },
  { n: '2', titleKey: 'home.steps.1.title', textKey: 'home.steps.1.text' },
  { n: '3', titleKey: 'home.steps.2.title', textKey: 'home.steps.2.text' },
];

const FEATURES = [
  { titleKey: 'home.features.0.title', textKey: 'home.features.0.text', iconBg: '#d7eef0', iconFg: '#1f7a8c', icon: 'check-list' },
  { titleKey: 'home.features.1.title', textKey: 'home.features.1.text', iconBg: '#f4dfe2', iconFg: '#b56374', icon: 'share' },
  { titleKey: 'home.features.2.title', textKey: 'home.features.2.text', iconBg: '#f6e7cf', iconFg: '#b3863a', icon: 'clock' },
  { titleKey: 'home.features.3.title', textKey: 'home.features.3.text', iconBg: '#e6e0f3', iconFg: '#6f5aa6', icon: 'grid' },
];

const IDEAS = [
  {
    id: 'wohnen', tabKey: 'home.ideas.wohnen.tab', shortKey: 'home.ideas.wohnen.short',
    whoKey: 'home.ideas.wohnen.who', tintBg: '#f4dfe2', tintFg: '#a8566a',
    headlineKey: 'home.ideas.wohnen.headline',
    storyKey: 'home.ideas.wohnen.story',
    ctaKey: 'home.ideas.wohnen.cta',
    pollKindKey: 'home.ideas.wohnen.pollKind',
    questionKey: 'home.ideas.wohnen.question',
    options: [
      { labelKey: 'home.ideas.wohnen.opt0', n: 2 },
      { labelKey: 'home.ideas.wohnen.opt1', n: 1 },
      { labelKey: 'home.ideas.wohnen.opt2', n: 0 },
    ],
    total: 2, voters: ['G', 'F'], votersLineKey: 'home.ideas.wohnen.votersLine',
    pointKeys: ['home.ideas.wohnen.pt0', 'home.ideas.wohnen.pt1', 'home.ideas.wohnen.pt2'],
  },
  {
    id: 'trip', tabKey: 'home.ideas.trip.tab', shortKey: 'home.ideas.trip.short',
    whoKey: 'home.ideas.trip.who', tintBg: '#d7eef0', tintFg: '#1f7a8c',
    headlineKey: 'home.ideas.trip.headline',
    storyKey: 'home.ideas.trip.story',
    ctaKey: 'home.ideas.trip.cta',
    pollKindKey: 'home.ideas.trip.pollKind',
    questionKey: 'home.ideas.trip.question',
    options: [
      { labelKey: 'home.ideas.trip.opt0', n: 4 },
      { labelKey: 'home.ideas.trip.opt1', n: 3 },
      { labelKey: 'home.ideas.trip.opt2', n: 2 },
      { labelKey: 'home.ideas.trip.opt3', n: 0 },
    ],
    total: 6, voters: ['G', 'F', 'M', 'L'], votersLineKey: 'home.ideas.trip.votersLine',
    pointKeys: ['home.ideas.trip.pt0', 'home.ideas.trip.pt1', 'home.ideas.trip.pt2'],
  },
  {
    id: 'geschenk', tabKey: 'home.ideas.geschenk.tab', shortKey: 'home.ideas.geschenk.short',
    whoKey: 'home.ideas.geschenk.who', tintBg: '#f6e7cf', tintFg: '#a8742a',
    headlineKey: 'home.ideas.geschenk.headline',
    storyKey: 'home.ideas.geschenk.story',
    ctaKey: 'home.ideas.geschenk.cta',
    pollKindKey: 'home.ideas.geschenk.pollKind',
    questionKey: 'home.ideas.geschenk.question',
    options: [
      { labelKey: 'home.ideas.geschenk.opt0', n: 4 },
      { labelKey: 'home.ideas.geschenk.opt1', n: 3 },
      { labelKey: 'home.ideas.geschenk.opt2', n: 1 },
    ],
    total: 5, voters: ['F', 'M', 'L', 'S'], votersLineKey: 'home.ideas.geschenk.votersLine',
    pointKeys: ['home.ideas.geschenk.pt0', 'home.ideas.geschenk.pt1', 'home.ideas.geschenk.pt2'],
  },
  {
    id: 'team', tabKey: 'home.ideas.team.tab', shortKey: 'home.ideas.team.short',
    whoKey: 'home.ideas.team.who', tintBg: '#dcecd9', tintFg: '#4f7a4a',
    headlineKey: 'home.ideas.team.headline',
    storyKey: 'home.ideas.team.story',
    ctaKey: 'home.ideas.team.cta',
    pollKindKey: 'home.ideas.team.pollKind',
    questionKey: 'home.ideas.team.question',
    options: [
      { labelKey: 'home.ideas.team.opt0', n: 8 },
      { labelKey: 'home.ideas.team.opt1', n: 5 },
      { labelKey: 'home.ideas.team.opt2', n: 3 },
    ],
    total: 9, voters: ['G', 'M', 'N', 'S'], votersLineKey: 'home.ideas.team.votersLine',
    pointKeys: ['home.ideas.team.pt0', 'home.ideas.team.pt1', 'home.ideas.team.pt2'],
  },
];

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

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

  readonly codeHintKey = computed(() =>
    this.codeN() >= 6 ? 'home.authPitch.codeHintDone' : 'home.authPitch.codeHintDefault',
  );

  ngOnInit(): void {
    const lang = this.route.snapshot.data['lang'] as SupportedLanguage;
    if (lang) {
      this.translate.use(lang);
      setStoredLanguage(lang);
    }

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

    this.startIdeaTimer(7000);
  }

  private startIdeaTimer(delay: number): void {
    clearInterval(this.ideaTimer);
    this.ideaTimer = setInterval(() => {
      this.ideaVisible.set(false);
      setTimeout(() => {
        this.ideaIdx.update(i => (i + 1) % IDEAS.length);
        this.ideaVisible.set(true);
      }, 300);
    }, delay);
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
        labelKey: d.labelKey,
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
      votedCount: total,
      votedTotal: DEMO_TOTAL_VOTERS,
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
    if (e.key === 'Enter') { this.onStart(); }
  }

  selectIdea(i: number): void {
    this.ideaVisible.set(false);
    setTimeout(() => {
      this.ideaIdx.set(i);
      this.ideaVisible.set(true);
      this.startIdeaTimer(60_000);
    }, 300);
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
