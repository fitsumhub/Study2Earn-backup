import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSearch,
  FileText,
  Lightbulb,
  Loader2,
  PencilLine,
  Repeat,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Upload,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { QuestionCard } from "./QuestionCard";
import { SourceBadge } from "./SourceBadge";
import { subjectLabel, subjectTheme } from "./subject";
import { downloadStudyPack } from "./study-pack";
import type { AIResult } from "./types";

export function ResultsStep({
  result,
  retaking,
  onReset,
  onRetake,
  onChangeSubject,
  onComplete,
}: {
  result: AIResult;
  retaking: boolean;
  onReset: () => void;
  onRetake: () => void;
  onChangeSubject: (subject: string) => void;
  onComplete: (answeredCount: number, correctCount: number, scorePct: number) => void;
}) {
  const theme = subjectTheme[result.subject] ?? subjectTheme.general;
  const notesRef = useRef<HTMLDivElement>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  // Bumped on every retake/subject-change so QuestionCard remounts fresh
  // instead of keeping stale selected/revealed state from the prior set.
  const [attempt, setAttempt] = useState(0);
  const reportedRef = useRef(false);

  // result.questions gets a new array identity on retake/subject-change —
  // treat that as "a new pack" and reset the in-progress score.
  useEffect(() => {
    setAnsweredCount(0);
    setCorrectCount(0);
    reportedRef.current = false;
    setAttempt((n) => n + 1);
  }, [result.questions]);

  const handleReveal = (isCorrect: boolean) => {
    setAnsweredCount((n) => n + 1);
    if (isCorrect) setCorrectCount((n) => n + 1);
  };

  const total = result.questions.length;
  const scorePct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  useEffect(() => {
    if (total > 0 && answeredCount === total && !reportedRef.current) {
      reportedRef.current = true;
      onComplete(answeredCount, correctCount, scorePct);
    }
  }, [answeredCount, total, correctCount, scorePct, onComplete]);

  return (
    <div className="animate-in fade-in-0 duration-500">
      {/* ── Subject gradient banner ── */}
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-br px-6 py-10 text-white",
          theme.banner,
        )}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 size-40 rounded-full bg-black/10 blur-2xl" />

        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Select value={result.subject} onValueChange={onChangeSubject}>
                  <SelectTrigger
                    aria-label="Correct the detected subject"
                    className={cn(
                      "h-auto w-auto gap-1.5 rounded-full border-0 px-3 py-1 text-xs font-bold shadow-none focus:ring-0",
                      theme.badge,
                    )}
                  >
                    <SelectValue>{subjectLabel(result.subject)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(subjectTheme).map((key) => (
                      <SelectItem key={key} value={key}>
                        {subjectLabel(key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  <FileText className="size-3" />
                  {result.filename}
                </span>
                <span
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                  title={
                    result.detectionSource === "content"
                      ? "We read the text inside your file to pick this subject"
                      : result.detectionSource === "manual"
                        ? "You corrected the detected subject"
                        : result.detectionSource === "library"
                          ? "Matched from the library book you were reading"
                          : "We couldn't pull enough readable text from this file, so we guessed the subject from the filename instead"
                  }
                >
                  {result.detectionSource === "content" ? (
                    <>
                      <FileSearch className="size-3" />
                      Subject detected from file content
                    </>
                  ) : result.detectionSource === "manual" ? (
                    <>
                      <PencilLine className="size-3" />
                      Subject set by you
                    </>
                  ) : result.detectionSource === "library" ? (
                    <>
                      <BookMarked className="size-3" />
                      Matched from your library book
                    </>
                  ) : (
                    <>
                      <FileSearch className="size-3 opacity-60" />
                      Subject guessed from filename
                    </>
                  )}
                </span>
                <SourceBadge source={result.source} />
              </div>
              <h1 className="font-serif text-3xl font-bold md:text-4xl">Your Study Pack</h1>
              <p className="mt-1 text-sm text-white/70">
                {result.source === "ai"
                  ? "AI-generated from your uploaded material · wrong subject? use the dropdown above"
                  : "Demo questions — not generated from your file · wrong subject? use the dropdown above"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRetake}
                disabled={retaking}
                title={
                  result.source === "ai"
                    ? "Ask the AI provider for a fresh set of questions from the same file"
                    : "Shuffle a fresh set of demo questions for the same subject"
                }
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-70"
              >
                {retaking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Repeat className="size-4" />
                )}
                Retake
              </button>
              <button
                type="button"
                onClick={() => downloadStudyPack(result)}
                title="Download this study pack as a text file"
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/20"
              >
                <Download className="size-4" />
                Download
              </button>
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/20"
              >
                <RotateCcw className="size-4" />
                New file
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: ClipboardList, value: `${total}`, label: "Questions" },
              { icon: Target, value: `${result.notes.keyConcepts.length}`, label: "Key concepts" },
              { icon: BookOpen, value: `${result.notes.definitions.length}`, label: "Definitions" },
              { icon: Lightbulb, value: "1", label: "Summary" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm"
              >
                <s.icon className="size-4 text-white/60" />
                <span className="font-bold text-white">{s.value}</span>
                <span className="text-white/60">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {/* ── Live score tracker ── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                <Trophy className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live score
                </p>
                <p className="font-serif text-xl font-bold text-brand-navy">
                  {answeredCount === 0
                    ? "Answer questions below to track your score"
                    : `${correctCount} / ${answeredCount} correct (${scorePct}%)`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                <CheckCircle2 className="size-4" /> {correctCount} correct
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-red-500">
                <XCircle className="size-4" /> {answeredCount - correctCount} wrong
              </span>
              <span className="text-slate-400">{total - answeredCount} remaining</span>
            </div>
          </div>
          {answeredCount > 0 && (
            <div className="mt-3">
              <Progress
                value={scorePct}
                className={cn(
                  "h-2 [&>div]:transition-all [&>div]:duration-500",
                  scorePct >= 80
                    ? "[&>div]:bg-emerald-500"
                    : scorePct >= 60
                      ? "[&>div]:bg-amber-400"
                      : "[&>div]:bg-red-400",
                )}
              />
            </div>
          )}
        </div>

        {/* ── What we actually read from the file (transparency) ── */}
        {result.excerpt && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <FileSearch className="size-4 text-brand-gold" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                What we read from your file
              </p>
            </div>
            <p className="text-sm italic leading-relaxed text-slate-600">"{result.excerpt}"</p>
          </div>
        )}

        {/* ── Session complete banner ── */}
        {answeredCount === total && total > 0 && (
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
              scorePct >= 80
                ? "border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
                : scorePct >= 60
                  ? "border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50"
                  : "border border-red-200 bg-gradient-to-br from-red-50 to-rose-50",
            )}
          >
            {/* Decorative background sparkle */}
            <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-current opacity-5 blur-3xl" />

            <div className="flex flex-wrap items-center gap-6">
              {/* Score ring */}
              <div
                className={cn(
                  "relative flex size-20 shrink-0 items-center justify-center rounded-full border-4",
                  scorePct >= 80
                    ? "border-emerald-300 bg-emerald-100"
                    : scorePct >= 60
                      ? "border-amber-300 bg-amber-100"
                      : "border-red-300 bg-red-100",
                )}
              >
                <div className="text-center">
                  <p
                    className={cn(
                      "font-serif text-2xl font-bold leading-none",
                      scorePct >= 80
                        ? "text-emerald-700"
                        : scorePct >= 60
                          ? "text-amber-700"
                          : "text-red-700",
                    )}
                  >
                    {scorePct}%
                  </p>
                </div>
                {/* Trophy overlay for high scores */}
                {scorePct >= 80 && (
                  <div className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-brand-gold shadow-md">
                    <Trophy className="size-3.5 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Sparkles
                    className={cn(
                      "size-4 shrink-0",
                      scorePct >= 80
                        ? "text-emerald-600"
                        : scorePct >= 60
                          ? "text-amber-600"
                          : "text-red-500",
                    )}
                  />
                  <p
                    className={cn(
                      "font-serif text-xl font-bold",
                      scorePct >= 80
                        ? "text-emerald-800"
                        : scorePct >= 60
                          ? "text-amber-800"
                          : "text-red-800",
                    )}
                  >
                    {scorePct >= 80
                      ? "Excellent work!"
                      : scorePct >= 60
                        ? "Good effort!"
                        : "Keep practising!"}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-sm",
                    scorePct >= 80
                      ? "text-emerald-700"
                      : scorePct >= 60
                        ? "text-amber-700"
                        : "text-red-700",
                  )}
                >
                  You answered all {total} questions — <strong>{correctCount} correct</strong>,{" "}
                  {total - correctCount} incorrect.
                  {scorePct >= 80
                    ? " Review the study notes below to reinforce your knowledge."
                    : scorePct >= 60
                      ? " Check the explanations above, then read the study notes to fill the gaps."
                      : " Read the study notes below and try uploading a new file to practise again."}
                </p>
              </div>

              {/* Grade chip */}
              <div
                className={cn(
                  "shrink-0 flex flex-col items-center gap-0.5 rounded-2xl px-5 py-3 text-center",
                  scorePct >= 80
                    ? "bg-emerald-200/60 text-emerald-800"
                    : scorePct >= 60
                      ? "bg-amber-200/60 text-amber-800"
                      : "bg-red-200/60 text-red-800",
                )}
              >
                <span className="font-serif text-3xl font-bold leading-none">
                  {scorePct >= 90
                    ? "A+"
                    : scorePct >= 80
                      ? "A"
                      : scorePct >= 70
                        ? "B"
                        : scorePct >= 60
                          ? "C"
                          : "F"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  Grade
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Practice questions ── */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className={cn("flex size-10 items-center justify-center rounded-xl", theme.badge)}>
              <ClipboardList className="size-5" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-navy">Practice Exam</h2>
              <p className="text-sm text-slate-500">
                Select your answer, then reveal the explanation
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {result.questions.map((q, i) => (
              <QuestionCard
                key={`${attempt}-${i}-${q.id}`}
                question={q}
                index={i}
                onReveal={handleReveal}
              />
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="flex items-center gap-2 bg-slate-50 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              <BookOpen className="size-3.5" />
              Study Notes
            </span>
          </div>
        </div>

        {/* ── Study notes ── */}
        <section ref={notesRef} className="scroll-mt-8 space-y-5">
          {/* Key concepts */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                <Zap className="size-4" />
              </div>
              <h3 className="font-semibold text-brand-navy">Key Concepts</h3>
              <span className="ml-auto rounded-full bg-brand-gold/10 px-2.5 py-0.5 text-xs font-bold text-brand-gold">
                {result.notes.keyConcepts.length}
              </span>
            </div>
            <ul className="divide-y divide-slate-50 px-6">
              {result.notes.keyConcepts.map((concept, i) => (
                <li key={i} className="flex items-start gap-4 py-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">{concept}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Definitions */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="size-4" />
              </div>
              <h3 className="font-semibold text-brand-navy">Key Definitions</h3>
              <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                {result.notes.definitions.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {result.notes.definitions.map((def, i) => (
                <div key={i} className="flex gap-0 sm:gap-6 flex-col sm:flex-row px-6 py-4 text-sm">
                  <span className="mb-1 sm:mb-0 w-full sm:w-40 shrink-0 rounded-lg bg-brand-navy/5 px-3 py-1.5 font-bold text-brand-navy sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0">
                    {def.term}
                  </span>
                  <span className="leading-relaxed text-slate-600">{def.definition}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter summary */}
          <div className="overflow-hidden rounded-2xl border border-brand-gold/25 bg-gradient-to-br from-brand-gold/8 to-amber-50/50 shadow-sm">
            <div className="flex items-center gap-3 border-b border-brand-gold/15 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-gold/20 text-brand-gold">
                <Lightbulb className="size-4" />
              </div>
              <h3 className="font-semibold text-brand-navy">Chapter Summary</h3>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-brand-gold/70">
                ~1 min read
              </span>
            </div>
            <p className="px-6 py-5 text-sm leading-7 text-slate-700">{result.notes.summary}</p>
          </div>

          {/* Study tips */}
          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-teal-50/30 shadow-sm">
            <div className="flex items-center gap-3 border-b border-emerald-100/80 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Target className="size-4" />
              </div>
              <h3 className="font-semibold text-brand-navy">Exam Tips</h3>
            </div>
            <ul className="space-y-0 divide-y divide-emerald-100/60 px-6">
              {result.notes.studyTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-4 py-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Upload another ── */}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-navy/5 text-brand-navy">
            <Upload className="size-7" />
          </div>
          <p className="font-serif text-xl font-bold text-brand-navy">Ready for another subject?</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload a new file to generate a fresh study pack
          </p>
          <Button
            onClick={onReset}
            className="mt-5 gap-2 bg-brand-navy px-8 hover:bg-brand-navy/90"
          >
            <Upload className="size-4" />
            Upload new file
          </Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
