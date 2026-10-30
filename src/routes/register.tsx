import { createFileRoute } from "@tanstack/react-router";

import { AuthShell } from "@/components/auth-shell";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === "string" ? search.ref : undefined,
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create account — Study2Earn" },
      {
        name: "description",
        content: "Join Study2Earn and start preparing for the Ethiopian freshman Exit Exam.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { ref, redirect } = Route.useSearch();
  return <AuthShell mode="register" referralCode={ref} redirectTo={redirect} />;
}
