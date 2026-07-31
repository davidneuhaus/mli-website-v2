#!/usr/bin/env node
/**
 * Build MLI v2 presentation tree:
 *   public/ → dist-v2/ with mli-v2.css/js injected, body.mli-v2, BASE_PATH=/v2
 *
 * Preview: npm run preview:v2  (serves nested /v2/ so rewritten paths resolve)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "public");
const OUT = path.join(ROOT, "dist-v2");
const BASE = "/v2";

const CSS_TAG =
  '<link href="/css/mli-v2.css" rel="stylesheet" id="mli-v2-css">';
const JS_TAG = '<script src="/js/mli-v2.js" defer id="mli-v2-js"></script>';

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

function injectHtml(html) {
  let out = html;

  // body.mli-v2
  out = out.replace(/<body(\s[^>]*)?>/i, (m, attrs = "") => {
    if (/\bclass\s*=/.test(attrs)) {
      return m.replace(
        /class\s*=\s*(["'])([^"']*)\1/i,
        (cm, q, cls) =>
          cls.split(/\s+/).includes("mli-v2")
            ? cm
            : `class=${q}${cls} mli-v2${q}`
      );
    }
    return `<body class="mli-v2"${attrs}>`;
  });

  // CSS after last theme stylesheet (2025 or legacy), else before </head>
  if (!out.includes("mli-v2.css")) {
    const sheetRe =
      /<link[^>]*href=["'][^"']*(?:responsive-2025|responsive-min|layout-2025|special-mli-min)\.css[^"']*["'][^>]*>/gi;
    let last = null;
    let m;
    while ((m = sheetRe.exec(out)) !== null) last = m;
    if (last) {
      const at = last.index + last[0].length;
      out = out.slice(0, at) + "\n" + CSS_TAG + out.slice(at);
    } else if (out.includes("</head>")) {
      out = out.replace(/<\/head>/i, `${CSS_TAG}\n</head>`);
    }
  }

  // JS before </body> (after site.js if present)
  if (!out.includes("mli-v2.js")) {
    if (out.includes("/js/site.js")) {
      out = out.replace(
        /(<script[^>]*\/js\/site\.js[^>]*><\/script>)/i,
        `$1\n${JS_TAG}`
      );
    } else if (out.includes("</body>")) {
      out = out.replace(/<\/body>/i, `${JS_TAG}\n</body>`);
    }
  }

  return out;
}

function rewriteBase(content, base) {
  let out = content;
  out = out.replace(
    /(\b(?:href|src|action|poster|data-src)=["'])\/(?!\/)/g,
    `$1${base}/`
  );
  out = out.replace(/url\(\s*(['"]?)\/(?!\/)/g, `url($1${base}/`);
  const doubled = new RegExp(`${base}${base}/`, "g");
  out = out.replace(doubled, `${base}/`);
  return out;
}

async function rmrf(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function main() {
  console.log("Building MLI v2 → dist-v2/ (BASE_PATH=/v2)");

  // Ensure enhancement assets exist in public/
  for (const rel of ["css/mli-v2.css", "js/mli-v2.js"]) {
    try {
      await fs.access(path.join(SRC, rel));
    } catch {
      console.error(`Missing ${rel} in public/ — aborting.`);
      process.exit(1);
    }
  }

  await rmrf(OUT);
  await fs.cp(SRC, OUT, { recursive: true });

  const files = await walk(OUT);
  let htmlN = 0;
  let rewriteN = 0;

  for (const file of files) {
    if (!/\.html$/i.test(file)) continue;
    const before = await fs.readFile(file, "utf8");
    let after = injectHtml(before);
    after = rewriteBase(after, BASE);
    if (after !== before) {
      await fs.writeFile(file, after, "utf8");
      htmlN++;
    }
  }

  // Rewrite absolute URLs in css/js that may reference /themes etc.
  for (const file of files) {
    if (!/\.(css|js|xml|txt|json)$/i.test(file)) continue;
    // Skip already-processed; our mli-v2 assets use relative-safe /css paths in HTML only
    const before = await fs.readFile(file, "utf8");
    const after = rewriteBase(before, BASE);
    if (after !== before) {
      await fs.writeFile(file, after, "utf8");
      rewriteN++;
    }
  }

  // Marker for deploy tooling
  await fs.writeFile(
    path.join(OUT, ".mli-v2"),
    `MLI v2 presentation build\nbase=${BASE}\n`,
    "utf8"
  );

  console.log(`Injected + rewrote ${htmlN} HTML files; ${rewriteN} other assets.`);
  console.log(`Output: ${OUT}`);
  console.log("Preview: npm run preview:v2");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
