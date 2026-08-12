# Votean Design System

Votean is a German-language group decision-making app: friends, families, and small teams create **Projects** (a shared context like "Sommerurlaub 2026" or "Team-Offsite") and run **Umfragen** (polls/surveys) inside them — date polls, yes/no polls, and rating polls — to reach a decision together. It ships as a mobile-first app with a companion desktop/web layout (sidebar nav instead of tabs).

## Source
This design system was extracted from an existing prototype in this project (no external codebase, Figma file, or brand kit was attached):
- `Votean Übersicht v2.dc.html` / `Votean Übersicht Web.dc.html` — mobile & web overview shells (Überblick/Projekte/Umfragen tabs)
- `ProjectCardV2.dc.html`, `TopicCardV2.dc.html` — the two core list-item cards
- `ProjectDetailV2.dc.html`, `ProjectDetailTeaser.dc.html` — project detail (member + logged-out states)
- `TopicOverviewV2.dc.html`, `VoteDatePollV2.dc.html`, `CreateDatePollV2.dc.html` — poll detail, voting, and poll creation flows
- `ShareSheet.dc.html` — the invite/visibility/members bottom sheet

No Figma link, GitHub repo, or brand guideline doc was provided — if one exists, attach it and this system can be reconciled against it.

## No logo file supplied
No brand logo asset was given. The "mark" used throughout (a teal checkmark glyph + Bricolage Grotesque "Votean" wordmark) is reconstructed directly from the product's own header markup — it is not a designed logo. See `guidelines/brand-wordmark.html`. Replace with real logo files if the brand has one.

## Content fundamentals
- **Language & voice**: All copy is German, informal *du* form ("Hallo Giovanni", "Hier ist, was bei deinen Leuten gerade ansteht."). Warm, casual, plain — no corporate tone, no jargon.
- **Action copy**: buttons are direct verbs/imperatives — "Abstimmen", "Weiter abstimmen", "Neues Projekt starten", "Terminumfrage erstellen". Empty/optional-field affordances read as "+ Beschreibung hinzufügen".
- **No emoji** anywhere in the product.
- **Numbers as words in context**: "1 Umfrage" vs "5 Umfragen", "1 von 2 Stimmen" — always grammatically correct singular/plural, never "1 Umfrage(n)".
- **Reassurance micro-copy**: secondary lines soften optional/free actions, e.g. "Auch ohne Projekt möglich" under the create-survey CTA.

## Visual foundations
- **Color**: warm, slightly yellow-tinted cream backgrounds (`#f4f1ec` app bg), not pure white — cards are pure white for contrast. One brand accent: a muted teal (`#1f7a8c`). Semantic colors are muted/pastel, never saturated: green for open/yes, red for no/delete, amber for "standalone/no project". A dedicated 6-color pastel **person palette** (teal/rose/amber/purple/green/blue) is assigned round-robin to member avatars — never reused for status meaning.
- **Type**: two-font system. **Bricolage Grotesque** (500–800) for all headings/titles/questions — tight negative letter-spacing (−0.2 to −0.8px), always bold. **Hanken Grotesk** (400–700) for everything else — body copy, labels, buttons, form fields. Eyebrow labels are uppercase, 12–13px, bold, wide letter-spacing, muted color.
- **Spacing & density**: comfortable but compact — 20–22px screen padding, 12–18px gaps between stacked cards. Mobile content caps at 480px wide, centered; the web layout adds a 262px fixed sidebar and caps content at 1080px.
- **Corner radii**: generously rounded, scaling with element importance — inputs/tags ~12–14px, cards 18–22px, the top of bottom sheets 26px, avatars/dots always circular. Nothing is sharp-cornered.
- **Shadows**: soft and low-contrast (`0 3px 14–16px rgba(35,40,45,.05-.06)`) on cards; a stronger scrim + shadow for the bottom sheet; a colored teal-tinted shadow only under the primary CTA button.
- **Borders**: hairline neutral borders (`rgba(20,24,28,.055–.12)`) on cards and inputs; a distinctive **dashed border** (1.5px, sand) marks every "add new" affordance — this is the system's one recurring "empty state" motif.
- **Backgrounds**: flat color only — no gradients, no photography, no illustrations, no textures. The only "gradient" in the product is a fade-to-transparent scrim behind a sticky bottom action bar.
- **Animation**: the source prototype is static (no transitions authored) — apply standard, brief (120–180ms) ease-out transitions for hover/press/open-close states; nothing bouncy or elaborate.
- **Hover/press states**: subtle background tint added on hover for ghost buttons/menu items (e.g. sand-100); no color/shadow changes beyond that; buttons don't shrink on press.
- **Headers**: sticky, translucent + blurred (`backdrop-filter: blur(8px)` over a semi-transparent cream) on scrolling detail screens.
- **Avatars**: always circular initials, overlapping in stacks with a white ring and −7px overlap; a trailing dashed "+" bubble invites adding more people.

## Iconography
Votean does **not** use an external icon font or library (no Lucide/Heroicons/Material). Every icon is a small hand-built inline SVG: thin strokes (2–2.6px), rounded caps and joins, 24×24 viewBox. A few are solid/filled (kebab dots, play triangle, send paper-plane). All ~23 glyphs are catalogued in `components/core/Icon.jsx` and previewed in `guidelines/iconography-set.html`; a handful are also saved as standalone files in `assets/icons/` for reference. No emoji, no unicode-glyph icons (the one exception is the literal "+" character used as plain text in a few buttons).

## Index
- `styles.css` — the single global stylesheet entry (imports everything in `tokens/`)
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css` (radii/shadows)
- `assets/icons/` — a sample of the custom line-icon set as standalone SVGs
- `components/core/` — Button, IconButton, Avatar, AvatarStack, Badge/StatusDot, Card, Input, SegmentedControl, Tabs, ProgressBar, Icon
- `components/feedback/` — Menu (kebab dropdown), BottomSheet
- `components/patterns/` — EmptyStateButton, VoteButtons
- `ui_kits/mobile/` — interactive click-through mobile app (`index.html`): overview → project detail → poll overview → vote → create poll, plus the share sheet
- `ui_kits/web/` — the sidebar desktop layout (`index.html`)
- `guidelines/` — foundation specimen cards (colors, type, spacing, radii, brand, iconography)
- `SKILL.md` — portable skill file for use in Claude Code

## Caveats / open questions
- No Figma, GitHub repo, or brand guideline document was attached — everything here is reverse-engineered from the DC prototype screens in this project. If a real source exists, attach it so this system can be reconciled.
- No logo file exists; the wordmark shown is a plain-type reconstruction, not a real logo.
- Fonts are loaded live from Google Fonts (Bricolage Grotesque, Hanken Grotesk) rather than bundled — flag if you need self-hosted font files.
- The web/desktop surface in the source only had Überblick/Projekte/Umfragen — no desktop equivalent of project-detail, poll-detail, voting, or poll-creation existed, so `ui_kits/web/` covers only that overview surface. The mobile kit covers the full flow.
- `ui_kits/*/index.html` inline their own copy of the component implementations (rather than importing `components/**` at runtime) since this preview environment doesn't hot-bundle `.jsx` — treat `components/**/*.jsx` as the canonical source when hand-editing a primitive, and port changes into the UI kit copies too.

**Please review and tell me what to iterate on** — closer color matching, more screens (settings, rating polls, yes/no polls), a real logo file, or anything that doesn't feel right yet.
