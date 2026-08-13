Renders one glyph from Votean's custom line-icon set (never an external icon font).

```jsx
<Icon name="share" size={15} color="var(--accent)" />
```

Available names: logo, chevron-left, chevron-right, arrow-right, kebab, comment, share, edit, trash, lock, users, calendar, clock, refresh, play, send, trophy, close, check, heart, grid, folder, checklist, plus.

Most icons are thin stroke line-icons (2–2.6px, round caps/joins); `kebab`, `play`, `send`, `check`, `heart`-in-vote-context appear filled/bold where the source uses them that way. Color always follows the parent via `currentColor` unless overridden.
