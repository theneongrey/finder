import { test, expect } from '@playwright/test';
import { USER1, login, logout } from './helpers';

test.describe('Public shared link page (/p/:projectId)', () => {
  // A nonexistent ID is fine for unauthenticated tests — the invite card renders
  // before any API call to fetch the project.
  const FAKE_ID = 'nonexistent-test-poll';

  // ── Unauthenticated ──────────────────────────────────────────────────────

  test.describe('Unauthenticated user', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/p/${FAKE_ID}`);
      await page.waitForLoadState('networkidle');
    });

    test('shows invite card heading', async ({ page }) => {
      await expect(page.locator('[data-testid="public-poll-heading"]')).toBeVisible();
    });

    test('"Anmelden und abstimmen" button is visible', async ({ page }) => {
      const btn = page.locator('[data-testid="public-poll-login-btn"] button');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText(/Anmelden und abstimmen|Sign in and vote/i);
    });

    test('"Abbrechen" ghost button is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="public-poll-cancel-btn"] button')).toBeVisible();
    });

    test('email input is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="public-poll-email"] input')).toBeVisible();
    });

    test('"Anmelden und abstimmen" navigates to /auth/request-email without email param', async ({ page }) => {
      await page.locator('[data-testid="public-poll-login-btn"] button').click();
      await page.waitForURL('**/auth/request-email');
      expect(page.url()).not.toContain('email=');
    });

    test('"Code anfordern" navigates to /auth/request-email with email query param', async ({ page }) => {
      await page.locator('[data-testid="public-poll-email"] input').fill('test@example.com');
      const btn = page.locator('[data-testid="public-poll-login-btn"] button');
      await expect(btn).toContainText(/Code anfordern|Request code/i);
      await btn.click();
      await page.waitForURL('**/auth/request-email**email**');
      const url = new URL(page.url());
      expect(url.pathname).toBe('/auth/request-email');
      expect(url.searchParams.get('email')).toBe('test@example.com');
    });

    test('shows invite card at mobile viewport (390×844)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/p/${FAKE_ID}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="public-poll-heading"]')).toBeVisible();
      await expect(page.locator('[data-testid="public-poll-login-btn"] button')).toBeVisible();
    });

    test('shows invite card at desktop viewport (1280×820)', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 820 });
      await page.goto(`/p/${FAKE_ID}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="public-poll-heading"]')).toBeVisible();
      await expect(page.locator('[data-testid="public-poll-login-btn"] button')).toBeVisible();
    });
  });

  // ── Authenticated ────────────────────────────────────────────────────────

  test.describe('Authenticated user', () => {
    let projectId: string;

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      await login(page, USER1);

      // Ensure there is at least one poll to get a real project ID from
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

      // Navigate to the vote page to extract projectId from the URL
      await page.locator('[data-testid="vote-cta-btn"]').filter({ hasText: /vote now|jetzt abstimmen/i }).first().click();
      await page.waitForURL('**/polls/**/vote/**');
      const parts = new URL(page.url()).pathname.split('/');
      // URL shape: /polls/<projectId>/vote/<pollId>/<optionId>
      projectId = parts[2];

      await logout(page);
      await page.close();
    }, 120000);

    test('authenticated user is redirected away from /p/:projectId', async ({ page }) => {
      await login(page, USER1);
      await page.goto(`/p/${projectId}`);
      // After auth check, should navigate to /polls/... or /polls
      await page.waitForURL(/\/(polls|auth)/);
      expect(page.url()).not.toContain(`/p/${projectId}`);
      await logout(page);
    });
  });
});
