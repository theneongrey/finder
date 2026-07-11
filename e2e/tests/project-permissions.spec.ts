import {test, expect, Page} from '@playwright/test';
import { USER1, USER2, login, logout } from './helpers';

async function closeShareDrawer(page: Page) {
  await page.keyboard.press('Escape');
  await page.locator('[data-pc-name="drawer"]').waitFor({ state: 'hidden' });
}

test.describe('Project permission checks', () => {
  let projectId: string;

  // One-time setup: ensure "Permission Test Project" exists with a poll and user2 as Voter.
  // Creates only what is missing so re-runs are fast and idempotent.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    await login(page, USER1);

    // Navigate to or create the test project
    await page.getByRole('tab', { name: 'Projects' }).click();
    const existingCard = page
      .locator('app-project-item')
      .filter({ hasText: 'Permission Test Project' })
      .first();

    if (await existingCard.count() > 0) {
      await existingCard.click();
      await page.waitForURL('**/project/detail/**');
    } else {
      await page.getByText('New project').click();
      await page.getByRole('textbox', { name: 'Project name' }).fill('Permission Test Project');
      await page.getByRole('textbox', { name: 'Project description' }).fill('Testing project permissions');
      await page.getByRole('button', { name: 'Create project' }).click();
      await page.waitForURL('**/project/detail/**');
    }

    projectId = page.url().split('/project/detail/')[1].split('/')[0];

    // Create a Yes/No poll only if none exists
    if (await page.locator('[data-testid="poll-menu-btn"]').count() === 0) {
      await page.getByText('Create new poll').click();
      await page.getByText('Yes/No').click();
      await page.getByRole('textbox', { name: 'Your question' }).fill('Should we proceed?');
      await page.getByRole('textbox', { name: 'e.g. Italian restaurant' }).fill('Yes');
      await page.getByRole('button', { name: 'Create poll' }).click();
      await page.waitForURL(`**/project/detail/${projectId}`);
    }

    // Ensure user2 is a Voter. The Members tab only appears when sharedWith is non-empty.
    await page.getByRole('button', { name: 'Invite' }).click();
    const membersTab = page.getByRole('tab', { name: 'Members' });
    if (await membersTab.count() > 0) {
      // user2 is already a member — reset to Voter in case a previous run left them as Maintainer
      await membersTab.click();
      const maintainerBtn = page
        .locator('app-share-members-list button')
        .filter({ hasText: /Maintainer/ });
      if (await maintainerBtn.count() > 0) {
        await maintainerBtn.click();
        await page.getByRole('menuitem', { name: 'Voter' }).click();
      }
    } else {
      // No members yet — invite form is directly visible (no tabs)
      await page.getByRole('textbox', { name: 'Name or email' }).fill(USER2);
      await page.locator('app-share-invite-form button[data-p="icon-only"]').click();
    }
    await closeShareDrawer(page);

    await logout(page);
    await page.close();
  }, 90000);

  test.describe('Voter role', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, USER2);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('should NOT show poll card menu button', async ({ page }) => {
      await page.goto(`/project/detail/${projectId}`);
      await expect(page.locator('[data-testid="poll-menu-btn"]')).not.toBeVisible();
    });

    test('should NOT show project card menu button', async ({ page }) => {
      await page.goto('/project/overview');
      await page.getByRole('tab', { name: 'Projects' }).click();
      const card = page
        .locator('p-tabpanel[value="projects"] app-project-item')
        .filter({ hasText: 'Permission Test Project' })
        .first();
      await expect(card.locator('[data-testid="project-menu-btn"]')).not.toBeVisible();
    });

    test('should NOT show Invite button in project detail', async ({ page }) => {
      await page.goto(`/project/detail/${projectId}`);
      await expect(page.getByRole('button', { name: 'Invite' })).not.toBeVisible();
    });
  });

  test.describe('Maintainer role', () => {
    // One-time: upgrade user2 from Voter to Maintainer (skipped if already Maintainer)
    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();

      await login(page, USER1);
      await page.goto(`/project/detail/${projectId}`);
      await page.getByRole('button', { name: 'Invite' }).click();
      await page.getByRole('tab', { name: 'Members' }).click();

      // Only upgrade if user2 is currently a Voter
      const voterBtn = page
        .locator('app-share-members-list button')
        .filter({ hasText: /Voter/ });
      if (await voterBtn.count() > 0) {
        await voterBtn.click();
        await page.getByRole('menuitem', { name: 'Maintainer' }).click();
      }

      await closeShareDrawer(page);
      await logout(page);
      await page.close();
    }, 60000);

    test.beforeEach(async ({ page }) => {
      await login(page, USER2);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('should show Edit and Delete in poll card menu', async ({ page }) => {
      await page.goto(`/project/detail/${projectId}`);
      await page.locator('[data-testid="poll-menu-btn"]').click();
      await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    });

    test('should NOT show Invite button in project detail', async ({ page }) => {
      await page.goto(`/project/detail/${projectId}`);
      await expect(page.getByRole('button', { name: 'Invite' })).not.toBeVisible();
    });
  });
});
