import { useCallback, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  readFrames,
  subscribeFrames,
  unlockFrame,
  equipFrame,
  type FrameRecord,
} from "@/lib/frame-store";

let cachedUserId = "";
let cachedRecord: FrameRecord = { owned: [], equipped: null };

function refreshCache(userId: string) {
  cachedUserId = userId;
  cachedRecord = readFrames(userId);
}

const serverRecord: FrameRecord = { owned: [], equipped: null };

export function useFrames() {
  const { loggedIn, user } = useAuth();
  const userId = loggedIn && user ? user.id : "";

  const subscribe = useCallback(
    (callback: () => void) => {
      refreshCache(userId);
      return subscribeFrames(() => {
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
    (frameId: string) => {
      if (!userId) return;
      unlockFrame(userId, frameId);
    },
    [userId],
  );

  const equip = useCallback(
    (frameId: string | null) => {
      if (!userId) return;
      equipFrame(userId, frameId);
    },
    [userId],
  );

  return {
    owned: record.owned,
    equipped: record.equipped,
    unlock,
    equip,
    isOwned: (frameId: string) => record.owned.includes(frameId),
    isEquipped: (frameId: string) => record.equipped === frameId,
  };
}
