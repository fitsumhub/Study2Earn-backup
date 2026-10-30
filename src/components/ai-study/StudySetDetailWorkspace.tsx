import {
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  FileText,
  HelpCircle,
  Pencil,
  Share2,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addFlashcardToSet,
  toggleFavoriteStudySet,
  updateFlashcardMastery,
  updateStudySet,
  type FlashcardMastery,
  type StudySet,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";
import { FlashcardsMode } from "./FlashcardsMode";
import { StudySetFillBlanksTab } from "./StudySetFillBlanksTab";
import { StudySetNotesTab } from "./StudySetNotesTab";
import { StudySetOverviewTab } from "./StudySetOverviewTab";
import { StudySetQuizTab } from "./StudySetQuizTab";
import { StudySetSummaryTab } from "./StudySetSummaryTab";
import { StudySetWrittenTab } from "./StudySetWrittenTab";
import { StudySetDeepLearningCopilot } from "./StudySetDeepLearningCopilot";

export type StudySetTabKey =
  | "overview"
  | "tutor"
  | "flashcards"
  | "quiz"
  | "summary"
  | "written"
  | "fillblanks"
  | "notes"
  | "podcast"
  | "sources";

interface StudySetDetailWorkspaceProps {
  studySet: StudySet;
  initialTab?: StudySetTabKey;
  onBackToLibrary: () => void;
  onStudySetUpdated?: () => void;
}

export function StudySetDetailWorkspace({
  studySet,
  initialTab = "overview",
  onBackToLibrary,
  onStudySetUpdated,
}: StudySetDetailWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<StudySetTabKey>(initialTab);
  const [isFav, setIsFav] = useState(studySet.isFavorite);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState(studySet.title);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [focusWeakInQuiz, setFocusWeakInQuiz] = useState(false);

  const handleToggleFavorite = () => {
    const newFav = toggleFavoriteStudySet(studySet.id);
    setIsFav(newFav);
    onStudySetUpdated?.();
  };

  const handleSaveRename = () => {
    if (!renameTitle.trim()) return;
    updateStudySet(studySet.id, { title: renameTitle.trim() });
    setIsRenameOpen(false);
    onStudySetUpdated?.();
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/ai-study?set=${studySet.id}`;
      navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handlePracticeWeakAreas = () => {
    setFocusWeakInQuiz(true);
    setActiveTab("quiz");
  };

  const tabsConfig: Array<{
    key: StudySetTabKey;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    accent: string;
    activeClass: string;
  }> = [
    {
      key: "overview",
      label: "Overview",
      icon: BookOpen,
      accent: "text-blue-600 dark:text-blue-400",
      activeClass: "bg-slate-900 text-white shadow-md dark:bg-blue-600 dark:text-white",
    },
    {
      key: "notes",
      label: "Summarize Notes",
      icon: FileText,
      accent: "text-indigo-600 dark:text-indigo-400",
      activeClass: "bg-indigo-950 text-white shadow-md dark:bg-indigo-600 dark:text-white",
    },
    {
      key: "flashcards",
      label: "Flashcards",
      icon: Brain,
      badge: studySet.flashcards.length,
      accent: "text-amber-600 dark:text-amber-400",
      activeClass: "bg-amber-950 text-white shadow-md dark:bg-amber-600 dark:text-white",
    },
    {
      key: "quiz",
      label: "Quiz",
      icon: HelpCircle,
      badge: studySet.quizzes.length,
      accent: "text-purple-600 dark:text-purple-400",
      activeClass: "bg-purple-950 text-white shadow-md dark:bg-purple-600 dark:text-white",
    },
    {
      key: "summary",
      label: "Cheat Sheet",
      icon: Zap,
      accent: "text-orange-600 dark:text-orange-400",
      activeClass: "bg-orange-950 text-white shadow-md dark:bg-orange-600 dark:text-white",
    },
    {
      key: "written",
      label: "Written Test",
      icon: Pencil,
      badge: studySet.writtenTests.length,
      accent: "text-emerald-600 dark:text-emerald-400",
      activeClass: "bg-emerald-950 text-white shadow-md dark:bg-emerald-600 dark:text-white",
    },
    {
      key: "fillblanks",
      label: "Fill Blanks",
      icon: CheckCircle2,
      badge: studySet.fillBlanks.length,
      accent: "text-cyan-600 dark:text-cyan-400",
      activeClass: "bg-cyan-950 text-white shadow-md dark:bg-cyan-600 dark:text-white",
    },
    {
      key: "tutor",
      label: "AI Tutor",
      icon: Sparkles,
      accent: "text-rose-600 dark:text-rose-400",
      activeClass: "bg-rose-950 text-white shadow-md dark:bg-rose-600 dark:text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 pb-20">
      {/* ── Top Sticky Workspace Navigation Bar ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 shadow-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          {/* Back & Study Set Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBackToLibrary}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 shrink-0 rounded-xl"
            >
              <ArrowLeft className="size-4 mr-1.5" />
              <span>Library</span>
            </Button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-2.5 min-w-0">
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-[11px] font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 shrink-0">
                {studySet.courseCode || studySet.subject}
              </span>

              <h1 className="truncate font-serif text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {studySet.title}
              </h1>

              <button
                type="button"
                onClick={() => {
                  setRenameTitle(studySet.title);
                  setIsRenameOpen(true);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Rename study set"
                aria-label="Rename study set"
              >
                <Edit2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Action buttons on right */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100/80 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 shadow-2xs">
              <Sparkles className="size-3 text-amber-500 fill-amber-500/20" />
              <span>{studySet.progress.overallPct}% Mastered</span>
            </div>

            <button
              type="button"
              onClick={handleToggleFavorite}
              className={cn(
                "rounded-xl p-2 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                isFav
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
              )}
              title={isFav ? "Favorited" : "Add to favorites"}
              aria-label={isFav ? "Favorited" : "Add to favorites"}
            >
              <Star className={cn("size-4", isFav && "fill-amber-400")} />
            </button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsShareOpen(true)}
              className="text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Share2 className="size-3.5 mr-1.5" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* ── Premium Academic Tab Bar ── */}
      <nav aria-label="Study modes" className="border-b border-slate-200/90 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-xs sticky top-[57px] z-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5">
            {tabsConfig.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(t.key);
                    if (t.key !== "quiz") setFocusWeakInQuiz(false);
                  }}
                  className={cn(
                    "group relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer select-none",
                    isActive
                      ? t.activeClass
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 transition-transform group-hover:scale-110",
                      isActive ? "text-white" : t.accent,
                    )}
                  />
                  <span className={cn(isActive && "font-bold")}>{t.label}</span>
                  {t.badge !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none",
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700",
                      )}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Active Tab Workspace Area ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* 1. OVERVIEW */}
        {activeTab === "overview" && (
          <StudySetOverviewTab
            studySet={studySet}
            onNavigateTab={(tab) => setActiveTab(tab as StudySetTabKey)}
            onPracticeWeakAreas={handlePracticeWeakAreas}
            onStudySetUpdated={onStudySetUpdated}
          />
        )}

        {/* 2. FLASHCARDS */}
        {activeTab === "flashcards" && (
          <FlashcardsMode
            initialFlashcards={studySet.flashcards}
            subjectTitle={studySet.title}
            onMasteryChange={(cardId, mastery) => {
              updateFlashcardMastery(studySet.id, cardId, mastery as FlashcardMastery);
              onStudySetUpdated?.();
            }}
            onCardAdd={(card) => {
              addFlashcardToSet(studySet.id, card);
              onStudySetUpdated?.();
            }}
          />
        )}

        {/* 4. AI QUIZ */}
        {activeTab === "quiz" && (
          <StudySetQuizTab
            studySet={studySet}
            initialFocusWeak={focusWeakInQuiz}
            onNavigateTab={(tab) => setActiveTab(tab as StudySetTabKey)}
            onStudySetUpdated={onStudySetUpdated}
          />
        )}

        {/* 5. WRITTEN TEST */}
        {activeTab === "written" && (
          <StudySetWrittenTab
            studySet={studySet}
            onStudySetUpdated={onStudySetUpdated}
          />
        )}

        {/* 6. FILL IN THE BLANKS */}
        {activeTab === "fillblanks" && (
          <StudySetFillBlanksTab
            studySet={studySet}
            onStudySetUpdated={onStudySetUpdated}
          />
        )}

        {/* 7. AI NOTES & FORMULAS */}
        {activeTab === "notes" && (
          <StudySetNotesTab
            studySet={studySet}
            onStudySetUpdated={onStudySetUpdated}
          />
        )}

        {/* SUMMARY & CHEAT SHEET */}
        {activeTab === "summary" && (
          <StudySetSummaryTab
            studySet={studySet}
            onStudySetUpdated={onStudySetUpdated}
          />
        )}

        {/* 8. AI TUTOR & DEEP LEARNING COPILOT */}
        {activeTab === "tutor" && (
          <StudySetDeepLearningCopilot
            studySet={studySet}
            onNavigateTab={(tab) => setActiveTab(tab as StudySetTabKey)}
          />
        )}
      </div>

      {/* ── Floating Ask AI Tutor Button ── */}
      {activeTab !== "tutor" && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => {
              setActiveTab("tutor");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 via-indigo-600 to-brand-navy px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-rose-500/25 hover:scale-105 transition-all cursor-pointer border border-white/20"
          >
            <Sparkles className="size-4 animate-pulse text-amber-300" />
            Ask AI Tutor
          </button>
        </div>
      )}

      {/* ── Rename Modal ── */}
      {isRenameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
              Rename Study Set
            </h3>
            <Input
              autoFocus
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              className="text-sm font-medium"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRenameOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveRename}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share Modal ── */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="size-4 text-blue-500" />
                Share Study Set
              </h3>
              <button
                type="button"
                onClick={() => setIsShareOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Anyone with this link can practice your flashcards, quizzes, and written tests on Study2Earn:
            </p>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800/60">
              <input
                readOnly
                value={typeof window !== "undefined" ? `${window.location.origin}/ai-study?set=${studySet.id}` : ""}
                className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 font-mono outline-hidden truncate"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleShare}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs shrink-0"
              >
                {copiedShare ? (
                  <>
                    <Check className="size-3.5 mr-1 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

