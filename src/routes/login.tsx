import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  FlaskConical,
  Gift,
  Globe,
  GraduationCap,
  Lock,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import type { StudyTrack } from "@/lib/auth-data";
import { getRedirectContext } from "@/lib/auth-redirect";
import { leaderboard } from "@/lib/mock-data";
import { REFERRAL_FRIEND_BONUS } from "@/lib/referral-data";
import { cn } from "@/lib/utils";

const GUEST_ACCESS_ITEMS = [
  {
    to: "/library" as const,
    icon: BookOpen,
    label: "Library",
    desc: "Browse & read MoE textbooks and past exam papers",
    iconColor: "bg-brand-navy/10 text-brand-navy",
  },
  {
    to: "/exams" as const,
    icon: ClipboardList,
    label: "Mock Exams",
    desc: "Take timed practice tests for any course",
    iconColor: "bg-emerald-100 text-emerald-700",
  },
  {
    to: "/ai-study" as const,
    icon: Sparkles,
    label: "AI Study",
    desc: "Ask questions and get instant explanations",
    iconColor: "bg-brand-gold/15 text-brand-gold",
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ETHIOPIAN_UNIVERSITIES = [
  "Addis Ababa University",
  "Addis Ababa Science and Technology University",
  "Bahir Dar University",
  "Jimma University",
  "Hawassa University",
  "Mekelle University",
  "Gondar University (University of Gondar)",
  "Haramaya University",
  "Arba Minch University",
  "Adama Science and Technology University",
  "Dire Dawa University",
  "Wollo University",
  "Debre Markos University",
  "Wolkite University",
  "Aksum University",
  "Dilla University",
  "Ambo University",
  "Wollega University",
  "Debre Berhan University",
  "Bule Hora University",
  "Assosa University",
  "Gambella University",
  "Woldia University",
  "Injibara University",
  "Mettu University",
  "Mizan-Tepi University",
  "Semera University",
  "Kebri Dehar University",
];

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
  const { signIn } = useAuth();
  const redirectContext = getRedirectContext(redirectTo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailError =
    emailTouched && email.length > 0 && !EMAIL_REGEX.test(email)
      ? "Enter a valid email address"
      : undefined;
  const passwordError =
    passwordTouched && password.length > 0 && password.length < 6
      ? "Password must be at least 6 characters"
      : undefined;

  const handleDemoLogin = () => {
    signIn();
    toast.success(
      redirectContext ? `Welcome back — opening ${redirectContext.label}` : "Welcome back!",
    );
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setEmailTouched(true);
    setPasswordTouched(true);

    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error("Invalid email address", {
        description: "Please enter a valid email address.",
      });
      return;
    }
    if (password.length < 6) {
      toast.error("Invalid password", {
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    setSubmitting(true);
    signIn();
    toast.success(
      redirectContext ? `Welcome back — opening ${redirectContext.label}` : "Welcome back!",
    );

    const destination =
      redirectTo && !redirectTo.startsWith("/login") && !redirectTo.startsWith("/register")
        ? redirectTo
        : "/dashboard";

    // Defer navigation one tick so the auth store write propagates before route guard checks
    setTimeout(() => {
      if (destination === "/dashboard") {
        void navigate({ to: "/dashboard" });
      } else {
        router.history.push(destination);
      }
    }, 0);
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
          ) : isLogin ? (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-gold">
                <Users className="size-3.5" />
                Open to everyone in Ethiopia
              </div>
              <h2 className="font-serif text-4xl font-bold leading-tight">
                Read a book,
                <span className="block text-brand-gold italic">Earn real money.</span>
              </h2>
              <p className="mt-6 text-white/70">
                Study2Earn isn't just for students — anyone can get free access to books and turn
                reading time into verified XP you can withdraw as cash.
              </p>

              <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
                {[
                  { value: "12,470+", label: "Active readers" },
                  { value: "500+", label: "Free books" },
                  { value: "15+", label: "Partner banks" },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <p className="font-serif text-xl font-bold text-brand-gold">{value}</p>
                    <p className="text-[11px] text-white/50">{label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Register-specific left panel */
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-gold">
                <BadgeCheck className="size-3.5" />
                Free to join
              </div>

              <div>
                <h2 className="font-serif text-4xl font-bold leading-tight">
                  Ethiopia's #1 rewards platform
                  <span className="block text-brand-gold italic">for every reader.</span>
                </h2>
                <p className="mt-4 text-sm text-white/65">
                  No student ID required. Read free books, prep for exams if you want to, and
                  convert your reading time into cash withdrawals — all in one platform.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: GraduationCap,
                    step: "01",
                    title: "Create your account",
                    desc: "Free forever — students and non-students welcome.",
                  },
                  {
                    icon: CheckCircle2,
                    step: "02",
                    title: "Read & earn XP",
                    desc: "Read free books, take mock exams, climb the leaderboard.",
                  },
                  {
                    icon: Wallet,
                    step: "03",
                    title: "Withdraw real money",
                    desc: "Convert XP to ETB via 15+ Ethiopian banks.",
                  },
                ].map(({ icon: Icon, step, title, desc }) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="size-5 text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        Step {step}
                      </p>
                      <p className="font-semibold leading-snug">{title}</p>
                      <p className="text-sm text-white/55">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
                {[
                  { value: "12,470+", label: "Active readers" },
                  { value: "500+", label: "Free books" },
                  { value: "15+", label: "Partner banks" },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <p className="font-serif text-xl font-bold text-brand-gold">{value}</p>
                    <p className="text-[11px] text-white/50">{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="relative text-xs text-white/40">© 2026 Study2Earn Ethiopia</p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded bg-brand-navy font-serif text-xl font-bold text-white">
                S
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-brand-navy">
                Study2Earn
              </span>
            </Link>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: Zap, label: "12,470 readers" },
                { icon: BookOpen, label: "500+ free books" },
                { icon: BadgeCheck, label: "Open to everyone" },
              ].map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm"
                >
                  <s.icon className="size-3 text-brand-gold" />
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {isLogin ? (
            <>
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
                        isLeaderboardRedirect
                          ? "bg-brand-navy text-white"
                          : "bg-brand-gold text-white",
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

              <h1 className="font-serif text-3xl font-bold text-brand-navy">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-500">
                {redirectContext
                  ? `Sign in below — you'll be taken straight to ${redirectContext.label}.`
                  : "Sign in to keep reading, learning, and earning."}
              </p>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  icon={Mail}
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={setEmail}
                  onBlur={() => setEmailTouched(true)}
                  error={emailError}
                />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        toast.info("Password reset isn't available in this demo", {
                          description: 'Try "Enter as Demo" below for instant access.',
                        })
                      }
                      className="text-[11px] font-semibold text-brand-navy hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <PasswordInput
                    id="login-password"
                    label={null}
                    name="password"
                    autoComplete="current-password"
                    required
                    showStrength={false}
                    value={password}
                    onChange={setPassword}
                    onBlur={() => setPasswordTouched(true)}
                    error={passwordError}
                  />
                </div>
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-navy/25 transition hover:bg-brand-navy/90 active:scale-[0.99] disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Signing in…
                      </>
                    ) : (
                      <>
                        {redirectContext?.cta ?? "Sign in"} <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="size-3.5 text-slate-300" />
                    Your data is encrypted and never shared
                  </p>
                </div>
              </form>

              <div className="mt-8">
                <FormSectionLabel>or explore without an account</FormSectionLabel>
              </div>
              <div className="mt-4">
                <DemoCard onLogin={handleDemoLogin} />
              </div>
              <GuestAccessCards />
            </>
          ) : (
            <RegisterWizard referralCode={referralCode} redirectTo={redirectTo} />
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <p className="text-sm text-slate-500">
              {isLogin ? (
                <>
                  No account?{" "}
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
                  Have an account?{" "}
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
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoCard({ onLogin }: { onLogin: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin();
    }, 900);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
          <Zap className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-navy">Try the demo account</p>
          <p className="truncate text-[11px] text-slate-500">
            Full platform access, no signup required
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-navy/90 active:scale-[0.98] disabled:opacity-70"
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : "Enter demo"}
      </button>
    </div>
  );
}

function GuestAccessCards() {
  return (
    <div className="mt-3 space-y-2">
      {GUEST_ACCESS_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="group flex w-full items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-brand-navy/30 hover:shadow-md active:scale-[0.99]"
        >
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              item.iconColor,
            )}
          >
            <item.icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-navy">{item.label}</p>
            <p className="truncate text-[11px] text-slate-500">{item.desc}</p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-navy" />
        </Link>
      ))}
    </div>
  );
}

function FormSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="h-px flex-1 bg-slate-100" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {children}
      </span>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

function Input({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  helper,
  error,
  list,
  icon: Icon,
  autoComplete,
  required,
  autoFocus,
}: {
  label: string;
  name?: string;
  type: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  helper?: string;
  error?: string;
  list?: string;
  icon?: typeof Mail;
  autoComplete?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const id = `field-${name ?? label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-300">
            <Icon className="size-4" />
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          list={list}
          autoComplete={autoComplete}
          required={required}
          autoFocus={autoFocus}
          className={cn(
            "w-full rounded-xl border bg-white py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition",
            Icon ? "pl-10 pr-4" : "px-4",
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-slate-200 focus:border-brand-navy focus:ring-brand-navy/20",
          )}
        />
      </div>
      {error ? (
        <p className="text-[11px] font-medium text-red-500">{error}</p>
      ) : helper ? (
        <p className="text-[11px] text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
}

function RegisterWizard({
  referralCode,
  redirectTo,
}: {
  referralCode?: string;
  redirectTo?: string;
}) {
  const [step, setStep] = useState(1);
  const [studyTrack, setStudyTrack] = useState<StudyTrack | "none" | "">("");
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [referral, setReferral] = useState(referralCode ?? "");
  const [termsChecked, setTermsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isEduEt = email.toLowerCase().endsWith(".edu.et");
  const pwdStrength = getStrength(pwd);
  const pwdMatch = confirmPwd.length > 0 && pwd === confirmPwd;
  const bonusXp = 50 + (referral.trim() ? REFERRAL_FRIEND_BONUS : 0);

  const handleSubmit = () => {
    if (!termsChecked) {
      toast.error("Please accept the terms");
      return;
    }
    setSubmitting(true);
    if (!isEduEt) {
      toast.warning("Manual approval required", {
        description: "Non-.edu.et emails may require admin review before access is granted.",
      });
    }
    signUp({
      name,
      email,
      university,
      studyTrack: studyTrack === "natural" || studyTrack === "social" ? studyTrack : undefined,
      referralCode: referral.trim(),
      password: pwd,
    });
    toast.success("Account created — welcome to Study2Earn!");
    const dest =
      redirectTo && !redirectTo.startsWith("/login") && !redirectTo.startsWith("/register")
        ? redirectTo
        : "/dashboard";
    setTimeout(() => {
      if (dest === "/dashboard") void navigate({ to: "/dashboard" });
      else router.history.push(dest);
    }, 0);
  };

  const STEPS = [
    { label: "Track" },
    { label: "Profile" },
    { label: "Security" },
    { label: "Review" },
  ];

  return (
    <>
      {/* Step progress */}
      <div className="mb-8">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-xs font-bold ring-4 transition-all duration-300",
                    step > i + 1
                      ? "bg-brand-gold text-white ring-brand-gold/20"
                      : step === i + 1
                        ? "bg-brand-navy text-white ring-brand-navy/15"
                        : "bg-slate-100 text-slate-400 ring-transparent",
                  )}
                >
                  {step > i + 1 ? <CheckCircle2 className="size-4" /> : <span>{i + 1}</span>}
                </div>
                <span
                  className={cn(
                    "hidden text-[10px] font-bold sm:block",
                    step === i + 1 ? "text-brand-navy" : "text-slate-300",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-all duration-500",
                    step > i + 1 ? "bg-brand-gold" : "bg-slate-200",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Study Track ── */}
      {step === 1 && (
        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
          <h1 className="font-serif text-3xl font-bold text-brand-navy">Choose your path</h1>
          <p className="mt-2 text-sm text-slate-500">
            Prepping for the Exit Exam? Pick a track to personalize it. Just here to read and earn?
            Choose "Not a student" below.
          </p>

          <div className="mt-6 space-y-3">
            {[
              {
                id: "natural" as const,
                label: "Natural Science",
                icon: FlaskConical,
                subjects: ["Biology", "Chemistry", "Physics", "Mathematics"],
                activeBadge: "border-white/20 bg-white/10 text-white/80",
                idleBadge: "border-blue-200 bg-blue-50 text-blue-700",
              },
              {
                id: "social" as const,
                label: "Social Science",
                icon: Globe,
                subjects: ["History", "Civics", "Geography", "English"],
                activeBadge: "border-white/20 bg-white/10 text-white/80",
                idleBadge: "border-amber-200 bg-amber-50 text-amber-700",
              },
              {
                id: "none" as const,
                label: "Not a student",
                icon: BookOpen,
                subjects: ["Free books", "Read & earn XP", "No exams required"],
                activeBadge: "border-white/20 bg-white/10 text-white/80",
                idleBadge: "border-emerald-200 bg-emerald-50 text-emerald-700",
              },
            ].map((track) => {
              const sel = studyTrack === track.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setStudyTrack(track.id)}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-200",
                    sel
                      ? "border-transparent bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                      : "border-slate-200 bg-white hover:border-brand-navy/30 hover:shadow-lg",
                  )}
                >
                  {sel && (
                    <div className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-brand-gold shadow-md">
                      <CheckCircle2 className="size-3.5 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-xl transition-all",
                        sel ? "bg-white/15" : "bg-slate-50 group-hover:bg-slate-100",
                      )}
                    >
                      <track.icon
                        className={cn("size-6", sel ? "text-brand-gold" : "text-slate-500")}
                      />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{track.label}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {track.subjects.map((subj) => (
                          <span
                            key={subj}
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                              sel ? track.activeBadge : track.idleBadge,
                            )}
                          >
                            {subj}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!studyTrack}
            onClick={() => setStep(2)}
            className={cn(
              "mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-all duration-200",
              studyTrack
                ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/25 hover:bg-brand-navy/90 active:scale-[0.99]"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            Continue <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* ── Step 2: Personal info ── */}
      {step === 2 && (
        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
          <h1 className="font-serif text-3xl font-bold text-brand-navy">About you</h1>
          <p className="mt-2 text-sm text-slate-500">Your name appears on the leaderboard.</p>

          {/* Live avatar preview */}
          <div
            className={cn(
              "mt-6 flex items-center gap-4 rounded-2xl border p-4 transition-all",
              name
                ? "border-brand-navy/20 bg-gradient-to-r from-brand-navy/3 to-transparent"
                : "border-slate-100 bg-slate-50",
            )}
          >
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-xl font-serif text-2xl font-bold shadow-md transition-all duration-300",
                name ? "bg-brand-navy text-white scale-100" : "bg-slate-200 text-slate-400",
              )}
            >
              {name.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-bold truncate transition-colors",
                  name ? "text-brand-navy" : "text-slate-300",
                )}
              >
                {name || "Your name"}
              </p>
              <p
                className={cn(
                  "text-xs truncate transition-colors",
                  university ? "text-slate-500" : "text-slate-300",
                )}
              >
                {university || "University (optional)"}
              </p>
              {studyTrack === "natural" || studyTrack === "social" ? (
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                    studyTrack === "natural"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700",
                  )}
                >
                  {studyTrack === "natural" ? "Natural Science" : "Social Science"}
                </span>
              ) : (
                <span className="mt-1 inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                  General reader
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Full name
              </label>
              <input
                type="text"
                placeholder="Abebe Balcha"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                University{" "}
                <span className="font-normal normal-case tracking-normal text-slate-400">
                  (optional — not a student? leave blank)
                </span>
              </label>
              <input
                type="text"
                list="reg-universities"
                placeholder="Addis Ababa University"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20 transition"
              />
              <datalist id="reg-universities">
                {ETHIOPIAN_UNIVERSITIES.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
              <p className="text-[11px] text-slate-400">
                Anyone can join — students get a university on their profile, everyone else can skip
                this.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (name.trim().length < 3) {
                  toast.error("Name too short", {
                    description: "Please enter your full name (minimum 3 characters).",
                  });
                  return;
                }
                setStep(3);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-navy py-3 text-sm font-bold text-white shadow-lg shadow-brand-navy/25 hover:bg-brand-navy/90 transition"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Security ── */}
      {step === 3 && (
        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
          <h1 className="font-serif text-3xl font-bold text-brand-navy">Secure your account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Use your .edu.et email for instant approval.
          </p>

          <div className="mt-6 space-y-4">
            {/* Email with live .edu.et indicator */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="you@university.edu.et"
                  value={email}
                  autoFocus
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition",
                    emailValid
                      ? isEduEt
                        ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                        : "border-amber-300 focus:border-amber-400 focus:ring-amber-100"
                      : "border-slate-200 focus:border-brand-navy focus:ring-brand-navy/20",
                  )}
                />
                {emailValid && (
                  <div className="absolute inset-y-0 right-3.5 flex items-center">
                    <CheckCircle2
                      className={cn("size-4", isEduEt ? "text-emerald-500" : "text-amber-500")}
                    />
                  </div>
                )}
              </div>
              {emailValid && (
                <p
                  className={cn(
                    "text-[11px] font-medium",
                    isEduEt ? "text-emerald-600" : "text-amber-600",
                  )}
                >
                  {isEduEt
                    ? "✓ University email — instant approval"
                    : "⚠ Non-.edu.et email — may require admin review"}
                </p>
              )}
            </div>

            <PasswordInput
              label="Password"
              name="password"
              autoComplete="new-password"
              showStrength
              value={pwd}
              onChange={setPwd}
            />
            <ConfirmPasswordInput password={pwd} value={confirmPwd} onChange={setConfirmPwd} />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!emailValid) {
                  toast.error("Invalid email address");
                  return;
                }
                if (pwdStrength.level < 2) {
                  toast.error("Weak password", {
                    description: "Use at least 6 characters with both letters and numbers.",
                  });
                  return;
                }
                if (!pwdMatch) {
                  toast.error("Passwords do not match");
                  return;
                }
                setStep(4);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-navy py-3 text-sm font-bold text-white shadow-lg shadow-brand-navy/25 hover:bg-brand-navy/90 transition"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Review & submit ── */}
      {step === 4 && (
        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
          <h1 className="font-serif text-3xl font-bold text-brand-navy">Almost there!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Review your details and claim your bonus XP.
          </p>

          {/* Profile summary card */}
          <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your profile
              </p>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-[11px] font-semibold text-brand-gold hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-navy font-serif text-xl font-bold text-white shadow">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-brand-navy truncate">{name}</p>
                <p className="text-xs text-slate-500 truncate">{email}</p>
                <p className="text-xs text-slate-400 truncate">{university || "Not a student"}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {studyTrack === "natural" || studyTrack === "social" ? (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                    studyTrack === "natural"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700",
                  )}
                >
                  {studyTrack === "natural" ? "Natural Science" : "Social Science"}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                  General reader
                </span>
              )}
              {isEduEt && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  Instant approval
                </span>
              )}
            </div>
          </div>

          {/* XP bonus tally */}
          <div className="mt-3 rounded-2xl border border-brand-gold/25 bg-gradient-to-br from-brand-gold/5 to-amber-50/40 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
              Your starting XP
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Welcome bonus</span>
                <span className="font-bold text-brand-gold">+50 XP</span>
              </div>
              {referral.trim() && (
                <div className="flex items-center justify-between animate-in fade-in-0 duration-200">
                  <span className="text-slate-600">Referral bonus</span>
                  <span className="font-bold text-emerald-600">+{REFERRAL_FRIEND_BONUS} XP</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-brand-gold/20 pt-2 font-bold">
                <span className="text-brand-navy">Total on signup</span>
                <span className="font-serif text-xl text-brand-gold">{bonusXp} XP</span>
              </div>
            </div>
          </div>

          {/* Referral code */}
          <div className="mt-3 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Referral code{" "}
              <span className="font-normal normal-case tracking-normal text-slate-400">
                (optional — earn extra XP)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. ABEBE-7X2K"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20 transition"
            />
          </div>

          {/* Terms */}
          <label className="mt-4 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              className="mt-0.5 size-4 cursor-pointer accent-brand-navy"
            />
            <span className="text-[11px] leading-relaxed text-slate-500">
              I agree to the{" "}
              <Link to="/terms" className="font-semibold text-brand-navy hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="font-semibold text-brand-navy hover:underline">
                Privacy Policy
              </Link>
              . I confirm the details above are accurate.
            </span>
          </label>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-navy py-4 text-sm font-bold text-white shadow-lg shadow-brand-navy/25 hover:bg-brand-navy/90 active:scale-[0.99] disabled:opacity-70 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creating account…
                </>
              ) : (
                <>
                  Create free account <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ConfirmPasswordInput({
  password,
  value,
  onChange,
}: {
  password: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const matches = value.length > 0 && value === password;
  const mismatch = value.length > 0 && value !== password;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="confirm-password"
        className="block text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        Confirm password
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-300">
          <Lock className="size-4" />
        </div>
        <input
          id="confirm-password"
          autoComplete="new-password"
          type={visible ? "text" : "password"}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-xl border bg-white py-3 pl-10 pr-11 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition",
            matches
              ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
              : mismatch
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-slate-200 focus:border-brand-navy focus:ring-brand-navy/20",
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-brand-navy transition"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {matches && (
        <p className="flex items-center gap-1 text-[11px] text-emerald-600">
          <CheckCircle2 className="size-3" /> Passwords match
        </p>
      )}
      {mismatch && (
        <p className="text-[11px] text-red-500">
          Passwords do not match — please check and try again
        </p>
      )}
    </div>
  );
}

function getStrength(password: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (password.length === 0) return { level: 0, label: "", color: "" };
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const long = password.length >= 8;

  if (password.length < 6) return { level: 1, label: "Weak", color: "bg-red-400" };
  if (hasLetter && hasNumber && hasSpecial && long)
    return { level: 3, label: "Strong", color: "bg-green-500" };
  if (hasLetter && hasNumber) return { level: 2, label: "Good", color: "bg-brand-gold" };
  return { level: 1, label: "Weak", color: "bg-red-400" };
}

function PasswordInput({
  label,
  name,
  id,
  showStrength = false,
  value,
  onChange,
  onBlur,
  autoComplete,
  required,
  error,
}: {
  label: string | null;
  name: string;
  id?: string;
  showStrength?: boolean;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  autoComplete?: string;
  required?: boolean;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  const strength = getStrength(value);
  const fieldId = id ?? `field-${name}`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-300">
          <Lock className="size-4" />
        </div>
        <input
          id={fieldId}
          name={name}
          type={visible ? "text" : "password"}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          required={required}
          className={cn(
            "w-full rounded-xl border bg-white py-3 pl-10 pr-11 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition",
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-slate-200 focus:border-brand-navy focus:ring-brand-navy/20",
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-brand-navy transition"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}

      {showStrength && value.length > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {([1, 2, 3] as const).map((n) => (
              <div
                key={n}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  strength.level >= n ? strength.color : "bg-slate-100",
                )}
              />
            ))}
          </div>
          <p
            className={cn(
              "text-[11px] font-medium",
              strength.level === 1
                ? "text-red-500"
                : strength.level === 2
                  ? "text-amber-600"
                  : "text-green-600",
            )}
          >
            {strength.label} password
            {strength.level < 3 && " — add numbers, symbols or length to strengthen"}
          </p>
        </div>
      )}
    </div>
  );
}
