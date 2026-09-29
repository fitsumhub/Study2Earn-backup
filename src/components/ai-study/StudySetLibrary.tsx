import {
  Archive,
  BookOpen,
  Brain,
  CheckCircle2,
  Filter,
  Flame,
  Folder,
  FolderPlus,
  GraduationCap,
  Layers,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createStudySetFolder,
  deleteStudySet,
  duplicateStudySet,
  getStudySetFolders,
  getStudySets,
  type StudySet,
  type StudySetFolder,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";
import { CreateStudySetModal } from "./CreateStudySetModal";
import { StudySetCard } from "./StudySetCard";

interface StudySetLibraryProps {
  onOpenStudySet: (setId: string, tab?: string) => void;
  onStartStudyingWithAi?: () => void;
}

type FilterTab = "all" | "in_progress" | "mastered" | "favorites" | "archived";
type SortOption = "recent" | "mastery" | "cards" | "alphabetical";

export function StudySetLibrary({
  onOpenStudySet,
  onStartStudyingWithAi,
}: StudySetLibraryProps) {
  const [studySets, setStudySets] = useState<StudySet[]>(() => getStudySets());
  const [folders, setFolders] = useState<StudySetFolder[]>(() => getStudySetFolders());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<StudySet | null>(null);
  const [renameText, setRenameText] = useState("");
  const [shareTarget, setShareTarget] = useState<StudySet | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const reloadData = () => {
    setStudySets(getStudySets());
    setFolders(getStudySetFolders());
  };

  const handleDuplicate = (id: string) => {
    duplicateStudySet(id);
    reloadData();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this study set?")) {
      deleteStudySet(id);
      reloadData();
    }
  };

  const handleRename = (set: StudySet) => {
    setRenameTarget(set);
    setRenameText(set.title);
  };

  const handleShare = (set: StudySet) => {
    setShareTarget(set);
  };

  // Filtered & Sorted study sets
  const filteredSets = useMemo(() => {
    let list = studySets;

    // Filter tab
    if (activeFilter === "favorites") {
      list = list.filter((s) => s.isFavorite && !s.isArchived);
    } else if (activeFilter === "in_progress") {
      list = list.filter((s) => s.progress.overallPct > 0 && s.progress.overallPct < 80 && !s.isArchived);
    } else if (activeFilter === "mastered") {
      list = list.filter((s) => s.progress.overallPct >= 80 && !s.isArchived);
    } else if (activeFilter === "archived") {
      list = list.filter((s) => s.isArchived);
    } else {
      list = list.filter((s) => !s.isArchived);
    }

    // Folder filter
    if (selectedFolderId) {
      list = list.filter((s) => s.folderId === selectedFolderId);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.subject.toLowerCase().includes(q) ||
          (s.courseCode && s.courseCode.toLowerCase().includes(q)) ||
          s.description.toLowerCase().includes(q) ||
          s.sources.some((src) => src.title.toLowerCase().includes(q)),
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortOption === "recent") {
        return (
          new Date(b.lastStudiedAt || b.createdAt).getTime() -
          new Date(a.lastStudiedAt || a.createdAt).getTime()
        );
      }
      if (sortOption === "mastery") {
        return b.progress.overallPct - a.progress.overallPct;
      }
      if (sortOption === "cards") {
        return b.flashcards.length - a.flashcards.length;
      }
      if (sortOption === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [studySets, activeFilter, selectedFolderId, searchQuery, sortOption]);

  // Overall platform stats
  const totalSetsCount = studySets.filter((s) => !s.isArchived).length;
  const totalMasteredCards = studySets.reduce(
    (acc, s) => acc + s.flashcards.filter((c) => c.mastery === "mastered").length,
    0,
  );
  const avgAccuracy =
    studySets.length > 0
      ? Math.round(
          studySets.reduce((acc, s) => acc + s.progress.quizAccuracyPct, 0) / studySets.length,
        )
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── Top Bar: Search, Stats & Primary "+ Create Study Set" ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-navy dark:text-white flex items-center gap-2.5">
            <Layers className="size-6 text-brand-gold" />
            AI Study Sets Library
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            One source → one study set → multiple AI study modes (Flashcards, Quizzes, Written Tests, AI Tutor)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs shadow-md transition hover:scale-102 active:scale-98"
          >
            <Plus className="size-4 mr-1.5 text-brand-gold" />
            Create Study Set
          </Button>
        </div>
      </div>

      {/* ── Quick Stats Metrics Banner ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Layers className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Study Sets
              </p>
              <p className="font-serif text-2xl font-black text-slate-900 dark:text-white">
                {totalSetsCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Mastered Cards
              </p>
              <p className="font-serif text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {totalMasteredCards}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Trophy className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Avg Quiz Accuracy
              </p>
              <p className="font-serif text-2xl font-black text-purple-600 dark:text-purple-400">
                {avgAccuracy}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Flame className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Study Streak
              </p>
              <p className="font-serif text-2xl font-black text-amber-600 dark:text-amber-400">
                4 Days 🔥
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search, Filters & Sort Controls ── */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by title, subject, course code, or material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-xs rounded-xl"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                activeFilter === "all"
                  ? "bg-brand-navy text-white dark:bg-blue-600"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400",
              )}
            >
              All Sets
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("in_progress")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                activeFilter === "in_progress"
                  ? "bg-brand-navy text-white dark:bg-blue-600"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400",
              )}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("mastered")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                activeFilter === "mastered"
                  ? "bg-brand-navy text-white dark:bg-blue-600"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400",
              )}
            >
              Mastered
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("favorites")}
              className={cn(
                "flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                activeFilter === "favorites"
                  ? "bg-brand-navy text-white dark:bg-blue-600"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400",
              )}
            >
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span>Favorites</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("archived")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                activeFilter === "archived"
                  ? "bg-brand-navy text-white dark:bg-blue-600"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400",
              )}
            >
              Archived
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
            >
              <option value="recent">Recently Studied</option>
              <option value="mastery">Highest Mastery</option>
              <option value="cards">Most Flashcards</option>
              <option value="alphabetical">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Folders Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Folder className="size-3" />
            Folders:
          </span>
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer",
              selectedFolderId === null
                ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            All Folders
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFolderId(f.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer",
                selectedFolderId === f.id
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: f.color }}
              />
              <span>{f.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Study Sets Cards Grid ── */}
      {filteredSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSets.map((set) => (
            <StudySetCard
              key={set.id}
              studySet={set}
              onOpen={(setId, tab) => onOpenStudySet(setId, tab)}
              onRename={handleRename}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto size-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
            No Study Sets Found
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery
              ? `No study sets matching "${searchQuery}". Try another keyword or clear search.`
              : "You haven't created any study sets in this filter yet."}
          </p>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("all");
              setSelectedFolderId(null);
            }}
            variant="outline"
            className="mt-4 text-xs font-semibold mr-2"
          >
            Clear Filters
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs"
          >
            <Plus className="size-3.5 mr-1 text-brand-gold" />
            Create Study Set
          </Button>
        </div>
      )}

      {/* ── Create Study Set Modal ── */}
      <CreateStudySetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newSetId) => {
          reloadData();
          onOpenStudySet(newSetId);
        }}
      />
    </div>
  );
}

