import { test, expect, Page } from '@playwright/test';
import { USER1, login, logout } from './helpers';

/**
 * The add-option panel's pickers for the non-calendar-day appointment types: weekday tiles,
 * the date-range calendar, and the plain time / time-range pickers — plus the "by date" sort
 * that date polls offer instead of "by order".
 */

// OptionType values (see app/finder/src/app/common/models/option-type.model.ts).
const OPTION_TYPE_DATE_RANGE = 4;
const OPTION_TYPE_TIME = 5;
const OPTION_TYPE_TIME_RANGE = 6;
const OPTION_TYPE_WEEKDAY_WITH_TIME = 8;
const OPTION_TYPE_DATE_RANGE_WITH_TIME = 9;

async function createPoll(page: Page, name: string, optionType: number, optionTexts: string[]) {
  const created = await page.request.post('/api/project/standalone-poll', {
    data: { name, description: '', optionType },
  });
  expect(created.ok()).toBeTruthy();
  const { projectId, pollId } = await created.json();
  for (const text of optionTexts) {
    const option = await page.request.post('/api/project/poll/option', {
      data: { text, description: '', pollId: pollId.split('-').pop() },
    });
    expect(option.ok()).toBeTruthy();
  }
  return `/polls/${projectId}/${pollId}`;
}

const panel = (page: Page) => page.locator('[data-testid="add-option-panel"]');
const submit = (page: Page) => panel(page).locator('[data-testid="add-option-submit"] button');
const cards = (page: Page) => page.locator('[data-testid="results-option-list"] [data-option-id]');
const duplicate = (page: Page) => panel(page).locator('[data-testid="date-option-duplicate"]');
const timeError = (page: Page) => panel(page).locator('[data-testid="option-range-time-error"]');
const rangeDay = (page: Page, n: number) =>
  panel(page).locator(`[data-testid="range-calendar-day"]:not([data-outside]):text-is("${n}")`);

async function openPanel(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.locator('[data-testid="add-option-btn"] button:visible').first().click();
  await expect(panel(page)).toBeVisible();
}

/** Picks an hour in the time picker inside `scope` and saves it. */
async function pickHour(page: Page, scope: string, hour: string): Promise<void> {
  await panel(page).locator(`${scope} [data-testid="time-picker-trigger"]`).click();
  // Closed pickers keep their popover in the DOM — only the open one is visible.
  const wheel = page.locator('[data-testid="time-wheel-hour"]').filter({ visible: true });
  await wheel.locator('[data-testid="time-wheel-item"]', { hasText: hour }).click();
  await expect(wheel.locator('[aria-selected="true"]')).toHaveText(hour);
  await page.locator('[data-testid="time-picker-save"] button').filter({ visible: true }).click();
  await expect(wheel).toHaveCount(0);
}

test.describe('Poll detail: add-option pickers', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('weekday poll: taken days are marked, the same day + time is a duplicate', async ({
    page,
  }) => {
    // Monday 18:00 exists.
    const url = await createPoll(page, `Weekday E2E ${Date.now()}`, OPTION_TYPE_WEEKDAY_WITH_TIME, [
      '1;18:00',
    ]);
    await openPanel(page, url);

    const days = panel(page).locator('[data-testid="weekday-option-day"]');
    await expect(days).toHaveCount(7);
    // Existing times are offered as quick picks, the most used one preselected.
    const quickTime = panel(page).locator('[data-testid="quick-time"] button');
    await expect(quickTime).toHaveText(['18:00']);

    await days.nth(0).click();
    await expect(days.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(duplicate(page)).toBeVisible();
    await expect(submit(page)).toBeDisabled();

    await days.nth(1).click();
    await expect(duplicate(page)).toBeHidden();
    await submit(page).click();
    await expect(cards(page)).toHaveCount(2);
  });

  test('date range: first click is the start, a day before it moves the start, then the end', async ({
    page,
  }) => {
    const url = await createPoll(page, `Range E2E ${Date.now()}`, OPTION_TYPE_DATE_RANGE, []);
    await openPanel(page, url);
    await panel(page).locator('[data-testid="calendar-next"]').click();

    await rangeDay(page, 13).click();
    await expect(rangeDay(page, 13)).toHaveAttribute('data-range-start', 'true');
    await expect(submit(page)).toBeDisabled();

    await rangeDay(page, 10).click();
    await expect(rangeDay(page, 10)).toHaveAttribute('data-range-start', 'true');
    await expect(rangeDay(page, 13)).not.toHaveAttribute('data-range-start');

    await rangeDay(page, 14).click();
    await expect(rangeDay(page, 14)).toHaveAttribute('data-range-end', 'true');
    await expect(rangeDay(page, 12)).toHaveAttribute('data-range-middle', 'true');

    await submit(page).click();
    await expect(cards(page)).toHaveCount(1);
  });

  test('timed single-day range: the end time must be after the start time', async ({ page }) => {
    const url = await createPoll(
      page,
      `Range time E2E ${Date.now()}`,
      OPTION_TYPE_DATE_RANGE_WITH_TIME,
      [],
    );
    await openPanel(page, url);
    await panel(page).locator('[data-testid="calendar-next"]').click();

    await rangeDay(page, 12).click();
    await rangeDay(page, 12).click();
    await pickHour(page, '[data-testid="option-range-start-time"]', '10');
    await pickHour(page, '[data-testid="option-range-end-time"]', '09');
    await expect(timeError(page)).toBeVisible();
    await expect(submit(page)).toBeDisabled();

    await pickHour(page, '[data-testid="option-range-end-time"]', '11');
    await expect(timeError(page)).toBeHidden();
    await submit(page).click();
    await expect(cards(page)).toHaveCount(1);
  });

  test('time poll: a single time picker without quick picks', async ({ page }) => {
    const url = await createPoll(page, `Time E2E ${Date.now()}`, OPTION_TYPE_TIME, ['18:00']);
    await openPanel(page, url);

    await expect(panel(page).locator('[data-testid="time-picker-trigger"]')).toHaveCount(1);
    await expect(panel(page).locator('[data-testid="quick-time"]')).toHaveCount(0);

    await pickHour(page, '[data-testid="date-option-time"]', '18');
    await expect(duplicate(page)).toBeVisible();
    await pickHour(page, '[data-testid="date-option-time"]', '19');
    await submit(page).click();
    await expect(cards(page)).toHaveCount(2);
  });

  test('time-range poll: from/to pickers, the end must be after the start', async ({ page }) => {
    const url = await createPoll(page, `Time range E2E ${Date.now()}`, OPTION_TYPE_TIME_RANGE, []);
    await openPanel(page, url);

    await pickHour(page, '[data-testid="option-range-start-time"]', '14');
    await pickHour(page, '[data-testid="option-range-end-time"]', '12');
    await expect(timeError(page)).toBeVisible();
    await expect(submit(page)).toBeDisabled();

    await pickHour(page, '[data-testid="option-range-end-time"]', '16');
    await expect(timeError(page)).toBeHidden();
    await submit(page).click();
    await expect(cards(page)).toHaveCount(1);
  });

  test('date poll: the sort toggle switches to chronological order', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    const url = await createPoll(page, `Sort E2E ${Date.now()}`, OPTION_TYPE_TIME, [
      '11:00',
      '07:00',
      '09:00',
    ]);
    await page.goto(url);
    const sortBtn = page.locator('[data-testid="results-sort-btn"]').filter({ visible: true }).first();
    await expect(sortBtn).toHaveText(/approval|zustimmung|aprobación/i);

    await sortBtn.click();
    await expect(sortBtn).toHaveText(/date|datum|fecha/i);
    // Morning times only: they read the same in 12h and 24h locales.
    await expect(cards(page).nth(0)).toContainText('07:00');
    await expect(cards(page).nth(1)).toContainText('09:00');
    await expect(cards(page).nth(2)).toContainText('11:00');
  });
});
