import {
  ArrowRight,
  BookOpen,
  Calendar,
  FileSearch,
  FileText,
  HelpCircle,
  Layers,
  Lightbulb,
  Sparkles,
  Trophy,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export interface StudyToolDef {
  id: "explain" | "summarize" | "flashcards" | "questions" | "exam" | "plan" | "analyze" | "tutor";
  title: string;
  emoji: string;
  category: "mastery" | "exam" | "recall" | "planning";
  badge: string;
  description: string;
  sampleInput: string;
  iconBg: string;
  iconColor: string;
  borderHover: string;
}

export const STUDY_TOOLS: StudyToolDef[] = [
  {
    id: "explain",
    title: "Explain Topic",
    emoji: "📚",
    category: "mastery",
    badge: "Concept Deep-Dive",
    description: "Deep conceptual breakdown with real-world analogies, governing equations, and Ethiopian exam pitfalls.",
    sampleInput: "Explain Newton's Laws of Motion and rotational kinematics with examples.",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderHover: "hover:border-blue-500/50",
  },
  {
    id: "summarize",
    title: "Summarize Notes",
    emoji: "📝",
    category: "mastery",
    badge: "High-Yield Summary",
    description: "Condense long chapters, lecture slides, or reading materials into essential revision bullet points.",
    sampleInput: "Paste chapter notes or outline to generate executive summaries and memory triggers.",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderHover: "hover:border-amber-500/50",
  },
  {
    id: "flashcards",
    title: "Generate Flashcards",
    emoji: "🧠",
    category: "recall",
    badge: "Active Recall",
    description: "Instant question & answer flashcard decks formatted for spaced repetition and rapid memorization.",
    sampleInput: "Generate 10 flashcards for Logic & Critical Thinking informal fallacies.",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    borderHover: "hover:border-violet-500/50",
  },
  {
    id: "questions",
    title: "Practice Questions",
    emoji: "❓",
    category: "exam",
    badge: "MCQ & Explanations",
    description: "Targeted multiple-choice questions with full rationale for correct options and distractor traps.",
    sampleInput: "Create 5 multiple choice questions on differential calculus and limits.",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderHover: "hover:border-emerald-500/50",
  },
  {
    id: "exam",
    title: "Practice Exam",
    emoji: "📊",
    category: "exam",
    badge: "Exit Exam Simulator",
    description: "Timed mock exam simulation adhering to Ethiopian Ministry of Education exit exam weightings.",
    sampleInput: "Simulate a 15-minute General Physics Exit Exam mock with scoring rubrics.",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    borderHover: "hover:border-rose-500/50",
  },
  {
    id: "plan",
    title: "Study Planner",
    emoji: "📅",
    category: "planning",
    badge: "Semester Roadmap",
    description: "Structured 7-day or exam countdown revision schedule customized to chapters and daily study hours.",
    sampleInput: "Create a 7-day revision plan for Freshman Mathematics and General Biology.",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderHover: "hover:border-indigo-500/50",
  },
  {
    id: "analyze",
    title: "Analyze PDF/Notes",
    emoji: "📄",
    category: "mastery",
    badge: "Document Scanner",
    description: "Inspect uploaded study materials to automatically detect key formulas, definitions, and high-yield traps.",
    sampleInput: "Extract all key definitions and mathematical laws from my lecture handout.",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600 dark:text-teal-400",
    borderHover: "hover:border-teal-500/50",
  },
  {
    id: "tutor",
    title: "Study Tutor",
    emoji: "💡",
    category: "mastery",
    badge: "Socratic Method",
    description: "Interactive Socratic AI tutor that guides your thought process step by step without spoiling answers.",
    sampleInput: "Help me understand why kinetic energy is proportional to the square of velocity.",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-600 dark:text-orange-400",
    borderHover: "hover:border-orange-500/50",
  },
];

interface StudyToolCardProps {
  tool: StudyToolDef;
  onLaunch: (tool: StudyToolDef) => void;
}

export function StudyToolCard({ tool, onLaunch }: StudyToolCardProps) {
  return (
    <div
      onClick={() => onLaunch(tool)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onLaunch(tool);
        }
      }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer",
        tool.borderHover,
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-xl text-xl shadow-xs transition-transform duration-200 group-hover:scale-105",
              tool.iconBg,
            )}
          >
            <span>{tool.emoji}</span>
          </div>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {tool.badge}
          </span>
        </div>

        <h3 className="font-serif text-base font-bold text-brand-navy dark:text-white group-hover:text-brand-navy/90">
          {tool.title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3">
          {tool.description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-brand-navy dark:border-slate-800 dark:text-brand-gold">
        <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-brand-gold transition-colors">
          <Sparkles className="size-3" />
          Launch Tool
        </span>
        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </div>
  );
}

