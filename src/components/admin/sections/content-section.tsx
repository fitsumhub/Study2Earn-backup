import {
  AlertCircle,
  ArrowDownAZ,
  BookOpen,
  Check,
  Clock,
  Copy,
  ExternalLink,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Table2,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { BookCover } from "@/components/book-cover";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { useCategories } from "@/hooks/use-categories";
import type { AdminContent } from "@/lib/admin-types";
import { categoryBadgeClass } from "@/lib/category-store";
import { cn } from "@/lib/utils";

type SortKey = "recent" | "name" | "students" | "chapters";

/** "8.2k" / "1,240" / "0" → a comparable number. Non-numeric strings sort last. */
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

export function ContentSection({ admin }: { admin: AdminDashboardState }) {
  const {
    content,
    syncContent,
    openQuickAction,
    unsyncedContent,
    openEdit,
    deleteContent,
    toggleContentPublished,
    bulkDeleteContent,
    bulkSetContentPublished,
    bulkSetContentCategory,
    bulkSyncContent,
  } = admin;
  const { categories: allCategories, categoryNames } = useCategories();
  const categories = useMemo<string[]>(() => ["All", ...categoryNames], [categoryNames]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<AdminContent | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortBy, setSortBy] = useState<SortKey>("recent");

  const syncedCount = content.filter((c) => c.synced).length;
  const publishedCount = content.filter((c) => c.published).length;
  const draftCount = content.filter((c) => !c.published).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = content.filter((item) => {
      const matchesCat = catFilter === "All" || item.category === catFilter;
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.short ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
    if (sortBy === "recent") return matches;
    const sorted = [...matches];
    if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "students")
      sorted.sort((a, b) => parseStudentCount(b.students) - parseStudentCount(a.students));
    else if (sortBy === "chapters") sorted.sort((a, b) => b.chapters - a.chapters);
    return sorted;
  }, [content, search, catFilter, sortBy]);

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

  function copyPdfUrl(url: string) {
    void navigator.clipboard.writeText(url);
    toast.success("PDF URL copied");
  }

  const selectedIds = Array.from(selected);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total books
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{content.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Check className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Published
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{publishedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Draft
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{draftCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <RefreshCw className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Synced / Total
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">
                {syncedCount}/{content.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search books…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-[168px] bg-white" aria-label="Sort books">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                <Clock className="size-3.5" /> Recently added
              </SelectItem>
              <SelectItem value="name">
                <ArrowDownAZ className="size-3.5" /> Name (A–Z)
              </SelectItem>
              <SelectItem value="students">
                <Users className="size-3.5" /> Most students
              </SelectItem>
              <SelectItem value="chapters">
                <BookOpen className="size-3.5" /> Most chapters
              </SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex rounded-md border bg-white shadow-sm">
            <button
              type="button"
              title="Table view"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-l-md px-3 py-2 text-xs font-medium transition",
                viewMode === "table"
                  ? "bg-brand-navy text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <Table2 className="size-3.5" /> Table
            </button>
            <button
              type="button"
              title="Grid view"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-r-md border-l px-3 py-2 text-xs font-medium transition",
                viewMode === "grid"
                  ? "bg-brand-navy text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <LayoutGrid className="size-3.5" /> Grid
            </button>
          </div>

          {unsyncedContent > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-amber-700 border-amber-200 hover:bg-amber-50"
              onClick={() => {
                content.filter((c) => !c.synced).forEach((c) => syncContent(c.id));
              }}
            >
              <RefreshCw className="size-3.5" />
              <span className="hidden sm:inline">Sync all</span> ({unsyncedContent})
            </Button>
          )}
          <Button className="gap-2" onClick={() => openQuickAction("uploadContent")}>
            <BookOpen className="size-4" />
            Add book
          </Button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCatFilter(cat)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
              catFilter === cat
                ? "bg-brand-navy text-white border-brand-navy"
                : "bg-white text-slate-600 border-slate-200 hover:border-brand-navy/30 hover:text-brand-navy",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-gold/30 bg-brand-gold/5 px-4 py-3">
          <span className="text-sm font-semibold text-brand-navy">
            {selectedIds.length} selected
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Select value="" onValueChange={(cat) => bulkSetContentCategory(selectedIds, cat)}>
              <SelectTrigger
                className="h-8 w-[168px] bg-white text-xs"
                aria-label="Change category"
              >
                <SelectValue placeholder="Change category…" />
              </SelectTrigger>
              <SelectContent>
                {categoryNames.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-white"
              onClick={() => bulkSetContentPublished(selectedIds, true)}
            >
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-white"
              onClick={() => bulkSetContentPublished(selectedIds, false)}
            >
              Unpublish
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-white"
              onClick={() => bulkSyncContent(selectedIds)}
            >
              <RefreshCw className="size-3.5" />
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-white text-destructive hover:bg-destructive/10"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-brand-navy">MoE curriculum library</CardTitle>
          <CardDescription>
            {filtered.length} of {content.length} books
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No books match your filters.
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((item) => {
                const short =
                  item.short || item.name.split("(")[0].trim().split(" ").pop() || item.name;
                return (
                  <div
                    key={item.id}
                    className="group relative rounded-xl border border-slate-100 p-2.5 transition-shadow hover:shadow-md"
                  >
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={(v) => toggleOne(item.id, v === true)}
                      aria-label={`Select ${item.name}`}
                      className="absolute left-4 top-4 z-10 bg-white shadow-sm"
                    />
                    <div className="absolute right-4 top-4 z-10">
                      <ContentRowActions
                        item={item}
                        onEdit={() => openEdit({ type: "content", item })}
                        onCopyPdfUrl={copyPdfUrl}
                        onSync={syncContent}
                        onDelete={setPendingDelete}
                        trigger={
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7 bg-white/90 shadow-sm backdrop-blur"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="block w-full"
                      onClick={() => openEdit({ type: "content", item })}
                    >
                      <BookCover
                        short={short}
                        name={item.name}
                        size="md"
                        coverUrl={item.coverUrl}
                      />
                    </button>
                    <button
                      type="button"
                      className="mt-2 line-clamp-2 text-left text-xs font-semibold text-brand-navy hover:underline"
                      onClick={() => openEdit({ type: "content", item })}
                    >
                      {item.name}
                    </button>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <CategoryBadge category={item.category} categories={allCategories} />
                      {!item.synced && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-50 text-[9px] text-amber-700"
                        >
                          <AlertCircle className="mr-0.5 size-2.5" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {item.chapters} ch · {item.students} students
                    </p>
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
                      <span className="text-[10px] font-medium text-slate-500">
                        {item.published ? "Published" : "Draft"}
                      </span>
                      <Switch
                        checked={item.published}
                        onCheckedChange={() => toggleContentPublished(item.id)}
                        aria-label={item.published ? "Unpublish" : "Publish"}
                        className="scale-75"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {/* Mobile: card list — every control (publish, actions) reachable without horizontal scroll */}
              <div className="space-y-3 md:hidden">
                <label className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-500">
                  <Checkbox
                    checked={allFilteredSelected || (someFilteredSelected && "indeterminate")}
                    onCheckedChange={(v) => toggleAllFiltered(v === true)}
                    aria-label="Select all"
                  />
                  Select all
                </label>
                {filtered.map((item) => {
                  const short =
                    item.short || item.name.split("(")[0].trim().split(" ").pop() || item.name;
                  return (
                    <div key={item.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selected.has(item.id)}
                          onCheckedChange={(v) => toggleOne(item.id, v === true)}
                          aria-label={`Select ${item.name}`}
                          className="mt-1"
                        />
                        <div className="w-8 shrink-0">
                          <BookCover
                            short={short}
                            name={item.name}
                            size="sm"
                            coverUrl={item.coverUrl}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            className="text-left font-medium hover:underline"
                            onClick={() => openEdit({ type: "content", item })}
                          >
                            {item.name}
                          </button>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <CategoryBadge category={item.category} categories={allCategories} />
                            {!item.synced && (
                              <Badge
                                variant="secondary"
                                className="bg-amber-50 text-amber-700 text-[10px]"
                              >
                                <AlertCircle className="mr-1 size-2.5" />
                                Sync pending
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {item.chapters} ch · {item.pages ?? "—"} pg · {item.students} students
                          </p>
                        </div>
                        <ContentRowActions
                          item={item}
                          onEdit={() => openEdit({ type: "content", item })}
                          onCopyPdfUrl={copyPdfUrl}
                          onSync={syncContent}
                          onDelete={setPendingDelete}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <span className="text-xs font-medium text-slate-500">
                          {item.published ? "Published" : "Draft"}
                        </span>
                        <Switch
                          checked={item.published}
                          onCheckedChange={() => toggleContentPublished(item.id)}
                          aria-label={item.published ? "Unpublish" : "Publish"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: full table */}
              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allFilteredSelected || (someFilteredSelected && "indeterminate")}
                          onCheckedChange={(v) => toggleAllFiltered(v === true)}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead className="hidden sm:table-cell">Category</TableHead>
                      <TableHead className="hidden lg:table-cell">Stats</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="w-10 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => {
                      const short =
                        item.short || item.name.split("(")[0].trim().split(" ").pop() || item.name;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(item.id)}
                              onCheckedChange={(v) => toggleOne(item.id, v === true)}
                              aria-label={`Select ${item.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <div className="w-8 shrink-0">
                                <BookCover
                                  short={short}
                                  name={item.name}
                                  size="sm"
                                  coverUrl={item.coverUrl}
                                />
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  className="text-left font-medium hover:underline"
                                  onClick={() => openEdit({ type: "content", item })}
                                >
                                  {item.name}
                                </button>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span className="sm:hidden">
                                    <CategoryBadge
                                      category={item.category}
                                      categories={allCategories}
                                    />
                                  </span>
                                  {!item.synced && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-amber-50 text-amber-700 text-[10px]"
                                    >
                                      <AlertCircle className="mr-1 size-2.5" />
                                      Sync pending
                                    </Badge>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                                    {item.description}
                                  </p>
                                )}
                                <p className="mt-0.5 text-[11px] text-slate-400 lg:hidden">
                                  {item.chapters} ch · {item.pages ?? "—"} pg · {item.students}{" "}
                                  students
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <CategoryBadge category={item.category} categories={allCategories} />
                          </TableCell>
                          <TableCell className="hidden text-sm text-slate-500 lg:table-cell">
                            {item.chapters} ch · {item.pages ?? "—"} pg · {item.students} students
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={item.published}
                              onCheckedChange={() => toggleContentPublished(item.id)}
                              aria-label={item.published ? "Unpublish" : "Publish"}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <ContentRowActions
                              item={item}
                              onEdit={() => openEdit({ type: "content", item })}
                              onCopyPdfUrl={copyPdfUrl}
                              onSync={syncContent}
                              onDelete={setPendingDelete}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Single delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the book from the student library and deletes any uploaded PDF/cover
              stored in this browser. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) deleteContent(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} books?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all selected books from the student library and deletes any uploaded
              PDFs/covers stored in this browser. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                bulkDeleteContent(selectedIds);
                clearSelection();
                setBulkDeleteOpen(false);
              }}
            >
              Delete {selectedIds.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ContentRowActions({
  item,
  onEdit,
  onCopyPdfUrl,
  onSync,
  onDelete,
  trigger,
}: {
  item: AdminContent;
  onEdit: () => void;
  onCopyPdfUrl: (url: string) => void;
  onSync: (id: string) => void;
  onDelete: (item: AdminContent) => void;
  /** Custom trigger element (e.g. for grid-view cards) — defaults to a ghost icon button. */
  trigger?: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="size-8 shrink-0">
            <MoreHorizontal className="size-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 size-4" />
          Edit book
        </DropdownMenuItem>
        {item.pdfUrl && (
          <>
            <DropdownMenuItem onClick={() => onCopyPdfUrl(item.pdfUrl)}>
              <Copy className="mr-2 size-4" />
              Copy PDF URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(item.pdfUrl, "_blank")}>
              <ExternalLink className="mr-2 size-4" />
              Open PDF
            </DropdownMenuItem>
          </>
        )}
        {!item.synced && (
          <DropdownMenuItem onClick={() => onSync(item.id)}>
            <RefreshCw className="mr-2 size-4" />
            Sync now
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item)}>
          <Trash2 className="mr-2 size-4" />
          Delete book
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
      className={cn("whitespace-nowrap", categoryBadgeClass(category, categories))}
    >
      {category}
    </Badge>
  );
}
