import { test, expect } from '@playwright/test';

test.describe('Startseite (home / landing page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/de');
  });

  test('renders with cream --bg-app background', async ({ page }) => {
    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // --bg-app resolves to --cream-200 = #f4f1ec = rgb(244, 241, 236)
    expect(bgColor).toBe('rgb(244, 241, 236)');
  });

  test('Votean logo is visible in nav', async ({ page }) => {
    const logo = page.locator('.nav-logo');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('Votean');
  });

  test('hero h1 heading uses display font', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const fontFamily = await h1.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily.toLowerCase()).toContain('bricolage grotesque');
  });

  test('email CTA navigates to /auth/request-email', async ({ page }) => {
    await page.fill('#home-email', 'test@example.com');
    await page.getByRole('button', { name: /Loslegen/i }).click();
    await page.waitForURL('**/auth/request-email**');
  });

  test('no BackgroundAnimationComponent or animation artifacts', async ({ page }) => {
    const animEl = page.locator('app-background-animation');
    await expect(animEl).toHaveCount(0);
  });

  test('renders correctly at mobile viewport (390×844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/de');

    const content = page.locator('.page-scroll');
    await expect(content).toBeVisible();

    const box = await content.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(390);
  });

  test('renders correctly at desktop viewport (1280×820)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto('/de');

    const content = page.locator('.page-scroll');
    await expect(content).toBeVisible();

    const emailRow = page.locator('.email-row');
    const flexDir = await emailRow.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(flexDir).toBe('row');
  });
});
