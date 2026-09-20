import { libraryBooks, type LibraryBook } from "@/lib/mock-data";

/**
 * The book catalog (title, cover, category, PDF, chapter structure) is shared
 * and admin-managed. Reading progress (percent, XP earned, which chapters are
 * done) is per-student and lives in a separate store keyed by userId — this
 * split matters because a single shared record used to mean every account in
 * the browser saw (and could inflate) the same progress/XP, and a brand-new
 * account inherited the demo catalog's baked-in "already read" XP as if it
 * were its own.
 */
const CATALOG_KEY = "study2earn-library";
const PROGRESS_KEY = "study2earn-library-progress";

type BookProgress = {
  progress: number;
  xpEarned: number;
  chapterDone: boolean[];
  lastRead?: string;
};
type ProgressStore = Record<string, Record<string, BookProgress>>;

function zeroed(book: LibraryBook): LibraryBook {
  return {
    ...book,
    progress: 0,
    xpEarned: 0,
    chapterList: book.chapterList.map((c) => ({ ...c, done: false })),
  };
}

function readCatalog(): LibraryBook[] {
  if (typeof window === "undefined") return libraryBooks;
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (!raw) return libraryBooks;
    const parsed = JSON.parse(raw) as LibraryBook[];
    if (!Array.isArray(parsed) || parsed.length === 0) return libraryBooks;
    const existing = parsed.map((book) => {
      const defaults = libraryBooks.find((b) => b.id === book.id);
      return defaults ? { ...defaults, ...book } : book;
    });
    const existingIds = new Set(existing.map((book) => book.id));
    return [...existing, ...libraryBooks.filter((book) => !existingIds.has(book.id))];
  } catch {
    return libraryBooks;
  }
}

function writeCatalog(books: LibraryBook[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CATALOG_KEY, JSON.stringify(books));
  window.dispatchEvent(new Event("library-change"));
}

function readProgressStore(): ProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as ProgressStore) : {};
  } catch {
    return {};
  }
}

function writeProgressStore(store: ProgressStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("library-change"));
}

export function subscribeLibrary(cb: () => void) {
  window.addEventListener("library-change", cb);
  return () => window.removeEventListener("library-change", cb);
}

/** Catalog merged with one student's own progress — never another account's. */
export function readLibraryBooks(userId: string): LibraryBook[] {
  const catalog = readCatalog();
  if (!userId) return catalog.map(zeroed);
  const mine = readProgressStore()[userId] ?? {};
  return catalog.map((book) => {
    const p = mine[book.id];
    if (!p) return zeroed(book);
    return {
      ...book,
      progress: p.progress,
      xpEarned: p.xpEarned,
      lastRead: p.lastRead ?? book.lastRead,
      chapterList: book.chapterList.map((c, i) => ({ ...c, done: p.chapterDone[i] ?? false })),
    };
  });
}

/** Persists one student's progress for the given (already-merged) books. */
export function writeLibraryProgress(userId: string, books: LibraryBook[]) {
  if (!userId) return;
  const store = readProgressStore();
  const mine = { ...(store[userId] ?? {}) };
  for (const book of books) {
    mine[book.id] = {
      progress: book.progress,
      xpEarned: book.xpEarned,
      chapterDone: book.chapterList.map((c) => c.done),
      lastRead: book.lastRead,
    };
  }
  store[userId] = mine;
  writeProgressStore(store);
}

export function getLibraryXpTotal(books: LibraryBook[]) {
  return books.reduce((sum, book) => sum + (book.xpEarned ?? 0), 0);
}

export function addBookReadingSeconds(userId: string, bookId: string, seconds: number) {
  if (typeof window === "undefined" || !userId || !bookId || seconds <= 0) return;
  const books = readLibraryBooks(userId);
  const bookIndex = books.findIndex((b) => b.id === bookId);
  if (bookIndex === -1) return;

  const book = books[bookIndex];
  if (book.progress >= 100) return;

  // 30 seconds = 1% progress
  const newProgress = Math.min(100, book.progress + 1);
  const progressDiff = newProgress - book.progress;
  if (progressDiff <= 0) return;

  const xpEarned = progressDiff * 5; // 5 XP per 1% progress

  const totalChapters = book.chapterList.length;
  const updatedChapterList = book.chapterList.map((ch, idx) => {
    const threshold = ((idx + 1) / totalChapters) * 100;
    return {
      ...ch,
      done: newProgress >= threshold ? true : ch.done,
    };
  });

  const updated: LibraryBook = {
    ...book,
    progress: newProgress,
    xpEarned: (book.xpEarned ?? 0) + xpEarned,
    chapterList: updatedChapterList,
    lastRead: "Just now",
  };

  writeLibraryProgress(userId, [updated]);
}

/** Admin catalog management (titles, covers, PDFs, chapter structure) — shared, not per-student. */
export function readLibraryCatalog(): LibraryBook[] {
  return readCatalog();
}

export function writeLibraryCatalog(books: LibraryBook[]) {
  writeCatalog(books);
}
