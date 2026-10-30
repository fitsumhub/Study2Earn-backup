import {
  ArrowDownAZ,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FileUp,
  FolderPlus,
  Layers,
  LayoutGrid,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Trash2,
  Upload,
  Users,
  X,
  Zap,
  ImagePlus,
  Camera,
  RotateCcw,
} from "lucide-react";
import React, { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { BookCover } from "@/components/book-cover";
import { CategoryDialog } from "@/components/admin/category-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { useCategories } from "@/hooks/use-categories";
import type { ContentFormData } from "@/components/admin/forms/content-form";
import type { AdminContent } from "@/lib/admin-types";
import { categoryBadgeClass } from "@/lib/category-store";
import {
  downloadMediaFile,
  fileSizeLabel,
  getDocumentFormat,
  processDocumentFile,
  processImageFile,
  resolveMediaUrl,
  saveLocalFile,
  type DocumentFormat,
} from "@/lib/media-store";
import {
  generateThumbnailFromFile,
  renderAcademicCoverCanvas,
} from "@/lib/thumbnail-generator";
import { cn } from "@/lib/utils";

type SortKey = "recent" | "name" | "students" | "chapters" | "pages";
type FormatFilter = "all" | "pdf" | "ppt" | "doc" | "published" | "draft";

/** "8.2k" / "1,240" / "0" → comparable number */
function parseStudentCount(raw: string): number {
  const s = raw.trim().toLowerCase().replace(/,/g, "");
  const m = /^([\d.]+)(k|m)?$/.exec(s);
  if (!m) return -1;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return -1;
  if (m[2] === "k") return n * 1_000;
  if (m[2] === "m") return n * 1_000_000;
  return n;
}

function formatTitleFromFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function guessCategory(title: string, categoryNames: string[]): string {
  const t = title.toLowerCase();
  if (t.includes("phys") || t.includes("chem") || t.includes("bio") || t.includes("math") || t.includes("calc")) {
    const match = categoryNames.find((c) => c.toLowerCase().includes("natural") || c.toLowerCase().includes("science"));
    if (match) return match;
  }
  if (t.includes("psych") || t.includes("econ") || t.includes("geo") || t.includes("logic") || t.includes("hist")) {
    const match = categoryNames.find((c) => c.toLowerCase().includes("social"));
    if (match) return match;
  }
  if (t.includes("comp") || t.includes("code") || t.includes("prog") || t.includes("net") || t.includes("data") || t.includes("software")) {
    const match = categoryNames.find((c) => c.toLowerCase().includes("comp") || c.toLowerCase().includes("tech"));
    if (match) return match;
  }
  if (t.includes("law") || t.includes("legal") || t.includes("civic")) {
    const match = categoryNames.find((c) => c.toLowerCase().includes("law"));
    if (match) return match;
  }
  if (t.includes("med") || t.includes("nurs") || t.includes("health") || t.includes("anat")) {
    const match = categoryNames.find((c) => c.toLowerCase().includes("health") || c.toLowerCase().includes("med"));
    if (match) return match;
  }
  return categoryNames[0] || "Common";
}

export function ContentSection({ admin }: { admin: AdminDashboardState }) {
  const {
    content,
    openQuickAction,
    openEdit,
    deleteContent,
    duplicateContent,
    exportContentJson,
    importContentJson,
    toggleContentPublished,
    bulkDeleteContent,
    bulkSetContentPublished,
    bulkSetContentCategory,
    uploadContent,
  } = admin;

  const { categories: allCategories, categoryNames, addCategory } = useCategories();
  const categories = useMemo<string[]>(() => ["All", ...categoryNames], [categoryNames]);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("All");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<AdminContent | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [addingCategory, setAddingCategory] = useState(false);

  // Direct Ingest Dropzone State
  const [isDragOver, setIsDragOver] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedFormat, setStagedFormat] = useState<DocumentFormat>("pdf");
  const [stagedTitle, setStagedTitle] = useState("");
  const [stagedShort, setStagedShort] = useState("");
  const [stagedCategory, setStagedCategory] = useState("Common");
  const [stagedChapters, setStagedChapters] = useState("8");
  const [stagedPages, setStagedPages] = useState("120");
  const [stagedDescription, setStagedDescription] = useState("");
  const [stagedPublish, setStagedPublish] = useState(true);
  const [stagedCoverUrl, setStagedCoverUrl] = useState<string>("");
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverSourceType, setCoverSourceType] = useState<"auto" | "custom">("auto");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressPct, setUploadProgressPct] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const publishedCount = content.filter((c) => c.published).length;
  const draftCount = content.filter((c) => !c.published).length;
  const totalChaptersCount = content.reduce((sum, c) => sum + (c.chapters || 0), 0);
  const totalPagesCount = content.reduce((sum, c) => sum + (c.pages || 0), 0);

  const materialStats = useMemo(() => {
    let pdf = 0;
    let ppt = 0;
    let doc = 0;
    let total = 0;
    for (const c of content) {
      if (c.pdfUrl) {
        total++;
        const fmt = getDocumentFormat(c.pdfUrl);
        if (fmt === "pdf") pdf++;
        else if (fmt === "ppt") ppt++;
        else if (fmt === "doc") doc++;
      }
    }
    return { pdf, ppt, doc, total };
  }, [content]);

  // Stage File Handler with Auto Thumbnail Extraction
  const handleStageFile = async (file: File) => {
    const fmt = getDocumentFormat(file.name);
    const title = formatTitleFromFilename(file.name);
    const guessed = guessCategory(title, categoryNames);
    const words = title.split(" ").slice(0, 2).join(" ");

    setStagedFile(file);
    setStagedFormat(fmt);
    setStagedTitle(title);
    setStagedShort(words || "Course");
    setStagedCategory(guessed);
    setStagedChapters(fmt === "ppt" ? "12" : "8");
    setStagedPages(fmt === "ppt" ? "36" : "160");
    setStagedDescription(`Official courseware & syllabus material for ${title}.`);
    setStagedPublish(true);

    // Auto-generate thumbnail from file
    setIsGeneratingCover(true);
    try {
      const generated = await generateThumbnailFromFile(file, { title, category: guessed });
      setStagedCoverUrl(generated);
      setCoverSourceType("auto");
    } catch (err) {
      console.warn("Cover auto-generation warning:", err);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleCustomCoverUpload = async (imgFile: File) => {
    if (!imgFile) return;
    setIsGeneratingCover(true);
    try {
      const dataUrl = await processImageFile(imgFile, { maxDim: 800 });
      const saved = saveLocalFile("img", dataUrl);
      if (!saved.ok) {
        toast.error(saved.error);
        return;
      }
      setStagedCoverUrl(saved.pointer);
      setCoverSourceType("custom");
      toast.success("Custom thumbnail uploaded successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process image");
    } finally {
      setIsGeneratingCover(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    }
  };

  const handleRegenerateCover = async () => {
    setIsGeneratingCover(true);
    try {
      if (stagedFile) {
        const generated = await generateThumbnailFromFile(stagedFile, {
          title: stagedTitle,
          category: stagedCategory,
        });
        setStagedCoverUrl(generated);
      } else {
        const generated = renderAcademicCoverCanvas(
          stagedTitle || "Courseware",
          stagedCategory,
          stagedFormat,
        );
        setStagedCoverUrl(generated);
      }
      setCoverSourceType("auto");
      toast.success("Thumbnail regenerated from file & metadata");
    } catch (err) {
      toast.error("Failed to generate thumbnail");
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handlePublishStaged = async () => {
    if (!stagedFile || !stagedTitle.trim()) {
      toast.error("Please provide a title for the courseware file.");
      return;
    }

    setIsUploading(true);
    setUploadProgressPct(30);

    try {
      setUploadProgressPct(60);
      const { dataUrl, format, size } = await processDocumentFile(stagedFile);
      const kind = format === "ppt" ? "ppt" : format === "doc" ? "doc" : "pdf";
      const saved = saveLocalFile(kind, dataUrl);

      if (!saved.ok) {
        toast.error(saved.error);
        setIsUploading(false);
        return;
      }

      setUploadProgressPct(80);

      // Persist thumbnail if it's a raw data URL
      let finalCoverUrl = stagedCoverUrl;
      if (stagedCoverUrl.startsWith("data:image/")) {
        const savedCover = saveLocalFile("img", stagedCoverUrl);
        if (savedCover.ok) {
          finalCoverUrl = savedCover.pointer;
        }
      }

      setUploadProgressPct(90);

      const chCount = Math.max(1, parseInt(stagedChapters, 10) || 8);
      const pCount = Math.max(1, parseInt(stagedPages, 10) || 120);
      const avgP = Math.max(1, Math.ceil(pCount / chCount));

      const chapterList = Array.from({ length: chCount }, (_, i) => ({
        title: `Chapter ${i + 1}: ${stagedTitle} Part ${i + 1}`,
        pages: avgP,
        done: false,
      }));

      const newContentData: ContentFormData = {
        name: stagedTitle.trim(),
        short: stagedShort.trim() || stagedTitle.slice(0, 15),
        chapters: String(chCount),
        students: "0",
        pages: String(pCount),
        category: stagedCategory || "Common",
        description: stagedDescription.trim(),
        pdfUrl: saved.pointer,
        coverUrl: finalCoverUrl,
        synced: true,
        published: stagedPublish,
        chapterList,
      };

      uploadContent(newContentData);
      setUploadProgressPct(100);

      toast.success(`"${stagedTitle}" published successfully to /library!`, {
        description: `${stagedFormat.toUpperCase()} · ${fileSizeLabel(size)} · ${chCount} chapters`,
        action: {
          label: "View in /library",
          onClick: () => window.open("/library", "_blank"),
        },
      });

      // Clear staged state
      setStagedFile(null);
      setStagedCoverUrl("");
      setCoverSourceType("auto");
      if (directFileInputRef.current) directFileInputRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
      setUploadProgressPct(0);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = content.filter((item) => {
      // Category filter
      const matchesCat = catFilter === "All" || item.category === catFilter;

      // Format & Status filter
      let matchesFormat = true;
      if (formatFilter === "pdf") {
        matchesFormat = getDocumentFormat(item.pdfUrl) === "pdf";
      } else if (formatFilter === "ppt") {
        matchesFormat = getDocumentFormat(item.pdfUrl) === "ppt";
      } else if (formatFilter === "doc") {
        matchesFormat = getDocumentFormat(item.pdfUrl) === "doc";
      } else if (formatFilter === "published") {
        matchesFormat = !!item.published;
      } else if (formatFilter === "draft") {
        matchesFormat = !item.published;
      }

      // Search filter
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.short ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q) ||
        (item.category ?? "").toLowerCase().includes(q);

      return matchesCat && matchesFormat && matchesSearch;
    });

    if (sortBy === "recent") return matches;
    const sorted = [...matches];
    if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "students")
      sorted.sort((a, b) => parseStudentCount(b.students) - parseStudentCount(a.students));
    else if (sortBy === "chapters") sorted.sort((a, b) => b.chapters - a.chapters);
    else if (sortBy === "pages") sorted.sort((a, b) => (b.pages || 0) - (a.pages || 0));
    return sorted;
  }, [content, search, catFilter, formatFilter, sortBy]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
  const someFilteredSelected = filtered.some((c) => selected.has(c.id));

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllFiltered(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of filtered) {
        if (checked) next.add(item.id);
        else next.delete(item.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function copyMaterialUrl(url: string) {
    void navigator.clipboard.writeText(url);
    const fmt = getDocumentFormat(url).toUpperCase();
    toast.success(`${fmt} material link copied to clipboard`);
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        importContentJson(parsed);
      } catch {
        toast.error("Failed to parse JSON file.");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  }

  const selectedIds = Array.from(selected);

  return (
    <div className="space-y-6">
      {/* Hidden file input for catalog import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileImport}
      />

      {/* Hidden file input for direct file upload */}
      <input
        ref={directFileInputRef}
        type="file"
        accept=".pdf,.ppt,.pptx,.doc,.docx,.epub,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleStageFile(f);
        }}
      />

      {/* ── Top Hero Banner with Direct Library Links ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.25)_0%,_transparent_60%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-0.5 text-xs font-bold text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Active with /library
              </span>
              <span className="text-white/40">·</span>
              <span className="text-xs text-white/70">
                Supports PDF Textbooks, PPT Slides, Word DOCs
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Library CMS Studio & Courseware Engine
            </h1>
            <p className="text-xs sm:text-sm text-white/60 max-w-2xl">
              Publish university textbooks, lecture slide presentations, and academic notes directly
              to Ethiopian students. Every upload is immediately available in the reading environment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open("/library", "_blank")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold h-9 rounded-xl backdrop-blur transition cursor-pointer"
            >
              <ExternalLink className="size-3.5 mr-1.5 text-amber-400" />
              Visit Student Library (/library)
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => openQuickAction("uploadContent")}
              className="bg-brand-gold hover:bg-brand-gold/90 text-slate-950 text-xs font-bold h-9 rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus className="size-4 mr-1" />
              New Book / Courseware
            </Button>
          </div>
        </div>
      </div>

      {/* ── CMS Drag & Drop Ingestion Studio ── */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleStageFile(f);
        }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-6 transition-all duration-200 bg-white dark:bg-slate-900 shadow-sm",
          isDragOver
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.005]"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300",
        )}
      >
        {!stagedFile ? (
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200">
                <FileText className="size-5" />
              </span>
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <Presentation className="size-5" />
              </span>
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <FileText className="size-5" />
              </span>
            </div>

            <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Drag & Drop PDF, PPT, DOC or Click to Upload
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md">
              Drop courseware files directly into the CMS studio. Auto-detects format, extracts course
              title, generates chapter structure, and instantly syncs with /library.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                onClick={() => directFileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 rounded-xl shadow-sm cursor-pointer"
              >
                <FileUp className="size-4 mr-1.5" />
                Select File from Computer
              </Button>
              <span className="text-xs text-slate-400">or</span>
              <Button
                type="button"
                variant="outline"
                onClick={() => openQuickAction("uploadContent")}
                className="text-xs h-9 rounded-xl font-semibold border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <SlidersHorizontal className="size-3.5 mr-1.5" />
                Open Detailed Upload Form
              </Button>
            </div>

            <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400 font-mono">
              <span>📕 PDF (up to 50MB)</span>
              <span>·</span>
              <span>📊 PPT / PPTX Slides</span>
              <span>·</span>
              <span>📝 Word DOC / DOCX</span>
            </div>
          </div>
        ) : (
          /* Staged Upload Quick CMS Panel */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs border shadow-2xs",
                    stagedFormat === "pdf" && "bg-red-50 text-red-700 border-red-200",
                    stagedFormat === "ppt" && "bg-amber-50 text-amber-700 border-amber-200",
                    stagedFormat === "doc" && "bg-blue-50 text-blue-700 border-blue-200",
                  )}
                >
                  {stagedFormat.toUpperCase()}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-md">
                    {stagedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {fileSizeLabel(stagedFile.size)} · Ready to ingest into student library
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStagedFile(null)}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer self-end sm:self-auto"
              >
                <X className="size-3.5" /> Cancel
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-12 items-start">
              {/* Left Column: Thumbnail Studio & Live Cover Preview */}
              <div className="md:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3.5 flex flex-col items-center text-center space-y-3">
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Cover Thumbnail
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 font-semibold tracking-wide",
                      coverSourceType === "auto"
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
                    )}
                  >
                    {coverSourceType === "auto" ? "⚡ Auto From File" : "📷 Custom Upload"}
                  </Badge>
                </div>

                {/* 3D Book Cover / Thumbnail Preview Card */}
                <div className="relative w-28 sm:w-32 shadow-lg rounded-lg overflow-hidden transition-all">
                  {isGeneratingCover ? (
                    <div className="aspect-[2/3] w-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-2 p-3 text-center rounded-lg border border-slate-200 dark:border-slate-700">
                      <Loader2 className="size-5 animate-spin text-indigo-600" />
                      <span className="text-[10px] text-slate-500 font-medium">Extracting cover…</span>
                    </div>
                  ) : (
                    <BookCover
                      short={stagedShort || "Course"}
                      name={stagedTitle || "Course Material"}
                      category={stagedCategory}
                      coverUrl={stagedCoverUrl}
                      size="md"
                    />
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[220px]">
                  {coverSourceType === "auto"
                    ? stagedFormat === "pdf"
                      ? "Extracted automatically from PDF Page 1 or generated syllabus cover."
                      : `Themed academic cover synthesized for ${stagedFormat.toUpperCase()}.`
                    : "Custom uploaded thumbnail cover."}
                </p>

                {/* Controls: Upload Custom OR Auto-Generate */}
                <div className="w-full space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => coverFileInputRef.current?.click()}
                      disabled={isGeneratingCover || isUploading}
                      className="h-8 text-xs font-semibold cursor-pointer border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                      title="Upload a custom cover image file"
                    >
                      <Camera className="size-3.5 mr-1 text-slate-500" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateCover}
                      disabled={isGeneratingCover || isUploading}
                      className="h-8 text-xs font-semibold cursor-pointer border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                      title="Regenerate thumbnail automatically from file and current title"
                    >
                      <RotateCcw className="size-3 mr-1 text-slate-500" />
                      Auto-gen
                    </Button>
                  </div>

                  {stagedCoverUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setStagedCoverUrl("");
                        setCoverSourceType("auto");
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-500 transition py-0.5 cursor-pointer"
                    >
                      Reset to default vector style
                    </button>
                  )}

                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCustomCoverUpload(f);
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Course Metadata Fields */}
              <div className="md:col-span-8 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">Book / Courseware Title</Label>
                    <Input
                      value={stagedTitle}
                      onChange={(e) => setStagedTitle(e.target.value)}
                      placeholder="e.g. General Physics (Phys 1011)"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Short Label</Label>
                    <Input
                      value={stagedShort}
                      onChange={(e) => setStagedShort(e.target.value)}
                      placeholder="e.g. Physics"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Curriculum Category</Label>
                    <Select value={stagedCategory} onValueChange={setStagedCategory}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryNames.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Chapters / Slides Count</Label>
                    <Input
                      type="number"
                      min={1}
                      value={stagedChapters}
                      onChange={(e) => setStagedChapters(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Estimated Pages</Label>
                    <Input
                      type="number"
                      min={1}
                      value={stagedPages}
                      onChange={(e) => setStagedPages(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">Syllabus Overview / Notes</Label>
                    <Textarea
                      value={stagedDescription}
                      onChange={(e) => setStagedDescription(e.target.value)}
                      placeholder="Short summary for university students..."
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Publish immediately to /library
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Students will see this material in the library catalog right now.
                      </p>
                    </div>
                    <Switch checked={stagedPublish} onCheckedChange={setStagedPublish} />
                  </div>
                </div>
              </div>
            </div>

            {isUploading && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span>Ingesting into CMS storage…</span>
                  <span>{uploadProgressPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgressPct}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStagedFile(null)}
                disabled={isUploading}
                className="h-8 text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handlePublishStaged}
                disabled={isUploading}
                className="h-8 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <Check className="size-3.5 mr-1.5" />
                    Publish to Student Library
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs border-slate-200/80 dark:border-slate-800">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy dark:bg-brand-navy/20 dark:text-indigo-400">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Materials
              </p>
              <div className="flex items-baseline gap-2">
                <p className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
                  {content.length}
                </p>
                <span className="text-[11px] text-muted-foreground">
                  ({totalChaptersCount} ch · {totalPagesCount} pg)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200/80 dark:border-slate-800">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Check className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Published Active
              </p>
              <div className="flex items-baseline gap-2">
                <p className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
                  {publishedCount}
                </p>
                <span className="text-[11px] text-emerald-600 font-medium">In /library</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200/80 dark:border-slate-800">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <Presentation className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                PPT Slide Decks
              </p>
              <div className="flex items-baseline gap-2">
                <p className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
                  {materialStats.ppt}
                </p>
                <span className="text-[11px] text-amber-600 font-medium">Presentation format</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200/80 dark:border-slate-800">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                PDF & Word DOCs
              </p>
              <div className="flex items-baseline gap-2">
                <p className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
                  {materialStats.pdf + materialStats.doc}
                </p>
                <span className="text-[11px] text-blue-600 font-medium">
                  {materialStats.pdf} PDF · {materialStats.doc} DOC
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Controls & Toolbar ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search title, code, format, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 bg-white dark:bg-slate-900 h-9 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Action buttons & View toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort By */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-[155px] bg-white dark:bg-slate-900 h-9 text-xs" aria-label="Sort books">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent" className="text-xs">
                <Clock className="size-3.5 inline mr-1" /> Recently added
              </SelectItem>
              <SelectItem value="name" className="text-xs">
                <ArrowDownAZ className="size-3.5 inline mr-1" /> Name (A–Z)
              </SelectItem>
              <SelectItem value="students" className="text-xs">
                <Users className="size-3.5 inline mr-1" /> Most students
              </SelectItem>
              <SelectItem value="chapters" className="text-xs">
                <BookOpen className="size-3.5 inline mr-1" /> Most chapters
              </SelectItem>
              <SelectItem value="pages" className="text-xs">
                <FileText className="size-3.5 inline mr-1" /> Most pages
              </SelectItem>
            </SelectContent>
          </Select>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs h-9 p-0.5">
            <button
              type="button"
              title="Table view"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition cursor-pointer",
                viewMode === "table"
                  ? "bg-slate-900 dark:bg-slate-700 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100",
              )}
            >
              <Table2 className="size-3.5" /> Table
            </button>
            <button
              type="button"
              title="Grid view"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition cursor-pointer",
                viewMode === "grid"
                  ? "bg-slate-900 dark:bg-slate-700 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100",
              )}
            >
              <LayoutGrid className="size-3.5" /> Grid
            </button>
          </div>

          {/* Catalog Data Transfer (Export / Import) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer">
                <Download className="size-3.5" />
                Backup JSON
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportContentJson} className="text-xs">
                <Download className="mr-2 size-3.5" />
                Export catalog as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="text-xs">
                <Upload className="mr-2 size-3.5" />
                Import books from JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary Create Button */}
          <Button
            size="sm"
            className="h-9 gap-1.5 shadow-xs text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
            onClick={() => openQuickAction("uploadContent")}
          >
            <Plus className="size-4" />
            Add Material
          </Button>
        </div>
      </div>

      {/* ── Format Tabs & Category Pills ── */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
        {/* Format Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Format:
          </span>
          {[
            { id: "all", label: `All (${content.length})`, bg: "bg-slate-900 text-white dark:bg-slate-700" },
            { id: "pdf", label: `📕 PDF (${materialStats.pdf})`, bg: "bg-red-600 text-white" },
            { id: "ppt", label: `📊 PPT Slides (${materialStats.ppt})`, bg: "bg-amber-600 text-white" },
            { id: "doc", label: `📝 Word DOC (${materialStats.doc})`, bg: "bg-blue-600 text-white" },
            { id: "published", label: `✅ Published (${publishedCount})`, bg: "bg-emerald-700 text-white" },
            { id: "draft", label: `⏸️ Drafts (${draftCount})`, bg: "bg-slate-700 text-white" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFormatFilter(tab.id as FormatFilter)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer",
                formatFilter === tab.id
                  ? tab.bg
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Category:
          </span>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCatFilter(c)}
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium transition cursor-pointer",
                catFilter === c
                  ? "bg-brand-navy text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              {c}
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] px-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
            onClick={() => setAddingCategory(true)}
            title="Create a new course category"
          >
            <FolderPlus className="size-3 mr-1" /> + Category
          </Button>
        </div>
      </div>

      {/* ── Bulk Actions Toolbar ── */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 shadow-xs dark:border-indigo-900 dark:bg-indigo-950/40">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
              {selected.size}
            </span>
            <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
              materials selected
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-7 text-xs text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300"
            >
              Clear selection
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold bg-white dark:bg-slate-900"
              onClick={() => bulkSetContentPublished(selectedIds, true)}
            >
              <Check className="size-3.5 mr-1 text-emerald-600" />
              Publish in Library
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold bg-white dark:bg-slate-900"
              onClick={() => bulkSetContentPublished(selectedIds, false)}
            >
              Hide from Library
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold bg-white dark:bg-slate-900"
                >
                  Set Category
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {categoryNames.map((cat) => (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => bulkSetContentCategory(selectedIds, cat)}
                    className="text-xs"
                  >
                    {cat}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-8 text-xs font-semibold"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-3.5 mr-1" />
              Delete ({selected.size})
            </Button>
          </div>
        </div>
      )}

      {/* ── Content Presentation Canvas (Table or Grid) ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
          <BookOpen className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-900 dark:text-white">No materials found</p>
          <p className="mt-1 text-xs text-slate-500">
            {search || formatFilter !== "all" || catFilter !== "All"
              ? "Try adjusting your filters or search terms."
              : "Drag & drop a PDF, PPT, or DOC into the dropzone above to publish your first material!"}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setFormatFilter("all");
                setCatFilter("All");
              }}
            >
              Reset filters
            </Button>
            <Button size="sm" onClick={() => directFileInputRef.current?.click()}>
              Upload File
            </Button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => {
            const short =
              item.short || item.name.split("(")[0].trim().split(" ").pop() || item.name;
            const fmt = getDocumentFormat(item.pdfUrl);

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-3 transition-all hover:border-slate-300 hover:shadow-md"
              >
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={(v) => toggleOne(item.id, v === true)}
                  aria-label={`Select ${item.name}`}
                  className="absolute left-4 top-4 z-10 bg-white/95 shadow-xs"
                />

                <div className="absolute right-4 top-4 z-10">
                  <ContentRowActions
                    item={item}
                    onEdit={() => openEdit({ type: "content", item })}
                    onDuplicate={duplicateContent}
                    onCopyMaterialUrl={copyMaterialUrl}
                    onDelete={setPendingDelete}
                    trigger={
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-7 bg-white/90 shadow-xs backdrop-blur cursor-pointer"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    }
                  />
                </div>

                <div>
                  <button
                    type="button"
                    className="block w-full cursor-pointer"
                    onClick={() => openEdit({ type: "content", item })}
                  >
                    <BookCover
                      short={short}
                      name={item.name}
                      size="md"
                      coverUrl={item.coverUrl}
                      category={item.category}
                    />
                  </button>

                  <button
                    type="button"
                    className="mt-2.5 line-clamp-2 text-left text-xs font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
                    onClick={() => openEdit({ type: "content", item })}
                  >
                    {item.name}
                  </button>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <CategoryBadge category={item.category} categories={allCategories} />
                    {item.pdfUrl && <MaterialFormatBadge url={item.pdfUrl} />}
                  </div>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {item.chapters} ch · {item.pages ?? "—"} pg · {item.students} students
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={item.published}
                      onCheckedChange={() => toggleContentPublished(item.id)}
                      title={item.published ? "Live in /library" : "Hidden draft"}
                    />
                    <span className="text-[10px] font-semibold text-slate-500">
                      {item.published ? (
                        <span className="text-emerald-600 font-bold">Live</span>
                      ) : (
                        <span className="text-slate-400">Draft</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.pdfUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Download file"
                        onClick={() => {
                          const ext = fmt === "ppt" ? "pptx" : fmt === "doc" ? "docx" : "pdf";
                          downloadMediaFile(item.pdfUrl, `${item.name}.${ext}`);
                        }}
                      >
                        <Download className="size-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-slate-400 hover:text-emerald-600 cursor-pointer"
                      title="Preview in Student Reader"
                      onClick={() => window.open(`/library/read/${item.id}`, "_blank")}
                    >
                      <ExternalLink className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-slate-800/60 text-xs">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                    onCheckedChange={(v) => toggleAllFiltered(v === true)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="min-w-[280px]">Material Title & Format</TableHead>
                <TableHead className="w-32">Format</TableHead>
                <TableHead className="w-32">Category</TableHead>
                <TableHead className="w-28">Chapters / Slides</TableHead>
                <TableHead className="w-24">Students</TableHead>
                <TableHead className="w-28 text-center">Status (/library)</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {filtered.map((item) => {
                const short =
                  item.short || item.name.split("(")[0].trim().split(" ").pop() || item.name;
                const fmt = getDocumentFormat(item.pdfUrl);

                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(item.id)}
                        onCheckedChange={(v) => toggleOne(item.id, v === true)}
                        aria-label={`Select ${item.name}`}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="w-9 shrink-0 cursor-pointer"
                          onClick={() => openEdit({ type: "content", item })}
                        >
                          <BookCover
                            short={short}
                            name={item.name}
                            size="sm"
                            coverUrl={item.coverUrl}
                            category={item.category}
                          />
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="font-bold text-slate-900 dark:text-white hover:underline text-left truncate block max-w-sm cursor-pointer"
                            onClick={() => openEdit({ type: "content", item })}
                          >
                            {item.name}
                          </button>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-mono">{item.short || item.id}</span>
                            <span>·</span>
                            <span>{item.pages ?? "—"} pages</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <MaterialFormatBadge url={item.pdfUrl} />
                    </TableCell>

                    <TableCell>
                      <CategoryBadge category={item.category} categories={allCategories} />
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.chapters} {fmt === "ppt" ? "slides" : "chapters"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ~{Math.round((item.pages || 60) * 1.5)} min read
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {item.students}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Switch
                          checked={item.published}
                          onCheckedChange={() => toggleContentPublished(item.id)}
                          title={item.published ? "Active in /library" : "Hidden draft"}
                        />
                        <span className="text-[11px] font-semibold">
                          {item.published ? (
                            <span className="text-emerald-600 font-bold">Published</span>
                          ) : (
                            <span className="text-slate-400">Draft</span>
                          )}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-slate-400 hover:text-emerald-600 cursor-pointer"
                          title="Preview in Student Reader (/library)"
                          onClick={() => window.open(`/library/read/${item.id}`, "_blank")}
                        >
                          <Eye className="size-3.5" />
                        </Button>

                        {item.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-slate-400 hover:text-indigo-600 cursor-pointer"
                            title="Download file"
                            onClick={() => {
                              const ext = fmt === "ppt" ? "pptx" : fmt === "doc" ? "docx" : "pdf";
                              downloadMediaFile(item.pdfUrl, `${item.name}.${ext}`);
                            }}
                          >
                            <Download className="size-3.5" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-slate-400 hover:text-slate-800 cursor-pointer"
                          title="Edit material details"
                          onClick={() => openEdit({ type: "content", item })}
                        >
                          <Pencil className="size-3.5" />
                        </Button>

                        <ContentRowActions
                          item={item}
                          onEdit={() => openEdit({ type: "content", item })}
                          onDuplicate={duplicateContent}
                          onCopyMaterialUrl={copyMaterialUrl}
                          onDelete={setPendingDelete}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Single Delete Confirmation Dialog ── */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this courseware material?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-slate-900">{pendingDelete?.name}</strong>? This material will
              be permanently removed from the student library catalog and reader.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) {
                  deleteContent(pendingDelete.id);
                  setPendingDelete(null);
                }
              }}
            >
              Delete Material
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete Confirmation Dialog ── */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} selected materials?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {selected.size} selected books from the student library.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                bulkDeleteContent(selectedIds);
                clearSelection();
                setBulkDeleteOpen(false);
              }}
            >
              Delete Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Add Category Dialog ── */}
      <CategoryDialog
        state={addingCategory ? { mode: "create" } : null}
        onClose={() => setAddingCategory(false)}
        onCreate={(data) => {
          const res = addCategory(data);
          if (!res.ok) {
            toast.error(res.error);
            return false;
          }
          toast.success(`Category "${data.name}" added`);
          return true;
        }}
      />
    </div>
  );
}

function ContentRowActions({
  item,
  onEdit,
  onDuplicate,
  onCopyMaterialUrl,
  onDelete,
  trigger,
}: {
  item: AdminContent;
  onEdit: () => void;
  onDuplicate: (id: string) => void;
  onCopyMaterialUrl: (url: string) => void;
  onDelete: (item: AdminContent) => void;
  trigger?: ReactNode;
}) {
  const formatLabel = item.pdfUrl ? getDocumentFormat(item.pdfUrl).toUpperCase() : "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="size-7 shrink-0 cursor-pointer">
            <MoreHorizontal className="size-3.5" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 text-xs">
        <DropdownMenuItem onClick={onEdit} className="text-xs cursor-pointer">
          <Pencil className="mr-2 size-3.5" />
          Edit details & chapters
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(item.id)} className="text-xs cursor-pointer">
          <Copy className="mr-2 size-3.5" />
          Duplicate material
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(`/library/read/${item.id}`, "_blank")}
          className="text-xs text-emerald-600 font-semibold cursor-pointer"
        >
          <Eye className="mr-2 size-3.5" />
          Read in Library
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {item.pdfUrl && (
          <>
            <DropdownMenuItem
              onClick={() => {
                const ext = formatLabel === "PPT" ? "pptx" : formatLabel === "DOC" ? "docx" : "pdf";
                downloadMediaFile(item.pdfUrl, `${item.name}.${ext}`);
              }}
              className="text-xs cursor-pointer"
            >
              <Download className="mr-2 size-3.5 text-indigo-600" />
              Download file ({formatLabel})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopyMaterialUrl(item.pdfUrl)} className="text-xs cursor-pointer">
              <Copy className="mr-2 size-3.5 text-slate-400" />
              Copy material link
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive text-xs cursor-pointer"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="mr-2 size-3.5" />
          Delete material
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MaterialFormatBadge({ url }: { url: string }) {
  const fmt = getDocumentFormat(url);
  switch (fmt) {
    case "pdf":
      return (
        <Badge
          variant="outline"
          className="border-red-200 bg-red-50 text-red-700 text-[10px] font-bold gap-1 px-1.5 py-0"
        >
          <FileText className="size-2.5" /> PDF
        </Badge>
      );
    case "ppt":
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold gap-1 px-1.5 py-0"
        >
          <Presentation className="size-2.5" /> PPT Slides
        </Badge>
      );
    case "doc":
      return (
        <Badge
          variant="outline"
          className="border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold gap-1 px-1.5 py-0"
        >
          <FileText className="size-2.5" /> Word DOC
        </Badge>
      );
    case "epub":
      return (
        <Badge
          variant="outline"
          className="border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-bold gap-1 px-1.5 py-0"
        >
          <FileText className="size-2.5" /> EPUB
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="border-slate-200 bg-slate-50 text-slate-700 text-[10px] font-bold gap-1 px-1.5 py-0"
        >
          <FileText className="size-2.5" /> Doc
        </Badge>
      );
  }
}

function CategoryBadge({
  category,
  categories,
}: {
  category: string;
  categories: Parameters<typeof categoryBadgeClass>[1];
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("whitespace-nowrap text-[10px]", categoryBadgeClass(category, categories))}
    >
      {category}
    </Badge>
  );
}
