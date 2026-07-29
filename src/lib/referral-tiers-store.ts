/**
 * Admin-editable referral milestone tiers — how many completed invites a
 * student needs to unlock a badge/reward and bonus XP. Drives real bonus-XP
 * math in use-referral.ts, not just display. Client-side demo store:
 * localStorage, same pattern as leaderboard-prizes-store.ts.
 */

export type ReferralTierConfig = {
  id: string;
  count: number;
  reward: string;
  xpBonus: number;
};

export const DEFAULT_REFERRAL_TIERS: ReferralTierConfig[] = [
  { id: "tier-1", count: 1, reward: "Ambassador badge", xpBonus: 0 },
  { id: "tier-2", count: 3, reward: "Referral starter bonus", xpBonus: 150 },
  { id: "tier-3", count: 5, reward: "Campus champion bonus", xpBonus: 300 },
  { id: "tier-4", count: 10, reward: "Elite referrer reward", xpBonus: 750 },
];

const STORAGE_KEY = "study2earn-referral-tiers";
export const REFERRAL_TIERS_CHANGE_EVENT = "referral-tiers-change";

function isTier(value: unknown): value is ReferralTierConfig {
  if (!value || typeof value !== "object") return false;
  const t = value as Partial<ReferralTierConfig>;
  return (
    typeof t.id === "string" &&
    typeof t.count === "number" &&
    typeof t.reward === "string" &&
    typeof t.xpBonus === "number"
  );
}

function normalize(raw: unknown): ReferralTierConfig[] {
  if (!Array.isArray(raw)) return DEFAULT_REFERRAL_TIERS;
  const tiers = raw.filter(isTier);
  return tiers.length > 0 ? tiers : DEFAULT_REFERRAL_TIERS;
}

/** Ascending by count — the bonus-unlock math assumes this order. */
function sorted(tiers: ReferralTierConfig[]): ReferralTierConfig[] {
  return [...tiers].sort((a, b) => a.count - b.count);
}

export function readReferralTiers(): ReferralTierConfig[] {
  if (typeof window === "undefined") return DEFAULT_REFERRAL_TIERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REFERRAL_TIERS;
    return sorted(normalize(JSON.parse(raw)));
  } catch {
    return DEFAULT_REFERRAL_TIERS;
  }
}

export function writeReferralTiers(tiers: ReferralTierConfig[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted(tiers)));
  window.dispatchEvent(new Event(REFERRAL_TIERS_CHANGE_EVENT));
}

export function subscribeReferralTiers(cb: () => void) {
  window.addEventListener(REFERRAL_TIERS_CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(REFERRAL_TIERS_CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
