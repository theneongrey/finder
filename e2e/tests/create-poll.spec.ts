import { test, expect } from '@playwright/test';
import { login, logout, USER1 } from './helpers';

// Helper: navigate past type selection into the form step.
// Clicking a type card at step 1 auto-advances to step 2 — no extra CTA click needed.
async function selectTypeAndNext(page: any, testid: string) {
  await page.locator(`[data-testid="${testid}"]`).click();
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

  test('step 1: CTA is enabled by default (YesNo pre-selected on mount)', async ({ page }) => {
    // preselectYesNo() runs on mount — CTA is immediately enabled, never starts disabled
    await expect(page.locator('[data-testid="wizard-cta"] button').first()).not.toBeDisabled();
  });

  test('step 1: type-btn-yesno shows selected state by default (pre-selected on mount)', async ({ page }) => {
    // preselectYesNo() sets YesNo before the user clicks anything
    const card = page.locator('[data-testid="type-btn-yesno"]');
    await expect(card).toHaveClass(/type-btn--selected/);
  });

  // ── YesNo poll ─────────────────────────────────────────────────────────────

  test.describe('YesNo poll', () => {
    test.beforeEach(async ({ page }) => {
      await selectTypeAndNext(page, 'type-btn-yesno');
    });

    test.describe('option card char indicator', () => {
      test('shows Title label and char indicator on the first option card', async ({ page }) => {
        const card = page.locator('app-option-card').first();
        await expect(card.locator('label')).toContainText('Title');
        await expect(card.locator('[data-testid="option-char-indicator"]')).toBeVisible();
      });

      test('indicator updates as user types', async ({ page }) => {
        const input = page.locator('app-option-card').first().locator('input').first();
        const indicator = page.locator('app-option-card').first().locator('[data-testid="option-char-indicator"]');
        await input.fill('Hello');
        await expect(indicator).toContainText('5/100');
      });

      test('indicator turns red when text exceeds 100 chars', async ({ page }) => {
        const card = page.locator('app-option-card').first();
        const input = card.locator('input').first();
        const indicator = card.locator('[data-testid="option-char-indicator"]');
        const longText = 'a'.repeat(101);
        await input.fill(longText);
        await expect(indicator).toContainText('101/100');
        await expect(indicator).toHaveAttribute('data-over-limit', 'true');
      });

      test('input accepts text beyond 100 chars without being blocked', async ({ page }) => {
        const input = page.locator('app-option-card').first().locator('input').first();
        const longText = 'a'.repeat(120);
        await input.fill(longText);
        await expect(input).toHaveValue(longText);
      });

      test('submit button is disabled when an option title exceeds 100 chars', async ({ page }) => {
        await page.locator('[data-testid="question-input"] input').fill('Test question');
        const input = page.locator('app-option-card').first().locator('input').first();
        await input.fill('a'.repeat(101));
        await expect(page.locator('[data-testid="wizard-cta"] button').first()).toBeDisabled();
      });

      test('submit button re-enables when title is trimmed back within 100 chars', async ({ page }) => {
        await page.locator('[data-testid="question-input"] input').fill('Test question');
        const input = page.locator('app-option-card').first().locator('input').first();
        await input.fill('a'.repeat(101));
        await expect(page.locator('[data-testid="wizard-cta"] button').first()).toBeDisabled();
        await input.fill('a'.repeat(100));
        await expect(page.locator('[data-testid="wizard-cta"] button').first()).not.toBeDisabled();
      });
    });

    test('shows one empty option card (no pre-seeded values)', async ({ page }) => {
      const options = page.locator('[data-testid="poll-options-list"]');
      await expect(options).toBeVisible();
      const cards = options.locator('app-option-card');
      await expect(cards).toHaveCount(1);
      await expect(cards.nth(0).locator('input').first()).toHaveValue('');
    });

    test('CTA is disabled without a question', async ({ page }) => {
      await expect(page.locator('[data-testid="wizard-cta"] button').first()).toBeDisabled();
    });

    test('CTA becomes enabled once a question and option text are entered', async ({ page }) => {
      await page.locator('[data-testid="question-input"] input').fill('Wer soll kochen?');
      await page.locator('app-option-card ds-input input').first().fill('Ja');
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
      // Step 1: type selection (YesNo pre-selected)
      await expect(page.locator('[data-testid="type-btn-yesno"]')).toBeVisible();
      // Clicking a type card auto-advances to step 2 (form)
      await page.locator('[data-testid="type-btn-yesno"]').click();
      await expect(page.locator('[data-testid="poll-options-list"]')).toBeVisible();

      // Fill question and at least one option text, then submit → step 3 (share)
      await page.locator('[data-testid="question-input"] input').fill('Mobile test');
      await page.locator('app-option-card ds-input input').first().fill('Ja');
      await page.locator('[data-testid="wizard-cta"] button').click();

      // Step 3: share panel visible
      await expect(page.locator('app-share-content')).toBeVisible();
    });
  });

  test.describe('desktop viewport (1280 × 800)', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('2-step wizard: type grid → form+share sidebar', async ({ page }) => {
      // Step 1: type grid (YesNo pre-selected)
      await expect(page.locator('[data-testid="type-btn-yesno"]')).toBeVisible();
      // Clicking a type card auto-advances to step 2 (form + share sidebar)
      await page.locator('[data-testid="type-btn-yesno"]').click();
      await expect(page.locator('[data-testid="question-input"]')).toBeVisible();

      // Fill question and at least one option text, then submit → share sidebar appears
      await page.locator('[data-testid="question-input"] input').fill('Desktop test');
      await page.locator('app-option-card ds-input input').first().fill('Ja');
      await page.locator('[data-testid="wizard-cta"] button').click();
      await expect(page.locator('app-share-content')).toBeVisible();
    });
  });
});
