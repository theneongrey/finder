import { test, expect } from '@playwright/test';
import { login, logout, USER1 } from './helpers';

test.describe('App shell — title bar, layout, responsive (issue #239)', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test.describe('Authenticated routes', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, USER1);
    });

    test('title bar renders on authenticated poll overview page', async ({ page }) => {
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('app-title-bar')).toBeVisible();
      await expect(page.locator('app-title-bar header')).toBeVisible();
    });

    test('user avatar is visible in title bar when authenticated', async ({ page }) => {
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('app-title-bar app-user-avatar')).toBeVisible();
    });

    test('title bar has position:sticky CSS', async ({ page }) => {
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');

      const position = await page.locator('app-title-bar').evaluate((el) => {
        return getComputedStyle(el).position;
      });
      expect(position).toBe('sticky');
    });

    test('title bar gets scrolled class on window scroll', async ({ page }) => {
      // Auth shell uses window scroll, so go to an auth-served route that triggers scroll
      // Use the settings page which has window-level scroll
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const initialScrolled = await page.locator('app-title-bar header').evaluate((el) =>
        el.classList.contains('title-bar--scrolled')
      );
      expect(initialScrolled).toBe(false);

      // Scroll down on window
      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(200);

      const afterScrolled = await page.locator('app-title-bar header').evaluate((el) =>
        el.classList.contains('title-bar--scrolled')
      );
      expect(afterScrolled).toBe(true);
    });

    test('title bar backdrop-filter applies when scrolled', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(200);

      const backdropFilter = await page.locator('app-title-bar header').evaluate((el) =>
        getComputedStyle(el).backdropFilter
      );
      expect(backdropFilter).toContain('blur(8px)');
    });

    test('app background is --bg-app cream color on polls route', async ({ page }) => {
      await page.goto('/polls');

      const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      // --bg-app = --cream-200 = #f4f1ec = rgb(244, 241, 236)
      expect(bgColor).toBe('rgb(244, 241, 236)');
    });

    test('back button navigates back when backRoute is set', async ({ page }) => {
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');

      // Navigate into a poll detail — first poll in the list
      const firstPoll = page.locator('app-standalone-poll-card').first();
      if (await firstPoll.isVisible()) {
        await firstPoll.click();
        await page.waitForLoadState('networkidle');

        const backBtn = page.locator('app-title-bar ds-button').first();
        await expect(backBtn).toBeVisible();
        await backBtn.click();
        await expect(page).toHaveURL(/\/polls$/);
      }
    });
  });

  test.describe('Auth screens — no background animation', () => {
    test('BackgroundAnimationComponent is absent on request-email screen', async ({ page }) => {
      await page.goto('/auth/request-email');
      await page.waitForLoadState('networkidle');

      // organic-shape divs are the animated blob children of BackgroundAnimationComponent
      const animBlobs = page.locator('.organic-shape');
      await expect(animBlobs).toHaveCount(0);
    });

    test('title bar is visible on auth screen', async ({ page }) => {
      await page.goto('/auth/request-email');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('app-title-bar')).toBeVisible();
    });

    test('user avatar is NOT shown on unauthenticated auth screen', async ({ page }) => {
      await page.goto('/auth/request-email');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('app-title-bar app-user-avatar')).toHaveCount(0);
    });

    test('auth screen background is --bg-app cream', async ({ page }) => {
      await page.goto('/auth/request-email');

      const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bgColor).toBe('rgb(244, 241, 236)');
    });
  });

  test.describe('Responsive breakpoint — 680px', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, USER1);
    });

    test('hide-on-small hides element below 680px and shows it at 680px+', async ({ page }) => {
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');

      // Below 680px — element with fHideOnSmall should be hidden
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(100);

      const hiddenOnSmall = page.locator('[fHideOnSmall]').first();
      if (await hiddenOnSmall.count() > 0) {
        await expect(hiddenOnSmall).toBeHidden();
      }

      // At 680px — should be visible
      await page.setViewportSize({ width: 680, height: 844 });
      await page.waitForTimeout(100);

      if (await hiddenOnSmall.count() > 0) {
        await expect(hiddenOnSmall).toBeVisible();
      }
    });

    test('show-on-small shows element below 680px and hides it at 680px+', async ({ page }) => {
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');

      const shownOnSmall = page.locator('[fShowOnSmall]').first();
      if (await shownOnSmall.count() > 0) {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(100);
        await expect(shownOnSmall).toBeVisible();

        await page.setViewportSize({ width: 680, height: 844 });
        await page.waitForTimeout(100);
        await expect(shownOnSmall).toBeHidden();
      }
    });

    test('mobile viewport (390px): polls content renders without console errors', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto('/polls');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('app-title-bar')).toBeVisible();
      expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
    });

    test('desktop viewport (1280px): polls content renders without console errors', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 820 });
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto('/polls');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('app-title-bar')).toBeVisible();
      expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
    });
  });
});
