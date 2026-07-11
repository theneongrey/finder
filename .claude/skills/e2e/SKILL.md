# E2E Test Skill

You are writing Playwright e2e tests for the Finder app.

## Setup

- Tests live in `e2e/tests/` as `*.spec.ts` files
- Run tests from `e2e/` with `npx playwright test`
- Base URL is `http://localhost:4200` (configured in `playwright.config.ts`)
- Both the Angular dev server (`npm start` in `app/finder/`) and the API (`dotnet run` in `api/Finder/`) must be running

## Login / Logout

Shared helpers and test user constants live in `e2e/tests/helpers.ts`. Always import from there — never copy the functions into a spec file.

```ts
import { USER1, USER2, login, logout } from './helpers';
```

- `USER1` = `testuser1@neongrey.de`, `USER2` = `testuser2@neongrey.de`
- `login(page, email)` — submits the email form then bypasses the code step via `/auth/token-login?token=1234`
- `logout(page)` — clicks the avatar menu and follows the logout link

Call `login` in `beforeEach` / `beforeAll` and `logout` in `afterEach`.

## data-testid attributes

**Whenever you write a test that targets a specific interactive element, add a `data-testid` attribute to that element in the Angular template.** Do not rely on text content, CSS classes, or structural selectors for elements you control — they are brittle.

Rules:
- Add `data-testid` to the Angular HTML template of the component that owns the element.
- Use kebab-case names that describe the element's role, e.g. `poll-menu-btn`, `project-menu-btn`, `create-poll-btn`.
- In the test, locate via `page.locator('[data-testid="..."]')`.
- If a `data-testid` is already present on an element, reuse it — don't add a second one.

Example — template change:
```html
<!-- before -->
<button (click)="openMenu()">...</button>

<!-- after -->
<button data-testid="poll-menu-btn" (click)="openMenu()">...</button>
```

Example — test usage:
```ts
await page.locator('[data-testid="poll-menu-btn"]').click();
```

## General conventions

- Keep `fullyParallel: false` and `workers: 1` — tests share app state (DB) and must run serially.
- Use `test.beforeAll` + `browser.newPage()` for one-time setup (create test data). Use `test.beforeEach` for per-test login.
- Make setup idempotent: check whether test data already exists before creating it so re-runs are fast.
- Add `data-testid` before writing the assertion — never leave a test that works only by accident.
- Prefer `getByRole` for semantic elements (buttons, links, textboxes), and `[data-testid]` for custom components and icon-only buttons.
- Use `waitForURL` after navigations instead of arbitrary `waitForTimeout`.
- Scope locators to a parent when the same element appears multiple times on the page.
