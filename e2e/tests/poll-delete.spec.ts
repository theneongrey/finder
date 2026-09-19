import { test, expect } from '@playwright/test';
import { USER1, login, logout } from './helpers';

// Deleting a standalone poll deletes its backing project, so after deletion the
// poll must be gone from the overview entirely (see ProjectService.Delete).
test.describe('Delete poll from results page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('deleting the poll removes it from the overview', async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1280, height: 820 });

    const pollName = `Delete E2E Poll ${Date.now()}`;

    // Create a throwaway yes/no poll
    await page.goto('/polls/add');
    await page.waitForURL('**/polls/add');
    await page.locator('[data-testid="type-btn-yesno"]').click();
    await page.locator('[data-testid="question-input"] input').fill(pollName);
    await page.locator('app-option-card ds-input input').first().fill('Ja');
    await page.locator('[data-testid="wizard-cta"] button').click(); // creates poll → share step
    await page.waitForSelector('app-share-content');
    await page.locator('[data-testid="wizard-cta"] button').click(); // → /polls
    await page.waitForURL('**/polls');
    await page.waitForLoadState('networkidle');

    // Sanity: the poll is present before deletion
    const pollCard = page.locator('app-poll-item').filter({ hasText: pollName });
    await expect(pollCard).toHaveCount(1);

    // Open its results page (capture ids from the CTA navigation)
    await pollCard.first().locator('[data-testid="vote-cta-btn"]').click();
    await page.waitForURL(/\/polls\/.+\/(vote|results)\/.+/);
    const parts = new URL(page.url()).pathname.split('/');
    const projectId = parts[2];
    const pollId = parts[4];
    await page.goto(`/polls/${projectId}/results/${pollId}`);
    await page.waitForLoadState('networkidle');

    // Delete via the desktop poll header: edit → delete → confirm
    await page.locator('[data-testid="poll-edit-btn-desktop"]').click();
    await page.locator('[data-testid="poll-delete-btn"]').click();
    await page.locator('[data-testid="poll-delete-confirm-btn"]').click();

    // Redirects back to the overview, and the poll is gone
    await page.waitForURL('**/polls');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('app-poll-item').filter({ hasText: pollName }),
    ).toHaveCount(0);
  });
});
