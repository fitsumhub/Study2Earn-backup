import { createFileRoute } from "@tanstack/react-router";
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Grid3X3,
  List,
  Search,
  Star,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteHeader, SiteFooter, BookCover } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { libraryBooks, type LibraryBook, type LibraryCategory } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — Study2Earn" },
      {
        name: "description",
        content:
          "Curated PDF library of Ethiopian Ministry of Education textbooks and past exam papers.",
      },
    ],
  }),
  component: LibraryPage,
});

const filters: Array<"All" | LibraryCategory> = [
  "All",
  "Natural Science",
  "Social Science",
  "Common",
  "Engineering",
  "Medicine",
];

type SortKey = "popular" | "progress" | "name" | "recent";

function parseStudents(value: string) {
  if (value.endsWith("k")) return parseFloat(value) * 1000;
  return parseFloat(value) || 0;
}

function LibraryPage() {
  const [books, setBooks] = useState(libraryBooks);
  const [activeFilter, setActiveFilter] = useState<"All" | LibraryCategory>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<LibraryBook | null>(null);

  const inProgress = useMemo(
    () => books.filter((b) => b.progress > 0 && b.progress < 100),
    [books],
  );
  const completed = useMemo(() => books.filter((b) => b.progress === 100), [books]);
  const totalXp = useMemo(() => books.reduce((sum, b) => sum + b.xpEarned, 0), [books]);

  const filtered = useMemo(() => {
    let result = [...books];

    if (activeFilter !== "All") {
      result = result.filter((b) => b.category === activeFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.short.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "progress") return b.progress - a.progress;
      if (sort === "recent") {
        const aRecent = a.lastRead && a.lastRead !== "Never" ? 1 : 0;
        const bRecent = b.lastRead && b.lastRead !== "Never" ? 1 : 0;
        return bRecent - aRecent || b.progress - a.progress;
      }
      return parseStudents(b.students) - parseStudents(a.students);
    });

    return result;
  }, [books, activeFilter, search, sort]);

  const continueReading = useMemo(
    () => [...inProgress].sort((a, b) => b.progress - a.progress).slice(0, 3),
    [inProgress],
  );

  const openBook = (book: LibraryBook) => {
    setSelected(book);
    toast.info(`Opening ${book.short}`, { description: "PDF reader loading…" });
  };

  const downloadBook = (book: LibraryBook) => {
    const content = [
      `Study2Earn — ${book.name}`,
      `Category: ${book.category}`,
      `Pages: ${book.pages}`,
      "",
      book.description,
      "",
      "Chapters:",
      ...book.chapterList.map((c, i) => `${i + 1}. ${c.title} (${c.pages} pp)`),
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${book.short.toLowerCase()}-study2earn.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${book.short}`, {
      description: "Course outline saved to your device",
    });
  };

  const markChapterDone = (bookId: string, chapterIndex: number) => {
    setBooks((prev) =>
      prev.map((book) => {
        if (book.id !== bookId) return book;
        if (book.chapterList[chapterIndex]?.done) return book;

        const chapterList = book.chapterList.map((ch, i) =>
          i === chapterIndex ? { ...ch, done: true } : ch,
        );
        const doneCount = chapterList.filter((c) => c.done).length;
        const progress = Math.round((doneCount / chapterList.length) * 100);

        const updated = {
          ...book,
          chapterList,
          progress,
          xpEarned: book.xpEarned + 20,
          lastRead: "Just now",
        };
        setSelected(updated);
        return updated;
      }),
    );
    toast.success("+20 XP earned", { description: "Chapter marked complete" });
  };

  // Keep sheet in sync after state update
  const selectedBook = selected ? (books.find((b) => b.id === selected.id) ?? selected) : null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <header className="mb-10">
            <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">Library</p>
            <h1 className="mt-1 font-serif text-4xl font-bold text-brand-navy md:text-5xl">
              All courseware
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Official Ministry of Education PDFs and past exam papers, organized by track. Reading
              time is logged automatically and rewarded with XP.
            </p>
          </header>

          {/* Stats */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Books available", value: books.length, icon: BookOpen },
              { label: "In progress", value: inProgress.length, icon: Clock },
              { label: "Completed", value: completed.length, icon: CheckCircle2 },
              { label: "XP from reading", value: totalXp.toLocaleString(), icon: Star },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
                  <stat.icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>
                  <p className="font-serif text-2xl font-bold text-brand-navy">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Continue reading */}
          {continueReading.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-brand-navy">Continue reading</h2>
                <Badge variant="secondary" className="bg-brand-gold/15 text-brand-gold">
                  {inProgress.length} active
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {continueReading.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => setSelected(book)}
                    className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-brand-gold/40 hover:shadow-md"
                  >
                    <div className="w-16 shrink-0">
                      <BookCover
                        short={book.short}
                        id={book.id}
                        name={book.name}
                        category={book.category}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-brand-navy">{book.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {book.lastRead ?? "Not started"} • {book.progress}% done
                      </p>
                      <Progress value={book.progress} className="mt-3 h-1.5" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search books, subjects, tracks…"
                className="bg-white pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-navy"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most popular</SelectItem>
                  <SelectItem value="progress">My progress</SelectItem>
                  <SelectItem value="recent">Recently read</SelectItem>
                  <SelectItem value="name">A → Z</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                <Button
                  variant={view === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="size-8"
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="size-4" />
                </Button>
                <Button
                  variant={view === "list" ? "default" : "ghost"}
                  size="icon"
                  className="size-8"
                  onClick={() => setView("list")}
                  aria-label="List view"
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  activeFilter === f
                    ? "border-brand-navy bg-brand-navy text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-navy/40",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <p className="mb-6 text-sm text-slate-500">
            Showing {filtered.length} book{filtered.length !== 1 ? "s" : ""}
            {activeFilter !== "All" ? ` in ${activeFilter}` : ""}
            {search ? ` matching "${search}"` : ""}
          </p>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <BookMarked className="mx-auto size-10 text-slate-300" />
              <p className="mt-4 font-semibold text-brand-navy">No books found</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search or filter.</p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("All");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Grid */}
          {view === "grid" && filtered.length > 0 && (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onOpen={() => setSelected(book)}
                  onDownload={() => downloadBook(book)}
                />
              ))}
            </div>
          )}

          {/* List */}
          {view === "list" && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((book) => (
                <div
                  key={book.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="w-14 shrink-0">
                    <BookCover
                      short={book.short}
                      id={book.id}
                      name={book.name}
                      category={book.category}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-brand-navy">{book.name}</h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {book.category}
                      </Badge>
                      {book.progress === 100 && (
                        <Badge className="bg-emerald-50 text-[10px] text-emerald-700">
                          Complete
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {book.chapters} chapters • {book.pages} pages • {book.students} students • ★{" "}
                      {book.rating}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={book.progress} className="h-1.5 max-w-xs flex-1" />
                      <span className="text-xs font-mono text-slate-500">{book.progress}%</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => setSelected(book)}>
                      Open
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadBook(book)}>
                      <Download className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />

      <BookDetailSheet
        book={selectedBook}
        onClose={() => setSelected(null)}
        onOpen={() => selectedBook && openBook(selectedBook)}
        onDownload={() => selectedBook && downloadBook(selectedBook)}
        onChapterComplete={(index) => selectedBook && markChapterDone(selectedBook.id, index)}
      />
      <Toaster richColors position="top-right" />
    </div>
  );
}

function BookCard({
  book,
  onOpen,
  onDownload,
}: {
  book: LibraryBook;
  onOpen: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-brand-gold/30 hover:shadow-md">
      <button type="button" onClick={onOpen} className="text-left">
        <div className="mb-4">
          <BookCover short={book.short} id={book.id} name={book.name} category={book.category} />
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            {book.category}
          </Badge>
          {book.progress === 100 && (
            <Badge className="bg-emerald-50 text-[10px] text-emerald-700">Complete</Badge>
          )}
        </div>
        <h3 className="text-sm font-bold leading-tight group-hover:text-brand-navy">{book.name}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {book.chapters} chapters • {book.students} students
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Progress value={book.progress} className="h-1.5 flex-1" />
          <span className="text-[10px] font-mono text-slate-400">{book.progress}%</span>
        </div>
        {book.xpEarned > 0 && (
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
            {book.xpEarned} XP earned
          </p>
        )}
      </button>
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onOpen}
          className="text-xs font-bold text-brand-navy underline decoration-brand-gold underline-offset-4"
        >
          Open PDF
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="text-xs font-medium text-slate-500 hover:text-brand-navy"
        >
          Download
        </button>
      </div>
    </div>
  );
}

function BookDetailSheet({
  book,
  onClose,
  onOpen,
  onDownload,
  onChapterComplete,
}: {
  book: LibraryBook | null;
  onClose: () => void;
  onOpen: () => void;
  onDownload: () => void;
  onChapterComplete: (index: number) => void;
}) {
  if (!book) return null;

  const nextChapter = book.chapterList.findIndex((c) => !c.done);

  return (
    <Sheet open={!!book} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex gap-4">
            <div className="w-20 shrink-0">
              <BookCover
                short={book.short}
                id={book.id}
                name={book.name}
                category={book.category}
                size="lg"
              />
            </div>
            <div>
              <SheetTitle className="font-serif text-brand-navy">{book.name}</SheetTitle>
              <SheetDescription className="mt-1">{book.description}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Meta label="Category" value={book.category} />
            <Meta label="Rating" value={`★ ${book.rating}`} />
            <Meta label="Pages" value={String(book.pages)} />
            <Meta label="XP earned" value={book.xpEarned.toLocaleString()} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-brand-navy">Your progress</span>
              <span className="font-mono text-slate-500">{book.progress}%</span>
            </div>
            <Progress value={book.progress} className="h-2" />
            {book.lastRead && book.lastRead !== "Never" && (
              <p className="mt-2 text-xs text-slate-500">Last read {book.lastRead}</p>
            )}
          </div>

          {nextChapter >= 0 && (
            <Button className="w-full gap-2" onClick={onOpen}>
              <BookOpen className="size-4" />
              Continue — Ch. {nextChapter + 1}: {book.chapterList[nextChapter].title}
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={onOpen}>
              <BookOpen className="size-4" />
              Open PDF
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={onDownload}>
              <Download className="size-4" />
              Download
            </Button>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
              Chapters ({book.chapterList.filter((c) => c.done).length}/{book.chapterList.length})
            </h4>
            <ul className="space-y-2">
              {book.chapterList.map((chapter, i) => (
                <li
                  key={chapter.title}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm",
                    chapter.done
                      ? "border-emerald-100 bg-emerald-50/50"
                      : "border-slate-100 bg-slate-50/50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {chapter.done ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <span className="flex size-4 items-center justify-center rounded-full border border-slate-300 text-[10px] text-slate-400">
                        {i + 1}
                      </span>
                    )}
                    <span className={cn(chapter.done && "text-emerald-800")}>{chapter.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{chapter.pages} pp</span>
                    {!chapter.done && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onChapterComplete(i)}
                      >
                        Mark done
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="font-medium text-brand-navy">{value}</p>
    </div>
  );
}
