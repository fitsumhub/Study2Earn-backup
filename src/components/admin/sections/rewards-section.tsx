import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Gift,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Trophy,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { useLeaderboardPrizes } from "@/hooks/use-leaderboard-prizes";
import { getBankById } from "@/lib/ethiopian-banks";
import { resolveMediaUrl } from "@/lib/media-store";
import {
  PRIZE_ICON_MAP,
  PRIZE_ICON_OPTIONS,
  PRIZE_TINT_MAP,
  PRIZE_TINT_OPTIONS,
} from "@/lib/leaderboard-prizes-store";
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
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
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
            </div>
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
          const photo = resolveMediaUrl(reward.imageUrl);

          return (
            <Card
              key={reward.id}
              className={cn(
                "shadow-sm overflow-hidden transition-all hover:shadow-md",
                !reward.active && "opacity-60",
              )}
            >
              {/* Photo (if uploaded) or gradient header strip */}
              <div
                className={cn(
                  "relative flex items-center justify-between px-4 py-3",
                  photo ? "h-24 bg-cover bg-center" : "bg-gradient-to-br",
                  !photo && tagMeta.gradient,
                )}
                style={photo ? { backgroundImage: `url(${photo})` } : undefined}
              >
                {photo && <div className="absolute inset-0 bg-black/30" />}
                <div className="relative flex size-8 items-center justify-center rounded-lg bg-white/20 text-white">
                  <TagIcon className="size-4" />
                </div>
                <div className="relative flex items-center gap-2">
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

      <LeaderboardPrizesCard />
    </div>
  );
}

function LeaderboardPrizesCard() {
  const { config, updateMeta, addPrize, updatePrize, removePrize, movePrize, resetToDefaults } =
    useLeaderboardPrizes();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="font-serif text-brand-navy flex items-center gap-2">
              <Trophy className="size-5 text-brand-gold" />
              Leaderboard grand prizes
            </CardTitle>
            <CardDescription>
              What Yearly leaderboard winners actually receive — shown on the public Leaderboard
              page's Yearly tab
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={resetToDefaults}>
            <RotateCcw className="size-3.5" />
            Reset to defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="prizes-tagline">Banner tagline</Label>
            <Input
              id="prizes-tagline"
              value={config.tagline}
              onChange={(e) => updateMeta({ tagline: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prizes-description">Banner description</Label>
            <Textarea
              id="prizes-description"
              value={config.description}
              onChange={(e) => updateMeta({ description: e.target.value })}
              rows={1}
            />
          </div>
        </div>

        <div className="space-y-3">
          {config.prizes.map((prize, index) => {
            const Icon = PRIZE_ICON_MAP[prize.icon];
            return (
              <div
                key={prize.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white",
                    PRIZE_TINT_MAP[prize.tint],
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <Input
                  value={prize.rankLabel}
                  onChange={(e) => updatePrize(prize.id, { rankLabel: e.target.value })}
                  className="w-24 shrink-0 font-mono text-xs"
                  placeholder="#1"
                />
                <Input
                  value={prize.title}
                  onChange={(e) => updatePrize(prize.id, { title: e.target.value })}
                  className="min-w-[10rem] flex-1"
                  placeholder="Prize name"
                />
                <Select
                  value={prize.icon}
                  onValueChange={(v) => updatePrize(prize.id, { icon: v as typeof prize.icon })}
                >
                  <SelectTrigger className="w-36 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIZE_ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="size-3.5" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex shrink-0 items-center gap-1">
                  {PRIZE_TINT_OPTIONS.map((tint) => (
                    <button
                      key={tint.value}
                      type="button"
                      title={tint.label}
                      onClick={() => updatePrize(prize.id, { tint: tint.value })}
                      className={cn(
                        "size-5 rounded-full bg-gradient-to-br transition",
                        tint.gradient,
                        prize.tint === tint.value
                          ? "ring-2 ring-offset-2 ring-brand-navy"
                          : "opacity-60 hover:opacity-100",
                      )}
                    />
                  ))}
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={index === 0}
                    onClick={() => movePrize(prize.id, "up")}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={index === config.prizes.length - 1}
                    onClick={() => movePrize(prize.id, "down")}
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:bg-destructive/10"
                    onClick={() => removePrize(prize.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="outline" className="gap-2" onClick={addPrize}>
          <Plus className="size-4" />
          Add prize tier
        </Button>
      </CardContent>
    </Card>
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
