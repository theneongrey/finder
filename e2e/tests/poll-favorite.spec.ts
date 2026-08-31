import { test, expect } from "@playwright/test";
import { USER1, login, logout } from "./helpers";

test.describe("Poll favorite toggle", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);

    // Ensure USER1 has at least one standalone poll (check by vote CTA presence)
    const anyPoll = page.locator('[data-testid="vote-cta-btn"]').first();
    if ((await anyPoll.count()) === 0) {
      await page.goto('/polls/add');
      await page.waitForURL('**/polls/add');
      await page.getByText('Yes/No').click(); // auto-advances to step 2
      await page.getByRole('textbox', { name: 'Your question' }).fill('Favorite Test Poll');
      await page.locator('app-option-card ds-input input').first().fill('Ja');
      await page.locator('[data-testid="wizard-cta"] button').click();
      await page.waitForURL('**/polls');
    }

    // Ensure the poll is NOT favorited before each run
    const activeHeart = page.locator('[data-testid="favorite-active"]').first();
    if ((await activeHeart.count()) > 0) {
      await activeHeart.click();
      await page.waitForTimeout(500);
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

  test("clicking heart toggles to filled (favorite on)", async ({ page }) => {
    await page.goto("/polls");
    const favoriteBtn = page.locator('[data-testid="favorite-btn"]').first();
    await favoriteBtn.click();
    await expect(
      page.locator('[data-testid="favorite-active"]').first(),
    ).toBeVisible();
  });

  test("favorite state persists after page reload", async ({ page }) => {
    await page.goto("/polls");
    const favoriteBtn = page.locator('[data-testid="favorite-btn"]').first();

    // Toggle on
    await favoriteBtn.click();
    await expect(
      page.locator('[data-testid="favorite-active"]').first(),
    ).toBeVisible();

    // Reload and check
    await page.reload();
    await expect(
      page.locator('[data-testid="favorite-active"]').first(),
    ).toBeVisible();

    // Toggle off to clean up — testid is now 'favorite-active', not 'favorite-btn'
    await page.locator('[data-testid="favorite-active"]').first().click();
  });

  test("clicking heart again removes favorite (toggle off)", async ({
    page,
  }) => {
    await page.goto("/polls");
    await page.waitForLoadState('networkidle');

    // Find the index of the first unfavorited card so we can reference it by position
    // after the click (filter-based locators re-evaluate, but nth() is stable)
    const cards = page.locator('app-poll-item');
    const cardCount = await cards.count();
    let targetIndex = -1;
    for (let i = 0; i < cardCount; i++) {
      if (await cards.nth(i).locator('[data-testid="favorite-btn"]').count() > 0) {
        targetIndex = i;
        break;
      }
    }
    expect(targetIndex).toBeGreaterThanOrEqual(0);
    const card = cards.nth(targetIndex);

    // Toggle on
    await card.locator('[data-testid="favorite-btn"]').click();
    await expect(card.locator('[data-testid="favorite-active"]')).toBeVisible();

    // Toggle off — testid on this card is now 'favorite-active'
    await card.locator('[data-testid="favorite-active"]').click();
    await expect(card.locator('[data-testid="favorite-btn"]')).toBeVisible();
  });
});
