import { test, expect } from '@playwright/test';
import { USER1, login, logout, createStandalonePoll, addTextOption } from './helpers';

test.describe('Poll voting progress on overview', () => {
  // Ensure USER1 has a standalone "Voting Progress Test Poll" with one option.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');

    const testPoll = page.locator('app-poll-item').filter({ hasText: 'Voting Progress Test Poll' });
    if (await testPoll.count() === 0) {
      await createStandalonePoll(page, 'Voting Progress Test Poll');
      await addTextOption(page, 'Ja');
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

  test('overview shows an open CTA for each poll', async ({ page }) => {
    await page.goto('/polls');
    // At least one poll must show the open CTA (voting is started from the detail page)
    const openBtns = page.locator('app-poll-item [data-testid="open-poll-btn"]');
    await expect(openBtns).not.toHaveCount(0);
  });

  test('poll creator is shown crowned on the card', async ({ page }) => {
    await page.goto('/polls');
    const testPoll = page.locator('app-poll-item').filter({ hasText: 'Voting Progress Test Poll' }).first();
    await expect(testPoll.locator('[data-testid="option-creator-crown"]')).toBeVisible();
    await expect(testPoll.locator('[data-testid="voted-count"]')).toHaveCount(0);
  });

  test('creator avatar shows its tooltip on hover, unclipped by the card', async ({ page }) => {
    await page.goto('/polls');
    const testPoll = page.locator('app-poll-item').filter({ hasText: 'Voting Progress Test Poll' }).first();
    // Let the entry animation finish — the check below is about the card's resting state.
    await testPoll.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
    await testPoll.locator('[data-testid="option-creator"] hlm-avatar').hover();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    // toBeVisible ignores overflow clipping. The tooltip is position: fixed, so it only escapes the
    // card's overflow-hidden when no ancestor becomes its containing block (e.g. a leftover transform).
    const trappingAncestors = await tooltip.evaluate((el) => {
      const found: string[] = [];
      for (let a = el.parentElement; a; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.transform !== 'none' || cs.filter !== 'none' || cs.contain !== 'none') {
          found.push(a.tagName.toLowerCase());
        }
      }
      return found;
    });
    expect(trappingAncestors).toEqual([]);
  });

  test('starting a vote opens the overlay on the detail page and it can be dismissed', async ({ page }) => {
    // Create a fresh poll with one option → deterministic open, owned poll.
    await createStandalonePoll(page, `Voting Flow E2E ${Date.now()}`);
    await addTextOption(page, 'Ja');

    // Voting is an overlay on the detail page — open it from the toolbar.
    await page.locator('[data-testid="start-vote-btn"] button:visible').first().click();
    await expect(page.locator('app-project-vote')).toBeVisible();

    // Dismissing (Escape) animates it closed, staying on the detail page (no route change).
    await page.keyboard.press('Escape');
    await expect(page.locator('app-project-vote')).toHaveCount(0);
    await expect(page).toHaveURL(/\/polls\/[^/]+\/[^/]+/);
  });
});
