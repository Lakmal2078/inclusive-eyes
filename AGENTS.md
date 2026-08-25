<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Base44 dev environment

- **Stack:** TanStack Start v1 (React 19) + Vite 8, Tailwind v4, Supabase (hosted).
- **Run:** `docker compose -f docker-compose.base44.yml up -d` (web service on host port 3000 → container 8080).
- **Dev server:** `npm run dev` (Vite). The `@lovable.dev/vite-tanstack-config` forces host `::` / port `8080` in both sandbox and non-sandbox modes; we run **non-sandbox** (no `LOVABLE_SANDBOX` set) to avoid the Lovable-only HMR-gate/dev-server-bridge. `vite.config.ts` adds `server.allowedHosts: true` so the Base44 preview's external Host header is accepted.
- **Secrets (external, user-supplied via `/run/base44/app.env`):** `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The client reads `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`; `.base44/dev-entrypoint.sh` aliases those from the canonical `SUPABASE_*` values before starting Vite (Vite's `loadEnv` picks up `VITE_`-prefixed process env).
- **Without Supabase credentials** the dev server still starts, but SSR routes throw (lazy Supabase client) and serve the error page. Add the three secrets and the platform recreates the web service.
- **node_modules** is an anonymous volume (not bind-mounted to host) to avoid host/container binary conflicts; installed on first boot by the entrypoint.
- **Verify:** `curl -sf -H "Host: external.preview.example" http://localhost:3000/` returns the app (not a Vite "Blocked request" page).
