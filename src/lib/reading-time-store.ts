import {
  READING_REWARD_ETB,
  READING_REWARD_TARGET_SECONDS,
  READING_REWARD_XP,
} from "@/lib/reading-time-data";
import { readAuth, signIn } from "@/lib/auth-store";

export type ReadingTimeRecord = {
  totalSeconds: number;
  rewardClaimed: boolean;
  claimedAt?: string;
};

type ReadingTimeStore = Record<string, ReadingTimeRecord>;

const STORAGE_KEY = "study2earn-reading-time";

function emptyRecord(): ReadingTimeRecord {
  return { totalSeconds: 0, rewardClaimed: false };
}

function readStore(): ReadingTimeStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReadingTimeStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: ReadingTimeStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("reading-time-change"));
}

export function subscribeReadingTime(cb: () => void) {
  window.addEventListener("reading-time-change", cb);
  return () => window.removeEventListener("reading-time-change", cb);
}

export function readReadingTime(userId: string): ReadingTimeRecord {
  if (!userId) return emptyRecord();
  return readStore()[userId] ?? emptyRecord();
}

export function addReadingSeconds(userId: string, seconds: number) {
  if (!userId || seconds <= 0) return;
  const store = readStore();
  const current = store[userId] ?? emptyRecord();
  store[userId] = {
    ...current,
    totalSeconds: current.totalSeconds + seconds,
  };
  writeStore(store);
}

/**
 * Claw back already-counted reading time — used by the anti-abuse engine when a
 * student is caught idling with a book open. Never drops below zero.
 */
export function penalizeReadingSeconds(userId: string, seconds: number) {
  if (!userId || seconds <= 0) return;
  const store = readStore();
  const current = store[userId] ?? emptyRecord();
  store[userId] = {
    ...current,
    totalSeconds: Math.max(0, current.totalSeconds - seconds),
  };
  writeStore(store);
}

export function canClaimReadingReward(userId: string): boolean {
  const record = readReadingTime(userId);
  return !record.rewardClaimed && record.totalSeconds >= READING_REWARD_TARGET_SECONDS;
}

export function claimReadingReward(userId: string) {
  const record = readReadingTime(userId);
  if (record.rewardClaimed) {
    return { ok: false as const, error: "Reading reward already claimed" };
  }
  if (record.totalSeconds < READING_REWARD_TARGET_SECONDS) {
    const hoursLeft = ((READING_REWARD_TARGET_SECONDS - record.totalSeconds) / 3600).toFixed(1);
    return { ok: false as const, error: `${hoursLeft}h of reading still needed` };
  }

  const session = readAuth();
  if (!session.loggedIn || !session.user || session.user.id !== userId) {
    return { ok: false as const, error: "Sign in to claim your reward" };
  }

  const store = readStore();
  store[userId] = {
    ...record,
    rewardClaimed: true,
    claimedAt: new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  };
  writeStore(store);

  signIn({ ...session.user, xp: session.user.xp + READING_REWARD_XP });

  return {
    ok: true as const,
    etb: READING_REWARD_ETB,
    xp: READING_REWARD_XP,
  };
}
