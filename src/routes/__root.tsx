import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AdSenseLoader } from "../components/adsense-loader";
import { NotificationWatcher } from "../components/notification-watcher";
import { PwaRegister } from "../components/pwa-register";
import { Toaster } from "../components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Minimal inline header */}
      <div className="border-b border-slate-200 bg-white/90 px-6 py-4">
        <Link to="/" className="flex w-fit items-center gap-2">
          <div className="grid size-8 place-items-center rounded bg-brand-navy font-serif text-xl font-bold text-white">
            S
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-brand-navy">
            Study2Earn
          </span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg text-center">
          {/* Large decorative number */}
          <div className="relative mb-8 select-none">
            <span className="font-serif text-[9rem] font-bold leading-none text-slate-100">
              404
            </span>
            <span className="absolute inset-0 flex items-center justify-center font-serif text-5xl font-bold text-brand-navy">
              Oops!
            </span>
          </div>

          <h1 className="font-serif text-2xl font-bold text-brand-navy">Page not found</h1>
          <p className="mt-3 text-slate-500">
            That page doesn't exist or has been moved. Here are some places to go instead:
          </p>

          {/* Quick nav tiles */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { to: "/", label: "Home", desc: "Back to start" },
              { to: "/library", label: "Library", desc: "Browse books" },
              { to: "/exams", label: "Mock Exams", desc: "Practice now" },
              { to: "/dashboard", label: "Dashboard", desc: "Your progress" },
              { to: "/rewards", label: "Rewards", desc: "Redeem XP" },
              { to: "/help", label: "Help", desc: "Get support" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-gold/40 hover:shadow-md"
              >
                <p className="text-sm font-bold text-brand-navy">{l.label}</p>
                <p className="text-xs text-slate-500">{l.desc}</p>
              </Link>
            ))}
          </div>

          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-navy/90"
          >
            ← Go to homepage
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
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
      { title: "Study2Earn — Ethiopian Freshman Exit Exam Prep" },
      {
        name: "description",
        content:
          "Gamified Exit Exam preparation for Ethiopian freshman university students. Study, compete, earn rewards.",
      },
      { name: "author", content: "Study2Earn" },
      { property: "og:title", content: "Study2Earn — Ethiopian Freshman Exit Exam Prep" },
      {
        property: "og:description",
        content:
          "Gamified Exit Exam preparation for Ethiopian freshman university students. Study, compete, earn rewards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Study2Earn — Ethiopian Freshman Exit Exam Prep" },
      {
        name: "twitter:description",
        content:
          "Gamified Exit Exam preparation for Ethiopian freshman university students. Study, compete, earn rewards.",
      },
      { property: "og:image", content: "/og-image.jpg" },
      { name: "twitter:image", content: "/og-image.jpg" },
      { name: "theme-color", content: "#1e3a8a" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Study2Earn" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Preload the font CSS — non-blocking: browser fetches it in background,
      // swaps fonts in when ready. Eliminates the render-blocking stylesheet.
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const THEME_SCRIPT = `try{if(localStorage.getItem('study2earn-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ScrollToTop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      <NotificationWatcher />
      <AdSenseLoader />
      <PwaRegister />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
