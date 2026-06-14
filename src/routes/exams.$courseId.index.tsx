import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ChevronRight, Circle, Play } from "lucide-react";
import { useState } from "react";

import { ChapterDetailSheet } from "@/components/chapter-detail-sheet";
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

  if (!course) throw notFound();

  const stats = getCourseStats(course.id, course.chapters.length);

  const openChapter = (chapter: ExamChapter, index: number) => {
    setSelectedChapter({ chapter, index });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
            <Link to="/exams">
              <ArrowLeft className="size-4" />
              All courses
            </Link>
          </Button>

          <header className="mb-8">
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

          <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Course progress
                </p>
                <p className="mt-1 font-serif text-2xl font-bold text-brand-navy">
                  {stats.completed} / {stats.total} chapters
                </p>
              </div>
              <p className="font-serif text-3xl font-bold text-brand-gold">{stats.percent}%</p>
            </div>
            <Progress value={stats.percent} className="mt-4 h-2" />
          </div>

          <div className="space-y-3">
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
                  courseId={course.id}
                />
              );
            })}
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
    </div>
  );
}

function ChapterRow({
  chapter,
  index,
  completed,
  progress,
  onOpen,
  courseId,
}: {
  chapter: ExamChapter;
  index: number;
  completed: boolean;
  progress?: { bestScore?: number; attempts?: number };
  onOpen: () => void;
  courseId: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm transition",
        completed ? "border-emerald-200" : "border-slate-100 hover:border-brand-navy/20",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50/80"
      >
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
          )}
        >
          {completed ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Chapter {index + 1}
          </p>
          <p className="font-semibold text-brand-navy">{chapter.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {completed ? (
              <>
                <span className="font-semibold text-emerald-700">Completed</span>
                {progress?.bestScore !== undefined && <> · Best: {progress.bestScore}%</>}
              </>
            ) : (
              <span className="text-slate-400">Tap to view details & start exam</span>
            )}
            {progress?.attempts ? <> · {progress.attempts} attempt(s)</> : null}
          </p>
        </div>

        <ChevronRight className="size-5 shrink-0 text-slate-400" />
      </button>

      <div className="flex gap-2 border-t border-slate-100 px-5 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex-1 text-slate-600"
          onClick={onOpen}
        >
          View chapter
        </Button>
        <Button asChild size="sm" className="flex-1 gap-2 bg-brand-navy hover:bg-brand-navy/90">
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
