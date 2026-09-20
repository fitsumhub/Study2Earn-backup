import { useEffect, useState } from "react";

import { readAdminData, subscribeAdminData } from "@/lib/admin-store";
import type { AdminReward } from "@/lib/admin-types";
import { rewards as fallbackRewards } from "@/lib/mock-data";

export type CatalogReward = {
  id: string;
  title: string;
  xp: number;
  tag: string;
  imageUrl?: string;
  description?: string;
};

function toCatalog(rewards: AdminReward[]): CatalogReward[] {
  return rewards
    .filter((r) => r.active)
    .map((r) => ({
      id: r.id,
      title: r.title,
      xp: r.xp,
      tag: r.tag,
      imageUrl: r.imageUrl,
      description: r.description,
    }));
}

function getFallbackCatalog(): CatalogReward[] {
  return fallbackRewards.map((r, i) => ({
    id: `mock-${i}`,
    title: r.title,
    xp: r.xp,
    tag: r.tag,
    description: (r as { description?: string }).description,
  }));
}

export function useRewardsCatalog() {
  const [catalog, setCatalog] = useState<CatalogReward[]>(getFallbackCatalog());

  useEffect(() => {
    const sync = () => {
      const active = toCatalog(readAdminData().rewards);
      setCatalog(active.length > 0 ? active : getFallbackCatalog());
    };
    sync();
    return subscribeAdminData(sync);
  }, []);

  return catalog;
}
