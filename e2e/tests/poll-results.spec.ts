import { test, expect } from '@playwright/test';
import { USER1, login, logout } from './helpers';

test.describe('Poll results page (#255)', () => {
  let testProjectId: string;
  let testPollId: string;

  // Ensure a poll with at least one vote exists. Idempotent across runs.
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90000);
    const page = await browser.newPage();
    await login(page, USER1);
    await page.goto('/polls');

    const firstCta = page.locator('[data-testid="vote-cta-btn"]').first();
    await firstCta.click();
    await page.waitForURL(/\/polls\/.+\/(vote|results)\/.+/);

    const parts = new URL(page.url()).pathname.split('/');
    testProjectId = parts[2];
    testPollId = parts[4];

    // Cast a vote to populate the results page when the poll is in voting state
    if (page.url().includes('/vote/')) {
      await page.locator('ds-vote-buttons button').last().click();
      await page.waitForURL(/\/polls\/.+\/(vote|results)\/.+/);
    }

    await logout(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  // ── Breadcrumb ────────────────────────────────────────────────

  test('header shows poll title and Polls back label', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);
    const header = page.getByRole('banner');
    // The breadcrumb is a button in the title bar; the subtitle <p> is hidden
    await expect(header.getByRole('button', { name: /polls/i })).toBeVisible();
    await expect(header.locator('h1, [data-testid="title-bar-title"]').first()).not.toBeEmpty();
  });

  // ── Desktop layout ────────────────────────────────────────────

  test('desktop: stats row, hero card and option list render', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);
    // Both layouts are in the DOM; filter to the visible one (desktop)
    await expect(page.locator('[data-testid="results-stats-row"]').filter({ visible: true })).toBeVisible();
    await expect(page.locator('[data-testid="results-hero-card"]').filter({ visible: true })).toBeVisible();
    await expect(page.locator('[data-testid="results-option-list"]').filter({ visible: true })).toBeVisible();
  });

  test('desktop: poll header shows type badge and status dot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);
    await expect(page.locator('ds-badge').first()).toBeVisible();
    await expect(page.locator('ds-status-dot').first()).toBeVisible();
  });

  test('desktop: Beteiligung stat shows "voted/total" participation format', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);
    const statsRow = page.locator('[data-testid="results-stats-row"]').filter({ visible: true });
    const beteiligungCard = statsRow.locator('> div').filter({ hasText: 'Beteiligung' }).first();
    await expect(beteiligungCard).toContainText('/');
  });

  test('desktop: comments sidebar renders with textarea input and disabled submit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);
    // Scope to the desktop sidebar to avoid the hidden mobile comments section
    const sidebar = page.locator('.lg\\:w-\\[360px\\]');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('[data-testid="results-comment-input"] textarea')).toBeVisible();
    await expect(sidebar.locator('[data-testid="results-comment-submit"] button')).toBeDisabled();
  });

  test('desktop: typing a comment enables the submit button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);
    const sidebar = page.locator('.lg\\:w-\\[360px\\]');
    await sidebar.locator('[data-testid="results-comment-input"] textarea').fill('Test comment');
    await expect(sidebar.locator('[data-testid="results-comment-submit"] button')).toBeEnabled();
  });

  // ── Sort toggle ───────────────────────────────────────────────

  test('sort button toggles between "Nach Zustimmung" and "Nach Reihenfolge"', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);
    // The sort button appears in both layouts; target the visible (desktop) one
    const sortBtn = page.locator('[data-testid="results-sort-btn"]').filter({ visible: true });
    await expect(sortBtn).toContainText('Nach Zustimmung');
    await sortBtn.click();
    await expect(sortBtn).toContainText('Nach Reihenfolge');
    await sortBtn.click();
    await expect(sortBtn).toContainText('Nach Zustimmung');
  });

  // ── Mobile layout ─────────────────────────────────────────────

  test('mobile: Ergebnis and Kommentare tab bar is visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);
    await expect(page.locator('[data-testid="results-tab-ergebnis"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-tab-kommentare"]')).toBeVisible();
  });

  test('mobile: Ergebnis tab (default) shows hero card and option list', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);
    await expect(page.locator('[data-testid="results-hero-card"]').filter({ visible: true })).toBeVisible();
    await expect(page.locator('[data-testid="results-option-list"]').filter({ visible: true })).toBeVisible();
  });

  test('mobile: switching to Kommentare tab shows textarea input and disabled submit', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);
    await page.locator('[data-testid="results-tab-kommentare"]').click();
    // Scope to the visible mobile comments panel (desktop sidebar is display:none at 390px)
    const mobileComments = page.locator('.flex.flex-col.lg\\:hidden app-comments-section');
    await expect(mobileComments.locator('[data-testid="results-comment-input"] textarea')).toBeVisible();
    await expect(mobileComments.locator('[data-testid="results-comment-submit"] button')).toBeDisabled();
  });

  test('mobile: manage card shows status/deadline text near close button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);
    const manageCard = page.locator('[data-testid="results-manage-card"]');
    if (!await manageCard.isVisible()) {
      test.skip(true, 'Manage card not visible — poll may be closed or user is not maintainer');
      return;
    }
    // Card must show a status string: running ("Läuft" / "Endet…") or closed ("Beendet")
    await expect(manageCard).toContainText(/läuft|endet|beendet/i);
  });

  // ── Close poll confirm ────────────────────────────────────────

  test('mobile: close poll shows inline confirm; cancel restores the button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/polls/${testProjectId}/results/${testPollId}`);

    const closeBtn = page.locator('[data-testid="close-poll-btn"]').first();
    if (!await closeBtn.isVisible()) {
      test.skip(true, 'Close poll button not visible — poll may be closed or user is not maintainer');
      return;
    }

    await closeBtn.click();
    await expect(page.locator('[data-testid="close-poll-confirm-btn"]').first()).toBeVisible();

    await page.getByRole('button', { name: /abbrechen/i }).first().click();
    await expect(closeBtn).toBeVisible();
    await expect(page.locator('[data-testid="close-poll-confirm-btn"]')).not.toBeVisible();
  });
});
