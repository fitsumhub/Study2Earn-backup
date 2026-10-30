import {
  BookOpen,
  FolderPlus,
  Image as ImageIcon,
  ListOrdered,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { BookCover } from "@/components/book-cover";
import { CategoryDialog } from "@/components/admin/category-dialog";
import { FormField } from "@/components/admin/forms/field";
import { DocumentUploadField, ImageUploadField } from "@/components/admin/forms/media-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/use-categories";
import type { AdminContent, AdminContentChapter } from "@/lib/admin-types";
import { getDocumentFormat, saveLocalFile } from "@/lib/media-store";
import { generateThumbnailFromFile, renderAcademicCoverCanvas } from "@/lib/thumbnail-generator";
import { cn } from "@/lib/utils";

export type ContentFormData = {
  name: string;
  short: string;
  chapters: string;
  students: string;
  pages: string;
  category: string;
  description: string;
  pdfUrl: string;
  coverUrl: string;
  synced: boolean;
  published: boolean;
  chapterList?: AdminContentChapter[];
};

const emptyContent: ContentFormData = {
  name: "",
  short: "",
  chapters: "8",
  students: "0",
  pages: "180",
  category: "Common",
  description: "",
  pdfUrl: "/pdfs/sample-textbook.pdf",
  coverUrl: "",
  synced: true,
  published: true,
  chapterList: [
    { title: "Chapter 1: Introduction & Fundamentals", pages: 20 },
    { title: "Chapter 2: Core Principles & Methodology", pages: 25 },
    { title: "Chapter 3: Applied Concepts & Models", pages: 25 },
    { title: "Chapter 4: Advanced Topics & Case Studies", pages: 30 },
  ],
};

type ActiveTab = "details" | "chapters" | "media" | "status";

export function ContentForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial?: Partial<ContentFormData>;
  onSubmit: (data: ContentFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const { categoryNames, addCategory } = useCategories();
  const [form, setForm] = useState<ContentFormData>(() => {
    const base = { ...emptyContent, ...initial };
    if (!base.chapterList || base.chapterList.length === 0) {
      const count = parseInt(base.chapters, 10) || 4;
      const totalP = parseInt(base.pages, 10) || 120;
      const perP = Math.max(1, Math.ceil(totalP / count));
      base.chapterList = Array.from({ length: count }, (_, i) => ({
        title: `Chapter ${i + 1}`,
        pages: perP,
      }));
    }
    return base;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("details");
  const [addingCategory, setAddingCategory] = useState(false);

  const categories =
    form.category && !categoryNames.includes(form.category)
      ? [form.category, ...categoryNames]
      : categoryNames;

  useEffect(() => {
    if (initial) {
      const updated = { ...emptyContent, ...initial };
      if (!updated.chapterList || updated.chapterList.length === 0) {
        const count = parseInt(updated.chapters, 10) || 4;
        const totalP = parseInt(updated.pages, 10) || 120;
        const perP = Math.max(1, Math.ceil(totalP / count));
        updated.chapterList = Array.from({ length: count }, (_, i) => ({
          title: `Chapter ${i + 1}`,
          pages: perP,
        }));
      }
      setForm(updated);
    }
  }, [initial]);

  const set = (key: keyof ContentFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Chapter management handlers
  const chapters = form.chapterList ?? [];

  const handleAddChapter = () => {
    const nextIdx = chapters.length + 1;
    const avgPages = Math.max(10, Math.round(Number(form.pages) / Math.max(1, nextIdx)));
    const nextChapters = [...chapters, { title: `Chapter ${nextIdx}: New Chapter`, pages: avgPages }];
    const totalPages = nextChapters.reduce((acc, c) => acc + (c.pages || 0), 0);
    setForm((prev) => ({
      ...prev,
      chapterList: nextChapters,
      chapters: String(nextChapters.length),
      pages: String(totalPages),
    }));
  };

  const handleUpdateChapter = (index: number, field: "title" | "pages", val: string | number) => {
    const nextChapters = [...chapters];
    if (field === "title") {
      nextChapters[index] = { ...nextChapters[index], title: String(val) };
    } else {
      nextChapters[index] = { ...nextChapters[index], pages: Math.max(1, Number(val) || 1) };
    }
    const totalPages = nextChapters.reduce((acc, c) => acc + (c.pages || 0), 0);
    setForm((prev) => ({
      ...prev,
      chapterList: nextChapters,
      pages: String(totalPages),
    }));
  };

  const handleRemoveChapter = (index: number) => {
    if (chapters.length <= 1) {
      toast.error("A textbook must have at least one chapter");
      return;
    }
    const nextChapters = chapters.filter((_, i) => i !== index);
    const totalPages = nextChapters.reduce((acc, c) => acc + (c.pages || 0), 0);
    setForm((prev) => ({
      ...prev,
      chapterList: nextChapters,
      chapters: String(nextChapters.length),
      pages: String(totalPages),
    }));
  };

  const handleAutoDistributePages = () => {
    const totalP = parseInt(form.pages, 10) || 120;
    const count = chapters.length || 1;
    const baseP = Math.floor(totalP / count);
    const rem = totalP % count;
    const nextChapters = chapters.map((c, i) => ({
      ...c,
      pages: baseP + (i === 0 ? rem : 0),
    }));
    setForm((prev) => ({ ...prev, chapterList: nextChapters }));
    toast.success(`Distributed ${totalP} pages across ${count} chapters`);
  };

  const handleResetDefaultChapters = () => {
    const count = Math.max(1, parseInt(form.chapters, 10) || 6);
    const totalP = parseInt(form.pages, 10) || 150;
    const perP = Math.max(1, Math.ceil(totalP / count));
    const nextChapters = Array.from({ length: count }, (_, i) => ({
      title: `Chapter ${i + 1}: Module Topics`,
      pages: perP,
    }));
    setForm((prev) => ({
      ...prev,
      chapterList: nextChapters,
      chapters: String(count),
    }));
    toast.success(`Reset to ${count} standard chapters`);
  };

  const calculatedTotalPages = chapters.reduce((acc, c) => acc + (c.pages || 0), 0);

  return (
    <>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (!form.name.trim()) {
            toast.error("Book title is required");
            return;
          }
          onSubmit(form);
        }}
        className="space-y-5"
      >
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors",
              activeTab === "details"
                ? "bg-white text-brand-navy shadow-xs"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            <BookOpen className="size-3.5" />
            Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chapters")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors",
              activeTab === "chapters"
                ? "bg-white text-brand-navy shadow-xs"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            <ListOrdered className="size-3.5" />
            Chapters
            <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[10px] text-slate-700">
              {chapters.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors",
              activeTab === "media"
                ? "bg-white text-brand-navy shadow-xs"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            <ImageIcon className="size-3.5" />
            Materials & Cover
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors",
              activeTab === "status"
                ? "bg-white text-brand-navy shadow-xs"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            Visibility
          </button>
        </div>

        {/* TAB 1: BOOK DETAILS */}
        {activeTab === "details" && (
          <div className="grid gap-4 animate-in fade-in-50 duration-200">
            <FormField
              label="Book title"
              id="content-name"
              value={form.name}
              onChange={(v) => set("name", v)}
              placeholder="e.g. General Physics (Phys 1011)"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Short code / display label"
                id="content-short"
                value={form.short}
                onChange={(v) => set("short", v)}
                placeholder="e.g. Physics"
              />
              <div className="grid gap-1.5">
                <Label htmlFor="content-category">Curriculum category</Label>
                <div className="flex gap-1.5">
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger id="content-category" className="min-w-0 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title="Add a new category"
                    onClick={() => setAddingCategory(true)}
                  >
                    <FolderPlus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="content-description">Description & course overview</Label>
              <Textarea
                id="content-description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Key concepts covered, learning goals, MoE exit exam syllabus topics…"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                label="Chapters count"
                id="content-chapters"
                type="number"
                value={String(chapters.length || form.chapters)}
                onChange={(v) => {
                  set("chapters", v);
                  const count = Math.max(1, parseInt(v, 10) || 1);
                  if (chapters.length !== count) {
                    const avg = Math.max(1, Math.ceil(Number(form.pages) / count));
                    const newChap = Array.from({ length: count }, (_, i) => chapters[i] || {
                      title: `Chapter ${i + 1}`,
                      pages: avg,
                    });
                    set("chapterList", newChap);
                  }
                }}
                required
              />
              <FormField
                label="Total pages"
                id="content-pages"
                type="number"
                value={form.pages}
                onChange={(v) => set("pages", v)}
              />
              <FormField
                label="Active students"
                id="content-students"
                value={form.students}
                onChange={(v) => set("students", v)}
                placeholder="e.g. 2.4k"
              />
            </div>
          </div>
        )}

        {/* TAB 2: CHAPTERS MANAGER */}
        {activeTab === "chapters" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
              <div>
                <p className="text-xs font-bold text-brand-navy">
                  {chapters.length} Chapters · {calculatedTotalPages} Total Pages
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Each chapter is tracked separately in the student reading timer and exit exam engine.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleAutoDistributePages}
                >
                  <Sparkles className="size-3 text-brand-gold" />
                  Auto-distribute pages
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleAddChapter}
                >
                  <Plus className="size-3" />
                  Add chapter
                </Button>
              </div>
            </div>

            <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
              {chapters.map((ch, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-2xs transition-all hover:border-slate-300"
                >
                  <Badge variant="outline" className="h-6 shrink-0 font-mono text-[11px] bg-slate-50">
                    Ch. {idx + 1}
                  </Badge>
                  <Input
                    value={ch.title}
                    onChange={(e) => handleUpdateChapter(idx, "title", e.target.value)}
                    placeholder="Chapter title…"
                    className="h-8 flex-1 text-xs"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <Input
                      type="number"
                      value={ch.pages}
                      onChange={(e) => handleUpdateChapter(idx, "pages", e.target.value)}
                      className="h-8 w-16 text-right text-xs"
                      title="Pages count"
                      min={1}
                    />
                    <span className="text-[11px] text-slate-400">pg</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-slate-400 hover:text-destructive"
                    title="Remove chapter"
                    onClick={() => handleRemoveChapter(idx)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {chapters.length === 0 && (
              <div className="rounded-lg border border-dashed py-8 text-center">
                <p className="text-xs text-muted-foreground mb-2">No chapters defined yet.</p>
                <Button type="button" size="sm" variant="outline" onClick={handleResetDefaultChapters}>
                  Generate default chapters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MEDIA & PDF */}
        {activeTab === "media" && (
          <div className="grid gap-4 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="md:col-span-2 space-y-4">
                <DocumentUploadField
                  label="Course Study Material (PDF, PPT, DOC, EPUB)"
                  value={form.pdfUrl}
                  onChange={(v) => set("pdfUrl", v)}
                  onFileProcessed={async (file) => {
                    if (!form.coverUrl) {
                      try {
                        const thumb = await generateThumbnailFromFile(file, {
                          title: form.name || file.name,
                          category: form.category,
                        });
                        const saved = saveLocalFile("img", thumb);
                        if (saved.ok) {
                          set("coverUrl", saved.pointer);
                          toast.success("Thumbnail automatically generated from file!");
                        }
                      } catch (err) {
                        console.warn("Auto-thumbnail generation error:", err);
                      }
                    }
                  }}
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Book / Course Cover Thumbnail</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 gap-1 px-2 font-medium"
                      onClick={async () => {
                        try {
                          const generated = renderAcademicCoverCanvas(
                            form.name || "Higher Education Courseware",
                            form.category || "Common",
                            getDocumentFormat(form.pdfUrl),
                          );
                          const saved = saveLocalFile("img", generated);
                          if (saved.ok) {
                            set("coverUrl", saved.pointer);
                            toast.success("Academic cover thumbnail generated!");
                          }
                        } catch (err) {
                          toast.error("Could not synthesize cover thumbnail");
                        }
                      }}
                    >
                      <Sparkles className="size-3 text-amber-500" />
                      Auto-generate from title
                    </Button>
                  </div>
                  <ImageUploadField
                    label=""
                    value={form.coverUrl}
                    onChange={(v) => set("coverUrl", v)}
                    maxDim={600}
                    hint="Upload a custom cover image, or auto-generate from file above."
                    previewClassName="aspect-[2/3] h-20 w-auto"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                <p className="text-[11px] font-semibold text-slate-600 mb-2">Student Library Preview</p>
                <div className="mx-auto w-24">
                  <BookCover
                    short={form.short || "Book"}
                    name={form.name || "Untitled Textbook"}
                    category={form.category}
                    coverUrl={form.coverUrl}
                    size="md"
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-brand-navy truncate">
                  {form.name || "Book Title"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {chapters.length} chapters · {form.pages} pages
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STATUS & VISIBILITY */}
        {activeTab === "status" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="rounded-lg border p-3.5 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="content-published" className="font-semibold text-brand-navy">
                    Published in Student Library
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When active, university students can access this material and earn XP.
                  </p>
                </div>
                <Switch
                  id="content-published"
                  checked={form.published}
                  onCheckedChange={(v) => set("published", v)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-[11px] text-slate-400">
            {chapters.length} chapters · {calculatedTotalPages} pages
          </p>
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">{submitLabel}</Button>
          </div>
        </div>
      </form>

      <CategoryDialog
        state={addingCategory ? { mode: "create" } : null}
        onClose={() => setAddingCategory(false)}
        onCreate={(data) => {
          const res = addCategory(data);
          if (!res.ok) {
            toast.error(res.error);
            return false;
          }
          set("category", data.name);
          toast.success(`Category "${data.name}" added`);
          return true;
        }}
      />
    </>
  );
}

export function contentToForm(item: AdminContent): ContentFormData {
  return {
    name: item.name,
    short: item.short ?? "",
    chapters: String(item.chapters),
    students: item.students,
    pages: String(item.pages ?? 180),
    category: item.category ?? "Common",
    description: item.description ?? "",
    pdfUrl: item.pdfUrl ?? "/pdfs/sample-textbook.pdf",
    coverUrl: item.coverUrl ?? "",
    synced: item.synced ?? true,
    published: item.published ?? true,
    chapterList: item.chapterList ?? Array.from({ length: item.chapters || 4 }, (_, i) => ({
      title: `Chapter ${i + 1}`,
      pages: Math.max(1, Math.ceil((item.pages ?? 180) / Math.max(1, item.chapters || 4))),
    })),
  };
}

export function formToContent(
  data: ContentFormData,
  id?: string,
): Omit<AdminContent, "id"> & { id?: string } {
  const chapterList = data.chapterList && data.chapterList.length > 0
    ? data.chapterList
    : undefined;

  const chaptersCount = chapterList ? chapterList.length : parseInt(data.chapters, 10) || 8;
  const pagesCount = chapterList
    ? chapterList.reduce((acc, c) => acc + (c.pages || 0), 0)
    : parseInt(data.pages, 10) || 180;

  return {
    id,
    name: data.name,
    short: data.short || data.name.split(" ")[0],
    chapters: chaptersCount,
    students: data.students,
    pages: pagesCount,
    category: data.category,
    description: data.description,
    pdfUrl: data.pdfUrl,
    coverUrl: data.coverUrl.trim() || undefined,
    synced: data.synced ?? true,
    published: data.published,
    chapterList,
  };
}
