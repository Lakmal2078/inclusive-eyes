#!/bin/sh
set -e

# The Supabase client reads `import.meta.env.VITE_*` (client bundle) and falls back
# to `process.env.SUPABASE_*` (SSR). The platform delivers the canonical values as
# SUPABASE_* via /run/base44/app.env; alias the VITE_-prefixed names from them so a
# single source of truth feeds both the client and server.
export VITE_SUPABASE_URL="${SUPABASE_URL}"
export VITE_SUPABASE_PUBLISHABLE_KEY="${SUPABASE_PUBLISHABLE_KEY}"

# node_modules is bind-mounted from the host and persists across restarts.
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund
fi

exec npm run dev
