import { test, expect, Locator } from '@playwright/test';

/**
 * Visual-fidelity checks for the ds-* components after the CSS → Tailwind
 * migration (#265–#267, verified by #268).
 *
 * The /ux showcase route is guarded only by `devOnly` (not the auth guard), so
 * these tests navigate straight to it and do NOT log in — the showcase is fully
 * static and needs no API. Assertions focus on the conditional-class components
 * most likely to regress when styling moves from CSS files into the template,
 * plus the animated elements whose keyframes must remain in a CSS file.
 */

/** Read a resolved computed style property off an element. */
async function css(locator: Locator, prop: string): Promise<string> {
    return locator.evaluate(
        (el, p) => getComputedStyle(el).getPropertyValue(p),
        prop,
    );
}

const TRANSPARENT = new Set(['rgba(0, 0, 0, 0)', 'transparent']);

test.describe('ds-* Tailwind migration — visual fidelity (/ux)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/ux');
        await page.waitForLoadState('networkidle');
        // The showcase heading confirms the route rendered (no auth needed).
        await expect(
            page.locator('[data-testid="section-buttons"]'),
        ).toBeVisible();
    });

    test('newly-migrated sections render without layout collapse', async ({
        page,
    }) => {
        // Sections added after the original 18-section smoke test — these are the
        // ones the migration touched most (chips, switch, skeleton, textarea…).
        const sections = [
            'textareas',
            'stepper',
            'chips',
            'switch',
            'sub-header',
            'loading',
        ];
        for (const id of sections) {
            const section = page.locator(`[data-testid="section-${id}"]`);
            await expect(section).toBeVisible();
            const box = await section.boundingBox();
            expect(box, `section-${id} should have a layout box`).not.toBeNull();
            expect(box!.height).toBeGreaterThan(0);
        }
    });

    test('ds-avatar: sm / md / lg render at their token dimensions', async ({
        page,
    }) => {
        const expected: Record<string, number> = { sm: 27, md: 34, lg: 38 };
        for (const [size, px] of Object.entries(expected)) {
            const circle = page.locator(
                `[data-testid="avatar-${size}"] .ds-avatar-circle`,
            );
            await expect(circle).toBeVisible();
            const box = await circle.boundingBox();
            expect(box, `avatar-${size} circle box`).not.toBeNull();
            // Allow a 1px rounding tolerance on the rendered diameter.
            expect(Math.abs(box!.width - px)).toBeLessThanOrEqual(1.5);
            expect(Math.abs(box!.height - px)).toBeLessThanOrEqual(1.5);
        }
    });

    test('ds-avatar: voted variant shows the ring + check badge', async ({
        page,
    }) => {
        const voted = page.locator('[data-testid="avatar-voted"]');
        await expect(voted).toBeVisible();
        // The voted state renders an absolutely-positioned green check badge
        // (bg #5d9a56 = rgb(93,154,86)) — the only span wrapping a check ds-icon.
        const badge = voted.locator('span:has(ds-icon[name="check"])');
        await expect(badge).toBeVisible();
        expect(await css(badge, 'background-color')).toBe('rgb(93, 154, 86)');
    });

    test('ds-badge: every tone renders a visible background', async ({
        page,
    }) => {
        const badges = page.locator('[data-testid="section-badges"] ds-badge > span');
        const count = await badges.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
            const bg = await css(badges.nth(i), 'background-color');
            expect(
                TRANSPARENT.has(bg),
                `badge #${i} should have a visible background (got ${bg})`,
            ).toBe(false);
        }
    });

    test('ds-chip: active and inactive states differ and toggle', async ({
        page,
    }) => {
        const chips = page.locator('[data-testid="section-chips"]');
        // Stable text locators — "Läuft" starts active, "Beendet" starts inactive.
        // (Locating by the aria-pressed attribute is unstable: it changes on click.)
        const active = chips.getByRole('button', { name: 'Läuft' }).first();
        const inactive = chips.getByRole('button', { name: 'Beendet' }).first();
        await expect(active).toHaveAttribute('aria-pressed', 'true');
        await expect(inactive).toHaveAttribute('aria-pressed', 'false');

        const activeBg = await css(active, 'background-color');
        const inactiveBg = await css(inactive, 'background-color');
        expect(activeBg).not.toBe(inactiveBg);

        // Toggling the inactive chip flips its pressed state and its background.
        await inactive.click();
        await expect(inactive).toHaveAttribute('aria-pressed', 'true');
        // Poll past the background-color CSS transition until it settles on the active tone.
        await expect
            .poll(() => css(inactive, 'background-color'))
            .toBe(activeBg);
    });

    test('ds-vote-buttons: yes is larger with a green glow; no is white with a coloured border', async ({
        page,
    }) => {
        const buttons = page.locator('[data-testid="vote-buttons"] button');
        await expect(buttons).toHaveCount(2); // no + yes (no skip / maybe)
        const no = buttons.first();
        const yes = buttons.last();

        const yesBox = await yes.boundingBox();
        const noBox = await no.boundingBox();
        expect(yesBox).not.toBeNull();
        expect(noBox).not.toBeNull();

        // Yes: 62px positive-strong disc with a green drop shadow.
        expect(Math.abs(yesBox!.width - 62)).toBeLessThanOrEqual(1.5);
        expect(await css(yes, 'background-color')).toBe('rgb(93, 154, 86)');
        const yesShadow = await css(yes, 'box-shadow');
        expect(yesShadow).not.toBe('none');
        expect(yesShadow).toContain('93, 154, 86');

        // No: white disc with a non-transparent coloured border.
        expect(await css(no, 'background-color')).toBe('rgb(255, 255, 255)');
        expect(TRANSPARENT.has(await css(no, 'border-top-color'))).toBe(false);
    });

    test('ds-vote-buttons: maybe is smaller than yes and white with a border', async ({
        page,
    }) => {
        const buttons = page.locator('[data-testid="vote-buttons-maybe"] button');
        await expect(buttons).toHaveCount(3); // no + maybe + yes
        const maybe = buttons.nth(1);
        const yes = buttons.last();

        const maybeBox = await maybe.boundingBox();
        const yesBox = await yes.boundingBox();
        expect(maybeBox!.width).toBeLessThan(yesBox!.width); // 54 < 62
        expect(await css(maybe, 'background-color')).toBe('rgb(255, 255, 255)');
        expect(TRANSPARENT.has(await css(maybe, 'border-top-color'))).toBe(false);
    });

    test('ds-status-dot: positive tone keeps its pulse animation', async ({
        page,
    }) => {
        const dot = page.locator(
            '[data-testid="status-dot-live"] .ds-status-dot--pulse',
        );
        await expect(dot).toBeVisible();
        // Angular view encapsulation scopes the keyframe name (_ngcontent-…_ds-status-pulse).
        expect(await css(dot, 'animation-name')).toContain('ds-status-pulse');
    });

    test('ds-button: loading state shows a spinning indicator', async ({
        page,
    }) => {
        await page.locator('[data-testid="btn-loading-demo"] button').click();
        const spinner = page.locator(
            '[data-testid="btn-loading-demo"] .ds-btn__spinner',
        );
        await expect(spinner).toBeVisible();
        expect(await css(spinner, 'animation-name')).toContain('ds-spin');
    });

    test('ds-poll-card-skeleton: shimmer keyframes still animate', async ({
        page,
    }) => {
        const shimmer = page
            .locator('[data-testid="section-loading"] .shimmer')
            .first();
        await expect(shimmer).toBeVisible();
        expect(await css(shimmer, 'animation-name')).toContain(
            'ds-skeleton-shimmer',
        );
    });

    test('ds-bottom-sheet: bottom sheet on narrow viewport, centred modal on wide', async ({
        page,
    }) => {
        // Narrow: the panel is anchored to the bottom edge.
        await page.setViewportSize({ width: 400, height: 800 });
        await page.locator('[data-testid="bottom-sheet-trigger"] button').click();
        let panel = page.locator('.ds-sheet-panel');
        await expect(panel).toBeVisible();
        let box = await panel.boundingBox();
        expect(box).not.toBeNull();
        // Bottom edge sits at (or very near) the viewport bottom.
        expect(box!.y + box!.height).toBeGreaterThan(800 - 4);
        await panel.locator('[data-testid="sheet-close-btn"] button').click();
        await expect(panel).not.toBeVisible();

        // Wide: the panel is a vertically-centred modal, not touching the bottom.
        await page.setViewportSize({ width: 1000, height: 800 });
        await page.locator('[data-testid="bottom-sheet-trigger"] button').click();
        panel = page.locator('.ds-sheet-panel');
        await expect(panel).toBeVisible();
        box = await panel.boundingBox();
        expect(box).not.toBeNull();
        // Not bottom-anchored: there is a gap below the panel.
        expect(box!.y + box!.height).toBeLessThan(800 - 20);
        // Constrained width (max-width 820px) and horizontally centred.
        expect(box!.width).toBeLessThanOrEqual(820 + 1);
        const centreX = box!.x + box!.width / 2;
        expect(Math.abs(centreX - 500)).toBeLessThanOrEqual(2);
    });
});
