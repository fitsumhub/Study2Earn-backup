import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_REFERRAL_TIERS,
  readReferralTiers,
  subscribeReferralTiers,
  writeReferralTiers,
  type ReferralTierConfig,
} from "@/lib/referral-tiers-store";

function nextTierId() {
  return `tier-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Live-synced access to the referral milestone tiers. Used read-only by the
 * student-facing referral panel and the XP-bonus math in use-referral.ts,
 * and with full CRUD by the admin Referrals section.
 */
export function useReferralTiers() {
  const [tiers, setTiers] = useState<ReferralTierConfig[]>(DEFAULT_REFERRAL_TIERS);

  useEffect(() => {
    setTiers(readReferralTiers());
    return subscribeReferralTiers(() => setTiers(readReferralTiers()));
  }, []);

  const persist = useCallback((next: ReferralTierConfig[]) => {
    setTiers(next);
    writeReferralTiers(next);
  }, []);

  const addTier = useCallback(() => {
    const current = readReferralTiers();
    const highest = current.reduce((max, t) => Math.max(max, t.count), 0);
    const tier: ReferralTierConfig = {
      id: nextTierId(),
      count: highest + 1,
      reward: "New milestone",
      xpBonus: 0,
    };
    persist([...current, tier]);
  }, [persist]);

  const updateTier = useCallback(
    (id: string, patch: Partial<Omit<ReferralTierConfig, "id">>) => {
      const current = readReferralTiers();
      persist(current.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [persist],
  );

  const removeTier = useCallback(
    (id: string) => {
      const current = readReferralTiers();
      persist(current.filter((t) => t.id !== id));
    },
    [persist],
  );

  const resetToDefaults = useCallback(() => {
    persist(DEFAULT_REFERRAL_TIERS);
  }, [persist]);

  return { tiers, addTier, updateTier, removeTier, resetToDefaults };
}
