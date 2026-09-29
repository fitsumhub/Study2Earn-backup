import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  History,
  Lightbulb,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useIntegrations } from "@/hooks/use-integrations";
import { evaluateWrittenAnswerFn } from "@/lib/api/ai-study.functions";
import {
  recordWrittenTestEvaluation,
  type StudySet,
  type StudySetWrittenQuestion,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";

interface StudySetWrittenTabProps {
  studySet: StudySet;
}

export function StudySetWrittenTab({ studySet }: StudySetWrittenTabProps) {
  const { config } = useIntegrations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const questions = studySet.writtenTests;
  const currentQ = questions[currentIndex] || questions[0];
  const total = questions.length;

  if (total === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <Pencil className="mx-auto size-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-white">
          No Written Exercises Available
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          This study set does not have free-response prompts generated yet.
        </p>
      </div>
    );
  }

  // Load existing answer if student already submitted
  React.useEffect(() => {
    if (currentQ?.userAnswer) {
      setUserAnswer(currentQ.userAnswer);
    } else {
      setUserAnswer("");
    }
    setEvalError(null);
  }, [currentIndex, currentQ]);

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) return;
    setIsEvaluating(true);
    setEvalError(null);

    try {
      const provider = config.aiStudy?.provider || "openai";
      const settings = config.aiStudy?.providers?.[provider];
      const apiKey = settings?.apiKey || config.aiStudy?.apiKey;
      const baseUrl = settings?.baseUrl;
      const model = settings?.model;

      const res = await evaluateWrittenAnswerFn({
        data: {
          prompt: currentQ.prompt,
          modelAnswer: currentQ.modelAnswer,
          keyRubricPoints: currentQ.keyRubricPoints,
          userAnswer: userAnswer.trim(),
          provider,
          apiKey,
          baseUrl,
          model,
        },
      });

      // Save to store
      recordWrittenTestEvaluation(studySet.id, currentQ.id, userAnswer.trim(), {
        scorePct: res.scorePct,
        whatWasCorrect: res.whatWasCorrect,
        whatWasMissing: res.whatWasMissing,
        whatWasIncorrect: res.whatWasIncorrect,
        aiFeedback: res.aiFeedback,
        evaluatedAt: new Date().toISOString(),
      });

      setIsEvaluating(false);
    } catch (err) {
      console.error("Evaluation error:", err);
      setEvalError(err instanceof Error ? err.message : "Failed to grade written response.");
      setIsEvaluating(false);
    }
  };

  const handleTryAgain = () => {
    setUserAnswer("");
  };

  const evalResult = currentQ.evaluation;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Prompt {currentIndex + 1} of {total}
          </span>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {currentQ.topic}
          </span>
          {evalResult && (
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Score: {evalResult.scorePct}%
            </span>
          )}
        </div>

        {currentQ.history && currentQ.history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            <History className="size-3.5" />
            <span>History ({currentQ.history.length})</span>
          </button>
        )}
      </div>

      {/* ── Question & Prompt Card ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Free Response Exercise
          </span>
          <h3 className="mt-1 font-serif text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.prompt}
          </h3>
        </div>

        {/* Rubric Criteria checklist hint */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Lightbulb className="size-3.5 text-amber-500" />
            Grading Rubric Criteria:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            {currentQ.keyRubricPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>

        {/* Student Answer Composer */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Your Written Response:
          </label>
          <Textarea
            rows={6}
            placeholder="Write your explanation or derivation in full sentences. Mention core principles, formulas, and key boundary conditions..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={isEvaluating}
            className="text-xs sm:text-sm leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
            </span>

            <div className="flex items-center gap-2">
              {evalResult && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTryAgain}
                  className="text-xs"
                >
                  <RotateCcw className="size-3 mr-1" />
                  Try Again
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                onClick={handleEvaluate}
                disabled={!userAnswer.trim() || isEvaluating}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs font-bold"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    AI Grading Response...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 mr-1.5 text-brand-gold" />
                    Submit for AI Evaluation
                  </>
                )}
              </Button>
            </div>
          </div>

          {evalError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{evalError}</span>
            </div>
          )}
        </div>

        {/* ── AI Evaluation Results Card ── */}
        {evalResult && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-800/50 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl font-serif text-lg font-black text-white",
                    evalResult.scorePct >= 80
                      ? "bg-emerald-600"
                      : evalResult.scorePct >= 50
                        ? "bg-amber-600"
                        : "bg-rose-600",
                  )}
                >
                  {evalResult.scorePct}%
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-white">
                    {evalResult.scorePct >= 80
                      ? "Exemplary Academic Answer"
                      : evalResult.scorePct >= 50
                        ? "Proficient with Minor Omissions"
                        : "Needs Conceptual Revision"}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Graded against Ethiopian University Exit Exam rubrics
                  </p>
                </div>
              </div>
            </div>

            {/* AI Pedagogical Feedback */}
            <div className="rounded-xl bg-white p-3.5 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 leading-relaxed">
              <p className="font-bold text-brand-navy dark:text-brand-gold mb-1">
                👨‍🏫 Professor Feedback:
              </p>
              {evalResult.aiFeedback}
            </div>

            {/* 3 Pillars: Correct, Missing, Incorrect */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Correct concepts */}
              {evalResult.whatWasCorrect.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-950 dark:bg-emerald-950/20">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    What You Got Right:
                  </p>
                  <ul className="space-y-1 text-[11px] text-emerald-900 dark:text-emerald-200">
                    {evalResult.whatWasCorrect.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing concepts */}
              {evalResult.whatWasMissing.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-950 dark:bg-amber-950/20">
                  <p className="font-bold text-amber-800 dark:text-amber-300 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="size-3.5 text-amber-600" />
                    What Was Missing / Incomplete:
                  </p>
                  <ul className="space-y-1 text-[11px] text-amber-900 dark:text-amber-200">
                    {evalResult.whatWasMissing.map((m, i) => (
                      <li key={i}>• {m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Model Answer Drawer */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-2">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Trophy className="size-3.5 text-blue-600" />
                Benchmark Model Answer:
              </p>
              <div className="whitespace-pre-line text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {currentQ.modelAnswer}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
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
            Previous Prompt
          </Button>

          {currentIndex < total - 1 && (
            <Button
              type="button"
              size="sm"
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs font-bold"
            >
              Next Prompt
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

