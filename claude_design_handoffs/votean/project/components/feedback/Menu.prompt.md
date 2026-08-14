Floating action menu anchored under a kebab button, with a full-screen invisible scrim to catch outside clicks. Danger items (Löschen) render in red.

```jsx
<Menu
  open={menuOpen}
  onClose={closeMenu}
  items={[
    { icon: 'share', label: 'Teilen', onClick: onShare },
    { icon: 'edit', label: 'Bearbeiten', onClick: onEdit },
    { icon: 'trash', label: 'Löschen', onClick: onDelete, danger: true },
  ]}
/>
```
