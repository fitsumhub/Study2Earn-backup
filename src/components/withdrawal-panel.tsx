import { Building2, Check, Clock, Coins, History, Info, Wallet, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";

import { BankLogo } from "@/components/bank-logo";
import { UsdtLogo } from "@/components/usdt-logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useWithdrawals } from "@/hooks/use-withdrawals";
import { ethiopianBanks } from "@/lib/ethiopian-banks";
import {
  ETB_PER_USDT,
  MAX_WITHDRAWAL_USDT,
  MIN_WITHDRAWAL_ETB,
  MIN_WITHDRAWAL_USDT,
  XP_PER_ETB,
  XP_PER_USDT,
  etbToXp,
  isValidBinanceUid,
  usdtToXp,
  xpToEtb,
  xpToUsdt,
  type WithdrawalMethod,
  type WithdrawalRequest,
  type WithdrawalStatus,
} from "@/lib/withdrawal-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<WithdrawalRequest["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-200/50",
  approved: "bg-blue-600 text-white border border-blue-600",
  rejected: "bg-red-50 text-red-700 border border-red-200",
  paid: "bg-emerald-600 text-white border border-emerald-600",
};

const statusLabels: Record<WithdrawalRequest["status"], string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
};

export type WithdrawalPrefill = {
  method: WithdrawalMethod;
  amountEtb?: number;
  amountUsdt?: number;
};

export function WithdrawalPanel({
  availableXp,
  prefill,
}: {
  availableXp: number;
  /** Set by a catalog "redeem" shortcut to jump straight to a pre-filled request. */
  prefill?: WithdrawalPrefill | null;
}) {
  const { user } = useAuth();
  const { myRequests, pendingXp, submitWithdrawal } = useWithdrawals();
  const [method, setMethod] = useState<WithdrawalMethod>("bank");

  // Bank form state
  const [selectedBank, setSelectedBank] = useState(ethiopianBanks[0].id);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amountEtb, setAmountEtb] = useState(MIN_WITHDRAWAL_ETB);

  // USDT form state
  const [binanceUid, setBinanceUid] = useState("");
  const [amountUsdt, setAmountUsdt] = useState(MIN_WITHDRAWAL_USDT);

  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (user?.name) setAccountName(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (!prefill) return;
    setMethod(prefill.method);
    if (prefill.method === "bank" && prefill.amountEtb) setAmountEtb(prefill.amountEtb);
    if (prefill.method === "usdt" && prefill.amountUsdt) setAmountUsdt(prefill.amountUsdt);
  }, [prefill]);

  const spendableXp = availableXp - pendingXp;
  const maxEtb = xpToEtb(spendableXp);
  const maxUsdt = Math.min(MAX_WITHDRAWAL_USDT, xpToUsdt(spendableXp));

  const xpCostBank = etbToXp(amountEtb);
  const xpCostUsdt = usdtToXp(amountUsdt);

  const canSubmitBank =
    amountEtb >= MIN_WITHDRAWAL_ETB &&
    amountEtb <= maxEtb &&
    accountNumber.trim().length >= 8 &&
    accountName.trim().length >= 2;

  const canSubmitUsdt =
    amountUsdt >= MIN_WITHDRAWAL_USDT && amountUsdt <= maxUsdt && isValidBinanceUid(binanceUid);

  const canSubmit = method === "bank" ? canSubmitBank : canSubmitUsdt;

  const bank = useMemo(
    () => ethiopianBanks.find((b) => b.id === selectedBank) ?? ethiopianBanks[0],
    [selectedBank],
  );

  const handleConfirmedSubmit = () => {
    const result =
      method === "bank"
        ? submitWithdrawal({
            method: "bank",
            bankId: selectedBank,
            accountNumber: accountNumber.trim(),
            accountName: accountName.trim(),
            amountEtb,
          })
        : submitWithdrawal({
            method: "usdt",
            binanceUid: binanceUid.trim(),
            amountUsdt,
          });

    setConfirmOpen(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    if (method === "bank") {
      toast.success("Withdrawal request submitted!", {
        description: `${amountEtb} ETB to ${bank.name} — pending admin approval`,
      });
      setAccountNumber("");
      setAmountEtb(MIN_WITHDRAWAL_ETB);
    } else {
      toast.success("Withdrawal request submitted!", {
        description: `${amountUsdt} USDT to Binance UID ${binanceUid.trim()} — pending admin approval`,
      });
      setBinanceUid("");
      setAmountUsdt(MIN_WITHDRAWAL_USDT);
    }
  };

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cash out</p>
        <h2 className="text-xl font-bold text-slate-900">Withdraw your earnings</h2>
        <p className="mt-1 text-sm text-slate-500">
          {method === "bank" ? (
            <>
              Convert XP to Ethiopian Birr and withdraw to your bank account. Rate:{" "}
              <strong className="text-slate-700">{XP_PER_ETB} XP = 1 ETB</strong> · Min{" "}
              {MIN_WITHDRAWAL_ETB} ETB
            </>
          ) : (
            <>
              Convert XP to USDT and receive it instantly via your Binance UID. Rate:{" "}
              <strong className="text-slate-700">{XP_PER_USDT.toLocaleString()} XP = 1 USDT</strong>{" "}
              · Min {MIN_WITHDRAWAL_USDT} USDT
            </>
          )}
        </p>
      </div>

      {prefill && (
        <div className="mb-6 rounded-lg border border-brand-gold/40 bg-brand-gold/5 px-4 py-3 text-sm text-slate-700">
          Completing your{" "}
          <strong className="text-brand-navy">
            {prefill.method === "bank" ? `${prefill.amountEtb} ETB` : `${prefill.amountUsdt} USDT`}
          </strong>{" "}
          redemption — fill in your delivery details below and submit.
        </div>
      )}

      {/* Method switcher */}
      <div className="mb-6 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setMethod("bank")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
            method === "bank"
              ? "bg-white text-brand-navy shadow-sm"
              : "text-slate-500 hover:text-brand-navy",
          )}
        >
          <Building2 className="size-4" />
          Bank transfer
        </button>
        <button
          type="button"
          onClick={() => setMethod("usdt")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
            method === "usdt"
              ? "bg-white text-brand-navy shadow-sm"
              : "text-slate-500 hover:text-brand-navy",
          )}
        >
          <Coins className="size-4" />
          USDT (Binance)
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {method === "bank" ? (
          <>
            {/* Bank selection */}
            <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6">
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

            {/* Bank withdrawal form */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
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
                    {pendingXp.toLocaleString()} XP already committed to withdrawal requests
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
                    Costs {xpCostBank.toLocaleString()} XP · Max {maxEtb.toLocaleString()} ETB
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full bg-brand-navy hover:bg-brand-navy/90"
                  disabled={!canSubmit}
                  onClick={() => setConfirmOpen(true)}
                >
                  Request withdrawal
                </Button>
                <p className="text-center text-[10px] text-slate-400">
                  Requests are reviewed by admin within 24–48 hours
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* USDT / Binance explainer */}
            <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <Coins className="size-5 text-brand-navy" />
                <h3 className="font-semibold text-brand-navy">USDT via Binance</h3>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <UsdtLogo size="md" />
                <div>
                  <p className="font-semibold text-brand-navy">Binance Pay transfer</p>
                  <p className="text-xs text-slate-500">
                    Sent instantly to your Binance UID, no network fees
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 rounded-xl border border-brand-gold/20 bg-brand-gold/5 p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold">
                  <Info className="size-3.5" /> How to find your Binance UID
                </p>
                <ol className="space-y-1.5 text-sm text-slate-600">
                  <li>1. Open the Binance app and go to your Profile</li>
                  <li>2. Your numeric UID is shown under your name/avatar</li>
                  <li>3. Copy it and paste it into the form on the right</li>
                </ol>
                <p className="text-xs text-slate-500">
                  Double-check your UID before submitting — crypto transfers can't be reversed.
                </p>
              </div>
            </div>

            {/* USDT withdrawal form */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <Wallet className="size-5 text-brand-navy" />
                <h3 className="font-semibold text-brand-navy">Withdrawal details</h3>
              </div>

              <div className="mb-4 rounded-lg bg-brand-navy/5 px-4 py-3 text-sm">
                <p className="text-slate-600">
                  Available:{" "}
                  <strong className="text-brand-navy">{spendableXp.toLocaleString()} XP</strong>{" "}
                  <span className="text-brand-gold">≈ {xpToUsdt(spendableXp).toFixed(2)} USDT</span>
                </p>
                {pendingXp > 0 && (
                  <p className="mt-1 text-xs text-amber-700">
                    {pendingXp.toLocaleString()} XP already committed to withdrawal requests
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="binance-uid">Binance UID</Label>
                  <Input
                    id="binance-uid"
                    value={binanceUid}
                    onChange={(e) => setBinanceUid(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="e.g. 349021558"
                    inputMode="numeric"
                    className="mt-1.5 font-mono"
                  />
                  {binanceUid.length > 0 && !isValidBinanceUid(binanceUid) && (
                    <p className="mt-1 text-xs text-red-600">UID must be 6–12 digits</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="amount-usdt">Amount (USDT)</Label>
                  <Input
                    id="amount-usdt"
                    type="number"
                    step="0.01"
                    min={MIN_WITHDRAWAL_USDT}
                    max={maxUsdt}
                    value={amountUsdt}
                    onChange={(e) => setAmountUsdt(Number(e.target.value) || 0)}
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Costs {xpCostUsdt.toLocaleString()} XP · Max {maxUsdt.toFixed(2)} USDT · ≈{" "}
                    {Math.round(amountUsdt * ETB_PER_USDT).toLocaleString()} ETB
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full bg-brand-navy hover:bg-brand-navy/90"
                  disabled={!canSubmit}
                  onClick={() => setConfirmOpen(true)}
                >
                  Request withdrawal
                </Button>
                <p className="text-center text-[10px] text-slate-400">
                  Requests are reviewed by admin within 24–48 hours
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation dialog — show the exact math before committing XP */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm your withdrawal</AlertDialogTitle>
            <AlertDialogDescription>
              Please double-check the details — the XP below will be reserved until the request is
              processed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {method === "bank" ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="mb-3 flex items-center gap-3">
                <BankLogo bank={bank} size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-brand-navy">{bank.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {accountName.trim()} · {maskAccount(accountNumber.trim())}
                  </p>
                </div>
              </div>
              <dl className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-600">You receive</dt>
                  <dd className="font-bold text-brand-navy">{amountEtb.toLocaleString()} ETB</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-600">
                    XP cost ({amountEtb.toLocaleString()} × {XP_PER_ETB})
                  </dt>
                  <dd className="font-semibold text-red-600">−{xpCostBank.toLocaleString()} XP</dd>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                  <dt className="text-slate-600">Balance after</dt>
                  <dd className="font-semibold text-slate-700">
                    {(spendableXp - xpCostBank).toLocaleString()} XP
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                Reviewed within 24–48 hours. If rejected, the reserved XP is returned to your
                wallet.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="mb-3 flex items-center gap-3">
                <UsdtLogo size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-brand-navy">Binance UID</p>
                  <p className="truncate font-mono text-xs text-slate-500">
                    {maskAccount(binanceUid.trim())}
                  </p>
                </div>
              </div>
              <dl className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-600">You receive</dt>
                  <dd className="font-bold text-brand-navy">{amountUsdt} USDT</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-600">XP cost</dt>
                  <dd className="font-semibold text-red-600">−{xpCostUsdt.toLocaleString()} XP</dd>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                  <dt className="text-slate-600">Balance after</dt>
                  <dd className="font-semibold text-slate-700">
                    {(spendableXp - xpCostUsdt).toLocaleString()} XP
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                Reviewed within 24–48 hours. If rejected, the reserved XP is returned to your
                wallet. Crypto transfers cannot be reversed once paid — verify your UID.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-brand-navy hover:bg-brand-navy/90"
              onClick={handleConfirmedSubmit}
            >
              Confirm request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Withdrawal history */}
      {myRequests.length > 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <History className="size-5 text-brand-navy" />
            <h3 className="font-semibold text-brand-navy">Your withdrawal history</h3>
          </div>
          <div className="space-y-3">
            {myRequests.map((req) => {
              const reqBank = req.bankId ? ethiopianBanks.find((b) => b.id === req.bankId) : null;
              const isUsdt = req.method === "usdt";
              return (
                <div key={req.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {isUsdt ? (
                      <UsdtLogo size="sm" />
                    ) : (
                      reqBank && <BankLogo bank={reqBank} size="sm" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-brand-navy">
                        {isUsdt
                          ? `${req.amountUsdt} USDT → Binance`
                          : `${req.amountEtb} ETB → ${req.bankName}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isUsdt
                          ? `UID ${maskAccount(req.binanceUid ?? "")}`
                          : `${req.accountName} · ${maskAccount(req.accountNumber ?? "")}`}
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
                  <StatusTracker req={req} />
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

const TRACKER_HINTS: Record<WithdrawalStatus, string> = {
  pending: "Under review — approval usually takes 24–48 hours",
  approved: "Approved — the transfer is being processed",
  paid: "Money delivered",
  rejected: "Request rejected — the reserved XP was returned to your wallet",
};

/** Requested → Approved → Paid progress line (or Requested → Rejected). */
function StatusTracker({ req }: { req: WithdrawalRequest }) {
  const rejected = req.status === "rejected";
  const paidLabel = req.method === "usdt" ? "Sent" : "Paid";
  const steps: { label: string; state: "done" | "current" | "todo" | "failed" }[] = rejected
    ? [
        { label: "Requested", state: "done" },
        { label: "Rejected", state: "failed" },
      ]
    : [
        { label: "Requested", state: "done" },
        {
          label: "Approved",
          state: req.status === "pending" ? "current" : "done",
        },
        {
          label: paidLabel,
          state: req.status === "paid" ? "done" : req.status === "approved" ? "current" : "todo",
        },
      ];

  return (
    <div className="mt-4 border-t border-slate-50 pt-3">
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step.label} className={cn("flex items-center", i > 0 && "flex-1")}>
            {i > 0 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full",
                  step.state === "done"
                    ? "bg-emerald-400"
                    : step.state === "failed"
                      ? "bg-red-300"
                      : "bg-slate-200",
                )}
              />
            )}
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full",
                  step.state === "done"
                    ? "bg-emerald-500 text-white"
                    : step.state === "failed"
                      ? "bg-red-500 text-white"
                      : step.state === "current"
                        ? "border-2 border-amber-400 bg-amber-50"
                        : "border border-slate-200 bg-white",
                )}
              >
                {step.state === "done" && <Check className="size-3" />}
                {step.state === "failed" && <X className="size-3" />}
                {step.state === "current" && (
                  <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                )}
              </span>
              <span
                className={cn(
                  "text-[11px] font-semibold",
                  step.state === "done"
                    ? "text-emerald-700"
                    : step.state === "failed"
                      ? "text-red-600"
                      : step.state === "current"
                        ? "text-amber-700"
                        : "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        {TRACKER_HINTS[req.status]}
        {req.processedAt && req.status !== "pending" && (
          <span className="text-slate-400"> · {req.processedAt}</span>
        )}
      </p>
      {req.adminNote && (
        <p className="mt-1 rounded-lg bg-red-50 px-3 py-1.5 text-[11px] text-red-700">
          Admin note: {req.adminNote}
        </p>
      )}
    </div>
  );
}
