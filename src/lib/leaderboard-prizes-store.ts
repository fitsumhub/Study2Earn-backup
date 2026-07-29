import {
  Award,
  Backpack,
  Banknote,
  Coins,
  Gift,
  GraduationCap,
  Headphones,
  Laptop,
  Smartphone,
  Star,
  Tablet,
  Trophy,
  Watch,
  type LucideIcon,
} from "lucide-react";

/**
 * Admin-editable "grand prizes" shown on the Leaderboard's Yearly tab —
 * lets an admin change what winners actually receive (iPhone, cash bonus,
 * etc.) without a code change. Client-side demo store: localStorage, same
 * pattern as ad-store.ts.
 */

export type LeaderboardPrizeIcon =
  | "smartphone"
  | "tablet"
  | "headphones"
  | "laptop"
  | "watch"
  | "banknote"
  | "coins"
  | "backpack"
  | "gift"
  | "trophy"
  | "award"
  | "star"
  | "graduationCap";

export const PRIZE_ICON_OPTIONS: {
  value: LeaderboardPrizeIcon;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "smartphone", label: "Smartphone", icon: Smartphone },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "headphones", label: "Headphones", icon: Headphones },
  { value: "laptop", label: "Laptop", icon: Laptop },
  { value: "watch", label: "Watch", icon: Watch },
  { value: "banknote", label: "Cash", icon: Banknote },
  { value: "coins", label: "Coins", icon: Coins },
  { value: "backpack", label: "Backpack", icon: Backpack },
  { value: "gift", label: "Gift", icon: Gift },
  { value: "trophy", label: "Trophy", icon: Trophy },
  { value: "award", label: "Award", icon: Award },
  { value: "star", label: "Star", icon: Star },
  { value: "graduationCap", label: "Scholarship", icon: GraduationCap },
];

export const PRIZE_ICON_MAP: Record<LeaderboardPrizeIcon, LucideIcon> = Object.fromEntries(
  PRIZE_ICON_OPTIONS.map((o) => [o.value, o.icon]),
) as Record<LeaderboardPrizeIcon, LucideIcon>;

export type LeaderboardPrizeTint =
  | "blue"
  | "slate"
  | "amber"
  | "emerald"
  | "violet"
  | "rose"
  | "gold";

export const PRIZE_TINT_OPTIONS: {
  value: LeaderboardPrizeTint;
  label: string;
  gradient: string;
}[] = [
  { value: "blue", label: "Blue", gradient: "from-cyan-400 to-blue-500" },
  { value: "slate", label: "Slate", gradient: "from-slate-300 to-slate-400" },
  { value: "amber", label: "Amber", gradient: "from-amber-300 to-amber-500" },
  { value: "emerald", label: "Emerald", gradient: "from-emerald-400 to-emerald-600" },
  { value: "violet", label: "Violet", gradient: "from-violet-400 to-purple-500" },
  { value: "rose", label: "Rose", gradient: "from-rose-400 to-pink-500" },
  { value: "gold", label: "Gold", gradient: "from-brand-gold to-amber-500" },
];

export const PRIZE_TINT_MAP: Record<LeaderboardPrizeTint, string> = Object.fromEntries(
  PRIZE_TINT_OPTIONS.map((o) => [o.value, o.gradient]),
) as Record<LeaderboardPrizeTint, string>;

export type LeaderboardPrize = {
  id: string;
  rankLabel: string;
  title: string;
  icon: LeaderboardPrizeIcon;
  tint: LeaderboardPrizeTint;
};

export type LeaderboardRewardsConfig = {
  tagline: string;
  description: string;
  prizes: LeaderboardPrize[];
};

export const DEFAULT_LEADERBOARD_REWARDS: LeaderboardRewardsConfig = {
  tagline: "Compete all year. Win real rewards.",
  description: "Top 10 scholars of the yearly season take home real prizes when the season closes.",
  prizes: [
    { id: "prize-1", rankLabel: "#1", title: "iPhone 15", icon: "smartphone", tint: "blue" },
    { id: "prize-2", rankLabel: "#2", title: "Galaxy Tab A9", icon: "tablet", tint: "slate" },
    {
      id: "prize-3",
      rankLabel: "#3",
      title: "Wireless Earbuds",
      icon: "headphones",
      tint: "amber",
    },
    {
      id: "prize-4",
      rankLabel: "#4 – #10",
      title: "200–500 ETB Bonus",
      icon: "coins",
      tint: "emerald",
    },
  ],
};

const STORAGE_KEY = "study2earn-leaderboard-prizes";
export const LEADERBOARD_PRIZES_CHANGE_EVENT = "leaderboard-prizes-change";

const ICON_KEYS = PRIZE_ICON_OPTIONS.map((o) => o.value);
const TINT_KEYS = PRIZE_TINT_OPTIONS.map((o) => o.value);

function isPrize(value: unknown): value is LeaderboardPrize {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<LeaderboardPrize>;
  return (
    typeof p.id === "string" &&
    typeof p.rankLabel === "string" &&
    typeof p.title === "string" &&
    ICON_KEYS.includes(p.icon as LeaderboardPrizeIcon) &&
    TINT_KEYS.includes(p.tint as LeaderboardPrizeTint)
  );
}

function normalize(raw: unknown): LeaderboardRewardsConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_LEADERBOARD_REWARDS;
  const value = raw as Partial<LeaderboardRewardsConfig>;
  return {
    tagline:
      typeof value.tagline === "string" && value.tagline.trim()
        ? value.tagline
        : DEFAULT_LEADERBOARD_REWARDS.tagline,
    description:
      typeof value.description === "string" && value.description.trim()
        ? value.description
        : DEFAULT_LEADERBOARD_REWARDS.description,
    prizes: Array.isArray(value.prizes)
      ? value.prizes.filter(isPrize)
      : DEFAULT_LEADERBOARD_REWARDS.prizes,
  };
}

export function readLeaderboardRewards(): LeaderboardRewardsConfig {
  if (typeof window === "undefined") return DEFAULT_LEADERBOARD_REWARDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LEADERBOARD_REWARDS;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_LEADERBOARD_REWARDS;
  }
}

export function writeLeaderboardRewards(config: LeaderboardRewardsConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(LEADERBOARD_PRIZES_CHANGE_EVENT));
}

export function subscribeLeaderboardRewards(cb: () => void) {
  window.addEventListener(LEADERBOARD_PRIZES_CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(LEADERBOARD_PRIZES_CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
