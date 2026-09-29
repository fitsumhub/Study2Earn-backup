import {
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Download,
  RotateCcw,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { addSavedResponse } from "@/lib/ai-chat-store";
import { cn } from "@/lib/utils";

interface AIResponseActionsProps {
  messageId: string;
  content: string;
  course?: string;
  feedback?: "helpful" | "unhelpful";
  onFeedback?: (messageId: string, feedback: "helpful" | "unhelpful") => void;
  onRegenerate?: () => void;
  className?: string;
}

export function AIResponseActions({
  messageId,
  content,
  course = "General",
  feedback,
  onFeedback,
  onRegenerate,
  className,
}: AIResponseActionsProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Response copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (saved) {
      toast.info("Already saved in your Study Library");
      return;
    }
    const titleMatch = content.match(/^###?\s+([^\n]+)/m);
    const title = titleMatch ? titleMatch[1].trim() : `${course} AI Explanation`;
    
    addSavedResponse({
      title,
      course,
      content,
      tags: [course, "AI-Response"],
    });
    setSaved(true);
    toast.success("Saved to your Study Library", {
      description: "You can review and export saved responses anytime.",
    });
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studley-${course.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown note file");
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400",
        className,
      )}
    >
      {/* Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        title="Copy response"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            <span>Copy</span>
          </>
        )}
      </button>

      {/* Save Response */}
      <button
        type="button"
        onClick={handleSave}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2 py-1 transition",
          saved
            ? "text-brand-gold bg-brand-gold/10 font-semibold"
            : "hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200",
        )}
        title="Save to your Study Library"
      >
        {saved ? (
          <>
            <BookmarkCheck className="size-3.5 text-brand-gold" />
            <span>Saved</span>
          </>
        ) : (
          <>
            <Bookmark className="size-3.5" />
            <span>Save</span>
          </>
        )}
      </button>

      {/* Regenerate */}
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Regenerate this response"
        >
          <RotateCcw className="size-3.5" />
          <span>Regenerate</span>
        </button>
      )}

      {/* Export Markdown */}
      <button
        type="button"
        onClick={handleExport}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        title="Download Markdown note"
      >
        <Download className="size-3.5" />
        <span className="hidden sm:inline">Export</span>
      </button>

      <div className="flex-1" />

      {/* Helpful / Not Helpful Ratings */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onFeedback?.(messageId, "helpful")}
          className={cn(
            "rounded-lg p-1.5 transition",
            feedback === "helpful"
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200",
          )}
          title="Helpful response"
        >
          <ThumbsUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onFeedback?.(messageId, "unhelpful")}
          className={cn(
            "rounded-lg p-1.5 transition",
            feedback === "unhelpful"
              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
              : "hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200",
          )}
          title="Not helpful"
        >
          <ThumbsDown className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

