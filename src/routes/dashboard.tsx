import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Coins,
  Flame,
  Gift,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

import { RequireAuthClient } from "@/components/require-auth-client";
import { ReadingRewardCard } from "@/components/reading-reward-card";
import { SponsorAd } from "@/components/sponsor-ad";
import { SiteHeader, SiteFooter, BookCover } from "@/components/site-chrome";
import { useLibraryProgress } from "@/hooks/use-library-progress";
import { useReadingTime } from "@/hooks/use-reading-time";
import { getReadingActiveDays } from "@/lib/reading-time-store";
import { useAuth } from "@/hooks/use-auth";
import { useExamProgress } from "@/hooks/use-exam-progress";
import { useWallet } from "@/hooks/use-wallet";
import { leaderboard } from "@/lib/mock-data";
import { xpToEtb } from "@/lib/withdrawal-data";
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
  const reading = useReadingTime();
  const { books } = useLibraryProgress();
  const firstName = user?.name.split(" ")[0] ?? "Student";
  const myRank = leaderboard.find((s) => s.id === user?.id);
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

  const rankDisplay = myRank ? `#${myRank.rank}` : "—";
  const rankSub = myRank
    ? `${totalXp.toLocaleString()} XP on leaderboard`
    : "Complete a mock to rank";

  const statCards = [
    {
      label: "Wallet balance",
      value: totalXp.toLocaleString(),
      sub: `≈ ${withdrawableEtb} ETB · 8 XP = 1 ETB`,
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
      icon: Clock,
      iconBg: "bg-green-100 text-green-600",
      accent: "border-l-green-400",
    },
    {
      label: "Chapters done",
      value: `${examStats.completed} / ${examStats.total || "—"}`,
      sub:
        examStats.total > 0 ? `${examStats.percent}% of core courses` : "Take a mock exam to begin",
      icon: CheckCircle2,
      iconBg: "bg-blue-100 text-blue-600",
      accent: "border-l-blue-400",
    },
    {
      label: "Leaderboard",
      value: rankDisplay,
      sub: rankSub,
      icon: Trophy,
      iconBg: "bg-brand-gold/15 text-brand-gold",
      accent: "border-l-brand-gold",
    },
  ];

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-10 section-enter">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-gold uppercase tracking-wider">
                {new Date().getHours() < 12
                  ? "Good morning"
                  : new Date().getHours() < 17
                    ? "Good afternoon"
                    : "Good evening"}
              </p>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand-navy mt-1">
                {firstName} 👋
              </h1>
              <p className="mt-2 text-slate-500 text-sm">
                {user?.university ?? "Your university"}
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
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="text-xs text-slate-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <Link
                to="/ai-study"
                className="flex items-center gap-1.5 rounded-full bg-brand-gold/10 px-3 py-1.5 text-xs font-bold text-brand-gold hover:bg-brand-gold/20 transition"
              >
                <Sparkles className="size-3" />
                AI Study
              </Link>
            </div>
          </div>
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={cn(
                "rounded-2xl bg-white p-6 border border-slate-100 shadow-sm card-lift border-l-4",
                s.accent,
              )}
            >
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
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              to: "/exams",
              icon: ClipboardList,
              label: "Mock Exams",
              sub: "Take a timed test",
              color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
              ring: "border-blue-100",
            },
            {
              to: "/library",
              icon: BookOpen,
              label: "Library",
              sub: "Read MoE books",
              color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
              ring: "border-emerald-100",
            },
            {
              to: "/rewards",
              icon: Gift,
              label: "Rewards",
              sub: "Redeem your XP",
              color: "bg-amber-50 text-amber-700 hover:bg-amber-100",
              ring: "border-amber-100",
            },
            {
              to: "/leaderboard",
              icon: Users,
              label: "Leaderboard",
              sub: "See national ranking",
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
                <p className="font-bold text-sm">{a.label}</p>
                <p className="text-[11px] opacity-70">{a.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Streak banner ── */}
        {(streakDays > 0 || studiedToday) && (
          <div className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 px-6 py-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500">
              <Flame className="size-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-orange-700">
                {streakDays} day streak{streakDays !== 1 ? "s" : ""} 🔥
              </p>
              <p className="text-xs text-orange-600/80">
                {studiedToday
                  ? "You've already studied today — keep it up!"
                  : "Take a mock exam or read a chapter today to keep your streak alive!"}
              </p>
            </div>
            <Link
              to="/exams"
              className="shrink-0 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 transition"
            >
              Study now →
            </Link>
          </div>
        )}

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
              {leaderboard.slice(0, 3).map((s) => (
                <div key={s.rank} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "font-bold text-xs w-5 text-center",
                        s.rank === 1 ? "text-brand-gold" : "text-slate-400",
                      )}
                    >
                      {String(s.rank).padStart(2, "0")}
                    </span>
                    <div className="size-7 rounded-full bg-gradient-to-br from-brand-navy/20 to-brand-gold/20 flex items-center justify-center text-[10px] font-bold text-brand-navy">
                      {s.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <span className="font-medium text-xs">
                      {s.name.split(" ")[0]} {s.name.split(" ")[1]?.[0]}.
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {s.xp.toLocaleString()} <span className="text-[10px] text-slate-400">XP</span>
                  </span>
                </div>
              ))}
              {myRank ? (
                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100 bg-brand-gold/5 -mx-2 px-2 py-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs w-5 text-center text-brand-gold">
                      {String(myRank.rank).padStart(2, "0")}
                    </span>
                    <div className="size-7 rounded-full bg-brand-gold/20 flex items-center justify-center text-[10px] font-bold text-brand-gold">
                      {user?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <span className="font-bold text-brand-navy text-xs">You</span>
                  </div>
                  <span className="text-xs font-mono text-brand-navy font-bold">
                    {totalXp.toLocaleString()}{" "}
                    <span className="text-[10px] text-brand-gold">XP</span>
                  </span>
                </div>
              ) : (
                <p className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Preview leaderboard — your live rank appears after more activity.
                </p>
              )}
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
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="py-3">Exam</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Score</th>
                      <th className="py-3 text-right">XP Earned</th>
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
