#!/usr/bin/env node
/**
 * SEO / LLM readability pass for v2 builds (DE-first).
 * Mutates HTML in a target directory (typically dist-v2/) before BASE_PATH rewrite.
 *
 * - Absolute canonical + Open Graph / Twitter
 * - hreflang + x-default (DE)
 * - Organization / WebSite / BreadcrumbList JSON-LD (+ Article on stories)
 * - <main> landmark; home H1 from existing hero wording
 * - Meta overrides; noindex for thin utility paths
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SEO = JSON.parse(
  await fs.readFile(path.join(ROOT, "src/data/seo.json"), "utf8")
);

const SITE = (process.env.SEO_SITE_URL || SEO.siteUrl).replace(/\/+$/, "");

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (e.name === "index.html") out.push(full);
  }
  return out;
}

function pagePathFromFile(file, rootDir) {
  const rel = path.relative(rootDir, path.dirname(file)).split(path.sep).join("/");
  if (!rel || rel === ".") return "/";
  return `/${rel.replace(/\/+$/, "")}/`;
}

function absUrl(pagePath) {
  if (pagePath === "/") return `${SITE}/`;
  return `${SITE}${pagePath.startsWith("/") ? pagePath : `/${pagePath}`}`;
}

function buildHreflangMap(allPaths) {
  const set = new Set(allPaths);
  const map = new Map(); // path -> { de, en }

  const extras = SEO.hreflangExtra || {};
  for (const [de, en] of Object.entries(extras)) {
    if (set.has(de) && set.has(en)) {
      map.set(de, { de, en });
      map.set(en, { de, en });
    }
  }

  for (const p of allPaths) {
    if (map.has(p)) continue;
    if (p === "/en/" || p.startsWith("/en/")) {
      const de = p === "/en/" ? "/" : p.replace(/^\/en/, "") || "/";
      const deNorm = de.endsWith("/") ? de : `${de}/`;
      if (set.has(deNorm)) {
        map.set(p, { de: deNorm, en: p });
        map.set(deNorm, { de: deNorm, en: p });
      }
    } else {
      const en = p === "/" ? "/en/" : `/en${p}`;
      if (set.has(en)) {
        map.set(p, { de: p, en });
        map.set(en, { de: p, en });
      }
    }
  }
  return map;
}

function upsertMeta($, attr, key, content) {
  if (!content) return;
  const sel = attr === "property"
    ? `meta[property="${key}"]`
    : `meta[name="${key}"]`;
  let el = $(sel).first();
  if (el.length) el.attr("content", content);
  else $("head").append(`\n<meta ${attr}="${key}" content="${escapeAttr(content)}">`);
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function setTitle($, title) {
  if (!title) return;
  if ($("title").length) $("title").text(title);
  else $("head").prepend(`<title>${title}</title>`);
  upsertMeta($, "name", "title", title);
}

function ensureCanonical($, pagePath) {
  const href = absUrl(pagePath);
  let link = $('link[rel="canonical"]').first();
  if (link.length) link.attr("href", href);
  else $("head").append(`\n<link rel="canonical" href="${href}">`);
  return href;
}

function injectHreflang($, pair) {
  $('link[rel="alternate"][hreflang]').remove();
  if (!pair) return;
  const tags = [
    `<link rel="alternate" hreflang="de" href="${absUrl(pair.de)}">`,
    `<link rel="alternate" hreflang="en" href="${absUrl(pair.en)}">`,
    `<link rel="alternate" hreflang="x-default" href="${absUrl(pair.de)}">`,
  ];
  const can = $('link[rel="canonical"]').first();
  if (can.length) can.after("\n" + tags.join("\n"));
  else $("head").append("\n" + tags.join("\n"));
}

function pickOgImage($) {
  const og = $('meta[property="og:image"]').attr("content");
  if (og) {
    if (og.startsWith("http")) return og;
    if (og.startsWith("/")) return `${SITE}${og}`;
  }
  const img = $("#layout-content img[src], .page-content img[src], img.navbar-logo")
    .filter((_, el) => {
      const s = $(el).attr("src") || "";
      return s.includes("/storage/") && !s.includes("LinkedIn");
    })
    .first()
    .attr("src");
  if (img) {
    if (img.startsWith("http")) return img;
    if (img.startsWith("/")) return `${SITE}${img}`;
  }
  return SEO.organization.logo;
}

function injectSocial($, pagePath, title, description) {
  const url = absUrl(pagePath);
  const image = pickOgImage($);
  upsertMeta($, "property", "og:type", pagePath.includes("/leadership-stories/") && pagePath !== "/leadership-stories/" && pagePath !== "/en/leadership-stories/" ? "article" : "website");
  upsertMeta($, "property", "og:site_name", SEO.organization.name);
  upsertMeta($, "property", "og:locale", pagePath.startsWith("/en/") ? "en_US" : "de_DE");
  upsertMeta($, "property", "og:url", url);
  upsertMeta($, "property", "og:title", title);
  upsertMeta($, "property", "og:description", description || title);
  upsertMeta($, "property", "og:image", image);
  upsertMeta($, "name", "twitter:card", "summary_large_image");
  upsertMeta($, "name", "twitter:title", title);
  upsertMeta($, "name", "twitter:description", description || title);
  upsertMeta($, "name", "twitter:image", image);
}

function injectJsonLd($, pagePath, title, description) {
  $('script[type="application/ld+json"][data-mli-seo]').remove();

  const graphs = [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: SEO.organization.name,
      legalName: SEO.organization.legalName,
      url: SEO.organization.url,
      logo: SEO.organization.logo,
      sameAs: SEO.organization.sameAs,
      address: SEO.organization.address,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: `${SITE}/`,
      name: SEO.organization.name,
      inLanguage: ["de", "en"],
      publisher: { "@id": `${SITE}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${absUrl(pagePath)}#webpage`,
      url: absUrl(pagePath),
      name: title,
      description: description || undefined,
      isPartOf: { "@id": `${SITE}/#website` },
      about: { "@id": `${SITE}/#organization` },
      inLanguage: pagePath.startsWith("/en/") ? "en" : "de",
    },
  ];

  // Breadcrumbs from visible list if present
  const crumbs = [];
  $("ul.breadcrumb li").each((i, li) => {
    const a = $(li).find("a").first();
    const name = (a.text() || $(li).text() || "").replace(/\s+/g, " ").trim();
    let href = a.attr("href") || "";
    if (!name) return;
    if (href.startsWith("/")) href = absUrl(href.endsWith("/") || href === "/" ? (href === "/" ? "/" : href.replace(/\/?$/, "/")) : `${href}/`);
    else if (!href.startsWith("http")) href = absUrl(pagePath);
    crumbs.push({
      "@type": "ListItem",
      position: crumbs.length + 1,
      name,
      item: href,
    });
  });
  if (crumbs.length) {
    graphs.push({
      "@type": "BreadcrumbList",
      itemListElement: crumbs,
    });
  }

  const isStory =
    /\/leadership-stories\/.+/.test(pagePath) &&
    !pagePath.endsWith("/leadership-stories/");
  if (isStory) {
    const h1 = $("h1").first().text().replace(/\s+/g, " ").trim() || title;
    graphs.push({
      "@type": "Article",
      headline: h1,
      name: title,
      description: description || undefined,
      mainEntityOfPage: absUrl(pagePath),
      author: { "@type": "Organization", name: SEO.organization.name },
      publisher: {
        "@type": "Organization",
        name: SEO.organization.name,
        logo: { "@type": "ImageObject", url: SEO.organization.logo },
      },
      image: pickOgImage($),
      inLanguage: pagePath.startsWith("/en/") ? "en" : "de",
    });
  }

  const payload = {
    "@context": "https://schema.org",
    "@graph": graphs,
  };
  $("head").append(
    `\n<script type="application/ld+json" data-mli-seo>${JSON.stringify(payload)}</script>`
  );
}

function ensureMain($) {
  if ($("main").length) return;
  const content = $("#layout-content");
  if (content.length) {
    content.attr("role", content.attr("role") || "main");
    // cheerio can't rename easily in all versions — wrap inner
    const html = content.html();
    content.empty();
    content.append(`<main id="mli-main" class="mli-seo-main">${html}</main>`);
    return;
  }
  const pc = $(".page-content").first();
  if (pc.length && !pc.closest("main").length) {
    pc.wrap('<main id="mli-main" class="mli-seo-main"></main>');
  }
}

function ensureHomeH1($, pagePath) {
  if (pagePath !== "/" && pagePath !== "/en/") return;
  if ($("h1").length) return;

  const prefer =
    pagePath === "/en/"
      ? ["Strong in leadership", "Strategy"]
      : ["Stark in Führung", "Strategieaktivierung"];

  let target = null;
  $("h2.slide-head-top").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (!target && prefer.some((p) => t.includes(p))) target = el;
  });
  if (!target) target = $("h2.slide-head-top").first().get(0);
  if (!target) {
    const label =
      pagePath === "/en/"
        ? "Strategy Consulting for Companies"
        : "Strategieberatung für Unternehmen";
    $("#layout-content").prepend(
      `<h1 class="mli-seo-h1" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">${label}</h1>`
    );
    return;
  }

  const $t = $(target);
  const cls = $t.attr("class") || "";
  const style = $t.attr("style") || "";
  const html = $t.html();
  $t.replaceWith(`<h1 class="${cls}" style="${style}">${html}</h1>`);

  // Demote duplicate mobile/desktop twin with same text
  const text = $("<div>").html(html).text().replace(/\s+/g, " ").trim();
  $("h2.slide-head-top").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t === text) {
      const $el = $(el);
      $el.replaceWith(
        `<p class="${$el.attr("class") || ""}" style="${$el.attr("style") || ""}">${$el.html()}</p>`
      );
    }
  });
}

function wrapStoryArticle($, pagePath) {
  const isStory =
    /\/leadership-stories\/.+/.test(pagePath) &&
    !pagePath.endsWith("/leadership-stories/");
  if (!isStory || $("article").length) return;
  const main = $("main#mli-main");
  if (main.length) {
    const html = main.html();
    main.html(`<article class="mli-seo-article">${html}</article>`);
  }
}

function applyMetaOverrides($, pagePath) {
  const o = (SEO.metaOverrides || {})[pagePath];
  if (!o) return;
  if (o.title) setTitle($, o.title);
  if (o.description) upsertMeta($, "name", "description", o.description);
}

function applyNoindex($, pagePath) {
  const list = SEO.noindexPaths || [];
  if (!list.includes(pagePath)) return;
  upsertMeta($, "name", "robots", "noindex, follow");
}

function improveEmptyDescription($, pagePath) {
  const desc = $('meta[name="description"]').attr("content") || "";
  if (desc.trim()) return;
  const h1 = $("h1").first().text().replace(/\s+/g, " ").trim();
  const title = $("title").text().replace(/\s+/g, " ").trim();
  const fallback =
    h1 ||
    title.split("|")[0].trim() ||
    (pagePath.startsWith("/en/")
      ? "MLI Leadership Institute — leadership and strategy."
      : "MLI Leadership Institut — Leadership und Strategie.");
  upsertMeta($, "name", "description", fallback.slice(0, 160));
}

function fixHtmlLang($, pagePath) {
  if (pagePath === "/en/" || pagePath.startsWith("/en/")) {
    $("html").attr("lang", "en");
  } else {
    $("html").attr("lang", "de");
  }
}

async function processFile(file, rootDir, hreflangMap) {
  const pagePath = pagePathFromFile(file, rootDir);
  const raw = await fs.readFile(file, "utf8");
  const $ = cheerio.load(raw, { decodeEntities: false });

  fixHtmlLang($, pagePath);
  applyMetaOverrides($, pagePath);
  applyNoindex($, pagePath);

  let title = $("title").text().replace(/\s+/g, " ").trim();
  if (!title) {
    title =
      $("h1").first().text().replace(/\s+/g, " ").trim() ||
      SEO.organization.name;
    setTitle($, title);
  }

  improveEmptyDescription($, pagePath);
  const description = $('meta[name="description"]').attr("content") || "";

  ensureCanonical($, pagePath);
  injectHreflang($, hreflangMap.get(pagePath));
  injectSocial($, pagePath, title, description);
  ensureHomeH1($, pagePath);
  ensureMain($);
  wrapStoryArticle($, pagePath);
  injectJsonLd($, pagePath, title, description);

  await fs.writeFile(file, $.html(), "utf8");
  return pagePath;
}

async function main() {
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf("--dir");
  const target = path.resolve(ROOT, dirIdx >= 0 ? args[dirIdx + 1] : "dist-v2");

  console.log(`SEO v2 pass on ${target} (site=${SITE})`);
  const files = await walk(target);
  const paths = files.map((f) => pagePathFromFile(f, target));
  const hreflangMap = buildHreflangMap(paths);

  let n = 0;
  for (const file of files) {
    await processFile(file, target, hreflangMap);
    n++;
  }
  console.log(`SEO-enhanced ${n} pages; hreflang pairs≈${Math.floor(hreflangMap.size / 2)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
