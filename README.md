# Fast Cash

Fast Cash is a multilingual (English / සිංහල / தமிழ்) deposit & withdrawal agent portal for 1xBet players in Sri Lanka. Players submit deposit and withdrawal requests with receipt OCR, and agents process them from an admin portal.

Live: https://inclusive-eyes.lovable.app

## Features

- Deposit requests with agent bank/wallet account list and in-browser receipt OCR (Tesseract.js)
- Withdrawal requests with security code + bank details
- Transaction history with status (PENDING / APPROVED / COMPLETED / REJECTED)
- Email + password accounts (Lovable Cloud auth), roles stored server-side
- Admin portal: stats, request approval, agent account management, system settings
- Rule-based support chat, WhatsApp quick contact, promotions and info pages
- 3 languages, dark/light theme, PWA install banner
- Accessibility: single `h1` per page, labelled inputs, ARIA on menus/modals, visible `:focus-visible` rings, `lang` synced to the selected language, zero axe violations

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start v1 (React 19, file-based routing) |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 + `src/fastcash.css` design tokens |
| Backend | Lovable Cloud (Postgres, Auth, RLS) |
| OCR | Tesseract.js (browser only) |
| Runtime | Edge worker (Cloudflare workerd) |

## Project structure

```
src/
  routes/            file-based routes (__root.tsx is the shared layout)
  components/fastcash/  ported UI: pages.jsx, AdminPanel.jsx, ReceiptScanner.jsx
  lib/fastcash/      api.ts (data layer), FastCashContext.tsx (state), translations.js
  integrations/supabase/  generated backend client (do not edit)
  fastcash.css       app design tokens
  styles.css         Tailwind entry
public/              favicon.png, og-image.png, robots.txt
docs/                the guides listed below
```

## Quick start

```bash
npm install
npm run dev      # http://localhost:8080
```

Full steps: [docs/INSTALLATION.md](docs/INSTALLATION.md)

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Environment Variables](docs/ENVIRONMENT.md)
- [API Documentation](docs/API.md)
- [Admin Manual](docs/ADMIN_MANUAL.md)
- [User Manual](docs/USER_MANUAL.md)
- [Backup Guide](docs/BACKUP.md)
- [Security Checklist](docs/SECURITY_CHECKLIST.md)
- [Testing Checklist](docs/TESTING_CHECKLIST.md)
- [Production Checklist](docs/PRODUCTION_CHECKLIST.md)

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build (used for preview checks) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Responsible gambling

The app targets 18+ users only and links to a privacy policy and responsible-gambling notice. Keep those notices in place in any fork.
