import { test, expect } from '@playwright/test';
import { USER1, USER2, login, logout } from './helpers';

test.describe('Poll voting progress on overview', () => {
  let testProjectId: string;
  let testPollId: string;
  let testOptionId: string;

  // Ensure USER1 has a standalone poll with at least one option and USER2 has voter access.
  // Creates one if none is suitable, so repeated runs stay fast.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);

    const voteBtn = page.locator('[data-testid="vote-cta-btn"]').filter({ hasText: 'Vote now' }).first();

    if (await voteBtn.count() === 0) {
      await page.locator('[data-testid="add-poll-card"]').click();
      await page.waitForURL('**/polls/add');
      await page.getByText('Yes/No').click();
      await page.getByRole('textbox', { name: 'Your question' }).fill('Voting Progress Test Poll');
      await page.getByPlaceholder('e.g. Italian restaurant').first().fill('Option A');
      await page.getByRole('button', { name: 'Create poll' }).click();
      await page.waitForURL('**/polls');
    }

    // Capture IDs from the vote URL
    await page.locator('[data-testid="vote-cta-btn"]').filter({ hasText: 'Vote now' }).first().click();
    await page.waitForURL('**/polls/**/vote/**');
    const parts = new URL(page.url()).pathname.split('/');
    // URL shape: /polls/<projectId>/vote/<pollId>/<optionId>
    testProjectId = parts[2];
    testPollId = parts[4];
    testOptionId = parts[5];

    await page.goto('/polls');
    await logout(page);
    await page.close();
  }, 90000);

  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('CTA reads "Vote now" when user has not voted', async ({ page }) => {
    await page.goto('/polls');
    const ctaBtn = page.locator(`app-poll-item [data-testid="vote-cta-btn"]`).first();
    await expect(ctaBtn).toContainText('Vote now');
  });

  test('voted-count and total-participants are visible on each card', async ({ page }) => {
    await page.goto('/polls');
    await expect(page.locator('[data-testid="voted-count"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="total-participants"]').first()).toBeVisible();
  });

  test('CTA reads "View current standings" after casting a vote', async ({ page }) => {
    // Cast a vote
    await page.goto(`/polls/${testProjectId}/vote/${testPollId}/${testOptionId}`);
    await page.locator('button.ds-vote-btn--yes').first().click();
    await page.waitForURL(/\/polls\/.+\/(vote|results)\/.+/);

    // Return to overview and verify CTA changed
    await page.goto('/polls');
    const pollCard = page.locator('app-poll-item').filter({ hasText: 'Voting Progress Test Poll' }).first();
    const ctaBtn = pollCard.locator('[data-testid="vote-cta-btn"]');
    await expect(ctaBtn).toContainText('View current standings');
  });
});
