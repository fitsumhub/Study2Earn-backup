import {
  defaultReferrals,
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

const STORAGE_KEY = "study2earn-referrals";

const serverDefault: ReferralStore = {
  code: "ABEBE-DEMO",
  referrals: defaultReferrals,
  tierBonusesClaimed: [1, 3],
};

export function readReferralStore(): ReferralStore {
  if (typeof window === "undefined") return serverDefault;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ReferralStore;
  } catch {
    /* use defaults */
  }
  return {
    code: generateReferralCode(),
    referrals: defaultReferrals,
    tierBonusesClaimed: [1, 3],
  };
}

export function writeReferralStore(store: ReferralStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("referral-change"));
}

export function subscribeReferrals(cb: () => void) {
  window.addEventListener("referral-change", cb);
  return () => window.removeEventListener("referral-change", cb);
}

export function recordReferralSignup(
  referralCode: string,
  friendName: string,
  friendUniversity: string,
) {
  const code = referralCode.trim().toUpperCase();
  if (!code) return;

  const store = readReferralStore();
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

  writeReferralStore({
    ...store,
    referrals: [entry, ...store.referrals],
  });

  return REFERRAL_FRIEND_BONUS;
}
