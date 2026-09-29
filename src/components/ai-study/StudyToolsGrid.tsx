import React, { useState } from "react";
import { STUDY_TOOLS, StudyToolCard, type StudyToolDef } from "./StudyToolCard";
import { StudyToolModal } from "./StudyToolModal";

interface StudyToolsGridProps {
  onOpenChatWithTopic?: (topic: string, course: string, tool: string) => void;
  className?: string;
}

export function StudyToolsGrid({ onOpenChatWithTopic, className }: StudyToolsGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "mastery" | "exam" | "recall" | "planning"
  >("all");
  const [activeModalTool, setActiveModalTool] = useState<StudyToolDef | null>(null);

  const categories = [
    { id: "all", label: "All 8 Tools" },
    { id: "mastery", label: "📚 Concept Mastery" },
    { id: "exam", label: "🎯 Exam Preparation" },
    { id: "recall", label: "🧠 Active Recall" },
    { id: "planning", label: "📅 Planning & Schedule" },
  ];

  const filteredTools =
    selectedCategory === "all"
      ? STUDY_TOOLS
      : STUDY_TOOLS.filter((t) => t.category === selectedCategory);

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-navy dark:text-white">
            Specialized AI Study Tools
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Intelligent learning engines designed for Ethiopian university courses & Exit Exams.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl dark:bg-slate-800">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id as any)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                selectedCategory === c.id
                  ? "bg-white text-brand-navy shadow-xs dark:bg-slate-900 dark:text-brand-gold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filteredTools.map((tool) => (
          <StudyToolCard
            key={tool.id}
            tool={tool}
            onLaunch={(t) => setActiveModalTool(t)}
          />
        ))}
      </div>

      {/* Interactive Modal */}
      <StudyToolModal
        tool={activeModalTool}
        isOpen={Boolean(activeModalTool)}
        onClose={() => setActiveModalTool(null)}
        onOpenChatWithTopic={onOpenChatWithTopic}
      />
    </div>
  );
}

