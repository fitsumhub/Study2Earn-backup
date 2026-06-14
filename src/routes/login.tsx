import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Gift,
  LayoutDashboard,
  Lock,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/use-auth";
import { getRedirectContext } from "@/lib/auth-redirect";
import { leaderboard } from "@/lib/mock-data";
import { REFERRAL_FRIEND_BONUS } from "@/lib/referral-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Study2Earn" },
      { name: "description", content: "Sign in to continue your exam preparation." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  return <AuthShell mode="login" redirectTo={redirect} />;
}

export function AuthShell({
  mode,
  referralCode,
  redirectTo,
}: {
  mode: "login" | "register";
  referralCode?: string;
  redirectTo?: string;
}) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const redirectContext = getRedirectContext(redirectTo);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (isLogin) {
      signIn();
      toast.success(redirectContext ? `Welcome back — opening ${redirectContext.label}` : "Welcome back!");
    } else {
      signUp({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        university: String(form.get("university") ?? ""),
      });
      toast.success("Account created — welcome to Study2Earn!");
    }

    const destination =
      redirectTo && !redirectTo.startsWith("/login") && !redirectTo.startsWith("/register")
        ? redirectTo
        : "/dashboard";

    if (destination === "/dashboard") {
      void navigate({ to: "/dashboard" });
    } else {
      router.history.push(destination);
    }
  };

  const topThree = leaderboard.slice(0, 3);
  const isLeaderboardRedirect = redirectContext?.path === "/leaderboard";
  const isRewardsRedirect = redirectContext?.path === "/rewards";

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Left panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-navy p-12 text-white lg:flex">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-gold/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 size-72 rounded-full bg-white/5 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded bg-white font-serif text-xl font-bold text-brand-navy">
            S
          </div>
          <span className="font-serif text-xl font-bold tracking-tight">Study2Earn</span>
        </Link>

        <div className="relative max-w-md space-y-8">
          {redirectContext ? (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-gold">
                <Lock className="size-3.5" />
                Sign in required
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
                  Access {redirectContext.label}
                </p>
                <h2 className="mt-2 font-serif text-4xl font-bold leading-tight">
                  {redirectContext.title}
                </h2>
                <p className="mt-4 text-white/70">{redirectContext.subtitle}</p>
              </div>

              <ul className="space-y-3">
                {redirectContext.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-sm text-white/80">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-gold" />
                    {perk}
                  </li>
                ))}
              </ul>

              {isLeaderboardRedirect && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                      This week's top scholars
                    </p>
                    <Trophy className="size-4 text-brand-gold" />
                  </div>
                  <div className="space-y-3">
                    {topThree.map((student) => (
                      <div
                        key={student.rank}
                        className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5"
                      >
                        <span
                          className={cn(
                            "flex size-8 items-center justify-center rounded-lg font-serif text-sm font-bold",
                            student.rank === 1
                              ? "bg-brand-gold text-brand-navy"
                              : "bg-white/10 text-white",
                          )}
                        >
                          {student.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{student.name}</p>
                          <p className="truncate text-[11px] text-white/50">{student.uni}</p>
                        </div>
                        <p className="text-xs font-bold text-brand-gold">
                          {student.xp.toLocaleString()} XP
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-[11px] text-white/45">
                    Sign in to see the full top 10 and your rank
                  </p>
                </div>
              )}

              {isRewardsRedirect && (
                <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-brand-gold/20">
                      <Gift className="size-6 text-brand-gold" />
                    </div>
                    <div>
                      <p className="font-serif text-2xl font-bold">8 XP = 1 ETB</p>
                      <p className="text-xs text-white/60">Withdraw to 15 Ethiopian banks</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="font-serif text-4xl font-bold leading-tight">
                Master your exams,
                <span className="block text-brand-gold italic">Earn your future.</span>
              </h2>
              <p className="mt-6 text-white/70">
                Join 12,470 Ethiopian freshman students preparing for the national Exit Exam with
                verified content and real rewards.
              </p>
            </>
          )}
        </div>

        <p className="relative text-xs text-white/40">© 2026 Study2Earn Ethiopia</p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid size-8 place-items-center rounded bg-brand-navy font-serif text-xl font-bold text-white">
              S
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-brand-navy">
              Study2Earn
            </span>
          </Link>

          {redirectContext && (
            <div
              className={cn(
                "mb-6 rounded-2xl border p-4",
                isLeaderboardRedirect
                  ? "border-brand-navy/15 bg-brand-navy/5"
                  : "border-brand-gold/25 bg-brand-gold/10",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    isLeaderboardRedirect ? "bg-brand-navy text-white" : "bg-brand-gold text-white",
                  )}
                >
                  {isLeaderboardRedirect ? (
                    <Trophy className="size-5" />
                  ) : (
                    <Gift className="size-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                    Login required for {redirectContext.label}
                  </p>
                  <p className="mt-1 font-semibold text-brand-navy">{redirectContext.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{redirectContext.subtitle}</p>
                </div>
              </div>
            </div>
          )}

          <h1 className="font-serif text-3xl font-bold text-brand-navy">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {redirectContext
              ? `Sign in below — you'll be taken straight to ${redirectContext.label}.`
              : isLogin
                ? "Sign in to continue your exam preparation."
                : "Start studying smart and earning rewards today."}
          </p>

          {!isLogin && referralCode && (
            <div className="mt-4 rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-4 py-3 text-sm text-brand-navy">
              <span className="font-semibold">Referral applied!</span> Code{" "}
              <span className="font-mono font-bold">{referralCode}</span> — you'll receive{" "}
              <span className="font-bold text-brand-gold">{REFERRAL_FRIEND_BONUS} bonus XP</span>{" "}
              after signup.
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <Input label="Full name" name="name" type="text" placeholder="Abebe Balcha" />
            )}
            <Input label="Email" name="email" type="email" placeholder="you@university.edu.et" />
            <Input label="Password" name="password" type="password" placeholder="••••••••" />
            {!isLogin && (
              <Input
                label="University"
                name="university"
                type="text"
                placeholder="Addis Ababa University"
              />
            )}
            {!isLogin && (
              <Input
                label="Referral code (optional)"
                type="text"
                placeholder="ABEBE-7X2K"
                defaultValue={referralCode ?? ""}
              />
            )}

            {isLogin && (
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-[11px] text-slate-500">
                Demo mode — enter any email and password to sign in
              </p>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy py-3 text-sm font-semibold text-white shadow-lg shadow-brand-navy/20 transition hover:bg-brand-navy/90"
            >
              {isLogin ? (redirectContext?.cta ?? "Sign in") : "Create account"}
              <ArrowRight className="size-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <Link
                  to="/register"
                  search={{ ref: undefined, redirect: redirectTo }}
                  className="font-bold text-brand-navy underline decoration-brand-gold underline-offset-4"
                >
                  Sign up free
                </Link>
              </>
            ) : (
              <>
                Already registered?{" "}
                <Link
                  to="/login"
                  search={{ redirect: redirectTo, ref: undefined }}
                  className="font-bold text-brand-navy underline decoration-brand-gold underline-offset-4"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>

          {redirectContext && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                No account? Browse for free
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Link
                  to="/library"
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-100 p-3 text-center text-[11px] font-medium text-slate-600 transition hover:border-brand-navy/20 hover:bg-slate-50 hover:text-brand-navy"
                >
                  <BookOpen className="size-4" />
                  Library
                </Link>
                <Link
                  to="/exams"
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-100 p-3 text-center text-[11px] font-medium text-slate-600 transition hover:border-brand-navy/20 hover:bg-slate-50 hover:text-brand-navy"
                >
                  <ClipboardList className="size-4" />
                  Exams
                </Link>
                <Link
                  to="/dashboard"
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-100 p-3 text-center text-[11px] font-medium text-slate-600 transition hover:border-brand-navy/20 hover:bg-slate-50 hover:text-brand-navy"
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}

function Input({
  label,
  name,
  type,
  placeholder,
  defaultValue,
}: {
  label: string;
  name?: string;
  type: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/40"
      />
    </label>
  );
}
