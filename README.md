# DESILEAKS — Static site (HTML / CSS / JS)

Pure static port of the React app. Same UI, same features, same backend.

## Run locally

Serve this folder with any static server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy

Drop the contents of this folder into any static host (Vercel, Netlify,
Cloudflare Pages, GitHub Pages, S3, Nginx). No build step.

## Backend (Supabase)

1. Create a Supabase project (or use the existing one — config lives in
   `js/config.js`).
2. Open the SQL editor and run **`database.sql`** once. It creates all
   tables, enums, functions, triggers, RLS policies, storage buckets and
   storage policies.
3. Sign up a user via `/auth.html`, then promote them to admin:
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'you@example.com'
   on conflict do nothing;
   ```

## Pages

| Route | File |
| --- | --- |
| Home | `index.html` |
| All videos | `all-videos.html` |
| Category | `category.html?name=…` |
| Search | `search.html?q=…` |
| Watch | `watch.html?slug=…` |
| Auth | `auth.html` |
| Admin | `admin.html` |
| 404 | `404.html` |

## Folder layout

```
desileaks-static/
├── index.html, watch.html, admin.html, ... (pages)
├── assets/   logo.png, favicon.ico, placeholder.svg
├── css/      styles.css
├── js/       supabase-client.js, auth.js, navbar.js, hero.js,
│             category-slider.js, video-card.js, video-player.js,
│             video-url-handler.js, cropper.js, toast.js, seo.js,
│             tw-config.js, config.js
├── database.sql    ← run once on Supabase
└── README.md
```

Tailwind is loaded via CDN; Supabase JS via esm.sh. No bundler required.