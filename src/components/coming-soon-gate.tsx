import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import type { ReactNode } from "react";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { useIsComingSoon } from "@/hooks/use-coming-soon";
import type { ComingSoonPageKey } from "@/lib/coming-soon-store";

/**
 * Wraps a full page. When the admin has marked this page key as "Coming
 * Soon" (Settings → Coming Soon Pages), replaces the entire page with a
 * placeholder poster instead of rendering children.
 */
export function ComingSoonGate({
  pageKey,
  children,
}: {
  pageKey: ComingSoonPageKey;
  children: ReactNode;
}) {
  const page = useIsComingSoon(pageKey);

  if (!page.enabled) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
            <Rocket className="size-8" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-brand-navy">{page.title}</h1>
          <p className="mt-3 text-slate-500">{page.message}</p>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-navy/90"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
