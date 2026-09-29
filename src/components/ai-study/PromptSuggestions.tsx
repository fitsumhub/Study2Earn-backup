import {
  BookOpen,
  Calendar,
  FileQuestion,
  HelpCircle,
  Languages,
  Layers,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string, tool?: string) => void;
  course?: string;
  className?: string;
}

export const SUGGESTED_PROMPTS = [
  {
    icon: HelpCircle,
    label: "Explain in simple terms",
    prompt: "Explain this topic in simple terms with everyday analogies and clear derivations.",
    tool: "explain",
    badge: "Most Popular",
  },
  {
    icon: FileQuestion,
    label: "Create 20 exam questions",
    prompt: "Create 20 Ethiopian University Exit Exam multiple-choice questions with answer keys and explanations.",
    tool: "questions",
    badge: "Exit Exam",
  },
  {
    icon: BookOpen,
    label: "Summarize this chapter",
    prompt: "Summarize this chapter into high-yield exam takeaways, key formulas, and must-know definitions.",
    tool: "summarize",
  },
  {
    icon: Lightbulb,
    label: "Teach me step by step",
    prompt: "Teach me this concept step by step, using a Socratic method and checking my understanding.",
    tool: "tutor",
  },
  {
    icon: Layers,
    label: "Create flashcards",
    prompt: "Create 10 active recall flashcards from these concepts with question on the front and answer on the back.",
    tool: "flashcards",
  },
  {
    icon: Languages,
    label: "በአማርኛ አስረዳኝ (Amharic)",
    prompt: "ዋናውን ጽንሰ-ሀሳብ እና የፈተና ጥያቄዎችን በአማርኛ በዝርዝር አስረዳኝ።",
    tool: "explain",
    badge: "አማርኛ",
  },
  {
    icon: Calendar,
    label: "7-day study plan",
    prompt: "Create a realistic 7-day chapter-by-chapter study plan to prepare for the final exam.",
    tool: "plan",
  },
];

export function PromptSuggestions({
  onSelectPrompt,
  course,
  className,
}: PromptSuggestionsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Sparkles className="size-3 text-brand-gold" />
          Suggested study prompts {course ? `for ${course}` : ""}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectPrompt(item.prompt, item.tool)}
              className="group flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-brand-navy/40 hover:bg-slate-50 hover:text-brand-navy hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            >
              <Icon className="size-3.5 text-slate-400 group-hover:text-brand-gold transition-colors" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-brand-gold/15 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:text-brand-gold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

