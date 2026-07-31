#!/usr/bin/env node
/**
 * Prefix root-absolute URLs in a built static tree for GitHub Pages project sites.
 * Usage: BASE_PATH=/mli-website node scripts/apply-base-path.mjs [--dir dist]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function normalizeBase(raw) {
  if (!raw || raw === "/" || raw === "./") return "";
  let b = String(raw).trim();
  if (!b.startsWith("/")) b = "/" + b;
  return b.replace(/\/+$/, "");
}

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

function rewrite(content, base) {
  // href="/...", src="/...", action="/...", poster="/...", url(/...)
  // Do not touch protocol-relative // or already-prefixed base paths.
  let out = content;
  out = out.replace(
    /(\b(?:href|src|action|poster|data-src)=["'])\/(?!\/)/g,
    `$1${base}/`
  );
  out = out.replace(/url\(\s*(['"]?)\/(?!\/)/g, `url($1${base}/`);
  out = out.replace(
    /(content=["'])https?:\/\/[^"']*?(["'])/g,
    (m) => m // leave absolute http(s) alone
  );
  // Fix double-prefix if script run twice
  const doubled = new RegExp(`${base}${base}/`, "g");
  out = out.replace(doubled, `${base}/`);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf("--dir");
  const target = path.resolve(
    ROOT,
    dirIdx >= 0 ? args[dirIdx + 1] : "dist"
  );
  const base = normalizeBase(process.env.BASE_PATH || args.find((a) => a.startsWith("/")) || "");
  if (!base) {
    console.log("BASE_PATH empty — nothing to rewrite (production root deploy).");
    return;
  }
  console.log(`Rewriting absolute URLs in ${target} with base ${base}`);
  const files = await walk(target);
  let n = 0;
  for (const file of files) {
    if (!/\.(html|css|js|xml|txt|json)$/i.test(file)) continue;
    const before = await fs.readFile(file, "utf8");
    const after = rewrite(before, base);
    if (after !== before) {
      await fs.writeFile(file, after, "utf8");
      n++;
    }
  }
  console.log(`Updated ${n} files.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
