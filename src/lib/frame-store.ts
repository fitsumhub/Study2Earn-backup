// ─── Types ────────────────────────────────────────────────────────────────────

export type FrameRecord = {
  /** IDs of frames the user has unlocked */
  owned: string[];
  /** ID of the currently equipped frame, or null */
  equipped: string | null;
};

type FrameStore = Record<string, FrameRecord>;

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "study2earn-frames";

function emptyRecord(): FrameRecord {
  return { owned: [], equipped: null };
}

function readStore(): FrameStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FrameStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: FrameStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("frames-change"));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function subscribeFrames(cb: () => void) {
  window.addEventListener("frames-change", cb);
  return () => window.removeEventListener("frames-change", cb);
}

export function readFrames(userId: string): FrameRecord {
  if (!userId) return emptyRecord();
  const record = readStore()[userId];
  if (!record) return emptyRecord();
  return {
    owned: Array.isArray(record.owned) ? record.owned : [],
    equipped: record.equipped || null,
  };
}

/** Unlocks a frame (idempotent) and equips it immediately. */
export function unlockFrame(userId: string, frameId: string) {
  if (!userId) return;
  const store = readStore();
  const current = readFrames(userId);
  store[userId] = {
    owned: current.owned.includes(frameId) ? current.owned : [...current.owned, frameId],
    equipped: frameId,
  };
  writeStore(store);
}

/** Sets the currently equipped frame. Pass null to unequip. */
export function equipFrame(userId: string, frameId: string | null) {
  if (!userId) return;
  const store = readStore();
  const current = readFrames(userId);
  if (frameId && !current.owned.includes(frameId)) return; // can't equip what you don't own
  store[userId] = { ...current, equipped: frameId };
  writeStore(store);
}
