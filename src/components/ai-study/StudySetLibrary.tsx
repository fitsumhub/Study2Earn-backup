import {
  Archive,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Edit2,
  Eye,
  FileText,
  Filter,
  Folder,
  LayoutGrid,
  List,
  ListChecks,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { CreateStudySetModal, type IngestionTab } from "./CreateStudySetModal";
import { StudySetCard } from "./StudySetCard";

interface StudySetLibraryProps {
  onOpenStudySet: (setId: string, tab?: string) => void;
  onStartStudyingWithAi?: () => void;
  createModalTab?: IngestionTab;
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
  onOpenCreateWithTab?: (tab: IngestionTab) => void;
}

type FilterTab = "all" | "in_progress" | "mastered" | "favorites" | "archived";
type SortOption = "recent" | "mastery" | "cards" | "alphabetical";

const SORT_LABELS: Record<SortOption, string> = {
  recent: "Last viewed",
  mastery: "Highest mastery",
  cards: "Most flashcards",
  alphabetical: "Title (A-Z)",
};

export function StudySetLibrary({
  onOpenStudySet,
  onStartStudyingWithAi,
  createModalTab: externalCreateTab,
  isCreateModalOpen: externalIsCreateOpen,
  onCloseCreateModal: externalOnCloseCreate,
  onOpenCreateWithTab,
}: StudySetLibraryProps) {
  const [studySets, setStudySets] = useState<StudySet[]>(() => getStudySets());
  const [folders, setFolders] = useState<StudySetFolder[]>(() => getStudySetFolders());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Search & Sort UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Internal create modal state (used if parent doesn't manage it)
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const [internalCreateTab, setInternalCreateTab] = useState<IngestionTab>("files");

  const isModalOpen = externalIsCreateOpen ?? internalCreateOpen;
  const activeCreateTab = externalCreateTab ?? internalCreateTab;

  const handleOpenCreate = (tab: IngestionTab = "files") => {
    if (onOpenCreateWithTab) {
      onOpenCreateWithTab(tab);
    } else {
      setInternalCreateTab(tab);
      setInternalCreateOpen(true);
    }
  };

  const handleCloseCreate = () => {
    if (externalOnCloseCreate) {
      externalOnCloseCreate();
    } else {
      setInternalCreateOpen(false);
    }
  };

  // Modals for rename and share
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

  const handleSaveRename = () => {
    if (!renameTarget || !renameText.trim()) return;
    const all = getStudySets();
    const idx = all.findIndex((s) => s.id === renameTarget.id);
    if (idx >= 0) {
      all[idx].title = renameText.trim();
      localStorage.setItem("study2earn-ai-study-sets-v2", JSON.stringify(all));
      window.dispatchEvent(new Event("study-sets-change"));
      reloadData();
    }
    setRenameTarget(null);
  };

  const handleShare = (set: StudySet) => {
    setShareTarget(set);
    setShareCopied(false);
  };

  const handleCopyShareLink = () => {
    if (!shareTarget) return;
    const url = `${window.location.origin}/ai-study?set=${shareTarget.id}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Section Header matching the reference screenshot ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Accent bar + "All Study Sets" */}
        <div className="flex items-center gap-2.5">
          <span className="h-5 sm:h-6 w-1 rounded-full bg-slate-900 dark:bg-white inline-block" />
          <h2 className="font-sans text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            All Study Sets
          </h2>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {filteredSets.length}
          </span>
        </div>

        {/* Right Toolbar: Search, Sort, View Toggle */}
        <div className="flex items-center gap-2">
          {/* Search Toggle / Input */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="relative flex items-center animate-in fade-in duration-150">
                <Search className="absolute left-3 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="h-9 w-44 sm:w-56 rounded-xl border border-slate-200 bg-white pl-9 pr-7 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="flex size-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition cursor-pointer"
                title="Search study sets"
              >
                <Search className="size-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSortMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition cursor-pointer"
            >
              <Eye className="size-3.5 text-slate-400" />
              <span>{SORT_LABELS[sortOption]}</span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>

            {isSortMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsSortMenuOpen(false)}
                />
                <div className="absolute right-0 top-10 z-40 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95 duration-100">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSortOption(key);
                        setIsSortMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition",
                        sortOption === key
                          ? "bg-slate-50 font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60",
                      )}
                    >
                      <span>{SORT_LABELS[key]}</span>
                      {sortOption === key && <Check className="size-3 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View Mode Toggle: Grid & List */}
          <div className="flex items-center rounded-xl border border-slate-200/90 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-lg p-1.5 transition cursor-pointer",
                viewMode === "grid"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
              )}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-lg p-1.5 transition cursor-pointer",
                viewMode === "list"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
              )}
              title="List View"
            >
              <List className="size-4" />
            </button>
          </div>

          {/* Quick "+ Create Set" */}
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenCreate("files")}
            className="hidden sm:inline-flex bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-xl shadow-xs transition"
          >
            <Plus className="size-3.5 mr-1 text-amber-400" />
            Create
          </Button>
        </div>
      </div>

      {/* ── Optional Category Filter Chips (Compact) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: "all", label: "All Sets" },
          { id: "in_progress", label: "In Progress" },
          { id: "mastered", label: "Mastered" },
          { id: "favorites", label: "Favorites" },
          { id: "archived", label: "Archived" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id as FilterTab)}
            className={cn(
              "rounded-xl px-3 py-1 text-xs font-semibold transition cursor-pointer shrink-0",
              activeFilter === f.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400",
            )}
          >
            {f.label}
          </button>
        ))}

        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            onClick={() =>
              setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id)
            }
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition cursor-pointer shrink-0 border",
              selectedFolderId === folder.id
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold"
                : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: folder.color }}
            />
            <span>{folder.name}</span>
          </button>
        ))}
      </div>

      {/* ── Study Sets Rendering (List View vs Grid View) ── */}
      {filteredSets.length > 0 ? (
        viewMode === "list" ? (
          /* ── EXACT LIST VIEW ROW MATCHING REFERENCE SCREENSHOT ── */
          <div className="space-y-3">
            {filteredSets.map((set) => (
              <StudySetListRow
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
          /* ── GRID VIEW ── */
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
        )
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto size-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-white">
            No Study Sets Found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No study sets matching "${searchQuery}". Try another keyword or clear filters.`
              : "You haven't created any study sets in this view yet."}
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
                setSelectedFolderId(null);
              }}
              variant="outline"
              className="text-xs font-semibold"
            >
              Clear Filters
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleOpenCreate("files")}
              className="bg-slate-900 text-white font-bold text-xs"
            >
              <Plus className="size-3.5 mr-1 text-amber-400" />
              Create Study Set
            </Button>
          </div>
        </div>
      )}

      {/* ── Create Study Set Modal ── */}
      <CreateStudySetModal
        isOpen={isModalOpen}
        initialTab={activeCreateTab}
        onClose={handleCloseCreate}
        onSuccess={(newSetId) => {
          reloadData();
          onOpenStudySet(newSetId);
        }}
      />

      {/* ── Rename Modal ── */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Rename Study Set
            </h3>
            <input
              type="text"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRenameTarget(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveRename}
                className="bg-slate-900 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share Modal ── */}
      {shareTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Share Study Set
            </h3>
            <p className="text-xs text-slate-500">
              Anyone with this link can practice and review this study set:
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-2 dark:bg-slate-800 text-xs">
              <span className="flex-1 truncate text-slate-700 dark:text-slate-300">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/ai-study?set=${shareTarget.id}`
                  : ""}
              </span>
              <Button
                size="sm"
                onClick={handleCopyShareLink}
                className="shrink-0 bg-slate-900 text-white text-xs"
              >
                {shareCopied ? (
                  <>
                    <Check className="size-3.5 mr-1 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 mr-1" /> Copy Link
                  </>
                )}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareTarget(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   StudySetListRow Component (Exact UI match to user's reference screenshot)
───────────────────────────────────────────────────────────────────────────── */
interface StudySetListRowProps {
  studySet: StudySet;
  onOpen: (setId: string, tab?: string) => void;
  onRename: (studySet: StudySet) => void;
  onDuplicate: (setId: string) => void;
  onDelete: (setId: string) => void;
  onShare: (studySet: StudySet) => void;
}

function StudySetListRow({
  studySet,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onShare,
}: StudySetListRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Card mastery calculations
  const totalCards = studySet.flashcards.length;
  const masteredCards = studySet.flashcards.filter((c) => c.mastery === "mastered").length;
  const familiarCards = studySet.flashcards.filter((c) => c.mastery === "familiar").length;
  const learningCards = studySet.flashcards.filter((c) => c.mastery === "learning").length;
  const unfamiliarCards = totalCards - masteredCards - familiarCards - learningCards;
  const overallScore = studySet.progress.overallPct;

  return (
    <div
      onClick={() => onOpen(studySet.id)}
      className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white px-5 sm:px-6 py-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 cursor-pointer"
    >
      {/* ── Left: Title & Progress Bar ── */}
      <div className="space-y-1.5 min-w-0 flex-1 max-w-md">
        <h3 className="font-sans text-base font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 transition-colors truncate">
          {studySet.title}
        </h3>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-400 tabular-nums">
            {overallScore}%
          </span>
          <div className="h-1.5 w-32 sm:w-44 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex">
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
                className="bg-blue-600"
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Middle: The 4 Mastery Status Pills (Exact colors from screenshot) ── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Unfamiliar Pill (Red) */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50/90 px-2.5 py-0.5 text-xs text-rose-600 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-400 font-bold">
          <span className="font-black">{unfamiliarCards}</span>
          <span className="font-semibold text-rose-500/90 dark:text-rose-400/90">Unfamiliar</span>
        </div>

        {/* Learning Pill (Orange) */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50/90 px-2.5 py-0.5 text-xs text-amber-600 dark:border-amber-950 dark:bg-amber-950/40 dark:text-amber-400 font-bold">
          <span className="font-black">{learningCards}</span>
          <span className="font-semibold text-amber-500/90 dark:text-amber-400/90">Learning</span>
        </div>

        {/* Familiar Pill (Blue) */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/90 px-2.5 py-0.5 text-xs text-blue-600 dark:border-blue-950 dark:bg-blue-950/40 dark:text-blue-400 font-bold">
          <span className="font-black">{familiarCards}</span>
          <span className="font-semibold text-blue-500/90 dark:text-blue-400/90">Familiar</span>
        </div>

        {/* Mastered Pill (Green) */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/90 px-2.5 py-0.5 text-xs text-emerald-600 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold">
          <span className="font-black">{masteredCards}</span>
          <span className="font-semibold text-emerald-500/90 dark:text-emerald-400/90">Mastered</span>
        </div>
      </div>

      {/* ── Right: Quick Action Buttons (Peach/Coral buttons + options) ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Button 1: Quiz / Flashcard Practice */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(studySet.id, "flashcards");
          }}
          title="Practice Flashcards & Quiz"
          className="flex size-9 items-center justify-center rounded-xl bg-orange-100/90 text-orange-600 hover:bg-orange-200/90 dark:bg-orange-950/50 dark:text-orange-400 transition cursor-pointer"
        >
          <ListChecks className="size-4.5" />
        </button>

        {/* Button 2: Study Notes & Cheat Sheet */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(studySet.id, "notes");
          }}
          title="Study Notes & Summary"
          className="flex size-9 items-center justify-center rounded-xl bg-orange-100/90 text-orange-600 hover:bg-orange-200/90 dark:bg-orange-950/50 dark:text-orange-400 transition cursor-pointer"
        >
          <FileText className="size-4.5" />
        </button>

        {/* Button 3: More Options Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            title="More options"
            className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <MoreHorizontal className="size-5" />
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
                className="absolute right-0 top-10 z-40 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95 duration-150"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpen(studySet.id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
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
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Share2 className="size-3.5 text-slate-500" />
                  Share Link
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete(studySet.id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
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
  );
}
