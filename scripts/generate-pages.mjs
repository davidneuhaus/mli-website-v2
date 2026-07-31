#!/usr/bin/env node
/**
 * Transform exported October CMS HTML into cleaned static pages under public/,
 * sync assets, and emit redirects + manifest for Astro.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXPORT = path.join(ROOT, "export");
const PUBLIC = path.join(ROOT, "public");
const DATA = path.join(ROOT, "src", "data");

const CONTACT_FORM_DE = `
<form id="mli-contact-form" class="mli-contact-form" action="/api/contact.php" method="post" novalidate>
  <div id="mli-contact-flash" class="alert d-none" role="status"></div>
  <div class="row">
    <div class="col-lg-6" style="padding:0 10px;">
      <div class="form-group form-floating mb-3">
        <input type="text" id="name" name="name" class="form-control no-outline" required autocomplete="organization name">
        <label for="name">Firma, Name <sup>*</sup></label>
      </div>
      <div class="form-group form-floating mb-3">
        <input type="text" id="phone" name="phone" class="form-control no-outline" autocomplete="tel">
        <label for="phone">Telefonnummer</label>
      </div>
    </div>
    <div class="col-lg-6" style="padding:0 10px;">
      <div class="form-group form-floating mb-3">
        <input type="email" id="email" name="email" class="form-control no-outline" required autocomplete="email">
        <label for="email">Email <sup>*</sup></label>
      </div>
    </div>
  </div>
  <div class="form-group form-floating mb-3">
    <input type="text" id="subject" name="subject" class="form-control no-outline" required>
    <label for="subject">Betreff <sup>*</sup></label>
  </div>
  <div class="form-group form-floating mb-3">
    <textarea id="comments" class="form-control no-outline" name="comments" style="height:125px;" required></textarea>
    <label for="comments">Nachricht <sup>*</sup></label>
  </div>
  <div class="form-group pb-3">
    <input type="checkbox" id="privacy" name="privacy" required>
    <label for="privacy">Ich habe die <a href="/datenschutzerklaerung/">Datenschutzerklärung</a> gelesen und verstanden<sup>*</sup></label>
  </div>
  <div class="mli-hp" aria-hidden="true" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;">
    <label for="website">Website</label>
    <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
  </div>
  <button type="submit" class="btn btn-primary btn-lg btn-pill no-outline">Absenden</button>
</form>
`;

const CONTACT_FORM_EN = `
<form id="mli-contact-form" class="mli-contact-form" action="/api/contact.php" method="post" novalidate>
  <div id="mli-contact-flash" class="alert d-none" role="status"></div>
  <div class="row">
    <div class="col-lg-6" style="padding:0 10px;">
      <div class="form-group form-floating mb-3">
        <input type="text" id="name" name="name" class="form-control no-outline" required autocomplete="organization name">
        <label for="name">Company, Name <sup>*</sup></label>
      </div>
      <div class="form-group form-floating mb-3">
        <input type="text" id="phone" name="phone" class="form-control no-outline" autocomplete="tel">
        <label for="phone">Phone</label>
      </div>
    </div>
    <div class="col-lg-6" style="padding:0 10px;">
      <div class="form-group form-floating mb-3">
        <input type="email" id="email" name="email" class="form-control no-outline" required autocomplete="email">
        <label for="email">Email <sup>*</sup></label>
      </div>
    </div>
  </div>
  <div class="form-group form-floating mb-3">
    <input type="text" id="subject" name="subject" class="form-control no-outline" required>
    <label for="subject">Subject <sup>*</sup></label>
  </div>
  <div class="form-group form-floating mb-3">
    <textarea id="comments" class="form-control no-outline" name="comments" style="height:125px;" required></textarea>
    <label for="comments">Message <sup>*</sup></label>
  </div>
  <div class="form-group pb-3">
    <input type="checkbox" id="privacy" name="privacy" required>
    <label for="privacy">I have read and understood the <a href="/datenschutzerklaerung/">privacy policy</a><sup>*</sup></label>
  </div>
  <div class="mli-hp" aria-hidden="true" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;">
    <label for="website">Website</label>
    <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
  </div>
  <input type="hidden" name="lang" value="en">
  <button type="submit" class="btn btn-primary btn-lg btn-pill no-outline">Send</button>
</form>
`;

const HUBSPOT_WHITEPAPER_DE = `
<div class="mli-hubspot-whitepaper border rounded p-4 bg-white">
  <h3 class="h4 mb-3">Whitepaper herunterladen</h3>
  <p class="mb-3">Bitte nutzen Sie das HubSpot-Formular, um das Whitepaper zu erhalten. Ersetzen Sie diesen Platzhalter mit Ihrem HubSpot-Form-Embed (Portal-ID + Form-ID).</p>
  <div class="hs-form-frame" data-region="eu1" data-form-id="REPLACE_WITH_HUBSPOT_FORM_ID" data-portal-id="REPLACE_WITH_HUBSPOT_PORTAL_ID"></div>
  <p class="small text-muted mt-3 mb-0">Konfiguration: setzen Sie die IDs in <code>src/data/hubspot.json</code> und regenerieren Sie die Seiten, oder ersetzen Sie dieses Markup manuell.</p>
</div>
`;

const HUBSPOT_WHITEPAPER_EN = `
<div class="mli-hubspot-whitepaper border rounded p-4 bg-white">
  <h3 class="h4 mb-3">Download whitepaper</h3>
  <p class="mb-3">Use the HubSpot form below to receive the whitepaper. Replace this placeholder with your HubSpot form embed (portal ID + form ID).</p>
  <div class="hs-form-frame" data-region="eu1" data-form-id="REPLACE_WITH_HUBSPOT_FORM_ID" data-portal-id="REPLACE_WITH_HUBSPOT_PORTAL_ID"></div>
</div>
`;

const REDIRECTS = [
  ["/strategieaktivierung-und-leitbildentwicklung/", "/leitbild-und-strategieentwicklung/"],
  ["/strategieumsetzung/", "/strategieumsetzung-2025/"],
  ["/fortbildungen-events/", "/fortbildungen-events-2025/"],
  ["/leadership-coaching/", "/leadership-coaching-2025/"],
  ["/new-leadership-podcast/", "/podcast-2025/"],
  ["/datenschutz/", "/datenschutzerklaerung/"],
  ["/mli-new-leadership-summit-2024-leadership-in-times-of-ai/", "/fortbildungen-events-2025/"],
  ["/mli-leadership-quest-2024/", "/fortbildungen-events-2025/"],
];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

function rewriteUrls(html) {
  return html
    .replaceAll("https://leadership-munich.org/", "/")
    .replaceAll("http://leadership-munich.org/", "/")
    .replaceAll('src="//', 'src="https://')
    .replaceAll('href="//leadership-munich.org', 'href="');
}

function cleanPage(html, urlPath) {
  const $ = cheerio.load(html);
  const lang = urlPath.startsWith("/en/") ? "en" : "de";

  // Remove October CMS / Magic Forms / reCAPTCHA (replaced by our form)
  $('script[src*="/modules/system/"]').remove();
  $('link[href*="/modules/system/"]').remove();
  $('script[src*="recaptcha"]').remove();
  $('script[src*="magicforms"]').remove();
  $('meta[name="generator"]').remove();
  $('meta[name="turbo-visit-control"]').remove();

  // Rewrite absolute asset/page URLs to root-relative
  $("link[href], script[src], img[src], source[src], video[src], audio[src], a[href]").each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const attr = tag === "a" || tag === "link" ? "href" : "src";
    const val = $(el).attr(attr);
    if (!val) return;
    if (val.startsWith("https://leadership-munich.org/")) {
      $(el).attr(attr, val.replace("https://leadership-munich.org", ""));
    }
  });
  $("[style]").each((_, el) => {
    const style = $(el).attr("style") || "";
    if (style.includes("leadership-munich.org")) {
      $(el).attr("style", style.replaceAll("https://leadership-munich.org", ""));
    }
  });

  // Ensure Usercentrics is present once
  if (!$("#usercentrics-cmp").length) {
    $("head").append(
      `<script id="usercentrics-cmp" src="https://web.cmp.usercentrics.eu/ui/loader.js" data-settings-id="0qtDDaIFgHMzAV" async></script>`
    );
  }

  // HubSpot forms loader for whitepaper placeholders
  if (!$('script[src*="hsforms.net"]').length && !$('script[src*="js.hsforms.net"]').length) {
    $("head").append(
      `<script charset="utf-8" type="text/javascript" src="https://js-eu1.hsforms.net/forms/embed/v2.js"></script>`
    );
  }

  // Team leaders carousel needs Slick (was provided via October combine on live)
  if (html.includes('data-control="team-leaders"') || html.includes("team-leaders")) {
    if (!$('link[href="/vendor/slick/slick.css"]').length) {
      $("head").append(`<link rel="stylesheet" href="/vendor/slick/slick.css">`);
      $("head").append(`<link rel="stylesheet" href="/vendor/slick/slick-theme.css">`);
    }
    if (!$('script[src="/vendor/slick/slick.min.js"]').length) {
      const $jq = $('script[src*="jquery"]').first();
      if ($jq.length) {
        $jq.after(`<script src="/vendor/slick/slick.min.js"></script>`);
      } else {
        $("head").append(`<script src="/vendor/slick/slick.min.js"></script>`);
      }
    }
  }

  // Site enhancement script
  if (!$('script[src="/js/site.js"]').length) {
    $("body").append(`<script src="/js/site.js" defer></script>`);
  }

  // Replace contact forms
  $('form[data-request="emptyForm::onFormSubmit"]').each((_, el) => {
    $(el).replaceWith(lang === "en" ? CONTACT_FORM_EN : CONTACT_FORM_DE);
  });

  // Replace whitepaper forms with HubSpot placeholder
  $('form[data-request="whitepaper::onFormSubmit"]').each((_, el) => {
    $(el).replaceWith(lang === "en" ? HUBSPOT_WHITEOPAPER_SAFE(lang) : HUBSPOT_WHITEOPAPER_SAFE(lang));
  });

  // Newsletter / any remaining October AJAX forms: strip handlers, keep CleverReach POST
  $("form[data-request]").each((_, el) => {
    const $form = $(el);
    const req = String($form.attr("data-request") || "");
    if (req.includes("emptyForm") || req.includes("whitepaper")) return; // already replaced
    $form.removeAttr("data-request");
    $form.removeAttr("data-request-success");
    $form.removeAttr("data-request-error");
    $form.removeAttr("data-request-update");
    $form.find('input[name="_token"]').remove();
    if (req.includes("genericForm") || ($form.attr("action") || "").includes("cleverreach")) {
      if (!$form.attr("action")) {
        $form.attr("action", "https://eu2.cleverreach.com/f/298124-389075/wcs/");
      }
      if (!$form.attr("method")) $form.attr("method", "post");
      $form.attr("target", "_blank");
    }
  });
  // Belt-and-suspenders: strip any leftover data-request attrs on forms
  $("form").each((_, el) => {
    const $form = $(el);
    Object.keys(el.attribs || {}).forEach((name) => {
      if (name.startsWith("data-request")) $form.removeAttr(name);
    });
  });

  // Load-more buttons: convert to static client-side control
  $("[data-request]").each((_, el) => {
    const $el = $(el);
    const req = String($el.attr("data-request") || "");
    if (!req.includes("onLoadMore") && !$el.is("button, a")) return;
    if (req.includes("onLoadMore") || $el.hasClass("mli-load-more")) {
      $el.removeAttr("data-request");
      $el.removeAttr("data-request-update");
      $el.removeAttr("data-request-data");
      $el.addClass("mli-load-more");
      $el.attr("type", "button");
      if (!$el.text().trim()) $el.text(lang === "en" ? "Load more" : "Mehr laden");
    }
  });

  // Mark keynote/story cards for load-more behavior if present
  $(".mli-load-more").closest("section, .container, .container-fluid").addClass("mli-load-more-root");

  // Remove CSRF tokens leftover
  $('input[name="_token"]').remove();

  $("html").attr("lang", lang);
  let out = $.html();
  out = rewriteUrls(out);

  // String-level cleanup for markup cheerio does not parse as real nodes
  out = out
    .replace(/<script[^>]*\/modules\/system\/[^>]*><\/script>/gi, "")
    .replace(/<script[^>]*\/modules\/system\/[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<link[^>]*\/modules\/system\/[^>]*>/gi, "")
    .replace(/\s*data-request(?:-[a-z]+)?=(["'])[\s\S]*?\1/gi, "")
    .replace(/<input[^>]*name=["']_token["'][^>]*>/gi, "")
    .replace(/<div[^>]*class=["'][^"']*g-recaptcha[^"']*["'][^>]*>\s*<\/div>/gi, "");

  // October /combine/ bundles are extensionless; static hosts need .css/.js
  out = out.replace(
    /\/combine\/([a-f0-9]+-\d+)(?!\.(?:css|js))/gi,
    (match, hash, offset, str) => {
      const before = str.slice(Math.max(0, offset - 80), offset).toLowerCase();
      if (before.includes("<script") || before.includes("src=")) {
        return `/combine/${hash}.js`;
      }
      return `/combine/${hash}.css`;
    }
  );

  return out;
}

function HUBSPOT_WHITEOPAPER_SAFE(lang) {
  return lang === "en" ? HUBSPOT_WHITEPAPER_EN : HUBSPOT_WHITEPAPER_DE;
}

async function walkHtmlFiles(dir, base = dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkHtmlFiles(full, base)));
    else if (e.name === "index.html") {
      const rel = path.relative(base, full);
      out.push(rel);
    }
  }
  return out;
}

async function loadHubspotConfig() {
  const p = path.join(DATA, "hubspot.json");
  if (await exists(p)) {
    return JSON.parse(await fs.readFile(p, "utf8"));
  }
  return {
    portalId: "REPLACE_WITH_HUBSPOT_PORTAL_ID",
    region: "eu1",
    whitepaperFormId: "REPLACE_WITH_HUBSPOT_FORM_ID",
  };
}


async function renameCombineBundles() {
  const combineDir = path.join(PUBLIC, "combine");
  if (!(await exists(combineDir))) return;
  const files = await fs.readdir(combineDir);
  for (const name of files) {
    if (name.includes(".")) continue;
    const full = path.join(combineDir, name);
    const head = (await fs.readFile(full, "utf8")).slice(0, 80);
    const ext = head.trimStart().startsWith(".") || head.includes("{") ? ".css" : ".js";
    // prefer css if looks like css
    const use = /[{;]\s*$|[.#][a-zA-Z]/.test(head) && !head.includes("function") ? ".css" : head.includes("$") || head.includes("function") ? ".js" : ext;
    await fs.copyFile(full, full + (head.includes("function") || head.includes("$(") ? ".js" : ".css"));
  }
}

async function main() {
  const inventory = JSON.parse(await fs.readFile(path.join(EXPORT, "inventory.json"), "utf8"));
  const hubspot = await loadHubspotConfig();

  await fs.mkdir(PUBLIC, { recursive: true });
  await fs.mkdir(DATA, { recursive: true });

  // Sync assets
  const assetRoot = path.join(EXPORT, "assets");
  if (await exists(path.join(assetRoot, "themes"))) {
    console.log("Copying themes...");
    await copyDir(path.join(assetRoot, "themes"), path.join(PUBLIC, "themes"));
  }
  if (await exists(path.join(assetRoot, "storage"))) {
    console.log("Copying storage...");
    await copyDir(path.join(assetRoot, "storage"), path.join(PUBLIC, "storage"));
  }

  const pageFiles = await walkHtmlFiles(path.join(EXPORT, "pages"));
  const manifest = [];

  console.log(`Cleaning ${pageFiles.length} pages...`);
  for (const rel of pageFiles) {
    const src = path.join(EXPORT, "pages", rel);
    let urlPath =
      rel === "index.html" ? "/" : "/" + rel.replace(/index\.html$/, "").replace(/\\/g, "/");
    if (!urlPath.endsWith("/")) urlPath += "/";

    let html = await fs.readFile(src, "utf8");
    html = cleanPage(html, urlPath);

    // Apply HubSpot IDs from config
    html = html
      .replaceAll("REPLACE_WITH_HUBSPOT_FORM_ID", hubspot.whitepaperFormId)
      .replaceAll("REPLACE_WITH_HUBSPOT_PORTAL_ID", hubspot.portalId);

    const dest = path.join(PUBLIC, rel === "index.html" ? "index.html" : rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, html, "utf8");

    const $ = cheerio.load(html);
    manifest.push({
      path: urlPath,
      title: $("title").first().text().trim(),
      description: $('meta[name="description"]').attr("content") || "",
      lang: urlPath.startsWith("/en/") ? "en" : "de",
      file: rel,
    });
  }

  await fs.writeFile(path.join(DATA, "pages-manifest.json"), JSON.stringify(manifest, null, 2));
  await fs.writeFile(path.join(DATA, "hubspot.json"), JSON.stringify(hubspot, null, 2));

  // Netlify / Cloudflare style redirects
  const redirectsTxt = REDIRECTS.map(([from, to]) => `${from} ${to} 301`).join("\n") + "\n";
  await fs.writeFile(path.join(PUBLIC, "_redirects"), redirectsTxt);

  // nginx snippet
  const nginx = [
    "# MLI static site redirects — include in server {}",
    ...REDIRECTS.map(
      ([from, to]) =>
        `location = ${from.replace(/\/$/, "")} { return 301 ${to}; }\nlocation = ${from} { return 301 ${to}; }`
    ),
    "",
    "location / {",
    "  try_files $uri $uri/ $uri/index.html =404;",
    "}",
    "",
  ].join("\n");
  await fs.writeFile(path.join(ROOT, "deploy", "nginx-mli.conf"), nginx);

  // robots + sitemap
  const sitemapUrls = manifest
    .map(
      (p) => `  <url><loc>https://leadership-munich.org${p.path}</loc><changefreq>weekly</changefreq></url>`
    )
    .join("\n");
  await fs.writeFile(
    path.join(PUBLIC, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`
  );
  await fs.writeFile(
    path.join(PUBLIC, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: https://leadership-munich.org/sitemap.xml\n`
  );

  await renameCombineBundles();
  console.log(`Wrote ${manifest.length} pages to public/`);
  console.log(`Redirects: ${REDIRECTS.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
