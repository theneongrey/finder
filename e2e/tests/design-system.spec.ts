import { test, expect } from '@playwright/test';
import { login, logout, USER1 } from './helpers';

test.describe('Design system showcase (/ux)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
    await page.goto('/ux');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('all 18 sections render without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const sections = [
      'colors', 'typography', 'spacing', 'shadows', 'icons',
      'buttons', 'icon-buttons', 'avatars', 'badges', 'cards',
      'inputs', 'progress', 'segmented', 'tabs',
      'bottom-sheet', 'menu', 'empty-state', 'vote-buttons',
    ];

    for (const id of sections) {
      await expect(page.locator(`[data-testid="section-${id}"]`)).toBeVisible();
    }

    expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
  });

  test('ds-icon: all 23 icon glyphs render', async ({ page }) => {
    const iconNames = [
      'logo', 'chevron-left', 'chevron-right', 'arrow-right', 'kebab',
      'comment', 'share', 'edit', 'trash', 'lock', 'users',
      'calendar', 'clock', 'refresh', 'play', 'send', 'trophy',
      'close', 'check', 'heart', 'grid', 'folder', 'checklist', 'plus',
    ];

    for (const name of iconNames) {
      const item = page.locator(`[data-testid="icon-${name}"]`);
      await expect(item).toBeVisible();
      // Verify an SVG was rendered inside
      await expect(item.locator('svg')).toBeVisible();
    }
  });

  test('ds-button: primary variant is visible and clickable', async ({ page }) => {
    const btn = page.locator('[data-testid="btn-primary"]');
    await expect(btn).toBeVisible();
    await expect(btn.locator('button')).toBeEnabled();
    await btn.locator('button').click(); // should not throw
  });

  test('ds-segmented-control: clicking an option changes the active state', async ({ page }) => {
    const control = page.locator('[data-testid="segmented-control"]');
    await expect(control).toBeVisible();

    // Click "Woche" (second option)
    await control.getByRole('button', { name: 'Woche' }).click();
    await expect(page.getByText('Ausgewählt: week')).toBeVisible();
  });

  test('ds-tabs: clicking a tab changes the active tab', async ({ page }) => {
    const tabs = page.locator('[data-testid="tabs"]');
    await expect(tabs).toBeVisible();

    await tabs.getByRole('button', { name: /Mitglieder/ }).click();
    await expect(page.getByText('Aktiver Tab: members')).toBeVisible();
  });

  test('ds-input: text field accepts keyboard input', async ({ page }) => {
    const input = page.locator('[data-testid="input-text"] input');
    await expect(input).toBeVisible();
    await input.fill('Hallo Welt');
    await expect(input).toHaveValue('Hallo Welt');
  });

  test('ds-bottom-sheet: trigger opens sheet; scrim click closes it', async ({ page }) => {
    const trigger = page.locator('[data-testid="bottom-sheet-trigger"] button');
    await trigger.click();

    const sheet = page.locator('[data-testid="bottom-sheet"]');
    await expect(sheet).toBeVisible();

    // Click the backdrop (first child of ds-bottom-sheet host)
    await sheet.locator('.ds-sheet-backdrop').click();
    await expect(sheet).not.toBeVisible();
  });

  test('ds-menu: trigger opens menu; clicking outside closes it', async ({ page }) => {
    const trigger = page.locator('[data-testid="menu-trigger"] button');
    await trigger.click();

    const menu = page.locator('[data-testid="menu"] .ds-menu-panel');
    await expect(menu).toBeVisible();

    // Click the scrim
    await page.locator('[data-testid="menu"] .ds-menu-scrim').click();
    await expect(menu).not.toBeVisible();
  });

  test('ds-avatar-stack: overlap group renders without overflow', async ({ page }) => {
    const stack = page.locator('[data-testid="avatar-stack"]');
    await expect(stack).toBeVisible();
    // Should have rendered avatar circles
    const circles = stack.locator('.ds-avatar-circle');
    await expect(circles).toHaveCount(4); // max=4
  });

  test('ds-progress-bar: all four bars are visible', async ({ page }) => {
    for (const pct of [0, 35, 75, 100]) {
      await expect(page.locator(`[data-testid="progress-${pct}"]`)).toBeVisible();
    }
  });

  test('existing /polls route still loads after Spartan removal', async ({ page }) => {
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    // Page should not show an error state
    await expect(page.locator('app-title-bar')).toBeVisible();
  });
});
