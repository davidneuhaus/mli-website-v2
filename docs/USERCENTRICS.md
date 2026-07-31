# Usercentrics (Cookie / Consent)

## Embed (already included on all generated pages)

```html
<script
  id="usercentrics-cmp"
  src="https://web.cmp.usercentrics.eu/ui/loader.js"
  data-settings-id="0qtDDaIFgHMzAV"
  async
></script>
```

This is copied from the live October CMS site. **No CMS is required** for the banner to work.

## What you need to keep it working

1. Access to the Usercentrics account that owns settings ID `0qtDDaIFgHMzAV`.
2. In the Usercentrics admin, ensure domains are allowed:
   - `leadership-munich.org`
   - `www.leadership-munich.org`
   - any staging host (e.g. `static.leadership-munich.org`)
3. Keep marketing tags (LinkedIn Insight, etc.) configured **inside Usercentrics**, not hard-coded to fire before consent.
4. After DNS cutover, accept/decline cookies once and verify in the browser Network tab that LinkedIn / analytics scripts only load after consent.

## Optional

- Update Impressum / privacy links inside the UC configuration if URLs change.
- If you create a *new* UC property for staging, you would get a new `data-settings-id` — prefer reusing the production ID and adding domains.
