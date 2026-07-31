/**
 * Replace Usercentrics CMP with local MLI consent on all public HTML pages.
 * - Removes Usercentrics loader
 * - Removes ungated LinkedIn Insight blocks (loaded by mli-consent.js after opt-in)
 * - Injects mli-consent.css + mli-consent.js
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

const CONSENT_CSS = "/css/mli-consent.css";
const CONSENT_JS = "/js/mli-consent.js";

async function walkHtml(dir) {
  const out = [];
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && e.name.endsWith(".html")) out.push(p);
    }
  }
  await walk(dir);
  return out;
}

function stripLinkedIn($) {
  $("script").each((_, el) => {
    const html = $(el).html() || "";
    const src = $(el).attr("src") || "";
    if (
      html.includes("_linkedin_partner_id") ||
      html.includes("lintrk") ||
      src.includes("licdn.com") ||
      src.includes("linkedin.com")
    ) {
      $(el).remove();
    }
  });
  $("noscript").each((_, el) => {
    const html = $(el).html() || "";
    if (html.includes("ads.linkedin.com") || html.includes("licdn.com")) {
      $(el).remove();
    }
  });
  $('img[src*="ads.linkedin.com"], img[src*="licdn.com"]').remove();
}

function injectConsent($) {
  $("#usercentrics-cmp").remove();
  $('script[src*="usercentrics"]').remove();
  $('script[src*="web.cmp.usercentrics"]').remove();

  if (!$('link[href="/css/mli-consent.css"]').length && !$('link[href="' + CONSENT_CSS + '"]').length) {
    $("head").append(`<link rel="stylesheet" href="${CONSENT_CSS}">`);
  }
  if (!$('script[src="/js/mli-consent.js"]').length && !$('script[src="' + CONSENT_JS + '"]').length) {
    // Load early in head (defer) so UI is ready; LinkedIn is loaded by consent JS only after opt-in
    $("head").append(`<script src="${CONSENT_JS}" defer></script>`);
  }
}

async function main() {
  const files = await walkHtml(PUBLIC);
  let n = 0;
  let hadUc = 0;
  let hadLi = 0;

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const hadUsercentrics = /usercentrics/i.test(raw);
    const hadLinkedIn = /_linkedin_partner_id|snap\.licdn\.com/i.test(raw);
    if (!hadUsercentrics && !hadLinkedIn && raw.includes("mli-consent.js")) continue;

    const $ = cheerio.load(raw, { decodeEntities: false });
    if (hadLinkedIn) {
      stripLinkedIn($);
      hadLi++;
    }
    injectConsent($);
    if (hadUsercentrics) hadUc++;

    await fs.writeFile(file, $.html(), "utf8");
    n++;
  }

  console.log(`Updated ${n} HTML files`);
  console.log(`  removed Usercentrics from: ${hadUc}`);
  console.log(`  removed LinkedIn blocks from: ${hadLi}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
