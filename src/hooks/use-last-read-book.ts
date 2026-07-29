import { useCallback, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useLibraryProgress } from "@/hooks/use-library-progress";
import type { LibraryBook } from "@/lib/mock-data";
import {
  getMostRecentlyOpenedBookId,
  getReadingPosition,
  subscribeReadingPosition,
} from "@/lib/reading-position-store";

// Cache mirrors use-favorites.ts — useSyncExternalStore needs a stable
// reference when nothing changed, and getMostRecentlyOpenedBookId re-parses
// localStorage on every call.
let cachedUserId = "";
let cachedBookId: string | null = null;

function refreshCache(userId: string) {
  cachedUserId = userId;
  cachedBookId = userId ? getMostRecentlyOpenedBookId(userId) : null;
}

/**
 * The book the signed-in student most recently opened in the reader — even a
 * quick peek counts, not just books they've made progress in. Used to power
 * "continue where you left off" style suggestions elsewhere in the app.
 */
export function useLastReadBook(): { book: LibraryBook | null; lastPage: number } {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { books } = useLibraryProgress();

  const subscribe = useCallback(
    (callback: () => void) => {
      refreshCache(userId);
      return subscribeReadingPosition(() => {
        refreshCache(userId);
        callback();
      });
    },
    [userId],
  );

  const getSnapshot = useCallback(() => {
    if (cachedUserId !== userId) refreshCache(userId);
    return cachedBookId;
  }, [userId]);

  const bookId = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const book = bookId ? (books.find((b) => b.id === bookId) ?? null) : null;
  const lastPage = bookId ? getReadingPosition(userId, bookId).lastPage : 1;

  return { book, lastPage };
}
