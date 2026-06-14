export type ReferralStatus = "pending" | "signed_up" | "completed";

export type ReferralRecord = {
  id: string;
  name: string;
  university: string;
  status: ReferralStatus;
  xpEarned: number;
  date: string;
};

export type ReferralTier = {
  count: number;
  reward: string;
  xpBonus: number;
};

export const REFERRAL_SIGNUP_XP = 50;
export const REFERRAL_COMPLETE_XP = 100;
export const REFERRAL_FRIEND_BONUS = 50;

export const referralTiers: ReferralTier[] = [
  { count: 1, reward: "Ambassador badge", xpBonus: 0 },
  { count: 3, reward: "Referral starter bonus", xpBonus: 150 },
  { count: 5, reward: "Campus champion bonus", xpBonus: 300 },
  { count: 10, reward: "Elite referrer reward", xpBonus: 750 },
];

export const defaultReferrals: ReferralRecord[] = [
  {
    id: "ref-1",
    name: "Tigist Alemu",
    university: "Adama Science & Tech",
    status: "completed",
    xpEarned: REFERRAL_COMPLETE_XP,
    date: "Jun 10, 2026",
  },
  {
    id: "ref-2",
    name: "Biruk Ayalew",
    university: "Gondar University",
    status: "signed_up",
    xpEarned: REFERRAL_SIGNUP_XP,
    date: "Jun 12, 2026",
  },
  {
    id: "ref-3",
    name: "Liya Mengistu",
    university: "Wollo University",
    status: "pending",
    xpEarned: 0,
    date: "Jun 13, 2026",
  },
];

export function generateReferralCode(seed = "ABEBE") {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${seed}-${suffix}`;
}

export function getReferralLink(code: string) {
  if (typeof window === "undefined") return `/register?ref=${code}`;
  return `${window.location.origin}/register?ref=${code}`;
}
