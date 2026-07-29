import { BookOpen, FolderTree, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CategoryDialog, type CategoryDialogState } from "@/components/admin/category-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { useCategories } from "@/hooks/use-categories";
import { CATEGORY_COLORS, type BookCategory } from "@/lib/category-store";
import { cn } from "@/lib/utils";

type EditState = CategoryDialogState;

export function CategoriesSection({ admin }: { admin: AdminDashboardState }) {
  const { categories, addCategory, updateCategory, deleteCategory, resetToDefaults } =
    useCategories();
  const [editState, setEditState] = useState<EditState>(null);
  const [pendingDelete, setPendingDelete] = useState<BookCategory | null>(null);

  const bookCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of admin.content) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [admin.content]);

  const totalBooks = admin.content.length;

  function handleDelete() {
    if (!pendingDelete) return;
    deleteCategory(pendingDelete.id);
    toast.success(`Category "${pendingDelete.name}" deleted`);
    setPendingDelete(null);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
              <FolderTree className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categorized books
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{totalBooks}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <FolderTree className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Empty categories
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">
                {categories.filter((c) => !bookCounts[c.name]).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-brand-navy">Library categories</h2>
          <p className="text-sm text-muted-foreground">
            Add, rename, recolor, or remove the tracks students filter the library by.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              resetToDefaults();
              toast.success("Categories reset to defaults");
            }}
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
          <Button className="gap-2" onClick={() => setEditState({ mode: "create" })}>
            <Plus className="size-4" />
            Add category
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const color = CATEGORY_COLORS[cat.color];
          const count = bookCounts[cat.name] ?? 0;
          return (
            <Card key={cat.id} className="group shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("size-9 shrink-0 rounded-xl", color.swatch)} />
                    <div>
                      <p className="font-bold text-brand-navy">{cat.name}</p>
                      <Badge variant="secondary" className={cn("mt-1 text-[10px]", color.badge)}>
                        {count} book{count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setEditState({ mode: "edit", category: cat })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      onClick={() => setPendingDelete(cat)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                {cat.description && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">{cat.description}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CategoryDialog
        state={editState}
        onClose={() => setEditState(null)}
        onCreate={(data) => {
          const res = addCategory(data);
          if (!res.ok) {
            toast.error(res.error);
            return false;
          }
          toast.success(`Category "${data.name}" added`);
          return true;
        }}
        onUpdate={(id, data) => {
          const res = updateCategory(id, data);
          if (!res.ok) {
            toast.error(res.error);
            return false;
          }
          toast.success(`Category "${data.name}" updated`);
          return true;
        }}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (bookCounts[pendingDelete.name] ?? 0) > 0 ? (
                <>
                  {bookCounts[pendingDelete.name]} book
                  {bookCounts[pendingDelete.name] !== 1 ? "s" : ""} still use this category. They
                  will keep the label but it will no longer appear as a filter until you re-add it.
                </>
              ) : (
                "This category will be removed from the library filters. This can't be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
