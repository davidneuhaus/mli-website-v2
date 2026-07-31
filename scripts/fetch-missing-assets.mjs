#!/usr/bin/env node
/**
 * Find 404 assets on local dist/public and download them from the live site.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const LIVE = "https://leadership-munich.org";
const LOCAL = "http://127.0.0.1:4321";

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function walkHtml(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walkHtml(full, out);
    else if (e.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function collectAssets(html) {
  const $ = cheerio.load(html);
  const urls = new Set();
  $("img[src], script[src], link[href], source[src], video[src], video[poster], audio[src]").each((_, el) => {
    const tag = el.tagName.toLowerCase();
    let attr = "src";
    if (tag === "link") attr = "href";
    if (tag === "video" && $(el).attr("poster") && !$(el).attr("src")) attr = "poster";
    // collect both src and poster for video
    for (const a of tag === "video" ? ["src", "poster"] : [attr]) {
      let u = $(el).attr(a);
      if (!u) continue;
      u = u.replaceAll("https://leadership-munich.org", "").split("?")[0];
      if (u.startsWith("/") && !u.startsWith("//")) urls.add(decodeURIComponent(u) === u ? u : u);
      // keep encoded form too
      if (u.startsWith("/")) urls.add(u);
    }
  });
  for (const m of html.matchAll(/(?:src|href|poster)=["'](\/[^"']+)["']/g)) {
    urls.add(m[1].split("?")[0]);
  }
  for (const m of html.matchAll(/url\((['"]?)(\/[^'")]+)\1\)/g)) {
    urls.add(m[2].split("?")[0]);
  }
  return [...urls];
}

async function localOk(urlPath) {
  // try decoded and as-is under public
  const candidates = [
    path.join(PUBLIC, urlPath.replace(/^\//, "")),
    path.join(PUBLIC, decodeURIComponent(urlPath.replace(/^\//, ""))),
  ];
  for (const c of candidates) {
    if (await exists(c)) {
      const st = await fs.stat(c);
      if (st.size > 0) return true;
    }
  }
  // also check via HTTP in case of encoding differences
  try {
    const r = await fetch(LOCAL + urlPath, { method: "GET" });
    return r.status === 200;
  } catch {
    return false;
  }
}

async function download(urlPath) {
  const liveUrl = LIVE + urlPath;
  const destRel = decodeURIComponent(urlPath.replace(/^\//, ""));
  const dest = path.join(PUBLIC, destRel);
  try {
    const res = await fetch(liveUrl, {
      headers: { "User-Agent": "MLI-Asset-Fetch/1.0" },
      redirect: "follow",
    });
    if (!res.ok) return { urlPath, ok: false, status: res.status };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return { urlPath, ok: false, status: "empty" };
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, buf);
    // also write encoded path variant if different
    const encDest = path.join(PUBLIC, urlPath.replace(/^\//, ""));
    if (encDest !== dest) {
      await fs.mkdir(path.dirname(encDest), { recursive: true });
      try { await fs.copyFile(dest, encDest); } catch { /* ignore */ }
    }
    return { urlPath, ok: true, bytes: buf.length, dest: destRel };
  } catch (e) {
    return { urlPath, ok: false, status: e.message };
  }
}

async function main() {
  const htmlFiles = await walkHtml(PUBLIC);
  const all = new Set();
  for (const f of htmlFiles) {
    const html = await fs.readFile(f, "utf8");
    for (const u of collectAssets(html)) {
      if (
        u.startsWith("/storage/") ||
        u.startsWith("/themes/") ||
        u.startsWith("/combine/") ||
        u.startsWith("/plugins/") ||
        u.startsWith("/modules/")
      ) {
        all.add(u);
      }
    }
  }

  console.log(`Checking ${all.size} asset URLs...`);
  const missing = [];
  for (const u of all) {
    if (!(await localOk(u))) missing.push(u);
  }
  console.log(`Missing: ${missing.length}`);

  const results = { downloaded: [], failed: [] };
  for (let i = 0; i < missing.length; i++) {
    const u = missing[i];
    process.stdout.write(`[${i + 1}/${missing.length}] ${u}\n`);
    const r = await download(u);
    if (r.ok) results.downloaded.push(r);
    else results.failed.push(r);
  }

  await fs.writeFile(
    path.join(ROOT, "docs", "missing-assets-report.json"),
    JSON.stringify(results, null, 2)
  );
  console.log(`Downloaded: ${results.downloaded.length}, Failed: ${results.failed.length}`);
  if (results.failed.length) {
    console.log("Failed sample:");
    for (const f of results.failed.slice(0, 30)) console.log(" ", f.status, f.urlPath);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
