# Usercentrics (Cookie / Consent)

## Embed (already on generated pages)

```html
<script
  id="usercentrics-cmp"
  src="https://web.cmp.usercentrics.eu/ui/loader.js"
  data-settings-id="0qtDDaIFgHMzAV"
  async
></script>
```

Copied from the live October CMS site. Settings ID: `0qtDDaIFgHMzAV`.

---

## Fingerprint button not working — what to do

The purple fingerprint (`#uc-privacy-button` / “Privatsphäre-Einstellungen”) is rendered by Usercentrics inside a **Shadow DOM**. If it is visible but does nothing when clicked, this is almost always a **Usercentrics admin / domain** issue, not missing HTML in our static site.

### 1. Allowlist domains (required)

In [Usercentrics Admin](https://admin.usercentrics.eu/) for configuration `0qtDDaIFgHMzAV`:

1. Open **Implementation** → **Script Tag** / **Domain Management**
2. Enable **Show only on specific domains** (if used)
3. Add every host where the site is tested or deployed:

| Domain to add | Why |
|---------------|-----|
| `leadership-munich.org` | Production |
| `www.leadership-munich.org` | Production www |
| `localhost` | Local Astro preview |
| `127.0.0.1` | Local preview (IP form) |
| your staging host | e.g. `static.…` / Vercel / Netlify preview |

Without this, the loader may still fetch settings (`/latest/core/0qtDDaIFgHMzAV` → 200) while the UI/`UC_UI` / `__ucCmp` API stays broken — fingerprint appears but **click does not open** the settings layer.

Docs: [Domain management for your CMP](https://support.usercentrics.com/hc/en-us/articles/11326616498460-Domain-management-for-your-CMP)

### 2. Verify in the browser console

On `http://localhost:4321/` or production, after a hard refresh:

```js
// v2-style API (older)
typeof UC_UI
UC_UI?.isInitialized?.()

// v3-style API (Web CMP)
typeof __ucCmp
```

Then try:

```js
// Prefer whichever exists
window.__ucCmp?.showSecondLayer?.()
window.UC_UI?.showSecondLayer?.()
```

- If these throw / are `undefined` → CMP did not initialize → fix domain allowlist first.
- If they open the modal → CMP works; fingerprint click may be a UC UI glitch — use the footer fallback link below.

Also check the Console for messages like “domain not authorized” / CMP error banner (10+ errors often include UC + unrelated asset 404s).

### 3. Keep a single loader script

Only **one** tag with `id="usercentrics-cmp"` in `<head>`. Duplicates break the UI.

### 4. Fallback: “Cookie-Einstellungen” link (site helper)

`public/js/site.js` exposes a helper that opens the privacy layer. You can add in the footer (or Datenschutz page):

```html
<button type="button" class="mli-open-privacy" style="background:none;border:none;color:inherit;text-decoration:underline;cursor:pointer;padding:0;">
  Cookie-Einstellungen
</button>
```

Clicking it calls `__ucCmp.showSecondLayer()` / `UC_UI.showSecondLayer()` when ready.

### 5. After production DNS cutover

1. Confirm production domains are allowlisted  
2. Clear site cookies / UC storage once  
3. Accept/decline once, then click fingerprint — second layer must reopen  
4. Confirm marketing tags (LinkedIn Insight, etc.) only load after consent  

---

## What we cannot fix in HTML alone

- Usercentrics account access / Domain Management  
- Ruleset / service categories configured inside UC  
- Replacing the CMP with another vendor  

The static site already ships the same embed as live. **Ops step in Usercentrics admin is mandatory** for localhost + new hosts.
