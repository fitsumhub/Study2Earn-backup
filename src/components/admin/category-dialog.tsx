import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORY_COLORS,
  CATEGORY_COLOR_KEYS,
  type BookCategory,
  type CategoryColor,
} from "@/lib/category-store";
import { cn } from "@/lib/utils";

export type CategoryDialogState =
  | { mode: "create" }
  | { mode: "edit"; category: BookCategory }
  | null;

/**
 * Shared create/edit category form — used by the admin Categories section and,
 * inline, by the book (content) form so an admin adding a book can create a new
 * category on the spot instead of leaving to the Categories section first.
 */
export function CategoryDialog({
  state,
  onClose,
  onCreate,
  onUpdate,
}: {
  state: CategoryDialogState;
  onClose: () => void;
  onCreate: (data: { name: string; color: CategoryColor; description?: string }) => boolean;
  onUpdate?: (
    id: string,
    data: { name: string; color: CategoryColor; description?: string },
  ) => boolean;
}) {
  const editing = state?.mode === "edit" ? state.category : null;
  const [name, setName] = useState("");
  const [color, setColor] = useState<CategoryColor>("blue");
  const [description, setDescription] = useState("");

  // Reset form fields whenever the dialog opens for a different target.
  const key = state?.mode === "edit" ? state.category.id : (state?.mode ?? "closed");
  useEffect(() => {
    setName(editing?.name ?? "");
    setColor(editing?.color ?? "blue");
    setDescription(editing?.description ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const open = state !== null;

  function submit() {
    const payload = { name: name.trim(), color, description: description.trim() || undefined };
    if (!payload.name) return;
    const ok = editing && onUpdate ? onUpdate(editing.id, payload) : onCreate(payload);
    if (ok) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            Categories power the library filters and book badges.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fiction"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  title={CATEGORY_COLORS[k].label}
                  onClick={() => setColor(k)}
                  className={cn(
                    "size-8 rounded-lg ring-offset-2 transition",
                    CATEGORY_COLORS[k].swatch,
                    color === k
                      ? "ring-2 ring-brand-navy"
                      : "ring-0 hover:ring-2 hover:ring-slate-300",
                  )}
                  aria-label={`${CATEGORY_COLORS[k].label} color`}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — what this category is for"
              rows={2}
            />
          </div>
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Preview
            </p>
            <Badge variant="secondary" className={cn(CATEGORY_COLORS[color].badge)}>
              {name.trim() || "Category name"}
            </Badge>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            {editing ? "Save changes" : "Add category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
