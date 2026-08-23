import { test, expect } from '@playwright/test';
import { USER1, login, logout } from './helpers';

test.describe('Poll close date', () => {
  let pollSlug: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);

    // Create a standalone poll — the close settings auto-select "1 week" by default
    await page.locator('[data-testid="add-poll-card"]').click();
    await page.waitForURL('**/polls/add');
    await page.getByText('Yes/No').click();
    await page
      .getByRole('textbox', { name: 'Your question' })
      .fill('Close Date E2E Test Poll');
    await page.getByPlaceholder('e.g. Italian restaurant').first().fill('Option A');

    await page.getByRole('button', { name: 'Create poll' }).click();
    await page.waitForURL('**/polls');

    // Capture the poll slug from the first poll's edit route via the menu
    const pollCard = page
      .locator('[data-testid="polls-list"] [hlmCard]')
      .filter({ hasText: 'Close Date E2E Test Poll' })
      .first();
    await pollCard.locator('[data-testid="poll-menu-btn"]').click();
    const editLink = page.getByRole('menuitem', { name: /edit/i });
    const href = await editLink.getAttribute('href') ?? '';
    // URL: /polls/<projectSlug>/poll/edit/yesno/<pollSlug>
    pollSlug = href.split('/').at(-1) ?? '';

    await logout(page);
    await page.close();
  }, 90000);

  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('newly created poll with future close date shows Läuft badge', async ({ page }) => {
    await page.goto('/polls');
    const pollCard = page
      .locator('[data-testid="polls-list"]')
      .filter({ hasText: 'Close Date E2E Test Poll' });
    await expect(pollCard.locator('[data-testid="poll-status-badge"]')).toHaveText('Läuft');
  });

  test('edit form pre-populates the close date', async ({ page }) => {
    await page.goto('/polls');
    const pollCard = page
      .locator('[data-testid="polls-list"] [hlmCard]')
      .filter({ hasText: 'Close Date E2E Test Poll' })
      .first();
    await pollCard.locator('[data-testid="poll-menu-btn"]').click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    await page.waitForURL('**/edit/**');

    const dateInput = page.locator('[data-testid="close-date-input"] input[type="datetime-local"]');
    await expect(dateInput).not.toHaveValue('');
  });

  test('edit form pre-populates question and options', async ({ page }) => {
    await page.goto('/polls');
    const pollCard = page
      .locator('[data-testid="polls-list"] [hlmCard]')
      .filter({ hasText: 'Close Date E2E Test Poll' })
      .first();
    await pollCard.locator('[data-testid="poll-menu-btn"]').click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    await page.waitForURL('**/edit/**');

    await expect(page.getByRole('textbox', { name: 'Your question' })).toHaveValue('Close Date E2E Test Poll');
    await expect(page.getByPlaceholder('e.g. Italian restaurant').first()).toHaveValue('Option A');
  });

  test('closing poll via API then reloading overview shows Beendet badge', async ({ page }) => {
    // Close the poll via the API using the authenticated session
    await page.goto('/polls');
    const closeResponse = await page.request.post(`/api/polls/${pollSlug}/close`);
    expect(closeResponse.ok()).toBeTruthy();

    await page.reload();
    const pollCard = page
      .locator('[data-testid="polls-list"]')
      .filter({ hasText: 'Close Date E2E Test Poll' });
    await expect(pollCard.locator('[data-testid="poll-status-badge"]')).toHaveText('Beendet');
  });
});
