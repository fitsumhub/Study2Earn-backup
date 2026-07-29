import { CheckCircle2, ChevronDown, ChevronUp, Lightbulb, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { AIQuestion } from "./types";

export function QuestionCard({
  question,
  index,
  onReveal,
}: {
  question: AIQuestion;
  index: number;
  onReveal: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isCorrect = revealed && selected !== null && selected === question.correctIndex;
  const isWrong = revealed && selected !== null && selected !== question.correctIndex;

  const handleReveal = () => {
    if (revealed || selected === null) return;
    setRevealed(true);
    onReveal(selected === question.correctIndex);
  };

  const handleReset = () => {
    setSelected(null);
    setRevealed(false);
    setCollapsed(false);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300",
        isCorrect
          ? "border-emerald-200 shadow-emerald-100"
          : isWrong
            ? "border-red-200 shadow-red-50"
            : "border-slate-100 hover:border-slate-200 hover:shadow-md",
      )}
    >
      {/* Left status stripe */}
      <div
        className={cn(
          "h-1 w-full transition-all duration-300",
          isCorrect
            ? "bg-gradient-to-r from-emerald-400 to-teal-400"
            : isWrong
              ? "bg-gradient-to-r from-red-400 to-rose-400"
              : revealed
                ? "bg-brand-gold"
                : "bg-slate-100",
        )}
      />

      {/* Header row */}
      <button
        type="button"
        onClick={() => setCollapsed((p) => !p)}
        className="flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50/60"
      >
        {/* Number / status badge */}
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all",
            isCorrect
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
              : isWrong
                ? "bg-red-400 text-white shadow-md shadow-red-100"
                : "bg-brand-navy/8 text-brand-navy",
          )}
        >
          {isCorrect ? (
            <CheckCircle2 className="size-5" />
          ) : isWrong ? (
            <XCircle className="size-5" />
          ) : (
            <span className="font-mono text-sm">{index + 1}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Question {index + 1}
          </p>
          <p className="font-semibold leading-snug text-brand-navy">{question.question}</p>
        </div>

        <div className="ml-2 shrink-0 mt-0.5">
          {collapsed ? (
            <ChevronDown className="size-5 text-slate-300" />
          ) : (
            <ChevronUp className="size-5 text-slate-300" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-slate-100 px-6 pb-6 pt-5">
          {/* Option buttons */}
          <div className="mb-5 space-y-2.5">
            {question.options.map((opt, i) => {
              const optSelected = selected === i;
              const optCorrect = i === question.correctIndex;
              const showGreen = revealed && optCorrect;
              const showRed = revealed && optSelected && !optCorrect;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200",
                    showGreen
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                      : showRed
                        ? "border-red-300 bg-red-50 text-red-700"
                        : optSelected
                          ? "border-brand-navy/30 bg-brand-navy/5 text-brand-navy ring-2 ring-brand-navy/10 shadow-sm"
                          : revealed
                            ? "border-slate-100 bg-slate-50/40 text-slate-400 opacity-60"
                            : "border-slate-200 text-slate-700 hover:border-brand-navy/25 hover:bg-slate-50 hover:shadow-sm",
                  )}
                >
                  {/* Letter circle */}
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                      showGreen
                        ? "bg-emerald-500 text-white"
                        : showRed
                          ? "bg-red-400 text-white"
                          : optSelected
                            ? "bg-brand-navy text-white"
                            : "border border-slate-300 text-slate-400",
                    )}
                  >
                    {["A", "B", "C", "D"][i]}
                  </span>

                  <span className="flex-1">{opt}</span>

                  {showGreen && <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />}
                  {showRed && <XCircle className="size-4 shrink-0 text-red-400" />}
                </button>
              );
            })}
          </div>

          {/* Action row */}
          {!revealed ? (
            <button
              type="button"
              disabled={selected === null}
              onClick={handleReveal}
              className={cn(
                "w-full rounded-xl py-3 text-sm font-bold transition-all",
                selected !== null
                  ? "bg-brand-gold text-white hover:brightness-110 hover:shadow-lg hover:shadow-brand-gold/25 active:scale-[0.99]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400",
              )}
            >
              {selected === null ? "Select an answer to continue" : "Reveal Answer & Explanation"}
            </button>
          ) : (
            <div
              className={cn(
                "animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl p-5 duration-300",
                isCorrect
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200",
              )}
            >
              {/* Result headline */}
              <div className="mb-3 flex items-center justify-between">
                <p
                  className={cn(
                    "flex items-center gap-2 font-bold",
                    isCorrect ? "text-emerald-700" : "text-red-700",
                  )}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="size-4" /> Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4" /> Incorrect — correct answer:{" "}
                      <span className="rounded bg-white/80 px-1.5 py-0.5 font-mono">
                        {["A", "B", "C", "D"][question.correctIndex]}
                      </span>
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 rounded-lg border border-current/20 bg-white/60 px-2.5 py-1 text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity"
                >
                  <RotateCcw className="size-3" /> Try again
                </button>
              </div>

              {/* Explanation */}
              <div className="flex items-start gap-3 rounded-lg bg-white/70 px-4 py-3 text-sm text-slate-700">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand-gold" />
                <span className="leading-relaxed">{question.explanation}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
