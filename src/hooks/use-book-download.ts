import { useCallback, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { getBookPdfUrl } from "@/lib/book-pdfs";
import type { LibraryBook } from "@/lib/mock-data";

/**
 * Book PDF downloads with real progress, error handling, and a persisted
 * "saved" state — the old implementation fired a bare anchor click and
 * toasted "Downloaded" immediately, whether or not anything arrived.
 */

const STORAGE_KEY = "study2earn-book-downloads";
const CHANGE_EVENT = "book-downloads-change";

type SavedMap = Record<string, string>; // bookId → ISO date of last download

function readSaved(): SavedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedMap) : {};
  } catch {
    return {};
  }
}

function markSaved(bookId: string) {
  if (typeof window === "undefined") return;
  const map = readSaved();
  map[bookId] = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

let cachedSaved: SavedMap = {};

function subscribe(callback: () => void) {
  cachedSaved = readSaved();
  const handler = () => {
    cachedSaved = readSaved();
    callback();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

function getSnapshot() {
  return cachedSaved;
}

const EMPTY: SavedMap = {};

function getServerSnapshot() {
  return EMPTY;
}

export type DownloadProgress = {
  /** 0–100, or null when the size is unknown (indeterminate). */
  percent: number | null;
};

import { getDocumentFormat } from "@/lib/media-store";

function downloadFilename(book: Pick<LibraryBook, "short" | "pdfUrl">) {
  const fmt = getDocumentFormat(book.pdfUrl || "");
  const ext = fmt === "ppt" ? "pptx" : fmt === "doc" ? "docx" : fmt === "epub" ? "epub" : "pdf";
  return `${book.short.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
}

export function useBookDownloads() {
  const saved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [active, setActive] = useState<Record<string, DownloadProgress>>({});

  const download = useCallback(
    async (book: Pick<LibraryBook, "id" | "short" | "pdfUrl">) => {
      if (active[book.id]) return; // already downloading this book

      const url = getBookPdfUrl(book);
      setActive((prev) => ({ ...prev, [book.id]: { percent: null } }));

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const total = Number(res.headers.get("content-length")) || 0;
        let blob: Blob;

        if (res.body && total > 0) {
          // Stream so we can show real progress on slow connections
          const reader = res.body.getReader();
          const chunks: BlobPart[] = [];
          let received = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.byteLength;
            const percent = Math.min(100, Math.round((received / total) * 100));
            setActive((prev) => (prev[book.id] ? { ...prev, [book.id]: { percent } } : prev));
          }
          blob = new Blob(chunks, {
            type: res.headers.get("content-type") ?? "application/pdf",
          });
        } else {
          blob = await res.blob();
        }

        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = downloadFilename(book);
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);

        markSaved(book.id);
        const sizeMb = blob.size / (1024 * 1024);
        toast.success(`${book.short} downloaded`, {
          description: `${sizeMb >= 0.1 ? `${sizeMb.toFixed(1)} MB` : "Small"} PDF saved — study offline anytime.`,
        });
      } catch {
        toast.error(`Couldn't download ${book.short}`, {
          description: "Check your connection and try again.",
        });
      } finally {
        setActive((prev) => {
          const next = { ...prev };
          delete next[book.id];
          return next;
        });
      }
    },
    [active],
  );

  const progressOf = useCallback(
    (bookId: string): DownloadProgress | null => active[bookId] ?? null,
    [active],
  );

  const isSaved = useCallback((bookId: string) => Boolean(saved[bookId]), [saved]);

  return { download, progressOf, isSaved };
}
