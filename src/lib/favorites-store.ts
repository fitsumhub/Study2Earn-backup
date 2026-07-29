/** Per-student "want to read" shelf — book ids the student has starred for quick access. */
const STORAGE_KEY = "study2earn-library-favorites";

type FavoritesStore = Record<string, string[]>;

function readStore(): FavoritesStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavoritesStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: FavoritesStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("favorites-change"));
}

export function subscribeFavorites(cb: () => void) {
  window.addEventListener("favorites-change", cb);
  return () => window.removeEventListener("favorites-change", cb);
}

export function getFavorites(userId: string): string[] {
  if (!userId) return [];
  return readStore()[userId] ?? [];
}

export function toggleFavorite(userId: string, bookId: string): string[] {
  if (!userId) return [];
  const store = readStore();
  const mine = store[userId] ?? [];
  const next = mine.includes(bookId) ? mine.filter((id) => id !== bookId) : [...mine, bookId];
  store[userId] = next;
  writeStore(store);
  return next;
}
