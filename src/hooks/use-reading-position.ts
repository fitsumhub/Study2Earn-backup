import { useCallback, useEffect, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  getReadingPosition,
  markBookOpened,
  saveLastPage,
  subscribeReadingPosition,
  toggleBookmark,
} from "@/lib/reading-position-store";

type Position = { lastPage: number; bookmarks: number[]; lastOpenedAt?: string };
const EMPTY: Position = { lastPage: 1, bookmarks: [] };

// Same caching requirement as use-favorites.ts: getReadingPosition() re-parses
// localStorage on every call, so getSnapshot must hand back a stable reference
// (keyed by user+book) instead of a fresh object each render, or React spins.
let cachedKey = "";
let cachedPosition: Position = EMPTY;

function refreshPositionCache(userId: string, bookId: string) {
  cachedKey = `${userId}::${bookId}`;
  cachedPosition = userId && bookId ? getReadingPosition(userId, bookId) : EMPTY;
}

/** Resume-page + bookmark state for one book, scoped to the signed-in student. */
export function useReadingPosition(bookId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const subscribe = useCallback(
    (callback: () => void) => {
      refreshPositionCache(userId, bookId);
      return subscribeReadingPosition(() => {
        refreshPositionCache(userId, bookId);
        callback();
      });
    },
    [userId, bookId],
  );

  const getSnapshot = useCallback(() => {
    if (cachedKey !== `${userId}::${bookId}`) refreshPositionCache(userId, bookId);
    return cachedPosition;
  }, [userId, bookId]);

  const position = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  // Stamps "opened" the moment a student lands on this book's reader — this is
  // a weaker signal than actual reading progress, so it must never affect XP.
  useEffect(() => {
    if (userId && bookId) markBookOpened(userId, bookId);
  }, [userId, bookId]);

  const savePage = useCallback(
    (page: number) => saveLastPage(userId, bookId, page),
    [userId, bookId],
  );
  const toggleCurrentBookmark = useCallback(
    (page: number) => toggleBookmark(userId, bookId, page),
    [userId, bookId],
  );

  return { ...position, savePage, toggleBookmark: toggleCurrentBookmark };
}
