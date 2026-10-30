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
  Loader2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useIntegrations } from "@/hooks/use-integrations";
import { generateMoreQuizQuestionsFn } from "@/lib/api/ai-study.functions";
import {
  recordQuizAttempt,
  updateStudySet,
  type StudySet,
  type StudySetQuizQuestion,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";

interface StudySetQuizTabProps {
  studySet: StudySet;
  initialFocusWeak?: boolean;
  onNavigateTab: (tab: string) => void;
  onStudySetUpdated?: () => void;
}

export function StudySetQuizTab({
  studySet,
  initialFocusWeak = false,
  onNavigateTab,
  onStudySetUpdated,
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

  const { config: integrations } = useIntegrations();
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleGenerateAiQuestions = async () => {
    setIsAiGenerating(true);
    try {
      const activeProvider = integrations.aiStudy.provider || "gemini";
      const settings = integrations.aiStudy.providers?.[activeProvider];
      const apiKey = settings?.apiKey?.trim() || integrations.aiStudy.apiKey?.trim();

      const res = await generateMoreQuizQuestionsFn({
        data: {
          topic: studySet.title,
          count: 5,
          difficulty: filterDifficulty === "all" ? "medium" : filterDifficulty,
          provider: activeProvider,
          apiKey: apiKey || undefined,
          baseUrl: settings?.baseUrl || undefined,
          model: settings?.model || undefined,
        },
      });

      if (res?.data && res.data.length > 0) {
        const newQuestions: StudySetQuizQuestion[] = res.data.map((q, i) => ({
          id: `ai-qz-${Date.now()}-${i}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          topic: q.topic || studySet.title,
          difficulty: q.difficulty || "medium",
        }));

        updateStudySet(studySet.id, {
          quizzes: [...studySet.quizzes, ...newQuestions],
        });
        onStudySetUpdated?.();
        toast.success(`Generated ${newQuestions.length} exit-exam questions with Google Gemini!`);
      }
    } catch (err) {
      console.error("AI quiz generation error:", err);
      toast.error("Failed to generate AI quiz questions. Please check your Gemini API key.");
    } finally {
      setIsAiGenerating(false);
    }
  };

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
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div
            className={cn(
              "mx-auto flex size-20 items-center justify-center rounded-3xl mb-4 shadow-xs",
              passed
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                : "bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60",
            )}
          >
            {passed ? <Trophy className="size-10" /> : <RefreshCw className="size-10" />}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {studySet.courseCode || studySet.subject} • Exit Exam Simulation
          </span>

          <h2 className="mt-3 font-serif text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {passed ? "Benchmark Achieved!" : "Diagnostic Complete"}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {passed
              ? "Your score satisfies the 70% university exit exam proficiency benchmark. Conceptual axioms verified."
              : "Review the question breakdowns below to target remaining misconceptions before exam day."}
          </p>

          <div className="my-6 grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Final Score
              </p>
              <p className="font-serif text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                {scorePct}%
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Correct Answers
              </p>
              <p className="font-serif text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {correctCount} / {total}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Proficiency
              </p>
              <p className="font-serif text-3xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                {passed ? "Advanced" : "Developing"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              onClick={handleRestart}
              variant="outline"
              className="font-bold text-xs rounded-xl h-9"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Retake Exam
            </Button>
            <Button
              type="button"
              onClick={() => onNavigateTab("flashcards")}
              className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs rounded-xl h-9 shadow-xs"
            >
              <Brain className="size-3.5 mr-1.5" />
              Drill Flashcards
            </Button>
            <Button
              type="button"
              onClick={() => onNavigateTab("tutor")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl h-9 shadow-xs"
            >
              <Sparkles className="size-3.5 mr-1.5 text-amber-300" />
              Ask AI Tutor About Weak Areas
            </Button>
          </div>

          {/* Identified Knowledge Gaps Banner */}
          {studySet.weakTopics && studySet.weakTopics.length > 0 && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-left dark:border-rose-900/40 dark:bg-rose-950/20">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                <AlertCircle className="size-4" />
                Identified Knowledge Gaps for Remediation:
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {studySet.weakTopics.map((wt, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200 dark:bg-slate-900 dark:text-rose-300 dark:border-rose-900/60 shadow-2xs"
                  >
                    {wt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-3">
          <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
            Question Review & Rationales
          </h3>

          {questions.map((q, idx) => {
            const userAns = selectedAnswers[idx];
            const isCorrect = userAns === q.correctIndex;
            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-2xl border p-4.5 text-xs transition shadow-2xs",
                  isCorrect
                    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-950/60 dark:bg-emerald-950/20"
                    : "border-rose-200 bg-rose-50/40 dark:border-rose-950/60 dark:bg-rose-950/20",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {isCorrect ? (
                      <CheckCircle2 className="size-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="size-4.5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-serif font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {idx + 1}. {q.question}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong className="text-emerald-700 dark:text-emerald-300">Correct Answer:</strong> {q.options[q.correctIndex]}
                      </p>
                      {!isCorrect && userAns !== undefined && (
                        <p className="text-rose-700 dark:text-rose-300">
                          <strong>Your Answer:</strong> {q.options[userAns]}
                        </p>
                      )}
                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed border-t border-slate-200/50 pt-2 dark:border-slate-800">
                        💡 {q.explanation}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700">
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
      {/* ── Quiz Proctor Header Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Question {currentIndex + 1} of {total}
          </span>
          <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">
            {currentQ.topic}
          </span>
          {currentQ.difficulty && (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                currentQ.difficulty === "easy"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900"
                  : currentQ.difficulty === "hard"
                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
              )}
            >
              {currentQ.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mistake notebook toggle */}
          {studySet.weakTopics && studySet.weakTopics.length > 0 && (
            <button
              type="button"
              onClick={() => setFocusWeakOnly(!focusWeakOnly)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer border",
                focusWeakOnly
                  ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 shadow-2xs"
                  : "text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-200",
              )}
            >
              <AlertCircle className="size-3.5 text-rose-500" />
              Mistake Notebook ({studySet.weakTopics.length})
            </button>
          )}

          {/* AI Question Generation button */}
          <Button
            type="button"
            size="sm"
            onClick={handleGenerateAiQuestions}
            disabled={isAiGenerating}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white text-xs h-8 shadow-xs cursor-pointer hover:from-purple-700 hover:to-indigo-700"
          >
            {isAiGenerating ? (
              <>
                <Loader2 className="size-3.5 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 mr-1 text-amber-300" />
                AI Questions
              </>
            )}
          </Button>

          {/* Optional Timer toggle */}
          <button
            type="button"
            onClick={() => setTimerEnabled((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer border",
              timerEnabled
                ? timeLeft <= 15
                  ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse"
                  : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                : "text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-200",
            )}
            title="Toggle exam timer"
          >
            <Clock className="size-3.5" />
            <span>{timerEnabled ? `${timeLeft}s` : "Timer Off"}</span>
          </button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleFinish}
            className="text-xs font-bold rounded-xl h-8 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Submit Exam
          </Button>
        </div>
      </div>

      {/* ── Question Navigator Ribbon ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1">
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
                "flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition cursor-pointer select-none",
                isCurr && "ring-2 ring-purple-600 scale-105 shadow-xs font-black",
                isAns
                  ? isRight
                    ? "bg-emerald-500 text-white shadow-2xs"
                    : "bg-rose-500 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* ── Active Question Card ── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Exit Exam Item #{currentIndex + 1}
          </span>
          <h3 className="mt-1 font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed tracking-tight">
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
              "border-slate-200 bg-slate-50/70 hover:border-purple-400 hover:bg-purple-50/30 text-slate-800 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200";

            if (isRevealed) {
              if (isCorrect) {
                optionStyle =
                  "border-emerald-500 bg-emerald-50/80 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200 font-bold shadow-xs";
              } else if (isSelected) {
                optionStyle =
                  "border-rose-500 bg-rose-50/80 text-rose-950 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-200";
              } else {
                optionStyle = "opacity-45 border-slate-200 dark:border-slate-800";
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
                  "flex w-full items-center justify-between rounded-2xl border p-4 text-left text-xs sm:text-sm transition-all duration-150 cursor-pointer",
                  optionStyle,
                )}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={cn(
                      "flex size-7.5 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors",
                      isRevealed && isCorrect
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : isRevealed && isSelected
                          ? "bg-rose-600 text-white shadow-2xs"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
                    )}
                  >
                    {letters[optIdx]}
                  </span>
                  <span className="font-medium leading-relaxed">{option}</span>
                </div>

                {isRevealed && (
                  <div className="shrink-0 ml-2">
                    {isCorrect && <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
                    {!isCorrect && isSelected && <XCircle className="size-5 text-rose-600 dark:text-rose-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Socratic Explanation Drawer (Appears upon answer) ── */}
        {answeredThis && (
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-800/60 space-y-3.5 animate-in fade-in duration-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4.5 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isCorrectChoice ? "Correct! Concept Explanation:" : "Incorrect. Here is why:"}
                </span>
              </div>
              {currentQ.sourceReference && (
                <span className="text-[10px] font-semibold text-slate-400">
                  Source: {currentQ.sourceReference}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {currentQ.explanation}
            </p>

            {/* "Explain Differently" Socratic re-explanation */}
            <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700">
              <button
                type="button"
                onClick={() =>
                  setExplainDifferently((prev) => ({
                    ...prev,
                    [currentIndex]: !prev[currentIndex],
                  }))
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:underline dark:text-purple-400 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Explain this differently (Intuitive First-Principles Breakdown)</span>
              </button>

              {explainDifferently[currentIndex] && (
                <div className="mt-2.5 rounded-xl bg-white p-4 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 leading-relaxed border border-purple-200/80 dark:border-purple-900/60 shadow-2xs">
                  <p className="font-bold text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-1.5">
                    💡 Pedagogical Intuition:
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
            className="text-xs rounded-xl"
          >
            <ArrowLeft className="size-3.5 mr-1.5" />
            Previous
          </Button>

          {currentIndex < total - 1 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs font-bold rounded-xl"
            >
              Next Question
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleFinish}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Complete Exam
              <CheckCircle2 className="size-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

