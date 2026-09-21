import { expect, Page } from '@playwright/test';

export const USER1 = 'testuser1@neongrey.de';
export const USER2 = 'testuser2@neongrey.de';

export async function login(page: Page, email: string) {
  // Authenticate directly via the API — `page.request` shares the page's cookie
  // jar, so the session cookie set here applies to the page. This is far faster
  // and more reliable than driving the full email → code → token UI flow, and it
  // avoids the redirect races that occasionally landed on the marketing page.
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const req = await page.request.post('/api/auth/requestLoginMail', {
        data: { email },
      });
      if (!req.ok()) {
        throw new Error(`requestLoginMail failed: ${req.status()}`);
      }
      const tok = await page.request.post('/api/auth/tokenLogin', {
        data: { loginToken: '1234' },
      });
      if (!tok.ok()) {
        throw new Error(`tokenLogin failed: ${tok.status()}`);
      }
      await page.goto('/polls');
      // Confirm the session is actually established (avatar renders when logged in).
      await page.locator('app-user-avatar').first().waitFor({ state: 'visible', timeout: 10000 });
      return;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export async function logout(page: Page) {
  let avatar = page.locator('app-user-avatar.cursor-pointer').first();
  if (!await avatar.isVisible()) {
    // Navigate to polls to ensure the title bar avatar is available
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    avatar = page.locator('app-user-avatar.cursor-pointer').first();
    if (!await avatar.isVisible()) return; // not logged in — nothing to do
  }
  await avatar.click();
  // The avatar opens the notifications panel; logout is a plain <button> — match its label in any locale
  await page.locator('.cdk-overlay-container button').filter({ hasText: /logout|abmelden/i }).first().click();
  await page.waitForURL(/\/(de|en|es)(\/|$)|auth\/request-email/);
}

/**
 * Create a bare standalone Yes/No poll (type defaults to Yes/No; options are
 * added later on the detail page). Lands on the poll detail page
 * (/polls/<projectId>/<pollId>) and returns the parsed ids.
 */
export async function createStandalonePoll(
  page: Page,
  name: string,
): Promise<{ projectId: string; pollId: string }> {
  await page.goto('/polls/add');
  await page.waitForURL('**/polls/add');
  await page.locator('[data-testid="question-input"] input').fill(name);
  await page.locator('[data-testid="wizard-cta"] button').click();
  // After creation the app routes to the detail page: /polls/<projectId>/<pollId>
  await page.waitForURL(/\/polls\/[^/]+\/[^/]+/);
  const parts = new URL(page.url()).pathname.split('/');
  return { projectId: parts[2], pollId: parts[3] };
}

/**
 * Add a text option on the poll detail page (poll must be open and the user a
 * maintainer). Waits until the option appears in the option list.
 */
export async function addTextOption(page: Page, text: string): Promise<void> {
  // ds-button hosts are display:contents (no box), so target the inner <button>.
  // The toolbar renders mobile + desktop variants; click whichever is visible.
  await page.locator('[data-testid="add-option-btn"] button:visible').first().click();
  const panel = page.locator('[data-testid="add-option-panel"]');
  await panel.locator('input').first().fill(text);
  await panel.locator('[data-testid="add-option-submit"] button').click();
  await expect(
    page.locator('[data-testid="results-option-list"]'),
  ).toContainText(text);
}
