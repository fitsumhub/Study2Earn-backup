import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_LEADERBOARD_REWARDS,
  readLeaderboardRewards,
  subscribeLeaderboardRewards,
  writeLeaderboardRewards,
  type LeaderboardPrize,
  type LeaderboardRewardsConfig,
} from "@/lib/leaderboard-prizes-store";

function nextPrizeId() {
  return `prize-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Live-synced access to the Leaderboard's Yearly grand-prize config. Used
 * read-only by the public Leaderboard page and with full CRUD by the admin
 * Rewards section.
 */
export function useLeaderboardPrizes() {
  const [config, setConfig] = useState<LeaderboardRewardsConfig>(DEFAULT_LEADERBOARD_REWARDS);

  useEffect(() => {
    setConfig(readLeaderboardRewards());
    return subscribeLeaderboardRewards(() => setConfig(readLeaderboardRewards()));
  }, []);

  const persist = useCallback((next: LeaderboardRewardsConfig) => {
    setConfig(next);
    writeLeaderboardRewards(next);
  }, []);

  const updateMeta = useCallback(
    (patch: Partial<Pick<LeaderboardRewardsConfig, "tagline" | "description">>) => {
      persist({ ...readLeaderboardRewards(), ...patch });
    },
    [persist],
  );

  const addPrize = useCallback(() => {
    const current = readLeaderboardRewards();
    const prize: LeaderboardPrize = {
      id: nextPrizeId(),
      rankLabel: `#${current.prizes.length + 1}`,
      title: "New prize",
      icon: "gift",
      tint: "slate",
    };
    persist({ ...current, prizes: [...current.prizes, prize] });
  }, [persist]);

  const updatePrize = useCallback(
    (id: string, patch: Partial<Omit<LeaderboardPrize, "id">>) => {
      const current = readLeaderboardRewards();
      persist({
        ...current,
        prizes: current.prizes.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      });
    },
    [persist],
  );

  const removePrize = useCallback(
    (id: string) => {
      const current = readLeaderboardRewards();
      persist({ ...current, prizes: current.prizes.filter((p) => p.id !== id) });
    },
    [persist],
  );

  const movePrize = useCallback(
    (id: string, direction: "up" | "down") => {
      const current = readLeaderboardRewards();
      const index = current.prizes.findIndex((p) => p.id === id);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= current.prizes.length) return;
      const prizes = [...current.prizes];
      [prizes[index], prizes[target]] = [prizes[target], prizes[index]];
      persist({ ...current, prizes });
    },
    [persist],
  );

  const resetToDefaults = useCallback(() => {
    persist(DEFAULT_LEADERBOARD_REWARDS);
  }, [persist]);

  return { config, updateMeta, addPrize, updatePrize, removePrize, movePrize, resetToDefaults };
}
