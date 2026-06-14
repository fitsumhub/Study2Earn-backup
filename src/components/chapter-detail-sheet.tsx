import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ClipboardList,
  Lightbulb,
  Play,
  Target,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ChapterProgress } from "@/hooks/use-exam-progress";
import { getChapterMeta } from "@/lib/chapter-meta";
import type { ExamChapter, ExamCourse } from "@/lib/exam-data";
import { PASSING_SCORE } from "@/lib/exam-data";
import { cn } from "@/lib/utils";

export function ChapterDetailSheet({
  open,
  onOpenChange,
  course,
  chapter,
  chapterIndex,
  progress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: ExamCourse;
  chapter: ExamChapter | null;
  chapterIndex: number;
  progress?: ChapterProgress;
}) {
  if (!chapter) return null;

  const meta = getChapterMeta(course, chapter, chapterIndex);
  const completed = progress?.completed ?? false;
  const bestScore = progress?.bestScore ?? 0;
  const attempts = progress?.attempts ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Chapter {chapterIndex + 1} · {course.short}
          </p>
          <SheetTitle className="font-serif text-2xl text-brand-navy">{chapter.title}</SheetTitle>
          <SheetDescription>{meta.summary}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div
            className={cn(
              "rounded-xl border p-4",
              completed ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50",
            )}
          >
            <div className="flex items-center gap-3">
              {completed ? (
                <CheckCircle2 className="size-8 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="size-8 shrink-0 text-slate-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-navy">
                  {completed ? "Chapter completed" : "Not completed yet"}
                </p>
                <p className="text-xs text-slate-500">
                  {attempts > 0 ? (
                    <>
                      {attempts} attempt{attempts !== 1 ? "s" : ""}
                      {bestScore > 0 && <> · Best score: {bestScore}%</>}
                    </>
                  ) : (
                    "No attempts yet — start your first mock exam"
                  )}
                </p>
              </div>
            </div>
            {attempts > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-500">Best score vs pass mark ({PASSING_SCORE}%)</span>
                  <span className="font-semibold text-brand-navy">{bestScore}%</span>
                </div>
                <Progress value={Math.min(100, bestScore)} className="h-1.5" />
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ClipboardList, label: "Questions", value: `${course.questionsPerExam} MCQ` },
              { icon: Clock, label: "Time limit", value: `${course.durationMinutes} min` },
              { icon: BookOpen, label: "Study time", value: `~${meta.studyMinutes} min` },
              { icon: Trophy, label: "Pass mark", value: `${PASSING_SCORE}%` },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-100 bg-white p-3 text-center"
              >
                <item.icon className="mx-auto size-4 text-brand-navy" />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-brand-navy">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Learning objectives */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Target className="size-4 text-brand-gold" />
              <h3 className="font-serif text-lg font-bold text-brand-navy">Learning objectives</h3>
            </div>
            <ul className="space-y-2">
              {meta.objectives.map((obj, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-gold" />
                  {obj}
                </li>
              ))}
            </ul>
          </section>

          {/* Topics */}
          <section>
            <h3 className="mb-3 font-serif text-lg font-bold text-brand-navy">Key topics</h3>
            <div className="flex flex-wrap gap-2">
              {meta.topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="bg-brand-navy/5 text-brand-navy">
                  {topic}
                </Badge>
              ))}
            </div>
          </section>

          {/* Exam tips */}
          <section className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="size-4 text-amber-600" />
              <h3 className="text-sm font-bold text-brand-navy">Before you start</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {meta.examTips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </section>

          {/* Actions */}
          <div className="flex flex-col gap-3 pb-4">
            <Button
              asChild
              className="h-12 gap-2 bg-brand-navy text-base hover:bg-brand-navy/90"
              onClick={() => onOpenChange(false)}
            >
              <Link
                to="/exams/$courseId/$chapterId"
                params={{ courseId: course.id, chapterId: chapter.id }}
              >
                <Play className="size-4" />
                {completed ? "Retake mock exam" : "Start mock exam"}
              </Link>
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
