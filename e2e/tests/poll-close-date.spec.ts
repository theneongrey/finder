import { test, expect } from '@playwright/test';
import { USER1, login, logout } from './helpers';

test.describe('Poll close date', () => {
  let pollSlug: string;
  let pollEditPath: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 }); // mobile: edit-btn is visible in edit mode (lg:hidden)
    await login(page, USER1);

    // Create a standalone poll — the close settings auto-select "1 week" by default
    await page.goto('/polls/add');
    await page.waitForURL('**/polls/add');
    await page.locator('[data-testid="type-btn-yesno"]').click(); // auto-advances to step 2
    await page.locator('[data-testid="question-input"] input').fill('Close Date E2E Test Poll');
    await page.locator('app-option-card ds-input input').first().fill('Ja');
    await page.locator('[data-testid="wizard-cta"] button').click(); // step 2 → creates poll → step 3
    await page.waitForSelector('app-share-content');
    await page.locator('[data-testid="wizard-cta"] button').click(); // step 3 → /polls
    await page.waitForURL('**/polls');

    // Enable edit mode to reveal the edit-btn (no three-dot menu — use inline edit button).
    // Find an OPEN "Close Date E2E Test Poll" (exclude old closed ones from prior runs).
    await page.locator('[data-testid="edit-mode-btn"]').click();
    const openPollCard = page.locator('[data-testid="polls-list"] [hlmCard]')
      .filter({ hasText: 'Close Date E2E Test Poll' })
      .filter({ hasNotText: /\bclosed\b|\bbeendet\b/i }) // exclude prior-run closed polls
      .first();
    // edit-btn has 2 ds-button instances (desktop hover + mobile edit-mode); filter to the visible one
    await openPollCard.locator('[data-testid="edit-btn"]')
      .filter({ has: page.locator('button:visible') })
      .locator('button')
      .click();
    await page.waitForURL('**/edit/**');
    // URL: /polls/<projectSlug>/poll/edit/yesno/<pollSlug>
    pollEditPath = new URL(page.url()).pathname;
    pollSlug = pollEditPath.split('/').at(-1) ?? '';

    await logout(page);
    await page.close();
  }, 90000);

  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('newly created poll with future close date shows open status', async ({ page }) => {
    await page.goto('/polls');
    // At least one "Close Date E2E Test Poll" card must show an open (non-closed) status badge.
    // Uses locale-agnostic check: exclude badges that contain "closed"/"beendet".
    const openBadges = page.locator('app-poll-item')
      .filter({ hasText: 'Close Date E2E Test Poll' })
      .locator('[data-testid="poll-status-badge"]')
      .filter({ hasNotText: /\bclosed\b|\bbeendet\b/i });
    await expect(openBadges).not.toHaveCount(0);
  });

  test('edit form pre-populates the close date', async ({ page }) => {
    await page.goto(pollEditPath);
    await page.waitForURL('**/edit/**');
    await page.waitForLoadState('networkidle'); // wait for form data to load

    const dateInput = page.locator('[data-testid="close-date-input"] input');
    await expect(dateInput).not.toHaveValue('');
  });

  test('edit form pre-populates question and options', async ({ page }) => {
    await page.goto(pollEditPath);
    await page.waitForURL('**/edit/**');
    await page.waitForLoadState('networkidle'); // wait for form data to load

    await expect(page.locator('[data-testid="question-input"] input')).toHaveValue('Close Date E2E Test Poll');
    // Use component selector instead of placeholder (locale-independent)
    await expect(page.locator('app-option-card ds-input input').first()).toHaveValue('Ja');
  });

  test('closing poll via API then reloading overview shows closed status', async ({ page }) => {
    // Close the poll via the API using the authenticated session
    await page.goto('/polls');
    const closeResponse = await page.request.post(`/api/polls/${pollSlug}/close`);
    expect(closeResponse.ok()).toBeTruthy();

    await page.reload();
    // At least one "Close Date E2E Test Poll" must now show a closed status badge (locale-agnostic)
    const closedBadges = page.locator('app-poll-item')
      .filter({ hasText: 'Close Date E2E Test Poll' })
      .locator('[data-testid="poll-status-badge"]')
      .filter({ hasText: /\bclosed\b|\bbeendet\b/i });
    await expect(closedBadges).not.toHaveCount(0);
  });
});
