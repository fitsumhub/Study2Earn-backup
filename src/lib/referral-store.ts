import {
  generateReferralCode,
  REFERRAL_FRIEND_BONUS,
  REFERRAL_SIGNUP_XP,
  type ReferralRecord,
} from "@/lib/referral-data";

export type ReferralStore = {
  code: string;
  referrals: ReferralRecord[];
  tierBonusesClaimed: number[];
};

const STORAGE_PREFIX = "study2earn-referrals:";
// Maps a referral code to the account that owns it, so a signup can only
// credit a real, existing account — not an arbitrary typed-in string.
const DIRECTORY_KEY = "study2earn-referral-directory";

function emptyStore(): ReferralStore {
  return { code: "", referrals: [], tierBonusesClaimed: [] };
}

function keyFor(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function readDirectory(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DIRECTORY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function registerCode(code: string, userId: string) {
  if (typeof window === "undefined") return;
  const dir = readDirectory();
  dir[code.toUpperCase()] = userId;
  localStorage.setItem(DIRECTORY_KEY, JSON.stringify(dir));
}

function resolveOwnerIdByCode(code: string): string | null {
  return readDirectory()[code.toUpperCase()] ?? null;
}

/** Each account's own code/history — never a shared pool another account can inflate. */
export function readReferralStore(userId: string): ReferralStore {
  if (!userId || typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (raw) return JSON.parse(raw) as ReferralStore;
  } catch {
    /* fall through and mint a fresh store below */
  }
  const fresh: ReferralStore = {
    code: generateReferralCode(),
    referrals: [],
    tierBonusesClaimed: [],
  };
  localStorage.setItem(keyFor(userId), JSON.stringify(fresh));
  registerCode(fresh.code, userId);
  return fresh;
}

export function writeReferralStore(userId: string, store: ReferralStore) {
  if (!userId || typeof window === "undefined") return;
  localStorage.setItem(keyFor(userId), JSON.stringify(store));
  window.dispatchEvent(new Event("referral-change"));
}

export function subscribeReferrals(cb: () => void) {
  window.addEventListener("referral-change", cb);
  return () => window.removeEventListener("referral-change", cb);
}

/**
 * Credits the referral signup bonus to whichever real account owns this
 * code. Returns the new account's own signup bonus if the code resolved to
 * a real, distinct account, or `null` if the code is unknown/self-referral
 * (in which case no XP is credited anywhere).
 */
export function recordReferralSignup(
  referralCode: string,
  friendName: string,
  friendUniversity: string,
  newAccountId: string,
): number | null {
  const code = referralCode.trim().toUpperCase();
  if (!code) return null;

  const ownerId = resolveOwnerIdByCode(code);
  if (!ownerId || ownerId === newAccountId) return null;

  const store = readReferralStore(ownerId);
  const entry: ReferralRecord = {
    id: `ref-${Date.now()}`,
    name: friendName.trim() || "New student",
    university: friendUniversity.trim() || "Unknown university",
    status: "signed_up",
    xpEarned: REFERRAL_SIGNUP_XP,
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };

  writeReferralStore(ownerId, {
    ...store,
    referrals: [entry, ...store.referrals],
  });

  return REFERRAL_FRIEND_BONUS;
}
