import { FolderPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { CategoryDialog } from "@/components/admin/category-dialog";
import { FormField } from "@/components/admin/forms/field";
import { ImageUploadField, PdfUploadField } from "@/components/admin/forms/media-upload";
import { Button } from "@/components/ui/button";
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
import type { AdminContent } from "@/lib/admin-types";

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
  synced: false,
  published: true,
};

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
  const [form, setForm] = useState<ContentFormData>({ ...emptyContent, ...initial });
  const [addingCategory, setAddingCategory] = useState(false);
  // Ensure the current value is always selectable even if its category was removed.
  const categories =
    form.category && !categoryNames.includes(form.category)
      ? [form.category, ...categoryNames]
      : categoryNames;

  useEffect(() => {
    setForm({ ...emptyContent, ...initial });
  }, [initial]);

  const set = (key: keyof ContentFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onSubmit(form);
        }}
        className="grid gap-4"
      >
        <FormField
          label="Book title"
          id="content-name"
          value={form.name}
          onChange={(v) => set("name", v)}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Short name"
            id="content-short"
            value={form.short}
            onChange={(v) => set("short", v)}
            placeholder="e.g. Physics"
          />
          <div className="grid gap-1.5">
            <Label htmlFor="content-category">Category</Label>
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
          <Label htmlFor="content-description">Description</Label>
          <Textarea
            id="content-description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short description of this textbook…"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField
            label="Chapters"
            id="content-chapters"
            type="number"
            value={form.chapters}
            onChange={(v) => set("chapters", v)}
            required
          />
          <FormField
            label="Pages"
            id="content-pages"
            type="number"
            value={form.pages}
            onChange={(v) => set("pages", v)}
          />
          <FormField
            label="Students"
            id="content-students"
            value={form.students}
            onChange={(v) => set("students", v)}
          />
        </div>
        <PdfUploadField
          label="Textbook PDF"
          value={form.pdfUrl}
          onChange={(v) => set("pdfUrl", v)}
        />
        <ImageUploadField
          label="Cover image"
          value={form.coverUrl}
          onChange={(v) => set("coverUrl", v)}
          maxDim={600}
          hint="Optional — shown in the student library. Leave empty for the generated cover."
          previewClassName="aspect-[2/3] h-20 w-auto"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="content-published">Published</Label>
              <p className="text-xs text-muted-foreground">Visible to students</p>
            </div>
            <Switch
              id="content-published"
              checked={form.published}
              onCheckedChange={(v) => set("published", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="content-synced">Synced with MoE</Label>
              <p className="text-xs text-muted-foreground">Curriculum up to date</p>
            </div>
            <Switch
              id="content-synced"
              checked={form.synced}
              onCheckedChange={(v) => set("synced", v)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">{submitLabel}</Button>
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
    synced: item.synced,
    published: item.published ?? true,
  };
}

export function formToContent(
  data: ContentFormData,
  id?: string,
): Omit<AdminContent, "id"> & { id?: string } {
  return {
    id,
    name: data.name,
    short: data.short || data.name.split(" ")[0],
    chapters: parseInt(data.chapters, 10) || 8,
    students: data.students,
    pages: parseInt(data.pages, 10) || 180,
    category: data.category,
    description: data.description,
    pdfUrl: data.pdfUrl,
    coverUrl: data.coverUrl.trim() || undefined,
    synced: data.synced,
    published: data.published,
  };
}
