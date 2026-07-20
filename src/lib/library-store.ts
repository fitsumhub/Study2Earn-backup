import { libraryBooks, type LibraryBook } from "@/lib/mock-data";

const STORAGE_KEY = "study2earn-library";

export function readLibraryBooks(): LibraryBook[] {
  if (typeof window === "undefined") return libraryBooks;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return libraryBooks;
    const parsed = JSON.parse(raw) as LibraryBook[];
    if (!Array.isArray(parsed) || parsed.length === 0) return libraryBooks;
    return parsed.map((book) => {
      const defaults = libraryBooks.find((b) => b.id === book.id);
      return defaults ? { ...defaults, ...book } : book;
    });
  } catch {
    return libraryBooks;
  }
}

export function writeLibraryBooks(books: LibraryBook[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  window.dispatchEvent(new Event("library-change"));
}

export function subscribeLibrary(cb: () => void) {
  window.addEventListener("library-change", cb);
  return () => window.removeEventListener("library-change", cb);
}

export function getLibraryXpTotal(books: LibraryBook[] = readLibraryBooks()) {
  return books.reduce((sum, book) => sum + (book.xpEarned ?? 0), 0);
}

export function addBookReadingSeconds(bookId: string, seconds: number) {
  if (typeof window === "undefined" || !bookId || seconds <= 0) return;
  const books = readLibraryBooks();
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

  books[bookIndex] = {
    ...book,
    progress: newProgress,
    xpEarned: (book.xpEarned ?? 0) + xpEarned,
    chapterList: updatedChapterList,
    lastRead: "Just now",
  };

  writeLibraryBooks(books);
}
