export type GlowTheme = "bronze" | "silver" | "gold" | "emerald" | "violet";

export const GLOW_STYLES: Record<
  GlowTheme,
  { label: string; ring: string; shadow: string; dot: string }
> = {
  bronze: {
    label: "Bronze Glow",
    ring: "ring-amber-700/50",
    shadow: "shadow-[0_0_16px_rgba(180,83,9,0.45)]",
    dot: "bg-amber-700",
  },
  silver: {
    label: "Silver Glow",
    ring: "ring-slate-400/60",
    shadow: "shadow-[0_0_16px_rgba(148,163,184,0.5)]",
    dot: "bg-slate-400",
  },
  gold: {
    label: "Gold Glow",
    ring: "ring-brand-gold/60",
    shadow: "shadow-[0_0_18px_rgba(212,160,23,0.55)]",
    dot: "bg-brand-gold",
  },
  emerald: {
    label: "Emerald Glow",
    ring: "ring-emerald-400/60",
    shadow: "shadow-[0_0_18px_rgba(52,211,153,0.5)]",
    dot: "bg-emerald-400",
  },
  violet: {
    label: "Violet Glow",
    ring: "ring-violet-400/60",
    shadow: "shadow-[0_0_18px_rgba(167,139,250,0.5)]",
    dot: "bg-violet-400",
  },
};

/** Default look for anyone who hasn't unlocked a glow — unchanged from before this feature existed. */
export const DEFAULT_AVATAR_RING = "ring-brand-gold/30";

/** Best-effort mapping from a catalog reward's title to a glow — falls back to gold. */
export function glowFromRewardTitle(title: string): GlowTheme {
  const t = title.toLowerCase();
  if (t.includes("bronze")) return "bronze";
  if (t.includes("silver")) return "silver";
  if (t.includes("emerald")) return "emerald";
  if (t.includes("violet") || t.includes("purple")) return "violet";
  return "gold";
}

export type CosmeticsRecord = {
  owned: GlowTheme[];
  active: GlowTheme | null;
};

type CosmeticsStore = Record<string, CosmeticsRecord>;

const STORAGE_KEY = "study2earn-cosmetics";

function emptyRecord(): CosmeticsRecord {
  return { owned: [], active: null };
}

function readStore(): CosmeticsStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CosmeticsStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: CosmeticsStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("cosmetics-change"));
}

export function subscribeCosmetics(cb: () => void) {
  window.addEventListener("cosmetics-change", cb);
  return () => window.removeEventListener("cosmetics-change", cb);
}

export function readCosmetics(userId: string): CosmeticsRecord {
  if (!userId) return emptyRecord();
  return readStore()[userId] ?? emptyRecord();
}

/** Unlocks a glow (idempotent if already owned) and equips it immediately. */
export function unlockGlow(userId: string, theme: GlowTheme) {
  if (!userId) return;
  const store = readStore();
  const current = store[userId] ?? emptyRecord();
  store[userId] = {
    owned: current.owned.includes(theme) ? current.owned : [...current.owned, theme],
    active: theme,
  };
  writeStore(store);
}

/** Switches which owned glow is equipped, or unequips with `null`. */
export function setActiveGlow(userId: string, theme: GlowTheme | null) {
  if (!userId) return;
  const store = readStore();
  const current = store[userId] ?? emptyRecord();
  if (theme && !current.owned.includes(theme)) return;
  store[userId] = { ...current, active: theme };
  writeStore(store);
}
