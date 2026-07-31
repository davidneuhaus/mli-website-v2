# Expedition Zukunft — SEO / LLM Content Plan

**Goal:** Make Sebastian Morgner’s book *Expedition Zukunft* findable and citable (Google, ChatGPT, Claude, Copilot) while giving visitors immediate practical value (answers, frameworks, Q&A)—and bridging to MLI services. **German primary.**

**Source PDF:** `Downloads/Buch Expedition Zukunft - Sebastian Morgner MLI.pdf` (~332 pages).

**Hard rule:** Do **not** publish the full book online. Ship **author-approved derivative content** (summaries, frameworks, FAQs, checklists, short quotes).

---

## 1. Why this works for SEO *and* LLMs (best practices)

Research consensus (Google generative-AI Search guidance + AEO practice 2025–26):

| Do | Why |
|----|-----|
| Helpful, non-commodity content with real expertise | AI features use the same core quality systems as Search; no special “AI hacks” |
| Topic cluster (hub + spokes) + internal links | Topical authority beats isolated posts |
| Question-shaped headings + short direct answer first | Easy extraction for AI Overviews / answer engines |
| Visible FAQ + matching `FAQPage` JSON-LD | Rich results + clearer Q&A parsing |
| Clear entities: Person + Book + Organization | LLMs cite named experts and works |
| E-E-A-T: author bio, dates, credentials, related proof | Trust for citation |
| Server-rendered HTML | Crawlers/LLMs must see full text (your static model fits) |

**Deprioritize as magic:** keyword stuffing, AI synonym spam, relying only on `llms.txt`. Keep `llms.txt` as a small index pointer once the hub exists.

---

## 2. What the book naturally offers (TOC-driven themes)

From the PDF front matter / Inhaltsverzeichnis:

1. **Einführung** — Zukunft, Ziele, Zufall; Expedition-Metapher  
2. **Grundlagen** — Neurowissenschaft & Führung; Strategie als Erkundungsreise; Aufmerksamkeitsökonomie; Denkfehler; soziale Dynamiken / Hierarchien  
3. **Fünf Elemente explorativen Führens** — Haltung; Mission/Zweck/Leitbild; Zukunftspotenziale & Jobs-to-be-Done; Krisenfestigkeit; mentales Navigationssystem; Teamintelligenz; Organisation in Kreisen  
4. **Menschen** — Persönlichkeit, Five4Success, Strategieaktivierung  
5. **Ressourcen** — GRIT-Test, Big-Five-Kurztest, Interviews (Taleb, Yunus, Wales)

These themes already touch live MLI URLs (`/strategieaktivierung/`, `/stark-in-fuehrung/`, keynote *Expedition Zukunft*, podcast/stories).

**Positioning line (public, already used on sebastian-morgner.de / site):**  
Führung als Erkundungsreise; Zufall nutzen, um Ungewissheit und Komplexität zu meistern — gestützt u. a. auf FLI-Interviews und ausgewertete Studien.

**Disambiguation:** Title pages as *Expedition Zukunft* **(Sebastian Morgner / MLI)** so engines don’t confuse with the Swiss political NGO of the same name.

---

## 3. Information architecture

```text
/expedition-zukunft/                 ← Book hub (priority)
/expedition-zukunft/faq/             ← Q&A hub (or FAQ block on hub in v1)
/expedition-zukunft/...-artikel/     ← 8–12 spoke articles
  (or under /leadership-stories/ with clear series tag)

→ Internal links to:
  /strategieaktivierung/
  /stark-in-fuehrung/
  /leitbild-und-strategieentwicklung/
  /team/ (Sebastian)
  /newsletter/
  Buy / bookstore CTA
```

### 3.1 Book hub `/expedition-zukunft/`

One page for humans + machines:

- H1 + 2–3 sentence plain definition  
- Who it’s for  
- Overview of **three competencies / five elements** (scannable, not chapter dumps)  
- Key takeaways (5–7 bullets)  
- Author block (Sebastian) + MLI  
- CTAs: Buch kaufen · Probekapitel (if available) · Gespräch · verwandte Leistungen  
- Links to FAQ + spokes  

**Schema:** `Book` + `Person` + `Organization` + `BreadcrumbList`.

### 3.2 FAQ / Q&A hub

20–40 real questions, e.g.:

- Was bedeutet „Expedition Zukunft“ in der Führung?  
- Was ist exploratives Führen?  
- Komplex vs. kompliziert — warum relevant für Strategie?  
- Wie nutzt man Zufall / Serendipität strategisch?  
- Typische Denkfehler in Führungsentscheidungen?  
- Strategischer Zweck vs. Leitbild?  
- Soziale Dynamiken und Strategieumsetzung?  
- Was ist Five4Success?  

**Answer format:** 1–2 sentence direct answer → short paragraph → link to deep article.  
**Schema:** `FAQPage` only if Q&A is visible on the page and matches schema text.

### 3.3 Spoke articles (first wave)

One idea per URL:

1. Strategie als Erkundungsreise  
2. Exploratives Führen — die fünf Elemente  
3. Komplex vs. kompliziert  
4. Aufmerksamkeitsökonomie in Führung  
5. Denkfehler in Führungsrollen (kuratiert)  
6. Mission, strategischer Zweck & Leitbild  
7. Jobs to be Done für Zukunftsoptionen  
8. Teamintelligenz & soziale Dynamiken  
9. Krisenfestigkeit / existenzielle Risiken  
10. Five4Success / Teamrollen  
11. Strategieaktivierung — Brücke Buch → MLI  

Each: question H2s, takeaways, author, date, links to hub + siblings + one service page. Use existing v2 `Article` JSON-LD path.

### 3.4 Phase-C optional tools

GRIT / Big-Five-style self-checks from the book’s resource section → high user value + lead magnet. Needs privacy + product design; not required for SEO launch.

---

## 4. User value (not just SEO)

| User need | Content format |
|-----------|----------------|
| “Is this relevant for me?” | Hub + who-it’s-for |
| “Explain X in 2 minutes” | FAQ direct answers |
| “How do I apply this Monday?” | Spoke articles with checklists |
| “Go deeper / work with MLI” | CTAs to services + book |
| “Test myself” | Optional self-checks (later) |

Newsletter can feature one FAQ or takeaway per issue → feeds the same canonical URLs.

---

## 5. Editorial & legal workflow

1. **Sebastian approves** publishable frameworks, FAQ wording, quote length.  
2. Rule: **teach the model, don’t paste chapters**.  
3. Always attribute: *Expedition Zukunft* (Sebastian Morgner).  
4. DE first; EN later (hub blurb + ~5 FAQs only if needed).  
5. Update dates when substantively revised (freshness signal).

---

## 6. Implementation on this repo (v2)

| Layer | Approach |
|-------|----------|
| Pages | Prefer `public/expedition-zukunft/` static HTML matching theme **or** Astro content collection `src/content/expedition/` |
| Design | Reuse theme; FAQ accordion like home FAQ; no redesign of whole site |
| SEO | Extend `src/data/seo.json` + `scripts/apply-seo-v2.mjs` for `Book` / `Person` / `FAQPage` |
| Discovery | Nav or footer under Leadership Wissen; breadcrumbs; update `public/llms.txt` |
| Measure | Search Console; hub/FAQ engagement; branded + theme queries |

### Phases

| Phase | Deliverable | Timing (indicative) |
|-------|-------------|---------------------|
| **A** | Hub + 10 FAQs + 4 spokes + schema + internal links | 2–3 weeks |
| **B** | Full 8–12 spokes + ~30 FAQs | +3–4 weeks |
| **C** | Self-tests / lead magnets + light EN | optional |

---

## 7. Success criteria

- Hub is the clear web entity for *Expedition Zukunft* (Sebastian Morgner / MLI)  
- FAQ answers are short enough to be cited with attribution  
- Users get useful guidance before buying; book + MLI CTAs are obvious next steps  
- Topical cluster around exploratives Führen / Strategie als Expedition strengthens MLI authority  
- No full-manuscript leakage  

---

## 8. Decision needed before build

Confirm URL home: **`/expedition-zukunft/`** (recommended) vs. nested under `/leadership-know-how/…`.

---

## 9. Menu: better clustering (before → after)

**Principle:** Do **not** add *Expedition Zukunft* as a new top-level item. The bar is already full. Put the book where users look for ideas (**Leadership Wissen**) and keep top-level for **buy / book a conversation** paths.

### Before (today — top level)

| Top level | Dropdown |
|-----------|----------|
| Stark in Führung | Leadership Development, Coaching, Programm |
| Strategieaktivierung | Strategieentwicklung, Organisationsentwicklung, Strategieumsetzung |
| Unternehmen | Anspruch, Team, Karriere |
| Podcast | — |
| Leadership Wissen | Keynotes, Know How, Stories, Resources *(mixed DE/EN labels)* |
| Events | — |
| Kontakt | — |
| EN | — |

**Problems for users:** 8+ top items; Podcast/Events/Wissen compete; Wissen labels inconsistent; no clear “philosophy / book” entry; book content would make Wissen worse if dumped as many links.

### After (recommended — same # of top items, clearer jobs)

| Top level | Role | Dropdown |
|-----------|------|----------|
| **Stark in Führung** | Offer A | unchanged (Development, Coaching, Programm) |
| **Strategieaktivierung** | Offer B | unchanged (Entwicklung, OE, Umsetzung) |
| **Unternehmen** | Trust | Anspruch, Team, Karriere |
| **Wissen** *(rename from Leadership Wissen)* | Learn / think | see below |
| **Events** | Act / meet | optional: keep top-level **or** move under Wissen |
| **Kontakt** | Convert | — |
| EN | Language | — |

**Wissen dropdown (clustered, DE labels):**

1. **Expedition Zukunft** ← hub `/expedition-zukunft/` *(flagship — first item)*  
2. FAQ zum Buch → `/expedition-zukunft/faq/` *(only if separate URL)*  
3. — separator / visual group —  
4. Leadership Stories  
5. Leadership Know-how  
6. Keynotes & Speaker  
7. Podcast *(moved here from top level)*  
8. Ressourcen  
9. Newsletter *(optional)*

**Expedition articles** do **not** each get a nav link. They live under the hub (“Kapitel / Themen”) and Stories/Know-how listings. Nav stays short; SEO pages still exist.

### Even leaner option (if bar still feels heavy)

| Top level | Notes |
|-----------|--------|
| Stark in Führung | offers |
| Strategieaktivierung | offers |
| Unternehmen | trust |
| Wissen | book + content + podcast + events |
| Kontakt | CTA |
| EN | |

Events move into Wissen as last item. Top bar: **5 + EN** instead of **7 + EN**.

### Mobile drawer (v2)

Same clusters, with small group labels (CSS/aria only, no new pages):

- **Leistungen** — Stark in Führung, Strategieaktivierung  
- **Über uns** — Unternehmen  
- **Wissen & Inspiration** — Expedition Zukunft first, then Stories / Podcast / …  
- **Kontakt**

### What we explicitly avoid

- Top-level “Buch” or “Expedition Zukunft” (competes with offers)  
- Listing all 8–12 spoke articles in the nav  
- Leaving Podcast + Events + Wissen as three peer “content” items without hierarchy  

### Decision to confirm

1. Rename **Leadership Wissen → Wissen**? (recommended)  
2. Move **Podcast** under Wissen? (recommended)  
3. Keep **Events** top-level or under Wissen? (leaner = under Wissen)  
