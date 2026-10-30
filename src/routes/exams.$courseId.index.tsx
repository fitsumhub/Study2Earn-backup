import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Play,
  Presentation,
} from "lucide-react";
import { useState } from "react";

import { ChapterDetailSheet } from "@/components/chapter-detail-sheet";
import { ChapterPresentation } from "@/components/chapter-presentation";
import { CourseCover } from "@/components/course-cover";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { getCourseById, type ExamChapter } from "@/lib/exam-data";
import { useExamProgress } from "@/hooks/use-exam-progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exams/$courseId/")({
  head: ({ params }) => {
    const course = getCourseById(params.courseId);
    return {
      meta: [
        { title: course ? `${course.name} — Mock Exams` : "Course — Study2Earn" },
        {
          name: "description",
          content: course
            ? `Chapter mock exams for ${course.name}. Timed MCQ with instant scoring.`
            : "Course mock exams",
        },
      ],
    };
  },
  component: CourseChaptersPage,
});

function CourseChaptersPage() {
  const { courseId } = Route.useParams();
  const course = getCourseById(courseId);
  const { getChapterProgress, getCourseStats } = useExamProgress();
  const [selectedChapter, setSelectedChapter] = useState<{
    chapter: ExamChapter;
    index: number;
  } | null>(null);
  const [presentationChapter, setPresentationChapter] = useState<{
    chapter: ExamChapter;
    index: number;
  } | null>(null);

  if (!course) throw notFound();

  const stats = getCourseStats(course.id, course.chapters.length);

  const openChapter = (chapter: ExamChapter, index: number) => {
    setSelectedChapter({ chapter, index });
  };

  const openPresentation = (chapter: ExamChapter, index: number) => {
    setPresentationChapter({ chapter, index });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Breadcrumbs items={[{ label: "Mock Exams", to: "/exams" }, { label: course.short }]} />
          <Button variant="ghost" size="sm" className="mb-6 gap-2 -mt-2 text-slate-600 hover:text-brand-navy" asChild>
            <Link to="/exams">
              <ArrowLeft className="size-4" />
              All Courses
            </Link>
          </Button>

          {/* Course Hero Banner with enhanced thumbnail */}
          <header className="mb-8 section-enter rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <CourseCover
              courseId={course.id}
              name={course.name}
              coverUrl={course.coverUrl}
              className="h-44 sm:h-52"
            />
            
            <div className="p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50/70 to-amber-50/20 relative">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-navy px-3 py-1 text-[11px] font-bold text-white shadow-xs">
                      {course.category}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {course.durationMinutes} min / exam
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {course.questionsPerExam} Qs / chapter
                    </span>
                  </div>
                  <h1 className="font-serif text-3xl font-bold text-brand-navy md:text-4xl">
                    {course.name}
                  </h1>
                  <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                    Choose a chapter to practice timed MCQs, review core lecture concepts, and earn up to{" "}
                    <span className="font-bold text-brand-gold">{course.chapters.length * 75} XP</span>.
                  </p>
                </div>

                {/* Radial gauge */}
                <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs">
                  <div className="relative size-16 shrink-0">
                    <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="none"
                        stroke={stats.percent >= 80 ? "#10b981" : stats.percent >= 40 ? "#d97706" : "#3b82f6"}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={String(2 * Math.PI * 26)}
                        strokeDashoffset={String(2 * Math.PI * 26 * (1 - (stats.total > 0 ? stats.percent / 100 : 0)))}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-serif text-sm font-bold text-brand-navy">
                      {stats.percent}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mastery</p>
                    <p className="font-bold text-slate-900 text-sm">{stats.completed}/{stats.total} Complete</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      +{stats.completed * 75} XP Earned
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Chapter timeline */}
          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-slate-200 z-0" />

            <div className="space-y-3 relative z-10">
              {course.chapters.map((chapter, idx) => {
                const progress = getChapterProgress(course.id, chapter.id);
                const completed = progress?.completed ?? false;

                return (
                  <ChapterRow
                    key={chapter.id}
                    chapter={chapter}
                    index={idx}
                    completed={completed}
                    progress={progress}
                    onOpen={() => openChapter(chapter, idx)}
                    onPresent={() => openPresentation(chapter, idx)}
                    courseId={course.id}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />

      <ChapterDetailSheet
        open={selectedChapter !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedChapter(null);
        }}
        course={course}
        chapter={selectedChapter?.chapter ?? null}
        chapterIndex={selectedChapter?.index ?? 0}
        progress={
          selectedChapter ? getChapterProgress(course.id, selectedChapter.chapter.id) : undefined
        }
      />

      <ChapterPresentation
        open={presentationChapter !== null}
        onClose={() => setPresentationChapter(null)}
        course={course}
        chapter={presentationChapter?.chapter ?? null}
        chapterIndex={presentationChapter?.index ?? 0}
        progress={
          presentationChapter
            ? getChapterProgress(course.id, presentationChapter.chapter.id)
            : undefined
        }
      />
    </div>
  );
}

function ChapterRow({
  chapter,
  index,
  completed,
  progress,
  onOpen,
  onPresent,
  courseId,
}: {
  chapter: ExamChapter;
  index: number;
  completed: boolean;
  progress?: { bestScore?: number; attempts?: number };
  onOpen: () => void;
  onPresent: () => void;
  courseId: string;
}) {
  const scoreColor =
    progress?.bestScore !== undefined
      ? progress.bestScore >= 80
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : progress.bestScore >= 60
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-red-50 text-red-700 border-red-200"
      : "";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-xs transition-all duration-200 hover:shadow-md",
        completed
          ? "border-emerald-200/90 bg-gradient-to-r from-emerald-50/30 to-white"
          : "border-slate-200/80 hover:border-slate-300",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-slate-50/60"
      >
        {/* Status circle (sits on top of timeline line) */}
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl border-2 bg-white z-10 shadow-xs transition-transform group-hover:scale-105",
            completed ? "border-emerald-500 text-emerald-600 bg-emerald-50/50" : "border-slate-200 text-slate-500 font-bold",
          )}
        >
          {completed ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <span className="text-xs font-bold">{index + 1}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Chapter {index + 1}
            </span>
            {completed && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Completed
              </span>
            )}
            {progress?.bestScore !== undefined && (
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", scoreColor)}>
                Best: {progress.bestScore}%
              </span>
            )}
          </div>

          <p className="font-bold text-slate-900 text-base mt-0.5">{chapter.title}</p>

          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              +{completed ? 75 : 75} XP Available
            </span>
            {progress?.attempts ? (
              <span className="text-slate-400">· {progress.attempts} attempt{progress.attempts !== 1 ? "s" : ""}</span>
            ) : (
              <span className="text-slate-400">· Not attempted yet</span>
            )}
          </div>
        </div>

        <ChevronRight className="size-5 shrink-0 text-slate-300" />
      </button>

      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand-navy border-slate-200"
          onClick={onPresent}
        >
          <Presentation className="size-3.5" />
          Study Chapter
        </Button>
        <Button
          asChild
          size="sm"
          className={cn(
            "flex-1 gap-2 text-xs font-bold shadow-xs",
            completed
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-brand-navy hover:bg-brand-navy/90 text-white",
          )}
        >
          <Link
            to="/exams/$courseId/$chapterId"
            params={{ courseId, chapterId: chapter.id }}
            onClick={(e) => e.stopPropagation()}
          >
            <Play className="size-3.5" />
            {completed ? "Retake Exam" : "Take Exam"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
