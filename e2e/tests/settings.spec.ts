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
    await expect(page.locator('app-user-avatar')).toBeVisible();
    await expect(page.getByText(/^profile$|^profil$|^perfil$/i)).toBeVisible();
    await expect(page.getByText(/email notifications|e-mail-benachrichtigungen|notificaciones/i)).toBeVisible();
  });

  test('profile form shows user name pre-filled and email read-only', async ({ page }) => {
    const nameInput = page.locator('[data-testid="settings-name-input"] input');
    await expect(nameInput).toBeVisible();
    const nameValue = await nameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);

    // Email is displayed as a read-only field
    await expect(page.getByText(USER1)).toBeVisible();
  });

  test('editing name and blurring shows success toast', async ({ page }) => {
    const nameInput = page.locator('[data-testid="settings-name-input"] input');
    const originalName = await nameInput.inputValue();

    await nameInput.fill('E2E Settings Test');
    await nameInput.blur();

    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 });

    // Restore original name
    await nameInput.fill(originalName);
    await nameInput.blur();
    await page.locator('[data-sonner-toast]').waitFor({ state: 'hidden', timeout: 6000 });
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
