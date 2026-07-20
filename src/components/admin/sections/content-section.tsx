import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BookCover } from "@/components/book-cover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { categoryBadgeClass } from "@/lib/category-store";
import { cn } from "@/lib/utils";

export function ContentSection({ admin }: { admin: AdminDashboardState }) {
  const { content, syncContent, openQuickAction, unsyncedContent, openEdit, deleteContent } = admin;
  const { categories: allCategories, categoryNames } = useCategories();
  const categories = useMemo<string[]>(() => ["All", ...categoryNames], [categoryNames]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("All");

  const syncedCount = content.filter((c) => c.synced).length;
  const publishedCount = content.filter((c) => c.published).length;
  const draftCount = content.filter((c) => !c.published).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return content.filter((item) => {
      const matchesCat = catFilter === "All" || item.category === catFilter;
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.short ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [content, search, catFilter]);

  function copyPdfUrl(url: string) {
    void navigator.clipboard.writeText(url);
    toast.success("PDF URL copied");
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search books…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
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
              Sync all ({unsyncedContent})
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Cover</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Chapters</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sync</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const short =
                    item.short || item.name.split("(")[0].trim().split(" ").pop() || item.name;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="w-10">
                          <BookCover
                            short={short}
                            name={item.name}
                            size="sm"
                            coverUrl={item.coverUrl}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left font-medium hover:underline"
                          onClick={() => openEdit({ type: "content", item })}
                        >
                          {item.name}
                        </button>
                        {item.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                            {item.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <CategoryBadge category={item.category} categories={allCategories} />
                      </TableCell>
                      <TableCell className="tabular-nums">{item.chapters}</TableCell>
                      <TableCell className="tabular-nums">{item.pages ?? "—"}</TableCell>
                      <TableCell>{item.students}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            item.published
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {item.published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            item.synced ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700",
                          )}
                        >
                          {item.synced ? "Synced" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {item.pdfUrl && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                title="Copy PDF URL"
                                onClick={() => copyPdfUrl(item.pdfUrl)}
                              >
                                <Copy className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                title="Open PDF"
                                onClick={() => window.open(item.pdfUrl, "_blank")}
                              >
                                <ExternalLink className="size-3.5" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit({ type: "content", item })}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            onClick={() => deleteContent(item.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={item.synced}
                            onClick={() => syncContent(item.id)}
                          >
                            <RefreshCw className="size-3.5" />
                            {item.synced ? "Up to date" : "Sync"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
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
