---
type: Architecture
title: Link Preview
description: How GET /api/preview turns a URL into title, description, image and site name — HTTP first, pooled headless browser second, URL slug last; never fails for reachable-but-uncooperative sites
tags: [preview, backend, playwright, scraping, ssrf, performance]
status: stable
generated:
  actor: claude-opus-5-5
  date: 2026-09-27
stale_after: 2027-03-27
sources:
  - title: PreviewService
    resource: api/Finder/Business/Preview/Services/PreviewService.cs
  - title: Preview helpers (fetchers, extractors, image ranking)
    resource: api/Finder/Business/Preview/Services/PreviewHelper/
  - title: PreviewOptions
    resource: api/Finder/Business/Preview/Setup/PreviewOptions.cs
  - title: "PR #462 — SSRF guard for the preview fetchers"
    resource: https://github.com/theneongrey/finder/pull/462
  - title: Branch feature/preview-service-improvements — preview pipeline rework
    resource: api/Finder/Business/Preview/
---

# Link Preview

When a user pastes a URL into an [option](../concepts/option.md), the frontend calls
`GET /api/preview?url=…` and pre-fills the option's text, description and `OptionMeta` from the
answer. The backend never stores anything itself; the response is
`{ title, description, imageUrl, siteName }`.

## Guiding rule: return whatever is possible

The endpoint only fails (400) for URLs it must not fetch: non-http(s), or hosts that resolve to
non-public addresses (see [SSRF guard](#ssrf-guard)). For everything else it answers 200 with
the fields it could find — down to a title derived from the URL slug when the site blocks us
entirely. Each field is resolved independently, so a missing image or `<title>` never discards
the other fields.

## Pipeline

1. **SSRF pre-check** — `OutboundUrlGuard.IsSafeAsync` rejects unsafe targets before any fetch.
2. **Cache** — results are kept in `IMemoryCache` per URL + primary language
   (`Preview:CacheMinutes`, default 6 h). URL-only fallbacks are not cached, since the site may be
   reachable next time.
3. **Plain HTTP** (`HtmlGrabberHttpClientService`) — browser-like header set, the user's
   `Accept-Language`, gzip/brotli, reads at most 2 MB, honours the charset from the header or
   `<meta charset>`, and reports the final URL after redirects. If this yields a title and an
   image, the pipeline stops here — the common case, typically well under a second.
4. **Headless browser** (`HtmlGrabberPlaywrightService`) — only when something is still missing,
   HTTP was blocked, or the page is client-rendered. It also follows JavaScript / meta-refresh
   redirects (e.g. shortened links such as `amzn.eu/d/…`). Its result is merged with the HTTP
   one: the larger page's values win, gaps are filled from the other.
5. **URL fallback** (`UrlPreviewFallback`) — fills any remaining gap from the URL: site name from
   the host, title from the most word-like path segment
   (`booking.com/hotel/de/adlon-kempinski.de.html` → "Adlon Kempinski").

## Metadata extraction

`PreviewGrabberMetaService` reads, per field, the first non-empty source:

| Field | Sources in order |
|-------|------------------|
| Title | `og:title`, `twitter:title`, JSON-LD `name`/`headline`, `meta[name=title]`, `<title>`, `<h1>` |
| Description | `og:description`, `twitter:description`, `meta[name=description]`, JSON-LD `description`, first long paragraph outside cookie banners |
| Image | `og:image(:secure_url/:url)`, `twitter:image(:src)`, JSON-LD `image`, `link[rel=image_src]`, microdata `itemprop=image` |
| Site name | `og:site_name`, `application-name`, `apple-mobile-web-app-title`, host |

A trailing " | Site" / " – Site" suffix is stripped from the title only when it really names the
site. Relative URLs resolve against `<base href>` and the *final* page URL.

**JSON-LD** (`JsonLdPreviewReader`) is the most valuable addition for shops, hotels, recipes and
articles: it walks `@graph` and `mainEntity`, ranks entities by type (Product, Hotel, Event, …
before Article and WebPage), prefers ones with an image, and ignores site-level entities such as
`WebSite`, `Organization` or `BreadcrumbList`.

## Image guessing

When no image is declared, `PreviewImageOnlyFinder` ranks the page's images:

- **Site-specific markup** (Amazon's `data-a-dynamic-image`, Check24's image tiles) is exact and
  is used directly, without size probing.
- **Generic ranking** considers `src`, lazy-loading attributes and the largest `srcset` entry;
  drops icons, sprites, pixels and SVGs; promotes hero/gallery/product hints and alt texts that
  share words with the title; demotes logos, avatars and ads.

`PreviewImageCandidateService` then probes the top five candidates **in parallel** with
`ImageSizeService` (reads up to 64 KB, so JPEG dimensions behind large EXIF blocks are found)
and returns the best-ranked one that is at least 100×100 and roughly card-shaped.

## Headless browser

- **One pooled Chromium** (`PlaywrightBrowserProvider`, singleton) for the app's lifetime,
  relaunched if it disconnects. Each request gets a fresh `BrowserContext` (isolated cookies),
  which costs milliseconds instead of the seconds a browser launch takes.
- **Images, media, fonts and stylesheets are aborted** — only the DOM is read.
- **Waiting**: a settle loop waits until main-frame navigations stop (handles redirect chains),
  then waits for network idle for at most `Preview:PlaywrightNetworkIdleMilliseconds`
  (default 2.5 s) so client-rendered pages can render. Commercial pages rarely go idle, so the
  cap keeps them from burning the full timeout.
- **User agent** is derived from the launched browser's real version and platform, replacing
  the `HeadlessChrome` token, so it never drifts out of sync with the engine.

## SSRF guard

Every outbound connection is checked at connect time, which also covers redirects and DNS
rebinding: the HTTP client via `SocketsHttpHandler.ConnectCallback`, the browser via a
per-request loopback `GuardedForwardProxy` set as the context proxy. The pooled browser is
launched with its own guarded proxy as a fail-safe for anything that would bypass the context
proxy. See PR #462.

## Bot-protected sites

A browser-like header set, a consistent user agent and a real browser as second step get
through most soft blocks. Hard blocks (e.g. IP-reputation based ones on datacenter IPs) still
end in the URL-slug fallback, which is why that fallback exists. Impersonating social-media
link-preview crawlers was considered and deliberately not done.

## Configuration

| Key | Default | Meaning |
|-----|---------|---------|
| `Preview:PlaywrightTimeoutSeconds` | 10 | Max time for navigation to settle |
| `Preview:PlaywrightNetworkIdleMilliseconds` | 2500 | Cap on the network-idle wait after settling |
| `Preview:CacheMinutes` | 360 | Lifetime of a cached preview |

The endpoint is rate-limited by the `preview` policy (5 requests / IP / minute). The cache and
the pooled browser are process-local — see [Single-Instance Deployment](single-instance.md).

## Related

- [Option](../concepts/option.md) — where the preview ends up (`OptionMeta`)
- [Backend](backend.md) — domain layout
- [API Overview](../api/index.md)
