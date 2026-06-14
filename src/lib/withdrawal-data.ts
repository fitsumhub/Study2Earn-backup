export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

export type WithdrawalRequest = {
  id: string;
  userId: string;
  userName: string;
  university: string;
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amountEtb: number;
  xpDeducted: number;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
  adminNote?: string;
};

export const XP_PER_ETB = 8;
export const MIN_WITHDRAWAL_ETB = 50;
export const MAX_WITHDRAWAL_ETB = 5000;

export function xpToEtb(xp: number) {
  return Math.floor(xp / XP_PER_ETB);
}

export function etbToXp(etb: number) {
  return etb * XP_PER_ETB;
}

export const defaultWithdrawals: WithdrawalRequest[] = [
  {
    id: "WD-1001",
    userId: "STU-8839",
    userName: "Hanna Demissie",
    university: "Bahir Dar University",
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
];

export const CURRENT_USER = {
  id: "STU-8842",
  name: "Abebe Balcha",
  university: "Addis Ababa University",
};
