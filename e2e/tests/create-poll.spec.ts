import { test, expect } from '@playwright/test';
import { login, logout, USER1, createStandalonePoll } from './helpers';

// The add wizard is a single-step form: pick a type (Yes/No is preselected on
// desktop), enter a question, and create. The poll is created bare — options are
// added afterwards on the detail page.
test.describe('CreatePoll', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
    await page.goto('/polls/add');
    await page.waitForURL('**/polls/add');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('shows the three poll type cards', async ({ page }) => {
    await expect(page.locator('[data-testid="type-btn-yesno"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-btn-rating"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-btn-date"]')).toBeVisible();
  });

  test('Yes/No is preselected on desktop', async ({ page }) => {
    await expect(
      page.locator('[data-testid="type-btn-yesno"] .type-radio--selected'),
    ).toBeVisible();
  });

  test('create CTA is disabled until a question is entered', async ({ page }) => {
    const cta = page.locator('[data-testid="wizard-cta"] button').first();
    await expect(cta).toBeDisabled();
    await page.locator('[data-testid="question-input"] input').fill('Wer soll kochen?');
    await expect(cta).not.toBeDisabled();
  });

  test('selecting the Date type reveals the appointment sub-type chips', async ({ page }) => {
    await page.locator('[data-testid="type-btn-date"]').click();
    await expect(page.locator('[data-testid="appt-type-weekday"]')).toBeVisible();
    await expect(page.locator('[data-testid="appt-type-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="appt-type-date-range"]')).toBeVisible();
    await expect(page.locator('[data-testid="appt-type-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="appt-type-time-range"]')).toBeVisible();
  });

  test('creating a poll navigates to its (option-less) detail page', async ({ page }) => {
    await createStandalonePoll(page, `Create E2E ${Date.now()}`);
    await expect(page).toHaveURL(/\/polls\/[^/]+\/[^/]+/);
    // A freshly created poll has no options yet — the empty state prompts to add one.
    await expect(page.locator('[data-testid="results-empty-options"]')).toBeVisible();
  });

  // ── Mobile: progressive reveal ─────────────────────────────────────────────
  test.describe('mobile viewport (390 × 844)', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('type picker reveals after a question, then the poll can be created', async ({ page }) => {
      // On mobile the type cards stay hidden until the question has content
      await expect(page.locator('[data-testid="type-btn-yesno"]')).toBeHidden();
      await page.locator('[data-testid="question-input"] input').fill('Mobile test poll');
      await page.locator('[data-testid="type-btn-yesno"]').click();
      await page.locator('[data-testid="wizard-cta"] button').click();
      await page.waitForURL(/\/polls\/[^/]+\/[^/]+/);
    });
  });
});
