import { useCallback, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import { getFavorites, subscribeFavorites, toggleFavorite } from "@/lib/favorites-store";

const EMPTY: string[] = [];

// useSyncExternalStore requires getSnapshot to return a stable reference when
// nothing changed — getFavorites() re-parses localStorage on every call, so
// without this cache every render would hand back a fresh array and React
// would spin in an infinite update loop (mirrors the cache in use-library-progress.ts).
let cachedUserId = "";
let cachedFavorites: string[] = EMPTY;

function refreshFavoritesCache(userId: string) {
  cachedUserId = userId;
  cachedFavorites = userId ? getFavorites(userId) : EMPTY;
}

/** The signed-in student's starred "want to read" books. */
export function useFavorites() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const subscribe = useCallback(
    (callback: () => void) => {
      refreshFavoritesCache(userId);
      return subscribeFavorites(() => {
        refreshFavoritesCache(userId);
        callback();
      });
    },
    [userId],
  );

  const getSnapshot = useCallback(() => {
    if (cachedUserId !== userId) refreshFavoritesCache(userId);
    return cachedFavorites;
  }, [userId]);

  const favorites = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const toggle = useCallback((bookId: string) => toggleFavorite(userId, bookId), [userId]);
  const isFavorite = useCallback((bookId: string) => favorites.includes(bookId), [favorites]);

  return { favorites, toggle, isFavorite };
}
