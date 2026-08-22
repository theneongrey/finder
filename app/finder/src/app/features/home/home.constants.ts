export const NAMES_TOP_100 = [
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

export const PPL: Record<string, { i: string; name: string; bg: string; fg: string }> = {
  G: { i: 'G', name: 'Greta', bg: '#d7eef0', fg: '#1f7a8c' },
  F: { i: 'F', name: 'Felix', bg: '#f4dfe2', fg: '#b56374' },
  M: { i: 'M', name: 'Mia', bg: '#f6e7cf', fg: '#b3863a' },
  L: { i: 'L', name: 'Lena', bg: '#e6e0f3', fg: '#6f5aa6' },
  N: { i: 'N', name: 'Noah', bg: '#dcecd9', fg: '#4f7a4a' },
  S: { i: 'S', name: 'Sara', bg: '#d9e4f2', fg: '#4a6da6' },
};

export const DEMO = [
  { labelKey: 'home.demo.opt0', voters: ['F', 'M', 'S', 'L'] },
  { labelKey: 'home.demo.opt1', voters: ['G', 'N'] },
  { labelKey: 'home.demo.opt2', voters: ['M'] },
];

export const DEMO_SEQ: number[][][] = [
  [[], [], []],
  [[0], [], []],
  [[0], [0], []],
  [[0, 1], [0], []],
  [[0, 1], [0, 1], [0]],
  [[0, 1, 2], [0, 1], [0]],
  [[0, 1, 2, 3], [0, 1], [0]],
];

export const DEMO_TOTAL_VOTERS = 7;

export const STEPS = [
  { n: '1', titleKey: 'home.steps.0.title', textKey: 'home.steps.0.text' },
  { n: '2', titleKey: 'home.steps.1.title', textKey: 'home.steps.1.text' },
  { n: '3', titleKey: 'home.steps.2.title', textKey: 'home.steps.2.text' },
];

export const FEATURES = [
  { titleKey: 'home.features.0.title', textKey: 'home.features.0.text', iconBg: '#d7eef0', iconFg: '#1f7a8c', icon: 'check-list' },
  { titleKey: 'home.features.1.title', textKey: 'home.features.1.text', iconBg: '#f4dfe2', iconFg: '#b56374', icon: 'share' },
  { titleKey: 'home.features.2.title', textKey: 'home.features.2.text', iconBg: '#f6e7cf', iconFg: '#b3863a', icon: 'clock' },
  { titleKey: 'home.features.3.title', textKey: 'home.features.3.text', iconBg: '#e6e0f3', iconFg: '#6f5aa6', icon: 'grid' },
];

export const IDEAS = [
  {
    id: 'wohnen', tabKey: 'home.ideas.wohnen.tab', shortKey: 'home.ideas.wohnen.short',
    whoKey: 'home.ideas.wohnen.who', tone: 'neutral' as const, tintFg: '#a8566a',
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
    whoKey: 'home.ideas.trip.who', tone: 'accent' as const, tintFg: '#1f7a8c',
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
    whoKey: 'home.ideas.geschenk.who', tone: 'warning' as const, tintFg: '#a8742a',
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
    whoKey: 'home.ideas.team.who', tone: 'success' as const, tintFg: '#4f7a4a',
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

export const CODE = ['4', '8', '2', '1', '9', '6'];
