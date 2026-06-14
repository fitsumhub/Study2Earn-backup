import { useCallback, useSyncExternalStore } from "react";

import { getBankById } from "@/lib/ethiopian-banks";
import {
  CURRENT_USER,
  MIN_WITHDRAWAL_ETB,
  etbToXp,
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

function getSnapshot() {
  return readWithdrawals();
}

export function useWithdrawals() {
  const all = useSyncExternalStore(subscribeWithdrawals, getSnapshot, getSnapshot);

  const myRequests = all.filter((r) => r.userId === CURRENT_USER.id);
  const pendingXp = myRequests
    .filter((r) => r.status === "pending" || r.status === "approved")
    .reduce((sum, r) => sum + r.xpDeducted, 0);

  const submitWithdrawal = useCallback(
    (data: { bankId: string; accountNumber: string; accountName: string; amountEtb: number }) => {
      const bank = getBankById(data.bankId);
      if (!bank) return { ok: false as const, error: "Invalid bank selected" };
      if (data.amountEtb < MIN_WITHDRAWAL_ETB) {
        return { ok: false as const, error: `Minimum withdrawal is ${MIN_WITHDRAWAL_ETB} ETB` };
      }

      const request: WithdrawalRequest = {
        id: nextId(all),
        userId: CURRENT_USER.id,
        userName: CURRENT_USER.name,
        university: CURRENT_USER.university,
        bankId: bank.id,
        bankName: bank.name,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        amountEtb: data.amountEtb,
        xpDeducted: etbToXp(data.amountEtb),
        status: "pending",
        requestedAt: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      };

      writeWithdrawals([request, ...all]);
      return { ok: true as const, request };
    },
    [all],
  );

  const updateStatus = useCallback(
    (id: string, status: WithdrawalStatus, adminNote?: string) => {
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
    },
    [all],
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
