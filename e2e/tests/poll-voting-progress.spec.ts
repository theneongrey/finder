import { test, expect } from '@playwright/test';
import { USER1, login, logout } from './helpers';

test.describe('Poll voting progress on overview', () => {
  // Ensure USER1 has a standalone "Voting Progress Test Poll" with one option.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');

    const testPoll = page.locator('app-poll-item').filter({ hasText: 'Voting Progress Test Poll' });
    if (await testPoll.count() === 0) {
      await page.goto('/polls/add');
      await page.waitForURL('**/polls/add');
      await page.locator('[data-testid="type-btn-yesno"]').click(); // auto-advances to step 2
      await page.locator('[data-testid="question-input"] input').fill('Voting Progress Test Poll');
      await page.locator('app-option-card ds-input input').first().fill('Ja');
      await page.locator('[data-testid="wizard-cta"] button').click(); // step 2 → creates poll → step 3
      await page.waitForSelector('app-share-content');
      await page.locator('[data-testid="wizard-cta"] button').click(); // step 3 → /polls
      await page.waitForURL('**/polls');
    }

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
    // At least one poll must show vote-now CTA
    const voteBtns = page.locator('app-poll-item [data-testid="vote-cta-btn"]').filter({ hasText: /vote now|jetzt abstimmen/i });
    await expect(voteBtns).not.toHaveCount(0);
  });

  test('voted-count is visible on each card', async ({ page }) => {
    await page.goto('/polls');
    // voted-count span shows both the voted count and total in one element
    await expect(page.locator('[data-testid="voted-count"]').first()).toBeVisible();
  });

  test('CTA changes after casting a vote', async ({ page }) => {
    await page.goto('/polls');
    const pollCard = page.locator('app-poll-item').filter({ hasText: 'Voting Progress Test Poll' }).first();
    const ctaBtn = pollCard.locator('[data-testid="vote-cta-btn"]');

    // If previously voted in another run, CTA already says "show results" — idempotent pass
    const ctaText = await ctaBtn.innerText();
    if (/show results|zeige ergebnisse/i.test(ctaText)) {
      await expect(ctaBtn).toContainText(/show results|zeige ergebnisse/i);
      return;
    }

    // Navigate to vote page via the overview CTA
    await ctaBtn.click();
    await page.waitForURL('**/polls/**/vote/**');
    await page.waitForLoadState('networkidle');

    // Cast a "Yes" vote — desktop viewport: mobile ds-vote-btn is md:hidden
    await page.locator('button.desktop-vote-btn--yes').first().click();
    await page.waitForURL(/\/polls\/.+\/(vote|results)\/.+/);

    // Return to overview and verify at least one "Voting Progress Test Poll" CTA changed.
    // (The list may re-sort after voting so .first() can resolve to a different unvoted duplicate.)
    await page.goto('/polls');
    const resultsCtas = page.locator('app-poll-item')
      .filter({ hasText: 'Voting Progress Test Poll' })
      .locator('[data-testid="vote-cta-btn"]')
      .filter({ hasText: /show results|zeige ergebnisse/i });
    await expect(resultsCtas).not.toHaveCount(0);
  });
});
