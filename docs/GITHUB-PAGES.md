# Test the site on GitHub Pages

Preview URL (after setup):

**https://davidneuhaus.github.io/mli-website/**

GitHub does not serve your local `npm run preview` — you need **GitHub Pages** + a CI build. This repo includes a workflow for that.

---

## What you need to do (one-time in GitHub)

### 1. Enable GitHub Pages (Actions)

1. Open https://github.com/davidneuhaus/mli-website/settings/pages  
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**  
3. Save

### 2. Allow the Actions workflow to deploy

On first run, GitHub may ask to approve the `github-pages` environment:

1. Actions tab → failed/waiting deploy → **Review deployments** → Approve  
   or  
2. Settings → Environments → `github-pages` → allow `main`

### 3. Push to `main` (or run workflow manually)

Every push to `main` runs `.github/workflows/deploy-github-pages.yml`:

- `astro build` (uses committed `public/` assets — no re-crawl of the live CMS)
- Rewrites root-absolute URLs to `/mli-website/...` (required for project Pages)
- Deploys `dist/` to GitHub Pages

Manual run: Actions → **Deploy to GitHub Pages** → **Run workflow**.

### 4. Usercentrics (cookie fingerprint) on github.io

In Usercentrics Admin for `0qtDDaIFgHMzAV` → Domain Management, add:

- `davidneuhaus.github.io`

Without this, the CMP / fingerprint often will not work on the Pages preview (same issue as localhost). See [USERCENTRICS.md](./USERCENTRICS.md).

---

## Why a base path is required

This is a **project** site (`username.github.io/repo-name/`), not `username.github.io/`.

HTML uses absolute paths like `/kontakt/` and `/themes/...`. On Pages those must become `/mli-website/kontakt/` etc. The workflow applies that rewrite automatically.

For production on `https://leadership-munich.org/` you deploy `dist/` **without** `BASE_PATH` (normal `npm run build`).

---

## Local check of the GitHub build

```bash
npm ci
BASE_PATH=/mli-website SITE_URL=https://davidneuhaus.github.io npm run build:github
npx astro preview --host 127.0.0.1 --port 4321
# then open http://127.0.0.1:4321/mli-website/
```

---

## Limits of GitHub Pages preview

| Topic | Note |
|-------|------|
| Contact form PHP | `contact.php` will **not** run on GitHub Pages (static only). Use Web3Forms/serverless later, or test forms on a PHP host. |
| Redirects (`_redirects`) | Netlify-style file is ignored by GitHub Pages. |
| Custom domain | Optional later under Pages settings; then you can drop `BASE_PATH` for that host. |

---

## Checklist

- [ ] Pages source = **GitHub Actions**
- [ ] Workflow on `main` is green
- [ ] Open https://davidneuhaus.github.io/mli-website/
- [ ] Usercentrics allowlist includes `davidneuhaus.github.io`
- [ ] Spot-check nav, images, EN toggle
