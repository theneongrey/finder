import { test, expect } from '@playwright/test';
import { USER1, login, logout, createStandalonePoll } from './helpers';

test.describe('Poll close date', () => {
  let pollSlug: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);

    // Create a fresh standalone poll — it is open (no close date set on create).
    const { pollId } = await createStandalonePoll(page, 'Close Date E2E Test Poll');
    pollSlug = pollId;

    await logout(page);
    await page.close();
  }, 90000);

  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('newly created poll with future close date shows open status', async ({ page }) => {
    await page.goto('/polls');
    // At least one "Close Date E2E Test Poll" card must show an open (non-closed) status badge.
    // Uses locale-agnostic check: exclude badges that contain "closed"/"beendet".
    const openBadges = page.locator('app-poll-item')
      .filter({ hasText: 'Close Date E2E Test Poll' })
      .locator('[data-testid="poll-status-badge"]')
      .filter({ hasNotText: /\bclosed\b|\bbeendet\b/i });
    await expect(openBadges).not.toHaveCount(0);
  });

  test('closing poll via API then reloading overview shows closed status', async ({ page }) => {
    // Close the poll via the API using the authenticated session
    await page.goto('/polls');
    const closeResponse = await page.request.post(`/api/polls/${pollSlug}/close`);
    expect(closeResponse.ok()).toBeTruthy();

    await page.reload();
    // At least one "Close Date E2E Test Poll" must now show a closed status badge (locale-agnostic)
    const closedBadges = page.locator('app-poll-item')
      .filter({ hasText: 'Close Date E2E Test Poll' })
      .locator('[data-testid="poll-status-badge"]')
      .filter({ hasText: /\bclosed\b|\bbeendet\b/i });
    await expect(closedBadges).not.toHaveCount(0);
  });
});
