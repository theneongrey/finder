Sand-track toggle with a white active pill — used for visibility (Nur Eingeladene/Offen) and role pickers (Betrachter/Mitwirkend/Verwalter). 2–3 options only.

```jsx
<SegmentedControl
  options={[{ value: 'restricted', label: 'Nur Eingeladene' }, { value: 'open', label: 'Offen' }]}
  value={access}
  onChange={setAccess}
/>
```
