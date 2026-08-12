Dashed 1.5px border "add new" CTA. `row` is the full-width end-of-list button ("Neues Projekt starten"); `tile` is a small icon-on-top grid item (poll-type picker: Termin / Ja-Nein / Bewertung).

```jsx
<EmptyStateButton layout="row" label="Neues Projekt starten" onClick={onCreate} />
<EmptyStateButton layout="tile" label="Termin" onClick={onPickDate} />
```
