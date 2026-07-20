import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Lightbulb,
  Play,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ChapterProgress } from "@/hooks/use-exam-progress";
import { getChapterMeta } from "@/lib/chapter-meta";
import type { ExamChapter, ExamCourse } from "@/lib/exam-data";
import { cn } from "@/lib/utils";

type SlideType = "cover" | "objectives" | "topics" | "tips" | "ready";

interface Slide {
  type: SlideType;
}

const categoryGradient: Record<string, string> = {
  "Natural Science": "from-blue-900 via-blue-800 to-blue-950",
  "Social Science": "from-violet-900 via-violet-800 to-violet-950",
  Common: "from-brand-navy via-[#1a3470] to-[#0f2055]",
  Engineering: "from-orange-900 via-orange-800 to-orange-950",
  Medicine: "from-rose-900 via-rose-800 to-rose-950",
};

export function ChapterPresentation({
  open,
  onClose,
  course,
  chapter,
  chapterIndex,
  progress,
}: {
  open: boolean;
  onClose: () => void;
  course: ExamCourse;
  chapter: ExamChapter | null;
  chapterIndex: number;
  progress?: ChapterProgress;
}) {
  const [slide, setSlide] = useState(0);

  const slides: Slide[] = [
    { type: "cover" },
    { type: "objectives" },
    { type: "topics" },
    { type: "tips" },
    { type: "ready" },
  ];

  const total = slides.length;

  const goNext = useCallback(() => setSlide((s) => Math.min(s + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    if (!open) {
      setSlide(0);
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goNext, goPrev, onClose]);

  if (!open || !chapter) return null;

  const meta = getChapterMeta(course, chapter, chapterIndex);
  const completed = progress?.completed ?? false;
  const gradient = categoryGradient[course.category] ?? categoryGradient.Common;
  const percent = Math.round(((slide + 1) / total) * 100);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/80 backdrop-blur-sm">
      {/* Slide area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          aria-label="Close presentation"
        >
          <X className="size-5" />
        </button>

        {/* Slide counter */}
        <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
          {slide + 1} / {total}
        </div>

        {/* Slide content */}
        <div
          key={slide}
          className="w-full max-w-3xl animate-in fade-in slide-in-from-right-4 duration-300"
        >
          {slides[slide].type === "cover" && (
            <CoverSlide
              course={course}
              chapter={chapter}
              chapterIndex={chapterIndex}
              meta={meta}
              completed={completed}
              gradient={gradient}
            />
          )}
          {slides[slide].type === "objectives" && (
            <ObjectivesSlide meta={meta} gradient={gradient} />
          )}
          {slides[slide].type === "topics" && (
            <TopicsSlide meta={meta} gradient={gradient} course={course} chapter={chapter} />
          )}
          {slides[slide].type === "tips" && (
            <TipsSlide meta={meta} gradient={gradient} course={course} />
          )}
          {slides[slide].type === "ready" && (
            <ReadySlide
              course={course}
              chapter={chapter}
              completed={completed}
              gradient={gradient}
              onClose={onClose}
            />
          )}
        </div>

        {/* Prev / Next */}
        {slide > 0 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        {slide < total - 1 && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            aria-label="Next slide"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* Bottom progress + nav */}
      <div className="shrink-0 border-t border-white/10 bg-black/40 px-6 py-4">
        <Progress value={percent} className="h-1 bg-white/20 [&>div]:bg-brand-gold" />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                className={cn(
                  "size-2 rounded-full transition-all",
                  i === slide ? "w-6 bg-brand-gold" : "bg-white/30 hover:bg-white/50",
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              disabled={slide === 0}
              className="gap-1.5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
              Prev
            </Button>
            {slide < total - 1 ? (
              <Button
                size="sm"
                onClick={goNext}
                className="gap-1.5 bg-brand-gold text-white hover:bg-brand-gold/90"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="gap-1.5 bg-brand-gold text-white hover:bg-brand-gold/90"
                onClick={onClose}
              >
                <Link
                  to="/exams/$courseId/$chapterId"
                  params={{ courseId: course.id, chapterId: chapter.id }}
                >
                  <Play className="size-4" />
                  {completed ? "Retake exam" : "Start exam"}
                </Link>
              </Button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-white/30">
          ← → arrow keys to navigate · ESC to close
        </p>
      </div>
    </div>
  );
}

/* ── Individual slides ── */

function CoverSlide({
  course,
  chapter,
  chapterIndex,
  meta,
  completed,
  gradient,
}: {
  course: ExamCourse;
  chapter: ExamChapter;
  chapterIndex: number;
  meta: ReturnType<typeof getChapterMeta>;
  completed: boolean;
  gradient: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-gradient-to-br p-10 shadow-2xl shadow-black/50 sm:p-14",
        gradient,
      )}
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-full border border-brand-gold/40 bg-brand-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-gold">
          {course.short} · Chapter {chapterIndex + 1}
        </span>
        {completed && (
          <span className="rounded-full border border-emerald-400/40 bg-emerald-400/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-300">
            ✓ Completed
          </span>
        )}
      </div>

      <h1 className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
        {chapter.title}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60">{meta.summary}</p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        {[
          { icon: ClipboardList, label: "Questions", value: `${course.questionsPerExam} MCQ` },
          { icon: Clock, label: "Time limit", value: `${course.durationMinutes} min` },
          { icon: BookOpen, label: "Study time", value: `~${meta.studyMinutes} min` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
          >
            <stat.icon className="mx-auto size-5 text-brand-gold" />
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-white/40">
              {stat.label}
            </p>
            <p className="mt-1 text-lg font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ObjectivesSlide({
  meta,
  gradient,
}: {
  meta: ReturnType<typeof getChapterMeta>;
  gradient: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-gradient-to-br p-10 shadow-2xl shadow-black/50 sm:p-14",
        gradient,
      )}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-gold/20 ring-1 ring-brand-gold/30">
          <Target className="size-5 text-brand-gold" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
          Slide 2 of 5 · Learning Objectives
        </p>
      </div>

      <h2 className="mb-8 font-serif text-3xl font-bold text-white sm:text-4xl">
        What you&apos;ll learn
      </h2>

      <ol className="space-y-4">
        {meta.objectives.map((obj, i) => (
          <li key={i} className="flex items-start gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-gold/20 font-serif text-base font-bold text-brand-gold">
              {i + 1}
            </span>
            <p className="pt-1 text-base leading-relaxed text-white/85">{obj}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-white/50">
          Mastering these objectives prepares you for the chapter mock exam and the Ethiopian MoE
          Exit Exam.
        </p>
      </div>
    </div>
  );
}

function TopicsSlide({
  meta,
  gradient,
  course,
  chapter,
}: {
  meta: ReturnType<typeof getChapterMeta>;
  gradient: string;
  course: ExamCourse;
  chapter: ExamChapter;
}) {
  const topicDetails = [
    {
      title: "Definitions & Terminology",
      body: `Core vocabulary and key terms for ${chapter.title}. Knowing exact definitions is essential for MCQ recognition.`,
    },
    {
      title: "Theory & Principles",
      body: `Foundational rules, laws, and theoretical frameworks that underpin ${chapter.title}. Expect at least 2–3 exam questions here.`,
    },
    {
      title: "Worked Examples",
      body: `Step-by-step problem-solving for ${course.short}. Practice applying theory to the scenario-based questions.`,
    },
    {
      title: "Exit Exam Practice",
      body: `Past-pattern MCQs specific to ${chapter.title}. Focus on common distractors and why they are wrong.`,
    },
  ];

  return (
    <div
      className={cn(
        "rounded-3xl bg-gradient-to-br p-10 shadow-2xl shadow-black/50 sm:p-14",
        gradient,
      )}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-gold/20 ring-1 ring-brand-gold/30">
          <BookOpen className="size-5 text-brand-gold" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
          Slide 3 of 5 · Key Topics
        </p>
      </div>

      <h2 className="mb-8 font-serif text-3xl font-bold text-white sm:text-4xl">Topics covered</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {topicDetails.map((t, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-brand-gold/20 text-[10px] font-bold text-brand-gold">
                {String.fromCharCode(65 + i)}
              </span>
              <p className="text-sm font-bold text-white">{t.title}</p>
            </div>
            <p className="text-xs leading-relaxed text-white/55">{t.body}</p>
          </div>
        ))}
      </div>

      {meta.topics.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {meta.topics.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TipsSlide({
  meta,
  gradient,
  course,
}: {
  meta: ReturnType<typeof getChapterMeta>;
  gradient: string;
  course: ExamCourse;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-gradient-to-br p-10 shadow-2xl shadow-black/50 sm:p-14",
        gradient,
      )}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-400/20 ring-1 ring-amber-400/30">
          <Lightbulb className="size-5 text-amber-300" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
          Slide 4 of 5 · Exam Tips
        </p>
      </div>

      <h2 className="mb-8 font-serif text-3xl font-bold text-white sm:text-4xl">
        Before you start
      </h2>

      <div className="space-y-4">
        {meta.examTips.map((tip, i) => (
          <div
            key={i}
            className="flex items-start gap-4 rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-xs font-bold text-amber-300">
              {i + 1}
            </span>
            <p className="pt-0.5 text-sm leading-relaxed text-white/80">{tip}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <Clock className="mx-auto size-5 text-brand-gold" />
          <p className="mt-2 text-xs text-white/40 uppercase tracking-wider">Duration</p>
          <p className="mt-1 font-bold text-white">{course.durationMinutes} minutes</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <Trophy className="mx-auto size-5 text-brand-gold" />
          <p className="mt-2 text-xs text-white/40 uppercase tracking-wider">Pass score</p>
          <p className="mt-1 font-bold text-white">60% or higher</p>
        </div>
      </div>
    </div>
  );
}

function ReadySlide({
  course,
  chapter,
  completed,
  gradient,
  onClose,
}: {
  course: ExamCourse;
  chapter: ExamChapter;
  completed: boolean;
  gradient: string;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-gradient-to-br p-10 shadow-2xl shadow-black/50 sm:p-14",
        gradient,
      )}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-gold/20 ring-1 ring-brand-gold/30">
          <Play className="size-5 text-brand-gold" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
          Slide 5 of 5 · Ready
        </p>
      </div>

      <h2 className="mb-4 font-serif text-3xl font-bold text-white sm:text-4xl">
        {completed ? "Go again?" : "Ready to test yourself?"}
      </h2>
      <p className="mb-10 max-w-lg text-base leading-relaxed text-white/60">
        {completed
          ? `You've already completed this chapter. Challenge yourself to beat your previous score.`
          : `You've reviewed all the key material for "${chapter.title}". Now put your knowledge to the test with the timed mock exam.`}
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          asChild
          size="lg"
          className="h-14 flex-1 gap-2 bg-brand-gold text-lg font-bold text-white hover:bg-brand-gold/90 shadow-lg shadow-brand-gold/30"
          onClick={onClose}
        >
          <Link
            to="/exams/$courseId/$chapterId"
            params={{ courseId: course.id, chapterId: chapter.id }}
          >
            <Play className="size-5" />
            {completed ? "Retake mock exam" : "Start mock exam"}
          </Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onClose}
          className="h-14 border-white/20 text-white/70 hover:bg-white/10 hover:text-white sm:w-40"
        >
          Close
        </Button>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs leading-relaxed text-white/40">
          Scoring 60% or above marks this chapter complete and earns you XP. Each chapter can be
          retaken as many times as you like — only your best score counts.
        </p>
      </div>
    </div>
  );
}
