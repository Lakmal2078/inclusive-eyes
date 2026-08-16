import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import fastCashCss from "../fastcash.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { FastCashProvider, useFastCash } from "@/lib/fastcash/FastCashContext";
import { Header, PwaInstallBanner, WhatsAppModal, getWhatsAppUrl } from "@/components/fastcash/pages.jsx";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#08131d" },
      { name: "author", content: "Fast Cash" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: fastCashCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppShell() {
  const {
    t,
    lang,
    setLang,
    theme,
    toggleTheme,
    user,
    logout,
    drawer,
    setDrawer,
    page,
    move,
    toast,
    waModalTx,
    closeWaModal,
  } = useFastCash();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header
        page={page}
        move={move}
        user={user}
        logout={logout}
        drawer={drawer}
        setDrawer={setDrawer}
        theme={theme}
        toggleTheme={toggleTheme}
        lang={lang}
        setLang={setLang}
        t={t}
      />
      <main id="main-content">
        <PwaInstallBanner t={t} />
        <Outlet />
      </main>
      <footer>
        <b>FAST CASH</b>
        <span>{t.footer.text}</span>
        <nav aria-label="Footer">
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            <button type="button" onClick={() => move("PrivacyPolicy")}>
              {t?.nav?.["PrivacyPolicy"] || "Privacy Policy"}
            </button>
            <button type="button" onClick={() => move("Admin")}>
              {t?.nav?.["Admin"] || "Admin"}
            </button>
            <button type="button" onClick={() => move("Support")}>
              {t.footer.support}
            </button>
          </div>
        </nav>
      </footer>
      <nav className="bottom-nav" aria-label="Primary">
        {([
          ["🏠", "Home"],
          ["⚡", "Deposit"],
          ["💳", "Withdraw"],
          ["📋", "Transactions"],
          ["☰", "Menu"],
        ] as const).map(([icon, p]) => (
          <button
            type="button"
            onClick={() => (p === "Menu" ? setDrawer(true) : move(p))}
            aria-current={page === p ? "page" : undefined}
            aria-expanded={p === "Menu" ? drawer : undefined}
            aria-label={t.nav[p] || p}
            key={p}
          >
            <b aria-hidden="true">{icon}</b>
            {t.nav[p] || p}
          </button>
        ))}
      </nav>

      {waModalTx && (
        <WhatsAppModal tx={waModalTx} onClose={closeWaModal} lang={lang} user={user} t={t} />
      )}
      <aside aria-label="Quick support">
      <a
        href={getWhatsAppUrl(null, lang, user)}
        target="_blank"
        rel="noreferrer"
        className="floating-wa-fab"
        aria-label={t.whatsapp.floatingTitle || "WhatsApp support"}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.332 5.001L2 22l5.132-1.339c1.461.792 3.111 1.21 4.88 1.21h.005c5.505 0 9.988-4.478 9.989-9.985 0-2.667-1.037-5.176-2.924-7.062C17.195 2.937 14.685 2 12.012 2zm5.836 14.339c-.244.688-1.42 1.313-1.961 1.393-.497.073-1.139.11-3.328-.795-2.798-1.157-4.597-4.004-4.737-4.192-.138-.188-1.127-1.503-1.127-2.868 0-1.365.708-2.036.958-2.313.244-.271.533-.339.711-.339.178 0 .356.002.511.01.168.008.396-.064.62.473.229.549.778 1.897.845 2.035.067.138.112.301.022.481-.089.179-.134.292-.267.448-.133.156-.281.349-.401.468-.134.133-.274.279-.118.547.156.268.692 1.14 1.484 1.844 1.018.905 1.874 1.187 2.142 1.32.268.134.423.112.579-.067.156-.179.667-.778.845-1.045.178-.268.356-.223.599-.134.244.089 1.556.734 1.823.868.267.134.445.201.511.312.067.111.067.644-.177 1.332z" />
        </svg>
      </a>
      </aside>
      {/* Status messages are announced to screen readers as they appear. */}
      <div aria-live="polite" aria-atomic="true">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <FastCashProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <AppShell />
      </FastCashProvider>
    </QueryClientProvider>
  );
}
