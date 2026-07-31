#!/usr/bin/env node
/**
 * Generate /strategie-magazin/ hub (Tiefgang) + inject into Wissen nav.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const DATA = JSON.parse(
  await fs.readFile(path.join(ROOT, "src/data/strategie-magazin.json"), "utf8")
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

function hubInner() {
  const teasers = DATA.teasers
    .map(
      (t) => `
      <div class="col-md-4 mb-4">
        <article class="mli-tg-teaser">
          <p class="mli-tg-page">Seite ${t.page}</p>
          <h3 class="h5" style="text-transform:none;">${escapeHtml(t.title)}</h3>
          <p class="small mb-3">${escapeHtml(t.teaser)}</p>
          <a class="mli-tg-teaser-link" href="#download">Im Magazin lesen →</a>
        </article>
      </div>`
    )
    .join("\n");

  const more = DATA.moreArticles
    .map(
      (a) =>
        `<li><span class="mli-tg-page-inline">S. ${a.page}</span> ${escapeHtml(a.title)}</li>`
    )
    .join("\n");

  const pillars = DATA.pillars
    .map(
      (p) => `
      <div class="col-md-4 mb-4">
        <a href="${p.href}" class="text-decoration-none mli-tg-pillar">
          <h3 class="h5 rotpink" style="text-transform:none;">${escapeHtml(p.title)}</h3>
          <p class="small mb-0">${escapeHtml(p.text)}</p>
        </a>
      </div>`
    )
    .join("\n");

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Periodical",
        name: "Tiefgang",
        alternateName: "Tiefgang – Das Magazin für Strategie und Führung im Mittelstand",
        description: DATA.description,
        inLanguage: "de",
        url: "https://leadership-munich.org/strategie-magazin/",
        image: `https://leadership-munich.org${DATA.cover}`,
        publisher: { "@id": "https://leadership-munich.org/#organization" },
        editor: { "@id": "https://leadership-munich.org/#sebastian-morgner" },
      },
      {
        "@type": "PublicationIssue",
        name: `Tiefgang ${DATA.issue}`,
        issueNumber: DATA.issue,
        isPartOf: { "@type": "Periodical", name: "Tiefgang" },
        url: "https://leadership-munich.org/strategie-magazin/",
        image: `https://leadership-munich.org${DATA.cover}`,
        datePublished: "2026-01",
        inLanguage: "de",
      },
      {
        "@type": "Person",
        "@id": "https://leadership-munich.org/#sebastian-morgner",
        name: "Sebastian Morgner",
        jobTitle: "Geschäftsführender Gesellschafter",
        worksFor: { "@id": "https://leadership-munich.org/#organization" },
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
            name: "Strategie-Magazin Tiefgang",
            item: "https://leadership-munich.org/strategie-magazin/",
          },
        ],
      },
    ],
  };

  return `
<section id="layout-content">
  <button class="btn-primary btn backtotop" onclick="window.scrollTo({top: 0, behavior: 'smooth'});"><i class="bi bi-arrow-up"></i></button>
  <div class="container-fluid mli-tg-shell">
    <div class="container mli-tg-wrap py-4 py-lg-5">
      <div class="row align-items-center g-4 mb-5">
        <div class="col-lg-5 text-center text-lg-start">
          <img src="${DATA.cover}" alt="Cover Tiefgang Magazin Ausgabe ${DATA.issue}" class="img-fluid mli-tg-cover">
        </div>
        <div class="col-lg-7">
          <p class="mli-tg-eyebrow">Magazin · Ausgabe ${escapeHtml(DATA.issue)}</p>
          <h1 class="rotpink mb-2">Tiefgang</h1>
          <p class="mli-tg-subtitle mb-3">Das Magazin für Strategie und Führung im Mittelstand</p>
          <p class="lead">Führung im Zeitalter von Künstlicher Intelligenz</p>
          <p class="mb-4">Stoff auf drei Ebenen: Wie aus Strategie gelebte Wirklichkeit wird. Wie wirkungsvolle Führungskultur entsteht. Und wie Sie die eigene Person klüger einsetzen. Herausgegeben von Sebastian Morgner / MLI Leadership Institut.</p>
          <div class="d-flex flex-wrap gap-2">
            <a class="btn btn-primary" href="#download">Magazin herunterladen</a>
            <a class="btn btn-cta-big bg-petrol white" href="#artikel">Artikel entdecken</a>
            <a class="btn btn-teaser-petrol petrol" href="/expedition-zukunft/">Zum Buch</a>
          </div>
        </div>
      </div>

      <div id="download" class="mli-tg-download mb-5">
        <div class="row g-4 align-items-center">
          <div class="col-lg-6">
            <h2 class="h3 mb-3">Ausgabe ${escapeHtml(DATA.issue)} per E-Mail</h2>
            <p class="mb-0">Tragen Sie Ihre E-Mail-Adresse ein und laden Sie das Magazin als PDF herunter. Wir melden uns gelegentlich mit Impulsen zu Führung und Strategie — Abmeldung jederzeit möglich.</p>
          </div>
          <div class="col-lg-6">
            <form class="mli-tg-form" id="mli-tg-download-form" novalidate>
              <div class="form-floating mb-3">
                <input type="email" class="form-control" id="mli-tg-email" name="email" required autocomplete="email" placeholder="name@firma.de">
                <label for="mli-tg-email">E-Mail-Adresse <sup>*</sup></label>
              </div>
              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" value="1" id="mli-tg-privacy" required>
                <label class="form-check-label small" for="mli-tg-privacy">
                  Ich stimme der Verarbeitung meiner Daten gemäß <a href="/datenschutz/" target="_blank" rel="noopener">Datenschutz</a> zu. <sup>*</sup>
                </label>
              </div>
              <button type="submit" class="btn btn-primary">PDF herunterladen</button>
              <p class="small text-muted mt-2 mb-0">Schutzgebühr Print 12&nbsp;€ · Digital kostenlos gegen E-Mail</p>
              <p class="mli-tg-form-msg small mt-2 mb-0" id="mli-tg-form-msg" hidden></p>
            </form>
          </div>
        </div>
      </div>

      <div id="artikel" class="mb-5">
        <h2 class="h3 mb-2">Aus dem Heft</h2>
        <p class="mb-4">Drei Einstiege in Ausgabe ${escapeHtml(DATA.issue)} — die Volltexte finden Sie im Magazin-PDF.</p>
        <div class="row">
          ${teasers}
        </div>
      </div>

      <div class="mb-5">
        <h2 class="h4 mb-3">Weitere Beiträge</h2>
        <ul class="mli-tg-more">
          ${more}
        </ul>
      </div>

      <div class="mb-5">
        <h2 class="h3 mb-4">Drei Ebenen</h2>
        <div class="row">
          ${pillars}
        </div>
      </div>

      <div class="row align-items-center g-4 p-4 mli-tg-author">
        <div class="col-md-3 text-center">
          <img src="${DATA.authorImg}" alt="Sebastian Morgner" class="img-fluid rounded-circle mli-tg-author-img">
        </div>
        <div class="col-md-9">
          <h2 class="h4 mb-2">Herausgeber: Sebastian Morgner</h2>
          <p class="mb-2">Geschäftsführender Gesellschafter des MLI Leadership Instituts, Leadership-Experte &amp; Strategie-Coach. Autor von <em>Expedition Zukunft</em>, Host des New Leadership Podcasts.</p>
          <p class="mb-0"><a href="/team/">Zum Team</a> · <a href="/newsletter/">Newsletter</a> · <a href="/expedition-zukunft/">Buch Expedition Zukunft</a></p>
        </div>
      </div>

      <p class="small text-muted mt-4 mb-0">© MLI Leadership Institut · Magazin <em>Tiefgang</em> Ausgabe ${escapeHtml(DATA.issue)}. Teaser ersetzen nicht die Lektüre des Hefts.</p>
      <script type="application/ld+json">${JSON.stringify(schema)}</script>
      <script>
(function () {
  var form = document.getElementById("mli-tg-download-form");
  if (!form) return;
  var pdf = ${JSON.stringify(DATA.pdf)};
  var msg = document.getElementById("mli-tg-form-msg");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.getElementById("mli-tg-email");
    var privacy = document.getElementById("mli-tg-privacy");
    if (!email.checkValidity() || !privacy.checked) {
      form.reportValidity();
      return;
    }
    try {
      var key = "mli-tg-download";
      var payload = { email: email.value.trim(), at: new Date().toISOString(), issue: ${JSON.stringify(DATA.issue)} };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {}
    var a = document.createElement("a");
    a.href = pdf;
    a.download = "Tiefgang-${DATA.issue.replace("/", "-")}.pdf";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (msg) {
      msg.hidden = false;
      msg.textContent = "Vielen Dank — der Download startet. Prüfen Sie ggf. Ihren Download-Ordner.";
    }
    // Optional: also subscribe via CleverReach (same list as newsletter)
    try {
      var cr = document.createElement("form");
      cr.method = "post";
      cr.action = "https://eu2.cleverreach.com/f/298124-389075/wcs/";
      cr.target = "mli-tg-cr";
      cr.style.display = "none";
      var inp = document.createElement("input");
      inp.type = "hidden";
      inp.name = "email";
      inp.value = email.value.trim();
      cr.appendChild(inp);
      var iframe = document.getElementById("mli-tg-cr");
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.name = "mli-tg-cr";
        iframe.id = "mli-tg-cr";
        iframe.title = "Newsletter";
        iframe.style.display = "none";
        document.body.appendChild(iframe);
      }
      document.body.appendChild(cr);
      cr.submit();
      cr.remove();
    } catch (err2) {}
  });
})();
      </script>
    </div>
  </div>
</section>
`;
}

async function writePage(relDir, meta, inner) {
  const shell = await loadShell();
  const before = setHead(shell.before, meta);
  let html = before + inner + "\n" + shell.after;
  if (!html.includes("mli-strategie-magazin.css")) {
    html = html.replace(
      /<\/head>/i,
      `<link href="/css/mli-strategie-magazin.css" rel="stylesheet">\n</head>`
    );
  }
  const dir = path.join(PUBLIC, relDir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
  console.log("Wrote", relDir);
}

/** Insert Magazin link into existing Wissen menus (idempotent). */
function injectMagazinNavDe(html) {
  if (html.includes('href="/strategie-magazin/"')) return html;
  const item = `
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/strategie-magazin/">
                    Magazin Tiefgang
                </a>
                    </li>`;
  // After FAQ zum Buch
  if (html.includes("/expedition-zukunft/faq/")) {
    return html.replace(
      /(<a class="nav-link" href="\/expedition-zukunft\/faq\/">\s*FAQ zum Buch\s*<\/a>\s*<\/li>)/i,
      `$1${item}`
    );
  }
  // Fallback: after Expedition Zukunft
  return html.replace(
    /(<a class="nav-link" href="\/expedition-zukunft\/">\s*Expedition Zukunft\s*<\/a>\s*<\/li>)/i,
    `$1${item}`
  );
}

function injectMagazinNavEn(html) {
  if (html.includes('href="/strategie-magazin/"')) return html;
  const item = `
                <li role="presentation" class="nav-item dropdown   ">
                            <a class="nav-link" href="/strategie-magazin/">
                    Magazine Tiefgang
                </a>
                    </li>`;
  return html.replace(
    /(<a class="nav-link" href="\/expedition-zukunft\/">\s*Expedition Zukunft\s*<\/a>\s*<\/li>)/i,
    `$1${item}`
  );
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
    const rel = path.relative(PUBLIC, file);
    if (rel.startsWith("en/") || rel === "en/index.html") {
      html = injectMagazinNavEn(html);
    } else {
      html = injectMagazinNavDe(html);
    }
    if (html !== before) {
      await fs.writeFile(file, html, "utf8");
      n++;
    }
  }
  console.log(`Injected Magazin nav on ${n} pages`);
}

async function main() {
  const cssPath = path.join(PUBLIC, "css", "mli-strategie-magazin.css");
  await fs.writeFile(
    cssPath,
    `/* Tiefgang Strategie-Magazin — fits MLI Wissen cluster */
.mli-tg-shell{
  background:
    radial-gradient(80% 60% at 0% 0%, rgba(44,62,80,.10), transparent 55%),
    radial-gradient(70% 50% at 100% 20%, rgba(196,54,90,.05), transparent 50%),
    linear-gradient(180deg,#f3f5f7 0%,#fff 48%);
}
.mli-tg-wrap{max-width:1100px;}
.mli-tg-wrap .lead{font-size:1.15rem;line-height:1.55;}
.mli-tg-eyebrow{
  text-transform:uppercase;
  letter-spacing:.08em;
  font-size:.78rem;
  color:#0d5c63;
  margin-bottom:.5rem;
}
.mli-tg-subtitle{
  text-transform:uppercase;
  letter-spacing:.04em;
  font-size:.95rem;
  color:#2c3e50;
  font-weight:600;
}
.mli-tg-cover{
  max-width:300px;
  box-shadow:0 16px 40px rgba(20,30,45,.22);
  border:1px solid rgba(44,62,80,.12);
}
.mli-tg-download{
  background:linear-gradient(135deg, rgba(13,92,99,.08), rgba(44,62,80,.06));
  border:1px solid rgba(13,92,99,.15);
  padding:1.75rem 1.5rem;
}
.mli-tg-page{
  color:#c4365a;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.06em;
  font-size:.78rem;
  margin-bottom:.35rem;
}
.mli-tg-page-inline{
  color:#c4365a;
  font-weight:700;
  margin-right:.35rem;
}
.mli-tg-teaser{
  height:100%;
  padding-bottom:.5rem;
  border-top:2px solid #c4365a;
  padding-top:1rem;
}
.mli-tg-teaser-link{
  color:#0d5c63;
  font-weight:600;
  text-decoration:none;
}
.mli-tg-teaser-link:hover{text-decoration:underline;}
.mli-tg-more{
  columns:1;
  padding-left:1.1rem;
}
@media (min-width:768px){
  .mli-tg-more{columns:2; column-gap:2.5rem;}
}
.mli-tg-more li{margin-bottom:.55rem; break-inside:avoid;}
.mli-tg-pillar{
  display:block;
  height:100%;
  padding:1rem 0;
  color:inherit;
  border-top:1px solid rgba(13,92,99,.2);
}
.mli-tg-pillar:hover h3{text-decoration:underline;}
.mli-tg-author{background:rgba(13,92,99,.06);}
.mli-tg-author-img{width:140px;height:140px;object-fit:cover;}
.mli-tg-form-msg{color:#0d5c63;font-weight:600;}
@media (max-width:767.98px){
  .mli-tg-cover{max-width:220px;}
}
`,
    "utf8"
  );

  await writePage("strategie-magazin", {
    title: DATA.title,
    description: DATA.description,
    canonical: "/strategie-magazin/",
    bodyClass: "page-strategie-magazin",
  }, hubInner());

  await updateAllNav();

  const sm = path.join(PUBLIC, "sitemap.xml");
  let sitemap = await fs.readFile(sm, "utf8");
  const url = "https://leadership-munich.org/strategie-magazin/";
  if (!sitemap.includes(url)) {
    sitemap = sitemap.replace(
      "</urlset>",
      `  <url><loc>${url}</loc><changefreq>weekly</changefreq></url>\n</urlset>`
    );
    await fs.writeFile(sm, sitemap, "utf8");
  }

  const llms = path.join(PUBLIC, "llms.txt");
  let ll = await fs.readFile(llms, "utf8");
  if (!ll.includes("strategie-magazin")) {
    ll += `\n## Strategie-Magazin Tiefgang\n- https://leadership-munich.org/strategie-magazin/\n`;
    await fs.writeFile(llms, ll, "utf8");
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
