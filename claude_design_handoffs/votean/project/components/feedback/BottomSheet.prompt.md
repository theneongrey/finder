Modal sheet that slides up from the bottom on mobile widths — scrim, drag handle, title+subtitle+close header, scrollable body. Used for the ShareSheet; reuse for any other full-detail overlay flow.

```jsx
<BottomSheet title="Teilen" subtitle="Projekt · Sommerurlaub 2026" onClose={close}>
  {tabsAndContent}
</BottomSheet>
```
