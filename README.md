# MLI Leadership Institut — static website

Static rebuild of [leadership-munich.org](https://leadership-munich.org/), migrated off **October CMS** so the site can run on a new server as plain HTML/CSS/JS (plus one small contact endpoint).

This README is the project source of truth for **the migration plan, decisions we made, and [what’s still to do before launch](#still-to-do-before-launch)**.

---

## Goal

Ship a working copy of the current public website — texts, images, navigation, DE/EN, and essential functionality — without October CMS, Magix Forms AJAX, or `/modules/system` framework JS.

**Not in scope for v1:** visual redesign, new IA, or rewriting every page by hand in Astro components.

---

## Source site (what we migrated from)

| Item | Detail |
|------|--------|
| Live URL | https://leadership-munich.org/ |
| CMS | October CMS (theme `mli-sebastian-mogener`) |
| Stack on live | Bootstrap, jQuery, Usercentrics CMP, HubSpot Meetings, CleverReach, Calendly |
| Languages | German (default) + English under `/en/...` |
| Content scale | ~200+ public URLs after crawl (core pages, stories, keynotes, people pages, EN) |
| Kept external | HubSpot Meetings, Calendly, LinkedIn, YouTube/Spotify embeds |

**CMS pieces that had to be replaced:**

- Contact AJAX (`emptyForm::onFormSubmit`) + reCAPTCHA
- Whitepaper AJAX (`whitepaper::onFormSubmit`)
- Keynotes “load more” (`onLoadMore`)
- October `/modules/system/...` JS/CSS

---

## Approach (decision)

**Content-preserving static rebuild** (not a redesign):

1. Crawl/export public HTML + `/storage` media + theme assets from the live site.
2. Clean that HTML (strip October JS, rewrite absolute URLs, wire new forms).
3. Serve via **Astro** as a static build (`dist/`), reusing existing theme CSS/images.
4. Keep URL paths (trailing-slash directories) for SEO and backlinks.
5. Add redirects for known old 2024-era slugs → 2025 URLs.

```text
Live October CMS
    → scripts/export-site.mjs     (export/)
    → scripts/generate-pages.mjs  (public/ HTML + assets)
    → scripts/generate-collections.mjs (src/content stories/keynotes)
    → astro build                 (dist/)
    → new server (nginx / static host)
```

---

## Decisions log

| Topic | Decision | Status |
|-------|----------|--------|
| Migration style | Faithful static export + light JS rebuild; Astro as build/tooling layer | Done |
| Visual design | Keep current look (theme CSS + media); no redesign | Done |
| Contact form | New form → email forwarder (`public/api/contact.php`, JSON POST from `public/js/site.js`) | Done (config pending) |
| Whitepaper | HubSpot form embed placeholders via `src/data/hubspot.json` | Done (IDs pending) |
| Newsletter | Keep CleverReach for now; confirm before launch | Temporary |
| Load more | Client JS in `public/js/site.js` / `LoadMoreList.astro` | Done |
| Cookie/analytics | Copy Usercentrics embed `data-settings-id="0qtDDaIFgHMzAV"` | Done (domain allowlist pending) |
| Booking CTAs | Keep HubSpot Meetings + Calendly links as on live site | Done |
| EN content | Full crawl of EN routes included in static pages | Done |
| Hosting mailer | PHP `mail()` for classic nginx/Apache; optional Web3Forms/Worker stub in `public/api/contact.js` | Choose at deploy |

---

## Project layout

| Path | Role |
|------|------|
| `export/` | Crawl snapshot (local only; gitignored; regenerable) |
| `scripts/export-site.mjs` | Re-crawl the live site |
| `scripts/generate-pages.mjs` | Clean HTML → `public/` |
| `scripts/generate-collections.mjs` | Stories/keynotes → `src/content/*` |
| `public/` | Static pages, theme, media, `js/site.js`, `api/contact.php` |
| `src/components/` | ContactForm, HubspotWhitepaper, NewsletterCleverReach, LoadMoreList |
| `src/layouts/BaseLayout.astro` | Shared head for Astro-only pages |
| `src/content/stories`, `src/content/keynotes` | Editable content collections |
| `src/data/hubspot.json` | HubSpot portal/form IDs |
| `deploy/nginx-mli.conf` | Redirects + `try_files` snippet |
| `docs/` | Deploy, Usercentrics, Newsletter, QA |
| `dist/` | v1 build output to upload to the new server |
| `dist-v2/` | v2 presentation build (same pages/copy; enhanced UX) — gitignored |
| `public/css/mli-v2.css`, `public/js/mli-v2.js` | v2 display layer (injected only into `dist-v2/`) |

---

## Quick start / local test

```bash
npm install
npm run export:site          # optional: re-crawl live site → export/
npm run generate             # pages + collections + missing assets → public/
npm run build                # generate + astro build → dist/
npm run preview -- --host 127.0.0.1 --port 4321
```

Open **http://localhost:4321/** (or http://127.0.0.1:4321/).

Compare against the live site: https://leadership-munich.org/

**GitHub Pages preview:** see [docs/GITHUB-PAGES.md](docs/GITHUB-PAGES.md) → https://davidneuhaus.github.io/mli-website/ (after enabling Pages + Actions).

Upload **contents of `dist/`** to the web root of the new server (production; no `BASE_PATH`).

---

## v2 presentation layer (`/v2/`)

Parallel UX polish — **same pages, same text, same brand** — with stronger menu UX, button states, and light motion. v1 (`public/` / `dist/`) stays the launch baseline.

```bash
npm run build:v2             # public/ → dist-v2/ with BASE_PATH=/v2 + mli-v2 inject
npm run preview:v2           # http://127.0.0.1:4322/v2/
```

**Production:** upload `dist-v2/` contents to the server path served at `/v2/` (see `location /v2/` in [`deploy/nginx-mli.conf`](deploy/nginx-mli.conf)). Example: `https://leadership-munich.org/v2/`.

| Layer | Role |
|-------|------|
| `scripts/build-v2.mjs` | Copy `public/` → `dist-v2/`, add `body.mli-v2`, inject CSS/JS, rewrite URLs |
| `public/css/mli-v2.css` | Nav drawer, button/focus states, scroll reveal, reduced-motion |
| `public/js/mli-v2.js` | Drawer a11y, header scroll, IntersectionObserver reveals |

Promote to the site root only when you explicitly choose to replace v1.

---

## Functionality map (CMS → static)

| Feature | Live CMS | Static site |
|---------|----------|-------------|
| Pages / images | October + `/storage` | `public/**` + theme/media |
| Contact | Magic Forms AJAX | `mli-contact-form` → `/api/contact.php` |
| Whitepaper gate | October form | HubSpot embed (configure IDs) |
| Newsletter | CleverReach + October AJAX | CleverReach POST only (temporary) |
| Load more | `onLoadMore` | `public/js/site.js` |
| Cookies | Usercentrics | Same embed, settings ID `0qtDDaIFgHMzAV` |
| Booking | HubSpot Meetings / Calendly | Unchanged links |

---

## Still to do before launch

Static pages and most wiring are done. **Nothing below is optional for a real production cutover** except the “Can wait” section. GitHub Pages is only a preview — production needs a host that can run the contact endpoint (PHP or serverless).

### 1. Config you must supply

| Item | Where | Notes |
|------|--------|--------|
| Contact inbox | `public/api/contact.php` → `CONTACT_TO` / `CONTACT_FROM` | Then rebuild, or copy PHP into `dist/api/` |
| Mailer host | PHP on VPS **or** Web3Forms / Worker via `public/api/contact.js` | GitHub Pages cannot send mail |
| HubSpot whitepaper IDs | `src/data/hubspot.json` → `portalId`, `whitepaperFormId` | Paste when ready; rebuild; see `_todo` in that file |
| Newsletter decision | CleverReach keep vs replace | [docs/NEWSLETTER.md](docs/NEWSLETTER.md) |
| Usercentrics domains | UC admin for settings ID `0qtDDaIFgHMzAV` | Allow `leadership-munich.org`, `www`, staging, and `davidneuhaus.github.io` for preview — [docs/USERCENTRICS.md](docs/USERCENTRICS.md) |
| Broken hero / content videos | [docs/broken-video-urls.md](docs/broken-video-urls.md) | Tags kept in HTML; fill correct URLs or drop files under `public/storage/...` |

### 2. Deploy & DNS cutover

- [ ] Build: `npm run build` → upload **contents of `dist/`** to production web root (no `BASE_PATH`)
- [ ] HTTPS + TLS for `leadership-munich.org` / `www`
- [ ] Apply redirects: `deploy/nginx-mli.conf` and/or `public/_redirects` (includes `apadtive-…` → `adaptive-…`)
- [ ] Enable contact endpoint (`/api/contact.php` or serverless equivalent)
- [ ] DNS cutover; keep old CMS offline or redirect once smoke tests pass
- [ ] Submit sitemap; spot-check Search Console after cutover

### 3. Smoke tests (must pass)

- [ ] Contact form → message arrives in inbox
- [ ] HubSpot whitepaper form submits (after IDs are live)
- [ ] CleverReach subscribe (or replacement) works
- [ ] Usercentrics banner shows; marketing tags only after consent; footer “Cookie-Einstellungen” opens settings
- [ ] HubSpot Meetings + Calendly CTAs open
- [ ] Keynotes “load more” works
- [ ] Sample DE + EN pages, stories, keynotes on mobile — full list in [docs/QA-CHECKLIST.md](docs/QA-CHECKLIST.md)
- [ ] Spot-check redirects (`/strategieumsetzung/` → `…-2025/`, etc.)

### 4. Can wait (post-launch / nice-to-have)

- [ ] Re-crawl live CMS if content changes before cutover (`npm run export:site` → generate → build)
- [ ] Replace HubSpot placeholder copy once real form IDs are live
- [ ] Optional reCAPTCHA on contact if spam appears
- [ ] Fix same broken videos / typos on the **live** October site if it stays online in parallel ([docs/fixes-live-site-recommendation.md](docs/fixes-live-site-recommendation.md))
- [ ] Phase 2: rebuild high-traffic pages as clean Astro components (optional)

---

## Definition of done

- [x] Static site builds without October CMS / PHP app for page rendering
- [x] Public texts/images for crawled in-scope pages present in `dist/`
- [x] Contact form wired to email endpoint (inbox address still to confirm)
- [x] Whitepaper gates point at HubSpot (form IDs still to configure)
- [x] Newsletter path documented; CleverReach kept pending final decision
- [x] Usercentrics embed copied; domain allowlist is an ops step
- [x] Important old URLs redirect (see `public/_redirects` / nginx conf)
- [ ] Production deploy + DNS cutover + QA sign-off

---

## Further docs

| Doc | Contents |
|-----|----------|
| [docs/DEPLOY.md](docs/DEPLOY.md) | Build, nginx, PHP contact, DNS checklist |
| [docs/USERCENTRICS.md](docs/USERCENTRICS.md) | CMP embed + domain allowlist steps |
| [docs/NEWSLETTER.md](docs/NEWSLETTER.md) | CleverReach temporary keep / decision pending |
| [docs/QA-CHECKLIST.md](docs/QA-CHECKLIST.md) | Page and integration QA before launch |
| [docs/fixes-live-site-recommendation.md](docs/fixes-live-site-recommendation.md) | Broken items on the **live** CMS site to fix |
| [docs/broken-video-urls.md](docs/broken-video-urls.md) | Video/poster 404s — paste correct URLs later |
| [docs/GITHUB-PAGES.md](docs/GITHUB-PAGES.md) | Preview on github.io |

---

## Commands reference

| Command | Purpose |
|---------|---------|
| `npm run export:site` | Crawl live site → `export/` |
| `npm run generate:pages` | Clean export → `public/` |
| `npm run generate:collections` | Stories/keynotes → `src/content/` |
| `npm run generate` | Pages + collections |
| `npm run dev` | Local preview |
| `npm run build` | Generate + Astro build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run build:v2` | Presentation polish → `dist-v2/` (`/v2/` paths) |
| `npm run preview:v2` | Serve nested preview at `/v2/` |
