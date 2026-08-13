import { test, expect } from '@playwright/test';

test.describe('Startseite (home / landing page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home');
  });

  test('renders with cream --bg-app background', async ({ page }) => {
    const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // --bg-app resolves to --cream-200 = #f4f1ec = rgb(244, 241, 236)
    expect(bgColor).toBe('rgb(244, 241, 236)');
  });

  test('Votean wordmark is visible — ds-icon logo + Bricolage text', async ({ page }) => {
    const wordmarkText = page.locator('.wordmark-text');
    await expect(wordmarkText).toBeVisible();
    await expect(wordmarkText).toHaveText('Votean');

    const logoSvg = page.locator('ds-icon svg');
    await expect(logoSvg).toBeVisible();
  });

  test('hero h1 heading uses display font', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const fontFamily = await h1.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily.toLowerCase()).toContain('bricolage grotesque');
  });

  test('primary button "Jetzt starten" navigates to /auth/login', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Jetzt starten' });
    await expect(btn).toBeVisible();
    await btn.click();
    await page.waitForURL('**/auth/login');
  });

  test('no BackgroundAnimationComponent or animation artifacts', async ({ page }) => {
    const animEl = page.locator('app-background-animation');
    await expect(animEl).toHaveCount(0);
  });

  test('renders correctly at mobile viewport (390×844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/home');

    const content = page.locator('.home-content');
    await expect(content).toBeVisible();

    const box = await content.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(390);
  });

  test('renders correctly at desktop viewport (1280×820)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto('/home');

    const content = page.locator('.home-content');
    await expect(content).toBeVisible();

    const ctaGroup = page.locator('.cta-group');
    const flexDir = await ctaGroup.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(flexDir).toBe('row');
  });
});
