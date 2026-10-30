export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

export type WithdrawalMethod = "bank" | "usdt";

export type WithdrawalRequest = {
  id: string;
  userId: string;
  userName: string;
  university: string;
  method: WithdrawalMethod;
  // Bank transfer fields — present when method === "bank"
  bankId?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  // USDT via Binance fields — present when method === "usdt"
  binanceUid?: string;
  amountUsdt?: number;
  // ETB-equivalent value of the request, used for admin totals regardless of method
  amountEtb: number;
  xpDeducted: number;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
  adminNote?: string;
  transactionReference?: string;
  payoutProof?: string;
};

export const XP_PER_ETB = 8;
export const MIN_WITHDRAWAL_ETB = 50;
export const MAX_WITHDRAWAL_ETB = 5000;

/** Approximate ETB value of 1 USDT — used only to convert to XP and for admin reporting. */
export const ETB_PER_USDT = 135;
export const XP_PER_USDT = XP_PER_ETB * ETB_PER_USDT;
export const MIN_WITHDRAWAL_USDT = 3;
export const MAX_WITHDRAWAL_USDT = 40;

export function xpToEtb(xp: number) {
  return Math.floor(xp / XP_PER_ETB);
}

export function etbToXp(etb: number) {
  return etb * XP_PER_ETB;
}

export function xpToUsdt(xp: number) {
  return Math.floor((xp / XP_PER_USDT) * 100) / 100;
}

export function usdtToXp(usdt: number) {
  return Math.round(usdt * XP_PER_USDT);
}

/** Binance UIDs are numeric account identifiers, typically 8–10 digits. */
export function isValidBinanceUid(uid: string) {
  return /^\d{6,12}$/.test(uid.trim());
}

export const defaultWithdrawals: WithdrawalRequest[] = [
  {
    id: "WD-1001",
    userId: "STU-8839",
    userName: "Hanna Demissie",
    university: "Bahir Dar University",
    method: "bank",
    bankId: "cbe",
    bankName: "Commercial Bank of Ethiopia",
    accountNumber: "1000****4521",
    accountName: "Hanna Demissie",
    amountEtb: 150,
    xpDeducted: 1200,
    status: "pending",
    requestedAt: "Jun 14, 2026 · 9:42 AM",
  },
  {
    id: "WD-1002",
    userId: "STU-8838",
    userName: "Dawit Haile",
    university: "Mekelle University",
    method: "bank",
    bankId: "awash",
    bankName: "Awash Bank",
    accountNumber: "0132****8890",
    accountName: "Dawit Haile",
    amountEtb: 200,
    xpDeducted: 1600,
    status: "pending",
    requestedAt: "Jun 13, 2026 · 4:15 PM",
  },
  {
    id: "WD-1003",
    userId: "STU-8837",
    userName: "Meron Tesfaye",
    university: "Hawassa University",
    method: "bank",
    bankId: "dashen",
    bankName: "Dashen Bank",
    accountNumber: "0018****3344",
    accountName: "Meron Tesfaye",
    amountEtb: 100,
    xpDeducted: 800,
    status: "approved",
    requestedAt: "Jun 12, 2026 · 11:20 AM",
    processedAt: "Jun 13, 2026 · 10:00 AM",
  },
  {
    id: "WD-1004",
    userId: "STU-8841",
    userName: "Samuel Girma",
    university: "Addis Ababa University",
    method: "usdt",
    binanceUid: "349021558",
    amountUsdt: 8,
    amountEtb: 1080,
    xpDeducted: 8640,
    status: "pending",
    requestedAt: "Jun 15, 2026 · 8:05 AM",
  },
];

export const CURRENT_USER = {
  id: "STU-8842",
  name: "Abebe Balcha",
  university: "Addis Ababa University",
};
