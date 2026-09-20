import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Pencil,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { WrittenQuestion } from "./types";

export function WrittenPracticeMode({
  questions,
  subjectTitle,
}: {
  questions: WrittenQuestion[];
  subjectTitle: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isMatch, setIsMatch] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ correct: 0, reviewed: 0 });

  const currentQ = questions[currentIndex] || questions[0];
  const total = questions.length;

  if (total === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <Pencil className="mx-auto size-10 text-slate-300 mb-3" />
        <h3 className="font-serif text-lg font-bold text-brand-navy">No written exercises</h3>
        <p className="text-sm text-slate-500 mt-1">
          This study pack does not have written recall prompts available.
        </p>
      </div>
    );
  }

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    const cleanUser = userInput.trim().toLowerCase();
    const cleanAnswer = currentQ.answer.trim().toLowerCase();

    // Direct match or substring or keyword match
    let match = cleanUser === cleanAnswer || cleanAnswer.includes(cleanUser);

    if (!match && currentQ.acceptableKeywords && currentQ.acceptableKeywords.length > 0) {
      match = currentQ.acceptableKeywords.some(
        (kw) => kw.length > 2 && cleanUser.includes(kw.toLowerCase()),
      );
    }

    setIsMatch(match);
    setIsChecked(true);
    setRevealed(true);
    setStats((prev) => ({
      correct: prev.correct + (match ? 1 : 0),
      reviewed: prev.reviewed + 1,
    }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserInput("");
      setShowHint(false);
      setIsChecked(false);
      setIsMatch(false);
      setRevealed(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setUserInput("");
    setShowHint(false);
    setIsChecked(false);
    setIsMatch(false);
    setRevealed(false);
    setStats({ correct: 0, reviewed: 0 });
  };

  const handleOverrideScore = (wasCorrect: boolean) => {
    setStats((prev) => ({
      ...prev,
      correct: Math.max(0, prev.correct + (wasCorrect ? (isMatch ? 0 : 1) : isMatch ? -1 : 0)),
    }));
    setIsMatch(wasCorrect);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Pencil className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Recall Written Test
            </p>
            <p className="font-serif text-base font-bold text-brand-navy">
              Question {currentIndex + 1} of {total}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400">Score:</span>
            <span className="ml-1.5 font-bold text-brand-navy">
              {stats.correct} / {stats.reviewed}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      <Progress value={((currentIndex + 1) / total) * 100} className="h-2 rounded-full" />

      {/* Main question card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {subjectTitle} Recall
          </span>
          {currentQ.hint && !showHint && !revealed && (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              <Lightbulb className="size-3.5" />
              Need a hint?
            </button>
          )}
        </div>

        <div>
          <h3 className="font-serif text-2xl font-bold leading-snug text-brand-navy">
            {currentQ.prompt}
          </h3>
          {showHint && currentQ.hint && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
              <Lightbulb className="size-4 shrink-0 text-amber-600 mt-0.5" />
              <span>{currentQ.hint}</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Your Answer:
          </label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isChecked}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isChecked) checkAnswer();
              }
            }}
            placeholder="Type your answer here and press Enter..."
            rows={3}
            className={cn(
              "w-full rounded-2xl border p-4 text-sm font-medium outline-none transition-all",
              isChecked
                ? isMatch
                  ? "border-emerald-300 bg-emerald-50/30 text-emerald-950"
                  : "border-rose-300 bg-rose-50/30 text-rose-950"
                : "border-slate-200 bg-slate-50/50 focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10",
            )}
          />

          {!isChecked ? (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsChecked(true);
                  setRevealed(true);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Don't know? Reveal answer
              </button>
              <Button
                type="button"
                onClick={checkAnswer}
                disabled={!userInput.trim()}
                className="rounded-xl bg-brand-navy px-6 text-white hover:bg-brand-navy/90"
              >
                Check Answer
                <ChevronRight className="ml-1.5 size-4" />
              </Button>
            </div>
          ) : (
            /* Results feedback */
            <div className="space-y-4 rounded-2xl border p-5 transition-all bg-slate-50 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isMatch ? (
                    <>
                      <CheckCircle2 className="size-5 text-emerald-600" />
                      <span className="font-serif font-bold text-emerald-800">Correct! Great recall.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-5 text-rose-500" />
                      <span className="font-serif font-bold text-rose-800">
                        {userInput.trim() ? "Not quite right" : "Answer revealed"}
                      </span>
                    </>
                  )}
                </div>
                {/* Self evaluation adjustment */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Override:</span>
                  <button
                    type="button"
                    onClick={() => handleOverrideScore(true)}
                    className={cn(
                      "rounded-lg px-2 py-1 font-semibold",
                      isMatch ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-200",
                    )}
                  >
                    I was right
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOverrideScore(false)}
                    className={cn(
                      "rounded-lg px-2 py-1 font-semibold",
                      !isMatch ? "bg-rose-100 text-rose-700" : "text-slate-500 hover:bg-slate-200",
                    )}
                  >
                    Mark wrong
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Correct Answer:
                </p>
                <p className="font-serif text-lg font-bold text-brand-navy">{currentQ.answer}</p>
              </div>

              <div className="flex justify-end pt-2">
                {currentIndex < total - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="rounded-xl bg-brand-navy px-6 text-white hover:bg-brand-navy/90"
                  >
                    Next Question
                    <ArrowRight className="ml-1.5 size-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-emerald-700">Set complete!</span>
                    <Button
                      type="button"
                      onClick={handleReset}
                      className="rounded-xl bg-brand-navy text-white"
                    >
                      Practice Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

