import { Page } from '@playwright/test';

export const USER1 = 'testuser1@neongrey.de';
export const USER2 = 'testuser2@neongrey.de';

export async function login(page: Page, email: string) {
  await page.goto('/auth/request-email');
  await page.getByRole('textbox', { name: 'Email Address' }).fill(email);
  await page.getByRole('button', { name: 'Request Code' }).click();
  // Wait for the backend to create the token before navigating to token-login
  await page.waitForURL('**/auth/code-login');
  await page.goto('/auth/token-login?token=1234');
  await page.waitForURL('**/project/overview');
}

export async function logout(page: Page) {
  await page.locator('app-user-avatar').click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.waitForURL('**/home');
}
