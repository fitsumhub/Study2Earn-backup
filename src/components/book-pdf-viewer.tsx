import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

if (typeof window !== "undefined") {
  import("react-pdf/dist/Page/AnnotationLayer.css");
  import("react-pdf/dist/Page/TextLayer.css");
}

import { Progress } from "@/components/ui/progress";
import { getBookPdfUrl } from "@/lib/book-pdfs";
import { useReadingTimer } from "@/hooks/use-reading-timer";
import type { LibraryBook } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type BookPdfViewerProps = {
  book: LibraryBook;
  onClose: () => void;
};

export function BookPdfViewer({ book, onClose }: BookPdfViewerProps) {
  const pdfUrl = getBookPdfUrl(book);
  useReadingTimer(true, book.id, book.name);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [inputVal, setInputVal] = useState("1");
  const [sessionSecs, setSessionSecs] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  const mainRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prev = useCallback(() => setCurrentPage((p) => Math.max(p - 1, 1)), []);
  const next = useCallback(() => setCurrentPage((p) => Math.min(p + 1, numPages)), [numPages]);

  useEffect(() => setInputVal(String(currentPage)), [currentPage]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [currentPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
      }
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(+(s + 0.1).toFixed(1), 2.5));
      if (e.key === "-") setScale((s) => Math.max(+(s - 0.1).toFixed(1), 0.5));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setSessionSecs((s) => {
        const next = s + 1;
        if (next > 0 && next % 30 === 0) setXpEarned((x) => x + 5);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const progressPct = numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0;
  const sidebarW = sidebarOpen ? 200 : 0;
  const mainPageWidth =
    containerWidth > 0 ? Math.min((containerWidth - sidebarW - 80) * scale, 1100) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f3f4f8]">
      {/* ── Top bar ── */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm">
        {/* Back */}
        <button
          type="button"
          onClick={onClose}
          className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Library</span>
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* Thumbnail toggle */}
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label={sidebarOpen ? "Hide thumbnails" : "Show thumbnails"}
          title={sidebarOpen ? "Hide thumbnails" : "Show thumbnails"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
        </button>

        {/* Title area */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900 text-sm leading-tight">{book.name}</p>
          <p className="text-[11px] text-slate-400 leading-tight hidden sm:block">
            {book.category} · {book.short} ·{" "}
            <span className="font-medium text-slate-500">
              {numPages ? `${numPages} pages` : "Loading…"}
            </span>
          </p>
        </div>

        {/* Zoom group */}
        <div className="flex shrink-0 items-center gap-0.5 rounded-lg bg-slate-100 px-1 py-0.5">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(+(s - 0.1).toFixed(1), 0.5))}
            className="rounded p-1.5 text-slate-600 transition hover:bg-white hover:shadow-sm"
            aria-label="Zoom out"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-11 text-center text-xs font-mono font-semibold text-slate-700 tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(+(s + 0.1).toFixed(1), 2.5))}
            className="rounded p-1.5 text-slate-600 transition hover:bg-white hover:shadow-sm"
            aria-label="Zoom in"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Page counter */}
        <div className="shrink-0 flex items-center gap-1 text-sm">
          <label htmlFor="pdf-page-top" className="sr-only">
            Page
          </label>
          <input
            id="pdf-page-top"
            type="number"
            min={1}
            max={numPages || 1}
            value={inputVal}
            aria-label="Current page"
            title="Jump to page"
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={() => {
              const v = parseInt(inputVal, 10);
              if (v >= 1 && v <= numPages) setCurrentPage(v);
              else setInputVal(String(currentPage));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = parseInt(inputVal, 10);
                if (v >= 1 && v <= numPages) setCurrentPage(v);
                else setInputVal(String(currentPage));
                e.currentTarget.blur();
              }
            }}
            className="w-10 rounded border border-slate-200 bg-white py-0.5 text-center text-xs font-semibold text-slate-800 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
          />
          <span className="text-slate-400 text-xs">/ {numPages || "…"}</span>
        </div>

        {/* Session XP indicator */}
        <div
          className={cn(
            "shrink-0 hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-700",
            xpEarned > 0
              ? "border-brand-gold/40 bg-brand-gold/10 text-brand-gold"
              : "border-slate-200 bg-white text-slate-500",
          )}
        >
          <Zap className="size-3.5" />
          {xpEarned > 0 ? `+${xpEarned} XP` : "Earning XP…"}
          <span className="ml-1 font-mono text-[10px] opacity-70">
            {String(Math.floor(sessionSecs / 60)).padStart(2, "0")}:
            {String(sessionSecs % 60).padStart(2, "0")}
          </span>
        </div>
      </header>

      {/* Reading progress bar */}
      <Progress
        value={progressPct}
        className="h-0.5 shrink-0 rounded-none bg-slate-200 [&>div]:bg-brand-gold [&>div]:transition-all [&>div]:duration-500"
      />

      {/* ── Body ── */}
      <div ref={containerRef} className="flex min-h-0 flex-1 overflow-hidden">
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          className="flex min-h-0 flex-1 overflow-hidden"
          loading={null}
          error={null}
        >
          {/* Left thumbnail sidebar */}
          {sidebarOpen && (
            <aside className="flex w-[200px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-sm">
              {/* Sidebar header */}
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-3 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pages
                </p>
                <p className="text-sm font-semibold text-brand-navy tabular-nums">
                  {currentPage}{" "}
                  <span className="font-normal text-slate-400">/ {numPages || "…"}</span>
                </p>
              </div>

              {numPages === 0 ? (
                <div className="flex flex-1 items-center justify-center py-8">
                  <div className="size-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand-gold" />
                </div>
              ) : (
                <div className="pb-4 pt-1">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                    <ThumbEntry
                      key={page}
                      page={page}
                      numPages={numPages}
                      current={currentPage}
                      onClick={() => setCurrentPage(page)}
                    />
                  ))}
                </div>
              )}
            </aside>
          )}

          {/* Main reading area */}
          <main
            ref={mainRef}
            className="relative flex flex-1 flex-col items-center overflow-auto bg-[#e8eaf0] px-6 py-8 sm:px-12"
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX;
              if (Math.abs(dx) > 55) {
                if (dx < 0) next();
                else prev();
              }
              setTouchStartX(null);
            }}
          >
            {/* Left nav arrow */}
            <button
              type="button"
              onClick={prev}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              className={cn(
                "fixed top-1/2 z-20 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-600 transition hover:bg-brand-navy hover:text-white hover:border-brand-navy disabled:opacity-20 disabled:pointer-events-none",
                sidebarOpen ? "left-[212px]" : "left-2.5",
              )}
            >
              <ChevronLeft className="size-5" />
            </button>

            {/* PDF page */}
            {numPages === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <div className="size-10 animate-spin rounded-full border-2 border-white/30 border-t-brand-gold" />
                <p className="text-sm text-slate-500">Loading document…</p>
              </div>
            ) : (
              <div className="rounded-sm shadow-2xl shadow-black/25 ring-1 ring-black/5">
                <Page
                  key={currentPage}
                  pageNumber={currentPage}
                  width={mainPageWidth}
                  renderTextLayer
                  renderAnnotationLayer
                  className="rounded-sm"
                  loading={
                    <div className="aspect-[1/1.414] w-full max-w-4xl animate-pulse rounded-sm bg-slate-200" />
                  }
                />
              </div>
            )}

            {/* Right nav arrow */}
            <button
              type="button"
              onClick={next}
              disabled={currentPage >= numPages}
              aria-label="Next page"
              className="fixed right-4 top-1/2 z-20 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-600 transition hover:bg-brand-navy hover:text-white hover:border-brand-navy disabled:opacity-20 disabled:pointer-events-none"
            >
              <ChevronRight className="size-5" />
            </button>
          </main>
        </Document>
      </div>

      {/* ── Bottom bar ── */}
      <footer className="flex h-12 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 sm:px-6">
        <button
          type="button"
          onClick={prev}
          disabled={currentPage <= 1}
          className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="size-4" /> Prev
        </button>

        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="tabular-nums font-semibold text-slate-800">
            {currentPage} <span className="font-normal text-slate-400">of {numPages || "…"}</span>
          </span>
          <span className="hidden text-xs text-slate-300 sm:inline">·</span>
          <span className="hidden text-xs text-slate-400 sm:inline">{progressPct}% read</span>
        </div>

        <button
          type="button"
          onClick={next}
          disabled={currentPage >= numPages}
          className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none"
        >
          Next <ChevronRight className="size-4" />
        </button>
      </footer>
    </div>
  );
}

/* ── Lazy thumbnail entry ── */
function ThumbEntry({
  page,
  numPages,
  current,
  onClick,
}: {
  page: number;
  numPages: number;
  current: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [render, setRender] = useState(Math.abs(page - current) <= 5);

  useEffect(() => {
    if (render) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRender(true);
      },
      { threshold: 0.05, rootMargin: "300px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [render]);

  useEffect(() => {
    if (page === current) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [page, current]);

  const isActive = page === current;
  const isMidpoint = numPages > 4 && page === Math.ceil(numPages / 2);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        "group mx-3 mt-2 flex flex-col overflow-hidden rounded-lg border-2 transition-all duration-150",
        isActive
          ? "border-brand-gold shadow-md shadow-brand-gold/20"
          : "border-transparent hover:border-slate-300 hover:shadow-sm",
      )}
      aria-label={`Go to page ${page}`}
      aria-current={isActive ? "true" : undefined}
    >
      {/* Slide label */}
      <div
        className={cn(
          "flex items-center justify-between px-2 py-1",
          isActive ? "bg-brand-gold/10" : "bg-slate-50 group-hover:bg-slate-100",
        )}
      >
        <span
          className={cn(
            "text-[10px] font-bold tabular-nums",
            isActive ? "text-brand-gold" : "text-slate-400",
          )}
        >
          {page} / {numPages}
        </span>
        {isMidpoint && (
          <span className="rounded-full bg-brand-navy px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
            Mid
          </span>
        )}
        {page === 1 && (
          <span className="rounded-full bg-brand-gold/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-brand-gold">
            Start
          </span>
        )}
      </div>

      {/* Thumbnail */}
      <div className="w-[172px] overflow-hidden bg-slate-100">
        {render ? (
          <Page
            pageNumber={page}
            width={172}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={<div className="aspect-[3/4] w-full animate-pulse bg-slate-200" />}
          />
        ) : (
          <div className="aspect-[3/4] w-full bg-slate-100" />
        )}
      </div>
    </button>
  );
}
