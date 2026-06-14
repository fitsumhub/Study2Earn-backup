import { defaultWithdrawals, type WithdrawalRequest } from "@/lib/withdrawal-data";

const STORAGE_KEY = "study2earn-withdrawals";

export function readWithdrawals(): WithdrawalRequest[] {
  if (typeof window === "undefined") return defaultWithdrawals;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WithdrawalRequest[]) : defaultWithdrawals;
  } catch {
    return defaultWithdrawals;
  }
}

export function writeWithdrawals(requests: WithdrawalRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event("withdrawal-change"));
}

export function subscribeWithdrawals(cb: () => void) {
  window.addEventListener("withdrawal-change", cb);
  return () => window.removeEventListener("withdrawal-change", cb);
}
