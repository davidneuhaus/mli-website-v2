import { defineConfig } from "astro/config";

// Most pages are pre-rendered static HTML in public/ (from the export pipeline).
// Astro provides the build pipeline, 404 page, and project tooling.
//
// GitHub Pages project site:
//   BASE_PATH=/mli-website SITE_URL=https://davidneuhaus.github.io npm run build:github
const rawBase = process.env.BASE_PATH || "/";
const base =
  !rawBase || rawBase === "/"
    ? "/"
    : `/${String(rawBase).replace(/^\/+|\/+$/g, "")}/`;

export default defineConfig({
  site: process.env.SITE_URL || "https://leadership-munich.org",
  base,
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  vite: {
    server: {
      watch: {
        ignored: ["**/export/**", "**/node_modules/**"],
      },
    },
  },
});
