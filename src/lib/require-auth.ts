import { redirect } from "@tanstack/react-router";

import { isAuthenticated } from "@/lib/auth-store";

export function requireAuth(redirectTo: string) {
  if (typeof window === "undefined") return;
  if (!isAuthenticated()) {
    throw redirect({
      to: "/login",
      search: { redirect: redirectTo, ref: undefined },
    });
  }
}
