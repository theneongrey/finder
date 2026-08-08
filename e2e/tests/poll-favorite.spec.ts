import { test, expect } from "@playwright/test";
import { USER1, login, logout } from "./helpers";

test.describe("Poll favorite toggle", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);

    // Ensure USER1 has at least one standalone poll
    const favoriteBtn = page.locator('[data-testid="favorite-btn"]').first();
    if ((await favoriteBtn.count()) === 0) {
      await page.locator('[data-testid="add-poll-card"]').click();
      await page.waitForURL("**/polls/add");
      await page.getByText("Yes/No").click();
      await page
        .getByRole("textbox", { name: "Your question" })
        .fill("Favorite Test Poll");
      await page
        .getByPlaceholder("e.g. Italian restaurant")
        .first()
        .fill("Option A");
      await page.getByRole("button", { name: "Create poll" }).click();
      await page.waitForURL("**/polls");
    }

    // Ensure the poll is NOT favorited before each run
    const activeHeart = page.locator('[data-testid="favorite-active"]').first();
    if ((await activeHeart.count()) > 0) {
      await favoriteBtn.first().click();
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

    // Toggle off to clean up
    await page.locator('[data-testid="favorite-btn"]').first().click();
  });

  test("clicking heart again removes favorite (toggle off)", async ({
    page,
  }) => {
    await page.goto("/polls");
    const favoriteBtn = page.locator('[data-testid="favorite-btn"]').first();

    // Toggle on then off
    await favoriteBtn.click();
    await expect(
      page.locator('[data-testid="favorite-active"]').first(),
    ).toBeVisible();
    await favoriteBtn.click();
    await expect(page.locator('[data-testid="favorite-active"]')).toHaveCount(
      0,
    );
  });
});
