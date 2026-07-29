import { useCallback, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  getLibraryXpTotal,
  readLibraryBooks,
  subscribeLibrary,
  writeLibraryProgress,
} from "@/lib/library-store";
import { libraryBooks, type LibraryBook } from "@/lib/mock-data";

const EMPTY_BOOKS: LibraryBook[] = libraryBooks.map((b) => ({
  ...b,
  progress: 0,
  xpEarned: 0,
  chapterList: b.chapterList.map((c) => ({ ...c, done: false })),
}));

let cachedUserId = "";
let cachedBooks: LibraryBook[] = EMPTY_BOOKS;

function refreshLibraryCache(userId: string) {
  cachedUserId = userId;
  cachedBooks = userId ? readLibraryBooks(userId) : EMPTY_BOOKS;
}

export function useLibraryProgress() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const subscribe = useCallback(
    (callback: () => void) => {
      refreshLibraryCache(userId);
      return subscribeLibrary(() => {
        refreshLibraryCache(userId);
        callback();
      });
    },
    [userId],
  );

  const getSnapshot = useCallback(() => {
    if (cachedUserId !== userId) refreshLibraryCache(userId);
    return cachedBooks;
  }, [userId]);

  const books = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_BOOKS);

  const updateBooks = useCallback(
    (updater: (prev: LibraryBook[]) => LibraryBook[]) => {
      if (!userId) return;
      writeLibraryProgress(userId, updater(readLibraryBooks(userId)));
    },
    [userId],
  );

  const totalLibraryXp = getLibraryXpTotal(books);

  return {
    books,
    updateBooks,
    totalLibraryXp,
  };
}
