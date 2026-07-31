#!/usr/bin/env node
/**
 * Extract Leadership Stories + keynotes into Astro content collections (Markdown).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXPORT = path.join(ROOT, "export");
const CONTENT = path.join(ROOT, "src", "content");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function slugFromPath(urlPath, prefix) {
  return urlPath
    .replace(prefix, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\//g, "-");
}

function yamlEscape(s) {
  return String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ");
}

async function extractPage(relHtmlPath, urlPath) {
  const file = path.join(EXPORT, "pages", relHtmlPath);
  if (!(await exists(file))) return null;
  const html = await fs.readFile(file, "utf8");
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  const description = $('meta[name="description"]').attr("content") || "";
  const main =
    $("#layout-content").html() ||
    $("main").html() ||
    $(".page-content").html() ||
    "";
  // Simplify to text-ish markdown: keep HTML body as-is in a fenced block alternative —
  // Astro content prefers markdown; store HTML in frontmatter-free raw via .md with HTML.
  const body = (main || "")
    .replaceAll("https://leadership-munich.org", "")
    .trim();
  return { title, description, body, urlPath };
}

async function writeCollection(dir, items) {
  await fs.mkdir(dir, { recursive: true });
  // clear existing md
  const existing = await fs.readdir(dir).catch(() => []);
  for (const f of existing) {
    if (f.endsWith(".md")) await fs.unlink(path.join(dir, f));
  }
  for (const item of items) {
    const md = `---
title: "${yamlEscape(item.title)}"
description: "${yamlEscape(item.description)}"
path: "${item.urlPath}"
lang: "${item.lang}"
---

${item.body}
`;
    await fs.writeFile(path.join(dir, `${item.slug}.md`), md, "utf8");
  }
}

async function main() {
  const inventory = JSON.parse(await fs.readFile(path.join(EXPORT, "inventory.json"), "utf8"));
  const stories = [];
  const keynotes = [];

  for (const p of inventory.pages) {
    const urlPath = p.path;
    let collection = null;
    let prefix = "";
    if (urlPath.includes("/leadership-stories/") && urlPath !== "/leadership-stories/" && urlPath !== "/en/leadership-stories/") {
      collection = "stories";
      prefix = urlPath.startsWith("/en/") ? "/en/leadership-stories/" : "/leadership-stories/";
    } else if (
      (urlPath.includes("/keynotes-detail-ansicht/") || urlPath.includes("/keynotes-und-speaker-detail-ansicht/")) &&
      !urlPath.endsWith("keynotes-detail-ansicht/") &&
      !urlPath.endsWith("keynotes-und-speaker-detail-ansicht/")
    ) {
      collection = "keynotes";
      prefix = urlPath.startsWith("/en/")
        ? urlPath.includes("keynotes-und-speaker")
          ? "/en/keynotes-und-speaker-detail-ansicht/"
          : "/en/keynotes-detail-ansicht/"
        : urlPath.includes("keynotes-und-speaker")
          ? "/keynotes-und-speaker-detail-ansicht/"
          : "/keynotes-detail-ansicht/";
    } else {
      continue;
    }

    const rel =
      urlPath === "/"
        ? "index.html"
        : urlPath.replace(/^\//, "").replace(/\/$/, "") + "/index.html";
    const extracted = await extractPage(rel, urlPath);
    if (!extracted || !extracted.body) continue;

    const lang = urlPath.startsWith("/en/") ? "en" : "de";
    const entry = {
      ...extracted,
      slug: `${lang}-${slugFromPath(urlPath, prefix) || "item"}`,
      lang,
    };
    if (collection === "stories") stories.push(entry);
    else keynotes.push(entry);
  }

  await writeCollection(path.join(CONTENT, "stories"), stories);
  await writeCollection(path.join(CONTENT, "keynotes"), keynotes);

  // Index helpers for load-more UIs
  await fs.mkdir(path.join(ROOT, "src", "data"), { recursive: true });
  await fs.writeFile(
    path.join(ROOT, "src", "data", "collections-index.json"),
    JSON.stringify(
      {
        stories: stories.map((s) => ({
          slug: s.slug,
          title: s.title,
          path: s.urlPath,
          lang: s.lang,
          description: s.description,
        })),
        keynotes: keynotes.map((s) => ({
          slug: s.slug,
          title: s.title,
          path: s.urlPath,
          lang: s.lang,
          description: s.description,
        })),
      },
      null,
      2
    )
  );

  console.log(`Stories: ${stories.length}, Keynotes: ${keynotes.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
