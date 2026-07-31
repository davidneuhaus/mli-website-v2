#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || ".");
const port = Number(process.argv[3] || process.env.PORT || 4322);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".php": "text/plain",
};

function resolveFile(urlPath) {
  let p = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const full = path.normalize(path.join(root, p));
  if (!full.startsWith(root)) return null;
  if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  const asIndex = path.join(full, "index.html");
  if (fs.existsSync(asIndex)) return asIndex;
  return null;
}

http
  .createServer((req, res) => {
    const file = resolveFile(req.url || "/");
    if (!file) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Ready at http://127.0.0.1:${port}/`);
  });
