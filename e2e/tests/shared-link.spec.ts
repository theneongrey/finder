import { test, expect } from '@playwright/test';
import { USER1, login, logout } from './helpers';

test.describe('Public shared link page (/p/:projectId)', () => {
  const FAKE_ID = 'nonexistent-test-poll';

  // ── Desktop unauthenticated (default viewport 1280px) ──────────────────

  test.describe('Unauthenticated user – desktop', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 820 });
      await page.goto(`/p/${FAKE_ID}`);
      await page.waitForLoadState('networkidle');
    });

    test('shows dark sign-in card heading', async ({ page }) => {
      await expect(page.locator('[data-testid="public-poll-heading"]')).toBeVisible();
    });

    test('email input is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="public-poll-email"] input')).toBeVisible();
    });

    test('login button is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="public-poll-login-btn"] button')).toBeVisible();
    });

    test('"Sign in and vote" navigates to /auth/request-email without email param', async ({ page }) => {
      await page.locator('[data-testid="public-poll-login-btn"] button').click();
      await page.waitForURL('**/auth/request-email');
      expect(page.url()).not.toContain('email=');
    });

    test('"Request code" navigates to /auth/request-email with email query param', async ({ page }) => {
      await page.locator('[data-testid="public-poll-email"] input').fill('test@example.com');
      const btn = page.locator('[data-testid="public-poll-login-btn"] button');
      await expect(btn).toContainText(/Code anfordern|Request code/i);
      await btn.click();
      await page.waitForURL('**/auth/request-email**email**');
      const url = new URL(page.url());
      expect(url.pathname).toBe('/auth/request-email');
      expect(url.searchParams.get('email')).toBe('test@example.com');
    });
  });

  // ── Mobile unauthenticated (390px) ────────────────────────────────────

  test.describe('Unauthenticated user – mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/p/${FAKE_ID}`);
      await page.waitForLoadState('networkidle');
    });

    test('shows invite banner', async ({ page }) => {
      await expect(page.locator('[data-testid="public-poll-mobile-heading"]')).toBeVisible();
    });

    test('shows nudge bar with sign-in button', async ({ page }) => {
      await expect(page.locator('[data-testid="public-poll-nudge-btn"] button')).toBeVisible();
    });

    test('nudge button navigates to /auth/request-email', async ({ page }) => {
      await page.locator('[data-testid="public-poll-nudge-btn"] button').click();
      await page.waitForURL('**/auth/request-email');
    });
  });

  // ── Authenticated ────────────────────────────────────────────────────

  test.describe('Authenticated user', () => {
    let projectId: string;

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      await login(page, USER1);

      const voteBtn = page.locator('[data-testid="vote-cta-btn"]').filter({ hasText: /vote now|jetzt abstimmen/i }).first();

      if (await voteBtn.count() === 0) {
        await page.locator('[data-testid="fab-add-poll"]').click();
        await page.waitForURL('**/polls/add');
        await page.getByText(/Yes\/No|Ja\/Nein/i).click();
        await page.getByRole('textbox', { name: /question|frage/i }).fill('SharedLink E2E Test Poll');
        await page.getByPlaceholder(/Option|option/i).first().fill('Option A');
        await page.getByRole('button', { name: /Create poll|Umfrage erstellen/i }).click();
        await page.waitForURL('**/polls');
      }

      await page.locator('[data-testid="vote-cta-btn"]').filter({ hasText: /vote now|jetzt abstimmen/i }).first().click();
      await page.waitForURL('**/polls/**/vote/**');
      const parts = new URL(page.url()).pathname.split('/');
      projectId = parts[2];

      await logout(page);
      await page.close();
    }, 120000);

    test('authenticated user is redirected away from /p/:projectId', async ({ page }) => {
      await login(page, USER1);
      await page.goto(`/p/${projectId}`);
      await page.waitForURL(/\/(polls|auth)/);
      expect(page.url()).not.toContain(`/p/${projectId}`);
      await logout(page);
    });
  });
});
