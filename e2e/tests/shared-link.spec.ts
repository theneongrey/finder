import { test, expect } from '@playwright/test';
import { USER1, login, logout } from './helpers';

test.describe('Public shared link page (/p/:projectId)', () => {
  const FAKE_ID = 'nonexistent-test-poll';
  let publicProjectId: string;
  let privateProjectId: string;

  // Creates one public and one private project via API so tests can cover
  // both the sign-in UI (public + unauthenticated) and redirect (inaccessible) paths.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);

    const createPublic = await page.request.post('/api/project/standalone-poll', {
      data: { name: 'SharedLink E2E Public', description: 'e2e', optionType: 0 },
    });
    const pub = await createPublic.json();
    publicProjectId = pub.projectId;
    // VisibilityType.VisibleForEverbody = 1
    await page.request.put(`/api/permission/type/${publicProjectId}`, {
      data: { type: 1 },
    });

    const createPrivate = await page.request.post('/api/project/standalone-poll', {
      data: { name: 'SharedLink E2E Private', description: 'e2e', optionType: 0 },
    });
    const priv = await createPrivate.json();
    privateProjectId = priv.projectId;

    await logout(page);
    await page.close();
  }, 120000);

  // ── Redirect cases ─────────────────────────────────────────────────────

  test.describe('Redirect to root on inaccessible project', () => {
    test('nonexistent project ID (404) redirects away from /p/', async ({ page }) => {
      await page.goto(`/p/${FAKE_ID}`);
      await page.waitForURL((url) => !url.href.includes('/p/'));
      expect(page.url()).not.toContain('/p/');
    });

    test('private project (403) redirects away from /p/ for unauthenticated user', async ({
      page,
    }) => {
      await page.goto(`/p/${privateProjectId}`);
      await page.waitForURL((url) => !url.href.includes('/p/'));
      expect(page.url()).not.toContain('/p/');
    });
  });

  // ── Desktop unauthenticated (default viewport 1280px) ──────────────────

  test.describe('Unauthenticated user – desktop', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 820 });
      await page.goto(`/p/${publicProjectId}`);
      await page.waitForLoadState('networkidle');
    });

    test('shows dark sign-in card heading', async ({ page }) => {
      await expect(
        page.locator('[data-testid="public-poll-heading"]'),
      ).toBeVisible();
    });

    test('email input is visible', async ({ page }) => {
      await expect(
        page.locator('[data-testid="public-poll-email"] input'),
      ).toBeVisible();
    });

    test('login button is visible', async ({ page }) => {
      await expect(
        page.locator('[data-testid="public-poll-login-btn"] button'),
      ).toBeVisible();
    });

    test('"Sign in and vote" navigates to /auth/request-email without email param', async ({
      page,
    }) => {
      await page.locator('[data-testid="public-poll-login-btn"] button').click();
      await page.waitForURL('**/auth/request-email');
      expect(page.url()).not.toContain('email=');
    });

    test('"Request code" navigates to /auth/request-email with email query param', async ({
      page,
    }) => {
      await page
        .locator('[data-testid="public-poll-email"] input')
        .fill('test@example.com');
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
      await page.goto(`/p/${publicProjectId}`);
      await page.waitForLoadState('networkidle');
    });

    test('shows invite banner', async ({ page }) => {
      await expect(
        page.locator('[data-testid="public-poll-mobile-heading"]'),
      ).toBeVisible();
    });

    test('shows nudge bar with sign-in button', async ({ page }) => {
      await expect(
        page.locator('[data-testid="public-poll-nudge-btn"] button'),
      ).toBeVisible();
    });

    test('nudge button navigates to /auth/request-email', async ({ page }) => {
      await page
        .locator('[data-testid="public-poll-nudge-btn"] button')
        .click();
      await page.waitForURL('**/auth/request-email');
    });
  });

  // ── Authenticated ────────────────────────────────────────────────────

  test.describe('Authenticated user', () => {
    test('authenticated user is redirected away from /p/:projectId', async ({
      page,
    }) => {
      await login(page, USER1);
      await page.goto(`/p/${publicProjectId}`);
      await page.waitForURL(/\/(polls|auth)/);
      expect(page.url()).not.toContain(`/p/${publicProjectId}`);
      await logout(page);
    });
  });
});
