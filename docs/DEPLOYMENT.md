# Deployment Guide

## Option A — Publish from Lovable (recommended)

1. Open the project in the Lovable editor.
2. Click **Publish** (top right; bottom right on mobile).
3. The app goes live at `https://<project>.lovable.app`.
4. Frontend changes require clicking **Update** in the publish dialog. Backend changes (migrations, server logic) deploy immediately.

### Custom domain

Publish once, then go to **Project Settings → Domains** (or **Publish dialog → Add custom domain**), add the domain and follow the DNS instructions. After the domain is live, update `VITE_APP_URL` so social share images resolve to absolute URLs on the new host.

### Preview links

Preview URLs (`id-preview--*.lovable.app`) require a Lovable login. Use **Share → Share preview** for a 7-day public link. Publishing is what makes the app permanently public.

## Option B — Self-host the build

The app builds to an edge/server bundle plus static assets.

```bash
npm install
npm run build
npm run preview     # local smoke test of the production build
```

Deploy the build output to a platform that supports the Nitro/edge output (Cloudflare Workers, Netlify, Vercel). Requirements:

- Node 20+ build image
- All `VITE_*` variables present **at build time** (Vite inlines them)
- Server-side `SUPABASE_*` variables present at runtime
- No SPA rewrite files needed — TanStack Start handles routing. Do not add `_redirects`, `netlify.toml` rewrites, or `vercel.json` rewrites for client routing.

## Post-deploy verification

1. Load `/` — check the tab icon and page title.
2. Paste the URL into WhatsApp/Slack — the Fast Cash banner (`/og-image.png`) should preview.
3. Submit a test deposit as a guest, confirm the row appears in the admin portal.
4. Register a throwaway account, confirm the email flow.
5. Sign in as an admin, approve the test request, then delete it.
6. Check `/privacy-policy`, `/support`, `/transactions` render.
7. Re-run an accessibility pass (see TESTING_CHECKLIST.md).

## Rollback

- Lovable: re-publish an earlier version from the project history.
- Self-hosted: redeploy the previous build artifact. Database migrations are forward-only — write a corrective migration rather than reverting schema by hand.

## Environments

| Environment | URL shape | Notes |
| --- | --- | --- |
| Local | `http://localhost:8080` | Shares the same backend as preview |
| Preview | `project--<id>-dev.lovable.app` | Latest preview build, stable URL |
| Production | `project--<id>.lovable.app` / custom domain | Published deployment |

Use the stable `project--<id>` URLs when configuring external callers (webhooks, schedulers) so renames don't break them.
