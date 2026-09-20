import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BookMarked,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Grid3X3,
  Heart,
  List,
  Loader2,
  Search,
  Share2,
  Sparkles,
  Timer,
  X,
  Zap,
} from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteHeader, SiteFooter, BookCover, BackToTop } from "@/components/site-chrome";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ComingSoonGate } from "@/components/coming-soon-gate";
import { PageLoader } from "@/components/page-loader";

const BookPdfViewer = lazy(() =>
  import("@/components/book-pdf-viewer").then((m) => ({ default: m.BookPdfViewer })),
);
import { ReadingRewardCard } from "@/components/reading-reward-card";
import { SponsorAd } from "@/components/sponsor-ad";
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
import { useBookDownloads, type DownloadProgress } from "@/hooks/use-book-download";
import { useCategories } from "@/hooks/use-categories";
import { useFavorites } from "@/hooks/use-favorites";
import { useLibraryProgress } from "@/hooks/use-library-progress";
import { useReadingTime } from "@/hooks/use-reading-time";
import { openBookPdfInBrowser } from "@/lib/book-pdfs";
import { type LibraryBook } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library/")({
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

type SortKey = "popular" | "progress" | "name" | "recent";

function parseStudents(value: string) {
  if (value.endsWith("k")) return parseFloat(value) * 1000;
  return parseFloat(value) || 0;
}

/** Rough estimate so students know what they're signing up for before they start. */
function estimateReadMinutes(pages: number) {
  return Math.max(5, Math.round(pages * 1.5));
}

function formatReadTime(minutes: number) {
  if (minutes < 60) return `~${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `~${h}h` : `~${h}h ${m}m`;
}

function LibraryPage() {
  const navigate = useNavigate();
  const { books, updateBooks } = useLibraryProgress();
  const reading = useReadingTime();
  const { categoryNames } = useCategories();
  const { isFavorite, toggle: toggleFavorite, favorites } = useFavorites();
  const filters = useMemo<string[]>(() => ["All", ...categoryNames], [categoryNames]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<LibraryBook | null>(null);
  const [readingBook, setReadingBook] = useState<LibraryBook | null>(null);

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

    if (favoritesOnly) {
      result = result.filter((b) => isFavorite(b.id));
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
  }, [books, activeFilter, search, sort, favoritesOnly, isFavorite]);

  const continueReading = useMemo(
    () => [...inProgress].sort((a, b) => b.progress - a.progress).slice(0, 3),
    [inProgress],
  );

  const selectBook = (book: LibraryBook, tab: "pdf" | "details" = "details") => {
    const stamped = { ...book, lastRead: "Just now" };
    if (tab === "pdf") {
      setReadingBook(stamped);
    } else {
      setSelected(stamped);
    }
    updateBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, lastRead: "Just now" } : b)));
  };

  const openBookPdf = (book: LibraryBook) => {
    selectBook(book, "pdf");
  };

  const shareBook = async (book: LibraryBook) => {
    const url = `${window.location.origin}/library/read/${encodeURIComponent(book.id)}`;
    const shareData = {
      title: `${book.name} — Study2Earn`,
      text: `Study ${book.name} on Study2Earn.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Book link copied", { description: "Share it with a classmate." });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Could not share this book", {
        description: "Please try again or copy the page URL from your browser.",
      });
    }
  };

  const { download: downloadBook, progressOf, isSaved } = useBookDownloads();

  const markChapterDone = (bookId: string, chapterIndex: number) => {
    updateBooks((prev) =>
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
  const activeReadingBook = readingBook
    ? (books.find((b) => b.id === readingBook.id) ?? readingBook)
    : null;

  return (
    <ComingSoonGate pageKey="library">
      <div className="flex min-h-screen flex-col bg-slate-50">
        <SiteHeader />
        <div
          className={cn(
            "flex flex-1 flex-col",
            selectedBook && "lg:flex-row lg:overflow-hidden lg:max-h-[calc(100vh-4rem)]",
          )}
        >
          <main
            className={cn(
              "flex-1 overflow-y-auto",
              selectedBook &&
                "hidden lg:block lg:max-w-md xl:max-w-lg lg:shrink-0 lg:border-r lg:border-slate-200",
            )}
          >
            <div className="mx-auto max-w-7xl px-6 py-12 lg:max-w-none lg:py-8">
              <Breadcrumbs
                items={
                  selected
                    ? [{ label: "Library", to: "/library" }, { label: selected.short }]
                    : [{ label: "Library" }]
                }
              />
              <header className="mb-10">
                <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
                  Library
                </p>
                <h1 className="mt-1 font-serif text-4xl font-bold text-brand-navy md:text-5xl">
                  All courseware
                </h1>
                <p className="mt-3 max-w-2xl text-slate-600">
                  Official Ministry of Education PDFs and past exam papers, organized by track. Read
                  for <strong className="text-brand-navy">10 hours</strong> to earn a{" "}
                  <strong className="text-brand-gold">100 ETB</strong> cash bonus.
                </p>
              </header>

              <div className="mb-10">
                <ReadingRewardCard reading={reading} />
              </div>

              {/* Stats */}
              <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Books available", value: books.length, icon: BookOpen },
                  { label: "In progress", value: inProgress.length, icon: Clock },
                  { label: "Completed", value: completed.length, icon: CheckCircle2 },
                  {
                    label: "Reading time",
                    value: `${reading.formatted} / ${reading.targetFormatted}`,
                    icon: Clock,
                  },
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

              {/* Sponsored */}
              <SponsorAd placement="library" className="mb-10" />

              {/* Continue reading */}
              {continueReading.length > 0 && (
                <section className="mb-10">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-serif text-xl font-bold text-brand-navy">
                      Continue reading
                    </h2>
                    <Badge variant="secondary" className="bg-brand-gold/15 text-brand-gold">
                      {inProgress.length} active
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {continueReading.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => selectBook(book, "pdf")}
                        className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-brand-gold/40 hover:shadow-md"
                      >
                        <div className="w-16 shrink-0">
                          <BookCover
                            short={book.short}
                            id={book.id}
                            name={book.name}
                            category={book.category}
                            coverUrl={book.coverUrl}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-brand-navy">{book.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {book.lastRead ?? "Not started"} • {book.progress}% done
                          </p>
                          <Progress
                            value={book.progress}
                            className="mt-3 h-1.5 [&>div]:bg-brand-gold"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Featured demo book */}
              {(() => {
                const demo = books.find((b) => b.id === "bk-demo");
                return demo ? (
                  <div className="mb-10">
                    <FeaturedBookBanner book={demo} onRead={() => selectBook(demo, "pdf")} />
                  </div>
                ) : null;
              })()}

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
                  <button
                    type="button"
                    onClick={() => setFavoritesOnly((f) => !f)}
                    disabled={favorites.length === 0 && !favoritesOnly}
                    className={cn(
                      "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition disabled:opacity-40",
                      favoritesOnly
                        ? "border-rose-300 bg-rose-50 text-rose-600"
                        : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-500",
                    )}
                    title="Show only your favorite books"
                    aria-pressed={favoritesOnly}
                  >
                    <Heart className={cn("size-4", favoritesOnly && "fill-rose-500")} />
                    Favorites
                    {favorites.length > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[10px] font-bold",
                          favoritesOnly
                            ? "bg-rose-200/70 text-rose-700"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {favorites.length}
                      </span>
                    )}
                  </button>
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
                {favoritesOnly ? " · favorites only" : ""}
              </p>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                  {favoritesOnly ? (
                    <Heart className="mx-auto size-10 text-slate-300" />
                  ) : (
                    <BookMarked className="mx-auto size-10 text-slate-300" />
                  )}
                  <p className="mt-4 font-semibold text-brand-navy">
                    {favoritesOnly ? "No favorites yet" : "No books found"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {favoritesOnly
                      ? "Tap the heart on any book to save it here."
                      : "Try a different search or filter."}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => {
                      setSearch("");
                      setActiveFilter("All");
                      setFavoritesOnly(false);
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
                      featured={book.id === "bk-demo"}
                      onRead={() => selectBook(book, "pdf")}
                      onDetails={() => selectBook(book, "details")}
                      onDownload={() => downloadBook(book)}
                      downloading={progressOf(book.id)}
                      downloaded={isSaved(book.id)}
                      favorite={isFavorite(book.id)}
                      onToggleFavorite={() => toggleFavorite(book.id)}
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
                          coverUrl={book.coverUrl}
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
                          {book.chapters} chapters • {book.pages} pages • {book.students} students •
                          ★ {book.rating} •{" "}
                          <span className="inline-flex items-center gap-0.5">
                            <Timer className="size-3" />{" "}
                            {formatReadTime(estimateReadMinutes(book.pages))} read
                          </span>
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <Progress
                            value={book.progress}
                            className="h-1.5 max-w-xs flex-1 [&>div]:bg-brand-gold"
                          />
                          <span className="text-xs font-mono text-slate-500">{book.progress}%</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(book.id)}
                          aria-label={
                            isFavorite(book.id) ? "Remove from favorites" : "Add to favorites"
                          }
                          aria-pressed={isFavorite(book.id)}
                          title={isFavorite(book.id) ? "Remove from favorites" : "Add to favorites"}
                          className={cn(
                            "flex size-9 items-center justify-center rounded-md border transition",
                            isFavorite(book.id)
                              ? "border-rose-200 bg-rose-50 text-rose-500"
                              : "border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-500",
                          )}
                        >
                          <Heart className={cn("size-4", isFavorite(book.id) && "fill-rose-500")} />
                        </button>
                        <button
                          type="button"
                          onClick={() => selectBook(book, "pdf")}
                          className="inline-flex h-9 items-center justify-center rounded-md bg-brand-navy px-3 text-xs font-semibold text-white transition hover:bg-brand-navy/90"
                        >
                          Read now
                        </button>
                        <DownloadButton
                          downloading={progressOf(book.id)}
                          downloaded={isSaved(book.id)}
                          onClick={() => downloadBook(book)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          {selectedBook && (
            <aside className="flex min-h-0 flex-1 flex-col border-t border-slate-200 bg-white lg:border-t-0 lg:w-[420px] lg:shrink-0">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-brand-navy">{selectedBook.short}</p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  aria-label="Close panel"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <BookDetailPanel
                  book={selectedBook}
                  onOpenPdf={() => openBookPdf(selectedBook)}
                  onDownload={() => downloadBook(selectedBook)}
                  downloading={progressOf(selectedBook.id)}
                  downloaded={isSaved(selectedBook.id)}
                  onChapterComplete={(index) => markChapterDone(selectedBook.id, index)}
                  favorite={isFavorite(selectedBook.id)}
                  onToggleFavorite={() => toggleFavorite(selectedBook.id)}
                  onShare={() => void shareBook(selectedBook)}
                />
              </div>
            </aside>
          )}
        </div>

        {/* Fullscreen distraction-free PDF reader */}
        {activeReadingBook && (
          <Suspense
            fallback={
              <div className="fixed inset-0 z-50 bg-[#f3f4f8]">
                <PageLoader label="Preparing your reader…" fullScreen />
              </div>
            }
          >
            <BookPdfViewer book={activeReadingBook} onClose={() => setReadingBook(null)} />
          </Suspense>
        )}

        {!selectedBook && <SiteFooter />}
        <BackToTop />
      </div>
    </ComingSoonGate>
  );
}

/** Small reusable download control: idle / animated progress / saved states. */
function DownloadButton({
  downloading,
  downloaded,
  onClick,
  compact = false,
}: {
  downloading: DownloadProgress | null;
  downloaded: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const busy = downloading !== null;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={
        busy
          ? downloading.percent !== null
            ? `Downloading… ${downloading.percent}%`
            : "Downloading…"
          : downloaded
            ? "Downloaded — download again"
            : "Download PDF"
      }
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-lg border font-medium transition",
        compact ? "px-2.5 py-1.5 text-xs" : "h-9 px-3 text-xs",
        busy
          ? "cursor-wait border-brand-navy/20 bg-brand-navy/5 text-brand-navy"
          : downloaded
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
            : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-brand-navy",
      )}
    >
      {busy ? (
        <>
          <Loader2 className={cn("animate-spin", compact ? "size-3.5" : "size-4")} />
          {downloading.percent !== null && (
            <span className="font-mono text-[10px] tabular-nums">{downloading.percent}%</span>
          )}
        </>
      ) : downloaded ? (
        <Check className={compact ? "size-3.5" : "size-4"} />
      ) : (
        <Download className={compact ? "size-3.5" : "size-4"} />
      )}
    </button>
  );
}

function BookCard({
  book,
  onRead,
  onDetails,
  onDownload,
  downloading,
  downloaded,
  featured,
  favorite,
  onToggleFavorite,
}: {
  book: LibraryBook;
  onRead: () => void;
  onDetails: () => void;
  onDownload: () => void;
  downloading: DownloadProgress | null;
  downloaded: boolean;
  featured?: boolean;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1",
        featured
          ? "border-brand-gold/40 ring-1 ring-brand-gold/20 hover:border-brand-gold/70"
          : "border-slate-100 hover:border-brand-gold/30",
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={favorite}
        title={favorite ? "Remove from favorites" : "Add to favorites"}
        className={cn(
          "absolute right-6 top-6 z-10 flex size-7 items-center justify-center rounded-full bg-white/90 shadow transition sm:opacity-0 sm:group-hover:opacity-100",
          favorite ? "text-rose-500 opacity-100!" : "text-slate-400 hover:text-rose-500",
        )}
      >
        <Heart className={cn("size-3.5", favorite && "fill-rose-500")} />
      </button>
      <button type="button" onClick={onRead} className="text-left">
        <div className="relative mb-4 overflow-hidden rounded-lg">
          {featured && (
            <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-bold text-white shadow">
              <Sparkles className="size-2.5" /> Start here
            </span>
          )}
          <div className="transition-transform duration-300 group-hover:scale-[1.03]">
            <BookCover
              short={book.short}
              id={book.id}
              name={book.name}
              category={book.category}
              coverUrl={book.coverUrl}
            />
          </div>
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
          {book.chapters} ch · {book.pages} pp · ★ {book.rating}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
          <Timer className="size-3" /> {formatReadTime(estimateReadMinutes(book.pages))} read
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Progress
            value={book.progress}
            className={cn(
              "h-1.5 flex-1",
              book.progress === 100 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-brand-gold",
            )}
          />
          <span className="text-[10px] font-mono text-slate-400">{book.progress}%</span>
        </div>
        {book.xpEarned > 0 && (
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
            +{book.xpEarned} XP earned
          </p>
        )}
      </button>
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onRead}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-xs font-bold transition-all",
            book.progress === 100
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : book.progress > 0
                ? "bg-brand-navy text-white hover:bg-brand-navy/90"
                : "bg-brand-gold/10 text-brand-navy hover:bg-brand-gold/20",
          )}
        >
          {book.progress === 100
            ? "✓ Read again"
            : book.progress > 0
              ? "Continue →"
              : "Start reading"}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDetails();
          }}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-brand-navy/30 hover:text-brand-navy"
          title={`View details for ${book.name}`}
        >
          Details
        </button>
        <DownloadButton
          downloading={downloading}
          downloaded={downloaded}
          onClick={onDownload}
          compact
        />
      </div>
    </div>
  );
}

function BookDetailPanel({
  book,
  onOpenPdf,
  onDownload,
  downloading,
  downloaded,
  onChapterComplete,
  favorite,
  onToggleFavorite,
  onShare,
}: {
  book: LibraryBook;
  onOpenPdf: () => void;
  onDownload: () => void;
  downloading: DownloadProgress | null;
  downloaded: boolean;
  onChapterComplete: (index: number) => void;
  favorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
}) {
  const nextChapter = book.chapterList.findIndex((c) => !c.done);
  const busy = downloading !== null;

  return (
    <div className="p-6">
      <div className="flex gap-4">
        <div className="w-16 shrink-0">
          <BookCover
            short={book.short}
            id={book.id}
            name={book.name}
            category={book.category}
            coverUrl={book.coverUrl}
            size="lg"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-serif text-lg font-bold text-brand-navy">{book.name}</h2>
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={favorite}
              title={favorite ? "Remove from favorites" : "Add to favorites"}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border transition",
                favorite
                  ? "border-rose-200 bg-rose-50 text-rose-500"
                  : "border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-500",
              )}
            >
              <Heart className={cn("size-4", favorite && "fill-rose-500")} />
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-600">{book.description}</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Meta label="Category" value={book.category} />
          <Meta label="Rating" value={`★ ${book.rating}`} />
          <Meta label="Pages" value={String(book.pages)} />
          <Meta label="Est. reading time" value={formatReadTime(estimateReadMinutes(book.pages))} />
          <Meta label="XP earned" value={book.xpEarned.toLocaleString()} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-brand-navy">Your progress</span>
            <span className="font-mono text-slate-500">{book.progress}%</span>
          </div>
          <Progress value={book.progress} className="h-2 [&>div]:bg-brand-gold" />
          {book.lastRead && book.lastRead !== "Never" && (
            <p className="mt-2 text-xs text-slate-500">Last read {book.lastRead}</p>
          )}
        </div>

        {nextChapter >= 0 && (
          <Button className="w-full gap-2" onClick={onOpenPdf}>
            <BookOpen className="size-4" />
            Continue — Ch. {nextChapter + 1}: {book.chapterList[nextChapter].title}
          </Button>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => openBookPdfInBrowser(book)}
          >
            <BookOpen className="size-4" />
            Open in browser
          </Button>
          <Button
            variant="outline"
            className={cn(
              "flex-1 gap-2",
              downloaded &&
                !busy &&
                "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
            )}
            disabled={busy}
            onClick={onDownload}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {downloading.percent !== null
                  ? `Downloading… ${downloading.percent}%`
                  : "Downloading…"}
              </>
            ) : downloaded ? (
              <>
                <Check className="size-4" />
                Download again
              </>
            ) : (
              <>
                <Download className="size-4" />
                Download
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onShare}
            aria-label={`Share ${book.name}`}
            title="Share this book"
          >
            <Share2 className="size-4" />
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
    </div>
  );
}

function FeaturedBookBanner({ book, onRead }: { book: LibraryBook; onRead: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-navy px-6 py-7 shadow-lg sm:px-8">
      {/* decorative glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 size-48 rounded-full bg-brand-gold/5 blur-2xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        {/* Book cover */}
        <div className="w-24 shrink-0 sm:w-28">
          <div className="overflow-hidden rounded-xl shadow-xl ring-2 ring-brand-gold/30">
            <BookCover
              short={book.short}
              id={book.id}
              name={book.name}
              category={book.category}
              coverUrl={book.coverUrl}
              size="lg"
            />
          </div>
        </div>

        {/* Copy */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-brand-gold/20 px-3 py-0.5 text-xs font-bold text-brand-gold">
              <Sparkles className="size-3" /> Featured · Start here
            </span>
            <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium text-white/70">
              {book.chapters} chapters · {book.pages} pages
            </span>
          </div>

          <h2 className="font-serif text-xl font-bold text-white sm:text-2xl">{book.name}</h2>
          <p className="mt-1.5 max-w-lg text-sm text-white/60">{book.description}</p>

          {/* Earn callout */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-3 py-2">
              <Zap className="size-4 shrink-0 text-brand-gold" />
              <span className="text-xs font-semibold text-white">
                Read <strong className="text-brand-gold">10 hours</strong> across any books → earn{" "}
                <strong className="text-brand-gold">100 ETB</strong> cash
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <button
            type="button"
            onClick={onRead}
            className="flex items-center gap-2 rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-95"
          >
            <BookOpen className="size-4" />
            Open PDF now
          </button>
          <p className="text-center text-[11px] text-white/40 sm:text-right">
            Opens inline · no download needed
          </p>
        </div>
      </div>

      {/* Progress strip — only shows once user has started */}
      {book.progress > 0 && (
        <div className="relative mt-5 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span>Your progress</span>
            <span className="font-mono">{book.progress}%</span>
          </div>
          <Progress value={book.progress} className="h-1.5 bg-white/10 [&>div]:bg-brand-gold" />
        </div>
      )}
    </div>
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
