import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight, ClipboardList, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { examCourses, type ExamCourse } from "@/lib/exam-data";
import { useExamProgress } from "@/hooks/use-exam-progress";
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

const categoryStyle: Record<string, string> = {
  "Natural Science": "bg-blue-50 text-blue-700",
  "Social Science": "bg-violet-50 text-violet-700",
  Common: "bg-amber-50 text-amber-700",
};

const categories = ["All", "Natural Science", "Social Science", "Common"] as const;

function ExamsPage() {
  const { getCourseStats, getOverallStats } = useExamProgress();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const overall = getOverallStats();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return examCourses.filter((course) => {
      const matchesCategory = category === "All" || course.category === category;
      const matchesQuery =
        !q || course.name.toLowerCase().includes(q) || course.short.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <header className="mb-10">
            <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
              Exam Center
            </p>
            <h1 className="mt-1 font-serif text-4xl font-bold text-brand-navy md:text-5xl">
              Mock Exit Exams
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Select a core course, choose a chapter, and take a timed multiple-choice mock exam.
              Questions are randomized every attempt — score {60}% or higher to mark a chapter
              complete.
            </p>
          </header>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 rounded-xl border bg-white p-4 text-sm text-slate-600">
              <ClipboardList className="size-5 shrink-0 text-brand-navy" />
              <span>
                <strong className="text-brand-navy">{examCourses.length} core courses</strong>
                {overall.completed > 0 && (
                  <> · You&apos;ve completed {overall.completed} chapters</>
                )}
              </span>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search courses…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                  category === cat
                    ? "bg-brand-navy text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-brand-navy/30",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border bg-white p-12 text-center">
              <p className="font-serif text-xl font-bold text-brand-navy">No courses found</p>
              <p className="mt-2 text-sm text-slate-500">
                Try a different search or category filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} getCourseStats={getCourseStats} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function CourseCard({
  course,
  getCourseStats,
}: {
  course: ExamCourse;
  getCourseStats: (
    courseId: string,
    total: number,
  ) => {
    completed: number;
    total: number;
    percent: number;
  };
}) {
  const stats = getCourseStats(course.id, course.chapters.length);
  return (
    <Link
      to="/exams/$courseId"
      params={{ courseId: course.id }}
      className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-brand-navy/20 hover:shadow-md"
    >
      <div
        className={`mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${course.tint}`}
      >
        <BookOpen className="size-6 text-brand-navy" />
      </div>
      <span
        className={`mb-2 w-fit rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${categoryStyle[course.category]}`}
      >
        {course.category}
      </span>
      <h3 className="font-serif text-lg font-bold leading-snug text-brand-navy group-hover:text-brand-navy/80">
        {course.name}
      </h3>
      <p className="mt-2 text-xs text-slate-500">
        {course.chapters.length} chapters · {course.questionsPerExam} Q per exam ·{" "}
        {course.durationMinutes} min
      </p>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-slate-500">Progress</span>
          <span className="font-semibold text-brand-navy">
            {stats.completed}/{stats.total}
          </span>
        </div>
        <Progress value={stats.percent} className="h-1.5" />
      </div>
      <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-gold">
        View chapters
        <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
