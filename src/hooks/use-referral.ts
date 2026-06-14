import { useCallback, useSyncExternalStore } from "react";

import {
  defaultReferrals,
  generateReferralCode,
  getReferralLink,
  referralTiers,
  type ReferralRecord,
} from "@/lib/referral-data";

type ReferralStore = {
  code: string;
  referrals: ReferralRecord[];
  tierBonusesClaimed: number[];
};

const STORAGE_KEY = "study2earn-referrals";

function readStore(): ReferralStore {
  if (typeof window === "undefined") {
    return { code: "ABEBE-DEMO", referrals: defaultReferrals, tierBonusesClaimed: [1, 3] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ReferralStore;
  } catch {
    /* use defaults */
  }
  return {
    code: generateReferralCode(),
    referrals: defaultReferrals,
    tierBonusesClaimed: [1, 3],
  };
}

function writeStore(store: ReferralStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("referral-change"));
}

let cached = readStore();

function subscribe(cb: () => void) {
  window.addEventListener("referral-change", cb);
  return () => window.removeEventListener("referral-change", cb);
}

function getSnapshot() {
  cached = readStore();
  return cached;
}

export function useReferral() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const completed = store.referrals.filter((r) => r.status === "completed").length;
  const signedUp = store.referrals.filter(
    (r) => r.status === "signed_up" || r.status === "completed",
  ).length;
  const pending = store.referrals.filter((r) => r.status === "pending").length;
  const referralXp = store.referrals.reduce((sum, r) => sum + r.xpEarned, 0);

  const tierBonuses = referralTiers
    .filter((t) => completed >= t.count && store.tierBonusesClaimed.includes(t.count))
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
    referrals: store.referrals,
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
