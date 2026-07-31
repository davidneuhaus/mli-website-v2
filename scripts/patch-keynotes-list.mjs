/**
 * Ensure keynotes listing includes all local detail pages (not only first AJAX page).
 * Appends missing cards (hidden) and wires load-more to reveal them.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function patchListing(listingRel, detailsDirRel, urlPrefix) {
  const listingPath = path.join(ROOT, listingRel);
  const detailsDir = path.join(ROOT, detailsDirRel);
  let html = await fs.readFile(listingPath, "utf8");
  const $ = cheerio.load(html);

  const existing = new Set();
  $(`a[href*="${urlPrefix}"]`).each((_, el) => {
    const href = ($(el).attr("href") || "").replace(/\/$/, "") + "/";
    existing.add(href);
  });

  const dirs = await fs.readdir(detailsDir);
  const missing = [];
  for (const dir of dirs) {
    const indexPath = path.join(detailsDir, dir, "index.html");
    try {
      await fs.access(indexPath);
    } catch {
      continue;
    }
    const href = `${urlPrefix}${dir}/`;
    if (![...existing].some((e) => e.includes(`/${dir}/`) || e.endsWith(`/${dir}`))) {
      missing.push({ dir, href, indexPath });
    }
  }

  if (!missing.length) {
    console.log(listingRel, "no missing cards");
    // still hide useless load-more if all visible
    return;
  }

  // Use first card as template
  const $card = $(".mli-load-more-root .row > [class*='col-']").first();
  if (!$card.length) {
    console.warn(listingRel, "no card template");
    return;
  }
  const $row = $card.parent();

  for (const item of missing) {
    const detailHtml = await fs.readFile(item.indexPath, "utf8");
    const $d = cheerio.load(detailHtml);
    const title =
      $d("h1").first().text().trim() ||
      $d("title").first().text().split("|")[0].trim();
    const desc = $d('meta[name="description"]').attr("content") || "";
    const img =
      $d("#layout-content img").first().attr("src") ||
      $d("img").eq(1).attr("src") ||
      "";

    const $clone = $card.clone();
    $clone.find("a").each((_, a) => {
      $(a).attr("href", item.href);
    });
    const $h = $clone.find("h3, h2, .card-title").first();
    if ($h.length) $h.text(title);
    const $p = $clone.find("p").first();
    if ($p.length) $p.text(desc.slice(0, 140) + (desc.length > 140 ? " ..." : ""));
    if (img) {
      const $img = $clone.find("img").first();
      if ($img.length) $img.attr("src", img).attr("alt", title);
    }
    $clone.attr("data-mli-extra", "1");
    $clone.attr("style", "display:none");
    $row.append($clone);
    console.log("added", item.href, title.slice(0, 60));
  }

  // Ensure load-more button exists
  let $btn = $(".mli-load-more");
  if (!$btn.length) {
    $(".mli-load-more-root").append(
      `<div class="text-center my-4"><button type="button" class="btn btn-primary mli-load-more">Mehr anzeigen</button></div>`
    );
  }

  await fs.writeFile(listingPath, $.html(), "utf8");
  console.log(listingRel, "patched missing", missing.length);
}

await patchListing(
  "public/keynotes-und-speaker/index.html",
  "public/keynotes-detail-ansicht",
  "/keynotes-detail-ansicht/"
);
await patchListing(
  "dist/keynotes-und-speaker/index.html",
  "dist/keynotes-detail-ansicht",
  "/keynotes-detail-ansicht/"
);

// EN listing if present
try {
  await patchListing(
    "public/en/keynotes-and-speakers/index.html",
    "public/en/keynotes-detail-ansicht",
    "/en/keynotes-detail-ansicht/"
  );
  await patchListing(
    "dist/en/keynotes-and-speakers/index.html",
    "dist/en/keynotes-detail-ansicht",
    "/en/keynotes-detail-ansicht/"
  );
} catch (e) {
  console.log("EN keynotes patch skipped", e.message);
}
