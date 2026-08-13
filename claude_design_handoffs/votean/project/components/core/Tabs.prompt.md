Underline-style tab row, active tab bold + teal underline + optional count chip.

```jsx
<Tabs
  items={[{ value: 'overview', label: 'Überblick' }, { value: 'projects', label: 'Projekte', count: 3 }]}
  value={tab}
  onChange={setTab}
/>
```
