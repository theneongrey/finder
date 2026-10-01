import { test, expect, Page } from '@playwright/test';
import { USER1, login, logout, createStandalonePoll, addTextOption } from './helpers';

/**
 * Redesigned option cards on the poll detail page: inline Yes/No and star voting with the
 * user's choice highlighted, reset vote via the ⋮ menu, the creator rendered once with a crown
 * ahead of the voter stack, and link chips trimmed to their domain.
 */
test.describe('Poll detail: option card', () => {
  let yesNoUrl: string;
  let ratingUrl: string;
  const optionText = 'Card option E2E';

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90000);
    const page = await browser.newPage();
    await login(page, USER1);

    const yesNo = await createStandalonePoll(page, `Option Card E2E ${Date.now()}`);
    await addTextOption(page, optionText);
    yesNoUrl = `/polls/${yesNo.projectId}/${yesNo.pollId}`;

    // Rating poll: same wizard, rating type picked before creating.
    await page.goto('/polls/add');
    await page.locator('[data-testid="question-input"] input').fill(`Option Card Rating E2E ${Date.now()}`);
    await page.locator('[data-testid="type-btn-rating"]').click();
    await page.locator('[data-testid="wizard-cta"] button').click();
    await page.waitForURL(/\/polls\/[^/]+\/[^/]+/);
    const parts = new URL(page.url()).pathname.split('/');
    ratingUrl = `/polls/${parts[2]}/${parts[3]}`;
    await addTextOption(page, optionText);

    await logout(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  const card = (page: Page) =>
    page.locator('[data-testid="results-option-list"] [data-option-id]').filter({ hasText: optionText }).first();

  test('Yes/No vote inline highlights the choice and can be reset from the menu', async ({ page }) => {
    await page.goto(yesNoUrl);
    const yes = card(page).locator('[data-testid="option-vote-yes"] button');
    const no = card(page).locator('[data-testid="option-vote-no"] button');

    await yes.click();
    await expect(yes).toHaveAttribute('aria-pressed', 'true');
    await expect(no).not.toHaveAttribute('aria-pressed', 'true');

    await no.click();
    await expect(no).toHaveAttribute('aria-pressed', 'true');
    await expect(yes).not.toHaveAttribute('aria-pressed', 'true');

    await card(page).locator('[data-testid="option-menu"] button').click();
    await page.locator('[data-testid="menu-item"]').filter({ hasText: /reset|zurücksetzen|restablecer/i }).click();
    await expect(no).not.toHaveAttribute('aria-pressed', 'true');
    await expect(yes).not.toHaveAttribute('aria-pressed', 'true');
  });

  test('creator is shown once, crowned, ahead of the voter stack', async ({ page }) => {
    await page.goto(yesNoUrl);
    await card(page).locator('[data-testid="option-vote-yes"] button').click();

    await expect(card(page).locator('[data-testid="option-creator-crown"]')).toBeVisible();
    // The creator (the only voter) is not repeated in the stack.
    await expect(card(page).locator('app-option-voters app-avatar-stack')).toHaveCount(0);
  });

  test('rating poll fills the given number of stars', async ({ page }) => {
    await page.goto(ratingUrl);
    await card(page).locator('[data-testid="option-star-3"]').click();
    await expect(card(page).locator('[data-testid="option-star-3"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(card(page).locator('[data-testid="option-star-3"] svg')).toHaveAttribute('fill', 'var(--star)');
    await expect(card(page).locator('[data-testid="option-star-4"] svg')).toHaveAttribute('fill', 'none');
  });

  test('link chip shows only the domain', async ({ page }) => {
    await page.route('**/api/preview?*', (route) =>
      route.fulfill({ json: { title: 'Link Card E2E', description: '', imageUrl: '', siteName: 'Example' } }),
    );
    await page.goto(yesNoUrl);
    await page.locator('[data-testid="add-option-btn"] button:visible').first().click();
    const panel = page.locator('[data-testid="add-option-panel"]');
    await panel.locator('input').first().fill(`https://www.example.com/some/deep/path?e2e=${Date.now()}`);
    await panel.locator('[data-testid="add-option-submit"] button').click();

    const linkCard = page
      .locator('[data-testid="results-option-list"] [data-option-id]')
      .filter({ hasText: 'Link Card E2E' })
      .first();
    await expect(linkCard.locator('[data-testid="option-link"]')).toHaveText('example.com');
  });
});
