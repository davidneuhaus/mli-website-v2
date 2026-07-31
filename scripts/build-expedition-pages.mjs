#!/usr/bin/env node
/**
 * Generate Expedition Zukunft hub, FAQ, articles + rebuild DE/EN Wissen nav.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const DATA = JSON.parse(
  await fs.readFile(path.join(ROOT, "src/data/expedition-content.json"), "utf8")
);
const { FAQS, ARTICLE_BODIES, hubExtraHtml } = await import(
  path.join(ROOT, "src/data/expedition-copy.mjs")
);

const DONOR = path.join(PUBLIC, "kontakt", "index.html");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadShell() {
  const html = await fs.readFile(DONOR, "utf8");
  const start = html.indexOf('<section id="layout-content">');
  const footer = html.indexOf("<!-- Footer -->");
  if (start < 0 || footer < 0) throw new Error("Donor shell markers missing");
  return {
    before: html.slice(0, start),
    after: html.slice(footer),
  };
}

function setHead(before, { title, description, canonical, bodyClass }) {
  let h = before;
  h = h.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  h = h.replace(
    /<meta name="description" content="[^"]*">/i,
    `<meta name="description" content="${escapeHtml(description)}">`
  );
  h = h.replace(
    /<meta name="title" content="[^"]*">/i,
    `<meta name="title" content="${escapeHtml(title)}">`
  );
  h = h.replace(
    /<link rel="canonical" href="[^"]*">/i,
    `<link rel="canonical" href="${canonical}">`
  );
  h = h.replace(
    /<body class="[^"]*">/i,
    `<body class="home-layout ${bodyClass}">`
  );
  return h;
}

function pageChrome(inner, meta) {
  // filled later with shell
  return { meta, inner };
}

function hubInner() {
  const cover = DATA.cover;
  const author = DATA.authorImg;
  const arts = DATA.articles
    .map(
      (a) => `
      <div class="col-md-6 col-lg-3 mb-4">
        <a href="/expedition-zukunft/${a.slug}/" class="text-decoration-none mli-ez-card">
          <img src="${a.image}" alt="${escapeHtml(a.h1)}" class="img-fluid mb-2 mli-ez-thumb">
          <h3 class="h5 rotpink" style="text-transform:none;">${escapeHtml(a.h1)}</h3>
        </a>
        <p class="small">${escapeHtml(a.description).slice(0, 120)}…</p>
      </div>`
    )
    .join("\n");

  const bookLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Book",
        name: "Expedition Zukunft",
        alternateName: "Expedition Zukunft – Wie wir den Zufall nutzen können, um Ungewissheit und Komplexität zu meistern",
        author: { "@id": "https://leadership-munich.org/#sebastian-morgner" },
        publisher: { "@id": "https://leadership-munich.org/#organization" },
        image: `https://leadership-munich.org${cover}`,
        description: DATA.hub.description,
        inLanguage: "de",
        url: "https://leadership-munich.org/expedition-zukunft/",
      },
      {
        "@type": "Person",
        "@id": "https://leadership-munich.org/#sebastian-morgner",
        name: "Sebastian Morgner",
        jobTitle: "Geschäftsführender Gesellschafter",
        worksFor: { "@id": "https://leadership-munich.org/#organization" },
        image: `https://leadership-munich.org${author}`,
        url: "https://leadership-munich.org/team/",
      },
      {
        "@type": "Organization",
        "@id": "https://leadership-munich.org/#organization",
        name: "MLI Leadership Institut",
        url: "https://leadership-munich.org/",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://leadership-munich.org/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Expedition Zukunft",
            item: "https://leadership-munich.org/expedition-zukunft/",
          },
        ],
      },
    ],
  };

  return `
<section id="layout-content">
  <button class="btn-primary btn backtotop" onclick="window.scrollTo({top: 0, behavior: 'smooth'});"><i class="bi bi-arrow-up"></i></button>
  <div class="container-fluid mli-ez-shell">
    <div class="container mli-ez-wrap py-4 py-lg-5">
      <div class="row align-items-center g-4 mb-5">
        <div class="col-lg-5 text-center text-lg-start">
          <img src="${cover}" alt="Buchcover Expedition Zukunft von Sebastian Morgner" class="img-fluid mli-ez-cover">
        </div>
        <div class="col-lg-7">
          <p class="mli-ez-eyebrow">Buch &amp; Führungsphilosophie</p>
          <h1 class="rotpink mb-3">Expedition Zukunft</h1>
          <p class="lead">Wie wir den Zufall nutzen können, um Ungewissheit und Komplexität zu meistern — das Buch von Sebastian Morgner für Entscheider in Strategie und Führung.</p>
          <p>Führung als <strong>Erkundungsreise</strong>: geprägt von Neugier, gemeinsamer Mission und der Fähigkeit, in komplexen Lagen zu lernen — statt den perfekten Plan zu fingieren. Wer Strategieberatung, Führungskräfteberatung oder Leadership Coaching sucht, findet hier die Denkwelt hinter der MLI-Praxis.</p>
          <p class="mb-4">Grundlage sind u. a. Jahre der Future of Leadership Initiative, Gespräche mit Vordenker:innen und die Arbeit mit mehr als 130 Führungsteams.</p>
          <div class="mli-ez-cta">
            <div class="mli-ez-cta-primary">
              <a class="btn btn-primary" href="https://www.amazon.de/dp/B08LNMSNSB" target="_blank" rel="noopener">Buch bestellen</a>
              <a class="btn btn-cta-big bg-petrol white" href="https://meetings.hubspot.com/sebastian-morgner" target="_blank" rel="noopener">Gespräch vereinbaren</a>
            </div>
            <p class="mli-ez-cta-links mb-0">
              <a href="/expedition-zukunft/faq/">FAQ zum Buch</a>
              <span aria-hidden="true">·</span>
              <a href="/strategieaktivierung/">Strategieaktivierung</a>
            </p>
          </div>
        </div>
      </div>

      <div class="row mb-5">
        <div class="col-lg-10">
          <h2 class="h3 mb-3">Worum es geht</h2>
          <ul class="mli-ez-list">
            <li><strong>Zufall nutzen</strong> — Optionen schaffen, bei denen Irrtümer geringe Kosten haben.</li>
            <li><strong>Komplexität verstehen</strong> — unterscheiden, wann Best Practices greifen und wann Erkunden nötig ist.</li>
            <li><strong>Mission &amp; Leitbild</strong> — Denken und Motivation auf einen gemeinsamen Auftrag ausrichten.</li>
            <li><strong>Mentale Navigation</strong> — Strategie in den Momenten der Wahrheit im Alltag verankern.</li>
            <li><strong>Teamintelligenz</strong> — die richtigen Gefährten und soziale Dynamiken bewusst nutzen.</li>
          </ul>
        </div>
      </div>

      ${hubExtraHtml()}

      <div class="row mb-5">
        <div class="col-12"><h2 class="h3 mb-4">Themen vertiefen</h2></div>
        ${arts}
      </div>

      <div class="row align-items-center g-4 p-4 mli-ez-author">
        <div class="col-md-3 text-center">
          <img src="${author}" alt="Sebastian Morgner" class="img-fluid rounded-circle mli-ez-author-img">
        </div>
        <div class="col-md-9">
          <h2 class="h4 mb-2">Sebastian Morgner</h2>
          <p class="mb-2">Geschäftsführender Gesellschafter des MLI Leadership Instituts, Leadership-Experte &amp; Strategie-Coach. Autor von <em>Expedition Zukunft</em>, Host des New Leadership Podcasts.</p>
          <p class="mb-0"><a href="/team/">Zum Team</a> · <a href="/newsletter/">Newsletter</a> · <a href="/keynotes-detail-ansicht/expedition-zukunft-abenteuer-transformation/">Keynote zum Thema</a></p>
        </div>
      </div>

      <p class="small text-muted mt-4 mb-0">Hinweis: Die Seiten fassen zentrale Ideen des Buchs für die Praxis zusammen — sie ersetzen nicht die Lektüre. © Ideen und Begriffe: Sebastian Morgner, <em>Expedition Zukunft</em>.</p>
      <script type="application/ld+json">${JSON.stringify(bookLd)}</script>
    </div>
  </div>
</section>
`;
}

function faqInner() {
  const items = FAQS.map((f, i) => {
    const id = `ez-faq-${i}`;
    const firstStop = f.a.indexOf(". ");
    const lead =
      firstStop > 0 ? f.a.slice(0, firstStop + 1) : f.a;
    const rest =
      firstStop > 0 ? f.a.slice(firstStop + 2).trim() : "";
    return `
    <div class="accordion-item">
      <h2 class="accordion-header" id="h-${id}">
        <button class="accordion-button ${i ? "collapsed" : ""}" type="button" data-bs-toggle="collapse" data-bs-target="#${id}" aria-expanded="${i ? "false" : "true"}" aria-controls="${id}">
          ${escapeHtml(f.q)}
        </button>
      </h2>
      <div id="${id}" class="accordion-collapse collapse ${i ? "" : "show"}" aria-labelledby="h-${id}" data-bs-parent="#ezFaq">
        <div class="accordion-body">
          <p class="mb-0"><strong>${escapeHtml(lead)}</strong>${rest ? ` ${escapeHtml(rest)}` : ""}</p>
        </div>
      </div>
    </div>`;
  }).join("\n");

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return `
<section id="layout-content">
  <button class="btn-primary btn backtotop" onclick="window.scrollTo({top: 0, behavior: 'smooth'});"><i class="bi bi-arrow-up"></i></button>
  <div class="container-fluid mli-ez-shell">
    <div class="container mli-ez-wrap py-4 py-lg-5">
      <p class="mb-2"><a href="/expedition-zukunft/">← Expedition Zukunft</a></p>
      <h1 class="rotpink mb-3">FAQ: Expedition Zukunft</h1>
      <p class="lead mb-4">Kurze Antworten auf häufige Fragen — zum Zitieren, Weiterdenken und Anwenden.</p>
      <div class="accordion accordion-flush" id="ezFaq">
        ${items}
      </div>
      <div class="mt-5">
        <a class="btn btn-primary" href="/expedition-zukunft/">Zum Buch-Hub</a>
        <a class="btn btn-cta-big bg-neuro white ms-2" href="/strategieaktivierung/">Strategieaktivierung</a>
      </div>
      <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
    </div>
  </div>
</section>
`;
}

function articleInner(a) {
  const body = ARTICLE_BODIES[a.slug] || "<p></p>";
  const siblings = DATA.articles
    .filter((x) => x.slug !== a.slug)
    .map(
      (x) =>
        `<li><a href="/expedition-zukunft/${x.slug}/">${escapeHtml(x.h1)}</a></li>`
    )
    .join("");

  return `
<section id="layout-content">
  <button class="btn-primary btn backtotop" onclick="window.scrollTo({top: 0, behavior: 'smooth'});"><i class="bi bi-arrow-up"></i></button>
  <div class="container-fluid mli-ez-shell">
    <div class="container mli-ez-wrap py-4 py-lg-5">
      <p class="mb-2"><a href="/expedition-zukunft/">← Expedition Zukunft</a></p>
      <div class="row g-4">
        <div class="col-lg-8">
          <p class="text-uppercase small mb-2" style="letter-spacing:.06em;color:#0d5c63;">Aus dem Buch</p>
          <h1 class="rotpink mb-3">${escapeHtml(a.h1)}</h1>
          <img src="${a.image}" alt="" class="img-fluid mb-4" style="width:100%;max-height:360px;object-fit:cover;">
          <article class="mli-seo-article">
            ${body}
          </article>
          <div class="mt-4 d-flex flex-wrap gap-2">
            <a class="btn btn-primary" href="${a.service}">Passendes MLI-Angebot</a>
            <a class="btn btn-teaser-petrol petrol" href="/expedition-zukunft/faq/">FAQ</a>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="p-3" style="background:#fff;border:1px solid rgba(13,92,99,.12);">
            <img src="${DATA.cover}" alt="Expedition Zukunft Buchcover" class="img-fluid mb-3">
            <p class="small mb-2"><em>Expedition Zukunft</em> — Sebastian Morgner</p>
            <a class="btn btn-primary btn-sm w-100 mb-3" href="/expedition-zukunft/">Zum Buch-Hub</a>
            <h2 class="h6 text-uppercase">Weitere Themen</h2>
            <ul class="small mb-0">${siblings}</ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
`;
}

async function writePage(relDir, meta, inner) {
  const shell = await loadShell();
  const before = setHead(shell.before, meta);
  const html = before + inner + "\n" + shell.after;
  const dir = path.join(PUBLIC, relDir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
  console.log("Wrote", relDir || "/expedition-zukunft/");
}

/** Rebuild Wissen / Knowledge dropdowns; demote top-level Podcast only. */
function rebuildNavDe(html) {
  const wissenMenu = `
                <li role="presentation" class="nav-item dropdown   ">
                        <a class="nav-link dropdown-toggle" id="navbarDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Wissen
            </a>
                            <ul class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                    <li></li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/expedition-zukunft/">
                    Buch: Expedition Zukunft
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/strategie-magazin/">
                    Magazin Tiefgang
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/leadership-stories/">
                    Leadership Stories
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/leadership-know-how/">
                    Leadership Know-how
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/keynotes-und-speaker/">
                    Keynotes &amp; Speaker
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/podcast-2025/">
                    Podcast
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/ressourcen/">
                    Ressourcen
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/newsletter/">
                    Newsletter
                </a>
                    </li>
                </ul>
                    </li>`;

  // Top-level Podcast only (followed by Events) — do not strip Podcast inside Wissen
  let out = html.replace(
    /\s*<li role="presentation" class="nav-item dropdown[^"]*">\s*<a class="nav-link" href="\/podcast-2025\/">\s*Podcast\s*<\/a>\s*<\/li>(\s*<li role="presentation" class="nav-item dropdown[^"]*">\s*<a class="nav-link" href="\/fortbildungen-events-2025\/">)/i,
    "\n$1"
  );

  out = out.replace(
    /\s*<li role="presentation" class="nav-item dropdown[^"]*">\s*<a class="nav-link dropdown-toggle"[^>]*>\s*(?:Leadership Wissen|Wissen)\s*<\/a>[\s\S]*?<\/ul>\s*<\/li>(\s*<li role="presentation" class="nav-item dropdown[^"]*blendout[^"]*">)/i,
    `\n${wissenMenu}\n$1`
  );

  if (out.includes("Leadership Wissen") || !out.includes("Buch: Expedition Zukunft")) {
    out = out.replace(
      /\s*<li role="presentation" class="nav-item dropdown[^"]*">\s*<a class="nav-link dropdown-toggle"[^>]*>\s*(?:Leadership Wissen|Wissen)\s*<\/a>[\s\S]*?<\/ul>\s*<\/li>/i,
      `\n${wissenMenu}\n`
    );
  }

  out = out.replace(
    /(<a class="nav-link" href="\/expedition-zukunft\/">)\s*Expedition Zukunft\s*(<\/a>)/i,
    "$1\n                    Buch: Expedition Zukunft\n                $2"
  );

  return out;
}

function rebuildNavEn(html) {
  const wissenMenu = `
                <li role="presentation" class="nav-item dropdown   ">
                        <a class="nav-link dropdown-toggle" id="navbarDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Knowledge
            </a>
                            <ul class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                    <li></li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/expedition-zukunft/">
                    Book: Expedition Zukunft
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/strategie-magazin/">
                    Magazine Tiefgang
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/en/leadership-stories/">
                    Leadership Stories
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/en/leadership-know-how/">
                    Leadership Know-how
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/en/keynotes-and-speakers/">
                    Keynotes &amp; Speakers
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/en/podcast-2025/">
                    Podcast
                </a>
                    </li>
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/en/resources/">
                    Resources
                </a>
                    </li>
                </ul>
                    </li>`;

  let out = html.replace(
    /\s*<li role="presentation" class="nav-item dropdown[^"]*">\s*<a class="nav-link" href="\/en\/podcast-2025\/">\s*Podcast\s*<\/a>\s*<\/li>(\s*<li role="presentation" class="nav-item dropdown[^"]*">\s*<a class="nav-link" href="\/en\/events\/">)/i,
    "\n$1"
  );
  out = out.replace(
    /\s*<li role="presentation" class="nav-item dropdown[^"]*">\s*<a class="nav-link dropdown-toggle"[^>]*>\s*(?:Leadership Know-How|Knowledge)\s*<\/a>[\s\S]*?<\/ul>\s*<\/li>/i,
    `\n${wissenMenu}\n`
  );
  out = out.replace(
    /(<a class="nav-link" href="\/expedition-zukunft\/">)\s*(?:Expedition Zukunft|Book: Expedition Zukunft)\s*(<\/a>)/i,
    "$1\n                    Book: Expedition Zukunft\n                $2"
  );
  return out;
}

async function walkHtml(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walkHtml(full, out);
    else if (e.name === "index.html") out.push(full);
  }
  return out;
}

async function updateAllNav() {
  const files = await walkHtml(PUBLIC);
  let n = 0;
  for (const file of files) {
    let html = await fs.readFile(file, "utf8");
    const before = html;
    if (file.includes(`${path.sep}en${path.sep}`) || file.endsWith(`${path.sep}en${path.sep}index.html`)) {
      // en pages live under public/en/...
      if (file.includes(`${path.sep}public${path.sep}en${path.sep}`) || file.includes("/public/en/")) {
        html = rebuildNavEn(html);
      } else if (path.relative(PUBLIC, file).startsWith("en" + path.sep) || path.relative(PUBLIC, file) === "en/index.html") {
        html = rebuildNavEn(html);
      } else {
        html = rebuildNavDe(html);
      }
    } else {
      const rel = path.relative(PUBLIC, file);
      if (rel.startsWith("en/") || rel === "en/index.html") html = rebuildNavEn(html);
      else html = rebuildNavDe(html);
    }
    if (html !== before) {
      await fs.writeFile(file, html, "utf8");
      n++;
    }
  }
  console.log(`Updated nav on ${n} pages`);
}

async function main() {
  await writePage("expedition-zukunft", {
    title: DATA.hub.title,
    description: DATA.hub.description,
    canonical: "/expedition-zukunft/",
    bodyClass: DATA.hub.bodyClass,
  }, hubInner());

  await writePage("expedition-zukunft/faq", {
    title: DATA.faq.title,
    description: DATA.faq.description,
    canonical: "/expedition-zukunft/faq/",
    bodyClass: DATA.faq.bodyClass,
  }, faqInner());

  for (const a of DATA.articles) {
    await writePage(`expedition-zukunft/${a.slug}`, {
      title: a.title,
      description: a.description,
      canonical: `/expedition-zukunft/${a.slug}/`,
      bodyClass: `page-expedition-${a.slug}`,
    }, articleInner(a));
  }

  // Minimal CSS for expedition pages (loaded via existing theme; add utility file)
  const cssPath = path.join(PUBLIC, "css", "mli-expedition.css");
  await fs.writeFile(
    cssPath,
    `/* Expedition Zukunft — aligns with MLI petrol / rotpink language */
.mli-ez-shell{
  background:
    radial-gradient(90% 70% at 100% 0%, rgba(13,92,99,.08), transparent 55%),
    radial-gradient(70% 50% at 0% 100%, rgba(196,54,90,.04), transparent 50%),
    linear-gradient(180deg,#f5f7f7 0%,#fff 42%);
}
.mli-ez-wrap{max-width:1100px;}
.mli-ez-wrap .lead{font-size:1.15rem;line-height:1.55;}
.mli-ez-wrap h2{margin-top:1.5rem;}
.mli-ez-eyebrow{
  text-transform:uppercase;
  letter-spacing:.08em;
  font-size:.78rem;
  color:#0d5c63;
  margin-bottom:.5rem;
}
.mli-ez-cover{
  max-width:280px;
  box-shadow:0 14px 36px rgba(13,40,45,.18);
}
.mli-ez-thumb{
  width:100%;
  height:160px;
  object-fit:cover;
}
.mli-ez-list{padding-left:1.1rem;}
.mli-ez-list li{margin-bottom:.45rem;}
.mli-ez-author{background:rgba(13,92,99,.06);}
.mli-ez-author-img{width:140px;height:140px;object-fit:cover;}
.mli-ez-card:hover h3{text-decoration:underline;}
.mli-ez-quote{
  margin:1.25rem 0;
  padding:.9rem 1.1rem;
  border-left:3px solid #c4365a;
  background:rgba(13,92,99,.05);
}
.mli-ez-quote p{margin:0 0 .4rem;font-size:1.05rem;line-height:1.45;}
.mli-ez-quote footer{font-size:.85rem;color:#666;}
.mli-ez-wrap .accordion-button:not(.collapsed){color:#c4365a;background:rgba(13,92,99,.06);box-shadow:none;}
.mli-ez-cta{display:flex;flex-direction:column;align-items:flex-start;gap:.85rem;margin-top:.25rem;}
.mli-ez-cta-primary{display:flex;flex-wrap:wrap;gap:.65rem;align-items:center;}
.mli-ez-cta-primary .btn{margin:0;}
.mli-ez-cta-links{font-size:.95rem;color:#666;}
.mli-ez-cta-links a{color:#0d5c63;text-decoration:none;border-bottom:1px solid transparent;}
.mli-ez-cta-links a:hover{color:#c4365a;border-bottom-color:rgba(196,54,90,.35);}
.mli-ez-cta-links span{margin:0 .45rem;color:#bbb;}
@media (max-width:767.98px){
  .mli-ez-cover{max-width:220px;}
  .mli-ez-cta-primary .btn{width:100%;text-align:center;}
}
`,
    "utf8"
  );

  // Inject expedition CSS link into new pages only
  for (const rel of [
    "expedition-zukunft",
    "expedition-zukunft/faq",
    ...DATA.articles.map((a) => `expedition-zukunft/${a.slug}`),
  ]) {
    const f = path.join(PUBLIC, rel, "index.html");
    let html = await fs.readFile(f, "utf8");
    if (!html.includes("mli-expedition.css")) {
      html = html.replace(
        /<\/head>/i,
        `<link href="/css/mli-expedition.css" rel="stylesheet">\n</head>`
      );
      await fs.writeFile(f, html, "utf8");
    }
  }

  await updateAllNav();

  // sitemap entries
  const sm = path.join(PUBLIC, "sitemap.xml");
  let sitemap = await fs.readFile(sm, "utf8");
  const urls = [
    "https://leadership-munich.org/expedition-zukunft/",
    "https://leadership-munich.org/expedition-zukunft/faq/",
    ...DATA.articles.map(
      (a) => `https://leadership-munich.org/expedition-zukunft/${a.slug}/`
    ),
  ];
  for (const u of urls) {
    if (!sitemap.includes(u)) {
      sitemap = sitemap.replace(
        "</urlset>",
        `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>\n</urlset>`
      );
    }
  }
  await fs.writeFile(sm, sitemap, "utf8");

  // llms.txt
  const llms = path.join(PUBLIC, "llms.txt");
  let ll = await fs.readFile(llms, "utf8");
  if (!ll.includes("expedition-zukunft")) {
    ll += `\n## Expedition Zukunft (book hub)\n- https://leadership-munich.org/expedition-zukunft/\n- https://leadership-munich.org/expedition-zukunft/faq/\n`;
    for (const a of DATA.articles) {
      ll += `- https://leadership-munich.org/expedition-zukunft/${a.slug}/\n`;
    }
    await fs.writeFile(llms, ll, "utf8");
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
