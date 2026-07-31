#!/usr/bin/env node
/**
 * Build MLI v2 presentation tree:
 *   public/ → dist-v2/ with mli-v2.css/js, SEO/LLM pass, body.mli-v2, BASE_PATH
 *
 * Preview: npm run preview:v2
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "public");
const OUT = path.join(ROOT, "dist-v2");
const BASE = (() => {
  const raw = process.env.BASE_PATH || "/v2";
  if (!raw || raw === "/") return "/v2";
  return `/${String(raw).replace(/^\/+|\/+$/g, "")}`;
})();

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

function runNode(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`))
    );
  });
}

async function main() {
  console.log(`Building MLI v2 → dist-v2/ (BASE_PATH=${BASE})`);

  for (const rel of ["css/mli-v2.css", "js/mli-v2.js"]) {
    try {
      await fs.access(path.join(SRC, rel));
    } catch {
      console.error(`Missing ${rel} in public/ — aborting.`);
      process.exit(1);
    }
  }

  await fs.rm(OUT, { recursive: true, force: true });
  await fs.cp(SRC, OUT, { recursive: true });

  const files = await walk(OUT);
  let htmlN = 0;

  // 1) Presentation inject (paths still root-absolute)
  for (const file of files) {
    if (!/\.html$/i.test(file)) continue;
    const before = await fs.readFile(file, "utf8");
    const after = injectHtml(before);
    if (after !== before) {
      await fs.writeFile(file, after, "utf8");
      htmlN++;
    }
  }
  console.log(`Injected mli-v2 assets into ${htmlN} HTML files`);

  // 2) SEO / LLM pass (absolute production canonicals — before BASE_PATH rewrite)
  await runNode(path.join(__dirname, "apply-seo-v2.mjs"), ["--dir", "dist-v2"]);

  // 3) Prefix asset/nav URLs for subpath hosting (leaves https:// canonicals alone)
  let rewriteN = 0;
  const files2 = await walk(OUT);
  for (const file of files2) {
    if (!/\.(html|css|js|xml|txt|json)$/i.test(file)) continue;
    const before = await fs.readFile(file, "utf8");
    const after = rewriteBase(before, BASE);
    if (after !== before) {
      await fs.writeFile(file, after, "utf8");
      rewriteN++;
    }
  }

  await fs.writeFile(
    path.join(OUT, ".mli-v2"),
    `MLI v2 presentation + SEO build\nbase=${BASE}\n`,
    "utf8"
  );

  console.log(`Base-path rewrote ${rewriteN} files.`);
  console.log(`Output: ${OUT}`);
  console.log("Preview: npm run preview:v2");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
