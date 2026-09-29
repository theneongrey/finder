import { test, expect, Page } from '@playwright/test';
import { USER1, login, logout } from './helpers';

/**
 * Adding a calendar-day option from the poll detail page: the add panel shows a month
 * calendar that marks existing options, blocks re-picking a taken day (or, for timed
 * polls, the same day at the same time), offers existing times as quick picks, and
 * takes one card's slot in the option grid on desktop.
 */

// OptionType values (see app/finder/src/app/common/models/option-type.model.ts).
const OPTION_TYPE_DATE = 2;
const OPTION_TYPE_DATE_WITH_TIME = 7;

// All picks happen in next month so no day is in the past.
const now = new Date();
const TAKEN_DAY = new Date(now.getFullYear(), now.getMonth() + 1, 10);

async function createDatePoll(
  page: Page,
  name: string,
  optionType: number,
  optionText: string,
): Promise<string> {
  const created = await page.request.post('/api/project/standalone-poll', {
    data: { name, description: '', optionType },
  });
  expect(created.ok()).toBeTruthy();
  const { projectId, pollId } = await created.json();
  const option = await page.request.post('/api/project/poll/option', {
    data: { text: optionText, description: '', pollId: pollId.split('-').pop() },
  });
  expect(option.ok()).toBeTruthy();
  return `/polls/${projectId}/${pollId}`;
}

const panel = (page: Page) => page.locator('[data-testid="add-option-panel"]');
const day = (page: Page, n: number) =>
  panel(page).locator(`[data-testid="calendar-day"]:visible:text-is("${n}")`);
const submit = (page: Page) => panel(page).locator('[data-testid="add-option-submit"] button');
const cards = (page: Page) => page.locator('[data-testid="results-option-list"] [data-option-id]');

async function openPanelOnNextMonth(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.locator('[data-testid="add-option-btn"] button:visible').first().click();
  await expect(panel(page)).toBeVisible();
  // The current month is the earliest allowed, so there is no "previous" arrow yet.
  await expect(panel(page).locator('[data-testid="calendar-prev"]')).toBeHidden();
  await panel(page).locator('[data-testid="calendar-next"]').click();
  await expect(panel(page).locator('[data-testid="calendar-prev"]')).toBeVisible();
}

test.describe('Poll detail: add date option via calendar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('date-only poll: taken days are disabled, a free day can be added', async ({ page }) => {
    const url = await createDatePoll(
      page,
      `Calendar date E2E ${Date.now()}`,
      OPTION_TYPE_DATE,
      String(TAKEN_DAY.getTime()),
    );
    await openPanelOnNextMonth(page, url);

    await expect(day(page, 10)).toHaveAttribute('data-highlighted', 'true');
    await expect(day(page, 10)).toBeDisabled();

    await day(page, 11).click();
    await expect(day(page, 11)).toHaveAttribute('aria-selected', 'true');
    await submit(page).click();

    await expect(cards(page)).toHaveCount(2);
    // The new day is now taken too, and the calendar stays on the same month.
    await expect(day(page, 11)).toBeDisabled();
  });

  test('timed poll: a taken day can be re-picked with another time only', async ({ page }) => {
    const url = await createDatePoll(
      page,
      `Calendar time E2E ${Date.now()}`,
      OPTION_TYPE_DATE_WITH_TIME,
      `${TAKEN_DAY.getTime()};18:00`,
    );
    await openPanelOnNextMonth(page, url);

    // Existing times are offered, and the most used one is preselected.
    const quickTime = panel(page).locator('[data-testid="quick-time"] button');
    await expect(quickTime).toHaveText(['18:00']);
    await expect(quickTime).toHaveAttribute('aria-pressed', 'true');

    await day(page, 10).click();
    await expect(panel(page).locator('[data-testid="date-option-duplicate"]')).toBeVisible();
    await expect(submit(page)).toBeDisabled();

    await panel(page).locator('[data-testid="date-option-time"] input').fill('20:00');
    await expect(panel(page).locator('[data-testid="date-option-duplicate"]')).toBeHidden();
    await submit(page).click();

    await expect(cards(page)).toHaveCount(2);
    await expect(quickTime).toHaveText(['18:00', '20:00']);
  });

  test('desktop: the panel takes one card slot in the option grid', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 1000 });
    const url = await createDatePoll(
      page,
      `Calendar layout E2E ${Date.now()}`,
      OPTION_TYPE_DATE,
      String(TAKEN_DAY.getTime()),
    );
    await page.goto(url);
    await page.locator('[data-testid="add-option-btn"] button:visible').first().click();

    // Retry until the panel's slide-in animation has settled.
    await expect(async () => {
      const panelBox = await panel(page).boundingBox();
      const cardBox = await cards(page).first().boundingBox();
      expect(panelBox && cardBox).toBeTruthy();
      expect(Math.abs(panelBox!.width - cardBox!.width)).toBeLessThan(2);
      // Side by side, not stacked full-width.
      expect(Math.abs(panelBox!.y - cardBox!.y)).toBeLessThan(2);
    }).toPass({ timeout: 5000 });
  });
});
