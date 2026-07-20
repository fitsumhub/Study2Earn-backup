import { useCallback, useSyncExternalStore } from "react";

import {
  getLibraryXpTotal,
  readLibraryBooks,
  subscribeLibrary,
  writeLibraryBooks,
} from "@/lib/library-store";
import { libraryBooks, type LibraryBook } from "@/lib/mock-data";

let cachedBooks: LibraryBook[] = libraryBooks;

function refreshLibraryCache() {
  cachedBooks = readLibraryBooks();
}

function subscribe(callback: () => void) {
  refreshLibraryCache();
  return subscribeLibrary(() => {
    refreshLibraryCache();
    callback();
  });
}

function getSnapshot() {
  return cachedBooks;
}

function getServerSnapshot() {
  return libraryBooks;
}

export function useLibraryProgress() {
  const books = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateBooks = useCallback((updater: (prev: LibraryBook[]) => LibraryBook[]) => {
    writeLibraryBooks(updater(readLibraryBooks()));
  }, []);

  const totalLibraryXp = getLibraryXpTotal(books);

  return {
    books,
    updateBooks,
    totalLibraryXp,
  };
}
