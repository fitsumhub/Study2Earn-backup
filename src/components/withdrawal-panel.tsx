import { Building2, Clock, History, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BankLogo } from "@/components/bank-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWithdrawals } from "@/hooks/use-withdrawals";
import { ethiopianBanks } from "@/lib/ethiopian-banks";
import {
  MIN_WITHDRAWAL_ETB,
  XP_PER_ETB,
  xpToEtb,
  type WithdrawalRequest,
} from "@/lib/withdrawal-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<WithdrawalRequest["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-blue-50 text-blue-700",
  rejected: "bg-red-50 text-red-700",
  paid: "bg-emerald-50 text-emerald-700",
};

const statusLabels: Record<WithdrawalRequest["status"], string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid to bank",
};

export function WithdrawalPanel({ availableXp }: { availableXp: number }) {
  const { myRequests, pendingXp, submitWithdrawal } = useWithdrawals();
  const [selectedBank, setSelectedBank] = useState(ethiopianBanks[0].id);
  const [accountName, setAccountName] = useState("Abebe Balcha");
  const [accountNumber, setAccountNumber] = useState("");
  const [amountEtb, setAmountEtb] = useState(MIN_WITHDRAWAL_ETB);

  const spendableXp = availableXp - pendingXp;
  const maxEtb = xpToEtb(spendableXp);
  const xpCost = amountEtb * XP_PER_ETB;
  const canSubmit =
    amountEtb >= MIN_WITHDRAWAL_ETB &&
    amountEtb <= maxEtb &&
    accountNumber.trim().length >= 8 &&
    accountName.trim().length >= 2;

  const bank = useMemo(
    () => ethiopianBanks.find((b) => b.id === selectedBank) ?? ethiopianBanks[0],
    [selectedBank],
  );

  const handleSubmit = () => {
    const result = submitWithdrawal({
      bankId: selectedBank,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      amountEtb,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Withdrawal request submitted!", {
      description: `${amountEtb} ETB to ${bank.name} — pending admin approval`,
    });
    setAccountNumber("");
    setAmountEtb(MIN_WITHDRAWAL_ETB);
  };

  return (
    <section className="mb-12">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">Cash out</p>
        <h2 className="font-serif text-2xl font-bold text-brand-navy">Bank withdrawal</h2>
        <p className="mt-1 text-sm text-slate-600">
          Convert XP to Ethiopian Birr and withdraw to your bank account. Rate:{" "}
          <strong>{XP_PER_ETB} XP = 1 ETB</strong> · Min {MIN_WITHDRAWAL_ETB} ETB
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Bank selection */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="size-5 text-brand-navy" />
            <h3 className="font-semibold text-brand-navy">Select Ethiopian bank</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {ethiopianBanks.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBank(b.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 transition hover:shadow-md",
                  selectedBank === b.id
                    ? "border-brand-navy bg-brand-navy/5 ring-2 ring-brand-navy/20"
                    : "border-slate-100 hover:border-slate-200",
                )}
              >
                <BankLogo bank={b} size="sm" />
                <span className="text-center text-[10px] font-semibold leading-tight text-brand-navy">
                  {b.short}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <BankLogo bank={bank} size="md" />
            <div>
              <p className="font-semibold text-brand-navy">{bank.name}</p>
              <p className="text-xs text-slate-500">Selected withdrawal destination</p>
            </div>
          </div>
        </div>

        {/* Withdrawal form */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="size-5 text-brand-navy" />
            <h3 className="font-semibold text-brand-navy">Withdrawal details</h3>
          </div>

          <div className="mb-4 rounded-lg bg-brand-navy/5 px-4 py-3 text-sm">
            <p className="text-slate-600">
              Available:{" "}
              <strong className="text-brand-navy">{spendableXp.toLocaleString()} XP</strong>{" "}
              <span className="text-brand-gold">≈ {maxEtb.toLocaleString()} ETB</span>
            </p>
            {pendingXp > 0 && (
              <p className="mt-1 text-xs text-amber-700">
                {pendingXp.toLocaleString()} XP reserved in pending requests
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="account-name">Account holder name</Label>
              <Input
                id="account-name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Full name as on bank account"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="account-number">Account number</Label>
              <Input
                id="account-number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 1000123456789"
                className="mt-1.5 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="amount-etb">Amount (ETB)</Label>
              <Input
                id="amount-etb"
                type="number"
                min={MIN_WITHDRAWAL_ETB}
                max={maxEtb}
                value={amountEtb}
                onChange={(e) => setAmountEtb(Number(e.target.value) || 0)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-slate-500">
                Costs {xpCost.toLocaleString()} XP · Max {maxEtb.toLocaleString()} ETB
              </p>
            </div>
            <Button
              type="button"
              className="w-full bg-brand-navy hover:bg-brand-navy/90"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              Request withdrawal
            </Button>
            <p className="text-center text-[10px] text-slate-400">
              Requests are reviewed by admin within 24–48 hours
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal history */}
      {myRequests.length > 0 && (
        <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <History className="size-5 text-brand-navy" />
            <h3 className="font-semibold text-brand-navy">Your withdrawal history</h3>
          </div>
          <div className="space-y-3">
            {myRequests.map((req) => {
              const reqBank = ethiopianBanks.find((b) => b.id === req.bankId);
              return (
                <div
                  key={req.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 p-4"
                >
                  {reqBank && <BankLogo bank={reqBank} size="sm" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-navy">
                      {req.amountEtb} ETB → {req.bankName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {req.accountName} · {maskAccount(req.accountNumber)}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="size-3" />
                      {req.requestedAt}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className={statusStyles[req.status]}>
                      {statusLabels[req.status]}
                    </Badge>
                    <p className="mt-1 font-mono text-xs text-slate-500">-{req.xpDeducted} XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function maskAccount(num: string) {
  if (num.length <= 4) return num;
  return `${num.slice(0, 4)}****${num.slice(-4)}`;
}
