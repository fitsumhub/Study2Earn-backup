import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  recordFillBlankAttempt,
  type StudySet,
  type StudySetFillBlank,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";

interface StudySetFillBlanksTabProps {
  studySet: StudySet;
}

export function StudySetFillBlanksTab({ studySet }: StudySetFillBlanksTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const blanks = studySet.fillBlanks;
  const currentB = blanks[currentIndex] || blanks[0];
  const total = blanks.length;

  if (total === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <CheckCircle2 className="mx-auto size-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-white">
          No Fill-in-the-Blanks Exercises
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          This study set does not have cloze sentences generated yet.
        </p>
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

    const cleanInput = userInput.trim().toLowerCase();
    const cleanTarget = currentB.blankAnswer.trim().toLowerCase();

    let matched = cleanInput === cleanTarget;
    if (!matched && currentB.acceptedAlternatives) {
      matched = currentB.acceptedAlternatives.some(
        (alt) => alt.toLowerCase().trim() === cleanInput,
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
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Exercise {currentIndex + 1} of {total}
          </span>
          <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
            {currentB.topic}
          </span>
        </div>

        {currentB.hint && (
          <button
            type="button"
            onClick={() => setShowHint((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 cursor-pointer"
          >
            <Lightbulb className="size-3.5" />
            <span>{showHint ? "Hide Clue" : "Show Clue"}</span>
          </button>
        )}
      </div>

      {/* ── Sentence Completion Card ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Complete the sentence by filling in the missing term
          </span>

          <div className="mt-4 font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-100">
            {parts[0]}
            <span className="mx-1 inline-block border-b-2 border-dashed border-blue-500 font-sans font-bold text-blue-600 dark:text-blue-400 min-w-[120px] text-center px-2">
              {isChecked ? (
                isCorrect ? (
                  <span className="text-emerald-600 dark:text-emerald-400">{userInput}</span>
                ) : (
                  <span className="line-through text-rose-500 mr-2">{userInput}</span>
                )
              ) : (
                userInput || "__________"
              )}
              {isChecked && !isCorrect && (
                <span className="text-emerald-600 font-bold ml-1">
                  [{currentB.blankAnswer}]
                </span>
              )}
            </span>
            {parts[1] || ""}
          </div>
        </div>

        {/* Clue banner */}
        {showHint && currentB.hint && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300 flex items-center gap-2 animate-in fade-in duration-150">
            <Lightbulb className="size-4 shrink-0 text-amber-500" />
            <span>Clue: {currentB.hint}</span>
          </div>
        )}

        {/* Input box */}
        {!isChecked ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCheck();
            }}
            className="flex gap-2"
          >
            <Input
              autoFocus
              placeholder="Type missing term here..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="text-sm font-medium"
            />
            <Button
              type="submit"
              disabled={!userInput.trim()}
              className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs shrink-0"
            >
              Check Answer
            </Button>
          </form>
        ) : (
          <div
            className={cn(
              "rounded-2xl p-4 text-xs space-y-2 border",
              isCorrect
                ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-950 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200"
                : "border-rose-200 bg-rose-50/60 dark:border-rose-950 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200",
            )}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <span>Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="size-5 text-rose-600" />
                  <span>
                    Incorrect. The answer is: <strong>{currentB.blankAnswer}</strong>
                  </span>
                </>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
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
            className="text-xs"
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
              className="text-xs"
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
              className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs font-bold"
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
              className="text-xs"
            >
              Review from Start
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

