import {
  AlertCircle,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Gift,
  Palette,
  Pencil,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import { withdrawalStatusStyles } from "@/components/admin/shared";
import { BankLogo } from "@/components/bank-logo";
import { UsdtLogo } from "@/components/usdt-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { getBankById } from "@/lib/ethiopian-banks";
import type { WithdrawalRequest } from "@/lib/withdrawal-data";
import { cn } from "@/lib/utils";

export function RewardsSection({ admin }: { admin: AdminDashboardState }) {
  const {
    rewards,
    withdrawals,
    pendingWithdrawals,
    toggleRewardActive,
    openQuickAction,
    approveWithdrawal,
    rejectWithdrawal,
    markPaid,
    openEdit,
    deleteReward,
  } = admin;
  const [withdrawalFilter, setWithdrawalFilter] = useState<"all" | "pending" | "approved">(
    "pending",
  );

  const activeCount = rewards.filter((r) => r.active).length;
  const totalWithdrawnEtb = withdrawals
    .filter((w) => w.status === "paid" || w.status === "approved")
    .reduce((sum, w) => sum + w.amountEtb, 0);

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (withdrawalFilter === "pending") return w.status === "pending";
    if (withdrawalFilter === "approved") return w.status === "approved";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Rewards",
            value: rewards.length,
            icon: Gift,
            bg: "bg-violet-50",
            color: "text-violet-600",
            border: "border-l-4 border-l-violet-400",
            sub: "in catalog",
          },
          {
            label: "Active",
            value: activeCount,
            icon: Check,
            bg: "bg-emerald-50",
            color: "text-emerald-600",
            border: "border-l-4 border-l-emerald-400",
            sub: `${rewards.length - activeCount} paused`,
          },
          {
            label: "Pending Withdrawals",
            value: pendingWithdrawals,
            icon: Clock,
            bg: "bg-amber-50",
            color: "text-amber-600",
            border: "border-l-4 border-l-amber-400",
            sub: "awaiting approval",
            pulse: pendingWithdrawals > 0,
          },
          {
            label: "ETB Disbursed",
            value: totalWithdrawnEtb.toLocaleString(),
            icon: Building2,
            bg: "bg-brand-gold/10",
            color: "text-brand-gold",
            border: "border-l-4 border-l-brand-gold",
            sub: "approved + paid",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={cn("shadow-sm bg-white", s.border)}>
              <CardContent className="p-5">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-brand-navy">Bank withdrawal requests</CardTitle>
              <CardDescription>
                Review and approve XP-to-ETB cash-out requests to Ethiopian banks
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(
                [
                  {
                    key: "pending",
                    label: `Pending`,
                    count: pendingWithdrawals,
                    activeClass: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
                  },
                  {
                    key: "approved",
                    label: "Approved",
                    count: null,
                    activeClass: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
                  },
                  {
                    key: "all",
                    label: "All",
                    count: null,
                    activeClass:
                      "bg-brand-navy hover:bg-brand-navy/90 text-white border-brand-navy",
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setWithdrawalFilter(f.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                    withdrawalFilter === f.key
                      ? f.activeClass
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  {f.key === "pending" && f.count > 0 && withdrawalFilter !== "pending" && (
                    <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  {f.label}
                  {f.count !== null && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        withdrawalFilter === "pending"
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredWithdrawals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No {withdrawalFilter === "all" ? "" : withdrawalFilter} withdrawal requests
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((req) => (
                  <WithdrawalRow
                    key={req.id}
                    request={req}
                    onApprove={() => approveWithdrawal(req.id)}
                    onReject={() => rejectWithdrawal(req.id)}
                    onMarkPaid={() => markPaid(req.id)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">
          {rewards.length} items in catalog · {activeCount} active
        </p>
        <Button
          className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
          onClick={() => openQuickAction("createReward")}
        >
          <Gift className="size-4" />
          Create reward
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => {
          const tagLower = reward.tag.toLowerCase();
          const tagMeta = {
            etb: {
              icon: Banknote,
              gradient: "from-emerald-600 to-emerald-500",
              badge: "bg-emerald-50 text-emerald-700",
            },
            usdt: {
              icon: CircleDollarSign,
              gradient: "from-[#26A17B] to-emerald-400",
              badge: "bg-emerald-50 text-emerald-700",
            },
            theme: {
              icon: Palette,
              gradient: "from-violet-600 to-violet-500",
              badge: "bg-violet-50 text-violet-700",
            },
            adfree: {
              icon: ShieldCheck,
              gradient: "from-sky-600 to-sky-500",
              badge: "bg-sky-50 text-sky-700",
            },
          }[tagLower] ?? {
            icon: Gift,
            gradient: "from-slate-600 to-slate-500",
            badge: "bg-slate-100 text-slate-600",
          };
          const TagIcon = tagMeta.icon;

          return (
            <Card
              key={reward.id}
              className={cn(
                "shadow-sm overflow-hidden transition-all hover:shadow-md",
                !reward.active && "opacity-60",
              )}
            >
              {/* Gradient header strip */}
              <div
                className={cn(
                  "flex items-center justify-between bg-gradient-to-br px-4 py-3",
                  tagMeta.gradient,
                )}
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/20 text-white">
                  <TagIcon className="size-4" />
                </div>
                <div className="flex items-center gap-2">
                  {reward.active ? (
                    <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                      <CheckCircle2 className="size-3" /> Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold text-white/70">
                      Paused
                    </span>
                  )}
                </div>
              </div>

              <CardHeader className="pb-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="text-left text-sm font-bold text-brand-navy hover:underline leading-snug"
                    onClick={() => openEdit({ type: "reward", item: reward })}
                  >
                    {reward.title}
                  </button>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      tagMeta.badge,
                    )}
                  >
                    {reward.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold">
                  {reward.xp.toLocaleString()} XP required
                </p>
              </CardHeader>

              <CardContent className="flex gap-2 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => openEdit({ type: "reward", item: reward })}
                >
                  <Pencil className="size-3" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-red-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => deleteReward(reward.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  className={cn(
                    "flex-1 text-xs",
                    reward.active
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700",
                  )}
                  onClick={() => toggleRewardActive(reward.id)}
                >
                  {reward.active ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const withdrawalRowStyles: Record<WithdrawalRequest["status"], string> = {
  pending: "bg-amber-50/40 hover:bg-amber-50/60",
  approved: "bg-blue-50/30 hover:bg-blue-50/50",
  rejected: "bg-red-50/20 hover:bg-red-50/40",
  paid: "hover:bg-slate-50/60",
};

const withdrawalStatusRich: Record<WithdrawalRequest["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-100",
  approved: "bg-blue-50 text-blue-700 border border-blue-200",
  rejected: "bg-red-50 text-red-600 border border-red-100",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

function WithdrawalRow({
  request,
  onApprove,
  onReject,
  onMarkPaid,
}: {
  request: WithdrawalRequest;
  onApprove: () => void;
  onReject: () => void;
  onMarkPaid: () => void;
}) {
  const bank = request.bankId ? getBankById(request.bankId) : undefined;
  const isUsdt = request.method === "usdt";

  return (
    <TableRow className={cn("transition-colors", withdrawalRowStyles[request.status])}>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-navy/10 text-xs font-bold text-brand-navy">
            {request.userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-brand-navy text-sm">{request.userName}</p>
            <p className="text-[10px] text-slate-400">{request.university}</p>
            <p className="text-[10px] text-slate-400">{request.requestedAt}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {isUsdt ? <UsdtLogo size="sm" /> : bank && <BankLogo bank={bank} size="sm" />}
          <div>
            <p className="text-sm font-medium text-brand-navy">
              {isUsdt ? "USDT via Binance" : request.bankName}
            </p>
            <p className="text-xs text-slate-400">{isUsdt ? "Binance UID" : request.accountName}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs text-slate-600">
        {isUsdt ? request.binanceUid : request.accountNumber}
      </TableCell>
      <TableCell>
        <p className="font-bold text-brand-navy">
          {isUsdt ? `${request.amountUsdt} USDT` : `${request.amountEtb} ETB`}
        </p>
        <p className="text-xs text-slate-400">-{request.xpDeducted.toLocaleString()} XP</p>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={withdrawalStatusRich[request.status]}>
          {request.status === "paid" && <CheckCircle2 className="size-3 mr-1" />}
          {request.status === "pending" && <AlertCircle className="size-3 mr-1" />}
          {request.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {request.status === "pending" && (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-3"
              onClick={onApprove}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:border-red-200 h-7 text-xs px-3"
              onClick={onReject}
            >
              Reject
            </Button>
          </div>
        )}
        {request.status === "approved" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-3 text-blue-600 hover:bg-blue-50"
            onClick={onMarkPaid}
          >
            Mark paid
          </Button>
        )}
        {(request.status === "paid" || request.status === "rejected") && (
          <span className="text-[10px] text-slate-400">{request.processedAt ?? "—"}</span>
        )}
      </TableCell>
    </TableRow>
  );
}
