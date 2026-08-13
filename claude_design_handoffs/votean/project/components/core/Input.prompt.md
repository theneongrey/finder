Single-line text/date/time field, 12px radius, hairline border. Swap `background` to `var(--bg-app)` when the input sits on a white card (e.g. the comment box) so it still reads as a field.

```jsx
<Input placeholder="Neuer Kommentar..." value={v} onChange={onV} background="var(--bg-app)" />
<Input type="date" value={date} onChange={onDate} />
```
