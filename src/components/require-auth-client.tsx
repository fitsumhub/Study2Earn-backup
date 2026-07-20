import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { PageLoader } from "@/components/page-loader";
import { useAuth } from "@/hooks/use-auth";

export function RequireAuthClient({
  redirectTo,
  children,
}: {
  redirectTo: string;
  children: ReactNode;
}) {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();

  // Auth is client-only (localStorage), so the server — and the first client
  // render, which must match the server markup — always sees "logged out".
  // Wait for that hydration render to settle before trusting `loggedIn`,
  // otherwise a logged-in user gets redirected off the stale first read.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && !loggedIn) {
      void navigate({
        to: "/login",
        search: { redirect: redirectTo, ref: undefined },
      });
    }
  }, [hydrated, loggedIn, navigate, redirectTo]);

  if (!hydrated || !loggedIn) {
    return <PageLoader label="Checking your session…" />;
  }

  return children;
}
