#!/usr/bin/env node
/**
 * Nest dist-v2 under .v2-preview/v2 so BASE_PATH=/v2 URLs resolve, then serve.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist-v2");
const PREVIEW = path.join(ROOT, ".v2-preview");
const NESTED = path.join(PREVIEW, "v2");
const PORT = process.env.PORT || "4322";

async function main() {
  try {
    await fs.access(DIST);
  } catch {
    console.error("dist-v2/ missing — run: npm run build:v2");
    process.exit(1);
  }

  await fs.rm(PREVIEW, { recursive: true, force: true });
  await fs.mkdir(NESTED, { recursive: true });
  await fs.cp(DIST, NESTED, { recursive: true });

  console.log(`Serving v2 at http://127.0.0.1:${PORT}/v2/`);
  const child = spawn(
    process.execPath,
    [path.join(__dirname, "static-server.mjs"), PREVIEW, PORT],
    { stdio: "inherit", cwd: ROOT }
  );
  child.on("exit", (code) => process.exit(code ?? 0));
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
