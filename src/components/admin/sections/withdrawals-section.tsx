import {
  AlertCircle,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  PowerOff,
  Search,
  Settings2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { BankLogo } from "@/components/bank-logo";
import { UsdtLogo } from "@/components/usdt-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { ethiopianBanks, getBankById } from "@/lib/ethiopian-banks";
import type { WithdrawalRequest, WithdrawalStatus } from "@/lib/withdrawal-data";
import { cn } from "@/lib/utils";

type Filter = WithdrawalStatus | "all";

const STATUS_FILTERS: { key: Filter; label: string; activeClass: string }[] = [
  { key: "all", label: "All", activeClass: "bg-brand-navy text-white border-brand-navy" },
  { key: "pending", label: "Pending", activeClass: "bg-amber-500 text-white border-amber-500" },
  { key: "approved", label: "Approved", activeClass: "bg-blue-600 text-white border-blue-600" },
  { key: "paid", label: "Paid", activeClass: "bg-emerald-600 text-white border-emerald-600" },
  { key: "rejected", label: "Rejected", activeClass: "bg-red-500 text-white border-red-500" },
];

const STATUS_CONFIG: Record<
  WithdrawalStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    badge: string;
    row: string;
    stripe: string;
  }
> = {
  pending: {
    label: "Pending review",
    icon: Clock,
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    row: "border-l-amber-400 bg-amber-50/20",
    stripe: "bg-amber-400",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    row: "border-l-blue-400 bg-blue-50/10",
    stripe: "bg-blue-500",
  },
  paid: {
    label: "Paid",
    icon: Building2,
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    row: "border-l-emerald-400",
    stripe: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    badge: "bg-red-50 text-red-600 border border-red-200",
    row: "border-l-red-300 opacity-75",
    stripe: "bg-red-400",
  },
};

export function WithdrawalsSection({ admin }: { admin: AdminDashboardState }) {
  const {
    withdrawals,
    pendingWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    markPaid,
    settings,
    setSettings,
  } = admin;
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [methodsOpen, setMethodsOpen] = useState(false);

  const withdrawalsEnabled = settings.withdrawalsEnabled ?? true;
  const enabledBanks: string[] = settings.enabledBanks ?? ethiopianBanks.map((b) => b.id);
  const usdtWithdrawalsEnabled = settings.usdtWithdrawalsEnabled ?? true;

  const toggleWithdrawals = () =>
    setSettings({ ...settings, withdrawalsEnabled: !withdrawalsEnabled });

  const toggleUsdtWithdrawals = () =>
    setSettings({ ...settings, usdtWithdrawalsEnabled: !usdtWithdrawalsEnabled });

  const toggleBank = (bankId: string) => {
    const next = enabledBanks.includes(bankId)
      ? enabledBanks.filter((id) => id !== bankId)
      : [...enabledBanks, bankId];
    setSettings({ ...settings, enabledBanks: next });
  };

  const enableAll = () =>
    setSettings({ ...settings, enabledBanks: ethiopianBanks.map((b) => b.id) });
  const disableAll = () => setSettings({ ...settings, enabledBanks: [] });

  // Counts per status
  const counts: Record<Filter, number> = {
    all: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === "pending").length,
    approved: withdrawals.filter((w) => w.status === "approved").length,
    paid: withdrawals.filter((w) => w.status === "paid").length,
    rejected: withdrawals.filter((w) => w.status === "rejected").length,
  };

  // Aggregate amounts
  const totalPendingEtb = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((s, w) => s + w.amountEtb, 0);
  const totalApprovedEtb = withdrawals
    .filter((w) => w.status === "approved")
    .reduce((s, w) => s + w.amountEtb, 0);
  const totalPaidEtb = withdrawals
    .filter((w) => w.status === "paid" || w.status === "approved")
    .reduce((s, w) => s + w.amountEtb, 0);
  const totalAllEtb = withdrawals.reduce((s, w) => s + w.amountEtb, 0);

  const visible = withdrawals.filter((w) => {
    if (filter !== "all" && w.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        w.userName.toLowerCase().includes(q) ||
        w.university.toLowerCase().includes(q) ||
        (w.bankName?.toLowerCase().includes(q) ?? false) ||
        (w.binanceUid?.toLowerCase().includes(q) ?? false) ||
        w.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleBulkApprove = () =>
    withdrawals.filter((w) => w.status === "pending").forEach((w) => approveWithdrawal(w.id));

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* ── Withdrawal Methods control panel ── */}
      <div
        className={cn(
          "rounded-2xl border bg-white shadow-sm overflow-hidden transition-all",
          !withdrawalsEnabled && "border-red-200 bg-red-50/30",
        )}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl transition-colors",
                withdrawalsEnabled ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500",
              )}
            >
              <Settings2 className="size-5" />
            </div>
            <div>
              <p className="font-bold text-brand-navy text-sm">Bank transfer methods</p>
              <p className="text-xs text-slate-400">
                {withdrawalsEnabled
                  ? `${enabledBanks.length} of ${ethiopianBanks.length} banks active`
                  : "All bank withdrawals are disabled"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Master on/off toggle */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-semibold",
                  withdrawalsEnabled ? "text-emerald-600" : "text-red-500",
                )}
              >
                {withdrawalsEnabled ? "ON" : "OFF"}
              </span>
              <button
                type="button"
                onClick={toggleWithdrawals}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none",
                  withdrawalsEnabled ? "bg-emerald-500" : "bg-slate-300",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
                    withdrawalsEnabled ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>

            {/* Expand / collapse bank list */}
            <button
              type="button"
              onClick={() => setMethodsOpen(!methodsOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Banks
              {methodsOpen ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Disabled banner */}
        {!withdrawalsEnabled && (
          <div className="mx-5 mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <PowerOff className="size-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-600 font-medium">
              Withdrawals are globally disabled. Students cannot submit new cash-out requests.
            </p>
          </div>
        )}

        {/* Bank grid */}
        {methodsOpen && (
          <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200 border-t border-slate-100 bg-slate-50/50 p-5 space-y-4">
            {/* Quick actions */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Bank channels ({enabledBanks.length} enabled)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={enableAll}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  Enable all
                </button>
                <button
                  type="button"
                  onClick={disableAll}
                  className="rounded-lg border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                >
                  Disable all
                </button>
              </div>
            </div>

            {/* Bank toggle cards */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ethiopianBanks.map((bank) => {
                const on = enabledBanks.includes(bank.id);
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => toggleBank(bank.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      on
                        ? "border-emerald-200 bg-white shadow-sm hover:border-emerald-300"
                        : "border-slate-200 bg-slate-100/60 opacity-60 hover:opacity-80",
                    )}
                  >
                    {/* Bank color dot */}
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold"
                      style={{ backgroundColor: bank.color }}
                    >
                      {bank.short.slice(0, 3)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-brand-navy">{bank.name}</p>
                      <p className="text-[10px] text-slate-400">{bank.short}</p>
                    </div>

                    {/* Toggle pill */}
                    <div
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                        on ? "bg-emerald-500" : "bg-slate-300",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
                          on ? "translate-x-4" : "translate-x-0.5",
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── USDT (Binance) method control ── */}
      <div
        className={cn(
          "rounded-2xl border bg-white shadow-sm overflow-hidden transition-all",
          !usdtWithdrawalsEnabled && "border-red-200 bg-red-50/30",
        )}
      >
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl transition-colors",
                usdtWithdrawalsEnabled
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500",
              )}
            >
              <Coins className="size-5" />
            </div>
            <div>
              <p className="font-bold text-brand-navy text-sm">USDT (Binance) transfers</p>
              <p className="text-xs text-slate-400">
                {usdtWithdrawalsEnabled
                  ? "Students can cash out to their Binance UID"
                  : "USDT withdrawals are disabled"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-semibold",
                usdtWithdrawalsEnabled ? "text-emerald-600" : "text-red-500",
              )}
            >
              {usdtWithdrawalsEnabled ? "ON" : "OFF"}
            </span>
            <button
              type="button"
              onClick={toggleUsdtWithdrawals}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none",
                usdtWithdrawalsEnabled ? "bg-emerald-500" : "bg-slate-300",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
                  usdtWithdrawalsEnabled ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>

        {!usdtWithdrawalsEnabled && (
          <div className="mx-5 mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <PowerOff className="size-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-600 font-medium">
              USDT withdrawals are disabled. Students cannot submit new Binance cash-out requests.
            </p>
          </div>
        )}
      </div>

      {/* ── Summary stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Pending requests",
            value: counts.pending,
            sub: `${totalPendingEtb.toLocaleString()} ETB awaiting`,
            icon: Clock,
            bg: "bg-amber-50",
            color: "text-amber-600",
            border: "border-l-4 border-l-amber-400",
            pulse: counts.pending > 0,
          },
          {
            label: "Approved",
            value: counts.approved,
            sub: `${totalApprovedEtb.toLocaleString()} ETB approved`,
            icon: CheckCircle2,
            bg: "bg-blue-50",
            color: "text-blue-600",
            border: "border-l-4 border-l-blue-400",
            pulse: false,
          },
          {
            label: "Paid out",
            value: counts.paid,
            sub: `${totalPaidEtb.toLocaleString()} ETB disbursed`,
            icon: Building2,
            bg: "bg-emerald-50",
            color: "text-emerald-600",
            border: "border-l-4 border-l-emerald-400",
            pulse: false,
          },
          {
            label: "Total volume",
            value: totalAllEtb.toLocaleString(),
            sub: `${withdrawals.length} total requests`,
            icon: Banknote,
            bg: "bg-brand-gold/10",
            color: "text-brand-gold",
            border: "border-l-4 border-l-brand-gold",
            pulse: false,
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={cn("rounded-xl border bg-white p-5 shadow-sm", s.border)}>
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    s.bg,
                    s.color,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                {s.pulse && (
                  <span className="size-2 rounded-full bg-amber-400 animate-pulse mt-1" />
                )}
              </div>
              <p className="mt-3 font-serif text-3xl font-bold text-brand-navy">{s.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-slate-400">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── ETB pipeline progress ── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-brand-gold" />
            <p className="font-semibold text-brand-navy text-sm">ETB pipeline</p>
          </div>
          <p className="text-xs text-slate-400">
            {totalAllEtb > 0 ? Math.round((totalPaidEtb / totalAllEtb) * 100) : 0}% disbursed
          </p>
        </div>
        <div className="space-y-2">
          {[
            {
              label: "Paid / Approved",
              etb: totalPaidEtb,
              pct: totalAllEtb > 0 ? (totalPaidEtb / totalAllEtb) * 100 : 0,
              bar: "[&>div]:bg-emerald-500",
            },
            {
              label: "Pending",
              etb: totalPendingEtb,
              pct: totalAllEtb > 0 ? (totalPendingEtb / totalAllEtb) * 100 : 0,
              bar: "[&>div]:bg-amber-400",
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-slate-500">{row.label}</span>
              <Progress value={row.pct} className={cn("flex-1 h-2", row.bar)} />
              <span className="w-20 text-right text-xs font-bold text-brand-navy">
                {row.etb.toLocaleString()} ETB
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                filter === f.key
                  ? f.activeClass
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
              )}
            >
              {f.key === "pending" && counts.pending > 0 && filter !== "pending" && (
                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  filter === f.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search student, bank, ID…"
            className="pl-8 h-9 text-sm bg-slate-50 border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {pendingWithdrawals > 0 && (
          <Button
            size="sm"
            className="ml-auto gap-2 bg-emerald-600 hover:bg-emerald-700 h-9"
            onClick={handleBulkApprove}
          >
            <CheckCircle2 className="size-4" />
            Approve all pending ({pendingWithdrawals})
          </Button>
        )}
      </div>

      {/* ── Request cards ── */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Banknote className="size-7" />
          </div>
          <p className="font-serif text-lg font-bold text-brand-navy">No withdrawal requests</p>
          <p className="mt-1 text-sm text-slate-400">
            {search
              ? `No results for "${search}"`
              : `No ${filter === "all" ? "" : filter} requests found`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((req) => (
            <WithdrawalCard
              key={req.id}
              request={req}
              expanded={expandedId === req.id}
              onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
              onApprove={() => approveWithdrawal(req.id)}
              onReject={(note) => rejectWithdrawal(req.id, note)}
              onMarkPaid={() => markPaid(req.id)}
            />
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-brand-navy">{visible.length}</strong> of{" "}
            {withdrawals.length} requests
          </span>
          <span>
            Filtered total:{" "}
            <strong className="text-brand-navy">
              {visible.reduce((s, w) => s + w.amountEtb, 0).toLocaleString()} ETB
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Individual withdrawal card ───────────────────────────────────────────────

function WithdrawalCard({
  request,
  expanded,
  onToggle,
  onApprove,
  onReject,
  onMarkPaid,
}: {
  request: WithdrawalRequest;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: (note?: string) => void;
  onMarkPaid: () => void;
}) {
  const bank = request.bankId ? getBankById(request.bankId) : undefined;
  const isUsdt = request.method === "usdt";
  const cfg = STATUS_CONFIG[request.status];
  const StatusIcon = cfg.icon;
  const [note, setNote] = useState(request.adminNote ?? "");

  const initials = request.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md border-l-4",
        cfg.row,
      )}
    >
      <div className={cn("h-0.5 w-full", cfg.stripe)} />

      <div className="flex flex-wrap items-start gap-4 p-5">
        {/* Student */}
        <div className="flex items-center gap-3 min-w-[180px] flex-1">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-navy/20 to-brand-gold/20 font-bold text-brand-navy text-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-brand-navy leading-tight truncate">{request.userName}</p>
            <p className="text-xs text-slate-400 truncate">{request.university}</p>
            <p className="mt-0.5 font-mono text-[10px] text-slate-300">{request.id}</p>
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-center gap-3 min-w-[160px] flex-1">
          {isUsdt ? <UsdtLogo size="sm" /> : bank && <BankLogo bank={bank} size="sm" />}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-navy truncate">
              {isUsdt ? "USDT via Binance" : request.bankName}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {isUsdt ? "Binance UID" : request.accountName}
            </p>
            <p className="font-mono text-[10px] text-slate-400">
              {isUsdt ? request.binanceUid : request.accountNumber}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="shrink-0 text-right min-w-[100px]">
          <p className="font-serif text-2xl font-bold text-brand-navy leading-tight">
            {isUsdt ? request.amountUsdt : request.amountEtb.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-slate-400">
              {isUsdt ? "USDT" : "ETB"}
            </span>
          </p>
          <p className="text-xs text-slate-400">−{request.xpDeducted.toLocaleString()} XP</p>
        </div>

        {/* Status + time */}
        <div className="shrink-0 text-right min-w-[120px]">
          <Badge variant="secondary" className={cn("text-xs gap-1 mb-1", cfg.badge)}>
            <StatusIcon className="size-3" />
            {cfg.label}
          </Badge>
          <p className="text-[10px] text-slate-400 leading-tight">{request.requestedAt}</p>
          {request.processedAt && (
            <p className="text-[10px] text-slate-300">→ {request.processedAt}</p>
          )}
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={onToggle}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-brand-navy transition-colors"
        >
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {expanded && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200 border-t border-slate-100 bg-slate-50/60 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            {[
              { label: "Request ID", value: request.id },
              { label: "Student ID", value: request.userId },
              isUsdt
                ? { label: "Binance UID", value: request.binanceUid ?? "—" }
                : { label: "Bank ID", value: (request.bankId ?? "—").toUpperCase() },
              {
                label: isUsdt ? "ETB equivalent" : "Account holder",
                value: isUsdt
                  ? `${request.amountEtb.toLocaleString()} ETB`
                  : (request.accountName ?? "—"),
              },
            ].map((d) => (
              <div
                key={d.label}
                className="rounded-xl border border-slate-100 bg-white px-3 py-2.5"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {d.label}
                </p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-brand-navy truncate">
                  {d.value}
                </p>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Admin note (optional)
            </label>
            <Textarea
              rows={2}
              placeholder="Add a note visible to the admin team only…"
              className="text-sm resize-none bg-white"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {request.status === "pending" && (
              <>
                <Button
                  size="sm"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={onApprove}
                >
                  <CheckCircle2 className="size-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 text-red-600 hover:bg-red-50 hover:border-red-300"
                  onClick={() => onReject(note.trim() || undefined)}
                >
                  <XCircle className="size-4" />
                  Reject
                </Button>
                <span className="ml-2 text-xs text-slate-400">
                  Approving will move this to "Approved" status
                </span>
              </>
            )}
            {request.status === "approved" && (
              <>
                <Button
                  size="sm"
                  className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
                  onClick={onMarkPaid}
                >
                  <Building2 className="size-4" />
                  Mark as paid
                </Button>
                <span className="text-xs text-slate-400">
                  Confirm transfer completed via {isUsdt ? "Binance" : request.bankName}
                </span>
              </>
            )}
            {request.status === "paid" && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                <CheckCircle2 className="size-4 shrink-0" />
                Payment confirmed · {request.processedAt ?? "—"}
              </div>
            )}
            {request.status === "rejected" && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                <AlertCircle className="size-4 shrink-0" />
                Request rejected · {request.processedAt ?? "—"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
