import { useCallback, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useReferralTiers } from "@/hooks/use-referral-tiers";
import { getReferralLink, type ReferralRecord } from "@/lib/referral-data";
import { readReferralStore, subscribeReferrals, type ReferralStore } from "@/lib/referral-store";

const EMPTY_STORE: ReferralStore = { code: "", referrals: [], tierBonusesClaimed: [] };

let cachedUserId = "";
let cachedStore: ReferralStore = EMPTY_STORE;

function refreshReferralCache(userId: string) {
  cachedUserId = userId;
  cachedStore = userId ? readReferralStore(userId) : EMPTY_STORE;
}

export function useReferral() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { tiers: referralTiers } = useReferralTiers();

  const subscribe = useCallback(
    (callback: () => void) => {
      refreshReferralCache(userId);
      return subscribeReferrals(() => {
        refreshReferralCache(userId);
        callback();
      });
    },
    [userId],
  );

  const getSnapshot = useCallback(() => {
    if (cachedUserId !== userId) refreshReferralCache(userId);
    return cachedStore;
  }, [userId]);

  const store = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_STORE);

  const completed = store.referrals.filter((r) => r.status === "completed").length;
  const signedUp = store.referrals.filter(
    (r) => r.status === "signed_up" || r.status === "completed",
  ).length;
  const pending = store.referrals.filter((r) => r.status === "pending").length;
  const referralXp = store.referrals.reduce((sum, r) => sum + r.xpEarned, 0);

  // Milestones unlock automatically once the completed-referral count reaches
  // them — matches the "unlocked" state shown in the milestones list.
  const tierBonuses = referralTiers
    .filter((t) => completed >= t.count)
    .reduce((sum, t) => sum + t.xpBonus, 0);

  const totalReferralXp = referralXp + tierBonuses;
  const nextTier = referralTiers.find((t) => completed < t.count) ?? null;
  const currentTier =
    [...referralTiers].reverse().find((t) => completed >= t.count) ?? referralTiers[0];

  const referralLink = getReferralLink(store.code);

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
  }, []);

  const getStats = useCallback(
    () => ({
      total: store.referrals.length,
      completed,
      signedUp,
      pending,
      referralXp,
      tierBonuses,
      totalReferralXp,
      code: store.code,
      link: referralLink,
      nextTier,
      currentTier,
      progressToNext: nextTier ? Math.round((completed / nextTier.count) * 100) : 100,
    }),
    [
      store.referrals.length,
      store.code,
      referralLink,
      completed,
      signedUp,
      pending,
      referralXp,
      tierBonuses,
      totalReferralXp,
      nextTier,
      currentTier,
    ],
  );

  return {
    referrals: store.referrals as ReferralRecord[],
    code: store.code,
    referralLink,
    completed,
    signedUp,
    pending,
    totalReferralXp,
    nextTier,
    currentTier,
    progressToNext: nextTier ? Math.round((completed / nextTier.count) * 100) : 100,
    copyToClipboard,
    getStats,
  };
}
