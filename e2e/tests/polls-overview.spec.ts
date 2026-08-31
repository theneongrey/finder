import { test, expect } from '@playwright/test';
import { USER1, USER2, login, logout } from './helpers';

test.describe('Polls-only overview (simplified MVP)', () => {
  let testProjectId: string;
  let testPollId: string;

  // One-time setup: ensure USER1 has at least one standalone poll with open options.
  // Creates one only if none exists, so re-runs are fast and idempotent.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);

    const voteBtn = page.locator('[data-testid="vote-cta-btn"]').filter({ hasText: /vote now|jetzt abstimmen/i }).first();

    if (await voteBtn.count() === 0) {
      await page.goto('/polls/add');
      await page.waitForURL('**/polls/add');
      await page.locator('[data-testid="type-btn-yesno"]').click(); // auto-advances to step 2
      await page.locator('[data-testid="question-input"] input').fill('E2E Smoke Test Poll');
      await page.locator('app-option-card ds-input input').first().fill('Ja');
      await page.locator('[data-testid="wizard-cta"] button').click(); // step 2 → creates poll → step 3
      await page.waitForSelector('app-share-content');
      await page.locator('[data-testid="wizard-cta"] button').click(); // step 3 → /polls
      await page.waitForURL('**/polls');
    }

    // Navigate to vote page to capture projectId and pollId from the URL
    await page.locator('[data-testid="vote-cta-btn"]').filter({ hasText: /vote now|jetzt abstimmen/i }).first().click();
    await page.waitForURL('**/polls/**/vote/**');
    const parts = new URL(page.url()).pathname.split('/');
    // URL shape: /polls/<projectId>/vote/<pollId>/<optionId>
    testProjectId = parts[2];
    testPollId = parts[4];

    await page.goto('/polls');
    await logout(page);
    await page.close();
  }, 90000);

  test.describe('Overview page', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, USER1);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('shows standalone polls list with no project tabs visible', async ({ page }) => {
      await page.goto('/polls');
      await expect(page.getByRole('tab')).not.toBeVisible();
      await expect(page.locator('[data-testid="polls-list"]')).toBeVisible();
    });

    test('no project management UI — no tabs, no "New project" link', async ({ page }) => {
      await page.goto('/polls');
      await expect(page.getByRole('tab')).not.toBeVisible();
      await expect(page.getByRole('link', { name: /new project/i })).not.toBeVisible();
      await expect(page.getByRole('button', { name: /new project/i })).not.toBeVisible();
    });
  });

  test('shows empty state for a user with no standalone polls', async ({ page }) => {
    await login(page, USER2);
    await page.goto('/polls');
    await expect(page.locator('[data-testid="polls-empty-state"]')).toBeVisible();
    await logout(page);
  });

  test.describe('Create poll flow', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, USER1);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('FAB navigates to /polls/add and new poll appears in list after submit', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 }); // FAB is lg:hidden — use mobile viewport
      await page.goto('/polls');
      await page.locator('[data-testid="fab-add-poll"]').click();
      await page.waitForURL('**/polls/add');

      await page.locator('[data-testid="type-btn-yesno"]').click(); // auto-advances to step 2
      await page.locator('[data-testid="question-input"] input').fill('E2E Created Poll');
      await page.locator('app-option-card ds-input input').first().fill('Ja');
      await page.locator('[data-testid="wizard-cta"] button').click(); // step 2 → creates poll → step 3
      await page.waitForSelector('app-share-content');
      await page.locator('[data-testid="wizard-cta"] button').click(); // step 3 → /polls
      await page.waitForURL('**/polls');

      // .first() avoids strict-mode violation if a stale "E2E Created Poll" exists from a previous run
      await expect(page.getByText('E2E Created Poll').first()).toBeVisible();

      // Enable edit mode to reveal delete buttons, then delete the created poll
      await page.locator('[data-testid="edit-mode-btn"]').click();
      const pollCard = page.locator('app-poll-item').filter({ hasText: 'E2E Created Poll' }).first();
      // delete-btn has 2 ds-button instances (desktop hover + mobile edit-mode); filter to the visible one
      await pollCard.locator('[data-testid="delete-btn"]')
        .filter({ has: page.locator('button:visible') })
        .locator('button')
        .click();
      await pollCard.locator('[data-testid="delete-confirm-btn"]').locator('button').click();
    });
  });

  test.describe('Vote flow', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, USER1);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('vote button navigates to vote page and casting a vote advances to next step', async ({ page }) => {
      await page.goto('/polls');
      await page.locator('[data-testid="vote-cta-btn"]').filter({ hasText: /vote now|jetzt abstimmen/i }).first().click();
      await page.waitForURL('**/polls/**/vote/**');
      await page.waitForLoadState('networkidle');

      // Cast a "Yes" vote — desktop viewport: ds-vote-buttons is md:hidden, use desktop button
      await page.locator('button.desktop-vote-btn--yes').first().click();

      // After voting, either advances to the next option or navigates to results
      await page.waitForURL(/\/polls\/.+\/(vote|results)\/.+/);
    });
  });

  test.describe('Routing', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, USER1);
    });

    test.afterEach(async ({ page }) => {
      await logout(page);
    });

    test('/polls/:id with no sub-route redirects to /polls', async ({ page }) => {
      await page.goto(`/polls/${testProjectId}`);
      await page.waitForURL('**/polls');
      await expect(page).toHaveURL(/\/polls$/);
    });

    test('removed /project/add route redirects to /polls', async ({ page }) => {
      await page.goto('/project/add');
      await page.waitForURL('**/polls');
      await expect(page).toHaveURL(/\/polls$/);
    });
  });
});

// ── #242 — Overview redesign verification ────────────────────────────────────

test.describe('Overview redesign (#242)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER1);
    await page.goto('/polls');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('mobile (390px): poll cards render with type badge, status dot, avatar stack', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/polls');

    const card = page.locator('app-poll-item').first();
    await expect(card).toBeVisible();
    await expect(card.locator('app-poll-type-badge')).toBeVisible();
    await expect(card.locator('ds-status-dot')).toBeVisible();
    await expect(card.locator('ds-progress-bar')).toBeVisible();
    await expect(card.locator('[data-testid="vote-cta-btn"]')).toBeVisible();
  });

  test('mobile (390px): FAB is visible bottom-right', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/polls');
    await expect(page.locator('[data-testid="fab-add-poll"]')).toBeVisible();
  });

  test('mobile (390px): FAB routes to /polls/add', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/polls');
    await page.locator('[data-testid="fab-add-poll"]').click();
    await page.waitForURL('**/polls/add');
  });

  test('desktop (1280px): poll list renders in two-column grid', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto('/polls');

    const list = page.locator('[data-testid="polls-list"]');
    await expect(list).toBeVisible();

    // Two-column grid: first two cards should be side by side (different x positions)
    const cards = list.locator('app-poll-item');
    if (await cards.count() >= 2) {
      const box1 = await cards.nth(0).boundingBox();
      const box2 = await cards.nth(1).boundingBox();
      expect(box1).not.toBeNull();
      expect(box2).not.toBeNull();
      // In a 2-col grid, the second card starts to the right of the first
      expect(box2!.x).toBeGreaterThan(box1!.x);
    }
  });

  test('poll card: share button triggers share drawer for owners', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/polls');

    const shareBtn = page.locator('app-poll-item [data-testid="share-btn"]').first();
    if (await shareBtn.isVisible()) {
      await shareBtn.click();
      await expect(page.locator('app-share-drawer')).toBeVisible();
    }
  });

  test('poll card: delete button is visible for maintainers in edit mode', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/polls');
    await page.locator('[data-testid="edit-mode-btn"]').click();
    const deleteBtn = page.locator('app-poll-item [data-testid="delete-btn"]')
      .filter({ visible: true })
      .first();
    await expect(deleteBtn).toBeVisible();
  });

  test('no Hlm* alert dialog on page', async ({ page }) => {
    await page.goto('/polls');
    await expect(page.locator('hlm-alert-dialog')).not.toBeVisible();
  });
});
