import { useCallback, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  readCosmetics,
  setActiveGlow,
  subscribeCosmetics,
  unlockGlow,
  type CosmeticsRecord,
  type GlowTheme,
} from "@/lib/cosmetics-store";

let cachedUserId = "";
let cachedRecord: CosmeticsRecord = { owned: [], active: null };

function refreshCache(userId: string) {
  cachedUserId = userId;
  cachedRecord = readCosmetics(userId);
}

const serverRecord: CosmeticsRecord = { owned: [], active: null };

export function useCosmetics() {
  const { loggedIn, user } = useAuth();
  const userId = loggedIn && user ? user.id : "";

  const subscribe = useCallback(
    (callback: () => void) => {
      refreshCache(userId);
      return subscribeCosmetics(() => {
        refreshCache(userId);
        callback();
      });
    },
    [userId],
  );

  const getSnapshot = useCallback(() => {
    if (cachedUserId !== userId) refreshCache(userId);
    return cachedRecord;
  }, [userId]);

  const record = useSyncExternalStore(subscribe, getSnapshot, () => serverRecord);

  const unlock = useCallback(
    (theme: GlowTheme) => {
      if (!userId) return;
      unlockGlow(userId, theme);
    },
    [userId],
  );

  const setActive = useCallback(
    (theme: GlowTheme | null) => {
      if (!userId) return;
      setActiveGlow(userId, theme);
    },
    [userId],
  );

  return {
    owned: record.owned,
    active: record.active,
    unlock,
    setActive,
  };
}
