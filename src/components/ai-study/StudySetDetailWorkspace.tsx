import {
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  FileText,
  GraduationCap,
  Headphones,
  HelpCircle,
  Pencil,
  Share2,
  Sparkles,
  Star,
  X,
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
import { AIChat } from "./AIChat";
import { AiPodcastPlayer } from "./AiPodcastPlayer";
import { FlashcardsMode } from "./FlashcardsMode";
import { StudySetFillBlanksTab } from "./StudySetFillBlanksTab";
import { StudySetNotesTab } from "./StudySetNotesTab";
import { StudySetOverviewTab } from "./StudySetOverviewTab";
import { StudySetQuizTab } from "./StudySetQuizTab";
import { StudySetSourcesTab } from "./StudySetSourcesTab";
import { StudySetWrittenTab } from "./StudySetWrittenTab";

export type StudySetTabKey =
  | "overview"
  | "tutor"
  | "flashcards"
  | "quiz"
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
  }> = [
    { key: "overview", label: "Overview", icon: BookOpen },
    { key: "tutor", label: "AI Tutor", icon: GraduationCap },
    {
      key: "flashcards",
      label: "Flashcards",
      icon: Brain,
      badge: studySet.flashcards.length,
    },
    {
      key: "quiz",
      label: "Quiz",
      icon: HelpCircle,
      badge: studySet.quizzes.length,
    },
    {
      key: "written",
      label: "Written Test",
      icon: Pencil,
      badge: studySet.writtenTests.length,
    },
    {
      key: "fillblanks",
      label: "Fill Blanks",
      icon: CheckCircle2,
      badge: studySet.fillBlanks.length,
    },
    { key: "notes", label: "Notes", icon: FileText },
    { key: "podcast", label: "Podcast", icon: Headphones },
    {
      key: "sources",
      label: "Sources",
      icon: FileText,
      badge: studySet.sources.length,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 pb-20">
      {/* ── Top Sticky Workspace Navigation Bar ── */}
      <div className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-900/95 shadow-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          {/* Back & Study Set Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBackToLibrary}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shrink-0 -ml-2"
            >
              <ArrowLeft className="size-4 mr-1" />
              <span className="hidden sm:inline">Back to</span> Sets
            </Button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-2 min-w-0">
              <h1 className="truncate font-serif text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {studySet.title}
              </h1>

              <button
                type="button"
                onClick={() => {
                  setRenameTitle(studySet.title);
                  setIsRenameOpen(true);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="Rename study set"
              >
                <Edit2 className="size-3.5" />
              </button>

              <span className="hidden sm:inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {studySet.courseCode || studySet.subject}
              </span>
            </div>
          </div>

          {/* Action buttons on right */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Sparkles className="size-3 text-brand-gold" />
              {studySet.progress.overallPct}% Mastered
            </span>

            <button
              type="button"
              onClick={handleToggleFavorite}
              className={cn(
                "rounded-full p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800",
                isFav
                  ? "text-amber-400 hover:text-amber-500"
                  : "text-slate-400 hover:text-slate-600",
              )}
              title={isFav ? "Favorited" : "Add to favorites"}
            >
              <Star className={cn("size-4", isFav && "fill-amber-400")} />
            </button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsShareOpen(true)}
              className="text-xs font-semibold"
            >
              <Share2 className="size-3.5 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tab Bar Navigation (Studley 9 Tabs) ── */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
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
                    "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer",
                    isActive
                      ? "bg-brand-navy text-white shadow-xs dark:bg-blue-600"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{t.label}</span>
                  {t.badge !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px]",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
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
      </div>

      {/* ── Active Tab Workspace Area ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* 1. OVERVIEW */}
        {activeTab === "overview" && (
          <StudySetOverviewTab
            studySet={studySet}
            onNavigateTab={(tab) => setActiveTab(tab as StudySetTabKey)}
            onPracticeWeakAreas={handlePracticeWeakAreas}
          />
        )}

        {/* 2. AI TUTOR (Grounded on this study set) */}
        {activeTab === "tutor" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-200/60 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="size-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <h3 className="font-serif text-sm font-bold text-slate-900 dark:text-white">
                    Grounded AI Tutor: {studySet.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This tutor is grounded strictly on your {studySet.sources.length} ingested sources. Ask anything!
                  </p>
                </div>
              </div>
            </div>

            <AIChat
              initialCourse={`${studySet.title} (${studySet.courseCode || studySet.subject})`}
              initialTool="tutor"
              initialPrompt={`I am studying "${studySet.title}". Please quiz me or explain the hardest concept from our source material!`}
            />
          </div>
        )}

        {/* 3. FLASHCARDS */}
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
          />
        )}

        {/* 5. WRITTEN TEST */}
        {activeTab === "written" && <StudySetWrittenTab studySet={studySet} />}

        {/* 6. FILL IN THE BLANKS */}
        {activeTab === "fillblanks" && <StudySetFillBlanksTab studySet={studySet} />}

        {/* 7. AI NOTES & FORMULAS */}
        {activeTab === "notes" && <StudySetNotesTab studySet={studySet} />}

        {/* 8. AI PODCAST */}
        {activeTab === "podcast" && (
          <div className="space-y-6">
            <AiPodcastPlayer
              podcast={{
                title: studySet.podcast.title,
                hosts: studySet.podcast.hosts,
                durationEstimate: studySet.podcast.durationEstimate,
                dialogue: studySet.podcast.dialogue.map((d) => ({
                  id: d.id,
                  speaker: d.speaker.includes("Jordan") ? "Jordan" : "Alex",
                  text: d.text,
                  role: d.role,
                })),
              }}
            />
          </div>
        )}

        {/* 9. SOURCES */}
        {activeTab === "sources" && <StudySetSourcesTab studySet={studySet} />}
      </div>

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

