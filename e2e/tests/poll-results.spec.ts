import { test, expect } from '@playwright/test';
import { USER1, login, logout, createStandalonePoll, addTextOption } from './helpers';

test.describe('Poll detail page (#255)', () => {
  let testProjectId: string;
  let testPollId: string;

  // Ensure a dedicated test poll with at least one option exists. Idempotent across runs.
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90000);
    const page = await browser.newPage();
    await login(page, USER1);
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');

    const testPoll = page.locator('app-poll-item').filter({ hasText: 'Results E2E Test Poll' });
    if (await testPoll.count() === 0) {
      // Create the poll (lands on the detail page) and add one option.
      const ids = await createStandalonePoll(page, 'Results E2E Test Poll');
      await addTextOption(page, 'Ja');
      testProjectId = ids.projectId;
      testPollId = ids.pollId;
    } else {
      // Capture ids from the existing poll's detail page.
      await testPoll.first().locator('[data-testid="open-poll-btn"]').click();
      await page.waitForURL(/\/polls\/[^/]+\/[^/]+$/);
      const parts = new URL(page.url()).pathname.split('/');
      testProjectId = parts[2];
      testPollId = parts[3];
      // Ensure the poll has at least one option for the option-list tests.
      if (await page.locator('[data-testid="results-empty-options"]').count() > 0) {
        await addTextOption(page, 'Ja');
      }
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

  const detailUrl = () => `/polls/${testProjectId}/${testPollId}`;

  // ── Header ─────────────────────────────────────────────────────

  test('header shows the poll title and a back button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(detailUrl());
    const header = page.getByRole('banner');
    // The back control is an icon-only button in the title bar.
    await expect(header.getByRole('button').first()).toBeVisible();
    await expect(header.getByRole('heading', { name: 'Results E2E Test Poll' })).toBeVisible();
  });

  // ── Desktop layout ─────────────────────────────────────────────

  test('desktop: toolbar, poll header and option list render', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(detailUrl());
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="results-toolbar"]')).toBeVisible();
    await expect(page.locator('app-poll-header')).toBeVisible();
    await expect(page.locator('[data-testid="results-option-list"]')).toBeVisible();
  });

  test('desktop: poll header shows type badge and status dot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(detailUrl());
    await expect(page.locator('ds-badge').first()).toBeVisible();
    await expect(page.locator('ds-status-dot').first()).toBeVisible();
  });

  test('desktop: option list shows a vote tally for the option', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(detailUrl());
    await page.waitForLoadState('networkidle');
    const list = page.locator('[data-testid="results-option-list"]');
    await expect(list.locator('app-option-card').first()).toBeVisible();
    // The card renders a participation line ("N of M voted" / "N von M …").
    await expect(list).toContainText(/voted|abgestimmt/i);
  });

  test('desktop: comments sidebar renders with textarea and disabled submit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(detailUrl());
    await expect(page.locator('[data-testid="results-comment-input"] textarea')).toBeVisible();
    await expect(page.locator('[data-testid="results-comment-submit"] button')).toBeDisabled();
  });

  test('desktop: typing a comment enables the submit button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(detailUrl());
    await page.locator('[data-testid="results-comment-input"] textarea').fill('Test comment');
    await expect(page.locator('[data-testid="results-comment-submit"] button')).toBeEnabled();
  });

  // ── Sort toggle ───────────────────────────────────────────────

  test('sort button toggles its label', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto(detailUrl());
    const sortBtn = page.locator('[data-testid="results-sort-btn"]').filter({ visible: true }).first();
    const before = (await sortBtn.innerText()).trim();
    await sortBtn.click();
    await expect(sortBtn).not.toHaveText(before);
    await sortBtn.click();
    await expect(sortBtn).toHaveText(before);
  });

  // ── Close poll confirm (mobile toolbar) ───────────────────────

  test('mobile: close poll shows inline confirm; cancel restores the button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(detailUrl());

    const closeBtn = page.locator('[data-testid="close-poll-btn"]').filter({ visible: true }).first();
    if (!await closeBtn.isVisible()) {
      test.skip(true, 'Close poll button not visible — poll may be closed or user is not maintainer');
      return;
    }

    await closeBtn.click();
    await expect(page.locator('[data-testid="close-poll-confirm-btn"]').filter({ visible: true }).first()).toBeVisible();

    await page.getByRole('button', { name: /abbrechen|cancel/i }).first().click();
    await expect(closeBtn).toBeVisible();
  });
});
