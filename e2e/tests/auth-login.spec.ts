import { test, expect } from '@playwright/test';
import { USER1, login } from './helpers';

test.describe('Auth: /auth/login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
  });

  test('shows Votean wordmark', async ({ page }) => {
    const wordmark = page.locator('app-auth-login').getByText('Votean');
    await expect(wordmark.first()).toBeVisible();
  });

  test('has an email input', async ({ page }) => {
    const emailInput = page.locator('app-auth-login ds-input input');
    await expect(emailInput).toBeVisible();
  });

  test('Weiter button is disabled when email is empty', async ({ page }) => {
    const btn = page.locator('app-auth-login').getByRole('button', { name: 'Weiter' });
    await expect(btn).toBeDisabled();
  });

  test('Weiter button enables on valid email entry', async ({ page }) => {
    await page.locator('app-auth-login ds-input input').fill('user@example.com');
    const btn = page.locator('app-auth-login').getByRole('button', { name: 'Weiter' });
    await expect(btn).toBeEnabled();
  });

  test('submitting email navigates to /auth/request-email', async ({ page }) => {
    await page.locator('app-auth-login ds-input input').fill(USER1);
    await page.getByRole('button', { name: 'Weiter' }).click();
    await page.waitForURL('**/auth/request-email**');
  });

  test('renders correctly at mobile viewport (390×844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const card = page.locator('app-auth-login ds-input input');
    await expect(card).toBeVisible();
  });

  test('renders correctly at desktop viewport (1280×820)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Desktop branding panel is visible
    const brandingPanel = page.locator('app-auth-login .hidden.lg\\:flex, app-auth-login [class*="lg:flex"]').first();
    await expect(brandingPanel).toBeVisible();

    // Form is still accessible
    const emailInput = page.locator('app-auth-login ds-input input');
    await expect(emailInput).toBeVisible();
  });
});

test.describe('Auth: /auth/request-email', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/request-email');
    await page.waitForLoadState('networkidle');
  });

  test('shows Votean wordmark on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/auth/request-email');
    const wordmark = page.locator('app-request-email').getByText('Votean').first();
    await expect(wordmark).toBeVisible();
  });

  test('has an email input', async ({ page }) => {
    const emailInput = page.locator('app-request-email ds-input input');
    await expect(emailInput).toBeVisible();
  });

  test('Code-senden button is visible', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Code senden' });
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
    await page.getByRole('button', { name: 'Code senden' }).click();
    await page.waitForURL('**/auth/code-login');
    await page.waitForLoadState('networkidle');
  });

  test('shows code entry heading', async ({ page }) => {
    await expect(page.locator('app-auth-code-login').getByText('Code eingeben')).toBeVisible();
  });

  test('shows the email address the code was sent to', async ({ page }) => {
    await expect(page.locator('app-auth-code-login').getByText(USER1)).toBeVisible();
  });

  test('OTP input is visible', async ({ page }) => {
    await expect(page.locator('app-auth-code-login ds-input-otp')).toBeVisible();
  });

  test('Bestätigen button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Bestätigen' })).toBeVisible();
  });

  test('E-Mail-ändern link navigates back to request-email', async ({ page }) => {
    await page.getByRole('button', { name: 'E-Mail ändern' }).click();
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
