import { defineConfig } from "astro/config";

// Most pages are pre-rendered static HTML in public/ (from the export pipeline).
// Astro provides the build pipeline, 404 page, and project tooling.
export default defineConfig({
  site: "https://leadership-munich.org",
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
