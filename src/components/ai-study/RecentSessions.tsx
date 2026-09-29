import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import type { AiStudyHistoryEntry } from "@/lib/ai-study-store";
import { cn } from "@/lib/utils";
import { relativeTime } from "./study-pack";
import { subjectLabel, subjectTheme } from "./subject";

interface RecentSessionsProps {
  history: AiStudyHistoryEntry[];
  onResume: (entry: AiStudyHistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  className?: string;
}

export function RecentSessions({
  history,
  onResume,
  onRemove,
  onClear,
  className,
}: RecentSessionsProps) {
  if (history.length === 0) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-800",
          className,
        )}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
          <History className="size-6" />
        </div>
        <h3 className="mt-3 font-serif text-base font-bold text-slate-700 dark:text-slate-300">
          No recent study sessions yet
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Generate a study pack or ask Studley AI a question to start your study log.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-brand-navy text-brand-gold dark:bg-slate-800">
            <History className="size-4" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white">
              Recent Study Packs & Quizzes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Jump right back into previous question sets, flashcards, and podcasts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition"
        >
          <Trash2 className="size-3.5" />
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {history.map((entry) => {
          const theme = subjectTheme[entry.subject] ?? subjectTheme.general;
          return (
            <div
              key={entry.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-brand-navy/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                      theme.badge,
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", theme.dot)} />
                    {subjectLabel(entry.subject)}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    className="rounded-lg p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from history"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <h4 className="truncate font-serif text-sm font-bold text-brand-navy dark:text-white">
                  {entry.filename}
                </h4>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span>{entry.questionCount} questions</span>
                  <span>·</span>
                  <span>{relativeTime(entry.createdAt)}</span>
                </div>

                {/* Score Pill */}
                {entry.scorePct !== undefined && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        entry.scorePct >= 80
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
                      )}
                    >
                      {entry.scorePct}% Score
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({entry.correctCount}/{entry.answeredCount} correct)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onResume(entry)}
                  className="w-full rounded-xl bg-brand-navy/10 text-brand-navy font-bold hover:bg-brand-navy hover:text-white dark:bg-slate-800 dark:text-brand-gold dark:hover:bg-brand-navy dark:hover:text-white text-xs"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Practice Again
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

