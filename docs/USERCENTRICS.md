# Cookie Consent (MLI local CMP)

Usercentrics was removed. Consent is handled locally by:

- `/css/mli-consent.css`
- `/js/mli-consent.js`

## Behaviour

| Category | Default | What it controls |
|----------|---------|------------------|
| Essenziell | Always on | Consent storage only |
| Funktionell | Off until opt-in | Reserved (`data-mli-consent="functional"` scripts) |
| Marketing | Off until opt-in | LinkedIn Insight Tag (`pid=7055746`) |

- First visit: bottom banner (Ablehnen / Einstellungen / Alles akzeptieren)
- Floating round button (bottom-left) reopens settings
- Footer / form controls with `.mli-open-privacy` call `window.mliOpenPrivacySettings()`
- Choice stored in `localStorage` key `mli-consent-v1` (180 days)

## Embed (on every page)

```html
<link rel="stylesheet" href="/css/mli-consent.css">
<script src="/js/mli-consent.js" defer></script>
```

Injected by `scripts/replace-usercentrics.mjs` and `scripts/generate-pages.mjs`. Astro pages use `src/layouts/BaseLayout.astro`.

## Gate additional scripts

```html
<script type="text/plain" data-mli-consent="marketing">
  // runs only after marketing consent
</script>
```

Or listen for:

```js
window.addEventListener("mli:consent", (e) => {
  console.log(e.detail); // { essential, functional, marketing }
});
```

## Migrate / re-apply after HTML regenerate

```bash
npm run consent:migrate
```

This removes leftover Usercentrics loaders and ungated LinkedIn blocks, then injects the local CMP assets.

## Verify

1. Hard refresh, clear `localStorage` key `mli-consent-v1`
2. Banner appears; LinkedIn request must **not** fire before accept
3. „Alles akzeptieren“ → network shows `insight.min.js` / LinkedIn
4. „Ablehnen“ → no LinkedIn; FAB still opens settings
5. Footer „COOKIE-EINSTELLUNGEN“ opens the panel
