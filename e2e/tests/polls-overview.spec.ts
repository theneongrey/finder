import { test, expect } from '@playwright/test';
import { USER1, USER2, login, logout } from './helpers';

test.describe('Polls-only overview (simplified MVP)', () => {
  let testProjectId: string;
  let testPollId: string;

  // One-time setup: ensure USER1 has at least one standalone poll with open options.
  // Creates one only if none exists, so re-runs are fast and idempotent.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);

    const voteBtn = page.locator('[data-testid="vote-btn"]').first();

    if (await voteBtn.count() === 0) {
      await page.locator('[data-testid="add-poll-card"]').click();
      await page.waitForURL('**/polls/add');
      await page.getByText('Yes/No').click();
      await page.getByRole('textbox', { name: 'Your question' }).fill('E2E Smoke Test Poll');
      await page.getByPlaceholder('e.g. Italian restaurant').first().fill('Option A');
      await page.getByRole('button', { name: 'Create poll' }).click();
      await page.waitForURL('**/polls');
    }

    // Navigate to vote page to capture projectId and pollId from the URL
    await page.locator('[data-testid="vote-btn"]').first().click();
    await page.waitForURL('**/polls/**/vote/**');
    const parts = new URL(page.url()).pathname.split('/');
    // URL shape: /polls/<projectId>/vote/<pollId>/<optionId>
    testProjectId = parts[2];
    testPollId = parts[4];

    await page.goto('/polls');
    await logout(page);
    await page.close();
  }, 90000);

  test.describe('Overview page', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, USER1);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('shows standalone polls list with no project tabs visible', async ({ page }) => {
      await page.goto('/polls');
      await expect(page.getByRole('tab')).not.toBeVisible();
      await expect(page.locator('[data-testid="polls-list"]')).toBeVisible();
    });

    test('no project management UI — no tabs, no "New project" link', async ({ page }) => {
      await page.goto('/polls');
      await expect(page.getByRole('tab')).not.toBeVisible();
      await expect(page.getByRole('link', { name: /new project/i })).not.toBeVisible();
      await expect(page.getByRole('button', { name: /new project/i })).not.toBeVisible();
    });
  });

  test('shows empty state for a user with no standalone polls', async ({ page }) => {
    await login(page, USER2);
    await page.goto('/polls');
    await expect(page.locator('[data-testid="polls-empty-state"]')).toBeVisible();
    await logout(page);
  });

  test.describe('Create poll flow', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, USER1);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('add-card navigates to /polls/add and new poll appears in list after submit', async ({ page }) => {
      await page.goto('/polls');
      await page.locator('[data-testid="add-poll-card"]').click();
      await page.waitForURL('**/polls/add');

      await page.getByText('Yes/No').click();
      await page.getByRole('textbox', { name: 'Your question' }).fill('E2E Created Poll');
      await page.getByPlaceholder('e.g. Italian restaurant').first().fill('Option A');
      await page.getByRole('button', { name: 'Create poll' }).click();
      await page.waitForURL('**/polls');

      await expect(page.getByText('E2E Created Poll')).toBeVisible();

      // Clean up: delete the created poll
      const pollCard = page.locator('app-poll-item').filter({ hasText: 'E2E Created Poll' });
      await pollCard.locator('[data-testid="poll-menu-btn"]').click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.getByRole('button', { name: 'Delete poll' }).click();
    });
  });

  test.describe('Vote flow', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, USER1);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('vote button navigates to vote page and casting a vote advances to next step', async ({ page }) => {
      await page.goto('/polls');
      await page.locator('[data-testid="vote-btn"]').first().click();
      await page.waitForURL('**/polls/**/vote/**');

      // Cast a "Yes" vote via the heart button
      await page.locator('button').filter({ has: page.locator('i.fa-heart') }).click();

      // After voting, either advances to the next option or navigates to results
      await page.waitForURL(/\/polls\/.+\/(vote|results)\/.+/);
    });
  });

  test.describe('Routing', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, USER1);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('/polls/:id with no sub-route redirects to /polls', async ({ page }) => {
      await page.goto(`/polls/${testProjectId}`);
      await page.waitForURL('**/polls');
      await expect(page).toHaveURL(/\/polls$/);
    });

    test('removed /project/add route redirects to /polls', async ({ page }) => {
      await page.goto('/project/add');
      await page.waitForURL('**/polls');
      await expect(page).toHaveURL(/\/polls$/);
    });
  });
});
