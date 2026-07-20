import { useCallback, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  extendAdFree,
  isAdFreeActive,
  readPerks,
  subscribePerks,
  type PerksRecord,
} from "@/lib/perks-store";

let cachedUserId = "";
let cachedRecord: PerksRecord = { adFreeUntil: null };

function refreshCache(userId: string) {
  cachedUserId = userId;
  cachedRecord = readPerks(userId);
}

const serverRecord: PerksRecord = { adFreeUntil: null };

export function usePerks() {
  const { loggedIn, user } = useAuth();
  const userId = loggedIn && user ? user.id : "";

  const subscribe = useCallback(
    (callback: () => void) => {
      refreshCache(userId);
      return subscribePerks(() => {
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

  const extend = useCallback(
    (days: number) => {
      if (!userId) return;
      extendAdFree(userId, days);
    },
    [userId],
  );

  return {
    adFreeUntil: record.adFreeUntil,
    adFreeActive: isAdFreeActive(record),
    extendAdFree: extend,
  };
}
