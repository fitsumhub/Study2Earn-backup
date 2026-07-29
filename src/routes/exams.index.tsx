import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, ChevronRight, ClipboardList, Search, Sparkles, Target, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMemo, useState } from "react";

import { SiteHeader, SiteFooter, BackToTop } from "@/components/site-chrome";
import { CourseCover } from "@/components/course-cover";
import { ComingSoonGate } from "@/components/coming-soon-gate";
import { Input } from "@/components/ui/input";
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

const categoryStyle: Record<string, { pill: string }> = {
  "Natural Science": { pill: "bg-blue-600 text-white" },
  "Social Science": { pill: "bg-violet-600 text-white" },
  Common: { pill: "bg-amber-500 text-white" },
};

const categories = ["All", "Natural Science", "Social Science", "Common"] as const;

function ExamsPage() {
  const { user } = useAuth();
  const { getCourseStats, getOverallStats } = useExamProgress();
  const { unresolvedCount } = useMistakes();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const overall = getOverallStats();
  const trackCategory = user?.studyTrack ? STUDY_TRACK_LABELS[user.studyTrack] : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = examCourses.filter((course) => {
      const matchesCategory = category === "All" || course.category === category;
      const matchesQuery =
        !q || course.name.toLowerCase().includes(q) || course.short.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
    if (!trackCategory) return matches;
    // Surface the student's own track first, then shared (Common) courses
    const rank = (course: ExamCourse) =>
      course.category === trackCategory ? 0 : course.category === "Common" ? 1 : 2;
    return [...matches].sort((a, b) => rank(a) - rank(b));
  }, [query, category, trackCategory]);

  return (
    <ComingSoonGate pageKey="exams">
      <div className="flex min-h-screen flex-col bg-slate-50">
        <SiteHeader />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <header className="mb-10 section-enter">
              <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
                Exam Center
              </p>
              <h1 className="mt-1 font-serif text-4xl font-bold text-brand-navy md:text-5xl">
                Mock Exit Exams
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Select a core course, choose a chapter, and take a timed multiple-choice mock exam.
                Score {60}% or higher to mark a chapter complete.
              </p>
              {trackCategory && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-navy">
                  <Sparkles className="size-3.5 text-brand-gold" />
                  Personalized for your {trackCategory} track — your courses appear first.
                </p>
              )}
            </header>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3.5 text-sm text-slate-600 shadow-sm">
                <div className="size-8 rounded-full bg-brand-navy/10 grid place-items-center shrink-0">
                  <ClipboardList className="size-4 text-brand-navy" />
                </div>
                <span>
                  <strong className="text-brand-navy">{examCourses.length} core courses</strong>
                  {overall.completed > 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="text-emerald-600 font-semibold">
                        {overall.completed} chapters completed
                      </span>
                    </>
                  )}
                </span>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search courses…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 bg-white border-slate-200"
                />
              </div>
            </div>

            {/* Overall progress banner */}
            {overall.total > 0 && (
              <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-6 p-5">
                  {/* SVG ring */}
                  <div className="relative shrink-0 size-20">
                    <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="none"
                        stroke={
                          overall.percent >= 80
                            ? "#10b981"
                            : overall.percent >= 40
                              ? "#d97706"
                              : "#3b82f6"
                        }
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={String(2 * Math.PI * 32)}
                        strokeDashoffset={String(2 * Math.PI * 32 * (1 - overall.percent / 100))}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center rotate-90 font-serif text-lg font-bold text-brand-navy">
                      {overall.percent}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Overall Exit Exam readiness
                    </p>
                    <p className="mt-1 font-serif text-2xl font-bold text-brand-navy">
                      {overall.completed}{" "}
                      <span className="text-slate-400 text-base font-normal">of</span>{" "}
                      {overall.total} chapters complete
                    </p>
                    <Progress
                      value={overall.percent}
                      className={cn(
                        "mt-2 h-2",
                        overall.percent >= 80
                          ? "[&>div]:bg-emerald-500"
                          : overall.percent >= 40
                            ? "[&>div]:bg-brand-gold"
                            : "[&>div]:bg-blue-500",
                      )}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {overall.percent >= 80 ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        <Trophy className="size-3.5" /> Exam ready!
                      </span>
                    ) : overall.percent >= 40 ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                        <Sparkles className="size-3.5" /> Good progress
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                        <Target className="size-3.5" /> Just getting started
                      </span>
                    )}
                    <p className="text-[10px] text-slate-500">
                      {overall.total - overall.completed} chapters remaining
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mistakes bank shortcut */}
            {unresolvedCount > 0 && (
              <Link
                to="/exams/mistakes"
                className="group mb-8 flex items-center gap-4 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/80 to-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-100">
                  <Brain className="size-5 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-navy">
                    {unresolvedCount} question{unresolvedCount !== 1 ? "s" : ""} to fix in your
                    Mistakes Bank
                  </p>
                  <p className="text-xs text-slate-500">
                    Practice only what you got wrong — the fastest way to raise your score.
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-red-500">
                  Practice now
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            )}

            {/* Category filter pills */}
            <div className="mb-6 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 border",
                    category === cat
                      ? "bg-brand-navy text-white border-brand-navy shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-brand-navy/30 hover:text-brand-navy",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
                <div className="size-16 rounded-full bg-slate-100 grid place-items-center mx-auto mb-4">
                  <Search className="size-7 text-slate-400" />
                </div>
                <p className="font-serif text-xl font-bold text-brand-navy">No courses found</p>
                <p className="mt-2 text-sm text-slate-500">
                  Try a different search or category filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          </div>
        </main>
        <SiteFooter />
        <BackToTop />
      </div>
    </ComingSoonGate>
  );
}

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
  const catStyle = categoryStyle[course.category] ?? { pill: "bg-slate-600 text-white" };

  const statusLabel =
    stats.completed === stats.total && stats.total > 0
      ? "Complete"
      : stats.completed > 0
        ? "In progress"
        : "Not started";
  const statusColor =
    stats.completed === stats.total && stats.total > 0
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : stats.completed > 0
        ? "text-brand-gold bg-brand-gold/10 border-brand-gold/30"
        : "text-slate-500 bg-slate-50 border-slate-200";

  return (
    <Link
      to="/exams/$courseId"
      params={{ courseId: course.id }}
      className="group flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm card-lift overflow-hidden"
    >
      {/* Cover thumbnail */}
      <CourseCover
        courseId={course.id}
        name={course.name}
        coverUrl={course.coverUrl}
        className="h-32"
      >
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1.5 p-3">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm",
              catStyle.pill,
            )}
          >
            {course.category}
          </span>
          {recommended && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-brand-gold/50 bg-brand-gold text-brand-navy shadow-sm">
              Your track
            </span>
          )}
        </div>
      </CourseCover>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-serif text-base font-bold leading-snug text-brand-navy group-hover:text-brand-navy/80 transition-colors flex-1">
            {course.name}
          </h3>
          <span
            className={cn(
              "shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border",
              statusColor,
            )}
          >
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          {course.chapters.length} chapters · {course.questionsPerExam} Q · {course.durationMinutes}{" "}
          min
        </p>

        <div className="mt-auto">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-slate-500">Progress</span>
            <span className="font-semibold text-brand-navy">
              {stats.completed}/{stats.total}
            </span>
          </div>
          <Progress value={stats.percent} className="h-1.5 [&>div]:bg-brand-gold" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm font-semibold text-brand-gold">
            View chapters
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            up to {course.chapters.length * 75} XP
          </span>
        </div>
      </div>
    </Link>
  );
}
