import { Page } from '@playwright/test';

export const USER1 = 'testuser1@neongrey.de';
export const USER2 = 'testuser2@neongrey.de';

export async function login(page: Page, email: string) {
  await page.goto('/auth/request-email');
  // ds-input renders a plain <input> inside the component — target it directly
  await page.locator('ds-input input').fill(email);
  await page.locator('[data-testid="request-email-submit"]').click();
  // Wait for the backend to create the token before navigating to token-login
  await page.waitForURL('**/auth/code-login');
  await page.goto('/auth/token-login?token=1234');
  await page.waitForURL('**/polls');
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
  // ds-menu renders plain <button> elements — match logout label in any locale
  await page.locator('.ds-menu-item').filter({ hasText: /logout|abmelden/i }).click();
  await page.waitForURL(/\/(de|en|es)(\/|$)|auth\/request-email/);
}
