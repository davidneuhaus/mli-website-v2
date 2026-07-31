# Deploy MLI static site

## Build

```bash
npm install
npm run generate          # rebuild public/ from export/ + hubspot.json
npm run build             # astro build → dist/
```

Upload the contents of `dist/` to the web root of the new server.

## v2 presentation (`/v2/`)

Optional parallel UX layer (same content; enhanced menu/buttons/motion):

```bash
npm run build:v2          # → dist-v2/
npm run preview:v2        # http://127.0.0.1:4322/v2/
```

Upload **contents of `dist-v2/`** to the path served at `/v2/` (see `location /v2/` in `deploy/nginx-mli.conf`). Keep v1 at site root until you promote v2.

## nginx

See [`deploy/nginx-mli.conf`](../deploy/nginx-mli.conf) for redirects and `try_files`.

Minimal server block:

```nginx
server {
  listen 443 ssl http2;
  server_name leadership-munich.org www.leadership-munich.org;
  root /var/www/mli/dist;
  index index.html;

  include /var/www/mli/deploy/nginx-mli.conf;

  # PHP contact endpoint
  location ~ ^/api/contact\.php$ {
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_pass unix:/run/php/php-fpm.sock; # adjust
  }
}
```

## Contact form

1. Edit `public/api/contact.php` constants:
   - `CONTACT_TO` — destination inbox
   - `CONTACT_FROM` — must be allowed by the mail server
2. Re-run `npm run generate` / `npm run build`, or copy the PHP file into `dist/api/`.
3. Ensure PHP `mail()` works, or switch to Web3Forms via `public/api/contact.js` on Cloudflare/Netlify.

## HubSpot whitepapers

1. Set `portalId` and `whitepaperFormId` in [`src/data/hubspot.json`](../src/data/hubspot.json).
2. Run `npm run generate:pages && npm run build`.

## Newsletter

CleverReach forms are kept temporarily (`eu2.cleverreach.com/f/298124-...`). Confirm final provider before launch.

## DNS cutover checklist

- [ ] `dist/` deployed over HTTPS
- [ ] Contact form test email received
- [ ] HubSpot whitepaper form submits
- [ ] CleverReach subscribe works (or replacement ready)
- [ ] Usercentrics banner appears; domain allowlisted
- [ ] Old URLs redirect (see `public/_redirects` / nginx conf)
- [ ] HubSpot Meetings + Calendly CTAs open
- [ ] DE + EN home and nav spot-checked on mobile
