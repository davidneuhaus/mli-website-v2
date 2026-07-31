# Fixes recommended for the live site (October CMS)

Findings from the static migration QA (July 2026), comparing https://leadership-munich.org/ with the local static rebuild.

These issues exist **on the live CMS site today**. Fixing them in October (or after cutover on the static host) will improve SEO, media reliability, and UX. The static project already works around several of them where possible.

---

## Priority 1 — Broken media (404)

Many pages reference video/poster files under `/storage/app/media/Video/` that return **HTTP 404 on the live server**. Hero/intro videos therefore fail silently; browsers fall back to other imagery when available.

### Home / marketing videos (`videos-2025`)

| URL | Used on |
|-----|---------|
| `/storage/app/media/Video/videos-2025/MLI_Website_Intro.webp` | Home, Leitbild/Strategieentwicklung, Coaching |
| `/storage/app/media/Video/videos-2025/MAS_MLI_Website_Intro_16-9_4K_1.webm` | same |
| `/storage/app/media/Video/videos-2025/MLI_Website_Stark_in_Fuehrung.webp` | Stark in Führung |
| `/storage/app/media/Video/videos-2025/masmliwebsitestarkinfuhrung16-9hd1.webm` | Stark in Führung |
| `/storage/app/media/Video/videos-2025/MLI_Website_Strategieaktivierung.webp` | Strategieaktivierung |
| `/storage/app/media/Video/videos-2025/MAS_MLI_Website_Strategieaktivierung_16-9_4K_1.webm` | Strategieaktivierung |

### English video variants

| URL | Used on |
|-----|---------|
| `/storage/app/media/Video/videos-2025/en/1.png` | `/en/` |
| `/storage/app/media/Video/videos-2025/en/MAS_MLI_Website_Intro_16-9_4K_english_sub2_1_1.webm` | `/en/` |
| `/storage/app/media/Video/videos-2025/en/2.png` | EN strategy pages |
| `/storage/app/media/Video/videos-2025/en/MAS_MLI_Website_Strategieaktivierung_16-9_4K_english_sub_1_1.webm` | EN strategy pages |
| `/storage/app/media/Video/videos-2025/en/3.png` | `/en/strong-in-leadership/` |
| `/storage/app/media/Video/videos-2025/en/masmliwebsitestarkinfuhrung16-94kenglishsub11.webm` | `/en/strong-in-leadership/` |

### Other videos / posters

| URL | Notes |
|-----|--------|
| `/storage/app/media/Video/poster-warum-strategieaktivierung-poster.jpg` | 404 |
| `/storage/app/media/Video/Warum%20Strategie%20Aktivierung.mp4` | 404 (spaces in filename) |
| `/storage/app/media/Video/Poster-Frames/STRATEGYme-Thumbnail.jpg` | 404 — Ressourcen |
| `/storage/app/media/Video/STRATEGYme.mp4` | 404 — Ressourcen |
| `/storage/app/media/Video/interview-with-joe-kaeser-ceo-of-siemens-about-meaning-at-work.mp4` | 404 |
| `/storage/app/media/Video/Strategieentwicklung/MLI_Strategische_Mission.mp4` | 404 |
| `/storage/app/media/Video/Strategieentwicklung/MLI_Chancen_und_Risiken.mp4` | 404 |
| `/storage/app/media/Video/Strategieentwicklung/MLI_Zielgruppe.mp4` | 404 |
| `/storage/app/media/Video/Strategieentwicklung/MLI_BHAG.mp4` | 404 |
| `/storage/app/media/Video/Strategieentwicklung/MLI_Wertschoepfung.mp4` | 404 |
| `/storage/app/media/Video/Strategieentwicklung/MLI_Five4_Success.mp4` | 404 |
| `/storage/app/media/Video/Strategieentwicklung/MLI_OKR._Sebastian%20Morgner.mp4` | 404 |

**Recommendation**

1. Re-upload the missing files to October Media Manager at the exact paths above, **or**
2. Update page markup to point at files that actually exist, **or**
3. Remove `<video>` / `<source>` tags that reference dead files and keep poster/slider images only.

After upload, purge CDN/cache if any. Verify with a hard refresh and `curl -I` returning 200.

---

## Priority 1 — Broken / stale URLs in sitemap & links

`/sitemap.xml` is outdated (`lastmod` 2024-01-30) and still lists URLs that **404 or 500** on live:

| URL | Live status | Recommended fix |
|-----|-------------|-----------------|
| `/strategieaktivierung-und-leitbildentwicklung/` | **500** | Redirect 301 → `/leitbild-und-strategieentwicklung/` |
| `/strategieumsetzung/` | **404** | Redirect 301 → `/strategieumsetzung-2025/` |
| `/fortbildungen-events/` | **404** | Redirect 301 → `/fortbildungen-events-2025/` |
| `/mli-new-leadership-summit-2024-leadership-in-times-of-ai/` | **404** | Redirect → events page or archive |
| `/mli-leadership-quest-2024/` | **404** | Redirect → events page or archive |
| `/stellenausschreibungen/praktikant-innen-und-werkstudierende-m-w-x/` | **404** | Remove from sitemap; redirect to `/arbeiten-beim-mli/` |

**Recommendation**

- Regenerate the sitemap from currently published pages (include 2025 URLs and `/en/...`).
- Add October/nginx 301 redirects for renamed slugs (the static project already ships these in `public/_redirects` and `deploy/nginx-mli.conf`).

---

## Priority 2 — Broken or fragile blog/media paths

Some Leadership Stories / blog image paths with spaces or special characters return 404 on live (encoding / missing file):

- Paths under `/storage/app/media/Blogthemen/GenZ%20und%20F%C3%BChrung%20.../` (several `.webp`)
- `/storage/app/media/Blogthemen/Zolar%20-%20Sarah%20M%C3%BCller/zolar_teaser_logo.webp`
- `/storage/app/media/Blogthemen/Leadership-im-Zeitalter-K%C3%BCnstlicher-Intelligenz/MLI_KI_Leadership_Summit-*.webp`

**Recommendation**

- Prefer media filenames **without spaces or umlauts** (`genz-kira-geiss.webp`).
- Re-link story teaser images in the CMS after re-upload.
- Ensure the web server serves percent-encoded and decoded variants consistently.

---

## Priority 2 — Content / CMS hygiene

| Issue | Where | Recommendation |
|-------|--------|----------------|
| Typo in slug | `/apadtive-organisationsentwicklung-2025/` (“apadtive”) | **Fixed in static copy** → `/adaptive-...` + 301; apply same on live CMS |
| Typo in CTA copy | Kontakt cards: “Vereinbaren **SIe** …” | Fix to “Sie” |
| Empty `<title>` on some 2025 pages | e.g. podcast/events variants during crawl | Set SEO title/description in October for every published page |
| Keynotes “load more” is AJAX-only | `/keynotes-und-speaker/` | First paint only shows ~6 items; ensure all keynotes are crawlable (or accept static listing of all items — already improved in the static rebuild) |
| Sitemap incomplete vs nav | Missing many 2025 + EN URLs | Rebuild sitemap plugin config |

---

## Priority 3 — Technical debt on live (works today, fragile)

| Issue | Notes | Recommendation |
|-------|--------|----------------|
| October `/combine/{hash}` assets without file extension | Served as CSS/JS via CMS; break on plain static hosts | Prefer real `.css` / `.js` theme files (static project renames these) |
| October AJAX forms (`data-request`) | Contact, whitepaper, newsletter wrappers | Already replaced in static plan (email API, HubSpot, CleverReach POST) |
| Magic Forms + reCAPTCHA on contact | Depends on CMS + Google keys | Drop after static cutover; keep spam honeypot / optional reCAPTCHA |
| Usercentrics | Works via embed `data-settings-id="0qtDDaIFgHMzAV"` | Before DNS move: allowlist staging + production domains in UC admin |
| Dual booking links | HubSpot Meetings + Calendly both appear on different pages | Decide on one primary booking tool for consistency |

---

## What already works on live (no action needed for parity)

- Main navigation DE/EN and core marketing pages render
- Theme CSS/JS, most `/storage/app/media` images
- HubSpot Meetings (`meetings.hubspot.com/sebastian-morgner`)
- CleverReach newsletter endpoints
- Usercentrics CMP banner
- Bootstrap carousels / most interactive UI

---

## Suggested fix order (live CMS, before or during cutover)

1. **Upload or re-point all Priority 1 videos/posters** — biggest visible quality gap on home and service pages.
2. **Add 301 redirects** for renamed 2024→2025 slugs; remove dead URLs from sitemap.
3. **Regenerate sitemap** including EN and 2025 pages.
4. **Fix blog image paths** (GenZ / Zolar / KI stories).
5. **Copy typos** (SIe → Sie) and slug `apadtive` → `adaptive`.
6. **Confirm Usercentrics domain list** for the new static host.
7. Cut over DNS to the static `dist/` deploy when QA is signed off.

---

## Related project files

| File | Role |
|------|------|
| `docs/qa-report.json` | Automated local-vs-live asset QA snapshot |
| `docs/missing-assets-report.json` | Which assets were re-downloaded vs still 404 on live |
| `public/_redirects` / `deploy/nginx-mli.conf` | Redirects already prepared for static hosting |
| `README.md` | Migration decisions + pre-launch todos |

---

*Generated from migration QA against https://leadership-munich.org/ — July 2026.*
