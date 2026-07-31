#!/usr/bin/env node
/**
 * Crawl leadership-munich.org: inventory URLs, save HTML, download assets.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "export");
const BASE = "https://leadership-munich.org";

const SEED = [
  "/",
  "/en/",
  "/stark-in-fuehrung/",
  "/strategieaktivierung/",
  "/leadership-development/",
  "/leadership-coaching-2025/",
  "/leadership-development-fuer-moderne-unternehmen-2025/",
  "/leitbild-und-strategieentwicklung/",
  "/adaptive-organisationsentwicklung-2025/",
  "/strategieumsetzung-2025/",
  "/unser-anspruch/",
  "/team/",
  "/arbeiten-beim-mli/",
  "/podcast-2025/",
  "/keynotes-und-speaker/",
  "/leadership-know-how/",
  "/leadership-stories/",
  "/ressourcen/",
  "/fortbildungen-events-2025/",
  "/kontakt/",
  "/newsletter/",
  "/impressum/",
  "/datenschutz/",
  "/datenschutzerklaerung/",
  "/en/strong-in-leadership/",
  "/en/strategy-activation/",
  "/en/leadership-development/",
  "/en/leadership-coaching-2025/",
  "/en/leadership-development-fuer-moderne-unternehmen-2025/",
  "/en/strategy-development/",
  "/en/adaptive-organisational-development/",
  "/en/strategy-implementation/",
  "/en/our-claim/",
  "/en/team/",
  "/en/careers/",
  "/en/podcast-2025/",
  "/en/keynotes-and-speakers/",
  "/en/leadership-know-how/",
  "/en/leadership-stories/",
  "/en/resources/",
  "/en/events/",
  "/en/contact/",
];

const SKIP_EXT = /\.(jpg|jpeg|png|webp|gif|svg|pdf|css|js|mjs|woff2?|ttf|eot|mp4|mp3|ico|map)(\?|$)/i;
const ASSET_RE =
  /(?:src|href|poster|data-src|content)=["']([^"']+\.(?:jpg|jpeg|png|webp|gif|svg|pdf|css|js|woff2?|ttf|eot|mp4|mp3|ico)(?:\?[^"']*)?)["']/gi;
const CSS_URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;

const seenPages = new Set();
const queue = [];
const pages = [];
const assets = new Set();
const errors = [];

function normalizePath(href) {
  if (!href) return null;
  href = href.trim();
  if (
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:") ||
    href.startsWith("#") ||
    href.startsWith("data:")
  )
    return null;
  if (href.startsWith("//")) href = "https:" + href;
  let url;
  try {
    url = new URL(href, BASE);
  } catch {
    return null;
  }
  if (url.hostname !== "leadership-munich.org") return null;
  let p = url.pathname;
  if (!p.endsWith("/") && !SKIP_EXT.test(p)) p += "/";
  return p;
}

function assetLocalPath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  return path.join(OUT, "assets", clean.replace(/^\//, ""));
}

function pageLocalPath(urlPath) {
  const clean = urlPath === "/" ? "index.html" : urlPath.replace(/^\//, "").replace(/\/$/, "") + "/index.html";
  return path.join(OUT, "pages", clean);
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "MLI-Static-Export/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { html: await res.text(), finalUrl: res.url, status: res.status };
}

async function downloadBinary(urlPath) {
  const url = urlPath.startsWith("http") ? urlPath : BASE + urlPath;
  const local = assetLocalPath(new URL(url).pathname);
  try {
    await fs.access(local);
    return;
  } catch {
    /* download */
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "MLI-Static-Export/1.0" },
  });
  if (!res.ok) {
    errors.push({ asset: urlPath, error: `HTTP ${res.status}` });
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await ensureDir(local);
  await fs.writeFile(local, buf);
}

function collectAssetsFromHtml(html) {
  let m;
  ASSET_RE.lastIndex = 0;
  while ((m = ASSET_RE.exec(html))) {
    const p = normalizeAsset(m[1]);
    if (p) assets.add(p);
  }
  // storage / themes absolute
  const abs = html.matchAll(/https:\/\/leadership-munich\.org(\/(?:storage|themes|combine)\/[^"'?\s]+)/g);
  for (const a of abs) assets.add(a[1].split("?")[0]);
}

function normalizeAsset(href) {
  try {
    const u = new URL(href, BASE);
    if (u.hostname !== "leadership-munich.org") return null;
    return u.pathname;
  } catch {
    return null;
  }
}

async function loadSitemapSeeds() {
  try {
    const { html } = await fetchText(BASE + "/sitemap.xml");
    const locs = [...html.matchAll(/<loc>(.*?)<\/loc>/g)].map((x) => x[1]);
    for (const loc of locs) {
      const p = normalizePath(loc);
      if (p && !SKIP_EXT.test(p)) queue.push(p);
    }
    console.log(`Sitemap URLs: ${locs.length}`);
  } catch (e) {
    console.warn("Sitemap failed:", e.message);
  }
}

async function crawlPage(urlPath) {
  if (seenPages.has(urlPath)) return;
  seenPages.add(urlPath);
  const url = BASE + urlPath;
  process.stdout.write(`Page ${urlPath}\n`);
  try {
    const { html, finalUrl } = await fetchText(url);
    const finalPath = normalizePath(finalUrl) || urlPath;
    const $ = cheerio.load(html);

    const title = $("title").first().text().trim();
    const description = $('meta[name="description"]').attr("content") || "";
    const canonical = $('link[rel="canonical"]').attr("href") || url;

    // Discover links
    $("a[href]").each((_, el) => {
      const p = normalizePath($(el).attr("href"));
      if (!p || SKIP_EXT.test(p)) return;
      if (p.includes("/modules/") || p.includes("/combine/")) return;
      if (!seenPages.has(p)) queue.push(p);
    });

    collectAssetsFromHtml(html);

    // Extract main content region for later Astro use
    const mainHtml =
      $("#layout-content").html() ||
      $("main").html() ||
      $(".page-content").html() ||
      $("body").html() ||
      "";

    const headerHtml = $("#layout-header").html() || $("header").first().html() || "";
    const footerHtml = $("#layout-footer").html() || $("footer").first().html() || "";

    const record = {
      path: finalPath,
      title,
      description,
      canonical,
      lang: finalPath.startsWith("/en/") ? "en" : "de",
      scrapedAt: new Date().toISOString(),
    };
    pages.push(record);

    const outFile = pageLocalPath(finalPath);
    await ensureDir(outFile);
    await fs.writeFile(outFile, html, "utf8");

    const metaFile = outFile.replace(/index\.html$/, "meta.json");
    await fs.writeFile(
      metaFile,
      JSON.stringify({ ...record, headerHtml: undefined }, null, 2)
    );

    // Partial extracts
    const extractDir = path.join(OUT, "extracts", finalPath === "/" ? "home" : finalPath.replace(/^\//, "").replace(/\/$/, ""));
    await fs.mkdir(extractDir, { recursive: true });
    await fs.writeFile(path.join(extractDir, "main.html"), mainHtml || "", "utf8");
    await fs.writeFile(path.join(extractDir, "header.html"), headerHtml || "", "utf8");
    await fs.writeFile(path.join(extractDir, "footer.html"), footerHtml || "", "utf8");
    await fs.writeFile(path.join(extractDir, "meta.json"), JSON.stringify(record, null, 2));
  } catch (e) {
    errors.push({ page: urlPath, error: e.message });
    console.warn(`  ERR ${urlPath}: ${e.message}`);
  }
}

async function downloadCssAndParse(urlPath) {
  await downloadBinary(urlPath);
  const local = assetLocalPath(urlPath);
  try {
    const css = await fs.readFile(local, "utf8");
    let m;
    CSS_URL_RE.lastIndex = 0;
    while ((m = CSS_URL_RE.exec(css))) {
      let ref = m[1].trim();
      if (ref.startsWith("data:")) continue;
      try {
        const abs = new URL(ref, BASE + urlPath);
        if (abs.hostname === "leadership-munich.org") {
          assets.add(abs.pathname);
        }
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  for (const s of SEED) queue.push(s);
  await loadSitemapSeeds();

  while (queue.length) {
    const next = queue.shift();
    if (seenPages.has(next)) continue;
    await crawlPage(next);
  }

  // Theme CSS known entry points
  const themeCss = [
    "/themes/mli-sebastian-mogener/assets/vendor/bootstrap/bootstrap.css",
    "/themes/mli-sebastian-mogener/assets/vendor/bootstrap-icons/bootstrap-icons.css",
    "/themes/mli-sebastian-mogener/assets/css/main-min.css",
    "/themes/mli-sebastian-mogener/assets/css/layout-2025.css",
    "/themes/mli-sebastian-mogener/assets/css/responsive-2025.css",
    "/themes/mli-sebastian-mogener/assets/vendor/jquery.min.js",
    "/themes/mli-sebastian-mogener/assets/vendor/bootstrap/bootstrap.min.js",
    "/themes/mli-sebastian-mogener/assets/js/app.js",
    "/themes/mli-sebastian-mogener/assets/images/mli-favicon.png",
  ];
  for (const t of themeCss) assets.add(t);

  console.log(`\nDownloading ${assets.size} assets...`);
  const assetList = [...assets];
  for (let i = 0; i < assetList.length; i++) {
    const a = assetList[i];
    if (a.endsWith(".css")) await downloadCssAndParse(a);
    else await downloadBinary(a);
    if (i % 25 === 0) process.stdout.write(`  ${i}/${assetList.length}\n`);
  }
  // Second pass for newly discovered from CSS
  for (const a of [...assets]) {
    const local = assetLocalPath(a);
    try {
      await fs.access(local);
    } catch {
      await downloadBinary(a);
    }
  }

  const inventory = {
    base: BASE,
    pageCount: pages.length,
    assetCount: assets.size,
    pages: pages.sort((a, b) => a.path.localeCompare(b.path)),
    assets: [...assets].sort(),
    errors,
    generatedAt: new Date().toISOString(),
  };
  await fs.writeFile(path.join(OUT, "inventory.json"), JSON.stringify(inventory, null, 2));

  // Markdown checklist
  const md = [
    "# MLI Export Inventory",
    "",
    `- Pages: ${pages.length}`,
    `- Assets: ${assets.size}`,
    `- Errors: ${errors.length}`,
    "",
    "## Pages",
    "",
    ...pages
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((p) => `- \`${p.path}\` — ${p.title}`),
    "",
    "## Errors",
    "",
    ...(errors.length ? errors.map((e) => `- ${JSON.stringify(e)}`) : ["- none"]),
    "",
  ].join("\n");
  await fs.writeFile(path.join(OUT, "INVENTORY.md"), md);

  console.log(`\nDone. Pages=${pages.length} Assets=${assets.size} Errors=${errors.length}`);
  console.log(`Wrote ${path.join(OUT, "inventory.json")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
