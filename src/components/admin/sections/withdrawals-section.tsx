import {
  AlertCircle,
  ArrowUpDown,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Layers,
  PowerOff,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Share2,
  Sparkles,
  TrendingUp,
  UserCheck,
  Wallet,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import React, { useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { BankLogo } from "@/components/bank-logo";
import { UsdtLogo } from "@/components/usdt-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { ethiopianBanks, getBankById } from "@/lib/ethiopian-banks";
import type { WithdrawalRequest, WithdrawalStatus } from "@/lib/withdrawal-data";
import {
  downloadBankBatchFile,
  downloadWithdrawalsCsv,
  generateDemoTxReference,
} from "@/lib/withdrawal-export";
import { cn } from "@/lib/utils";

type Filter = WithdrawalStatus | "all";
type SortOption = "newest" | "oldest" | "amount-desc" | "amount-asc";

const STATUS_FILTERS: { key: Filter; label: string; activeClass: string }[] = [
  { key: "all", label: "All Requests", activeClass: "bg-slate-900 text-white border-slate-900" },
  { key: "pending", label: "Pending", activeClass: "bg-amber-500 text-white border-amber-500" },
  { key: "approved", label: "Approved", activeClass: "bg-blue-600 text-white border-blue-600" },
  { key: "paid", label: "Paid", activeClass: "bg-emerald-600 text-white border-emerald-600" },
  { key: "rejected", label: "Rejected", activeClass: "bg-rose-500 text-white border-rose-500" },
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
    label: "Pending Review",
    icon: Clock,
    badge: "bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-400",
    row: "border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10",
    stripe: "bg-amber-500",
  },
  approved: {
    label: "Approved (Ready)",
    icon: CheckCircle2,
    badge: "bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/30 dark:text-blue-400",
    row: "border-l-blue-500 bg-blue-50/15 dark:bg-blue-950/10",
    stripe: "bg-blue-500",
  },
  paid: {
    label: "Disbursed / Paid",
    icon: Building2,
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400",
    row: "border-l-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5",
    stripe: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    badge: "bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/30 dark:text-rose-400",
    row: "border-l-rose-400 opacity-80",
    stripe: "bg-rose-400",
  },
};

const PRESET_REJECTION_REASONS = [
  "Account number not found or inactive",
  "Name on bank account does not match university student name",
  "Duplicate withdrawal request submitted",
  "Suspicious point velocity / integrity flag triggered",
  "Binance UID format invalid or unregistered",
];

export function WithdrawalsSection({ admin }: { admin: AdminDashboardState }) {
  const {
    withdrawals,
    pendingWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    markPaid,
    bulkApproveWithdrawals,
    bulkMarkPaidWithdrawals,
    bulkRejectWithdrawals,
    settings,
    setSettings,
  } = admin;

  // Filtering & Sorting State
  const [filter, setFilter] = useState<Filter>("all");
  const [methodFilter, setMethodFilter] = useState<"all" | "bank" | "usdt">("all");
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [methodsOpen, setMethodsOpen] = useState(false);

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal Dialogs State
  const [payoutTarget, setPayoutTarget] = useState<WithdrawalRequest | null>(null);
  const [isBulkPayoutOpen, setIsBulkPayoutOpen] = useState(false);
  const [payoutTxRef, setPayoutTxRef] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");

  const [rejectTarget, setRejectTarget] = useState<WithdrawalRequest | null>(null);
  const [isBulkRejectOpen, setIsBulkRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Gateway Settings
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
  const counts: Record<Filter, number> = useMemo(
    () => ({
      all: withdrawals.length,
      pending: withdrawals.filter((w) => w.status === "pending").length,
      approved: withdrawals.filter((w) => w.status === "approved").length,
      paid: withdrawals.filter((w) => w.status === "paid").length,
      rejected: withdrawals.filter((w) => w.status === "rejected").length,
    }),
    [withdrawals],
  );

  // Aggregate amounts
  const totalPendingEtb = useMemo(
    () =>
      withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + w.amountEtb, 0),
    [withdrawals],
  );

  const totalApprovedEtb = useMemo(
    () =>
      withdrawals.filter((w) => w.status === "approved").reduce((s, w) => s + w.amountEtb, 0),
    [withdrawals],
  );

  const totalPaidEtb = useMemo(
    () => withdrawals.filter((w) => w.status === "paid").reduce((s, w) => s + w.amountEtb, 0),
    [withdrawals],
  );

  const totalAllEtb = useMemo(
    () => withdrawals.reduce((s, w) => s + w.amountEtb, 0),
    [withdrawals],
  );

  // Bank & Provider Volume Breakdown
  const providerStats = useMemo(() => {
    let cbe = 0;
    let awash = 0;
    let dashen = 0;
    let usdt = 0;
    let other = 0;

    for (const w of withdrawals) {
      if (w.method === "usdt") {
        usdt += w.amountEtb;
      } else if (w.bankId === "cbe") {
        cbe += w.amountEtb;
      } else if (w.bankId === "awash") {
        awash += w.amountEtb;
      } else if (w.bankId === "dashen") {
        dashen += w.amountEtb;
      } else {
        other += w.amountEtb;
      }
    }
    const total = totalAllEtb || 1;
    return {
      cbe: { amount: cbe, pct: Math.round((cbe / total) * 100) },
      awash: { amount: awash, pct: Math.round((awash / total) * 100) },
      dashen: { amount: dashen, pct: Math.round((dashen / total) * 100) },
      usdt: { amount: usdt, pct: Math.round((usdt / total) * 100) },
      other: { amount: other, pct: Math.round((other / total) * 100) },
    };
  }, [withdrawals, totalAllEtb]);

  // Filtered & Sorted requests
  const visible = useMemo(() => {
    const list = withdrawals.filter((w) => {
      if (filter !== "all" && w.status !== filter) return false;
      if (methodFilter !== "all" && w.method !== methodFilter) return false;
      if (bankFilter !== "all" && w.bankId !== bankFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          w.userName.toLowerCase().includes(q) ||
          w.userId.toLowerCase().includes(q) ||
          w.university.toLowerCase().includes(q) ||
          (w.bankName?.toLowerCase().includes(q) ?? false) ||
          (w.accountNumber?.toLowerCase().includes(q) ?? false) ||
          (w.binanceUid?.toLowerCase().includes(q) ?? false) ||
          (w.transactionReference?.toLowerCase().includes(q) ?? false) ||
          w.id.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === "amount-desc") return b.amountEtb - a.amountEtb;
      if (sortBy === "amount-asc") return a.amountEtb - b.amountEtb;
      if (sortBy === "oldest") return a.id.localeCompare(b.id);
      return b.id.localeCompare(a.id); // newest by default
    });
  }, [withdrawals, filter, methodFilter, bankFilter, search, sortBy]);

  // Selection helpers
  const allVisibleSelected =
    visible.length > 0 && visible.every((w) => selectedIds.has(w.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map((w) => w.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedList = useMemo(
    () => withdrawals.filter((w) => selectedIds.has(w.id)),
    [withdrawals, selectedIds],
  );

  const selectedTotalEtb = useMemo(
    () => selectedList.reduce((s, w) => s + w.amountEtb, 0),
    [selectedList],
  );

  // Copy helper
  const handleCopyAccountNumbers = () => {
    const listToCopy = selectedList.length > 0 ? selectedList : visible;
    const accountNumbers = listToCopy
      .map((w) =>
        w.method === "usdt"
          ? `${w.userName} (Binance: ${w.binanceUid})`
          : `${w.userName} (${w.bankName || "Bank"}: ${w.accountNumber})`,
      )
      .join("\n");

    if (!accountNumbers) {
      toast.error("No account numbers available to copy");
      return;
    }
    navigator.clipboard.writeText(accountNumbers);
    toast.success(`Copied ${listToCopy.length} recipient accounts to clipboard!`, {
      description: "Ready to paste into CBE Birr or online banking portal.",
    });
  };

  // Execution Handlers
  const handleOpenSinglePayout = (req: WithdrawalRequest) => {
    setPayoutTarget(req);
    setIsBulkPayoutOpen(false);
    setPayoutTxRef(generateDemoTxReference(req.method));
    setPayoutNotes(req.adminNote ?? "");
  };

  const handleOpenBulkPayout = () => {
    if (selectedIds.size === 0) return;
    setPayoutTarget(null);
    setIsBulkPayoutOpen(true);
    setPayoutTxRef(`BATCH-${new Date().toISOString().slice(0, 10)}-${Math.floor(100 + Math.random() * 900)}`);
    setPayoutNotes("");
  };

  const handleConfirmPayout = () => {
    if (isBulkPayoutOpen) {
      bulkMarkPaidWithdrawals(Array.from(selectedIds), payoutTxRef.trim());
      setSelectedIds(new Set());
      setIsBulkPayoutOpen(false);
    } else if (payoutTarget) {
      markPaid(payoutTarget.id, payoutTxRef.trim(), payoutNotes.trim() || undefined);
      setPayoutTarget(null);
    }
  };

  const handleOpenSingleReject = (req: WithdrawalRequest) => {
    setRejectTarget(req);
    setIsBulkRejectOpen(false);
    setRejectReason(PRESET_REJECTION_REASONS[0]);
  };

  const handleOpenBulkReject = () => {
    if (selectedIds.size === 0) return;
    setRejectTarget(null);
    setIsBulkRejectOpen(true);
    setRejectReason(PRESET_REJECTION_REASONS[0]);
  };

  const handleConfirmReject = () => {
    if (isBulkRejectOpen) {
      bulkRejectWithdrawals(Array.from(selectedIds), rejectReason.trim());
      setSelectedIds(new Set());
      setIsBulkRejectOpen(false);
    } else if (rejectTarget) {
      rejectWithdrawal(rejectTarget.id, rejectReason.trim());
      setRejectTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* ── Enterprise Financial Header & Quick Actions ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-white/10">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                <Coins className="size-3" />
                Ethiopian Student Cash-Out Engine
              </span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-xs text-white/70 font-mono">
                1 ETB = 8 XP · 1 USDT = 135 ETB
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Withdrawal & Treasury Management
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-white/60 max-w-2xl">
              Audit, approve, and disburse Ethiopian bank transfers and Binance USDT payouts to
              university students with transaction reference tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadWithdrawalsCsv(visible, "study2earn_withdrawals")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold h-9 rounded-xl backdrop-blur transition cursor-pointer"
            >
              <Download className="size-3.5 mr-1.5 text-emerald-400" />
              Export CSV Report ({visible.length})
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadBankBatchFile(visible)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold h-9 rounded-xl backdrop-blur transition cursor-pointer"
              title="Download standard CBE bulk batch file"
            >
              <FileSpreadsheet className="size-3.5 mr-1.5 text-blue-400" />
              CBE Batch Payroll
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setMethodsOpen(!methodsOpen)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold h-9 rounded-xl shadow-md transition cursor-pointer"
            >
              <Settings2 className="size-4 mr-1.5" />
              Gateway Settings
            </Button>
          </div>
        </div>
      </div>

      {/* ── Collapsible Payment Gateway & Bank Kill Switches ── */}
      {methodsOpen && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                <Settings2 className="size-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Payment Channels & Bank Acceptance Controls
                </p>
                <p className="text-[11px] text-slate-500">
                  Enable or suspend individual banks, student mobile wallets, and USDT crypto payouts.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMethodsOpen(false)}
              className="h-7 text-xs text-slate-400 hover:text-slate-700"
            >
              <X className="size-3.5 mr-1" /> Close Settings
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Master Bank Switch */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Ethiopian Bank Transfers (ETB)
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 font-bold",
                        withdrawalsEnabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200",
                      )}
                    >
                      {withdrawalsEnabled ? "ACTIVE" : "DISABLED"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {enabledBanks.length} of {ethiopianBanks.length} banks currently active for cash-out.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleWithdrawals}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                    withdrawalsEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700",
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

              {/* Master USDT Switch */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Binance Pay USDT Transfers
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 font-bold",
                        usdtWithdrawalsEnabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200",
                      )}
                    >
                      {usdtWithdrawalsEnabled ? "ACTIVE" : "DISABLED"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Allows student payouts directly to Binance UID accounts worldwide.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleUsdtWithdrawals}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                    usdtWithdrawalsEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700",
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

            {/* Individual Ethiopian Banks Selector */}
            {withdrawalsEnabled && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Individual Bank Availability ({enabledBanks.length}/{ethiopianBanks.length})
                  </p>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={enableAll}
                      className="text-indigo-600 hover:underline cursor-pointer font-medium"
                    >
                      Enable All
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={disableAll}
                      className="text-rose-500 hover:underline cursor-pointer font-medium"
                    >
                      Disable All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {ethiopianBanks.map((b) => {
                    const active = enabledBanks.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleBank(b.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-2 text-left transition text-xs cursor-pointer",
                          active
                            ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 text-slate-900 dark:text-white"
                            : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-400 opacity-60",
                        )}
                      >
                        <BankLogo bank={b} size="sm" />
                        <span className="truncate font-semibold text-[11px]">{b.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4 Fintech Liquidity & Treasury KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Pending Review",
            count: counts.pending,
            amount: `${totalPendingEtb.toLocaleString()} ETB`,
            sub: `${counts.pending} student requests waiting`,
            icon: Clock,
            bg: "bg-amber-50 dark:bg-amber-950/30",
            color: "text-amber-600 dark:text-amber-400",
            border: "border-l-4 border-l-amber-500",
            pulse: counts.pending > 0,
          },
          {
            label: "Approved (Ready for Payout)",
            count: counts.approved,
            amount: `${totalApprovedEtb.toLocaleString()} ETB`,
            sub: "Liquidity reserve required",
            icon: CheckCircle2,
            bg: "bg-blue-50 dark:bg-blue-950/30",
            color: "text-blue-600 dark:text-blue-400",
            border: "border-l-4 border-l-blue-500",
            pulse: false,
          },
          {
            label: "Disbursed to Date",
            count: counts.paid,
            amount: `${totalPaidEtb.toLocaleString()} ETB`,
            sub: `${counts.paid} completed payouts`,
            icon: Building2,
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            color: "text-emerald-600 dark:text-emerald-400",
            border: "border-l-4 border-l-emerald-500",
            pulse: false,
          },
          {
            label: "Total Platform Volume",
            count: counts.all,
            amount: `${totalAllEtb.toLocaleString()} ETB`,
            sub: `${withdrawals.length} all-time requests`,
            icon: Banknote,
            bg: "bg-indigo-50 dark:bg-indigo-950/30",
            color: "text-indigo-600 dark:text-indigo-400",
            border: "border-l-4 border-l-indigo-500",
            pulse: false,
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={cn(
                "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm",
                kpi.border,
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("flex size-9 items-center justify-center rounded-xl", kpi.bg, kpi.color)}>
                  <Icon className="size-4.5" />
                </div>
                {kpi.pulse && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                    Action Required
                  </span>
                )}
              </div>
              <p className="mt-3 font-serif text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {kpi.amount}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {kpi.label}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Liquidity & Payment Provider Allocation Gauge ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-brand-gold" />
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              Disbursement Channel & Provider Distribution
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Disbursed:{" "}
              <strong className="text-emerald-600 font-mono font-bold">
                {totalAllEtb > 0 ? Math.round((totalPaidEtb / totalAllEtb) * 100) : 0}%
              </strong>
            </span>
            <span>·</span>
            <span>
              Pending Liquidity:{" "}
              <strong className="text-amber-600 font-mono font-bold">
                {(totalPendingEtb + totalApprovedEtb).toLocaleString()} ETB
              </strong>
            </span>
          </div>
        </div>

        {/* Visual Multi-Segment Provider Bar */}
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div
            title={`CBE: ${providerStats.cbe.amount} ETB (${providerStats.cbe.pct}%)`}
            style={{ width: `${providerStats.cbe.pct}%` }}
            className="bg-purple-600 h-full transition-all"
          />
          <div
            title={`Awash: ${providerStats.awash.amount} ETB (${providerStats.awash.pct}%)`}
            style={{ width: `${providerStats.awash.pct}%` }}
            className="bg-blue-600 h-full transition-all"
          />
          <div
            title={`Dashen: ${providerStats.dashen.amount} ETB (${providerStats.dashen.pct}%)`}
            style={{ width: `${providerStats.dashen.pct}%` }}
            className="bg-navy-900 bg-slate-800 h-full transition-all"
          />
          <div
            title={`Binance USDT: ${providerStats.usdt.amount} ETB (${providerStats.usdt.pct}%)`}
            style={{ width: `${providerStats.usdt.pct}%` }}
            className="bg-amber-500 h-full transition-all"
          />
          <div
            title={`Other Ethiopian Banks: ${providerStats.other.amount} ETB (${providerStats.other.pct}%)`}
            style={{ width: `${providerStats.other.pct}%` }}
            className="bg-emerald-500 h-full transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-purple-600" /> Commercial Bank of Ethiopia (
            {providerStats.cbe.pct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-600" /> Awash Bank (
            {providerStats.awash.pct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-slate-800" /> Dashen Bank (
            {providerStats.dashen.pct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" /> Binance USDT (
            {providerStats.usdt.pct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" /> Other Banks (
            {providerStats.other.pct}%)
          </span>
        </div>
      </div>

      {/* ── Multi-Select Batch Operations Toolbar (Sticky when active) ── */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/95 dark:bg-indigo-950/90 backdrop-blur p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white font-bold text-xs px-2.5 py-1">
              {selectedIds.size} Selected
            </Badge>
            <p className="text-xs text-indigo-950 dark:text-indigo-200 font-semibold">
              Batch value: <strong className="font-mono text-sm">{selectedTotalEtb.toLocaleString()} ETB</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                bulkApproveWithdrawals(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}
              className="h-8 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="size-3.5 mr-1" />
              Approve ({selectedIds.size})
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleOpenBulkPayout}
              className="h-8 text-xs font-bold rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white cursor-pointer shadow-xs"
            >
              <Building2 className="size-3.5 mr-1" />
              Mark Paid ({selectedIds.size})
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleOpenBulkReject}
              className="h-8 text-xs font-bold rounded-lg border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
            >
              <XCircle className="size-3.5 mr-1" />
              Reject ({selectedIds.size})
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadWithdrawalsCsv(selectedList, "batch_selected")}
              className="h-8 text-xs rounded-lg border-indigo-200 bg-white/80 dark:bg-slate-800 cursor-pointer"
            >
              <Download className="size-3 mr-1" />
              Export
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-8 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Deselect
            </Button>
          </div>
        </div>
      )}

      {/* ── Filters, Search & Bulk Select Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                filter === f.key
                  ? f.activeClass
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300",
              )}
            >
              {f.key === "pending" && counts.pending > 0 && filter !== "pending" && (
                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  filter === f.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <Select
            value={methodFilter}
            onValueChange={(v) => setMethodFilter(v as "all" | "bank" | "usdt")}
          >
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Methods
              </SelectItem>
              <SelectItem value="bank" className="text-xs">
                Bank Transfer
              </SelectItem>
              <SelectItem value="usdt" className="text-xs">
                Binance USDT
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Bank Filter */}
          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue placeholder="Bank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Ethiopian Banks
              </SelectItem>
              {ethiopianBanks.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-xs">
                  {b.short}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs">
                Newest First
              </SelectItem>
              <SelectItem value="oldest" className="text-xs">
                Oldest First
              </SelectItem>
              <SelectItem value="amount-desc" className="text-xs">
                Highest Amount
              </SelectItem>
              <SelectItem value="amount-asc" className="text-xs">
                Lowest Amount
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search student, bank, account, ID…"
              className="pl-8 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Table Top Bar with Select All & Bulk Copy ── */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500">
        <div className="flex items-center gap-2.5">
          <Checkbox
            checked={allVisibleSelected}
            onCheckedChange={toggleSelectAll}
            id="select-all-withdrawals"
          />
          <Label
            htmlFor="select-all-withdrawals"
            className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Select All ({visible.length} visible)
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyAccountNumbers}
            className="h-7 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer font-medium"
          >
            <Copy className="size-3 mr-1" />
            Copy Recipient Accounts
          </Button>

          {pendingWithdrawals > 0 && (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-bold rounded-lg cursor-pointer"
              onClick={() => {
                const pendingIds = withdrawals
                  .filter((w) => w.status === "pending")
                  .map((w) => w.id);
                bulkApproveWithdrawals(pendingIds);
              }}
            >
              <CheckCircle2 className="size-3.5" />
              Approve All Pending ({pendingWithdrawals})
            </Button>
          )}
        </div>
      </div>

      {/* ── Requests List ── */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Banknote className="size-7" />
          </div>
          <p className="font-serif text-lg font-bold text-slate-900 dark:text-white">
            No withdrawal requests match criteria
          </p>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {search
              ? `No requests match "${search}". Try clearing search or filters.`
              : `There are currently no ${filter === "all" ? "" : filter} requests in the pipeline.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((req) => (
            <WithdrawalCard
              key={req.id}
              request={req}
              selected={selectedIds.has(req.id)}
              onToggleSelect={() => toggleSelectOne(req.id)}
              expanded={expandedId === req.id}
              onToggleExpand={() => setExpandedId(expandedId === req.id ? null : req.id)}
              onApprove={() => approveWithdrawal(req.id)}
              onOpenPayoutModal={() => handleOpenSinglePayout(req)}
              onOpenRejectModal={() => handleOpenSingleReject(req)}
            />
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-5 py-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{visible.length}</strong> of{" "}
            {withdrawals.length} total requests
          </span>
          <span>
            Filtered Total Volume:{" "}
            <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-sm">
              {visible.reduce((s, w) => s + w.amountEtb, 0).toLocaleString()} ETB
            </strong>
          </span>
        </div>
      )}

      {/* ── Payout Confirmation & Reference Modal ── */}
      <Dialog
        open={Boolean(payoutTarget) || isBulkPayoutOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPayoutTarget(null);
            setIsBulkPayoutOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <Building2 className="size-4" />
              </span>
              <DialogTitle className="text-base font-bold">
                {isBulkPayoutOpen ? "Batch Disbursement Confirmation" : "Confirm Settlement & Mark Paid"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              {isBulkPayoutOpen
                ? `Confirm payment of ${selectedIds.size} selected requests totalling ${selectedTotalEtb.toLocaleString()} ETB.`
                : `Confirm that funds have been transferred to ${payoutTarget?.userName} via ${payoutTarget?.method === "usdt" ? "Binance Pay" : payoutTarget?.bankName}.`}
            </DialogDescription>
          </DialogHeader>

          {payoutTarget && (
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student Recipient:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {payoutTarget.userName} ({payoutTarget.userId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account / Destination:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {payoutTarget.method === "usdt"
                    ? `Binance UID ${payoutTarget.binanceUid}`
                    : `${payoutTarget.bankName} · ${payoutTarget.accountNumber}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payout Amount:</span>
                <span className="font-serif font-bold text-emerald-600 text-sm">
                  {payoutTarget.method === "usdt"
                    ? `${payoutTarget.amountUsdt} USDT (${payoutTarget.amountEtb} ETB)`
                    : `${payoutTarget.amountEtb.toLocaleString()} ETB`}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Bank FT / Transaction Reference</Label>
                <button
                  type="button"
                  onClick={() =>
                    setPayoutTxRef(
                      generateDemoTxReference(payoutTarget?.method === "usdt" ? "usdt" : "bank"),
                    )
                  }
                  className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                >
                  ⚡ Auto-generate FT Ref
                </button>
              </div>
              <Input
                value={payoutTxRef}
                onChange={(e) => setPayoutTxRef(e.target.value)}
                placeholder="e.g. FT26145890 or Binance TxID"
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Payment Notes / Remarks (Optional)</Label>
              <Textarea
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder="Confirmed via Commercial Bank of Ethiopia internet banking..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPayoutTarget(null);
                setIsBulkPayoutOpen(false);
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmPayout}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              <Check className="size-3.5 mr-1" />
              Confirm Payment & Mark Disbursed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rejection Confirmation Modal ── */}
      <Dialog
        open={Boolean(rejectTarget) || isBulkRejectOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setIsBulkRejectOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex size-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                <XCircle className="size-4" />
              </span>
              <DialogTitle className="text-base font-bold">
                {isBulkRejectOpen ? "Reject Selected Requests" : "Reject Withdrawal Request"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Rejecting will automatically release and restore the reserved XP balance back to the
              student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <Label className="text-xs font-semibold">Reason for Rejection</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REJECTION_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRejectReason(r)}
                  className={cn(
                    "text-[10px] rounded-lg border px-2 py-1 transition cursor-pointer text-left",
                    rejectReason === r
                      ? "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="State clear reason for student..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectTarget(null);
                setIsBulkRejectOpen(false);
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmReject}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              Confirm Rejection & Restore XP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Individual Withdrawal Card Component ───────────────────────────────────

function WithdrawalCard({
  request,
  selected,
  onToggleSelect,
  expanded,
  onToggleExpand,
  onApprove,
  onOpenPayoutModal,
  onOpenRejectModal,
}: {
  request: WithdrawalRequest;
  selected: boolean;
  onToggleSelect: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onOpenPayoutModal: () => void;
  onOpenRejectModal: () => void;
}) {
  const bank = request.bankId ? getBankById(request.bankId) : undefined;
  const isUsdt = request.method === "usdt";
  const cfg = STATUS_CONFIG[request.status];
  const StatusIcon = cfg.icon;

  const initials = request.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`, { description: text });
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 hover:shadow-md border-l-4",
        cfg.row,
        selected && "ring-2 ring-indigo-500",
      )}
    >
      <div className={cn("h-0.5 w-full", cfg.stripe)} />

      <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        {/* Row Checkbox */}
        <div className="shrink-0 flex items-center pr-1">
          <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
        </div>

        {/* Student Profile Info */}
        <div className="flex items-center gap-3 min-w-[200px] flex-1">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-amber-500/10 font-bold text-slate-900 dark:text-white text-sm border border-slate-200/50">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">
                {request.userName}
              </p>
              <span title="Enrolled Student">
                <UserCheck className="size-3.5 text-emerald-500 shrink-0" />
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">{request.university}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[10px] text-slate-400">{request.id}</span>
              <button
                type="button"
                onClick={() => handleCopyText(request.id, "Request ID")}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Copy Request ID"
              >
                <Copy className="size-2.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Payment Destination (Bank or Binance) */}
        <div className="flex items-center gap-3 min-w-[200px] flex-1">
          {isUsdt ? <UsdtLogo size="sm" /> : bank && <BankLogo bank={bank} size="sm" />}
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {isUsdt ? "USDT via Binance Pay" : request.bankName}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {isUsdt ? "Binance Account" : request.accountName || request.userName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isUsdt ? request.binanceUid : request.accountNumber}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    (isUsdt ? request.binanceUid : request.accountNumber) ?? "",
                    isUsdt ? "Binance UID" : "Account Number",
                  )
                }
                className="text-indigo-600 hover:text-indigo-700 cursor-pointer"
                title="Copy account number"
              >
                <Copy className="size-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Amount & XP */}
        <div className="shrink-0 text-right min-w-[110px]">
          <p className="font-serif text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            {isUsdt ? request.amountUsdt : request.amountEtb.toLocaleString()}
            <span className="ml-1 text-xs font-normal text-slate-400">
              {isUsdt ? "USDT" : "ETB"}
            </span>
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            −{request.xpDeducted.toLocaleString()} XP
          </p>
        </div>

        {/* Status + Time */}
        <div className="shrink-0 text-right min-w-[130px]">
          <Badge variant="secondary" className={cn("text-xs gap-1 mb-1 font-semibold", cfg.badge)}>
            <StatusIcon className="size-3" />
            {cfg.label}
          </Badge>
          <p className="text-[10px] text-slate-400 leading-tight">{request.requestedAt}</p>
          {request.processedAt && (
            <p className="text-[10px] text-slate-400 mt-0.5">Disbursed: {request.processedAt}</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {request.status === "pending" && (
            <Button
              size="sm"
              onClick={onApprove}
              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="size-3.5 mr-1" /> Approve
            </Button>
          )}

          {request.status === "approved" && (
            <Button
              size="sm"
              onClick={onOpenPayoutModal}
              className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs cursor-pointer"
            >
              <Building2 className="size-3.5 mr-1" /> Mark Paid
            </Button>
          )}

          {(request.status === "pending" || request.status === "approved") && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenRejectModal}
              className="h-8 text-xs text-rose-600 hover:bg-rose-50 border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
            >
              Reject
            </Button>
          )}

          {request.status === "paid" && request.transactionReference && (
            <button
              type="button"
              onClick={() => handleCopyText(request.transactionReference!, "Transaction Ref")}
              className="flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-200 cursor-pointer"
              title="Click to copy FT transaction reference"
            >
              <span>Ref: {request.transactionReference}</span>
              <Copy className="size-2.5" />
            </button>
          )}

          {/* Details toggle */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            title="Expand Details"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Audit Details & Notes */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Student ID
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                {request.userId}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account Holder
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {request.accountName || request.userName}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Transaction Reference
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {request.transactionReference || "Pending Disbursement"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Processed Timestamp
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {request.processedAt || "—"}
              </p>
            </div>
          </div>

          {request.adminNote && (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Admin Audit Note
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300">{request.adminNote}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">
              Submitted: {request.requestedAt} · Verified University: {request.university}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopyText(
                    `${request.userName} - ${request.amountEtb} ETB to ${request.bankName || "Binance"} (${request.accountNumber || request.binanceUid})`,
                    "Full Transfer Info",
                  )
                }
                className="h-7 text-xs"
              >
                <Copy className="size-3 mr-1" /> Copy All Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
