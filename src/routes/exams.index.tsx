import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Clock,
  Flame,
  Lock,
  Play,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { SiteHeader, SiteFooter, BackToTop } from "@/components/site-chrome";
import { CourseCover } from "@/components/course-cover";
import { ComingSoonGate } from "@/components/coming-soon-gate";
import { examCourses, type ExamCourse } from "@/lib/exam-data";
import { STUDY_TRACK_LABELS } from "@/lib/auth-data";
import { useAuth } from "@/hooks/use-auth";
import { useExamProgress } from "@/hooks/use-exam-progress";
import { useMistakes } from "@/hooks/use-mistakes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exams/")({
  head: () => ({
    meta: [
      { title: "Mock Exams — Study2Earn" },
      {
        name: "description",
        content:
          "Practice chapter mock exams for all freshman core courses — timed MCQ with instant scoring.",
      },
    ],
  }),
  component: ExamsPage,
});

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { pill: string; bg: string; border: string; text: string; icon: typeof Target }
> = {
  "Natural Science": {
    pill: "bg-blue-600 text-white",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: CircleDot,
  },
  "Social Science": {
    pill: "bg-violet-600 text-white",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    icon: BookOpen,
  },
  Common: {
    pill: "bg-amber-500 text-white",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: Star,
  },
};

const CATEGORIES = ["All", "Natural Science", "Social Science", "Common"] as const;

const SCORE_GRADE = (score: number) => {
  if (score >= 90) return { label: "A+", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (score >= 80) return { label: "A", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (score >= 70) return { label: "B", color: "text-blue-600 bg-blue-50 border-blue-200" };
  if (score >= 60) return { label: "C", color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: "F", color: "text-red-600 bg-red-50 border-red-200" };
};

// ─── Page ────────────────────────────────────────────────────────────────────

function ExamsPage() {
  const { user } = useAuth();
  const { getCourseStats, getOverallStats, getRecentAttempts, getNextChapter } = useExamProgress();
  const { unresolvedCount } = useMistakes();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  const overall = getOverallStats();
  const recentAttempts = getRecentAttempts(5);
  const nextChapter = getNextChapter();
  const trackCategory = user?.studyTrack ? STUDY_TRACK_LABELS[user.studyTrack] : null;

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((cat) => [
          cat,
          cat === "All"
            ? examCourses.length
            : examCourses.filter((c) => c.category === cat).length,
        ]),
      ),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = examCourses.filter((course) => {
      const matchesCategory = category === "All" || course.category === category;
      const matchesQuery =
        !q || course.name.toLowerCase().includes(q) || course.short.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
    if (!trackCategory) return matches;
    const rank = (course: ExamCourse) =>
      course.category === trackCategory ? 0 : course.category === "Common" ? 1 : 2;
    return [...matches].sort((a, b) => rank(a) - rank(b));
  }, [query, category, trackCategory]);

  // Derive a streak from recent attempts on distinct calendar days
  const studyStreakDays = useMemo(() => {
    const days = new Set(
      recentAttempts.map((a) => new Date(a.date).toDateString()),
    );
    return days.size;
  }, [recentAttempts]);

  const initials = useMemo(
    () =>
      (user?.name ?? "ST")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user?.name],
  );

  return (
    <ComingSoonGate pageKey="exams">
      <div className="flex min-h-screen flex-col bg-slate-50">
        <SiteHeader />
        <main className="flex-1">

          {/* ═══════════════════════════════════════════════════
              HERO COMMAND BANNER
              ═══════════════════════════════════════════════════ */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-brand-navy to-slate-800">
            {/* Decorative blobs */}
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
            <div className="absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-violet-500/8 blur-2xl pointer-events-none" />

            <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

                {/* Left: Title & Quick Stats */}
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-xs font-bold text-brand-gold">
                    <ClipboardList className="size-3.5" />
                    Exam Center · {examCourses.length} Core Courses
                  </div>

                  <div>
                    <h1 className="font-serif text-4xl font-bold text-white md:text-5xl">
                      Mock Exit Exams
                    </h1>
                    <p className="mt-3 max-w-lg text-slate-300 text-sm leading-relaxed">
                      Timed chapter-by-chapter MCQs for every freshman course. Score{" "}
                      <span className="text-brand-gold font-semibold">60%+</span> to complete a
                      chapter and earn XP toward cash rewards.
                    </p>
                    {trackCategory && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-gold/80">
                        <Sparkles className="size-3.5" />
                        Personalized for your {trackCategory} track — your courses surface first.
                      </p>
                    )}
                  </div>

                  {/* Hero stat pills */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      {
                        icon: Trophy,
                        label: "Chapters Done",
                        value: overall.completed,
                        color: "text-brand-gold",
                      },
                      {
                        icon: Target,
                        label: "Total Chapters",
                        value: overall.total,
                        color: "text-slate-300",
                      },
                      {
                        icon: Zap,
                        label: "XP Earned",
                        value: `${overall.totalXp.toLocaleString()} XP`,
                        color: "text-emerald-400",
                      },
                      {
                        icon: Flame,
                        label: "Active Days",
                        value: studyStreakDays,
                        color: "text-orange-400",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-sm"
                      >
                        <s.icon className={cn("size-3.5 shrink-0", s.color)} />
                        <div>
                          <p className="text-[10px] font-medium text-slate-400 leading-none">
                            {s.label}
                          </p>
                          <p className="text-sm font-bold text-white tabular-nums leading-tight">
                            {s.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Progress Ring + Quick Start */}
                <div className="flex flex-col items-center gap-4 lg:items-end">
                  {/* Animated SVG readiness ring */}
                  <div className="relative flex size-36 shrink-0 items-center justify-center">
                    <svg viewBox="0 0 144 144" className="absolute inset-0 size-full -rotate-90">
                      <circle
                        cx="72" cy="72" r="60"
                        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10"
                      />
                      <circle
                        cx="72" cy="72" r="60"
                        fill="none"
                        stroke={
                          overall.percent >= 80
                            ? "#10b981"
                            : overall.percent >= 40
                              ? "#d97706"
                              : "#3b82f6"
                        }
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={String(2 * Math.PI * 60)}
                        strokeDashoffset={String(
                          2 * Math.PI * 60 * (1 - (overall.total > 0 ? overall.percent / 100 : 0)),
                        )}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="z-10 text-center">
                      <p className="font-serif text-3xl font-bold text-white">
                        {overall.total > 0 ? `${overall.percent}%` : "—"}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Readiness
                      </p>
                    </div>
                  </div>

                  {/* Readiness tag */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                      overall.percent >= 80
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : overall.percent >= 40
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30",
                    )}
                  >
                    {overall.percent >= 80 ? (
                      <><Trophy className="size-3" /> Exam Ready!</>
                    ) : overall.percent >= 40 ? (
                      <><TrendingUp className="size-3" /> Good Progress</>
                    ) : (
                      <><Target className="size-3" /> Getting Started</>
                    )}
                  </span>
                </div>
              </div>

              {/* Quick-Start bar */}
              {nextChapter && (
                <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/20 text-brand-gold">
                      <Play className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Continue where you left off
                      </p>
                      <p className="text-sm font-bold text-white">
                        {nextChapter.course.short} · {nextChapter.chapter.title}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/exams/$courseId/$chapterId"
                    params={{
                      courseId: nextChapter.course.id,
                      chapterId: nextChapter.chapter.id,
                    }}
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-gold px-5 py-2.5 text-sm font-bold text-brand-navy shadow-lg hover:brightness-110 transition-all active:scale-95"
                  >
                    <Zap className="size-4" />
                    Start Exam
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              MAIN CONTENT
              ═══════════════════════════════════════════════════ */}
          <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

            {/* ── Mistakes Bank alert ── */}
            {unresolvedCount > 0 && (
              <Link
                to="/exams/mistakes"
                className="group flex items-center gap-4 rounded-2xl border border-red-200/80 bg-gradient-to-r from-red-50 via-white to-red-50/30 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <Brain className="size-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-brand-navy">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 mr-2">
                      <AlertTriangle className="size-3" />
                      {unresolvedCount} question{unresolvedCount !== 1 ? "s" : ""}
                    </span>
                    need attention in your Mistakes Bank
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Practice only what you got wrong — the fastest way to raise your score.
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 group-hover:bg-red-100 transition-colors">
                  Drill now <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            )}

            {/* ── Top row: Recent Activity + Quick Stats ── */}
            <div className="grid gap-4 lg:grid-cols-3">

              {/* Recent Attempts feed */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="size-4 text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-900">Recent Exam Activity</h2>
                  </div>
                  {recentAttempts.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400">Last {recentAttempts.length} attempts</span>
                  )}
                </div>
                {recentAttempts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 mb-3">
                      <Play className="size-6 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-700">No attempts yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Start your first chapter exam below to track your progress here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {recentAttempts.map((attempt) => {
                      const grade = SCORE_GRADE(attempt.score);
                      return (
                        <div
                          key={attempt.id}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors"
                        >
                          <div
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold border",
                              grade.color,
                            )}
                          >
                            {grade.label}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {attempt.chapterTitle}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {attempt.courseName}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-slate-900 tabular-nums">
                              {attempt.score}%
                            </p>
                            <p className="text-[10px] font-medium text-emerald-600 tabular-nums">
                              +{attempt.xp} XP
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                              attempt.passed
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600",
                            )}
                          >
                            {attempt.passed ? (
                              <><CheckCircle2 className="size-2.5" /> Passed</>
                            ) : (
                              <><X className="size-2.5" /> Failed</>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Stats column */}
              <div className="flex flex-col gap-4">
                {/* Streak card */}
                <div className="rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50 to-white p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="size-4 text-orange-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                      Study Streak
                    </span>
                  </div>
                  <p className="font-serif text-4xl font-bold text-slate-900">
                    {studyStreakDays}
                    <span className="ml-1 text-lg font-normal text-slate-400">day{studyStreakDays !== 1 ? "s" : ""}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {studyStreakDays === 0
                      ? "Start your first exam to begin a streak!"
                      : studyStreakDays >= 5
                        ? "🔥 You're on fire — keep it up!"
                        : "Keep going to build momentum!"}
                  </p>
                </div>

                {/* XP from exams */}
                <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="size-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Exam XP Earned
                    </span>
                  </div>
                  <p className="font-serif text-4xl font-bold text-slate-900 tabular-nums">
                    {overall.totalXp.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {overall.totalAttempts} attempt{overall.totalAttempts !== 1 ? "s" : ""} recorded
                  </p>
                </div>

                {/* Potential left to earn */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="size-4 text-brand-gold" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      XP Still Available
                    </span>
                  </div>
                  <p className="font-serif text-4xl font-bold text-slate-900 tabular-nums">
                    {examCourses
                      .reduce((s, c) => s + c.chapters.length * 75, 0)
                      .toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    across all {examCourses.length} courses
                  </p>
                </div>
              </div>
            </div>

            {/* ── Search + Filter ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Category filter chips */}
              <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
                {CATEGORIES.map((cat) => {
                  const isActive = category === cat;
                  const meta = CATEGORY_META[cat];
                  const count = categoryCounts[cat] ?? 0;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all",
                        isActive
                          ? "border-brand-navy bg-brand-navy text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand-navy/30 hover:text-brand-navy",
                      )}
                    >
                      {cat !== "All" && meta && (
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            cat === "Natural Science"
                              ? "bg-blue-500"
                              : cat === "Social Science"
                                ? "bg-violet-500"
                                : "bg-amber-500",
                          )}
                        />
                      )}
                      {cat}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-px text-[10px] font-bold",
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Course Grid ── */}
            {filtered.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100">
                  <Search className="size-7 text-slate-400" />
                </div>
                <p className="font-serif text-xl font-bold text-brand-navy">No courses found</p>
                <p className="mt-2 text-sm text-slate-500">
                  Try a different search term or switch the category filter.
                </p>
                <button
                  type="button"
                  onClick={() => { setQuery(""); setCategory("All"); }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 shadow-xs hover:border-slate-300"
                >
                  <X className="size-3.5" /> Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    getCourseStats={getCourseStats}
                    recommended={trackCategory !== null && course.category === trackCategory}
                  />
                ))}
              </div>
            )}

            {/* ── Bottom CTA banner ── */}
            <div className="rounded-3xl bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900 p-8 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-gold/20">
                <Trophy className="size-7 text-brand-gold" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-white">
                Score 80%+ on every chapter to become <span className="text-brand-gold">Exam Ready</span>
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
                Each passing attempt earns XP you can withdraw as real ETB cash. Completing all
                chapters in a course unlocks a bonus XP award.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/exams"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-gold px-6 py-3 text-sm font-bold text-brand-navy shadow-lg hover:brightness-110 transition-all"
                >
                  <Play className="size-4" /> Start Studying
                </Link>
                <Link
                  to="/rewards"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all"
                >
                  <Zap className="size-4" /> View Rewards
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

          </div>
        </main>
        <SiteFooter />
        <BackToTop />
      </div>
    </ComingSoonGate>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({
  course,
  getCourseStats,
  recommended = false,
}: {
  course: ExamCourse;
  getCourseStats: (
    courseId: string,
    total: number,
  ) => { completed: number; total: number; percent: number };
  recommended?: boolean;
}) {
  const stats = getCourseStats(course.id, course.chapters.length);
  const catMeta = CATEGORY_META[course.category] ?? {
    pill: "bg-slate-600 text-white",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
  };

  const isComplete = stats.completed === stats.total && stats.total > 0;
  const isStarted = stats.completed > 0 && !isComplete;

  const statusLabel = isComplete ? "Mastered" : isStarted ? "In Progress" : "Not Started";
  const statusColor = isComplete
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : isStarted
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-slate-500 bg-slate-50 border-slate-200";

  const maxXp = course.chapters.length * 75;

  return (
    <Link
      to="/exams/$courseId"
      params={{ courseId: course.id }}
      className="group flex flex-col rounded-3xl border bg-white shadow-xs overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/70 relative"
      style={{
        borderColor: isComplete
          ? "#10b981"
          : isStarted
            ? "#f59e0b"
            : "#e2e8f0",
      }}
    >
      {/* Cover with overlaid badges */}
      <CourseCover
        courseId={course.id}
        name={course.name}
        coverUrl={course.coverUrl}
        className="h-44 sm:h-48"
      >
        {/* Rarity-style top gradient strip based on completion */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-1 z-20",
            isComplete
              ? "bg-gradient-to-r from-emerald-400 to-teal-400"
              : isStarted
                ? "bg-gradient-to-r from-amber-400 to-yellow-400"
                : "bg-gradient-to-r from-white/20 via-white/40 to-transparent",
          )}
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1.5 p-3.5 z-10">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-md",
              catMeta.pill,
            )}
          >
            {course.category}
          </span>
          {recommended && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-brand-gold/60 bg-brand-gold text-brand-navy shadow-sm backdrop-blur-md flex items-center gap-1">
              <Sparkles className="size-2.5" /> Track Match
            </span>
          )}
          {isComplete && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm backdrop-blur-md">
              <CheckCircle2 className="size-2.5" /> Mastered
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/40 text-white/90 border border-white/20 backdrop-blur-md shadow-xs">
            <BookOpen className="size-2.5 text-white/70" />
            {course.chapters.length} Ch
          </span>
        </div>
      </CourseCover>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-serif text-base font-bold leading-snug text-brand-navy group-hover:text-blue-900 transition-colors flex-1 line-clamp-2">
            {course.name}
          </h3>
          <span
            className={cn(
              "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border",
              statusColor,
            )}
          >
            {statusLabel}
          </span>
        </div>

        {/* Meta tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
          <span className="flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
            <ClipboardList className="size-3 text-slate-400" />
            {course.questionsPerExam} Q
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
            <Clock className="size-3 text-slate-400" />
            {course.durationMinutes}m
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-emerald-50/70 border border-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
            <Zap className="size-3 text-emerald-600" />
            +{maxXp} XP
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-auto space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Chapter Progress</span>
            <span className="font-mono font-bold text-slate-700">
              {stats.completed}/{stats.total} ({stats.percent}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-100">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                isComplete
                  ? "from-emerald-400 to-teal-500"
                  : isStarted
                    ? "from-amber-400 to-yellow-500"
                    : "from-slate-300 to-slate-400",
              )}
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1 text-xs font-bold text-brand-navy group-hover:text-blue-900 transition-colors">
            {isComplete ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <Trophy className="size-3.5" /> Exam Complete
              </span>
            ) : (
              <>
                Practice Chapters
                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-600">
            {course.short}
          </span>
        </div>
      </div>
    </Link>
  );
}
