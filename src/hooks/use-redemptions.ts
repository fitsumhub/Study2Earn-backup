import { useCallback, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  addRedemption,
  readRedemptions,
  subscribeRedemptions,
  type RedemptionRecord,
} from "@/lib/redemption-store";

let cachedRecords: RedemptionRecord[] = [];
const EMPTY_RECORDS: RedemptionRecord[] = [];

function refreshRedemptionCache() {
  cachedRecords = readRedemptions();
}

function subscribe(callback: () => void) {
  refreshRedemptionCache();
  return subscribeRedemptions(() => {
    refreshRedemptionCache();
    callback();
  });
}

function getSnapshot() {
  return cachedRecords;
}

function getServerSnapshot() {
  return EMPTY_RECORDS;
}

export function useRedemptions() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const all = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // The store holds every account's redemptions on this device — scope to the
  // signed-in user so one account's spend never eats into another's balance
  // or shows up in their history.
  const records = userId ? all.filter((r) => r.userId === userId) : EMPTY_RECORDS;

  const totalRedeemedXp = records.reduce((sum, r) => sum + r.xp, 0);

  const redeem = useCallback(
    (item: { title: string; xp: number; tag: string }, currentBalance: number) => {
      if (!userId) return { ok: false as const, error: "Sign in required" };
      if (!Number.isFinite(item.xp) || item.xp <= 0) {
        return { ok: false as const, error: "Invalid reward cost" };
      }
      if (currentBalance < item.xp) {
        return { ok: false as const, error: "Insufficient XP" };
      }
      // Ad-Free is designed to stack (redeeming again extends the perk);
      // every other one-time reward (e.g. cosmetics) can only be claimed once.
      if (item.tag.toLowerCase() !== "adfree" && records.some((r) => r.title === item.title)) {
        return { ok: false as const, error: "Already redeemed" };
      }
      const record = addRedemption({ ...item, userId });
      return { ok: true as const, record };
    },
    [userId, records],
  );

  return {
    records,
    redemptionCount: records.length,
    totalRedeemedXp,
    redeem,
  };
}
