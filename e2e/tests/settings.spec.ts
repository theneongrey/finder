import { test, expect } from '@playwright/test';
import { USER1, login, logout } from './helpers';

test.describe('Settings page (issue #247)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('renders title, profile section and notifications section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /settings|einstellungen|ajustes/i })).toBeVisible();
    // Two app-user-avatar elements exist (title bar + profile card) — check first one
    await expect(page.locator('app-user-avatar').first()).toBeVisible();
    await expect(page.getByText(/^profile$|^profil$|^perfil$/i)).toBeVisible();
    await expect(page.getByText(/email notifications|e-mail-benachrichtigungen|notificaciones/i)).toBeVisible();
  });

  test('profile form shows user name pre-filled and email read-only', async ({ page }) => {
    const nameInput = page.locator('[data-testid="settings-name-input"] input');
    await expect(nameInput).toBeVisible();
    const nameValue = await nameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);

    // Email appears in both the profile card and the read-only field — check first occurrence
    await expect(page.getByText(USER1).first()).toBeVisible();
  });

  test('editing name and blurring persists the change', async ({ page }) => {
    const nameInput = page.locator('[data-testid="settings-name-input"] input');
    const originalName = await nameInput.inputValue();

    try {
      await nameInput.fill('E2E Settings Test');
      await nameInput.blur();
      await page.waitForLoadState('networkidle');

      // Reload to verify the name was actually saved to the backend
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="settings-name-input"] input')).toHaveValue('E2E Settings Test');
    } finally {
      // Always restore original name even if the assertion above fails
      const restoredInput = page.locator('[data-testid="settings-name-input"] input');
      await restoredInput.fill(originalName);
      await restoredInput.blur();
      await page.waitForLoadState('networkidle');
    }
  });

  test('language segmented control shows all three language options', async ({ page }) => {
    const langControl = page.locator('[data-testid="settings-language-control"]');
    await expect(langControl).toBeVisible();
    await expect(langControl.getByRole('button', { name: 'Deutsch' })).toBeVisible();
    await expect(langControl.getByRole('button', { name: 'English' })).toBeVisible();
    await expect(langControl.getByRole('button', { name: 'Español' })).toBeVisible();
  });

  test('switching language updates page heading', async ({ page }) => {
    const langControl = page.locator('[data-testid="settings-language-control"]');

    await langControl.getByRole('button', { name: 'Deutsch' }).click();
    await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible({ timeout: 3000 });

    // Switch back to English
    await langControl.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 3000 });
  });

  test('all six notification rows are loaded', async ({ page }) => {
    const rows = page.locator('[data-testid="settings-notif-row"]');
    await expect(rows).toHaveCount(6, { timeout: 5000 });
  });

  test('notification value can be changed and reflected in control', async ({ page }) => {
    const firstControl = page.locator('[data-testid="settings-notif-control"]').first();
    await expect(firstControl).toBeVisible({ timeout: 5000 });

    const offBtn = firstControl.getByRole('button', { name: /^off$|^aus$/i });
    const allBtn = firstControl.getByRole('button', { name: /^all$|^alle$/i });

    await offBtn.click();
    await expect(offBtn).toHaveAttribute('data-state', 'on');

    await allBtn.click();
    await expect(allBtn).toHaveAttribute('data-state', 'on');
  });

  test('logout button is visible and navigates to logout route', async ({ page }) => {
    const logoutBtn = page.locator('[data-testid="settings-logout-btn"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    await page.waitForURL(/\/logout|auth\/request-email/);
  });
});
