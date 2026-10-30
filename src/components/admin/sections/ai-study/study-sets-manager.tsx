import {
  AlertCircle,
  BookOpen,
  Check,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileQuestion,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Layers,
  MoreVertical,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createStudySet,
  deleteStudySet,
  duplicateStudySet,
  exportAllStudySetsJson,
  getStudySets,
  importStudySetsJson,
  resetToDefaultSeedStudySets,
  subscribeStudySets,
  toggleFavoriteStudySet,
  updateStudySet,
  type StudySet,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";

const SUBJECT_OPTIONS = [
  "All",
  "Computer Science",
  "Physics",
  "Mathematics",
  "Biology",
  "Chemistry",
  "Economics",
  "Engineering",
  "General",
];

export function StudySetsManager() {
  const [studySets, setStudySets] = useState<StudySet[]>(() => getStudySets());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Detail / Preview modal state
  const [previewSet, setPreviewSet] = useState<StudySet | null>(null);
  const [previewTab, setPreviewTab] = useState<"overview" | "flashcards" | "quizzes" | "written" | "fillblanks" | "sources">("overview");

  // Edit modal state
  const [editingSet, setEditingSet] = useState<StudySet | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCourseCode, setEditCourseCode] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Create new set modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newSubject, setNewSubject] = useState("Computer Science");
  const [newDescription, setNewDescription] = useState("");
  const [newInitialCardFront, setNewInitialCardFront] = useState("");
  const [newInitialCardBack, setNewInitialCardBack] = useState("");

  // Import JSON modal state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");

  // Delete confirm modal state
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);

  // Subscribe to changes in the store
  useEffect(() => {
    const unsub = subscribeStudySets(() => {
      setStudySets(getStudySets());
    });
    return unsub;
  }, []);

  // Filter study sets
  const filteredSets = useMemo(() => {
    return studySets.filter((set) => {
      const matchesSearch =
        searchQuery === "" ||
        set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject =
        selectedSubject === "All" ||
        set.subject.toLowerCase() === selectedSubject.toLowerCase();

      return matchesSearch && matchesSubject;
    });
  }, [studySets, searchQuery, selectedSubject]);

  // Aggregate stats
  const totalFlashcards = useMemo(
    () => studySets.reduce((sum, s) => sum + (s.flashcards?.length || 0), 0),
    [studySets],
  );
  const totalQuizzes = useMemo(
    () => studySets.reduce((sum, s) => sum + (s.quizzes?.length || 0), 0),
    [studySets],
  );
  const totalWritten = useMemo(
    () => studySets.reduce((sum, s) => sum + (s.writtenTests?.length || 0), 0),
    [studySets],
  );
  const totalFillBlanks = useMemo(
    () => studySets.reduce((sum, s) => sum + (s.fillBlanks?.length || 0), 0),
    [studySets],
  );

  // Handlers
  const handleOpenEdit = (set: StudySet) => {
    setEditingSet(set);
    setEditTitle(set.title);
    setEditCourseCode(set.courseCode);
    setEditSubject(set.subject);
    setEditDescription(set.description);
  };

  const handleSaveEdit = () => {
    if (!editingSet) return;
    if (!editTitle.trim()) {
      toast.error("Please enter a title for the study set.");
      return;
    }

    updateStudySet(editingSet.id, {
      title: editTitle.trim(),
      courseCode: editCourseCode.trim() || "GEN 1000",
      subject: editSubject.trim() || "General",
      description: editDescription.trim(),
    });

    toast.success("Study set updated successfully!");
    setEditingSet(null);
  };

  const handleDuplicate = (id: string) => {
    const copy = duplicateStudySet(id);
    if (copy) {
      toast.success(`Duplicated "${copy.title}"`);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingSetId) return;
    deleteStudySet(deletingSetId);
    toast.success("Study set deleted.");
    setDeletingSetId(null);
  };

  const handleCreateNew = () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a title for the study set.");
      return;
    }

    const created = createStudySet({
      title: newTitle.trim(),
      courseCode: newCourseCode.trim() || "GEN 1000",
      subject: newSubject,
      description: newDescription.trim() || "Official University Study Set created by Admin.",
      sources: [
        {
          id: `src-${Date.now()}`,
          title: `${newTitle.trim()} Curriculum Reference`,
          type: "notes",
          contentSnippet: newDescription.trim() || "Admin created curriculum reference source.",
          uploadedAt: new Date().toISOString(),
        },
      ],
      flashcards: newInitialCardFront.trim() && newInitialCardBack.trim()
        ? [
            {
              id: `fc-${Date.now()}`,
              front: newInitialCardFront.trim(),
              back: newInitialCardBack.trim(),
              topic: "Core Fundamentals",
              mastery: "unfamiliar",
              reviewCount: 0,
            },
          ]
        : [
            {
              id: `fc-${Date.now()}`,
              front: `What is the primary scope of ${newTitle.trim()}?`,
              back: `Foundational study of key principles, models, and exam problem-solving in ${newSubject}.`,
              topic: "Overview",
              mastery: "unfamiliar",
              reviewCount: 0,
            },
          ],
      quizzes: [
        {
          id: `qz-${Date.now()}`,
          question: `Which fundamental principle is central to ${newTitle.trim()}?`,
          options: [
            "Rigorous empirical verification and structured models",
            "Random trial and uncontrolled observation",
            "Unbounded subjective conjecture",
            "Heuristic approximation without validation",
          ],
          correctIndex: 0,
          explanation: `Academic curricula in ${newSubject} require strict empirical verification and disciplined structured frameworks.`,
          topic: "Foundations",
          difficulty: "medium",
        },
      ],
      writtenTests: [
        {
          id: `wt-${Date.now()}`,
          prompt: `Explain the fundamental importance of ${newTitle.trim()} in ${newSubject}. Provide at least two key applications.`,
          modelAnswer: `Understanding this core topic provides theoretical grounding and practical frameworks required for university level exit exams. Key applications include systematic problem decomposition and rigorous analysis.`,
          keyRubricPoints: [
            "Clear conceptual definition",
            "Two distinct practical applications",
            "Discussion of theoretical significance",
          ],
          topic: "Core Synthesis",
          marks: 10,
        },
      ],
      fillBlanks: [
        {
          id: `fb-${Date.now()}`,
          sentenceWithBlank: `In ${newSubject}, the foundational study of ${newTitle.trim()} establishes [blank] for subsequent advanced topics.`,
          blankAnswer: "principles",
          acceptedAlternatives: ["core principles", "fundamentals", "the basis"],
          explanation: "Foundational topics establish the core principles for future advanced coursework.",
          topic: "Terminology",
        },
      ],
      notes: {
        summary: newDescription.trim() || `Official academic study set for ${newTitle.trim()} (${newCourseCode.trim() || newSubject}).`,
        keyConcepts: [
          {
            concept: newTitle.trim(),
            explanation: `Foundational study set covering core principles of ${newSubject}.`,
          },
        ],
        definitions: [
          {
            term: newTitle.trim(),
            definition: `Official curriculum domain in ${newSubject}.`,
          },
        ],
        formulasAndRules: [],
        studyTips: [
          "Review flashcards daily using spaced repetition.",
          "Practice written test rubrics for full exam marks.",
        ],
      },
      podcast: {
        title: `${newTitle.trim()} Audio Masterclass`,
        hosts: ["Alex (Tutor)", "Jordan (Student)"],
        durationEstimate: "5 mins",
        dialogue: [
          {
            id: `pod-1`,
            speaker: "Alex (Tutor)",
            role: "Academic AI Tutor",
            text: `Welcome to our review of ${newTitle.trim()}. Let's break down the most essential concepts!`,
          },
        ],
      },
    });

    toast.success(`Created study set "${created.title}"!`);
    setIsCreateOpen(false);
    setNewTitle("");
    setNewCourseCode("");
    setNewDescription("");
    setNewInitialCardFront("");
    setNewInitialCardBack("");
  };

  const handleResetSeeds = () => {
    if (window.confirm("Restore official Ethiopian University exit exam seed study sets? This will ensure all standard verified courses are available.")) {
      resetToDefaultSeedStudySets();
      toast.success("Restored official Ethiopian MoE university seed curricula!");
    }
  };

  const handleExportAll = () => {
    const jsonStr = exportAllStudySetsJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study2earn-curricula-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("All study sets exported as JSON file.");
  };

  const handleExportSingle = (set: StudySet) => {
    const jsonStr = JSON.stringify(set, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${set.courseCode.replace(/\s+/g, "_")}_${set.title.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported "${set.title}" as JSON.`);
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) {
      toast.error("Please paste JSON text or select a valid file.");
      return;
    }
    const res = importStudySetsJson(importJsonText);
    if (res.success) {
      toast.success(`Successfully imported ${res.count} study sets!`);
      setIsImportOpen(false);
      setImportJsonText("");
    } else {
      toast.error(`Import failed: ${res.error}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* ── Subheader & Curriculum Stats ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200/80 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Study Sets</p>
              <h3 className="mt-1 font-serif text-2xl font-bold text-brand-navy">{studySets.length}</h3>
              <p className="text-[11px] text-slate-500">{filteredSets.length} matching filter</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
              <BookOpen className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200/80 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Flashcards Bank</p>
              <h3 className="mt-1 font-serif text-2xl font-bold text-brand-navy">{totalFlashcards}</h3>
              <p className="text-[11px] text-slate-500">Spaced-repetition cards</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Layers className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200/80 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Practice Quizzes</p>
              <h3 className="mt-1 font-serif text-2xl font-bold text-brand-navy">{totalQuizzes}</h3>
              <p className="text-[11px] text-slate-500">Multiple-choice items</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <FileQuestion className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200/80 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Written & Blanks</p>
              <h3 className="mt-1 font-serif text-2xl font-bold text-brand-navy">{totalWritten + totalFillBlanks}</h3>
              <p className="text-[11px] text-slate-500">{totalWritten} Rubrics · {totalFillBlanks} Blanks</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
              <GraduationCap className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Toolbar: Search, Subject Filters, Global Actions ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Search & Subject filter */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search title, course code, topic…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs bg-slate-50/70 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[170px] text-xs bg-slate-50/70">
              <Filter className="size-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="Filter subject" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECT_OPTIONS.map((sub) => (
                <SelectItem key={sub} value={sub} className="text-xs">
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 bg-brand-navy text-white hover:bg-brand-navy/90 text-xs font-semibold shadow-sm"
          >
            <Plus className="size-4" />
            New Official Study Set
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetSeeds}
            title="Restore official Ethiopian university seed sets"
            className="gap-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="size-3.5 text-brand-gold" />
            Reset MoE Seeds
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            title="Backup all study sets as JSON"
            className="gap-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-3.5" />
            Export Backup
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            title="Import study sets from JSON"
            className="gap-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            <Upload className="size-3.5" />
            Import JSON
          </Button>
        </div>
      </div>

      {/* ── Study Sets Cards Grid ── */}
      {filteredSets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookOpen className="size-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-serif text-lg font-bold text-brand-navy">No Study Sets Found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            No study sets matched your search query or subject filter. Try clearing filters or create a new official set.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedSubject("All");
              }}
              className="text-xs"
            >
              Clear Filters
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleResetSeeds}
              className="text-xs bg-brand-navy text-white"
            >
              Restore Seed Sets
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSets.map((set) => {
            const fcCount = set.flashcards?.length || 0;
            const qzCount = set.quizzes?.length || 0;
            const wtCount = set.writtenTests?.length || 0;
            const fbCount = set.fillBlanks?.length || 0;
            const srcCount = set.sources?.length || 0;

            return (
              <div
                key={set.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-brand-navy/40 hover:shadow-md"
              >
                <div>
                  {/* Top Bar: Subject, Course Code & Star */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className="bg-brand-navy/10 text-brand-navy border-brand-navy/20 font-bold text-[10px]">
                        {set.courseCode || "GEN 1000"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-50">
                        {set.subject}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFavoriteStudySet(set.id)}
                        className="rounded-lg p-1 text-slate-400 hover:text-amber-500 transition"
                        title={set.isFavorite ? "Remove favorite" : "Mark favorite"}
                      >
                        <Star
                          className={cn("size-4", set.isFavorite && "fill-amber-400 text-amber-500")}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="mt-3 font-serif text-base font-bold text-brand-navy leading-snug group-hover:text-blue-900 transition">
                    {set.title}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {set.description || "Comprehensive academic study set."}
                  </p>

                  {/* Micro Indicators / Badges */}
                  <div className="mt-4 grid grid-cols-4 gap-1.5 border-t border-slate-100 pt-3 text-center">
                    <div className="rounded-lg bg-slate-50 p-1.5">
                      <span className="block font-mono text-xs font-bold text-brand-navy">{fcCount}</span>
                      <span className="text-[9px] text-slate-400">Cards</span>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-1.5">
                      <span className="block font-mono text-xs font-bold text-brand-navy">{qzCount}</span>
                      <span className="text-[9px] text-slate-400">Quizzes</span>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-1.5">
                      <span className="block font-mono text-xs font-bold text-brand-navy">{wtCount}</span>
                      <span className="text-[9px] text-slate-400">Written</span>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-1.5">
                      <span className="block font-mono text-xs font-bold text-brand-navy">{srcCount}</span>
                      <span className="text-[9px] text-slate-400">Sources</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewSet(set);
                        setPreviewTab("overview");
                      }}
                      className="h-8 gap-1 text-xs font-semibold text-brand-navy border-slate-200 hover:bg-slate-50"
                    >
                      <Eye className="size-3.5" />
                      Inspect Set
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(set)}
                      className="h-8 size-8 p-0 text-slate-500 hover:text-brand-navy"
                      title="Edit study set"
                    >
                      <Edit className="size-3.5" />
                    </Button>

                    <a
                      href={`/ai-study?set=${set.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-200/80 bg-blue-50/60 px-2 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition"
                      title="Launch this study set on /ai-study as student"
                    >
                      <ExternalLink className="size-3" />
                      <span className="hidden sm:inline">Student View</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(set.id)}
                      className="h-8 size-8 p-0 text-slate-500 hover:text-brand-navy"
                      title="Duplicate / Clone"
                    >
                      <Copy className="size-3.5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportSingle(set)}
                      className="h-8 size-8 p-0 text-slate-500 hover:text-brand-navy"
                      title="Export as JSON"
                    >
                      <Download className="size-3.5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingSetId(set.id)}
                      className="h-8 size-8 p-0 text-slate-400 hover:text-red-600"
                      title="Delete study set"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          MODAL 1: INSPECT & PREVIEW STUDY SET
      ═════════════════════════════════════════════════════════════════ */}
      {previewSet && (
        <Dialog open={Boolean(previewSet)} onOpenChange={(open) => !open && setPreviewSet(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-brand-navy text-white text-[10px]">
                    {previewSet.courseCode}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {previewSet.subject}
                  </Badge>
                </div>
                <a
                  href={`/ai-study?set=${previewSet.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                >
                  Launch on /ai-study
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <DialogTitle className="font-serif text-xl font-bold text-brand-navy mt-1">
                {previewSet.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {previewSet.description}
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={previewTab}
              onValueChange={(value) => {
                if (
                  value === "overview" ||
                  value === "flashcards" ||
                  value === "quizzes" ||
                  value === "written" ||
                  value === "fillblanks" ||
                  value === "sources"
                ) {
                  setPreviewTab(value);
                }
              }}
              className="w-full mt-2"
            >
              <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-9 rounded-xl bg-slate-100 p-1 text-xs">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="flashcards" className="text-xs">Flashcards ({previewSet.flashcards?.length || 0})</TabsTrigger>
                <TabsTrigger value="quizzes" className="text-xs">Quizzes ({previewSet.quizzes?.length || 0})</TabsTrigger>
                <TabsTrigger value="written" className="text-xs">Written ({previewSet.writtenTests?.length || 0})</TabsTrigger>
                <TabsTrigger value="fillblanks" className="text-xs">Blanks ({previewSet.fillBlanks?.length || 0})</TabsTrigger>
                <TabsTrigger value="sources" className="text-xs">Sources ({previewSet.sources?.length || 0})</TabsTrigger>
              </TabsList>

              {/* TAB 1: OVERVIEW & NOTES */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Executive Summary</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {previewSet.notes?.summary || previewSet.description}
                  </p>
                </div>

                {previewSet.notes?.keyConcepts && previewSet.notes.keyConcepts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-brand-navy">Core Concepts ({previewSet.notes.keyConcepts.length}):</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {previewSet.notes.keyConcepts.map((kc, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 bg-white p-3 space-y-1 shadow-2xs">
                          <p className="text-xs font-bold text-brand-navy">{kc.concept}</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{kc.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewSet.notes?.definitions && previewSet.notes.definitions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-brand-navy">Key Definitions:</h4>
                    <div className="space-y-1.5">
                      {previewSet.notes.definitions.map((def, i) => (
                        <div key={i} className="rounded-lg bg-slate-50 p-2.5 text-xs flex gap-2">
                          <span className="font-bold text-brand-navy shrink-0">{def.term}:</span>
                          <span className="text-slate-600">{def.definition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: FLASHCARDS */}
              <TabsContent value="flashcards" className="space-y-3 mt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {previewSet.flashcards?.map((card, i) => (
                    <div key={card.id || i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-brand-navy">Card #{i + 1}</span>
                        <Badge variant="outline" className="text-[9px] uppercase">{card.topic || "General"}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Front (Prompt):</p>
                        <p className="text-xs font-semibold text-brand-navy">{card.front}</p>
                      </div>
                      <div className="space-y-1 border-t border-slate-100 pt-2">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Back (Answer):</p>
                        <p className="text-xs text-slate-700 leading-relaxed">{card.back}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* TAB 3: QUIZZES */}
              <TabsContent value="quizzes" className="space-y-3 mt-4">
                {previewSet.quizzes?.map((q, i) => (
                  <div key={q.id || i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-2xs">
                    <div className="flex items-start gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="text-xs font-bold text-brand-navy">{q.question}</p>
                    </div>

                    <div className="grid gap-1.5 pl-7 sm:grid-cols-2">
                      {q.options?.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctIndex;
                        return (
                          <div
                            key={optIdx}
                            className={cn(
                              "rounded-lg p-2 text-xs border",
                              isCorrect
                                ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold"
                                : "bg-slate-50 text-slate-700 border-slate-100",
                            )}
                          >
                            <span className="font-mono mr-1.5 text-slate-400">
                              {["A", "B", "C", "D"][optIdx]})
                            </span>
                            {opt}
                            {isCorrect && " ✓ (Correct)"}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="pl-7 pt-1">
                        <p className="text-[11px] text-slate-500 italic">
                          <strong>Pedagogical Explanation:</strong> {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* TAB 4: WRITTEN TESTS */}
              <TabsContent value="written" className="space-y-3 mt-4">
                {previewSet.writtenTests?.map((wt, i) => (
                  <div key={wt.id || i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                    <div>
                      <p className="text-xs font-bold text-brand-navy">Question {i + 1}: {wt.prompt}</p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3 space-y-1 border border-slate-100">
                      <p className="text-[11px] font-bold uppercase text-slate-500">Model Answer:</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{wt.modelAnswer}</p>
                    </div>

                    {wt.keyRubricPoints && wt.keyRubricPoints.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold uppercase text-slate-500">Rubric Benchmark Criteria:</p>
                        <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                          {wt.keyRubricPoints.map((rb, rIdx) => (
                            <li key={rIdx}>{rb}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* TAB 5: FILL IN BLANKS */}
              <TabsContent value="fillblanks" className="space-y-3 mt-4">
                {previewSet.fillBlanks?.map((fb, i) => (
                  <div key={fb.id || i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-2xs">
                    <p className="text-xs font-semibold text-brand-navy">
                      #{i + 1}: {fb.sentenceWithBlank}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">
                        Blank Answer: {fb.blankAnswer}
                      </Badge>
                      {fb.acceptedAlternatives && (
                        <span className="text-[11px] text-slate-500">
                          Also accepts: {fb.acceptedAlternatives.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* TAB 6: SOURCES */}
              <TabsContent value="sources" className="space-y-3 mt-4">
                {previewSet.sources?.map((src, i) => (
                  <div key={src.id || i} className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold uppercase text-xs">
                        {src.type}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-brand-navy">{src.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {src.filename || "Curriculum Resource"} · Uploaded {new Date(src.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setPreviewSet(null)}>
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          MODAL 2: EDIT STUDY SET METADATA
      ═════════════════════════════════════════════════════════════════ */}
      {editingSet && (
        <Dialog open={Boolean(editingSet)} onOpenChange={(open) => !open && setEditingSet(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-lg font-bold text-brand-navy">
                Edit Study Set
              </DialogTitle>
              <DialogDescription className="text-xs">
                Modify title, course code, and academic subject metadata.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title" className="text-xs font-semibold">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-course-code" className="text-xs font-semibold">Course Code</Label>
                  <Input
                    id="edit-course-code"
                    value={editCourseCode}
                    onChange={(e) => setEditCourseCode(e.target.value)}
                    placeholder="e.g. CoSc 3021"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Subject</Label>
                  <Select value={editSubject} onValueChange={setEditSubject}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_OPTIONS.filter((s) => s !== "All").map((sub) => (
                        <SelectItem key={sub} value={sub} className="text-xs">
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-description" className="text-xs font-semibold">Description</Label>
                <Textarea
                  id="edit-description"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingSet(null)}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleSaveEdit} className="bg-brand-navy text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          MODAL 3: CREATE NEW OFFICIAL STUDY SET
      ═════════════════════════════════════════════════════════════════ */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-brand-navy">
              Create New Official Study Set
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a new course curriculum to the public /ai-study library.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-title" className="text-xs font-semibold">Course / Study Set Title</Label>
              <Input
                id="new-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Distributed Database Architecture"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-course-code" className="text-xs font-semibold">Course Code</Label>
                <Input
                  id="new-course-code"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  placeholder="e.g. CoSc 4011"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Subject Category</Label>
                <Select value={newSubject} onValueChange={setNewSubject}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_OPTIONS.filter((s) => s !== "All").map((sub) => (
                      <SelectItem key={sub} value={sub} className="text-xs">
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-description" className="text-xs font-semibold">Syllabus / Scope Description</Label>
              <Textarea
                id="new-description"
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Core topics, theorems, and exam preparation objectives..."
                className="text-xs"
              />
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
              <p className="text-[11px] font-bold text-brand-navy">Initial Starter Flashcard (Optional):</p>
              <Input
                placeholder="Front: e.g. What is Two-Phase Commit (2PC)?"
                value={newInitialCardFront}
                onChange={(e) => setNewInitialCardFront(e.target.value)}
                className="text-xs bg-white"
              />
              <Input
                placeholder="Back: e.g. A distributed algorithm ensuring all database nodes commit or rollback."
                value={newInitialCardBack}
                onChange={(e) => setNewInitialCardBack(e.target.value)}
                className="text-xs bg-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleCreateNew} className="bg-brand-navy text-white">
              Create Study Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═════════════════════════════════════════════════════════════════
          MODAL 4: IMPORT JSON BACKUP
      ═════════════════════════════════════════════════════════════════ */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-brand-navy">
              Import Study Sets from JSON
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload a `.json` backup file or paste formatted JSON array to restore study sets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold">Select JSON File</Label>
              <Input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="mt-1 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Or Paste JSON Content</Label>
              <Textarea
                rows={6}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="[ { id: 'set-1', title: '...', ... } ]"
                className="font-mono text-xs bg-slate-50"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleImportSubmit} className="bg-brand-navy text-white">
              Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═════════════════════════════════════════════════════════════════
          MODAL 5: DELETE CONFIRMATION
      ═════════════════════════════════════════════════════════════════ */}
      <Dialog open={Boolean(deletingSetId)} onOpenChange={(open) => !open && setDeletingSetId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="size-5" />
              Delete Study Set?
            </DialogTitle>
            <DialogDescription className="text-xs">
              This action cannot be undone. All flashcards, quizzes, and rubrics in this set will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingSetId(null)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleDeleteConfirm} className="bg-red-600 text-white hover:bg-red-700">
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
