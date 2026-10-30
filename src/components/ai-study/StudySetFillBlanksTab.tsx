import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  SpellCheck,
  X,
  XCircle,
  Loader2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIntegrations } from "@/hooks/use-integrations";
import { generateMoreFillBlanksFn } from "@/lib/api/ai-study.functions";
import {
  recordFillBlankAttempt,
  updateStudySet,
  type StudySet,
  type StudySetFillBlank,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";

interface StudySetFillBlanksTabProps {
  studySet: StudySet;
  onStudySetUpdated?: () => void;
}

export function StudySetFillBlanksTab({ studySet, onStudySetUpdated }: StudySetFillBlanksTabProps) {
  const { config: integrations } = useIntegrations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const blanks = studySet.fillBlanks;
  const currentB = blanks[currentIndex] || blanks[0];
  const total = blanks.length;

  const handleGenerateAiFillBlanks = async () => {
    setIsAiGenerating(true);
    try {
      const activeProvider = integrations.aiStudy.provider || "gemini";
      const settings = integrations.aiStudy.providers?.[activeProvider];
      const apiKey = settings?.apiKey?.trim() || integrations.aiStudy.apiKey?.trim();

      const res = await generateMoreFillBlanksFn({
        data: {
          topic: studySet.title,
          count: 5,
          provider: activeProvider,
          apiKey: apiKey || undefined,
          baseUrl: settings?.baseUrl || undefined,
          model: settings?.model || undefined,
        },
      });

      if (res?.data && res.data.length > 0) {
        const newBlanks: StudySetFillBlank[] = res.data.map((b, i) => ({
          id: `ai-fb-${Date.now()}-${i}`,
          sentenceWithBlank: b.sentenceWithBlank,
          blankAnswer: b.blankAnswer,
          acceptedAlternatives: b.acceptedAlternatives,
          hint: b.hint,
          explanation: b.explanation,
          topic: b.topic || studySet.title,
        }));

        updateStudySet(studySet.id, {
          fillBlanks: [...studySet.fillBlanks, ...newBlanks],
        });
        onStudySetUpdated?.();
        toast.success(`Generated ${newBlanks.length} fill-in-the-blank exercises with Google Gemini!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate fill blanks. Please check your Gemini API key.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  if (total === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
        <CheckCircle2 className="mx-auto size-12 text-slate-300 dark:text-slate-600 mb-1" />
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-white">
            No Fill-in-the-Blanks Exercises
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Generate precision cloze recall exercises from course notes with Google Gemini.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleGenerateAiFillBlanks}
          disabled={isAiGenerating}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          {isAiGenerating ? (
            <>
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              Generating Cloze Items with Gemini...
            </>
          ) : (
            <>
              <Sparkles className="size-3.5 mr-1.5 text-amber-300" />
              Generate Fill Blanks (AI)
            </>
          )}
        </Button>
      </div>
    );
  }

  React.useEffect(() => {
    setUserInput(currentB.userAnswer || "");
    setIsChecked(currentB.isCorrect !== undefined);
    setIsCorrect(Boolean(currentB.isCorrect));
    setShowHint(false);
  }, [currentIndex, currentB]);

  const handleCheck = () => {
    if (!userInput.trim()) return;

    const normalize = (s: string) =>
      s.trim().toLowerCase().replace(/^[.,;:!?"'"`]+|[.,;:!?"'"`]+$/g, "").replace(/\s+/g, " ");

    const cleanInput = normalize(userInput);
    const cleanTarget = normalize(currentB.blankAnswer);

    let matched = cleanInput === cleanTarget;
    if (!matched && currentB.acceptedAlternatives) {
      matched = currentB.acceptedAlternatives.some(
        (alt) => normalize(alt) === cleanInput,
      );
    }

    setIsCorrect(matched);
    setIsChecked(true);

    recordFillBlankAttempt(studySet.id, currentB.id, userInput.trim(), matched);
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Split sentence around blank [word]
  const sentence = currentB.sentenceWithBlank;
  const parts = sentence.split(/\[.*?\]/);

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-200">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Exercise {currentIndex + 1} of {total}
          </span>
          <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-800/40">
            {currentB.topic}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleGenerateAiFillBlanks}
            disabled={isAiGenerating}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 font-bold text-white text-xs h-8 shadow-xs cursor-pointer hover:from-cyan-700 hover:to-blue-700"
          >
            {isAiGenerating ? (
              <>
                <Loader2 className="size-3.5 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 mr-1 text-amber-300" />
                AI Fill Blanks
              </>
            )}
          </Button>

          {currentB.hint && (
            <button
              type="button"
              onClick={() => setShowHint((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 cursor-pointer ml-1"
            >
              <Lightbulb className="size-3.5 text-amber-500" />
              <span>{showHint ? "Hide Clue" : "Show Clue"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Sentence Completion Card ── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-7">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <SpellCheck className="size-3.5 text-cyan-600 dark:text-cyan-400" />
            Cloze Sentence Retrieval
          </span>

          <div className="mt-4 font-serif text-lg sm:text-xl leading-relaxed text-slate-900 dark:text-slate-100 tracking-tight">
            {parts[0]}
            <span
              className={cn(
                "mx-1.5 inline-block font-sans font-bold text-base min-w-[130px] text-center px-3 py-0.5 rounded-xl border transition-all",
                isChecked
                  ? isCorrect
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs"
                    : "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  : userInput
                    ? "border-cyan-400 bg-cyan-50/50 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300"
                    : "border-dashed border-cyan-400/80 bg-cyan-50/30 text-cyan-600/70 dark:bg-cyan-950/20 dark:text-cyan-400",
              )}
            >
              {isChecked ? (
                isCorrect ? (
                  <span>{userInput}</span>
                ) : (
                  <span>
                    <span className="line-through text-rose-500 mr-2">{userInput}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      [{currentB.blankAnswer}]
                    </span>
                  </span>
                )
              ) : (
                userInput || "__________"
              )}
            </span>
            {parts[1] || ""}
          </div>
        </div>

        {/* Clue banner */}
        {showHint && currentB.hint && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 flex items-center gap-2.5 animate-in fade-in duration-150 shadow-2xs">
            <Lightbulb className="size-4 shrink-0 text-amber-500" />
            <span className="font-medium leading-relaxed">
              <strong>Academic Clue:</strong> {currentB.hint}
            </span>
          </div>
        )}

        {/* Input Form */}
        {!isChecked ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCheck();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <Input
              autoFocus
              placeholder="Type missing canonical term here..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="text-sm font-medium rounded-xl h-10 border-slate-200 dark:border-slate-700 px-4"
            />
            <Button
              type="submit"
              disabled={!userInput.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl h-10 px-5 shrink-0 shadow-xs cursor-pointer"
            >
              Verify Term
            </Button>
          </form>
        ) : (
          <div
            className={cn(
              "rounded-2xl p-5 text-xs space-y-2.5 border shadow-2xs animate-in fade-in duration-200",
              isCorrect
                ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-950 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200"
                : "border-rose-200 bg-rose-50/70 dark:border-rose-950 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200",
            )}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Correct Term Identified!</span>
                </>
              ) : (
                <>
                  <XCircle className="size-5 text-rose-600 dark:text-rose-400" />
                  <span>
                    Incorrect. Target Term:{" "}
                    <strong className="underline text-emerald-700 dark:text-emerald-300">
                      {currentB.blankAnswer}
                    </strong>
                  </span>
                </>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              💡 {currentB.explanation}
            </p>
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
            Previous
          </Button>

          {isChecked && !isCorrect && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsChecked(false);
                setUserInput("");
              }}
              className="text-xs rounded-xl"
            >
              <RotateCcw className="size-3 mr-1" />
              Try Again
            </Button>
          )}

          {currentIndex < total - 1 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl"
            >
              Next Exercise
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => setCurrentIndex(0)}
              variant="outline"
              className="text-xs rounded-xl"
            >
              Review from Start
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
