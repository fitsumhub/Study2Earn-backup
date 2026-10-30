import {
  Brain,
  Layers,
  Link2,
  Mic,
  Settings,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import { AiProviderSettingsModal } from "./AiProviderSettingsModal";
import type { IngestionTab } from "./CreateStudySetModal";
import { ACCEPT_TYPES } from "./text-extraction";

export type AIStudyActiveView = "sets" | "chat" | "tools" | "upload" | "progress";

interface AIStudyHeaderProps {
  activeView: AIStudyActiveView;
  onViewChange: (view: AIStudyActiveView) => void;
  onStartStudyingWithAi: () => void;
  aiReady: boolean;
  onOpenCreateWithTab?: (tab: IngestionTab) => void;
  onDirectUpload?: (files: FileList) => void;
  className?: string;
}

export function AIStudyHeader({
  activeView,
  onViewChange,
  onStartStudyingWithAi,
  aiReady,
  onOpenCreateWithTab,
  onDirectUpload,
  className,
}: AIStudyHeaderProps) {
  const { loggedIn, user } = useAuth();
  const { balance: xpBalance } = useWallet();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive student's display name logically: prioritize user's actual first name, strip any role suffixes, fallback to "Scholar"
  const displayName = (() => {
    if (!user?.name) return "Scholar";
    // Strip parenthetical suffixes like "(Admin)", "(Lead Developer)", etc.
    const cleanName = user.name.replace(/\(.*?\)/g, "").trim();
    const firstName = cleanName.split(/\s+/)[0];
    return firstName || "Scholar";
  })();

  return (
    <div className={cn("w-full bg-white dark:bg-slate-950 transition-colors", className)}>
      {/* ── Sub-Navigation / Mode Indicator Rail ── */}
      <div className="border-b border-slate-100 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 sticky top-16 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between overflow-x-auto no-scrollbar px-4 sm:px-6 py-2.5 gap-3">
          <div className="flex items-center gap-2">
            <span className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs dark:bg-white dark:text-slate-950">
              <Layers className="size-4 text-amber-400 dark:text-amber-600" />
              <span>Study Sets</span>
            </span>
          </div>

          {/* AI Provider Status Pill */}
          <div className="flex items-center gap-2 shrink-0">
            {loggedIn && user && (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <Sparkles className="size-3 text-amber-500" />
                <span>{xpBalance ? xpBalance.toLocaleString() : (user.xp?.toLocaleString() || "1,240")} XP</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-xs transition hover:scale-102 active:scale-98 cursor-pointer",
                aiReady
                  ? "border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
              )}
              title="Click to configure AI provider & API key"
            >
              {aiReady ? <Zap className="size-3.5 text-emerald-500" /> : <Brain className="size-3.5 text-amber-500" />}
              <span className="hidden sm:inline">{aiReady ? "AI Model Active" : "Curriculum Engine"}</span>
              <Settings className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero Master Header (Active on "sets" view) ── */}
      {activeView === "sets" && (
        <div className="relative px-4 pt-12 pb-8 sm:pt-16 sm:pb-12 text-center">
          <div className="mx-auto max-w-4xl space-y-2">
            <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Hey {displayName}, what do you wanna master?
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-normal">
              Upload anything and get interactive notes, flashcards, quizzes, and more
            </p>
          </div>

          {/* ── 3 Action Cards (Upload, Paste, Record) ── */}
          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Upload Card */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT_TYPES}
              className="hidden"
              aria-hidden="true"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onDirectUpload?.(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 cursor-pointer"
            >
              <div className="text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <Upload className="size-6 stroke-[1.8]" />
              </div>
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Upload
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Image, file, audio, video
                </p>
              </div>
            </button>

            {/* 2. Paste Card */}
            <button
              type="button"
              onClick={() => onOpenCreateWithTab?.("paste")}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 cursor-pointer"
            >
              <div className="text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <Link2 className="size-6 stroke-[1.8]" />
              </div>
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Paste
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  YouTube, website, text
                </p>
              </div>
            </button>

            {/* 3. Record Card */}
            <button
              type="button"
              onClick={() => onOpenCreateWithTab?.("record")}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 cursor-pointer"
            >
              <div className="text-slate-700 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                <Mic className="size-6 stroke-[1.8]" />
              </div>
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Record
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Record live lecture
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* AI Provider Settings Modal */}
      <AiProviderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
