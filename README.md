# MLI Leadership Institut — static website

Static rebuild of [leadership-munich.org](https://leadership-munich.org/), migrated off **October CMS** so the site can run on a new server as plain HTML/CSS/JS (plus one small contact endpoint).

This README is the project source of truth for **the migration plan, decisions we made, and todos before launch**.

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
| `dist/` | Build output to upload to the new server |

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

## Todos before launch

Check these off before DNS cutover.

### Required configuration

- [ ] **Contact destination email** — set `CONTACT_TO` (and allowed `CONTACT_FROM`) in `public/api/contact.php`, then rebuild
- [ ] **Hosting type for mailer** — confirm PHP on VPS (`contact.php`) vs serverless/Web3Forms (`public/api/contact.js`)
- [ ] **HubSpot whitepaper** — *(deferred)* paste `portalId` + `whitepaperFormId` into `src/data/hubspot.json`, then rebuild; verify form delivers/follows up in HubSpot
- [ ] **Newsletter final choice** — keep CleverReach or replace (see [docs/NEWSLETTER.md](docs/NEWSLETTER.md))
- [ ] **Usercentrics domain allowlist** — in UC admin for `0qtDDaIFgHMzAV`, allow `leadership-munich.org` / `www` / staging host (see [docs/USERCENTRICS.md](docs/USERCENTRICS.md))
- [ ] **Confirm EN parity expectation** — full EN ship vs DE-first (currently both are exported)

### Deploy & cutover

- [ ] Deploy `dist/` over HTTPS on the new server
- [ ] Apply nginx redirects (`deploy/nginx-mli.conf`) or platform `_redirects`
- [ ] Enable PHP (or serverless) for `/api/contact.php` / contact worker
- [ ] Smoke-test contact form → inbox
- [ ] Smoke-test HubSpot whitepaper + Meetings/Calendly CTAs
- [ ] Smoke-test CleverReach subscribe (or replacement)
- [ ] Verify Usercentrics banner; marketing tags only after consent
- [ ] Run [docs/QA-CHECKLIST.md](docs/QA-CHECKLIST.md) (DE/EN nav, stories, mobile)
- [ ] DNS cutover for `leadership-munich.org`; keep TLS certs
- [ ] Submit updated sitemap; spot-check Search Console after cutover

### Nice-to-have / follow-up

- [ ] Re-crawl (`npm run export:site`) if live CMS content changes before cutover
- [ ] Replace HubSpot placeholder copy on whitepaper pages once real form IDs are live
- [ ] Optional reCAPTCHA on contact form if spam appears
- [ ] Gradually rebuild high-traffic pages as clean Astro components (optional phase 2)

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
