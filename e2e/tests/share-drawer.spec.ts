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
    // Wait for the Angular app to finish loading the polls list before checking
    await page.waitForLoadState('networkidle');

    const shareBtn = page.locator('[data-testid="share-btn"]').first();
    if (await shareBtn.count() === 0) {
      await page.locator('[data-testid="fab-add-poll"]').click();
      await page.waitForURL('**/polls/add');
      await page.locator('[data-testid="type-btn-yesno"]').click();
      await page.locator('[data-testid="question-input"] input').fill('E2E Share Drawer Poll');
      await page.locator('app-option-card ds-input input').first().fill('Option A');
      await page.locator('[data-testid="wizard-cta"] button').click(); // step 2 → creates poll → step 3
      await page.waitForSelector('app-share-content');
      await page.locator('[data-testid="wizard-cta"] button').click(); // step 3 → /polls
      await page.waitForURL('**/polls');
    }

    await logout(page);
    await page.close();
  }, { timeout: 90_000 });

  // ── helpers ────────────────────────────────────────────────────────────────

  async function openShareDrawer(page: import('@playwright/test').Page) {
    // :visible filters to the correct button for the current viewport
    // (poll-item renders both mobile and desktop share-btn; only one is visible)
    const shareBtn = page.locator('[data-testid="share-btn"]:visible').first();
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();
    await expect(page.locator('.ds-sheet-panel')).toBeVisible();
  }

  async function closeShareDrawer(page: import('@playwright/test').Page) {
    const panel = page.locator('.ds-sheet-panel');
    if (await panel.count() > 0 && await panel.isVisible()) {
      // ds-button has display:contents so descendant selectors through it don't work;
      // the close button is the only <button> inside .ds-sheet-header
      await page.locator('.ds-sheet-panel .ds-sheet-header button').click();
      await expect(panel).not.toBeVisible();
    }
  }

  // Removes USER2 from the first poll USER1 owns if they are already a member.
  // Used in beforeAll to put the Mitglieder tests into a known clean state.
  async function removeUser2IfMember(page: import('@playwright/test').Page) {
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="share-btn"]:visible').first().click();
    await expect(page.locator('.ds-sheet-panel')).toBeVisible();

    const membersTab = page.locator('.ds-sheet-panel ds-tabs button.ds-tab')
      .filter({ hasText: /zugriff|access|members/i });

    if (await membersTab.isVisible()) {
      await membersTab.click();
      const user2Row = page.locator('.ds-sheet-panel app-share-members-list .relative')
        .filter({ hasText: USER2 });
      if (await user2Row.count() > 0) {
        // ds-button has display:contents; target the last <button> in the row (remove is rightmost)
        await user2Row.locator('button').last().click();
        // Confirm inline overlay; scope to user2Row so we don't match other rows
        const confirmBtn = user2Row.locator('button').filter({ hasText: /entfernen|remove/i });
        if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await confirmBtn.click();
        }
        await expect(user2Row).not.toBeVisible({ timeout: 8_000 });
      }
    }

    await closeShareDrawer(page);
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
      await expect(page.locator('.ds-sheet-panel app-share-content')).toBeVisible();
    });

    test('panel slides up from the bottom of the viewport', async ({ page }) => {
      await openShareDrawer(page);
      const panel = page.locator('.ds-sheet-panel');
      const box = await panel.boundingBox();
      expect(box).not.toBeNull();
      // Viewport is 844px tall; the bottom sheet should fill the lower portion.
      // A lower edge above 700px would mean the sheet is floating away from the bottom.
      expect(box!.y + box!.height).toBeGreaterThan(700); // 700 = 844 × ~0.83
    });

    test('Einladen tab — email input and invite button are visible', async ({ page }) => {
      await openShareDrawer(page);
      await expect(page.locator('.ds-sheet-panel ds-input input')).toBeVisible();
      // hlmToggleGroup adds flex to its container too, so .flex button is ambiguous;
      // use accessible name to target the invite button specifically
      await expect(
        page.locator('.ds-sheet-panel app-share-invite-form').getByRole('button', { name: /einladen|invite/i }),
      ).toBeVisible();
    });

    test('Einladen tab — visibility segmented-control and share-link copy button are visible', async ({ page }) => {
      await openShareDrawer(page);
      // Visibility segmented control (Nur Eingeladene / Offen) is inside app-share-access-tab
      await expect(
        page.locator('.ds-sheet-panel app-share-access-tab ds-segmented-control'),
      ).toBeVisible();
      // The link card is CSS-hidden (max-height: 0) until "Open" ("Offen") is selected.
      // Scope to ds-segmented-control (display: block, not contents) so traversal works.
      // The app runs in English in Playwright's headless Chromium; regex covers both locales.
      await page.locator('.ds-sheet-panel app-share-access-tab ds-segmented-control button.ds-seg-btn')
        .filter({ hasText: /offen|open/i }).click();
      // Share-link copy button appears inside .link-card-outer once public is selected
      await expect(page.locator('.ds-sheet-panel app-share-access-tab .link-card-outer button')).toBeVisible();
    });

    test('close button (ds-icon-button) closes the sheet', async ({ page }) => {
      await openShareDrawer(page);
      await page.locator('.ds-sheet-panel .ds-sheet-header button').click();
      await expect(page.locator('.ds-sheet-panel')).not.toBeVisible();
    });

    test('scrim (CDK backdrop) click closes the sheet', async ({ page }) => {
      await openShareDrawer(page);
      // Click the top-left of the backdrop to guarantee we land above the panel,
      // not over the sheet content which occupies the bottom of the viewport.
      await page.locator('.cdk-overlay-backdrop').click({ position: { x: 10, y: 10 } });
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

      // On desktop (≥680px) CSS positions the panel at 50%/50% via transform.
      // Center X should be near 640px (viewport 1280px) ± 80px tolerance.
      const panelCenterX = box!.x + box!.width / 2;
      expect(panelCenterX).toBeGreaterThan(560);
      expect(panelCenterX).toBeLessThan(720);

      // Panel must NOT be anchored to the viewport bottom
      expect(box!.y + box!.height).toBeLessThan(810);
    });

    test('close button closes the drawer on desktop', async ({ page }) => {
      await openShareDrawer(page);
      await page.locator('.ds-sheet-panel .ds-sheet-header button').click();
      await expect(page.locator('.ds-sheet-panel')).not.toBeVisible();
    });

    test('Einladen tab content is accessible on desktop', async ({ page }) => {
      await openShareDrawer(page);
      await expect(page.locator('.ds-sheet-panel ds-input input')).toBeVisible();
      await expect(
        page.locator('.ds-sheet-panel app-share-invite-form').getByRole('button', { name: /einladen|invite/i }),
      ).toBeVisible();
    });
  });

  // ── Mitglieder tab — deterministic invite → verify → clean-up ──────────────

  test.describe('Mitglieder tab', () => {
    // Remove USER2 before each run so the invite step always executes unconditionally.
    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 390, height: 844 });
      await login(page, USER1);
      await removeUser2IfMember(page);
      await logout(page);
      await page.close();
    }, { timeout: 90_000 });

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await login(page, USER1);
      await page.goto('/polls');
    });

    test.afterEach(async ({ page }) => {
      await closeShareDrawer(page);
      await logout(page);
    });

    test('invite USER2 → members tab appears → member avatar visible → remove USER2', async ({ page }) => {
      await openShareDrawer(page);

      // Invite USER2 unconditionally — beforeAll guarantees they are not yet a member
      await page.locator('.ds-sheet-panel ds-input input').fill(USER2);
      await page.locator('.ds-sheet-panel app-share-invite-form').getByRole('button', { name: /einladen|invite/i }).click();

      // Members tab must appear once the invite succeeds
      const membersTab = page.locator('.ds-sheet-panel ds-tabs button.ds-tab')
        .filter({ hasText: /zugriff|access|members/i });
      await expect(membersTab).toBeVisible({ timeout: 10_000 });

      // Switch to the members tab
      await membersTab.click();

      // USER2's row must contain an avatar
      const user2Row = page.locator('.ds-sheet-panel app-share-members-list .relative')
        .filter({ hasText: USER2 });
      await expect(user2Row.locator('app-user-avatar').first()).toBeVisible();

      // Clean up — scope to USER2's row; remove button is last <button> in the flex row
      await user2Row.locator('button').last().click();
      // Confirm overlay: ds-button renders as display:contents; the inner <button> holds the text
      const confirmBtn = user2Row.locator('button').filter({ hasText: /entfernen|remove/i });
      await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
      await confirmBtn.click();
      await expect(user2Row).not.toBeVisible({ timeout: 10_000 });
    });
  });
});
