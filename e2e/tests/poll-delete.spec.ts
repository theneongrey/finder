import { test, expect } from '@playwright/test';
import { USER1, login, logout, createStandalonePoll } from './helpers';

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

    // Create a throwaway poll — lands directly on its detail page
    await createStandalonePoll(page, pollName);
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
