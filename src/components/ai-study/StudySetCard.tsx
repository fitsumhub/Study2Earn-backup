import {
  Archive,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  FileText,
  Headphones,
  HelpCircle,
  MoreVertical,
  Pencil,
  Share2,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type StudySet,
  toggleArchiveStudySet,
  toggleFavoriteStudySet,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";

interface StudySetCardProps {
  studySet: StudySet;
  onOpen: (setId: string, tab?: string) => void;
  onRename: (studySet: StudySet) => void;
  onDuplicate: (setId: string) => void;
  onDelete: (setId: string) => void;
  onShare: (studySet: StudySet) => void;
}

export function StudySetCard({
  studySet,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onShare,
}: StudySetCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFav, setIsFav] = useState(studySet.isFavorite);

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFav = toggleFavoriteStudySet(studySet.id);
    setIsFav(newFav);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleArchiveStudySet(studySet.id);
    setIsMenuOpen(false);
  };

  // Mastery calculation
  const totalCards = studySet.flashcards.length;
  const masteredCards = studySet.flashcards.filter((c) => c.mastery === "mastered").length;
  const familiarCards = studySet.flashcards.filter((c) => c.mastery === "familiar").length;
  const learningCards = studySet.flashcards.filter((c) => c.mastery === "learning").length;
  const unfamiliarCards = totalCards - masteredCards - familiarCards - learningCards;

  const masteredPct = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
  const overallScore = studySet.progress.overallPct;

  // Format last studied
  const formatTimeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  return (
    <div
      onClick={() => onOpen(studySet.id)}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-brand-navy/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40 cursor-pointer"
    >
      {/* Top Row: Course Code, Subject & Actions */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              {studySet.courseCode || studySet.subject}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {studySet.subject}
            </span>
            {studySet.isArchived && (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                Archived
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Favorite Star */}
            <button
              type="button"
              onClick={handleToggleFav}
              className={cn(
                "rounded-full p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800",
                isFav
                  ? "text-amber-400 hover:text-amber-500"
                  : "text-slate-300 hover:text-slate-400 dark:text-slate-600",
              )}
              title={isFav ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={cn("size-4", isFav && "fill-amber-400")} />
            </button>

            {/* More Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                title="Study set options"
              >
                <MoreVertical className="size-4" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-8 z-40 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95 duration-150"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpen(studySet.id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <BookOpen className="size-3.5 text-blue-500" />
                      Open Workspace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onRename(studySet);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="size-3.5 text-slate-500" />
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDuplicate(studySet.id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Copy className="size-3.5 text-slate-500" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onShare(studySet);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Share2 className="size-3.5 text-slate-500" />
                      Share Link
                    </button>
                    <button
                      type="button"
                      onClick={handleArchive}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Archive className="size-3.5 text-amber-500" />
                      {studySet.isArchived ? "Unarchive" : "Archive"}
                    </button>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDelete(studySet.id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="size-3.5" />
                      Delete Set
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="mt-3 font-serif text-base font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {studySet.title}
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {studySet.description}
        </p>

        {/* Sources count tag */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
          <FileText className="size-3 text-slate-400" />
          <span>
            {studySet.sources.length} {studySet.sources.length === 1 ? "source" : "sources"}
          </span>
          <span>•</span>
          <span>
            {studySet.sources
              .map((s) => s.type.toUpperCase())
              .slice(0, 3)
              .join(", ")}
          </span>
        </div>
      </div>

      {/* Middle: Included Modes Badges */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {studySet.flashcards.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onOpen(studySet.id, "flashcards");
              }}
              className="inline-flex items-center gap-1 rounded-md bg-blue-50/80 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 transition"
              title="Practice Flashcards"
            >
              <Brain className="size-3 text-blue-500" />
              {studySet.flashcards.length} Cards
            </span>
          )}
          {studySet.quizzes.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onOpen(studySet.id, "quiz");
              }}
              className="inline-flex items-center gap-1 rounded-md bg-purple-50/80 px-2 py-0.5 text-[11px] font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 transition"
              title="Take AI Quiz"
            >
              <HelpCircle className="size-3 text-purple-500" />
              {studySet.quizzes.length} Quizzes
            </span>
          )}
          {studySet.writtenTests.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onOpen(studySet.id, "written");
              }}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50/80 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
              title="Written Free Response"
            >
              <Pencil className="size-3 text-emerald-500" />
              {studySet.writtenTests.length} Written
            </span>
          )}
          {studySet.podcast && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onOpen(studySet.id, "podcast");
              }}
              className="inline-flex items-center gap-1 rounded-md bg-amber-50/80 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 transition"
              title="Listen to AI Podcast"
            >
              <Headphones className="size-3 text-amber-500" />
              Podcast
            </span>
          )}
        </div>

        {/* Mastery Progress Bar */}
        <div className="mt-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-500 dark:text-slate-400">Mastery Level</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {overallScore}%
            </span>
          </div>

          {/* Segmented or smooth progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex">
            {totalCards > 0 ? (
              <>
                <div
                  style={{ width: `${(masteredCards / totalCards) * 100}%` }}
                  className="bg-emerald-500"
                  title={`${masteredCards} Mastered`}
                />
                <div
                  style={{ width: `${(familiarCards / totalCards) * 100}%` }}
                  className="bg-blue-500"
                  title={`${familiarCards} Familiar`}
                />
                <div
                  style={{ width: `${(learningCards / totalCards) * 100}%` }}
                  className="bg-amber-400"
                  title={`${learningCards} Learning`}
                />
                <div
                  style={{ width: `${(unfamiliarCards / totalCards) * 100}%` }}
                  className="bg-slate-200 dark:bg-slate-700"
                  title={`${unfamiliarCards} Unfamiliar`}
                />
              </>
            ) : (
              <div
                style={{ width: `${overallScore}%` }}
                className="bg-blue-600 dark:bg-blue-500"
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer: Last Studied & Quick Action */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock className="size-3" />
          <span>{formatTimeAgo(studySet.lastStudiedAt || studySet.createdAt)}</span>
        </div>

        <button
          type="button"
          onClick={() => onOpen(studySet.id)}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-navy group-hover:text-blue-600 dark:text-brand-gold dark:group-hover:text-amber-300 transition"
        >
          <span>Study Now</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </div>
    </div>
  );
}

