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

    const voteBtn = page
      .locator('[data-testid="vote-cta-btn"]')
      .filter({ hasText: /vote now|jetzt abstimmen/i })
      .first();

    if (await voteBtn.count() === 0) {
      await page.goto('/polls/add');
      await page.waitForURL('**/polls/add');
      await page.getByText('Yes/No').click(); // auto-advances to step 2
      await page.getByRole('textbox', { name: 'Your question' }).fill('Voting Progress Test Poll');
      await page.locator('app-option-card ds-input input').first().fill('Ja');
      await page.locator('[data-testid="wizard-cta"] button').click();
      await page.waitForURL('**/polls');
    }

    // Capture IDs from the vote URL
    await page
      .locator('[data-testid="vote-cta-btn"]')
      .filter({ hasText: /vote now|jetzt abstimmen/i })
      .first()
      .click();
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

  test('CTA reads "Vote now" (or locale equivalent) for unvoted poll', async ({ page }) => {
    await page.goto('/polls');
    const ctaBtn = page.locator('app-poll-item [data-testid="vote-cta-btn"]').first();
    await expect(ctaBtn).toContainText(/vote now|jetzt abstimmen/i);
  });

  test('voted-count is visible on each card', async ({ page }) => {
    await page.goto('/polls');
    // voted-count span shows both the voted count and total in one element
    await expect(page.locator('[data-testid="voted-count"]').first()).toBeVisible();
  });

  test('CTA changes after casting a vote', async ({ page }) => {
    // Cast a vote
    await page.goto(`/polls/${testProjectId}/vote/${testPollId}/${testOptionId}`);
    await page.waitForLoadState('networkidle');
    await page.locator('button.ds-vote-btn--yes').first().click();
    await page.waitForURL(/\/polls\/.+\/(vote|results)\/.+/);

    // Return to overview and verify CTA no longer says "Vote now"
    await page.goto('/polls');
    const pollCard = page.locator('app-poll-item').filter({ hasText: 'Voting Progress Test Poll' }).first();
    const ctaBtn = pollCard.locator('[data-testid="vote-cta-btn"]');
    await expect(ctaBtn).not.toContainText(/vote now|jetzt abstimmen/i);
  });
});
