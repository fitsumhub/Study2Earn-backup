import { useCallback, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import { isAdminUser } from "@/lib/auth-data";
import { getBankById } from "@/lib/ethiopian-banks";
import {
  ETB_PER_USDT,
  MIN_WITHDRAWAL_ETB,
  MIN_WITHDRAWAL_USDT,
  defaultWithdrawals,
  etbToXp,
  isValidBinanceUid,
  usdtToXp,
  type WithdrawalRequest,
  type WithdrawalStatus,
} from "@/lib/withdrawal-data";
import { readWithdrawals, subscribeWithdrawals, writeWithdrawals } from "@/lib/withdrawal-store";

function nextId(requests: WithdrawalRequest[]) {
  const nums = requests
    .map((r) => parseInt(r.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `WD-${next}`;
}

let cachedWithdrawals: WithdrawalRequest[] = defaultWithdrawals;

function refreshWithdrawalCache() {
  cachedWithdrawals = readWithdrawals();
}

function subscribe(callback: () => void) {
  refreshWithdrawalCache();
  return subscribeWithdrawals(() => {
    refreshWithdrawalCache();
    callback();
  });
}

function getSnapshot() {
  return cachedWithdrawals;
}

function getServerSnapshot() {
  return defaultWithdrawals;
}

export type SubmitBankWithdrawal = {
  method: "bank";
  bankId: string;
  accountNumber: string;
  accountName: string;
  amountEtb: number;
};

export type SubmitUsdtWithdrawal = {
  method: "usdt";
  binanceUid: string;
  amountUsdt: number;
};

export type SubmitWithdrawalData = SubmitBankWithdrawal | SubmitUsdtWithdrawal;

export function useWithdrawals() {
  const { user } = useAuth();
  const all = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const userId = user?.id ?? "";
  const myRequests = all.filter((r) => r.userId === userId);
  // XP is reserved the moment a request is submitted and stays deducted through
  // "paid" — only a "rejected" request releases it back to the spendable balance.
  const pendingXp = myRequests
    .filter((r) => r.status !== "rejected")
    .reduce((sum, r) => sum + r.xpDeducted, 0);

  const submitWithdrawal = useCallback(
    (data: SubmitWithdrawalData, spendableXp: number) => {
      if (!user) return { ok: false as const, error: "Sign in required" };

      const requestedXp =
        data.method === "bank" ? etbToXp(data.amountEtb) : usdtToXp(data.amountUsdt);
      if (requestedXp > spendableXp) {
        return { ok: false as const, error: "Amount exceeds your available XP balance" };
      }

      const base = {
        id: nextId(all),
        userId: user.id,
        userName: user.name,
        university: user.university,
        status: "pending" as const,
        requestedAt: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      };

      if (data.method === "bank") {
        const bank = getBankById(data.bankId);
        if (!bank) return { ok: false as const, error: "Invalid bank selected" };
        if (data.amountEtb < MIN_WITHDRAWAL_ETB) {
          return { ok: false as const, error: `Minimum withdrawal is ${MIN_WITHDRAWAL_ETB} ETB` };
        }

        const request: WithdrawalRequest = {
          ...base,
          method: "bank",
          bankId: bank.id,
          bankName: bank.name,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          amountEtb: data.amountEtb,
          xpDeducted: etbToXp(data.amountEtb),
        };

        writeWithdrawals([request, ...all]);
        return { ok: true as const, request };
      }

      if (!isValidBinanceUid(data.binanceUid)) {
        return { ok: false as const, error: "Enter a valid Binance UID (6–12 digits)" };
      }
      if (data.amountUsdt < MIN_WITHDRAWAL_USDT) {
        return { ok: false as const, error: `Minimum withdrawal is ${MIN_WITHDRAWAL_USDT} USDT` };
      }

      const request: WithdrawalRequest = {
        ...base,
        method: "usdt",
        binanceUid: data.binanceUid.trim(),
        amountUsdt: data.amountUsdt,
        amountEtb: Math.round(data.amountUsdt * ETB_PER_USDT),
        xpDeducted: usdtToXp(data.amountUsdt),
      };

      writeWithdrawals([request, ...all]);
      return { ok: true as const, request };
    },
    [all, user],
  );

  const updateStatus = useCallback(
    (id: string, status: WithdrawalStatus, adminNote?: string) => {
      if (!isAdminUser(user)) {
        return { ok: false as const, error: "Admin access required" };
      }
      const target = all.find((r) => r.id === id);
      if (!target) return { ok: false as const, error: "Request not found" };
      if (target.userId === user?.id) {
        return { ok: false as const, error: "You can't process your own withdrawal request" };
      }

      writeWithdrawals(
        all.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                adminNote,
                processedAt: new Date().toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }),
              }
            : r,
        ),
      );
      return { ok: true as const };
    },
    [all, user],
  );

  const pendingCount = all.filter((r) => r.status === "pending").length;

  return {
    all,
    myRequests,
    pendingXp,
    pendingCount,
    submitWithdrawal,
    updateStatus,
    approveWithdrawal: (id: string) => updateStatus(id, "approved"),
    rejectWithdrawal: (id: string, note?: string) => updateStatus(id, "rejected", note),
    markPaid: (id: string) => updateStatus(id, "paid"),
  };
}
