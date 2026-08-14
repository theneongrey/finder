export const PEOPLE = {
  G: { name: 'Giovanni', initial: 'G', bg: 'var(--person-1-bg)', fg: 'var(--person-1-fg)' },
  F: { name: 'Fabia', initial: 'F', bg: 'var(--person-2-bg)', fg: 'var(--person-2-fg)' },
  M: { name: 'Marco', initial: 'M', bg: 'var(--person-3-bg)', fg: 'var(--person-3-fg)' },
  L: { name: 'Lena', initial: 'L', bg: 'var(--person-4-bg)', fg: 'var(--person-4-fg)' },
  N: { name: 'Noah', initial: 'N', bg: 'var(--person-5-bg)', fg: 'var(--person-5-fg)' },
  S: { name: 'Sara', initial: 'S', bg: 'var(--person-6-bg)', fg: 'var(--person-6-fg)' },
};

export const PROJECTS = [
  { name: 'Sommerurlaub 2026', owner: PEOPLE.G, time: 'vor 2 Std', description: 'Wohin geht die Reise während der Kita-Schließzeiten? Lasst uns gemeinsam entscheiden.', topics: 5, members: [PEOPLE.G, PEOPLE.F, PEOPLE.M, PEOPLE.L] },
  { name: 'Yunas Geburtstag', owner: PEOPLE.F, time: 'vor 1 Tag', description: 'Planung für die kleine Feier im Garten.', topics: 3, members: [PEOPLE.G, PEOPLE.F] },
  { name: 'Team-Offsite', owner: PEOPLE.M, time: 'vor 3 Tagen', description: 'Standort, Agenda und Verpflegung gemeinsam festlegen.', topics: 8, members: [PEOPLE.G, PEOPLE.M, PEOPLE.L, PEOPLE.N, PEOPLE.S] },
];

export const TOPICS = [
  { title: "Wohin soll's gehen?", question: 'Sammelt eure Vorschläge fürs Reiseziel.', project: 'Sommerurlaub 2026', status: 'open', options: 6, votes: 12, voted: false, members: [PEOPLE.G, PEOPLE.F, PEOPLE.M, PEOPLE.L] },
  { title: 'Welches Datum passt?', question: 'Findet einen Termin, der für alle klappt.', project: 'Sommerurlaub 2026', status: 'open', options: 4, votes: 8, voted: true, members: [PEOPLE.G, PEOPLE.F, PEOPLE.M] },
  { title: 'Restaurant am Freitag', question: 'Schnelle Abstimmung fürs Team-Essen.', project: '', status: 'closed', options: 3, votes: 9, voted: true, members: [PEOPLE.M, PEOPLE.L, PEOPLE.N] },
  { title: 'Geschenkideen für Yuna', question: 'Was schenken wir zum Geburtstag?', project: 'Yunas Geburtstag', status: 'open', options: 5, votes: 4, voted: false, members: [PEOPLE.G, PEOPLE.F] },
];
