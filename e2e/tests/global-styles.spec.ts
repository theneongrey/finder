import { test, expect } from '@playwright/test';
import { login, logout, USER1 } from './helpers';

test.describe('Global styles — token migration smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('html/body background resolves to the cream --bg-app token (#f4f1ec)', async ({ page }) => {
    await page.goto('/polls');

    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // #f4f1ec = rgb(244, 241, 236)
    expect(bgColor).toBe('rgb(244, 241, 236)');
  });

  test('body font-family includes Hanken Grotesk Variable', async ({ page }) => {
    await page.goto('/polls');

    const fontFamily = await page.evaluate(() => {
      return getComputedStyle(document.body).fontFamily;
    });

    expect(fontFamily.toLowerCase()).toContain('hanken grotesk');
  });

  test('--bg-app CSS custom property is defined on :root', async ({ page }) => {
    await page.goto('/polls');

    const bgApp = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim();
    });

    expect(bgApp).toBeTruthy();
  });

  test('--accent CSS custom property is defined on :root', async ({ page }) => {
    await page.goto('/polls');

    const accent = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    });

    expect(accent).toBeTruthy();
  });

  test('Font Awesome is no longer loaded — fa- icon glyphs absent', async ({ page }) => {
    await page.goto('/polls');

    const faLoaded = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      return sheets.some((s) => {
        try {
          return s.href?.includes('fontawesome') ?? false;
        } catch {
          return false;
        }
      });
    });

    expect(faLoaded).toBe(false);
  });

  test('no console errors about missing CSS custom properties', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/polls');
    await page.waitForLoadState('networkidle');

    const cssPropertyErrors = errors.filter((e) =>
      e.toLowerCase().includes('custom property') || e.toLowerCase().includes('var(--')
    );
    expect(cssPropertyErrors).toHaveLength(0);
  });
});
