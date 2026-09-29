import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  recordQuizAttempt,
  type StudySet,
  type StudySetQuizQuestion,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";

interface StudySetQuizTabProps {
  studySet: StudySet;
  initialFocusWeak?: boolean;
  onNavigateTab: (tab: string) => void;
}

export function StudySetQuizTab({
  studySet,
  initialFocusWeak = false,
  onNavigateTab,
}: StudySetQuizTabProps) {
  const [filterDifficulty, setFilterDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [focusWeakOnly, setFocusWeakOnly] = useState(initialFocusWeak);

  // Filtered pool
  const questions = React.useMemo(() => {
    let pool = studySet.quizzes;
    if (focusWeakOnly && studySet.weakTopics.length > 0) {
      const weakPool = pool.filter((q) => studySet.weakTopics.includes(q.topic));
      if (weakPool.length > 0) pool = weakPool;
    }
    if (filterDifficulty !== "all") {
      const diffPool = pool.filter((q) => q.difficulty === filterDifficulty);
      if (diffPool.length > 0) pool = diffPool;
    }
    return pool;
  }, [studySet.quizzes, studySet.weakTopics, focusWeakOnly, filterDifficulty]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [explainDifferently, setExplainDifferently] = useState<Record<number, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);

  // Optional Timer
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!timerEnabled || isFinished) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerEnabled, isFinished]);

  const currentQ = questions[currentIndex] || questions[0];
  const total = questions.length;

  if (total === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <HelpCircle className="mx-auto size-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-white">
          No Quiz Questions Found
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Try resetting the filters or add questions to this Study Set.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setFilterDifficulty("all");
            setFocusWeakOnly(false);
          }}
          className="mt-4"
        >
          Reset Filters
        </Button>
      </div>
    );
  }

  const handleSelectOption = (optIdx: number) => {
    if (selectedAnswers[currentIndex] !== undefined) return; // already answered
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optIdx }));
    setShowExplanation((prev) => ({ ...prev, [currentIndex]: true }));
  };

  const handleFinish = () => {
    setIsFinished(true);

    // Calculate score
    let correct = 0;
    const missedTopics: string[] = [];

    questions.forEach((q, idx) => {
      const ans = selectedAnswers[idx];
      if (ans === q.correctIndex) {
        correct++;
      } else {
        if (q.topic) missedTopics.push(q.topic);
      }
    });

    const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;
    recordQuizAttempt(studySet.id, {
      scorePct,
      weakTopics: Array.from(new Set(missedTopics)),
    });
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setShowExplanation({});
    setExplainDifferently({});
    setCurrentIndex(0);
    setIsFinished(false);
    setTimeLeft(total * 45);
  };

  // Score stats
  let correctCount = 0;
  Object.entries(selectedAnswers).forEach(([idxStr, ans]) => {
    const qIdx = Number(idxStr);
    if (questions[qIdx] && ans === questions[qIdx].correctIndex) {
      correctCount++;
    }
  });

  /* ── Results Screen ── */
  if (isFinished) {
    const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = scorePct >= 70;

    return (
      <div className="mx-auto max-w-2xl space-y-6 py-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div
            className={cn(
              "mx-auto flex size-20 items-center justify-center rounded-3xl mb-4",
              passed
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
            )}
          >
            {passed ? <Trophy className="size-10" /> : <RefreshCw className="size-10" />}
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {studySet.courseCode} Exit Exam Practice
          </span>

          <h2 className="mt-3 font-serif text-3xl font-extrabold text-slate-900 dark:text-white">
            {passed ? "Excellent Performance!" : "Good Practice Attempt!"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {passed
              ? "You scored high enough to meet the Ethiopian University Exit Exam benchmark."
              : "Review the missed questions below to solidify your understanding."}
          </p>

          <div className="my-6 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Score
              </p>
              <p className="font-serif text-2xl font-black text-slate-900 dark:text-white">
                {scorePct}%
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Correct
              </p>
              <p className="font-serif text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {correctCount} / {total}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mastery
              </p>
              <p className="font-serif text-2xl font-black text-blue-600 dark:text-blue-400">
                {passed ? "High" : "Developing"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              onClick={handleRestart}
              variant="outline"
              className="font-bold text-xs"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Retake Quiz
            </Button>
            <Button
              type="button"
              onClick={() => onNavigateTab("flashcards")}
              className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs"
            >
              <Brain className="size-3.5 mr-1.5" />
              Practice Flashcards
            </Button>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-3">
          <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
            Question Review Breakdown
          </h3>

          {questions.map((q, idx) => {
            const userAns = selectedAnswers[idx];
            const isCorrect = userAns === q.correctIndex;
            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-2xl border p-4 text-xs transition",
                  isCorrect
                    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-950 dark:bg-emerald-950/20"
                    : "border-rose-200 bg-rose-50/40 dark:border-rose-950 dark:bg-rose-950/20",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {q.question}
                      </p>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">
                        <strong>Correct Answer:</strong> {q.options[q.correctIndex]}
                      </p>
                      {!isCorrect && userAns !== undefined && (
                        <p className="mt-0.5 text-rose-600 dark:text-rose-400">
                          <strong>Your Answer:</strong> {q.options[userAns]}
                        </p>
                      )}
                      <p className="mt-2 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed border-t border-slate-200/50 pt-2 dark:border-slate-800">
                        💡 {q.explanation}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {q.topic}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const answeredThis = selectedAnswers[currentIndex] !== undefined;
  const isCorrectChoice = answeredThis && selectedAnswers[currentIndex] === currentQ.correctIndex;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ── Quiz Controls Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Question {currentIndex + 1} of {total}
          </span>
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {currentQ.topic}
          </span>
          {currentQ.difficulty && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase">
              {currentQ.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Optional Timer toggle */}
          <button
            type="button"
            onClick={() => setTimerEnabled((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer",
              timerEnabled
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
            title="Toggle countdown timer"
          >
            <Clock className="size-3.5" />
            <span>{timerEnabled ? `${timeLeft}s` : "Timer Off"}</span>
          </button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleFinish}
            className="text-xs font-semibold"
          >
            Submit Quiz
          </Button>
        </div>
      </div>

      {/* ── Question Navigator Bar ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1">
        {questions.map((_, idx) => {
          const isAns = selectedAnswers[idx] !== undefined;
          const isCurr = currentIndex === idx;
          const isRight = isAns && selectedAnswers[idx] === questions[idx].correctIndex;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition cursor-pointer",
                isCurr && "ring-2 ring-blue-500 scale-105",
                isAns
                  ? isRight
                    ? "bg-emerald-500 text-white"
                    : "bg-rose-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* ── Active Question Card ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.question}
          </h3>
        </div>

        {/* 4 Multiple Choice Options */}
        <div className="space-y-3">
          {currentQ.options.map((option, optIdx) => {
            const isSelected = selectedAnswers[currentIndex] === optIdx;
            const isCorrect = optIdx === currentQ.correctIndex;
            const isRevealed = answeredThis;

            let optionStyle =
              "border-slate-200 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/30 text-slate-800 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200";

            if (isRevealed) {
              if (isCorrect) {
                optionStyle =
                  "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500/80 dark:bg-emerald-950/40 dark:text-emerald-200 font-bold";
              } else if (isSelected) {
                optionStyle =
                  "border-rose-500 bg-rose-50 text-rose-900 dark:border-rose-500/80 dark:bg-rose-950/40 dark:text-rose-200";
              } else {
                optionStyle = "opacity-50 border-slate-200 dark:border-slate-800";
              }
            }

            const letters = ["A", "B", "C", "D"];

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                disabled={answeredThis}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border p-4 text-left text-xs sm:text-sm transition cursor-pointer",
                  optionStyle,
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      isRevealed && isCorrect
                        ? "bg-emerald-600 text-white"
                        : isRevealed && isSelected
                          ? "bg-rose-600 text-white"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
                    )}
                  >
                    {letters[optIdx]}
                  </span>
                  <span>{option}</span>
                </div>

                {isRevealed && (
                  <div className="shrink-0 ml-2">
                    {isCorrect && <CheckCircle2 className="size-5 text-emerald-600" />}
                    {!isCorrect && isSelected && <XCircle className="size-5 text-rose-600" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Explanation Drawer (Appears upon answer) ── */}
        {answeredThis && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isCorrectChoice ? "Correct! Concept Explanation:" : "Incorrect. Here is why:"}
                </span>
              </div>
              {currentQ.sourceReference && (
                <span className="text-[10px] font-semibold text-slate-400">
                  Ref: {currentQ.sourceReference}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentQ.explanation}
            </p>

            {/* "Explain Differently" Socratic re-explanation */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() =>
                  setExplainDifferently((prev) => ({
                    ...prev,
                    [currentIndex]: !prev[currentIndex],
                  }))
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Explain this differently (Intuitive breakdown)</span>
              </button>

              {explainDifferently[currentIndex] && (
                <div className="mt-2 rounded-xl bg-white p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 leading-relaxed border border-blue-100 dark:border-blue-900/40">
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    💡 Key Intuition for {studySet.subject}:
                  </p>
                  Think of it from first principles: rather than memorizing the option, remember that in Ethiopian University exams, instructors test whether you can recognize the governing constraint. In this case, <strong>{currentQ.options[currentQ.correctIndex]}</strong> is the only choice that satisfies all boundary conditions simultaneously!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Next / Prev */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="text-xs"
          >
            <ArrowLeft className="size-3.5 mr-1" />
            Previous
          </Button>

          {currentIndex < total - 1 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs font-bold"
            >
              Next Question
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleFinish}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              Complete Quiz
              <CheckCircle2 className="size-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

