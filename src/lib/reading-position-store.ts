/**
 * Per-student, per-book reading position — which page they were last on, and
 * which pages they've starred. Separate from library-store's progress/XP
 * ledger because this is pure UX convenience (resume + bookmarks), not
 * anything that should ever affect rewards.
 */
const STORAGE_KEY = "study2earn-reading-position";

type BookPosition = {
  lastPage: number;
  bookmarks: number[];
  /** ISO timestamp of the last time this book was opened in the reader — powers "continue where you left off". */
  lastOpenedAt?: string;
};
type PositionStore = Record<string, Record<string, BookPosition>>;

function readStore(): PositionStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PositionStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: PositionStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("reading-position-change"));
}

export function subscribeReadingPosition(cb: () => void) {
  window.addEventListener("reading-position-change", cb);
  return () => window.removeEventListener("reading-position-change", cb);
}

export function getReadingPosition(userId: string, bookId: string): BookPosition {
  if (!userId || !bookId) return { lastPage: 1, bookmarks: [] };
  const entry = readStore()[userId]?.[bookId];
  return {
    lastPage: entry?.lastPage ?? 1,
    bookmarks: entry?.bookmarks ?? [],
    lastOpenedAt: entry?.lastOpenedAt,
  };
}

/** Stamps "opened right now" — called whenever the reader mounts, independent of active reading time or XP. */
export function markBookOpened(userId: string, bookId: string) {
  if (!userId || !bookId) return;
  const store = readStore();
  const mine = { ...(store[userId] ?? {}) };
  const current = mine[bookId] ?? { lastPage: 1, bookmarks: [] };
  mine[bookId] = { ...current, lastOpenedAt: new Date().toISOString() };
  store[userId] = mine;
  writeStore(store);
}

/** The bookId this student most recently opened in the reader, or null if they've never opened one. */
export function getMostRecentlyOpenedBookId(userId: string): string | null {
  if (!userId) return null;
  const mine = readStore()[userId];
  if (!mine) return null;
  let bestId: string | null = null;
  let bestTime = -Infinity;
  for (const [bookId, position] of Object.entries(mine)) {
    if (!position.lastOpenedAt) continue;
    const t = new Date(position.lastOpenedAt).getTime();
    if (t > bestTime) {
      bestTime = t;
      bestId = bookId;
    }
  }
  return bestId;
}

export function saveLastPage(userId: string, bookId: string, page: number) {
  if (!userId || !bookId || page < 1) return;
  const store = readStore();
  const mine = { ...(store[userId] ?? {}) };
  const current = mine[bookId] ?? { lastPage: 1, bookmarks: [] };
  if (current.lastPage === page) return;
  mine[bookId] = { ...current, lastPage: page };
  store[userId] = mine;
  writeStore(store);
}

export function toggleBookmark(userId: string, bookId: string, page: number): number[] {
  if (!userId || !bookId) return [];
  const store = readStore();
  const mine = { ...(store[userId] ?? {}) };
  const current = mine[bookId] ?? { lastPage: page, bookmarks: [] };
  const bookmarks = current.bookmarks.includes(page)
    ? current.bookmarks.filter((p) => p !== page)
    : [...current.bookmarks, page].sort((a, b) => a - b);
  mine[bookId] = { ...current, bookmarks };
  store[userId] = mine;
  writeStore(store);
  return bookmarks;
}
