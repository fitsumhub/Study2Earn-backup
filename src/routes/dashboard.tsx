import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BookMarked,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Coins,
  Flame,
  Gift,
  Landmark,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

import { RequireAuthClient } from "@/components/require-auth-client";
import { ReadingRewardCard } from "@/components/reading-reward-card";
import { SponsorAd } from "@/components/sponsor-ad";
import { SiteHeader, SiteFooter, BookCover } from "@/components/site-chrome";
import { BankLogo } from "@/components/bank-logo";
import { useLibraryProgress } from "@/hooks/use-library-progress";
import { useReadingTime } from "@/hooks/use-reading-time";
import { getReadingActiveDays } from "@/lib/reading-time-store";
import { useAuth } from "@/hooks/use-auth";
import { useExamProgress } from "@/hooks/use-exam-progress";
import { useWallet } from "@/hooks/use-wallet";
import { useFrames } from "@/hooks/use-frames";
import { useMistakes } from "@/hooks/use-mistakes";
import { useWithdrawals } from "@/hooks/use-withdrawals";
import { ProfileFrameAvatar } from "@/components/frames/ProfileFrameAvatar";
import { resolveMediaUrl } from "@/lib/media-store";
import { getEffectiveLeaderboard, getUserNationalRank } from "@/lib/leaderboard-store";
import { getStudySets } from "@/lib/study-set-store";
import { ethiopianBanks } from "@/lib/ethiopian-banks";
import { MIN_WITHDRAWAL_ETB, xpToEtb } from "@/lib/withdrawal-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Study2Earn" },
      {
        name: "description",
        content: "Your study progress, recent books, exam history, and XP wallet.",
      },
    ],
  }),
  component: DashboardPage,
});

function formatAttemptDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scoreStyle(score: number) {
  if (score >= 80) return "bg-green-50 text-green-700 border-l-2 border-green-500";
  if (score >= 60) return "bg-amber-50 text-amber-700 border-l-2 border-amber-400";
  return "bg-red-50 text-red-700 border-l-2 border-red-400";
}

function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <RequireAuthClient redirectTo="/dashboard">
        <DashboardContent />
      </RequireAuthClient>
      <SiteFooter />
    </div>
  );
}

/** A day counts toward the streak if the student took an exam OR did verified reading. */
function calcStreak(activeDates: string[]): { current: number; studiedToday: boolean } {
  if (activeDates.length === 0) return { current: 0, studiedToday: false };
  const days = new Set(activeDates.map((d) => d.slice(0, 10)));
  const today = new Date().toISOString().slice(0, 10);
  const studiedToday = days.has(today);
  let streak = studiedToday ? 1 : 0;
  const check = new Date(today);
  check.setDate(check.getDate() - 1);
  while (days.has(check.toISOString().slice(0, 10))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return { current: streak, studiedToday };
}

function DashboardContent() {
  const { user } = useAuth();
  const wallet = useWallet();
  const { equipped: equippedFrame } = useFrames();
  const reading = useReadingTime();
  const { books } = useLibraryProgress();
  const { unresolvedCount } = useMistakes();
  const { myRequests } = useWithdrawals();
  const pendingWithdrawal = myRequests.find((r) => r.status === "pending");

  const firstName = user?.name.split(" ")[0] ?? "Student";
  const rankInfo = getUserNationalRank(user, wallet.lifetimeEarned, "weekly");
  const myRank = rankInfo.entry;
  const boardTop3 = getEffectiveLeaderboard("weekly", user, wallet.lifetimeEarned).slice(0, 3);
  const { getNextChapter, getRecentAttempts, isChapterCompleted } = useExamProgress();
  const next = getNextChapter();
  const recentAttempts = getRecentAttempts(50);
  const examStats = wallet.examStats;
  const activeDates = [
    ...recentAttempts.map((a) => a.date),
    ...getReadingActiveDays(user?.id ?? ""),
  ];
  const { current: streakDays, studiedToday } = calcStreak(activeDates);
  const nextIncomplete = next && !isChapterCompleted(next.course.id, next.chapter.id);
  const totalXp = wallet.balance;
  const withdrawableEtb = xpToEtb(totalXp);

  const minWithdrawalXp = MIN_WITHDRAWAL_ETB * 8; // 400 XP
  const withdrawalReady = totalXp >= minWithdrawalXp;
  const withdrawalProgressPct = Math.min(100, Math.round((totalXp / minWithdrawalXp) * 100));
  const etbShortfall = Math.max(0, MIN_WITHDRAWAL_ETB - withdrawableEtb);

  const targetReadingMins = 15;
  const currentReadingMins = Math.floor(reading.totalSeconds / 60);
  const readingGoalMet = currentReadingMins >= targetReadingMins;
  const examGoalMet = studiedToday;
  const allDailyGoalsMet = readingGoalMet && examGoalMet;

  const featuredBanks = ethiopianBanks.slice(0, 6);

  const continueBooks = [...books]
    .filter((b) => b.progress > 0 && b.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 4);

  const fallbackBooks = books.slice(0, 4);
  const readingBooks = continueBooks.length > 0 ? continueBooks : fallbackBooks;

  const displayHistory = recentAttempts.slice(0, 5).map((a) => ({
    key: a.id,
    title: `${a.chapterTitle} — ${a.courseName}`,
    date: formatAttemptDate(a.date),
    score: a.score,
    xp: a.xp,
  }));

  const rankDisplay = rankInfo.rank ? `#${rankInfo.rank}` : "—";
  const rankSub = myRank
    ? `${totalXp.toLocaleString()} XP on leaderboard`
    : "Complete a mock to rank";

  const studySets = getStudySets();

  const statCards = [
    {
      label: "Wallet balance",
      value: totalXp.toLocaleString() + " XP",
      sub: `≈ ${withdrawableEtb} ETB (8 XP = 1 ETB)`,
      pill: withdrawalReady ? "✓ Cashout Available" : `${etbShortfall} ETB to 50 ETB min`,
      pillColor: withdrawalReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800",
      icon: Coins,
      iconBg: "bg-amber-100 text-amber-600",
      accent: "border-l-amber-400",
    },
    {
      label: "Reading time",
      value: reading.formatted,
      sub: reading.rewardClaimed
        ? "Milestone claimed"
        : `${reading.progressPercent}% to ${reading.rewardEtb} ETB bonus`,
      pill: readingGoalMet ? "✓ 15m Daily Goal Met" : `${Math.max(0, targetReadingMins - currentReadingMins)}m to 15m goal`,
      pillColor: readingGoalMet ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
      icon: Clock,
      iconBg: "bg-green-100 text-green-600",
      accent: "border-l-green-400",
    },
    {
      label: "Chapters done",
      value: `${examStats.completed} / ${examStats.total || "—"}`,
      sub:
        examStats.total > 0 ? `${examStats.percent}% of core courses` : "Take a mock exam to begin",
      pill: examGoalMet ? "✓ Practiced Today" : "1 exam pending today",
      pillColor: examGoalMet ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600",
      icon: CheckCircle2,
      iconBg: "bg-blue-100 text-blue-600",
      accent: "border-l-blue-400",
    },
    {
      label: "Leaderboard",
      value: rankDisplay,
      sub: rankSub,
      pill: user?.university ?? "Ethiopian National",
      pillColor: "bg-brand-gold/15 text-amber-900",
      icon: Trophy,
      iconBg: "bg-brand-gold/15 text-brand-gold",
      accent: "border-l-brand-gold",
    },
  ];

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        {/* ── Header ── */}
        <header className="mb-8 sm:mb-10 section-enter">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ProfileFrameAvatar
                initials={
                  user?.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "ST"
                }
                avatarUrl={resolveMediaUrl(user?.avatarUrl)}
                frameId={equippedFrame}
                size="md"
                equipped={!!equippedFrame}
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">
                    {new Date().getHours() < 12
                      ? "Good morning"
                      : new Date().getHours() < 17
                        ? "Good afternoon"
                        : "Good evening"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="size-3 text-emerald-600" />
                    2017 E.C. Freshman Track
                  </span>
                  {rankInfo.rank && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                      <Trophy className="size-3 text-amber-600" />
                      National #{rankInfo.rank}
                    </span>
                  )}
                </div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-navy mt-1">
                  {firstName} 👋
                </h1>
                <p className="mt-1 text-slate-500 text-sm">
                  {user?.university ?? "Your university"}
                  {user?.department ? ` · ${user.department}` : ""}
                  {examStats.total > 0 ? (
                    <>
                      {" · "}
                      <span className="font-semibold text-brand-navy">
                        {examStats.completed}/{examStats.total} chapters
                      </span>{" "}
                      done ({examStats.percent}%)
                    </>
                  ) : (
                    <> · Start your first mock exam to begin</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="hidden sm:inline-block text-xs text-slate-500 mr-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <Link
                to="/exams/mistakes"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition border",
                  unresolvedCount > 0
                    ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
                )}
                title="Mistake Notebook"
              >
                <AlertCircle className="size-3.5 text-rose-500" />
                <span>Mistakes</span>
                <span className="rounded-full bg-rose-600 text-white px-1.5 py-0.2 text-[10px] font-mono leading-none">
                  {unresolvedCount}
                </span>
              </Link>
              <Link
                to="/ai-study"
                className="flex items-center gap-1.5 rounded-full bg-brand-gold/15 px-3 py-1.5 text-xs font-bold text-amber-900 border border-brand-gold/30 hover:bg-brand-gold/25 transition"
              >
                <Sparkles className="size-3.5 text-brand-gold" />
                <span>AI Study</span>
              </Link>
            </div>
          </div>
        </header>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={cn(
                "rounded-2xl bg-white p-5 sm:p-6 border border-slate-100 shadow-sm card-lift border-l-4 flex flex-col justify-between",
                s.accent,
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {s.label}
                  </p>
                  <div className={cn("size-8 rounded-full grid place-items-center", s.iconBg)}>
                    <s.icon className="size-4" />
                  </div>
                </div>
                <p className="font-serif text-2xl md:text-3xl font-bold text-brand-navy">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className={cn("inline-block rounded-md px-2 py-0.5 text-[10px] font-bold", s.pillColor)}>
                  {s.pill}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              to: "/exams",
              icon: ClipboardList,
              label: "Mock Exams",
              sub: "Timed Exit Exam tests",
              color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
              ring: "border-blue-100",
            },
            {
              to: "/library",
              icon: BookOpen,
              label: "MoE Library",
              sub: "Curriculum textbooks",
              color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
              ring: "border-emerald-100",
            },
            {
              to: "/ai-study",
              icon: Sparkles,
              label: "AI Study Sets",
              sub: "3D cards & quizzes",
              color: "bg-amber-50 text-amber-700 hover:bg-amber-100",
              ring: "border-amber-100",
            },
            {
              to: "/rewards",
              icon: Landmark,
              label: "Bank Rewards",
              sub: "Cashout to CBE & more",
              color: "bg-purple-50 text-purple-700 hover:bg-purple-100",
              ring: "border-purple-100",
            },
            {
              to: "/exams/mistakes",
              icon: AlertCircle,
              label: "Mistake Notebook",
              sub: unresolvedCount > 0 ? `${unresolvedCount} to master` : "Targeted re-practice",
              color: "bg-rose-50 text-rose-700 hover:bg-rose-100",
              ring: "border-rose-100",
            },
            {
              to: "/leaderboard",
              icon: Trophy,
              label: "Leaderboard",
              sub: "National ranking",
              color: "bg-violet-50 text-violet-700 hover:bg-violet-100",
              ring: "border-violet-100",
            },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={cn(
                "group flex flex-col gap-2 rounded-2xl border p-4 transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5",
                a.color,
                a.ring,
              )}
            >
              <div className="flex items-center justify-between">
                <a.icon className="size-5" />
                <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">{a.label}</p>
                <p className="text-[11px] opacity-75 mt-0.5 truncate">{a.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Official Ethiopian Bank Cashout Hub ── */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-900 via-brand-navy to-slate-900 p-6 sm:p-7 text-white border border-slate-800 shadow-xl relative overflow-hidden">
          {/* Subtle golden ambient glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-brand-gold/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 size-60 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left side: Balance & Progress */}
            <div className="space-y-3 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-brand-gold border border-brand-gold/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  <Landmark className="size-3.5" />
                  Ethiopian Bank Cashout Hub
                </span>
                {withdrawalReady ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold">
                    <CheckCircle2 className="size-3 text-emerald-400" />
                    Ready to Withdraw ({withdrawableEtb} ETB)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 text-white/80 border border-white/20 px-2.5 py-0.5 text-xs font-semibold">
                    {etbShortfall} ETB until min cashout
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-baseline gap-3">
                  <p className="font-serif text-3xl sm:text-4xl font-bold text-white">
                    {withdrawableEtb} <span className="text-xl sm:text-2xl text-brand-gold">ETB</span>
                  </p>
                  <p className="text-xs text-white/60 font-mono">
                    ({totalXp.toLocaleString()} XP · Fixed rate: 8 XP = 1 ETB)
                  </p>
                </div>
                <p className="text-xs text-white/70 mt-1">
                  Cash out earnings directly to Commercial Bank of Ethiopia, Awash, Dashen, Bank of Abyssinia, Telebirr, or any supported local bank with 0% transaction fee.
                </p>
              </div>

              {/* Progress to minimum withdrawal */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-white/60 mb-1.5">
                  <span>Minimum withdrawal: 50 ETB (400 XP)</span>
                  <span className="font-mono text-brand-gold font-bold">{withdrawalProgressPct}% reached</span>
                </div>
                <Progress
                  value={withdrawalProgressPct}
                  className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-brand-gold"
                />
              </div>

              {/* Pending withdrawal alert if student has one */}
              {pendingWithdrawal && (
                <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 p-3 text-xs text-amber-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="size-4 text-brand-gold shrink-0 animate-spin" />
                    <span className="truncate">
                      Pending Payout: <strong>{pendingWithdrawal.amountEtb} ETB</strong> to{" "}
                      {pendingWithdrawal.bankName || "Bank"} ({pendingWithdrawal.accountNumber})
                    </span>
                  </div>
                  <span className="shrink-0 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-gold border border-amber-400/30">
                    Under Review
                  </span>
                </div>
              )}
            </div>

            {/* Right side: Bank partner logos & CTA */}
            <div className="flex flex-col items-start lg:items-end gap-4 shrink-0">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2 lg:text-right">
                  Supported Ethiopian Banks:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {featuredBanks.map((bank) => (
                    <div
                      key={bank.id}
                      className="group flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-2.5 py-1.5 transition"
                      title={bank.name}
                    >
                      <BankLogo bank={bank} size="sm" className="size-6 p-0.5 border-0 shadow-none bg-white rounded-md" />
                      <span className="text-[11px] font-bold text-white/90">{bank.short}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/rewards"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-gold via-amber-400 to-amber-500 px-6 py-3 font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-brand-gold/25 transition text-sm group"
                >
                  <Landmark className="size-4" />
                  <span>Withdraw to Bank Account</span>
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/rewards"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  <span>Reward History</span>
                  <ArrowUpRight className="size-3.5 opacity-60" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Daily Study Goals & Streak Tracker ── */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/60 border border-orange-200/90 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25">
                <Flame className="size-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-serif font-bold text-lg text-orange-950">
                    {streakDays} Day Study Streak 🔥
                  </p>
                  {allDailyGoalsMet && (
                    <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                      ✓ Streak Protected Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-orange-900/80 mt-0.5">
                  {studiedToday
                    ? "Great momentum! Complete both daily goals to claim your +50 Bonus XP daily reward."
                    : "Study verified MoE curriculum or complete a chapter test today to keep your streak intact!"}
                </p>
              </div>
            </div>

            {/* Daily goals checklist */}
            <div className="flex flex-wrap items-center gap-2.5 bg-white/80 rounded-xl p-2.5 border border-orange-200/80">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border",
                  readingGoalMet
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-50 text-slate-600 border-slate-200",
                )}
              >
                {readingGoalMet ? (
                  <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                ) : (
                  <Clock className="size-3.5 text-slate-400" />
                )}
                <span>15m Reading ({currentReadingMins}/15m)</span>
              </div>

              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border",
                  examGoalMet
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-50 text-slate-600 border-slate-200",
                )}
              >
                {examGoalMet ? (
                  <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                ) : (
                  <ClipboardList className="size-3.5 text-slate-400" />
                )}
                <span>1 Chapter Mock Exam</span>
              </div>

              <Link
                to={!examGoalMet ? "/exams" : "/library"}
                className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-xs font-bold transition shadow-xs"
              >
                {!examGoalMet ? "Take Exam →" : "Read →"}
              </Link>
            </div>
          </div>
        </div>

        {/* Sponsored */}
        <SponsorAd placement="dashboard" className="mb-6" />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Next exam hero */}
          <div className="lg:col-span-2 rounded-2xl bg-brand-navy p-8 text-white relative overflow-hidden">
            <div className="absolute -right-20 -top-20 size-64 bg-brand-gold/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block px-3 py-1 bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/20">
                  {nextIncomplete ? "Next up" : next ? "Continue practice" : "Get started"}
                </span>
                {next && (
                  <span className="inline-flex px-2 py-0.5 rounded bg-brand-gold/20 text-xs font-mono text-brand-gold border border-brand-gold/30">
                    {next.course.short}
                  </span>
                )}
              </div>
              {next ? (
                <>
                  <h2 className="font-serif text-3xl font-bold mt-4">{next.chapter.title}</h2>
                  <p className="text-white/70 mt-2">
                    {next.course.name} • {next.course.questionsPerExam} Questions •{" "}
                    {next.course.durationMinutes} Minutes
                  </p>
                  {/* Chapter progress bar */}
                  <div className="mt-3 mb-6">
                    <Progress
                      value={Math.round((examStats.completed / Math.max(examStats.total, 1)) * 100)}
                      className="h-1 bg-white/10 [&>div]:bg-brand-gold/70"
                    />
                    <p className="mt-1 text-[10px] text-white/40">
                      {examStats.completed} of {examStats.total} chapters complete
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/exams/$courseId/$chapterId"
                      params={{
                        courseId: next.course.id,
                        chapterId: next.chapter.id,
                      }}
                      className="inline-block bg-brand-gold px-6 py-3 rounded-lg font-bold text-white text-sm hover:scale-105 hover:brightness-110 transition-all shadow-lg shadow-brand-gold/25"
                    >
                      {nextIncomplete ? "Start Exam Now" : "Retake Chapter"}
                    </Link>
                    <Link
                      to="/library"
                      className="inline-block rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
                    >
                      Open Library
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-serif text-3xl font-bold mt-4">All chapters complete!</h2>
                  <p className="text-white/70 mt-2 mb-8">
                    Retake any chapter to improve your score.
                  </p>
                  <Link
                    to="/exams"
                    className="inline-block bg-brand-gold px-6 py-3 rounded-lg font-bold text-white text-sm hover:scale-105 transition-transform"
                  >
                    Browse Courses
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Reading reward */}
          <div className="rounded-2xl bg-white p-6 border border-slate-100">
            <ReadingRewardCard reading={reading} compact />
          </div>

          {/* AI Study Sets Hub */}
          <div className="lg:col-span-3 rounded-2xl bg-linear-to-r from-brand-navy via-slate-900 to-brand-navy p-6 text-white border border-slate-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-brand-gold border border-brand-gold/30">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-white">AI Study Sets</h3>
                    <span className="rounded-full bg-linear-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                      NEW
                    </span>
                  </div>
                  <p className="text-xs text-white/70">
                    Upload documents, audio recordings, images, or paste links to generate 3D flashcards, quizzes & cheat sheets.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/ai-study"
                  className="rounded-xl bg-brand-gold px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110 transition shadow-xs"
                >
                  Create Study Set +
                </Link>
                <Link
                  to="/ai-study"
                  className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  View Library →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {studySets.slice(0, 3).map((st) => (
                <Link
                  key={st.id}
                  to="/ai-study"
                  search={{ set: st.id, tab: "overview" }}
                  className="rounded-xl bg-white/5 p-3.5 border border-white/10 hover:border-amber-400/50 hover:bg-white/10 transition group"
                >
                  <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
                    <span className="font-mono text-brand-gold font-bold">{st.courseCode || st.subject}</span>
                    <span>{st.flashcards.length} cards</span>
                  </div>
                  <p className="font-semibold text-xs text-white truncate group-hover:text-brand-gold transition-colors">
                    {st.title}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-white/50">
                    <span>Mastery: {st.progress.overallPct}%</span>
                    <span className="text-brand-gold font-bold group-hover:translate-x-0.5 transition-transform">Practice →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Continue reading */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-brand-navy">
                {continueBooks.length > 0 ? "Continue reading" : "Popular books"}
              </h3>
              <Link
                to="/library"
                className="text-sm font-medium text-brand-navy hover:underline decoration-brand-gold underline-offset-2"
              >
                All books
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {readingBooks.map((b) => (
                <Link
                  key={b.id}
                  to="/library/read/$bookId"
                  params={{ bookId: b.id }}
                  className="group"
                >
                  <div className="mb-3 overflow-hidden rounded-lg transition-transform duration-200 group-hover:scale-105">
                    <BookCover short={b.short} id={b.id} name={b.name} coverUrl={b.coverUrl} />
                  </div>
                  <h4 className="text-xs font-bold leading-tight line-clamp-2 group-hover:text-brand-navy transition-colors">
                    {b.name}
                  </h4>
                  <Progress value={b.progress} className="mt-2 h-1 [&>div]:bg-brand-gold" />
                  <p className="mt-1 text-[10px] text-slate-500">{b.progress}% read</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Leaderboard snapshot */}
          <div className="rounded-2xl bg-white p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-brand-navy">Your ranking</h3>
              <Link
                to="/leaderboard"
                className="text-sm font-medium text-brand-navy hover:underline decoration-brand-gold underline-offset-2"
              >
                View
              </Link>
            </div>
            <div className="space-y-3">
              {boardTop3.map((s) => (
                <div
                  key={`${s.id || s.name}-${s.rank}`}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "font-bold text-xs w-5 text-center",
                        s.rank === 1 ? "text-brand-gold" : "text-slate-400",
                      )}
                    >
                      {String(s.rank).padStart(2, "0")}
                    </span>
                    <ProfileFrameAvatar
                      initials={s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      avatarUrl={resolveMediaUrl(s.avatarUrl)}
                      frameId={s.isYou ? equippedFrame : undefined}
                      size="xs"
                      equipped={s.isYou && !!equippedFrame}
                    />
                    <span className="font-medium text-xs">
                      {s.name.split(" ")[0]} {s.name.split(" ")[1]?.[0]}.
                      {s.isYou && (
                        <span className="ml-1 text-[9px] font-bold text-brand-gold bg-brand-gold/10 px-1 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {s.xp.toLocaleString()} <span className="text-[10px] text-slate-400">XP</span>
                  </span>
                </div>
              ))}
              {myRank && !boardTop3.some((s) => s.isYou || s.id === user?.id) ? (
                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100 bg-brand-gold/5 -mx-2 px-2 py-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs w-5 text-center text-brand-gold">
                      {String(myRank.rank).padStart(2, "0")}
                    </span>
                    <ProfileFrameAvatar
                      initials={
                        user?.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                          : "ST"
                      }
                      avatarUrl={resolveMediaUrl(user?.avatarUrl)}
                      frameId={equippedFrame}
                      size="xs"
                      equipped={!!equippedFrame}
                    />
                    <span className="font-bold text-brand-navy text-xs">You</span>
                  </div>
                  <span className="text-xs font-mono text-brand-navy font-bold">
                    {totalXp.toLocaleString()}{" "}
                    <span className="text-[10px] text-brand-gold">XP</span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Mistake Notebook Banner */}
          <div className="lg:col-span-3 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50/60 to-white border border-rose-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-rose-950">
                    {unresolvedCount > 0
                      ? `Mistake Notebook: ${unresolvedCount} Question${unresolvedCount !== 1 ? "s" : ""} to Master`
                      : "Mistake Notebook: 100% Cleared"}
                  </h3>
                  {unresolvedCount > 0 ? (
                    <span className="rounded-full bg-rose-600 text-white px-2 py-0.5 text-[10px] font-bold">
                      {unresolvedCount} to fix
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                      Mastered ✨
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-900/80 mt-1 max-w-2xl">
                  {unresolvedCount > 0
                    ? "Questions missed in recent Exit Exam mock sessions are preserved here with comprehensive answer explanations. Re-practice them to turn weak points into full marks."
                    : "No unresolved mistakes found. Every question from your completed mock exams has been reviewed and solved!"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/exams/mistakes"
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-bold transition shadow-xs"
              >
                <RotateCcw className="size-3.5" />
                <span>{unresolvedCount > 0 ? `Practice Mistakes (${unresolvedCount}) →` : "Open Mistake Log →"}</span>
              </Link>
            </div>
          </div>

          {/* Exam history */}
          <div className="lg:col-span-3 rounded-2xl bg-white p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-brand-navy">Recent exams</h3>
              <Link
                to="/exams"
                className="text-sm font-medium text-brand-navy hover:underline decoration-brand-gold underline-offset-2"
              >
                All courses
              </Link>
            </div>
            {displayHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookMarked className="size-8 text-slate-200 mb-3" />
                <p className="text-sm text-slate-400">No exams yet</p>
                <Link
                  to="/exams"
                  className="mt-3 text-xs font-semibold text-brand-navy hover:underline"
                >
                  Start your first mock exam →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="py-3">Exam</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Score</th>
                      <th className="py-3 text-right">XP Earned</th>
                      <th className="py-3 text-right">Mistake Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayHistory.map((e, i) => (
                      <tr
                        key={e.key}
                        className={cn(
                          "border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60",
                          i % 2 === 1 && "bg-slate-50/40",
                        )}
                      >
                        <td className="py-4 font-medium">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="size-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[220px]">{e.title}</span>
                          </div>
                        </td>
                        <td className="py-4 text-slate-500">{e.date}</td>
                        <td className="py-4">
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 rounded text-xs font-bold",
                              scoreStyle(e.score),
                            )}
                          >
                            {e.score}%
                          </span>
                        </td>
                        <td className="py-4 text-right font-mono font-bold text-brand-gold">
                          +{e.xp}
                        </td>
                        <td className="py-4 text-right">
                          {e.score < 100 ? (
                            <Link
                              to="/exams/mistakes"
                              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                            >
                              <span>Practice</span>
                              <ArrowRight className="size-3" />
                            </Link>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600">✓ Perfect</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
