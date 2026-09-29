import { test, expect, Page } from '@playwright/test';
import { USER1, login, logout, createStandalonePoll, addTextOption } from './helpers';

/**
 * Adding options from the poll detail page (#500, #501, #502): the add panel must add a pasted
 * link once (with its preview), bring the new card into view, and the pinned header must sit
 * flush under the toolbar.
 */
test.describe('Poll detail: add option', () => {
  let detailUrl: string;

  // A dedicated poll with enough options to make the mobile page scroll.
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90000);
    const page = await browser.newPage();
    await login(page, USER1);
    const { projectId, pollId } = await createStandalonePoll(page, `Add Option E2E ${Date.now()}`);
    for (let i = 1; i <= 6; i++) {
      await addTextOption(page, `Option ${i}`);
    }
    detailUrl = `/polls/${projectId}/${pollId}`;
    await logout(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  const cards = (page: Page) => page.locator('[data-testid="results-option-list"] [data-option-id]');
  const openPanel = (page: Page) =>
    page.locator('[data-testid="add-option-btn"] button:visible').first().click();

  test('clicking Add while a link preview loads adds the option once, with the preview', async ({ page }) => {
    await page.route('**/api/preview?*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.fulfill({
        json: { title: 'Preview Title E2E', description: 'From the preview', imageUrl: '', siteName: 'Example' },
      });
    });
    await page.goto(detailUrl);
    await expect(cards(page).first()).toBeVisible();
    const before = await cards(page).count();

    await openPanel(page);
    const panel = page.locator('[data-testid="add-option-panel"]');
    const url = `https://example.com/e2e-${Date.now()}`;
    await panel.locator('input').first().fill(url);
    // Clicking Add blurs the title, which starts the (slow) preview fetch.
    await panel.locator('[data-testid="add-option-submit"] button').click();

    await expect(cards(page)).toHaveCount(before + 1);
    await expect(cards(page).filter({ hasText: 'Preview Title E2E' })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: url })).toHaveCount(0);
    // The draft is not refilled by a late preview.
    await expect(panel.locator('input').first()).toHaveValue('');
  });

  test('a newly added option is scrolled into view', async ({ page }) => {
    await page.goto(detailUrl);
    const text = `Scroll target ${Date.now()}`;
    await addTextOption(page, text);
    await expect(cards(page).filter({ hasText: text })).toBeInViewport();
  });

  test('toolbar Add scrolls back up to the add panel', async ({ page }) => {
    await page.goto(detailUrl);
    await expect(cards(page).first()).toBeVisible();
    await page.mouse.wheel(0, 1500);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

    await openPanel(page);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator('[data-testid="add-option-panel"]')).toBeInViewport();
  });

  test('pinned compact header sits flush under the toolbar', async ({ page }) => {
    await page.goto(detailUrl);
    await expect(cards(page).first()).toBeVisible();
    await page.mouse.wheel(0, 1500);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

    const gap = () =>
      page.evaluate(() => {
        const toolbar = document.querySelector('[data-testid="results-toolbar"]')!.getBoundingClientRect();
        const bar = document.querySelector('app-poll-header .sticky')!.getBoundingClientRect();
        return bar.top - toolbar.bottom;
      });
    // Never below the toolbar (a seam); tucked at most 1px under it.
    await expect.poll(gap).toBeLessThanOrEqual(0);
    expect(await gap()).toBeGreaterThanOrEqual(-1);
  });
});
