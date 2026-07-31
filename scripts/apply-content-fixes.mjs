#!/usr/bin/env node
/**
 * One-shot content fixes: typos, slug rename, empty titles, privacy footer link.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const TITLE_FALLBACKS = {
  "/podcast-2025/": {
    de: "New Leadership Podcast | MLI Leadership Institut",
    en: "New Leadership Podcast | MLI Leadership Institute",
  },
  "/fortbildungen-events-2025/": {
    de: "Fortbildungen & Events | MLI Leadership Institut",
    en: "Training & Events | MLI Leadership Institute",
  },
  "/en/events/": {
    de: "Events | MLI Leadership Institute",
    en: "Events | MLI Leadership Institute",
  },
  "/en/podcast-2025/": {
    de: "New Leadership Podcast | MLI Leadership Institute",
    en: "New Leadership Podcast | MLI Leadership Institute",
  },
  "/leitbild-und-strategieentwicklung/": {
    de: "Leitbild- und Strategieentwicklung | MLI Leadership Institut",
    en: "Strategy Development | MLI Leadership Institute",
  },
  "/en/strategy-development/": {
    de: "Strategy Development | MLI Leadership Institute",
    en: "Strategy Development | MLI Leadership Institute",
  },
  "/apadtive-organisationsentwicklung-2025/": {
    de: "Adaptive Organisationsentwicklung | MLI Leadership Institut",
    en: "Adaptive Organisational Development | MLI Leadership Institute",
  },
  "/adaptive-organisationsentwicklung-2025/": {
    de: "Adaptive Organisationsentwicklung | MLI Leadership Institut",
    en: "Adaptive Organisational Development | MLI Leadership Institute",
  },
  "/en/adaptive-organisational-development/": {
    de: "Adaptive Organisational Development | MLI Leadership Institute",
    en: "Adaptive Organisational Development | MLI Leadership Institute",
  },
  "/leadership-development-fuer-moderne-unternehmen-2025/": {
    de: "Leadership Programm für moderne Unternehmen | MLI",
    en: "Leadership Programme for Modern Companies | MLI",
  },
  "/en/leadership-development-fuer-moderne-unternehmen-2025/": {
    de: "Leadership Programme for Modern Companies | MLI",
    en: "Leadership Programme for Modern Companies | MLI",
  },
  "/explorative-strategieentwicklung-2025/": {
    de: "Explorative Strategieentwicklung | MLI Leadership Institut",
    en: "Exploratory Strategy Development | MLI Leadership Institute",
  },
  "/en/exploratory-strategy-development/": {
    de: "Exploratory Strategy Development | MLI Leadership Institute",
    en: "Exploratory Strategy Development | MLI Leadership Institute",
  },
  "/agile-strategieumsetzung-2025/": {
    de: "Agile Strategieumsetzung | MLI Leadership Institut",
    en: "Agile Strategy Implementation | MLI Leadership Institute",
  },
  "/ammersee-leadership-summit-2026/": {
    de: "Ammersee Leadership Summit 2026 | MLI",
    en: "Ammersee Leadership Summit 2026 | MLI",
  },
  "/en/ammersee-leadership-summit-2026/": {
    de: "Ammersee Leadership Summit 2026 | MLI",
    en: "Ammersee Leadership Summit 2026 | MLI",
  },
  "/powerful-leadership-in-8-wochen-zu-innerer-staerke-und-lebensfreude/": {
    de: "Powerful Leadership – 8 Wochen | MLI",
    en: "Powerful Leadership – 8 Weeks | MLI",
  },
  "/en/powerful-leadership-in-8-wochen-zu-innerer-staerke-und-lebensfreude/": {
    de: "Powerful Leadership – 8 Weeks | MLI",
    en: "Powerful Leadership – 8 Weeks | MLI",
  },
  "/okr-coaching-leadership-sprints-mit-okr/": {
    de: "OKR Coaching & Leadership Sprints | MLI",
    en: "OKR Coaching & Leadership Sprints | MLI",
  },
  "/en/okr-coaching-leadership-sprints-mit-okr/": {
    de: "OKR Coaching & Leadership Sprints | MLI",
    en: "OKR Coaching & Leadership Sprints | MLI",
  },
  "/strategie-coaching-top-executive-coaching/": {
    de: "Strategie-Coaching & Top Executive Coaching | MLI",
    en: "Strategy Coaching & Top Executive Coaching | MLI",
  },
  "/en/strategie-coaching-top-executive-coaching/": {
    de: "Strategy Coaching & Top Executive Coaching | MLI",
    en: "Strategy Coaching & Top Executive Coaching | MLI",
  },
  "/agile-meets-leadership-ein-exklusives-angebot-fuer-fuehrungsteams-in-berlin/": {
    de: "Agile meets Leadership – Berlin | MLI",
    en: "Agile meets Leadership – Berlin | MLI",
  },
  "/en/agile-meets-leadership-ein-exklusives-angebot-fuer-fuehrungsteams-in-berlin/": {
    de: "Agile meets Leadership – Berlin | MLI",
    en: "Agile meets Leadership – Berlin | MLI",
  },
  "/neurosoziale-fuehrung-webinar/": {
    de: "Neurosoziale Führung Webinar | MLI",
    en: "Neurosocial Leadership Webinar | MLI",
  },
  "/dr-david-bausch/": {
    de: "Dr. David Bausch | MLI Leadership Institut",
    en: "Dr. David Bausch | MLI Leadership Institute",
  },
};

async function walkHtml(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walkHtml(full, out);
    else if (e.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function pathFromFile(file) {
  let rel = path.relative(PUBLIC, file).replace(/\\/g, "/");
  if (rel === "index.html") return "/";
  return "/" + rel.replace(/index\.html$/, "");
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function renameAdaptiveSlug() {
  const oldDir = path.join(PUBLIC, "apadtive-organisationsentwicklung-2025");
  const newDir = path.join(PUBLIC, "adaptive-organisationsentwicklung-2025");
  if (await exists(oldDir)) {
    if (await exists(newDir)) {
      await fs.rm(newDir, { recursive: true, force: true });
    }
    await fs.rename(oldDir, newDir);
    console.log("Renamed folder apadtive → adaptive");
  }

  const files = await walkHtml(PUBLIC);
  let n = 0;
  for (const file of files) {
    let html = await fs.readFile(file, "utf8");
    const next = html
      .replaceAll("/apadtive-organisationsentwicklung-2025/", "/adaptive-organisationsentwicklung-2025/")
      .replaceAll("/apadtive-organisationsentwicklung-2025", "/adaptive-organisationsentwicklung-2025");
    if (next !== html) {
      await fs.writeFile(file, next, "utf8");
      n++;
    }
  }
  console.log(`Updated apadtive links in ${n} files`);
}

async function fixTypos() {
  const files = await walkHtml(PUBLIC);
  let n = 0;
  for (const file of files) {
    let html = await fs.readFile(file, "utf8");
    const next = html
      .replaceAll("Vereinbaren SIe", "Vereinbaren Sie")
      .replaceAll("SIe direkt", "Sie direkt")
      .replaceAll("Vereinbaren Sie direkt einen unverbindlichen Termin mit mir", "Vereinbaren Sie direkt einen unverbindlichen Termin mit mir");
    // also fix common EN leftovers if obvious on DE pages — skip broad EN/DE for now
    if (next !== html) {
      await fs.writeFile(file, next, "utf8");
      n++;
    }
  }
  console.log(`Typo fixes in ${n} files`);
}

async function fixEmptyTitles() {
  const files = await walkHtml(PUBLIC);
  let n = 0;
  for (const file of files) {
    const urlPath = pathFromFile(file);
    let html = await fs.readFile(file, "utf8");
    const $ = cheerio.load(html);
    const titleText = ($("title").first().text() || "").trim();
    if (titleText) continue;

    const lang = urlPath.startsWith("/en/") ? "en" : "de";
    const h1 = ($("h1").first().text() || "").replace(/\s+/g, " ").trim();
    const fallback = TITLE_FALLBACKS[urlPath];
    let title =
      (fallback && fallback[lang]) ||
      (h1
        ? `${h1} | MLI Leadership Institut`
        : urlPath
            .replace(/^\/en\//, "")
            .replace(/^\/|\/$/g, "")
            .split("/")
            .pop()
            ?.replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()) + " | MLI Leadership Institut");

    if ($("title").length) $("title").first().text(title);
    else $("head").prepend(`<title>${title}</title>`);

    const metaTitle = $('meta[name="title"]');
    if (metaTitle.length) metaTitle.attr("content", title);
    else $("head").append(`<meta name="title" content="${title.replace(/"/g, "&quot;")}">`);

    let desc = ($('meta[name="description"]').attr("content") || "").trim();
    if (!desc) {
      const p = ($("#layout-content p").first().text() || $("p").first().text() || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160);
      desc =
        p ||
        (lang === "en"
          ? "MLI Leadership Institute – strategy activation and leadership development."
          : "MLI Leadership Institut – Strategieaktivierung und Führungskräfteentwicklung.");
      if ($('meta[name="description"]').length) {
        $('meta[name="description"]').attr("content", desc);
      } else {
        $("head").append(`<meta name="description" content="${desc.replace(/"/g, "&quot;")}">`);
      }
    }

    // canonical if empty-ish
    const canon = $('link[rel="canonical"]');
    if (canon.length && !canon.attr("href")) {
      canon.attr("href", `https://leadership-munich.org${urlPath}`);
    }

    await fs.writeFile(file, $.html(), "utf8");
    n++;
    console.log("title:", urlPath, "→", title.slice(0, 70));
  }
  console.log(`Filled titles on ${n} pages`);
}

async function injectPrivacyFooter() {
  const files = await walkHtml(PUBLIC);
  const btnDe =
    '<li class="list-inline-item"><button type="button" class="mli-open-privacy" style="background:none;border:none;padding:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;">Cookie-Einstellungen</button></li>';
  const btnEn =
    '<li class="list-inline-item"><button type="button" class="mli-open-privacy" style="background:none;border:none;padding:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;">Cookie settings</button></li>';
  let n = 0;
  for (const file of files) {
    let html = await fs.readFile(file, "utf8");
    if (html.includes("mli-open-privacy")) continue;
    const urlPath = pathFromFile(file);
    const btn = urlPath.startsWith("/en/") ? btnEn : btnDe;
    let next = html;
    if (/DATENSCHUTZ<\/a>\s*<\/li>/i.test(html)) {
      next = html.replace(/(DATENSCHUTZ<\/a>\s*<\/li>)/i, `$1\n${btn}`);
    } else if (/Privacy Policy<\/a>\s*<\/li>/i.test(html)) {
      next = html.replace(/(Privacy Policy<\/a>\s*<\/li>)/i, `$1\n${btn}`);
    } else if (/href="\/datenschutzerklaerung\/"/i.test(html)) {
      next = html.replace(
        /(<a[^>]*href="\/datenschutzerklaerung\/"[^>]*>[^<]*<\/a>)/i,
        `$1\n${btn}`
      );
    } else {
      continue;
    }
    if (next !== html) {
      await fs.writeFile(file, next, "utf8");
      n++;
    }
  }
  console.log(`Privacy footer link added to ${n} pages`);
}

async function polishKeynoteExtras() {
  const listing = path.join(PUBLIC, "keynotes-und-speaker", "index.html");
  if (!(await exists(listing))) return;
  let html = await fs.readFile(listing, "utf8");
  const $ = cheerio.load(html);
  const extras = $("[data-mli-extra='1']");
  if (!extras.length) {
    console.log("No keynote extras to polish");
    return;
  }

  const enrich = {
    "fuehrung-und-soziale-dynamiken": {
      title: "Führung und Soziale Dynamiken",
      desc: "Wie soziale Dynamiken Leistung und Zusammenarbeit in Führungsteams prägen – und was Leader daraus machen können.",
    },
    "leadership-und-followership": {
      title: "Leadership und Followership",
      desc: "Warum wirksame Führung Followership braucht – Impulse für moderne Führungsrollen.",
    },
  };

  extras.each((_, el) => {
    const $el = $(el);
    const href = $el.find("a").first().attr("href") || "";
    const slug = href.split("/").filter(Boolean).pop();
    const info = enrich[slug];
    if (!info) return;
    $el.find("h3").first().text(info.title);
    const $p = $el.find("p").first();
    if ($p.length) $p.text(info.desc);
    else $el.find("h3").first().after(`<p>${info.desc}</p>`);
  });

  await fs.writeFile(listing, $.html(), "utf8");
  console.log("Polished keynote extra cards");
}

async function updateRedirects() {
  const redirectsPath = path.join(PUBLIC, "_redirects");
  let text = await fs.readFile(redirectsPath, "utf8");
  const lines = [
    "/apadtive-organisationsentwicklung-2025/ /adaptive-organisationsentwicklung-2025/ 301",
    "/apadtive-organisationsentwicklung-2025 /adaptive-organisationsentwicklung-2025/ 301",
  ];
  for (const line of lines) {
    if (!text.includes(line.split(" ")[0] + " ")) {
      text = text.trimEnd() + "\n" + line + "\n";
    }
  }
  await fs.writeFile(redirectsPath, text, "utf8");

  const nginxPath = path.join(ROOT, "deploy", "nginx-mli.conf");
  let nginx = await fs.readFile(nginxPath, "utf8");
  if (!nginx.includes("apadtive-organisationsentwicklung")) {
    const block = `
location = /apadtive-organisationsentwicklung-2025 { return 301 /adaptive-organisationsentwicklung-2025/; }
location = /apadtive-organisationsentwicklung-2025/ { return 301 /adaptive-organisationsentwicklung-2025/; }
`;
    nginx = nginx.replace("location / {", block + "\nlocation / {");
    await fs.writeFile(nginxPath, nginx, "utf8");
  }
  console.log("Redirects updated");
}

async function main() {
  await renameAdaptiveSlug();
  await fixTypos();
  await fixEmptyTitles();
  await injectPrivacyFooter();
  await polishKeynoteExtras();
  await updateRedirects();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
