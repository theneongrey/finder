import { test, expect } from '@playwright/test';
import { USER1, USER2, login, logout } from './helpers';

// ---------------------------------------------------------------------------
// #241 — ShareDrawer (BottomSheet) — Einladen / Mitglieder / Sichtbarkeit
//
// The share drawer uses Spartan's hlm-sheet which portals content via CDK
// overlay. Content inside the panel lives in `.ds-sheet-panel` (not under
// `app-share-drawer` in the DOM). The CDK backdrop is `.cdk-overlay-backdrop`.
// ---------------------------------------------------------------------------

test.describe('#241 ShareDrawer — Einladen / Mitglieder / Sichtbarkeit', () => {
  // Ensure USER1 has at least one standalone poll they own (canShare = role >= Owner).
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, USER1);
    await page.goto('/polls');

    const shareBtn = page.locator('[data-testid="share-btn"]').first();
    if (await shareBtn.count() === 0 || !(await shareBtn.isVisible())) {
      await page.locator('[data-testid="fab-add-poll"]').click();
      await page.waitForURL('**/polls/add');
      await page.getByText('Yes/No').click();
      await page.getByRole('textbox', { name: 'Your question' }).fill('E2E Share Drawer Poll');
      await page.getByPlaceholder('e.g. Italian restaurant').first().fill('Option A');
      await page.getByRole('button', { name: 'Create poll' }).click();
      await page.waitForURL('**/polls');
    }

    await logout(page);
    await page.close();
  }, 90_000);

  // ── helpers ────────────────────────────────────────────────────────────────

  async function openShareDrawer(page: import('@playwright/test').Page) {
    const shareBtn = page.locator('[data-testid="share-btn"]').first();
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();
    // Wait for the portaled panel to be visible
    await expect(page.locator('.ds-sheet-panel')).toBeVisible();
  }

  async function closeShareDrawer(page: import('@playwright/test').Page) {
    const panel = page.locator('.ds-sheet-panel');
    if (await panel.count() > 0 && await panel.isVisible()) {
      await page.locator('.ds-sheet-header button').click();
      await expect(panel).not.toBeVisible();
    }
  }

  // ── Mobile (390 × 844) — BottomSheet slides up from bottom ─────────────────

  test.describe('mobile (390px) — bottom-sheet', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await login(page, USER1);
      await page.goto('/polls');
    });

    test.afterEach(async ({ page }) => {
      await closeShareDrawer(page);
      await logout(page);
    });

    test('share button opens the sheet', async ({ page }) => {
      await openShareDrawer(page);
      await expect(page.locator('app-share-drawer')).toBeVisible();
    });

    test('panel slides up from the bottom of the viewport', async ({ page }) => {
      await openShareDrawer(page);
      const panel = page.locator('.ds-sheet-panel');
      const box = await panel.boundingBox();
      // Bottom sheet: the panel's lower edge sits at or very near the viewport bottom
      expect(box).not.toBeNull();
      expect(box!.y + box!.height).toBeGreaterThan(700);
    });

    test('Einladen tab — email input and invite button are visible', async ({ page }) => {
      await openShareDrawer(page);
      // ds-input renders a plain <input> inside
      await expect(page.locator('.ds-sheet-panel ds-input input')).toBeVisible();
      // Invite / Einladen button
      await expect(
        page.locator('.ds-sheet-panel ds-button button').filter({ hasText: /einladen|invite/i }).first(),
      ).toBeVisible();
    });

    test('Sichtbarkeit — visibility segmented-control and share-link row are visible', async ({ page }) => {
      await openShareDrawer(page);
      // Visibility segmented control is inside app-share-access-tab
      await expect(
        page.locator('.ds-sheet-panel app-share-access-tab ds-segmented-control'),
      ).toBeVisible();
      // Share-link copy button (Kopieren / Copy)
      await expect(
        page.locator('.ds-sheet-panel app-share-access-tab ds-button button')
          .filter({ hasText: /kopieren|copy/i }),
      ).toBeVisible();
    });

    test('close button (ds-icon-button) closes the sheet', async ({ page }) => {
      await openShareDrawer(page);
      await page.locator('.ds-sheet-header button').click();
      await expect(page.locator('.ds-sheet-panel')).not.toBeVisible();
    });

    test('scrim (CDK backdrop) click closes the sheet', async ({ page }) => {
      await openShareDrawer(page);
      // The CDK overlay backdrop covers the area above the panel
      await page.locator('.cdk-overlay-backdrop').click();
      await expect(page.locator('.ds-sheet-panel')).not.toBeVisible();
    });
  });

  // ── Desktop (1280 × 820) — rendered as centered modal ──────────────────────

  test.describe('desktop (1280px) — centered modal', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 820 });
      await login(page, USER1);
      await page.goto('/polls');
    });

    test.afterEach(async ({ page }) => {
      await closeShareDrawer(page);
      await logout(page);
    });

    test('share button opens the drawer as a centered modal', async ({ page }) => {
      await openShareDrawer(page);
      const panel = page.locator('.ds-sheet-panel');
      const box = await panel.boundingBox();
      expect(box).not.toBeNull();

      // On desktop (≥680px) the CSS positions the panel at 50%/50% transform:
      // left: 50%, top: 50%, transform: translate(-50%, -50%)
      const panelCenterX = box!.x + box!.width / 2;
      // Tolerance ±80px — the modal max-width is 820px so center ≈ 640px
      expect(panelCenterX).toBeGreaterThan(560);
      expect(panelCenterX).toBeLessThan(720);

      // Panel is NOT anchored to the bottom
      expect(box!.y + box!.height).toBeLessThan(810);
    });

    test('close button closes the drawer on desktop', async ({ page }) => {
      await openShareDrawer(page);
      await page.locator('.ds-sheet-header button').click();
      await expect(page.locator('.ds-sheet-panel')).not.toBeVisible();
    });

    test('Einladen tab content is accessible on desktop', async ({ page }) => {
      await openShareDrawer(page);
      await expect(page.locator('.ds-sheet-panel ds-input input')).toBeVisible();
      await expect(
        page.locator('.ds-sheet-panel ds-button button')
          .filter({ hasText: /einladen|invite/i }).first(),
      ).toBeVisible();
    });
  });

  // ── Mitglieder tab — invite USER2, verify member list, then clean up ────────

  test.describe('Mitglieder tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await login(page, USER1);
      await page.goto('/polls');
    });

    test.afterEach(async ({ page }) => {
      await closeShareDrawer(page);
      await logout(page);
    });

    test('invite a member → members tab appears → member avatar visible → remove member', async ({ page }) => {
      await openShareDrawer(page);

      // Invite USER2 if not already a member (members tab not yet showing)
      const membersTab = page.locator('.ds-sheet-panel ds-tabs button.ds-tab')
        .filter({ hasText: /zugriff|access|members/i });

      if (await membersTab.count() === 0) {
        // Fill in USER2 email and send invite
        await page.locator('.ds-sheet-panel ds-input input').fill(USER2);
        const inviteBtn = page.locator('.ds-sheet-panel ds-button button')
          .filter({ hasText: /einladen|invite/i }).first();
        await inviteBtn.click();

        // Members tab should appear after the invite succeeds
        await expect(membersTab).toBeVisible({ timeout: 10_000 });
      }

      // Switch to members tab
      await membersTab.first().click();

      // Member list should contain a user avatar
      await expect(
        page.locator('.ds-sheet-panel app-share-members-list app-user-avatar').first(),
      ).toBeVisible();

      // Clean up: remove USER2 from the poll
      const removeBtn = page.locator('.ds-sheet-panel app-share-members-list ds-button button')
        .filter({ visible: true }).first();
      if (await removeBtn.isVisible()) {
        await removeBtn.click();
        // Confirm removal if an inline confirm button appears
        const confirmBtn = page.locator('.ds-sheet-panel app-share-members-list ds-button button')
          .filter({ hasText: /entfernen|remove/i }).first();
        if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await confirmBtn.click();
        }
      }
    });
  });
});
