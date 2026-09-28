# Wiki Log

Append-only chronological record of all ingest, query, and lint operations.
Do not edit past entries.

## 2026-09-28 — ingest: PR #498 review follow-ups (link preview)
Pages touched: architecture/link-preview.md (5 s deadline covers body reads, short TTL for incomplete previews + dedicated size-limited cache, browser recycling with leases, site isolation re-enabled, new config keys)

---

## 2026-09-27 — ingest: link preview pipeline rework (branch feature/preview-service-improvements)
Pages touched: architecture/link-preview.md (created — pipeline, extraction sources, JSON-LD, image ranking + parallel probing, pooled browser, SSRF guard, bot protection, config), architecture/backend.md (Preview Service section replaced by summary + link), concepts/option.md (URL Preview section corrected: frontend fetches, fields may be partial), api/index.md (/api/preview contract), architecture/single-instance.md (preview cache + pooled browser as process-local state), architecture/index.md, index.md

---

## 2026-09-27 — ingest: atomic poll-update claim (PR #463 follow-up)
Pages touched: features/notifications.md (claim + in-app + outbox commit in one transaction, 1 min retry; link to single-instance), architecture/single-instance.md (debounce/mail row updated to post-#463 DB-backed queues)

---

## 2026-09-27 — ingest: persisted mail outbox + poll-update queue
Pages touched: features/notifications.md (added "Delivery: persisted queues, never inline" — OutboxMails + MailOutboxDispatcher with retry/backoff, PendingPollUpdates + PollUpdateDispatcher, single-instance assumption, explicit draining in tests)

---

## 2026-09-27 — ingest: architecture review decisions (single instance, E2E-only frontend)
Pages touched: architecture/single-instance.md (created — decision record, process-local state table, scale-out checklist), guides/testing.md (frontend unit tests: none by design, rationale, revisit trigger), architecture/ci-cd.md (link to the testing decision), architecture/realtime-poll-sync.md (presence process-local by design → link), architecture/backend.md (Deployment Model section), architecture/index.md, index.md

---

## 2026-09-27 — ingest: realtime collaboration (#411 — PRs #439, #440, #444, #447, #450; issue #446)
Pages touched: architecture/realtime-poll-sync.md (created — signalling-only SignalR decision, PollHub + auth over WS, presence registry, change descriptors, delta endpoint with overlap/highlight sets, PollRealtimeService + heartbeat, store mergeDelta / baseline / highlight / edit-guard, presence UI + toasts), features/notifications.md (added active-presence email suppression + idle config; gate order now via ShouldSendMailAsync), features/polling.md (added Live Collaboration section), architecture/poll-detail-rebuild.md (live-collaboration supporting change), api/index.md (delta endpoint + /hub/poll), index.md, architecture/index.md (added realtime page + missing component-architecture / poll-detail-rebuild entries), features/index.md (added missing notifications entry)

---

## 2026-09-25 — ingest: last-50-PR review — UI rebuild + notifications + auth/email + option creator
Pages touched: architecture/poll-detail-rebuild.md (created — results-as-detail, voting overlay, route collapse, overflow menu, container-query layout, single-step add-poll, shell consolidation; PRs #396/#409/#422/#424/#426/#351), features/polling.md (rewrote Voting UX + detail page + revote to overlay model, removed stale /vote//results//poll-overview routes, updated sources), architecture/frontend.md (rewrote Feature Layout, Routing, and UI Library sections to current /polls routing + ds-* Tailwind-first), features/notifications.md (created — in-app centre, orchestration + mail guard, settings, multi-language templates; PRs #367/#358/#349), features/auth.md (added EmailValidationService disposable/MX check #352 + MailTemplateService delivery), concepts/option.md (added required Creator #393), index.md (added notifications, poll-detail-rebuild links)

---

## 2026-09-25 — ingest: Tailwind-first ds-* styling convention (issue #269 / #270)
Pages touched: guides/styling-ds-components.md (created — Tailwind-first default, when a CSS file is acceptable with the 13 retained-CSS reasons table, no static [style.x] bindings, styles.css cross-component rule, acceptance checklist), guides/component-library.md (added Related link), guides/design-system.md (added Related link), index.md (added Guides entry)

---

## 2026-08-22 — ingest: app/finder/src/app/features/auth
Pages touched: features/auth.md (added Frontend Routes section; documented removal of /auth/login route and double-redirect fix; added route table), architecture/frontend.md (updated AuthGuard redirect target from /auth/login to /auth/request-email)

---

## 2026-08-15 — ingest: ds-* component library API sync (issue #236)
Pages touched: guides/component-library.md (updated — 15→21 components, corrected ds-avatar voted input, ds-button full variant list and icon-only mode, ds-bottom-sheet dismissed output, ds-menu ng-content trigger, ds-vote-buttons showMaybe+maybe, added ds-textarea/ds-input-otp/ds-switch/ds-chip/ds-stepper/ds-poll-card-skeleton, 23→29 icon count), guides/spartan-to-ds-migration.md (updated — import paths ds-components/, added textarea/switch/otp patterns, removed outdated no-replacement entries for HlmTextarea and HlmInputOtp)

---

## 2026-08-13 — ingest: component architecture — ds-* vs smart vs domain feature layers
Pages touched: architecture/component-architecture.md (created), architecture/frontend.md (added Component Layers section), index.md (added component-architecture link)

---

## 2026-08-10 — ingest: ds-* component library (issue #237 and sub-issues #234, #235, #236)
Pages touched: guides/component-library.md (created), guides/spartan-to-ds-migration.md (created), guides/design-system.md (updated — Spartan/Font Awesome/Plus Jakarta Sans references replaced), guides/adding-spartan-components.md (status → deprecated), index.md

---

## 2026-08-07 — ingest: Projects concept removal (issue #170 / #167)
Pages touched: architecture/project-removal-mvp.md (created), architecture/index.md, index.md, concepts/project.md

---

## 2026-08-06 — ingest: PrimeNG → Spartan UI migration decision record (issue #141)
Pages touched: architecture/primeng-to-spartan-migration.md (created), architecture/frontend.md, index.md

---

## 2026-08-06 — ingest: PrimeNG → Spartan UI migration (issue #141, phase 9)
Pages touched: architecture/frontend.md, guides/design-system.md, guides/adding-spartan-components.md (created), index.md

---

## 2026-08-04 — ingest: design system route
Pages touched: guides/design-system.md (created), index.md

---

## 2026-08-03 — lint: stub pages populated

Pages touched: concepts/user.md, concepts/project.md, concepts/option.md, guides/adding-a-feature.md

---

## 2026-08-03 — ingest: testing-and-api

Pages touched: guides/testing.md, api/index.md

---

## 2026-08-03 — ingest: architecture

Pages touched: architecture/backend.md, architecture/frontend.md, architecture/database.md, architecture/ci-cd.md

---

## 2026-08-03 — ingest: permissions-and-public-sharing

Pages touched: features/permissions.md, concepts/permission.md (new), features/public-sharing.md (new), concepts/index.md, features/index.md, index.md

---

## 2026-08-03 — ingest: appointment-polls

Pages touched: features/appointment-polls.md

---

## 2026-08-03 — ingest: poll-types-and-voting

Pages touched: features/polling.md, concepts/poll.md, concepts/vote.md

---

## 2026-08-03 — ingest: auth-flow

Pages touched: features/auth.md, concepts/login-token.md (new), guides/local-setup.md, concepts/index.md, index.md

---

## 2026-08-03 — scaffold: initial wiki structure created

Pages created: index.md, SCHEMA.md, log.md, concepts/index.md, features/index.md, architecture/index.md, api/index.md, guides/index.md, and all stub pages.
