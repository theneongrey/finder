import { test, expect } from '@playwright/test';
import { USER1, login } from './helpers';

test.describe('Root redirect', () => {
  // Playwright isolates each test in its own browser context, so the
  // authenticated session created here does not leak into the logged-out test.
  test('logged-in user visiting / is redirected to /polls', async ({ page }) => {
    await login(page, USER1);

    await page.goto('/');
    await page.waitForURL('**/polls');
    expect(new URL(page.url()).pathname).toBe('/polls');
  });

  test('logged-out user visiting / ends up on a language home page', async ({ page }) => {
    await page.goto('/');
    // Language redirect resolves to one of the supported language home pages.
    await page.waitForURL(/\/(de|en|es)$/);

    const pathname = new URL(page.url()).pathname;
    expect(pathname).toMatch(/^\/(de|en|es)$/);
    expect(pathname).not.toBe('/polls');
  });
});
