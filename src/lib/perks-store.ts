export type PerksRecord = {
  /** Epoch ms the ad-free perk runs out, or null if never redeemed. */
  adFreeUntil: number | null;
};

type PerksStore = Record<string, PerksRecord>;

const STORAGE_KEY = "study2earn-perks";
const DAY_MS = 24 * 60 * 60 * 1000;

function emptyRecord(): PerksRecord {
  return { adFreeUntil: null };
}

function readStore(): PerksStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PerksStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: PerksStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("perks-change"));
}

export function subscribePerks(cb: () => void) {
  window.addEventListener("perks-change", cb);
  return () => window.removeEventListener("perks-change", cb);
}

export function readPerks(userId: string): PerksRecord {
  if (!userId) return emptyRecord();
  return readStore()[userId] ?? emptyRecord();
}

export function isAdFreeActive(record: PerksRecord): boolean {
  return !!record.adFreeUntil && record.adFreeUntil > Date.now();
}

/** Stacks on top of any remaining time rather than resetting it. */
export function extendAdFree(userId: string, days: number) {
  if (!userId) return;
  const store = readStore();
  const current = store[userId] ?? emptyRecord();
  const base = Math.max(current.adFreeUntil ?? 0, Date.now());
  store[userId] = { adFreeUntil: base + days * DAY_MS };
  writeStore(store);
}
