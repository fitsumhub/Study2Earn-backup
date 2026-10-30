import { useCallback, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  formatReadingDuration,
  readingHoursRemaining,
  readingProgressPercent,
  READING_REWARD_ETB,
  READING_REWARD_HOURS,
  READING_REWARD_TARGET_SECONDS,
  READING_REWARD_XP,
} from "@/lib/reading-time-data";
import {
  canClaimReadingReward,
  claimReadingReward,
  readReadingTime,
  subscribeReadingTime,
  type ReadingTimeRecord,
} from "@/lib/reading-time-store";

let cachedUserId = "";
let cachedRecord: ReadingTimeRecord = { totalSeconds: 0, rewardClaimed: false };

function refreshReadingCache(userId: string) {
  cachedUserId = userId;
  cachedRecord = readReadingTime(userId);
}

const serverRecord: ReadingTimeRecord = { totalSeconds: 0, rewardClaimed: false };

export function useReadingTime() {
  const { loggedIn, user } = useAuth();
  const userId = loggedIn && user ? user.id : "";

  const subscribe = useCallback(
    (callback: () => void) => {
      refreshReadingCache(userId);
      return subscribeReadingTime(() => {
        refreshReadingCache(userId);
        callback();
      });
    },
    [userId],
  );

  const getSnapshot = useCallback(() => {
    if (cachedUserId !== userId) refreshReadingCache(userId);
    return cachedRecord;
  }, [userId]);

  const record = useSyncExternalStore(subscribe, getSnapshot, () => serverRecord);

  const totalSeconds = record.totalSeconds;
  const rewardClaimed = record.rewardClaimed;
  const canClaim = loggedIn && canClaimReadingReward(userId);

  const claim = useCallback(() => {
    if (!userId) return { ok: false as const, error: "Sign in required" };
    return claimReadingReward(userId);
  }, [userId]);

  return {
    totalSeconds,
    rewardClaimed,
    canClaim,
    streakDays: record.activeDays?.length ?? 0,
    progressPercent: readingProgressPercent(totalSeconds),
    hoursRemaining: readingHoursRemaining(totalSeconds),
    formatted: formatReadingDuration(totalSeconds),
    targetFormatted: `${READING_REWARD_HOURS}h`,
    targetSeconds: READING_REWARD_TARGET_SECONDS,
    rewardEtb: READING_REWARD_ETB,
    rewardXp: READING_REWARD_XP,
    claimedAt: record.claimedAt,
    claim,
    loggedIn,
  };
}
