import { test, expect } from "@playwright/test";
import { USER1, login, logout, createStandalonePoll } from "./helpers";

test.describe("Poll favorite toggle", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);
    await page.waitForLoadState('networkidle');

    // Ensure USER1 has at least one standalone poll (check by open CTA presence)
    const anyPoll = page.locator('[data-testid="open-poll-btn"]').first();
    if ((await anyPoll.count()) === 0) {
      await createStandalonePoll(page, 'Favorite Test Poll');
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');
    }

    // Ensure no poll is favorited before each run
    // data-favorited attribute is present (even if empty string) when favorited
    const activeHeart = page.locator('[data-testid="favorite-btn"][data-favorited]').first();
    if ((await activeHeart.count()) > 0) {
      await activeHeart.locator('button').click(); // ds-button is display:contents — click inner button
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
    // ds-button is display:contents — must click the inner <button>
    const favoriteBtn = page.locator('[data-testid="favorite-btn"]:not([data-favorited])').first();
    await favoriteBtn.locator('button').click();
    // toBeVisible() fails on display:contents hosts — check attribute presence instead
    await expect(
      page.locator('[data-testid="favorite-btn"][data-favorited]'),
    ).not.toHaveCount(0);
  });

  test("favorite state persists after page reload", async ({ page }) => {
    await page.goto("/polls");
    const favoriteBtn = page.locator('[data-testid="favorite-btn"]:not([data-favorited])').first();

    // Toggle on
    await favoriteBtn.locator('button').click();
    await expect(page.locator('[data-testid="favorite-btn"][data-favorited]')).not.toHaveCount(0);

    // Reload and check
    await page.reload();
    await expect(page.locator('[data-testid="favorite-btn"][data-favorited]')).not.toHaveCount(0);

    // Toggle off to clean up
    await page.locator('[data-testid="favorite-btn"][data-favorited]').first().locator('button').click();
  });

  test("clicking heart again removes favorite (toggle off)", async ({
    page,
  }) => {
    await page.goto("/polls");
    await page.waitForLoadState('networkidle');

    // Find the index of the first unfavorited card — nth() is stable after click
    const cards = page.locator('app-poll-item');
    const cardCount = await cards.count();
    let targetIndex = -1;
    for (let i = 0; i < cardCount; i++) {
      if (await cards.nth(i).locator('[data-testid="favorite-btn"]:not([data-favorited])').count() > 0) {
        targetIndex = i;
        break;
      }
    }
    expect(targetIndex).toBeGreaterThanOrEqual(0);
    const card = cards.nth(targetIndex);

    // Toggle on — click inner button (ds-button is display:contents)
    await card.locator('[data-testid="favorite-btn"] button').first().click();
    await expect(card.locator('[data-testid="favorite-btn"][data-favorited]')).not.toHaveCount(0);

    // Toggle off
    await card.locator('[data-testid="favorite-btn"][data-favorited] button').click();
    await expect(card.locator('[data-testid="favorite-btn"]:not([data-favorited])')).not.toHaveCount(0);
  });
});
