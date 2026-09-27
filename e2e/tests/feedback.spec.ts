import { test, expect, Page } from '@playwright/test';
import { USER1, login, logout } from './helpers';

async function setButtonHidden(page: Page, buttonHidden: boolean) {
  const res = await page.request.put('/api/feedback/preference', { data: { buttonHidden } });
  expect(res.ok()).toBeTruthy();
}

test.describe('Feedback tab (issue #326)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
    // Start every test from the default state: tab visible.
    await setButtonHidden(page, false);
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await setButtonHidden(page, false);
    await logout(page);
  });

  test('tab is shown on the left edge of logged-in screens', async ({ page }) => {
    const tab = page.getByTestId('feedback-tab');
    await expect(tab).toBeVisible();
    const box = await tab.boundingBox();
    expect(box?.x).toBe(0);

    await page.goto('/settings');
    await expect(page.getByTestId('feedback-tab')).toBeVisible();
  });

  test('panel discloses what will be sent and can be cancelled', async ({ page }) => {
    await page.getByTestId('feedback-tab').click();
    const panel = page.getByTestId('feedback-panel');
    await expect(panel).toBeVisible();

    const disclosure = page.getByTestId('feedback-disclosure');
    await expect(disclosure).toContainText(USER1);
    await expect(disclosure).toContainText('/polls');

    // Send stays disabled until a comment is entered.
    await expect(page.getByTestId('feedback-send').locator('button')).toBeDisabled();

    await page.getByTestId('feedback-cancel').click();
    await expect(panel).toBeHidden();

    await page.getByTestId('feedback-tab').click();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });

  test('submitting sends type, comment and page, then closes the panel', async ({ page }) => {
    // Stub the endpoint so the test doesn't depend on SMTP being configured locally.
    let body: Record<string, unknown> | undefined;
    await page.route('**/api/feedback', async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 204 });
    });

    await page.getByTestId('feedback-tab').click();
    await page.getByTestId('feedback-type').getByRole('button').nth(1).click();
    await page.getByTestId('feedback-comment').locator('textarea').fill('E2E feedback comment');
    await page.getByTestId('feedback-send').click();

    await expect(page.getByTestId('feedback-panel')).toBeHidden();
    expect(body).toEqual({ type: 'Idea', comment: 'E2E feedback comment', page: '/polls' });
  });

  test('hiding the tab persists and it can be re-enabled in settings', async ({ page }) => {
    await page.getByTestId('feedback-tab').click();
    await page.getByTestId('feedback-hide').click();
    await expect(page.getByTestId('feedback-tab')).toBeHidden();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('feedback-tab')).toBeHidden();

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const toggle = page.getByTestId('settings-feedback-switch').getByRole('switch');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    await toggle.click();
    await expect(page.getByTestId('feedback-tab')).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('feedback-tab')).toBeVisible();
  });

  test('hitting the submission limit shows an error and keeps the panel open', async ({ page }) => {
    await page.route('**/api/feedback', (route) => route.fulfill({ status: 429 }));

    await page.getByTestId('feedback-tab').click();
    await page.getByTestId('feedback-comment').locator('textarea').fill('E2E limit');
    await page.getByTestId('feedback-send').click();

    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toBeVisible();
    // The comment is kept so the user can send it later.
    await expect(page.getByTestId('feedback-panel')).toBeVisible();
    await expect(page.getByTestId('feedback-tab')).toBeVisible();
  });

  test('a disabled account gets an error and the tab disappears', async ({ page }) => {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await page.route('**/api/feedback', (route) => route.fulfill({ status: 403 }));
    // After the 403 the store reloads the preference to learn until when feedback is disabled.
    await page.route('**/api/feedback/preference', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({ json: { buttonHidden: false, feedbackDisabledUntil: until } })
        : route.continue(),
    );

    await page.getByTestId('feedback-tab').click();
    await page.getByTestId('feedback-comment').locator('textarea').fill('E2E disabled');
    await page.getByTestId('feedback-send').click();

    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toBeVisible();
    await expect(page.getByTestId('feedback-panel')).toBeHidden();
    await expect(page.getByTestId('feedback-tab')).toBeHidden();
  });

  test('while disabled the tab is hidden and settings explain until when', async ({ page }) => {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await page.route('**/api/feedback/preference', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({ json: { buttonHidden: false, feedbackDisabledUntil: until } })
        : route.continue(),
    );

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('feedback-tab')).toBeHidden();

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('settings-feedback-disabled')).toBeVisible();
  });
});
