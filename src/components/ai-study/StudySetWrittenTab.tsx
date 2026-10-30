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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useIntegrations } from "@/hooks/use-integrations";
import { evaluateWrittenAnswerFn, generateMoreWrittenTestsFn } from "@/lib/api/ai-study.functions";
import {
  recordWrittenTestEvaluation,
  updateStudySet,
  type StudySet,
  type StudySetWrittenQuestion,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";

interface StudySetWrittenTabProps {
  studySet: StudySet;
  onStudySetUpdated?: () => void;
}

export function StudySetWrittenTab({ studySet, onStudySetUpdated }: StudySetWrittenTabProps) {
  const { config } = useIntegrations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const questions = studySet.writtenTests;
  const currentQ = questions[currentIndex] || questions[0];
  const total = questions.length;

  const handleGenerateAiWrittenTests = async () => {
    setIsAiGenerating(true);
    try {
      const provider = config.aiStudy?.provider || "gemini";
      const settings = config.aiStudy?.providers?.[provider];
      const apiKey = settings?.apiKey || config.aiStudy?.apiKey;
      const baseUrl = settings?.baseUrl;
      const model = settings?.model;

      const res = await generateMoreWrittenTestsFn({
        data: {
          topic: studySet.title,
          count: 3,
          provider,
          apiKey,
          baseUrl,
          model,
        },
      });

      if (res?.data && res.data.length > 0) {
        const newTests: StudySetWrittenQuestion[] = res.data.map((w, i) => ({
          id: `ai-wt-${Date.now()}-${i}`,
          prompt: w.prompt,
          modelAnswer: w.modelAnswer,
          keyRubricPoints: w.keyRubricPoints,
          topic: w.topic || studySet.title,
        }));

        updateStudySet(studySet.id, {
          writtenTests: [...studySet.writtenTests, ...newTests],
        });
        onStudySetUpdated?.();
        toast.success(`Generated ${newTests.length} university written tests with Google Gemini!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate written tests. Please check your Gemini API key.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  if (total === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <Pencil className="mx-auto size-12 text-slate-300 dark:text-slate-600 mb-1" />
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-white">
            No Written Exercises Available
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Generate university-level free-response prompts with model answers and grading rubrics using Gemini.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleGenerateAiWrittenTests}
          disabled={isAiGenerating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          {isAiGenerating ? (
            <>
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              Generating Prompts with Gemini...
            </>
          ) : (
            <>
              <Sparkles className="size-3.5 mr-1.5 text-amber-300" />
              Generate Written Prompts (AI)
            </>
          )}
        </Button>
      </div>
    );
  }

  // Load existing answer if student already submitted
  useEffect(() => {
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
      const provider = config.aiStudy?.provider || "gemini";
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
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-200">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Prompt {currentIndex + 1} of {total}
          </span>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
            {currentQ.topic}
          </span>
          {evalResult && (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-bold border",
                evalResult.scorePct >= 80
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                  : evalResult.scorePct >= 50
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
              )}
            >
              Score: {evalResult.scorePct}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleGenerateAiWrittenTests}
            disabled={isAiGenerating}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-white text-xs h-8 shadow-xs cursor-pointer hover:from-emerald-700 hover:to-teal-700"
          >
            {isAiGenerating ? (
              <>
                <Loader2 className="size-3.5 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 mr-1 text-amber-300" />
                AI Prompts
              </>
            )}
          </Button>

          {currentQ.history && currentQ.history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer ml-1"
            >
              <History className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>History ({currentQ.history.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Question & Prompt Card ── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Free Response Problem Set #{currentIndex + 1}
          </span>
          <h3 className="mt-1 font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed tracking-tight">
            {currentQ.prompt}
          </h3>
        </div>

        {/* Rubric Criteria checklist hint */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-950/60 dark:bg-emerald-950/20 space-y-2">
          <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <Lightbulb className="size-3.5 text-amber-500 shrink-0" />
            Professor Rubric Evaluation Criteria:
          </p>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pl-5 list-disc">
            {currentQ.keyRubricPoints.map((point, idx) => (
              <li key={idx} className="leading-relaxed">{point}</li>
            ))}
          </ul>
        </div>

        {/* Student Answer Composer */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Your Written Response:</span>
            <span className="text-[11px] font-normal text-slate-400">
              {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </label>
          <Textarea
            rows={7}
            placeholder="Write your explanation or mathematical derivation in full sentences. State fundamental governing axioms, formulas, and critical boundary conditions..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={isEvaluating}
            className="text-xs sm:text-sm leading-relaxed rounded-2xl border-slate-200 dark:border-slate-700 p-4 font-sans resize-y"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Graded against university exit exam benchmarks
            </span>

            <div className="flex items-center gap-2">
              {evalResult && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTryAgain}
                  className="text-xs rounded-xl h-9"
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-9 shadow-xs cursor-pointer"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Grading Response...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 mr-1.5 text-amber-300" />
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
          <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-slate-50/80 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-800/50 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl font-serif text-xl font-black text-white shadow-xs",
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
                  <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                    {evalResult.scorePct >= 80
                      ? "Exemplary Academic Answer"
                      : evalResult.scorePct >= 50
                        ? "Proficient with Minor Omissions"
                        : "Needs Conceptual Revision"}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Evaluated against collegiate exit exam rubrics · <span className="font-semibold text-amber-600 dark:text-amber-400">AI grading is an automated formative estimate, not an official university grade.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* AI Pedagogical Feedback */}
            <div className="rounded-2xl bg-white p-4 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 leading-relaxed shadow-2xs">
              <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                👨‍🏫 Professor Commentary & Feedback:
              </p>
              {evalResult.aiFeedback}
            </div>

            {/* 2 Pillars: Correct & Missing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Correct concepts */}
              {evalResult.whatWasCorrect.length > 0 && (
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20 space-y-2">
                  <p className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Concepts Mastered:
                  </p>
                  <ul className="space-y-1 text-xs text-emerald-950 dark:text-emerald-200">
                    {evalResult.whatWasCorrect.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing concepts */}
              {evalResult.whatWasMissing.length > 0 && (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-950 dark:bg-amber-950/20 space-y-2">
                  <p className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="size-4 text-amber-600" />
                    Omissions & Improvements:
                  </p>
                  <ul className="space-y-1 text-xs text-amber-950 dark:text-amber-200">
                    {evalResult.whatWasMissing.map((m, i) => (
                      <li key={i}>• {m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Model Answer Drawer */}
            <div className="rounded-2xl border border-blue-200/70 bg-blue-50/30 p-4.5 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-2">
              <p className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                <Trophy className="size-4 text-blue-600" />
                University Benchmark Model Answer:
              </p>
              <div className="whitespace-pre-line text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans pt-1 border-t border-blue-100 dark:border-blue-900/40">
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
            className="text-xs rounded-xl"
          >
            <ArrowLeft className="size-3.5 mr-1" />
            Previous Prompt
          </Button>

          {currentIndex < total - 1 && (
            <Button
              type="button"
              size="sm"
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
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
