import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { PageLoader } from "@/components/page-loader";
import { useAuth } from "@/hooks/use-auth";
import { isAdminUser } from "@/lib/auth-data";

export function RequireAuthClient({
  redirectTo,
  requireAdmin,
  loginPath = "/login",
  children,
}: {
  redirectTo: string;
  /** When true, non-admin (but logged-in) users are bounced to "/" instead of seeing children. */
  requireAdmin?: boolean;
  /**
   * The login page to redirect unauthenticated visitors to.
   * Defaults to "/login" (student login). Pass "/admin/login" for the admin console.
   */
  loginPath?: string;
  children: ReactNode;
}) {
  const { loggedIn, user } = useAuth();
  const navigate = useNavigate();

  // Auth is client-only (localStorage), so the server — and the first client
  // render, which must match the server markup — always sees "logged out".
  // Wait for that hydration render to settle before trusting `loggedIn`,
  // otherwise a logged-in user gets redirected off the stale first read.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const authorized = loggedIn && (!requireAdmin || isAdminUser(user));

  useEffect(() => {
    if (!hydrated) return;
    if (!loggedIn) {
      // Use the custom loginPath if provided (e.g. "/admin/login"), otherwise
      // fall back to the student login with a redirect query param.
      if (loginPath === "/admin/login") {
        void navigate({ to: "/admin/login" });
      } else {
        void navigate({
          to: "/login",
          search: { redirect: redirectTo, ref: undefined },
        });
      }
    } else if (requireAdmin && !isAdminUser(user)) {
      void navigate({ to: "/" });
    }
  }, [hydrated, loggedIn, requireAdmin, user, navigate, redirectTo, loginPath]);

  if (!hydrated || !authorized) {
    return <PageLoader label="Checking your session…" />;
  }

  return children;
}
