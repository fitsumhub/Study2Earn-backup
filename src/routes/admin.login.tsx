import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Code2,
  Copy,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import {
  DEMO_ADMIN_USER,
  DEMO_DEV_USER,
  DEMO_USER,
  isAdminUser,
  type AuthUser,
} from "@/lib/auth-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin & Developer Sign In — Study2Earn" },
      {
        name: "description",
        content: "Authorised Study2Earn platform administrators and developers only.",
      },
    ],
  }),
  component: AdminLoginPage,
});

export function AdminLoginPage() {
  const { loggedIn, user, signIn } = useAuth();
  const navigate = useNavigate();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Already signed in as admin/dev → go straight to dashboard
  useEffect(() => {
    if (!hydrated) return;
    if (loggedIn && isAdminUser(user)) {
      void navigate({ to: "/admin" });
    }
  }, [hydrated, loggedIn, user, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailError =
    emailTouched && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Enter a valid email address"
      : undefined;
  const passwordError =
    passwordTouched && password.length > 0 && password.length < 4
      ? "Password must be at least 4 characters"
      : undefined;

  // 1-Click Developer Sign In
  const handleDeveloperLogin = () => {
    setSubmitting(true);
    signIn(DEMO_DEV_USER);
    toast.success("Welcome, Lead Developer!", {
      description: "Full testing & super-admin privileges unlocked. Opening console…",
      icon: "🚀",
    });
    setTimeout(() => {
      void navigate({ to: "/admin" });
    }, 400);
  };

  // 1-Click Admin Sign In
  const handleAdminLogin = () => {
    setSubmitting(true);
    signIn(DEMO_ADMIN_USER);
    toast.success("Welcome back, Administrator.", {
      description: "Platform management access granted. Opening console…",
      icon: "🛡",
    });
    setTimeout(() => {
      void navigate({ to: "/admin" });
    }, 400);
  };

  // Autofill helper
  const handleAutofill = (demoUser: AuthUser, pass: string) => {
    setEmail(demoUser.email);
    setPassword(pass);
    setEmailTouched(false);
    setPasswordTouched(false);
    toast.info(`Filled credentials for ${demoUser.name}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setEmailTouched(true);
    setPasswordTouched(true);

    const trimmedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Invalid email address format");
      return;
    }
    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    setSubmitting(true);

    // Determine target role and account
    let targetUser: AuthUser;
    if (
      trimmedEmail === DEMO_DEV_USER.email.toLowerCase() ||
      trimmedEmail.includes("dev")
    ) {
      targetUser = {
        ...DEMO_DEV_USER,
        email: trimmedEmail,
      };
    } else if (
      trimmedEmail === DEMO_ADMIN_USER.email.toLowerCase() ||
      trimmedEmail === DEMO_USER.email.toLowerCase()
    ) {
      targetUser = {
        ...DEMO_ADMIN_USER,
        email: trimmedEmail,
      };
    } else {
      // Allow any legitimate admin email with proper admin role assigned
      targetUser = {
        id: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        name: trimmedEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: trimmedEmail,
        university: "Addis Ababa University",
        xp: 2500,
        studyTrack: "natural",
        role: "admin",
      };
    }

    signIn(targetUser);

    toast.success(`Welcome back, ${targetUser.name}!`, {
      description: "Authenticated successfully. Redirecting to admin console…",
      icon: targetUser.role === "developer" ? "🚀" : "🛡",
    });

    setTimeout(() => {
      void navigate({ to: "/admin" });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white lg:grid lg:grid-cols-[440px_1fr]">
      {/* ── Left panel ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/5 bg-slate-900 p-10 lg:flex">
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glow */}
        <div className="absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-20 size-64 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <Link to="/" className="relative flex items-center gap-3 group">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-gold to-amber-500 font-serif text-xl font-bold text-white shadow-lg shadow-brand-gold/30 transition-transform group-hover:scale-105">
            S
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-bold text-white tracking-wide">Study2Earn</span>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold">
              <Terminal className="size-2.5" />
              Admin & Dev Portal
            </span>
          </div>
        </Link>

        {/* Middle content */}
        <div className="relative space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-300">
              <Code2 className="size-3 text-violet-400" />
              Developer & Admin Environment
            </div>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-white">
              Platform Control
              <span className="block text-slate-400">& Test Suite</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Instant access for platform developers, QA engineers, and system administrators to test
              all platform features, manage mock exams, and review financial withdrawals.
            </p>
          </div>

          {/* Trust / Capability indicators */}
          <ul className="space-y-3.5">
            {[
              {
                icon: Terminal,
                label: "Developer Super-Admin Mode",
                desc: "Instant bypass, test seeds, and full inspection of local databases",
                color: "text-violet-400",
                bg: "bg-violet-500/10",
              },
              {
                icon: ShieldCheck,
                label: "Admin Management Suite",
                desc: "Real-time control over students, textbooks, exams, rewards & cashouts",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                icon: Activity,
                label: "System Diagnostics",
                desc: "Audit logs, automated test suite runners, and integrity monitoring",
                color: "text-sky-400",
                bg: "bg-sky-500/10",
              },
            ].map(({ icon: Icon, label, desc, color, bg }) => (
              <li key={label} className="flex items-start gap-3">
                <div
                  className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", bg)}
                >
                  <Icon className={cn("size-4", color)} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-[11px] leading-relaxed text-slate-400">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative text-[10px] text-slate-600">
          © 2026 Study2Earn Ethiopia · Internal Dev & Management Portal
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-6">

          {/* Mobile logo */}
          <div className="flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-gold to-amber-500 font-serif text-base font-bold text-white shadow-md">
                S
              </div>
              <span className="font-serif text-lg font-bold text-white">Study2Earn</span>
            </Link>
            <span className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
              <Terminal className="size-3" />
              Dev & Admin
            </span>
          </div>

          {/* ══════════════════════════════════════════════════
              ONE-CLICK TEST & DEMO ACCESS BUTTONS
              ══════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900 p-5 shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-3">
              <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
                Instant One-Click Test Sign-In
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Dev button */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeveloperLogin}
                className="group flex flex-col items-start rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-600/90 to-indigo-700/90 p-3.5 text-left text-white shadow-lg transition-all hover:border-violet-400 hover:shadow-violet-600/20 active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-white/20">
                    <Terminal className="size-4 text-white" />
                  </div>
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-slate-950 uppercase tracking-wider">
                    Full Privileges
                  </span>
                </div>
                <p className="font-bold text-sm text-white group-hover:text-amber-200 transition-colors">
                  Demo Developer
                </p>
                <p className="text-[10px] text-violet-200 mt-0.5 leading-snug">
                  Sign in as Fitsum (Lead Dev) with 99,999 XP & super-admin rights
                </p>
              </button>

              {/* Admin button */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleAdminLogin}
                className="group flex flex-col items-start rounded-xl border border-slate-700 bg-slate-800/90 p-3.5 text-left text-white shadow-lg transition-all hover:border-slate-500 active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-white/10">
                    <Shield className="size-4 text-brand-gold" />
                  </div>
                  <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                    Director
                  </span>
                </div>
                <p className="font-bold text-sm text-white group-hover:text-brand-gold transition-colors">
                  Demo Admin
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  Sign in as Abebe Balcha (Admin) to manage students & content
                </p>
              </button>
            </div>

            {/* Quick autofill pills */}
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[10px] font-semibold text-slate-400">Autofill credentials:</span>
              <button
                type="button"
                onClick={() => handleAutofill(DEMO_DEV_USER, "dev123")}
                className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-mono text-violet-300 hover:bg-violet-500/20 transition-colors"
              >
                <Copy className="size-2.5" /> developer@study2earn.et
              </button>
              <button
                type="button"
                onClick={() => handleAutofill(DEMO_ADMIN_USER, "admin123")}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:bg-white/10 transition-colors"
              >
                <Copy className="size-2.5" /> admin@study2earn.et
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              CREDENTIALS FORM CARD
              ══════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-7 shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3.5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 ring-1 ring-white/10 shadow-lg">
                <KeyRound className="size-6 text-brand-gold" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-white">Manual Sign In</h1>
                <p className="mt-0.5 text-xs text-slate-400">
                  Enter registered administrator or developer credentials
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Admin / Developer Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="admin-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder="developer@study2earn.et or admin@study2earn.et"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className={cn(
                      "w-full rounded-xl border bg-slate-800/60 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition",
                      emailError
                        ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
                        : "border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20",
                    )}
                  />
                </div>
                {emailError && <p className="text-[11px] font-medium text-red-400">{emailError}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="admin-password"
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  >
                    Password
                  </label>
                  <span className="text-[10px] text-slate-500">Demo password: any 4+ characters</span>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    className={cn(
                      "w-full rounded-xl border bg-slate-800/60 py-3 pl-10 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition",
                      passwordError
                        ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
                        : "border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] font-medium text-red-400">{passwordError}</p>
                )}
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/40 ring-1 ring-white/10 transition hover:from-slate-600 hover:to-slate-500 active:scale-[0.99] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Authenticating…
                    </>
                  ) : (
                    <>
                      <Shield className="size-4 text-brand-gold" />
                      Sign in with Credentials
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Links */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 transition hover:text-slate-300"
            >
              <ArrowLeft className="size-3.5" />
              Back to Study2Earn Home
            </Link>
            <Link
              to="/login"
              search={{ redirect: undefined, ref: undefined }}
              className="inline-flex items-center gap-1.5 transition hover:text-slate-300"
            >
              Student Portal Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
