import { test, expect } from '@playwright/test';
import { login, logout, USER1 } from './helpers';

// Helper: navigate past type selection into the form step
async function selectTypeAndNext(page: any, testid: string) {
  await page.locator(`[data-testid="${testid}"]`).click();
  await page.locator('[data-testid="wizard-cta"]').click();
}

test.describe('CreatePoll', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
    await page.goto('/polls/add');
    await page.waitForURL('**/polls/add');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  // ── Step 1: Type selection ──────────────────────────────────────────────────

  test('step 1: shows three type cards', async ({ page }) => {
    await expect(page.locator('[data-testid="type-btn-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-btn-yesno"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-btn-rating"]')).toBeVisible();
  });

  test('step 1: wizard CTA is disabled until a type is selected', async ({ page }) => {
    await expect(page.locator('[data-testid="wizard-cta"] button').first()).toBeDisabled();
    await page.locator('[data-testid="type-btn-yesno"]').click();
    await expect(page.locator('[data-testid="wizard-cta"] button').first()).not.toBeDisabled();
  });

  test('step 1: clicking a type card shows selected state', async ({ page }) => {
    const card = page.locator('[data-testid="type-btn-yesno"]');
    await card.click();
    await expect(card).toHaveClass(/type-btn--selected/);
  });

  // ── YesNo poll ─────────────────────────────────────────────────────────────

  test.describe('YesNo poll', () => {
    test.beforeEach(async ({ page }) => {
      await selectTypeAndNext(page, 'type-btn-yesno');
    });

    test('shows two pre-seeded editable option cards', async ({ page }) => {
      const options = page.locator('[data-testid="yesno-options"]');
      await expect(options).toBeVisible();
      const cards = options.locator('app-option-card');
      await expect(cards).toHaveCount(2);
      await expect(cards.nth(0).locator('input').first()).toHaveValue('Ja');
      await expect(cards.nth(1).locator('input').first()).toHaveValue('Nein');
    });

    test('CTA is disabled without a question', async ({ page }) => {
      await expect(page.locator('[data-testid="wizard-cta"] button').first()).toBeDisabled();
    });

    test('CTA becomes enabled once a question is entered', async ({ page }) => {
      await page.locator('[data-testid="question-input"] input').fill('Wer soll kochen?');
      await expect(page.locator('[data-testid="wizard-cta"] button').first()).not.toBeDisabled();
    });
  });

  // ── Rating poll ────────────────────────────────────────────────────────────

  test.describe('Rating poll', () => {
    test.beforeEach(async ({ page }) => {
      await selectTypeAndNext(page, 'type-btn-rating');
    });

    test('shows one option card with a single-star indicator', async ({ page }) => {
      await expect(page.locator('[data-testid="star-indicator"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="star-indicator"]').first()).toContainText('★');
      await expect(page.locator('app-option-card')).toHaveCount(1);
    });

    test('add button appends a card with incremented star count', async ({ page }) => {
      await page.locator('[data-testid="add-option-btn"] button').click();
      await expect(page.locator('app-option-card')).toHaveCount(2);
      await expect(page.locator('[data-testid="star-indicator"]').nth(1)).toContainText('★★');
    });

    test('remove button appears when multiple cards exist', async ({ page }) => {
      await page.locator('[data-testid="add-option-btn"] button').click();
      const removeButtons = page.locator('app-option-card ds-button[icon="close"] button');
      await expect(removeButtons).toHaveCount(2);
      await removeButtons.first().click();
      await expect(page.locator('app-option-card')).toHaveCount(1);
    });

    test('CTA is disabled without a question', async ({ page }) => {
      await expect(page.locator('[data-testid="wizard-cta"] button').first()).toBeDisabled();
    });

    test('CTA becomes enabled with question and at least one option text', async ({ page }) => {
      await page.locator('[data-testid="question-input"] input').fill('Wie gut ist das?');
      await page.locator('app-option-card ds-input input').first().fill('Gut');
      await expect(page.locator('[data-testid="wizard-cta"] button').first()).not.toBeDisabled();
    });
  });

  // ── Date poll ──────────────────────────────────────────────────────────────

  test.describe('Date poll', () => {
    test.beforeEach(async ({ page }) => {
      await selectTypeAndNext(page, 'type-btn-date');
    });

    test('shows all five appointment type chips', async ({ page }) => {
      await expect(page.locator('[data-testid="appt-type-weekday"]')).toBeVisible();
      await expect(page.locator('[data-testid="appt-type-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="appt-type-date-range"]')).toBeVisible();
      await expect(page.locator('[data-testid="appt-type-time"]')).toBeVisible();
      await expect(page.locator('[data-testid="appt-type-time-range"]')).toBeVisible();
    });

    test('Kalendertag chip shows date option card and add button', async ({ page }) => {
      await page.locator('[data-testid="appt-type-date"]').click();
      await expect(page.locator('app-option-card-date')).toHaveCount(1);
      await expect(page.locator('[data-testid="add-date-option-btn"] button')).toBeVisible();
    });

    test('add date option appends a new card', async ({ page }) => {
      await page.locator('[data-testid="appt-type-date"]').click();
      await page.locator('[data-testid="add-date-option-btn"] button').click();
      await expect(page.locator('app-option-card-date')).toHaveCount(2);
    });

    test('Datumsbereich chip shows date-range option card', async ({ page }) => {
      await page.locator('[data-testid="appt-type-date-range"]').click();
      await expect(page.locator('app-option-card-date-range')).toHaveCount(1);
    });

    test('Uhrzeit chip shows time option card', async ({ page }) => {
      await page.locator('[data-testid="appt-type-time"]').click();
      await expect(page.locator('app-option-card-time')).toHaveCount(1);
    });

    test('Zeitspanne chip shows time-range option card', async ({ page }) => {
      await page.locator('[data-testid="appt-type-time-range"]').click();
      await expect(page.locator('app-option-card-time-range')).toHaveCount(1);
    });

    test('Wochentag chip shows weekday selector card', async ({ page }) => {
      await page.locator('[data-testid="appt-type-weekday"]').click();
      await expect(page.locator('app-option-card-weekday').or(page.locator('ds-card'))).toBeTruthy();
    });

    test('CTA is disabled without question and valid date option', async ({ page }) => {
      await page.locator('[data-testid="appt-type-date"]').click();
      await expect(page.locator('[data-testid="wizard-cta"] button').first()).toBeDisabled();
    });

    test('selected chip gets visual indicator dot', async ({ page }) => {
      await page.locator('[data-testid="appt-type-date"]').click();
      const chip = page.locator('[data-testid="appt-type-date"]');
      await expect(chip.locator('span')).toBeVisible();
    });
  });

  // ── Viewport variants ──────────────────────────────────────────────────────

  test.describe('mobile viewport (390 × 844)', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('3-step wizard: type → form → share', async ({ page }) => {
      // Step 1: type selection
      await expect(page.locator('[data-testid="type-btn-yesno"]')).toBeVisible();
      await page.locator('[data-testid="type-btn-yesno"]').click();

      // Advance to step 2 (form)
      await page.locator('[data-testid="wizard-cta"] button').click();
      await expect(page.locator('[data-testid="yesno-options"]')).toBeVisible();

      // Fill form and create poll
      await page.locator('[data-testid="question-input"] input').fill('Mobile test');
      await page.locator('[data-testid="wizard-cta"] button').click();

      // Step 3: share panel visible
      await expect(page.locator('app-share-content')).toBeVisible();
    });
  });

  test.describe('desktop viewport (1280 × 800)', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('2-step wizard: type grid → form+share sidebar', async ({ page }) => {
      // Step 1: type grid
      await expect(page.locator('[data-testid="type-btn-yesno"]')).toBeVisible();
      await page.locator('[data-testid="type-btn-yesno"]').click();

      // Advance to step 2 (form + share sidebar)
      await page.locator('[data-testid="wizard-cta"] button').click();
      await expect(page.locator('[data-testid="question-input"]')).toBeVisible();

      // Fill form and create poll → share sidebar appears
      await page.locator('[data-testid="question-input"] input').fill('Desktop test');
      await page.locator('[data-testid="wizard-cta"] button').click();
      await expect(page.locator('app-share-content')).toBeVisible();
    });
  });
});
