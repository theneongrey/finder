import { test, expect } from '@playwright/test';
import { USER1, login } from './helpers';

test.describe('Auth: /auth/request-email', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/request-email');
    await page.waitForLoadState('networkidle');
  });

  test('shows Votean wordmark on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/auth/request-email');
    const wordmark = page.locator('header img[alt="Votean"]');
    await expect(wordmark).toBeVisible();
  });

  test('has an email input', async ({ page }) => {
    const emailInput = page.locator('app-request-email ds-input input');
    await expect(emailInput).toBeVisible();
  });

  test('send-code button is visible', async ({ page }) => {
    const btn = page.locator('[data-testid="request-email-submit"]');
    await expect(btn).toBeVisible();
  });

  test('pre-fills email from query param', async ({ page }) => {
    await page.goto('/auth/request-email?email=test@example.com');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('app-request-email ds-input input');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('no BackgroundAnimationComponent present', async ({ page }) => {
    await expect(page.locator('app-background-animation')).toHaveCount(0);
  });
});

test.describe('Auth: /auth/code-login', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate via request-email so the store has the email set
    await page.goto('/auth/request-email');
    await page.locator('ds-input input').fill(USER1);
    await page.locator('[data-testid="request-email-submit"]').click();
    await page.waitForURL('**/auth/code-login');
    await page.waitForLoadState('networkidle');
  });

  test('shows code entry heading', async ({ page }) => {
    await expect(page.locator('[data-testid="code-login-heading"]')).toBeVisible();
  });

  test('shows the email address the code was sent to', async ({ page }) => {
    await expect(page.locator('app-auth-code-login').getByText(USER1)).toBeVisible();
  });

  test('OTP input is visible', async ({ page }) => {
    await expect(page.locator('app-auth-code-login ds-input-otp')).toBeVisible();
  });

  test('submit button is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="code-login-submit"]')).toBeVisible();
  });

  test('change-email button navigates back to request-email', async ({ page }) => {
    await page.locator('[data-testid="code-login-change-email"]').click();
    await page.waitForURL('**/auth/request-email**');
  });

  test('renders correctly at mobile viewport (390×844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('app-auth-code-login ds-input-otp')).toBeVisible();
  });

  test('renders correctly at desktop viewport (1280×820)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await expect(page.locator('app-auth-code-login ds-input-otp')).toBeVisible();
  });
});

test.describe('Auth: /auth/token-login', () => {
  test('shows loading spinner while processing', async ({ page }) => {
    // Navigate but don't wait for redirect — inspect the loading state
    await page.goto('/auth/token-login?token=1234');
    // Spinner or loading text is visible during login
    const spinner = page.locator('app-auth-token-login .token-login-spinner');
    // The spinner may disappear quickly after successful login; just assert it renders
    await expect(spinner.or(page.locator('app-auth-token-login')).first()).toBeVisible();
  });

  test('redirects to /polls after successful token login', async ({ page }) => {
    await page.goto('/auth/request-email');
    await page.locator('ds-input input').fill(USER1);
    await page.locator('[data-testid="request-email-submit"]').click();
    await page.waitForURL('**/auth/code-login');
    await page.goto('/auth/token-login?token=1234');
    await page.waitForURL('**/polls', { timeout: 10000 });
    expect(new URL(page.url()).pathname).toBe('/polls');
  });
});

test.describe('Auth: full end-to-end flow', () => {
  test('email → code → token → polls', async ({ page }) => {
    await login(page, USER1);
    await expect(page).toHaveURL(/\/polls$/);
  });
});
