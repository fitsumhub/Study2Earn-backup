import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Coins,
  Play,
  Presentation,
} from "lucide-react";
import { useState } from "react";

import { ChapterDetailSheet } from "@/components/chapter-detail-sheet";
import { ChapterPresentation } from "@/components/chapter-presentation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
          <Button variant="ghost" size="sm" className="mb-6 gap-2 -mt-2" asChild>
            <Link to="/exams">
              <ArrowLeft className="size-4" />
              All courses
            </Link>
          </Button>

          <header className="mb-8 section-enter">
            <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
              {course.short}
            </p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-brand-navy md:text-4xl">
              {course.name}
            </h1>
            <p className="mt-3 text-slate-600">
              Tap a chapter to view objectives, topics, and your progress — then start the timed
              mock exam when ready.
            </p>
          </header>

          {/* Progress card */}
          <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Course progress
                </p>
                <p className="mt-1 font-serif text-2xl font-bold text-brand-navy">
                  {stats.completed} / {stats.total} chapters
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {stats.total - stats.completed > 0
                    ? `${stats.total - stats.completed} chapter${stats.total - stats.completed !== 1 ? "s" : ""} remaining`
                    : "All chapters complete!"}
                </p>
              </div>
              <div className="size-16 rounded-full bg-brand-gold/10 border-2 border-brand-gold/25 grid place-items-center">
                <span className="font-serif text-xl font-bold text-brand-gold">
                  {stats.percent}%
                </span>
              </div>
            </div>
            <Progress value={stats.percent} className="h-2 [&>div]:bg-brand-gold" />
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-gold/5 border border-brand-gold/20 px-3 py-2">
              <Coins className="size-3.5 shrink-0 text-brand-gold" />
              <p className="text-xs text-slate-600">
                Up to{" "}
                <span className="font-bold text-brand-gold">{course.chapters.length * 200} XP</span>{" "}
                available in this course
                {stats.completed > 0 && (
                  <span className="text-slate-500"> · {stats.completed * 100}+ already earned</span>
                )}
              </p>
            </div>
          </div>

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
        ? "bg-green-50 text-green-700 border border-green-200"
        : progress.bestScore >= 60
          ? "bg-amber-50 text-amber-700 border border-amber-200"
          : "bg-red-50 text-red-700 border border-red-200"
      : "";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm transition-all",
        completed
          ? "border-emerald-200 bg-green-50/20"
          : "border-slate-100 hover:border-brand-navy/20 hover:shadow-md",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-slate-50/80"
      >
        {/* Status circle (sits on top of timeline line) */}
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-white z-10 shadow-sm",
            completed ? "border-emerald-400 text-emerald-600" : "border-slate-200 text-slate-400",
          )}
        >
          {completed ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <span className="text-xs font-bold">{index + 1}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Chapter {index + 1}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-brand-navy">{chapter.title}</p>
            {progress?.bestScore !== undefined && (
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", scoreColor)}>
                {progress.bestScore}%
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {completed ? (
              <span className="font-semibold text-emerald-600">Completed</span>
            ) : (
              <span className="text-slate-500">Tap to view details &amp; start exam</span>
            )}
            {progress?.attempts ? <> · {progress.attempts} attempt(s)</> : null}
          </p>
        </div>

        <ChevronRight className="size-5 shrink-0 text-slate-300" />
      </button>

      <div className="flex gap-2 border-t border-slate-100 px-5 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex-1 gap-1.5 text-slate-600 hover:text-brand-navy"
          onClick={onPresent}
        >
          <Presentation className="size-3.5" />
          View chapter
        </Button>
        <Button
          asChild
          size="sm"
          className={cn(
            "flex-1 gap-2",
            completed
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-brand-navy hover:bg-brand-navy/90",
          )}
        >
          <Link
            to="/exams/$courseId/$chapterId"
            params={{ courseId, chapterId: chapter.id }}
            onClick={(e) => e.stopPropagation()}
          >
            <Play className="size-3.5" />
            {completed ? "Retake" : "Start exam"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
