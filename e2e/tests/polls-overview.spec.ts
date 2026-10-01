import { test, expect } from '@playwright/test';
import { USER1, USER2, login, logout, createStandalonePoll, addTextOption, clickPollMenuItem } from './helpers';

test.describe('Polls-only overview (simplified MVP)', () => {
  let testProjectId: string;
  let testPollId: string;

  // One-time setup: ensure USER1 has an "E2E Smoke Test Poll" with an open option.
  // Creates one only if none exists, so re-runs are fast and idempotent.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, USER1);
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');

    // Create a fresh poll and capture its ids for the Routing tests (deterministic).
    const ids = await createStandalonePoll(page, `Overview E2E ${Date.now()}`);
    testProjectId = ids.projectId;
    testPollId = ids.pollId;

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
    // The empty overview renders the app-polls-empty-state component.
    await expect(page.locator('app-polls-empty-state')).toBeVisible();
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

      // Mobile wizard: the type picker reveals after a question is entered.
      await page.locator('[data-testid="question-input"] input').fill('E2E Created Poll');
      await page.locator('[data-testid="type-btn-yesno"]').click();
      await page.locator('[data-testid="wizard-cta"] button').click();
      await page.waitForURL(/\/polls\/[^/]+\/[^/]+/); // lands on the new poll's detail page

      await page.goto('/polls');
      await page.waitForLoadState('networkidle');
      // .first() avoids strict-mode violation if a stale "E2E Created Poll" exists from a previous run
      await expect(page.getByText('E2E Created Poll').first()).toBeVisible();

      // Delete the created poll via the card's ⋮ menu
      const pollCard = page.locator('app-poll-item').filter({ hasText: 'E2E Created Poll' }).first();
      await clickPollMenuItem(page, pollCard, 'delete');
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

    test('starting a vote opens the overlay; it can be dismissed', async ({ page }) => {
      // Create a fresh poll with one option so we land on its detail page with an
      // open, owned poll (deterministic — no reliance on pre-existing polls).
      await createStandalonePoll(page, `Vote Flow E2E ${Date.now()}`);
      await addTextOption(page, 'Ja');

      // Voting is an overlay on the detail page — open it from the toolbar
      await page.locator('[data-testid="start-vote-btn"] button:visible').first().click();
      await expect(page.locator('app-project-vote')).toBeVisible();

      // Dismissing (Escape) animates it closed, staying on the detail page (no route change)
      await page.keyboard.press('Escape');
      await expect(page.locator('app-project-vote')).toHaveCount(0);
      await expect(page).toHaveURL(/\/polls\/[^/]+\/[^/]+/);
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

  test('mobile (390px): poll cards render with type badge, status dot, crowned creator', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/polls');

    const card = page.locator('app-poll-item').first();
    await expect(card).toBeVisible();
    await expect(card.locator('app-poll-type-badge')).toBeVisible();
    await expect(card.locator('ds-status-dot')).toBeVisible();
    await expect(card.locator('[data-testid="option-creator-crown"]')).toBeVisible();
    await expect(card.locator('ds-progress-bar')).toHaveCount(0);
    await expect(card.locator('[data-testid="open-poll-btn"]')).toBeVisible();
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

  test('poll card: menu share item opens the share drawer for owners', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/polls');

    const pollCard = page.locator('app-poll-item').filter({ has: page.locator('[data-testid="poll-menu"]') }).first();
    if (await pollCard.count()) {
      await clickPollMenuItem(page, pollCard, 'share');
      await expect(page.locator('app-share-drawer')).toBeVisible();
    }
  });

  test('poll card: menu delete item asks for confirmation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/polls');
    const pollCard = page.locator('app-poll-item').filter({ has: page.locator('[data-testid="poll-menu"]') }).first();
    await clickPollMenuItem(page, pollCard, 'delete');
    await expect(pollCard.locator('[data-testid="delete-confirm-btn"]')).toBeVisible();
  });

  test('poll card: an invited voter gets no ⋮ menu', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    const name = `Voter Menu E2E ${Date.now()}`;
    await createStandalonePoll(page, name);

    // Invite USER2 with the default (voter) role from the overview card's menu.
    await page.goto('/polls');
    const ownerCard = page.locator('app-poll-item').filter({ hasText: name });
    await clickPollMenuItem(page, ownerCard, 'share');
    await page.locator('.ds-sheet-panel ds-input input').fill(USER2);
    await page.locator('.ds-sheet-panel app-share-invite-form').getByRole('button', { name: /einladen|invite/i }).click();
    await expect(
      page.locator('.ds-sheet-panel ds-tabs button.ds-tab').filter({ hasText: /zugriff|access|members/i }),
    ).toBeVisible({ timeout: 10_000 });
    await logout(page);

    await login(page, USER2);
    await page.goto('/polls');
    const voterCard = page.locator('app-poll-item').filter({ hasText: name });
    await expect(voterCard).toBeVisible();
    await expect(voterCard.locator('[data-testid="poll-menu"]')).toHaveCount(0);
    await logout(page);

    // Clean up as the owner.
    await login(page, USER1);
    await page.goto('/polls');
    const cleanupCard = page.locator('app-poll-item').filter({ hasText: name });
    await clickPollMenuItem(page, cleanupCard, 'delete');
    await cleanupCard.locator('[data-testid="delete-confirm-btn"] button').click();
    await expect(cleanupCard).toHaveCount(0);
  });

  test('no Hlm* alert dialog on page', async ({ page }) => {
    await page.goto('/polls');
    await expect(page.locator('hlm-alert-dialog')).not.toBeVisible();
  });
});
