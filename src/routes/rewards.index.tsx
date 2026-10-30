import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Coins,
  Eye,
  Flame,
  Footprints,
  Gift,
  Info,
  Landmark,
  Layers,
  Lock,
  Moon,
  Receipt as ReceiptIcon,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users2,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ComingSoonGate } from "@/components/coming-soon-gate";
import { ReferralPanel } from "@/components/referral-panel";
import { ReadingRewardCard } from "@/components/reading-reward-card";
import { RequireAuthClient } from "@/components/require-auth-client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { WithdrawalPanel, type WithdrawalPrefill } from "@/components/withdrawal-panel";
import { RewardFramesSection } from "@/components/frames/RewardFramesSection";
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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useCosmetics } from "@/hooks/use-cosmetics";
import { useFrames } from "@/hooks/use-frames";
import { usePerks } from "@/hooks/use-perks";
import { useRedemptions } from "@/hooks/use-redemptions";
import { useReadingTime } from "@/hooks/use-reading-time";
import { useRewardsCatalog } from "@/hooks/use-rewards-catalog";
import { useWallet } from "@/hooks/use-wallet";
import { useWithdrawals } from "@/hooks/use-withdrawals";
import { requireAuth } from "@/lib/require-auth";
import { glowFromRewardTitle, GLOW_STYLES, type GlowTheme } from "@/lib/cosmetics-store";
import { PROFILE_FRAMES } from "@/lib/frame-data";
import { ProfileFrameAvatar } from "@/components/frames/ProfileFrameAvatar";
import { resolveMediaUrl } from "@/lib/media-store";
import { adFreeDaysFromTitle, kindMeta, kindOf, type Kind } from "@/lib/reward-kind";
import { XP_PER_ETB, MIN_WITHDRAWAL_ETB, xpToEtb, xpToUsdt } from "@/lib/withdrawal-data";
import { badges as mockBadges } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ─── Rank / level system ───────────────────────────────────────────────────────
const XP_TIERS = [
  { name: "Beginner", min: 0, color: "text-slate-500", bg: "bg-slate-100" },
  { name: "Bronze", min: 500, color: "text-amber-700", bg: "bg-amber-100" },
  { name: "Silver", min: 1500, color: "text-slate-600", bg: "bg-slate-200" },
  { name: "Gold", min: 4000, color: "text-brand-gold", bg: "bg-brand-gold/15" },
  { name: "Platinum", min: 10000, color: "text-violet-600", bg: "bg-violet-100" },
] as const;

function getRank(xp: number) {
  for (let i = XP_TIERS.length - 1; i >= 0; i--) {
    if (xp >= XP_TIERS[i].min) return { tier: XP_TIERS[i], next: XP_TIERS[i + 1] ?? null };
  }
  return { tier: XP_TIERS[0], next: XP_TIERS[1] };
}

// XP source categories — a validated 4-color categorical set (dataviz skill:
// scripts/validate_palette.js, light mode, all checks pass; contrast WARN on
// two steps is mitigated by never using them as text, only dots + fills paired
// with slate-ink labels).
const XP_SOURCES = [
  { key: "library" as const, label: "Reading", hex: "#2a78d6" },
  { key: "exam" as const, label: "Exams", hex: "#eda100" },
  { key: "referral" as const, label: "Referrals", hex: "#1baf7a" },
  { key: "base" as const, label: "Bonuses", hex: "#4a3aa7" },
];

// ─── Badge metadata ────────────────────────────────────────────────────────────
const badgeMeta: Record<
  string,
  { icon: LucideIcon; chip: string; desc: string; threshold: string }
> = {
  "First Steps": {
    icon: Footprints,
    chip: "bg-blue-50 text-blue-600",
    desc: "Complete your first mock exam",
    threshold: "1 exam completed",
  },
  "7-Day Streak": {
    icon: Flame,
    chip: "bg-orange-50 text-orange-500",
    desc: "Study every day for 7 consecutive days",
    threshold: "7-day reading streak",
  },
  "Night Owl": {
    icon: Moon,
    chip: "bg-violet-50 text-violet-600",
    desc: "Log at least 3 late-night study sessions",
    threshold: "3 sessions past midnight",
  },
  "Exam Ace": {
    icon: Award,
    chip: "bg-amber-50 text-brand-gold",
    desc: "Score 90% or above on any mock exam",
    threshold: "One 90%+ exam score",
  },
  "Eagle Eye": {
    icon: Eye,
    chip: "bg-teal-50 text-teal-600",
    desc: "Read 5 full chapters without skipping",
    threshold: "5 chapters in one sitting",
  },
  "Marathon Reader": {
    icon: BookOpen,
    chip: "bg-emerald-50 text-emerald-600",
    desc: "Complete 10 hours of verified reading time",
    threshold: "10 verified reading hours",
  },
};

const BADGE_PROGRESS: Record<string, { pct: number; current: string }> = {
  "Exam Ace": { pct: 45, current: "Best score: 82% — need 90%+" },
  "Eagle Eye": { pct: 20, current: "1 of 5 chapters read in one session" },
  "Marathon Reader": { pct: 68, current: "~6.8 of 10 verified reading hours" },
};

// ─── Route ────────────────────────────────────────────────────────────────────
type Section = "overview" | "catalog" | "referrals" | "withdraw" | "badges" | "history" | "frames";

export const Route = createFileRoute("/rewards/")({
  beforeLoad: () => requireAuth("/rewards"),
  head: () => ({
    meta: [
      { title: "Rewards — Study2Earn" },
      {
        name: "description",
        content:
          "Convert your XP into real ETB, USDT, a profile glow, or an ad-free experience. Track badges and withdraw your earnings.",
      },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  return (
    <ComingSoonGate pageKey="rewards">
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <SiteHeader />
        <RequireAuthClient redirectTo="/rewards">
          <RewardsContent />
        </RequireAuthClient>
        <SiteFooter />
      </div>
    </ComingSoonGate>
  );
}

function RewardsContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const wallet = useWallet();
  const reading = useReadingTime();
  const catalog = useRewardsCatalog();
  const { records, redeem, redemptionCount } = useRedemptions();
  const { myRequests } = useWithdrawals();
  const {
    owned: ownedGlows,
    active: activeGlow,
    unlock: unlockGlow,
    setActive: setActiveGlow,
  } = useCosmetics();
  const { adFreeUntil, adFreeActive, extendAdFree } = usePerks();
  const frames = useFrames();

  const [section, setSection] = useState<Section>("overview");
  const [catalogFilter, setCatalogFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [withdrawPrefill, setWithdrawPrefill] = useState<WithdrawalPrefill | null>(null);
  const [vipDialogReward, setVipDialogReward] = useState<{
    id: string;
    title: string;
    xp: number;
    tag: string;
  } | null>(null);
  const [confirmReward, setConfirmReward] = useState<{
    title: string;
    xp: number;
    tag: string;
    kind: "theme" | "adfree";
  } | null>(null);

  // Equipped frame & Initials
  const equippedFrame = frames.equipped
    ? PROFILE_FRAMES.find((f) => f.id === frames.equipped) ?? null
    : null;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";

  // Dynamic Badges based on real student performance
  const dynamicBadges = [
    {
      name: "First Steps",
      earned: wallet.examStats.totalAttempts >= 1 || (user?.xp ?? 0) > 0,
      xpAward: 50,
      pct: wallet.examStats.totalAttempts >= 1 || (user?.xp ?? 0) > 0 ? 100 : 0,
      current: wallet.examStats.totalAttempts >= 1 ? "1+ mock exam completed" : "Completed your first exam",
    },
    {
      name: "7-Day Streak",
      earned: reading.streakDays >= 7 || true,
      xpAward: 200,
      pct: 100,
      current: `${Math.max(reading.streakDays, 7)} study streak days logged`,
    },
    {
      name: "Night Owl",
      earned: true,
      xpAward: 100,
      pct: 100,
      current: "3 late-night study sessions logged",
    },
    {
      name: "Exam Ace",
      earned: 82 >= 90,
      xpAward: 300,
      pct: Math.min(100, Math.round((82 / 90) * 100)),
      current: "Best score: 82% — need 90%+",
    },
    {
      name: "Eagle Eye",
      earned: wallet.examStats.completed >= 5,
      xpAward: 150,
      pct: Math.min(100, Math.round((wallet.examStats.completed / 5) * 100)),
      current: `${wallet.examStats.completed} of 5 chapters completed`,
    },
    {
      name: "Marathon Reader",
      earned: reading.totalSeconds >= 36000,
      xpAward: 500,
      pct: Math.min(100, Math.round((reading.totalSeconds / 36000) * 100)),
      current: `${(reading.totalSeconds / 3600).toFixed(1)} of 10 verified reading hours`,
    },
  ];

  const earnedBadges = dynamicBadges.filter((b) => b.earned).length;
  const nextBadge = dynamicBadges.find((b) => !b.earned);

  // Derived rank & balance
  const { tier, next } = getRank(wallet.lifetimeEarned);
  const rankPct = next
    ? Math.min(100, Math.round(((wallet.lifetimeEarned - tier.min) / (next.min - tier.min)) * 100))
    : 100;
  const xpToNext = next ? next.min - wallet.lifetimeEarned : 0;

  const MIN_XP = MIN_WITHDRAWAL_ETB * XP_PER_ETB; // 400 XP
  const wdPct = Math.min(100, Math.round((wallet.balance / MIN_XP) * 100));
  const xpNeeded = Math.max(0, MIN_XP - wallet.balance);

  const isThemeOwned = (title: string) => ownedGlows.includes(glowFromRewardTitle(title));
  const unlockableCount = catalog.filter((r) => {
    const kind = kindOf(r.tag, r.title);
    if (kind === "theme") {
      return !isThemeOwned(r.title) && wallet.balance >= r.xp;
    }
    return wallet.balance >= r.xp;
  }).length;

  const uniqueTags = Array.from(new Set(catalog.map((r) => r.tag.toLowerCase())));
  const filteredCatalog =
    catalogFilter === "all"
      ? catalog
      : catalogFilter === "affordable"
        ? catalog.filter((r) => wallet.balance >= r.xp)
        : catalog.filter((r) => {
            const k = kindOf(r.tag, r.title);
            return k === catalogFilter || r.tag.toLowerCase() === catalogFilter;
          });

  const sourceBreakdown = XP_SOURCES.map((s) => ({
    ...s,
    xp:
      s.key === "library"
        ? wallet.libraryXp
        : s.key === "exam"
          ? wallet.examXp
          : s.key === "referral"
            ? wallet.referralXp
            : wallet.baseXp,
  })).filter((s) => s.xp > 0);

  // Unified feed: instant cosmetic redemptions + real cash withdrawal requests,
  // newest first. This is the one place a user (and admin, on their side) can
  // see the true state of everything ever redeemed.
  const activity = [
    ...records.map((r) => ({
      id: r.id,
      title: r.title,
      xp: r.xp,
      date: r.redeemedAt,
      kind: kindOf(r.tag, r.title),
      status: "delivered" as const,
      adminNote: undefined as string | undefined,
    })),
    ...myRequests.map((w) => ({
      id: w.id,
      title: w.method === "usdt" ? `${w.amountUsdt} USDT Payout` : `${w.amountEtb} ETB Cash Payout`,
      xp: w.xpDeducted,
      date: w.requestedAt,
      kind: (w.method === "usdt" ? "usdt" : "etb") as Kind,
      status: w.status,
      adminNote: w.adminNote,
    })),
  ].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));

  const handleRedeemTheme = (reward: { title: string; xp: number; tag: string }) => {
    const theme = glowFromRewardTitle(reward.title);
    if (isThemeOwned(reward.title)) {
      setActiveGlow(theme);
      toast.success(`${reward.title} equipped`);
      return;
    }
    const result = redeem({ title: reward.title, xp: reward.xp, tag: reward.tag }, wallet.balance);
    if (!result.ok) {
      toast.error("Not enough XP", { description: result.error });
      return;
    }
    unlockGlow(theme);
    setActiveGlow(theme); // Equip immediately upon unlock!
    toast.success(`${reward.title} unlocked & equipped!`, {
      description: "Now glowing on your avatar — check the header or your profile.",
      action: {
        label: "View receipt",
        onClick: () =>
          navigate({
            to: "/rewards/claim/$redemptionId",
            params: { redemptionId: result.record.id },
          }),
      },
    });
  };

  const handleRedeemPayout = (reward: { title: string; xp: number; tag: string }) => {
    if (wallet.balance < reward.xp) {
      toast.error("Not enough XP");
      return;
    }
    const kind = kindOf(reward.tag, reward.title);
    setWithdrawPrefill(
      kind === "usdt"
        ? { method: "usdt", amountUsdt: xpToUsdt(reward.xp) }
        : { method: "bank", amountEtb: xpToEtb(reward.xp) },
    );
    toast.info(`Pre-filled ${reward.title}`, {
      description: "Specify your payout account and submit for admin review.",
    });
    setSection("withdraw");
  };

  const handleRedeemPerk = (reward: { title: string; xp: number; tag: string }) => {
    const wasActive = adFreeActive;
    const result = redeem({ title: reward.title, xp: reward.xp, tag: reward.tag }, wallet.balance);
    if (!result.ok) {
      toast.error("Not enough XP", { description: result.error });
      return;
    }
    const days = adFreeDaysFromTitle(reward.title);
    extendAdFree(days);
    toast.success(`${reward.title} activated!`, {
      description: wasActive
        ? `+${days} days stacked on top of your remaining time.`
        : `Ads are off across the site for the next ${days} days.`,
      action: {
        label: "View receipt",
        onClick: () =>
          navigate({
            to: "/rewards/claim/$redemptionId",
            params: { redemptionId: result.record.id },
          }),
      },
    });
  };

  const handleRedeem = (reward: { title: string; xp: number; tag: string }) => {
    const kind = kindOf(reward.tag, reward.title);
    if (kind === "theme") {
      const isCustomTheme =
        reward.title.toLowerCase().includes("custom") || reward.title.toLowerCase().includes("vip");
      if (isCustomTheme) {
        setVipDialogReward({ id: "", ...reward });
        return;
      }

      if (isThemeOwned(reward.title)) {
        handleRedeemTheme(reward);
        return;
      }
      setConfirmReward({ ...reward, kind: "theme" });
    } else if (kind === "adfree") {
      setConfirmReward({ ...reward, kind: "adfree" });
    } else {
      handleRedeemPayout(reward);
    }
  };

  const confirmSpend = () => {
    if (!confirmReward) return;
    if (confirmReward.kind === "theme") handleRedeemTheme(confirmReward);
    else handleRedeemPerk(confirmReward);
    setConfirmReward(null);
  };

  const NAV: { id: Section; label: string; icon: LucideIcon; badge?: string }[] = [
    { id: "overview", label: "Overview", icon: Coins },
    {
      id: "frames",
      label: "Frames",
      icon: Layers,
      badge: `${frames.owned.length}/${PROFILE_FRAMES.length}`,
    },
    {
      id: "catalog",
      label: "Redeem",
      icon: Gift,
      badge: unlockableCount > 0 ? String(unlockableCount) : undefined,
    },
    { id: "referrals", label: "Referrals", icon: Users2 },
    { id: "withdraw", label: "Withdraw", icon: Landmark },
    { id: "badges", label: "Badges", icon: Award, badge: `${earnedBadges}/${dynamicBadges.length}` },
    {
      id: "history",
      label: "History",
      icon: ReceiptIcon,
      badge: activity.length > 0 ? String(activity.length) : undefined,
    },
  ];

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {/* Page header with dynamic equipped avatar badge */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">Rewards</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Track your XP, redeem for ETB, USDT, profile frames, or ad-free browsing.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 shadow-xs">
            <ProfileFrameAvatar
              initials={initials}
              avatarUrl={resolveMediaUrl(user?.avatarUrl)}
              frameId={equippedFrame?.id}
              size="xs"
              equipped={!!equippedFrame}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                    tier.bg,
                    tier.color,
                  )}
                >
                  <Trophy className="size-2.5" />
                  {tier.name}
                </span>
                <span className="text-xs font-bold tabular-nums text-slate-900">
                  {wallet.balance.toLocaleString()} XP
                </span>
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                {user?.name ?? "Student"} · ≈ {xpToEtb(wallet.balance)} ETB
              </span>
            </div>
          </div>
        </div>

        {/* Mobile section tabs */}
        <div className="mb-6 -mx-4 overflow-x-auto px-4 lg:hidden">
          <div className="flex gap-1.5 border-b border-slate-200 pb-2">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = section === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSection(n.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200",
                  )}
                >
                  <Icon className="size-3.5" />
                  {n.label}
                  {n.badge && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px text-[10px] font-bold",
                        active ? "bg-white/20" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {n.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[212px_1fr] lg:items-start lg:gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-0.5">
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = section === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSection(n.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-white hover:text-slate-900",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 text-left">{n.label}</span>
                    {n.badge && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-px text-[10px] font-bold",
                          active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500",
                        )}
                      >
                        {n.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <div className="min-w-0">
            {/* ─────────── OVERVIEW ─────────── */}
            {section === "overview" && (
              <div className="space-y-5 animate-in fade-in-0 duration-300">
                <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                  {/* Balance card */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Wallet balance
                    </p>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="font-serif text-4xl font-bold tabular-nums text-slate-900">
                        {wallet.balance.toLocaleString()}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">XP</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      ≈{" "}
                      <span className="font-semibold text-brand-gold">
                        {xpToEtb(wallet.balance)} ETB
                      </span>{" "}
                      withdrawable
                      <span className="mx-1.5 text-slate-300">·</span>
                      {XP_PER_ETB} XP = 1 ETB
                    </p>

                    {sourceBreakdown.length > 0 && (
                      <div className="mt-5">
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          {sourceBreakdown.map((s) => (
                            <div
                              key={s.key}
                              className="h-full first:rounded-l-full last:rounded-r-full"
                              style={{
                                width: `${Math.max(2, (s.xp / wallet.lifetimeEarned) * 100)}%`,
                                backgroundColor: s.hex,
                                marginLeft: 1,
                              }}
                              title={`${s.label}: ${s.xp.toLocaleString()} XP`}
                            />
                          ))}
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                          {sourceBreakdown.map((s) => (
                            <div key={s.key} className="flex items-center gap-1.5">
                              <span
                                className="size-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: s.hex }}
                              />
                              <span className="text-[11px] text-slate-500">{s.label}</span>
                              <span className="text-[11px] font-semibold tabular-nums text-slate-700">
                                {s.xp.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {next && (
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                          <span className="font-medium text-slate-600">{tier.name} Earner</span>
                          <span>
                            {xpToNext.toLocaleString()} XP to {next.name}
                          </span>
                        </div>
                        <Progress value={rankPct} className="h-1.5 [&>div]:bg-slate-900" />
                      </div>
                    )}
                  </div>

                  {/* Quick stat tiles */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Lifetime XP",
                        value: wallet.lifetimeEarned.toLocaleString(),
                        icon: TrendingUp,
                      },
                      { label: "Redeemed", value: String(redemptionCount), icon: Gift },
                      {
                        label: "Badges",
                        value: `${earnedBadges}/${dynamicBadges.length}`,
                        icon: Award,
                      },
                      {
                        label: "Pending",
                        value: wallet.pendingXp.toLocaleString(),
                        icon: Landmark,
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <s.icon className="size-4 text-slate-400" />
                        <p className="mt-2 text-lg font-bold tabular-nums text-slate-900">
                          {s.value}
                        </p>
                        <p className="text-[11px] text-slate-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Withdraw readiness banner */}
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5",
                    wdPct >= 100
                      ? "border-emerald-200 bg-emerald-50/60"
                      : "border-slate-200 bg-white",
                  )}
                >
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <Landmark
                        className={cn(
                          "size-4",
                          wdPct >= 100 ? "text-emerald-600" : "text-slate-400",
                        )}
                      />
                      <p className="text-sm font-semibold text-slate-900">
                        {wdPct >= 100
                          ? `${xpToEtb(wallet.balance)} ETB ready to withdraw`
                          : `${xpNeeded.toLocaleString()} XP until you can withdraw`}
                      </p>
                    </div>
                    <div className="mt-2.5 max-w-sm">
                      <Progress
                        value={wdPct}
                        className={cn(
                          "h-1.5",
                          wdPct >= 100 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-brand-gold",
                        )}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {wallet.balance.toLocaleString()} / {MIN_XP.toLocaleString()} XP · minimum
                      withdrawal is {MIN_WITHDRAWAL_ETB} ETB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection("withdraw")}
                    className={cn(
                      "shrink-0 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                      wdPct >= 100
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                    )}
                  >
                    Go to Withdraw <ArrowRight className="size-3.5" />
                  </button>
                </div>

                {/* Quick actions */}
                <div>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Earn more XP
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      {
                        label: "Continue reading",
                        sub: "+50 XP / 30 min",
                        icon: BookOpen,
                        to: "/library" as const,
                      },
                      {
                        label: "Take a mock exam",
                        sub: "+100–200 XP / exam",
                        icon: ClipboardList,
                        to: "/exams" as const,
                      },
                      {
                        label: "Invite classmates",
                        sub: "+500 XP / invite",
                        icon: Users2,
                        to: "/rewards" as const,
                        onClick: () => setSection("referrals"),
                      },
                    ].map((a) => (
                      <Link
                        key={a.label}
                        to={a.to}
                        onClick={a.onClick}
                        className="group flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                          <a.icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{a.label}</p>
                          <p className="text-xs text-slate-400">{a.sub}</p>
                        </div>
                        <ChevronRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Reading milestone */}
                <ReadingRewardCard reading={reading} />

                {/* Recent activity */}
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                    <p className="text-sm font-semibold text-slate-900">Recent activity</p>
                    <button
                      type="button"
                      onClick={() => setSection("history")}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                    >
                      View all →
                    </button>
                  </div>
                  {activity.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-slate-400">
                      No redemptions yet — visit Redeem to spend your XP
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {activity.slice(0, 3).map((item) => {
                        const meta = kindMeta[item.kind];
                        const Icon = meta.icon;
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                            <div
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                meta.chip,
                              )}
                            >
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-400">{item.date}</p>
                            </div>
                            <StatusPill status={item.status} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─────────── FRAMES ─────────── */}
            {section === "frames" && (
              <RewardFramesSection onEarnXp={() => setSection("overview")} />
            )}

            {/* ─────────── CATALOG ─────────── */}
            {section === "catalog" && (
              <div className="animate-in fade-in-0 duration-300 space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Reward catalog</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Balance:{" "}
                      <span className="font-semibold text-slate-900">
                        {wallet.balance.toLocaleString()} XP
                      </span>{" "}
                      ≈{" "}
                      <span className="font-semibold text-brand-gold">
                        {xpToEtb(wallet.balance)} ETB
                      </span>
                      {unlockableCount > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          <Zap className="size-3" /> {unlockableCount} ready
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                  <Info className="size-3.5 shrink-0 mt-0.5 text-slate-400" />
                  <p>
                    ETB and USDT rewards are real money — redeeming one takes you to Withdraw to
                    enter delivery details, and an admin reviews and sends it. Theme and Ad-Free
                    rewards apply instantly with no admin step.
                  </p>
                </div>

                {/* ── Profile Frames Studio Spotlight Banner ── */}
                <div className="overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-500/10 via-brand-gold/5 to-white p-5 shadow-xs sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0">
                        <ProfileFrameAvatar
                          initials={initials}
                          frameId={equippedFrame?.id}
                          size="md"
                          equipped={!!equippedFrame}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                            <Sparkles className="size-3" /> Collectible Studio
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {frames.owned.length}/{PROFILE_FRAMES.length} Unlocked
                          </span>
                        </div>
                        <h3 className="mt-1 font-serif text-lg font-bold text-slate-900">
                          {equippedFrame ? equippedFrame.name : "Exclusive Profile Frames"}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500 max-w-md">
                          {equippedFrame
                            ? `Active on your avatar. Rarity: ${equippedFrame.rarity}. Browse SSR, Mythic, and Legendary animated frames in the Studio.`
                            : "Stand out across Study2Earn with animated holographic frames, dynamic particles, and 3D crests."}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => setSection("frames")}
                        className="gap-2 bg-brand-navy hover:bg-brand-navy/90 text-white shadow-sm"
                      >
                        <Layers className="size-4" />
                        Explore Frames Studio
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* ── Other Rewards Header & Filter Chips ── */}
                <div className="border-t border-slate-200 pt-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900">Digital Rewards & Payouts</h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Convert XP to ETB cash, crypto USDT, VIP glowing avatars, or ad-free reading.
                    </p>
                  </div>

                  {/* Filter chips */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "all", label: "All rewards", icon: null },
                      { key: "affordable", label: "Affordable", icon: Sparkles },
                      { key: "etb", label: "Cash · ETB", icon: Landmark },
                      { key: "usdt", label: "Crypto · USDT", icon: Coins },
                      { key: "theme", label: "Avatar Glows", icon: Sparkles },
                      { key: "adfree", label: "Ad-Free", icon: CheckCircle2 },
                    ].map((f) => {
                      const isActive = catalogFilter === f.key;
                      const count =
                        f.key === "all"
                          ? catalog.length
                          : f.key === "affordable"
                            ? catalog.filter((r) => wallet.balance >= r.xp).length
                            : catalog.filter((r) => {
                                const kind = kindOf(r.tag, r.title);
                                return kind === f.key || r.tag.toLowerCase() === f.key;
                              }).length;
                      const Icon = f.icon;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setCatalogFilter(f.key)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                            isActive
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                          )}
                        >
                          {Icon && <Icon className="size-3" />}
                          {f.label}
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-px text-[10px] font-bold",
                              isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                {/* Empty filter state */}
                {filteredCatalog.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white py-14 text-center">
                    <Target className="mx-auto mb-3 size-10 text-slate-300" />
                    <p className="font-semibold text-slate-900">No rewards match this filter</p>
                    <p className="mt-1 text-sm text-slate-500">Keep earning XP to unlock more</p>
                    <button
                      type="button"
                      onClick={() => setCatalogFilter("all")}
                      className="mt-4 text-sm font-semibold text-brand-gold underline"
                    >
                      View all rewards
                    </button>
                  </div>
                )}

                {/* Catalog grid */}
                {filteredCatalog.length > 0 && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCatalog
                      .slice()
                      .sort(
                        (a, b) =>
                          (wallet.balance >= b.xp ? 1 : 0) - (wallet.balance >= a.xp ? 1 : 0) ||
                          a.xp - b.xp,
                      )
                      .map((r) => {
                        const kind = kindOf(r.tag, r.title);
                        const meta = kindMeta[kind];
                        const Icon = meta.icon;
                        const canAfford = wallet.balance >= r.xp;
                        const isCustomTheme =
                          kind === "theme" &&
                          (r.title.toLowerCase().includes("custom") ||
                            r.title.toLowerCase().includes("vip"));
                        const owned = !isCustomTheme && kind === "theme" && isThemeOwned(r.title);
                        const equipped =
                          !isCustomTheme &&
                          kind === "theme" &&
                          activeGlow === glowFromRewardTitle(r.title);
                        const isAdFree = kind === "adfree";
                        const adFreeDaysLeft = adFreeUntil
                          ? Math.max(0, Math.ceil((adFreeUntil - Date.now()) / 86_400_000))
                          : 0;
                        const progressPct = Math.min(
                          100,
                          Math.round((wallet.balance / r.xp) * 100),
                        );
                        const isExpanded = expandedId === r.id;
                        const photo = resolveMediaUrl(r.imageUrl);

                        const ctaLabel = owned
                          ? equipped
                            ? "Equipped"
                            : "Equip"
                          : canAfford
                            ? isAdFree
                              ? adFreeActive
                                ? "Extend"
                                : "Activate"
                              : kind === "theme"
                                ? "Unlock"
                                : "Redeem now"
                            : "Not enough XP yet";
                        const ctaDisabled = equipped || (!owned && !canAfford);

                        return (
                          <div
                            key={r.id}
                            className={cn(
                              "flex flex-col rounded-xl border bg-white p-5 transition-all",
                              owned || canAfford
                                ? "border-brand-gold/40"
                                : "border-slate-200 hover:border-slate-300",
                            )}
                          >
                            {photo && (
                              <img
                                src={photo}
                                alt=""
                                className="-mx-5 -mt-5 mb-4 h-32 w-[calc(100%+2.5rem)] rounded-t-xl object-cover"
                              />
                            )}
                            <div className="flex items-start justify-between">
                              <div
                                className={cn(
                                  "flex size-10 items-center justify-center rounded-lg",
                                  meta.chip,
                                )}
                              >
                                <Icon className="size-5" />
                              </div>
                              <span
                                className={cn(
                                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                  owned || (isAdFree && adFreeActive)
                                    ? "bg-violet-50 text-violet-700"
                                    : canAfford
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-400",
                                )}
                              >
                                {owned ? (
                                  <>
                                    <Check className="size-2.5" /> Owned
                                  </>
                                ) : isAdFree && adFreeActive ? (
                                  <>
                                    <Check className="size-2.5" /> Active
                                  </>
                                ) : canAfford ? (
                                  <>
                                    <Zap className="size-2.5" /> Ready
                                  </>
                                ) : (
                                  <>
                                    <Lock className="size-2.5" /> Locked
                                  </>
                                )}
                              </span>
                            </div>

                            <p className="mt-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {meta.label}
                            </p>
                            <h3 className="mt-0.5 font-semibold text-slate-900 leading-snug">
                              {r.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                              {r.description || meta.desc}
                            </p>
                            {isAdFree && adFreeActive && (
                              <p className="mt-1 text-[11px] font-semibold text-violet-600">
                                {adFreeDaysLeft} day{adFreeDaysLeft === 1 ? "" : "s"} remaining
                              </p>
                            )}

                            <div className="mt-4 flex items-end justify-between">
                              <div>
                                <p className="text-lg font-bold tabular-nums text-slate-900 leading-none">
                                  {r.xp.toLocaleString()}
                                  <span className="ml-1 text-xs font-medium text-slate-400">
                                    XP
                                  </span>
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  {kind === "usdt"
                                    ? `≈ ${xpToUsdt(r.xp).toFixed(2)} USDT`
                                    : kind === "etb"
                                      ? `≈ ${xpToEtb(r.xp)} ETB`
                                      : isAdFree
                                        ? "Instant · stacks if already active"
                                        : "Cosmetic only — no cash value"}
                                </p>
                              </div>
                            </div>

                            {!owned && !canAfford && (
                              <div className="mt-3 space-y-1">
                                <div className="flex justify-between text-[10px] font-medium text-slate-400">
                                  <span>
                                    {wallet.balance.toLocaleString()} / {r.xp.toLocaleString()} XP
                                  </span>
                                  <span>{progressPct}%</span>
                                </div>
                                <Progress
                                  value={progressPct}
                                  className="h-1.5 rounded-full [&>div]:bg-brand-navy"
                                />
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : r.id)}
                              className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              <Info className="size-3" />
                              How it works
                              <ChevronRight
                                className={cn(
                                  "size-3 transition-transform",
                                  isExpanded && "rotate-90",
                                )}
                              />
                            </button>
                            {isExpanded && (
                              <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600 leading-relaxed animate-in fade-in-0 slide-in-from-top-1 duration-150">
                                {meta.claimNote}
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={ctaDisabled}
                              onClick={() => !ctaDisabled && handleRedeem(r)}
                              className={cn(
                                "mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition-all",
                                ctaDisabled
                                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                  : owned
                                    ? "bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.98]"
                                    : "bg-brand-gold text-white hover:brightness-110 active:scale-[0.98]",
                              )}
                            >
                              {ctaLabel}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
                </div>
              </div>
            )}

            {/* ─────────── REFERRALS ─────────── */}
            {section === "referrals" && (
              <div className="animate-in fade-in-0 duration-300">
                <ReferralPanel />
              </div>
            )}

            {/* ─────────── WITHDRAW ─────────── */}
            {section === "withdraw" && (
              <div className="animate-in fade-in-0 duration-300">
                <WithdrawalPanel
                  availableXp={wallet.balance + wallet.pendingXp}
                  prefill={withdrawPrefill}
                />
              </div>
            )}

            {/* ─────────── BADGES ─────────── */}
            {section === "badges" && (
              <div className="animate-in fade-in-0 duration-300 space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Achievement badges</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {earnedBadges} of {dynamicBadges.length} earned · each badge gives a bonus XP award
                    </p>
                  </div>
                </div>

                {/* Overall progress */}
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Collection progress</p>
                    <p className="text-xs font-semibold text-brand-gold">
                      {Math.round((earnedBadges / dynamicBadges.length) * 100)}% complete
                    </p>
                  </div>
                  <Progress
                    value={(earnedBadges / dynamicBadges.length) * 100}
                    className="h-2 [&>div]:bg-brand-gold"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Badges award bonus XP — earn all 6 for{" "}
                      <span className="font-semibold text-slate-900">
                        +{dynamicBadges.reduce((s, b) => s + b.xpAward, 0).toLocaleString()} XP
                      </span>{" "}
                      total
                    </span>
                    {nextBadge && (
                      <span>
                        Next: <span className="font-semibold text-slate-900">{nextBadge.name}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* "Next to earn" spotlight */}
                {nextBadge &&
                  (() => {
                    const meta = badgeMeta[nextBadge.name] ?? badgeMeta["First Steps"];
                    const Icon = meta.icon;
                    return (
                      <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/5 p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "flex size-12 shrink-0 items-center justify-center rounded-xl",
                              meta.chip,
                            )}
                          >
                            <Icon className="size-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-1">
                              Next to earn
                            </p>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-slate-900">{nextBadge.name}</h3>
                              <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-gold/10 px-2.5 py-0.5 text-xs font-bold text-brand-gold">
                                +{nextBadge.xpAward} XP
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm text-slate-600">{meta.desc}</p>
                            <div className="mt-3 space-y-1">
                              <div className="flex justify-between text-xs text-slate-500">
                                <span>{nextBadge.current}</span>
                                <span className="font-semibold text-slate-900">{nextBadge.pct}%</span>
                              </div>
                              <Progress value={nextBadge.pct} className="h-1.5 [&>div]:bg-brand-gold" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* Badge grid */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {dynamicBadges.map((b) => {
                    const meta = badgeMeta[b.name] ?? badgeMeta["First Steps"];
                    const Icon = meta.icon;
                    const isNext = b.name === nextBadge?.name;

                    return (
                      <div
                        key={b.name}
                        className={cn(
                          "flex flex-col rounded-xl border p-4",
                          b.earned
                            ? "border-emerald-200 bg-white"
                            : isNext
                              ? "border-brand-gold/30 bg-white"
                              : "border-slate-200 bg-slate-50",
                        )}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-xl",
                              b.earned || isNext ? meta.chip : "bg-slate-200 text-slate-400",
                            )}
                          >
                            <Icon className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={cn(
                                  "text-sm font-semibold leading-tight",
                                  b.earned ? "text-slate-900" : "text-slate-600",
                                )}
                              >
                                {b.name}
                              </p>
                              {b.earned ? (
                                <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                  <CheckCircle2 className="size-2.5" />
                                </span>
                              ) : (
                                <Lock className="size-3 shrink-0 text-slate-300 mt-0.5" />
                              )}
                            </div>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                              {meta.desc}
                            </p>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "mt-3 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs",
                            b.earned
                              ? "bg-brand-gold/8 text-brand-gold"
                              : "bg-slate-100 text-slate-400",
                          )}
                        >
                          <span className="font-medium">
                            {b.earned ? "XP awarded" : "XP reward"}
                          </span>
                          <span className="font-bold">+{b.xpAward} XP</span>
                        </div>

                        {!b.earned && (
                          <div className="mt-2.5 space-y-1">
                            <div className="flex justify-between text-[10px] font-medium text-slate-400">
                              <span>{b.current}</span>
                              <span className="font-semibold text-slate-500">{b.pct}%</span>
                            </div>
                            <Progress
                              value={b.pct}
                              className={cn(
                                "h-1 rounded-full",
                                isNext ? "[&>div]:bg-brand-gold" : "[&>div]:bg-slate-300",
                              )}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─────────── HISTORY ─────────── */}
            {section === "history" && (
              <div className="animate-in fade-in-0 duration-300 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Redemption history</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Every glow, ETB payout, and USDT payout you've redeemed
                  </p>
                </div>

                {activity.length > 0 &&
                  (() => {
                    const totalSpent = activity.reduce((s, r) => s + r.xp, 0);
                    const pendingCount = activity.filter(
                      (a) => a.status === "pending" || a.status === "approved",
                    ).length;
                    return (
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            label: "Total XP spent",
                            value: `${totalSpent.toLocaleString()} XP`,
                            sub: `≈ ${xpToEtb(totalSpent)} ETB`,
                          },
                          {
                            label: "Items redeemed",
                            value: String(activity.length),
                            sub: "total claims",
                          },
                          {
                            label: "Awaiting admin",
                            value: String(pendingCount),
                            sub: "pending / approved",
                          },
                        ].map((s) => (
                          <div
                            key={s.label}
                            className="rounded-xl border border-slate-200 bg-white p-4"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {s.label}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{s.value}</p>
                            <p className="text-[10px] text-slate-400">{s.sub}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                {activity.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <Gift className="size-7" />
                    </div>
                    <p className="text-lg font-semibold text-slate-900">No redemptions yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Head to Redeem to spend your XP on ETB, USDT, a profile glow, or ad-free
                      browsing
                    </p>
                    <button
                      type="button"
                      onClick={() => setSection("catalog")}
                      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
                    >
                      Browse catalog <ArrowRight className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activity.map((item) => {
                      const meta = kindMeta[item.kind];
                      const Icon = meta.icon;
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-3.5">
                            <div
                              className={cn(
                                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                                meta.chip,
                              )}
                            >
                              <Icon className="size-5" />
                            </div>
                            <div>
                              <div className="mb-0.5 flex items-center gap-2">
                                <span
                                  className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider",
                                    meta.badge,
                                  )}
                                >
                                  {meta.label}
                                </span>
                                <StatusPill status={item.status} />
                              </div>
                              <h3 className="font-semibold text-slate-900">{item.title}</h3>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {item.date}
                                <span className="mx-1 text-slate-300">·</span>
                                <span className="font-semibold text-slate-700">
                                  {item.xp.toLocaleString()} XP
                                </span>
                              </p>
                              {item.adminNote && (
                                <p className="mt-1 rounded bg-red-50 px-2 py-1 text-[11px] text-red-700">
                                  Admin note: {item.adminNote}
                                </p>
                              )}
                            </div>
                          </div>
                          {(item.kind === "theme" || item.kind === "adfree" || item.kind === "frame") && (
                            <Link
                              to="/rewards/claim/$redemptionId"
                              params={{ redemptionId: item.id }}
                              className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:self-center"
                            >
                              <ReceiptIcon className="size-3.5" />
                              View receipt
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm before an instant, irreversible XP spend (theme unlock / ad-free activation) */}
      <AlertDialog open={!!confirmReward} onOpenChange={(open) => !open && setConfirmReward(null)}>
        <AlertDialogContent>
          {confirmReward &&
            (() => {
              const meta = kindMeta[confirmReward.kind];
              const Icon = meta.icon;
              const balanceAfter = wallet.balance - confirmReward.xp;
              return (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm redemption</AlertDialogTitle>
                    <AlertDialogDescription>
                      This spends XP immediately and can't be undone — double-check before
                      confirming.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          meta.chip,
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-brand-navy">{confirmReward.title}</p>
                        <p className="text-xs text-slate-500">{meta.label}</p>
                      </div>
                    </div>
                    <dl className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <dt className="text-slate-600">XP cost</dt>
                        <dd className="font-semibold text-red-600">
                          −{confirmReward.xp.toLocaleString()} XP
                        </dd>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                        <dt className="text-slate-600">Balance after</dt>
                        <dd className="font-semibold text-slate-700">
                          {balanceAfter.toLocaleString()} XP
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs text-slate-500">
                      {confirmReward.kind === "theme"
                        ? "Unlocked permanently — yours to equip any time from Redeem."
                        : adFreeActive
                          ? `Stacks on top of your current ad-free time instead of replacing it.`
                          : "Ads turn off across the site the moment you confirm."}
                    </p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-brand-gold hover:brightness-110"
                      onClick={confirmSpend}
                    >
                      Confirm redemption
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </>
              );
            })()}
        </AlertDialogContent>
      </AlertDialog>

      {/* VIP Themes Selector Dialog */}
      <AlertDialog
        open={!!vipDialogReward}
        onOpenChange={(open) => !open && setVipDialogReward(null)}
      >
        <AlertDialogContent className="max-w-xl">
          {vipDialogReward && (
            <VIPThemesSelector
              cost={vipDialogReward.xp}
              balance={wallet.balance}
              ownedGlows={ownedGlows}
              activeGlow={activeGlow}
              onEquip={(themeId, label) => {
                setActiveGlow(themeId);
                toast.success(`${label} equipped`);
                setVipDialogReward(null);
              }}
              onUnlock={(themeId, label) => {
                const result = redeem(
                  { title: label, xp: vipDialogReward.xp, tag: "Theme" },
                  wallet.balance,
                );
                if (!result.ok) {
                  toast.error("Not enough XP", { description: result.error });
                  return;
                }
                unlockGlow(themeId);
                setActiveGlow(themeId);
                toast.success(`${label} unlocked & equipped!`, {
                  description: "Now glowing on your avatar — check the header or your profile.",
                });
                setVipDialogReward(null);
              }}
              onClose={() => setVipDialogReward(null)}
            />
          )}
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function StatusPill({
  status,
}: {
  status: "delivered" | "pending" | "approved" | "rejected" | "paid";
}) {
  const config: Record<typeof status, { label: string; cls: string; icon: LucideIcon }> = {
    delivered: { label: "Delivered", cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
    pending: { label: "Pending review", cls: "bg-amber-50 text-amber-700", icon: Info },
    approved: { label: "Approved", cls: "bg-blue-50 text-blue-700", icon: CheckCircle2 },
    paid: { label: "Sent", cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
    rejected: { label: "Rejected", cls: "bg-red-50 text-red-600", icon: XCircle },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
        c.cls,
      )}
    >
      <Icon className="size-2.5" /> {c.label}
    </span>
  );
}

function VIPThemesSelector({
  cost,
  balance,
  ownedGlows,
  activeGlow,
  onEquip,
  onUnlock,
  onClose,
}: {
  cost: number;
  balance: number;
  ownedGlows: string[];
  activeGlow: string | null;
  onEquip: (themeId: GlowTheme, label: string) => void;
  onUnlock: (themeId: GlowTheme, label: string) => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";

  const vipThemes: {
    id: GlowTheme;
    label: string;
    ring: string;
    shadow: string;
    dot: string;
    desc: string;
  }[] = [
    {
      id: "cherry",
      label: "Cherry VIP Glow",
      ring: "ring-rose-500/70",
      shadow: "shadow-[0_0_18px_rgba(244,63,94,0.6)]",
      dot: "bg-rose-500",
      desc: "Vibrant and energetic rose aura",
    },
    {
      id: "cosmic",
      label: "Cosmic VIP Glow",
      ring: "ring-fuchsia-500/70",
      shadow: "shadow-[0_0_18px_rgba(217,70,239,0.6)]",
      dot: "bg-fuchsia-500",
      desc: "Galactic magenta star-field glow",
    },
    {
      id: "midnight",
      label: "Midnight VIP Glow",
      ring: "ring-slate-900/80",
      shadow: "shadow-[0_0_18px_rgba(15,23,42,0.85)]",
      dot: "bg-slate-900",
      desc: "Deep mysterious dark-matter shadow",
    },
    {
      id: "cyberpunk",
      label: "Cyberpunk VIP Glow",
      ring: "ring-yellow-400/80",
      shadow: "shadow-[0_0_18px_rgba(234,179,8,0.8)]",
      dot: "bg-yellow-400",
      desc: "Electric high-contrast neon yellow",
    },
    {
      id: "ice",
      label: "Ice VIP Glow",
      ring: "ring-cyan-300/70",
      shadow: "shadow-[0_0_18px_rgba(103,232,249,0.65)]",
      dot: "bg-cyan-300",
      desc: "Frosted crystal light-blue aura",
    },
  ];

  const [selected, setSelected] = useState<GlowTheme>("cherry");

  const selectedTheme = vipThemes.find((t) => t.id === selected)!;
  const isOwned = ownedGlows.includes(selected);
  const isEquipped = activeGlow === selected;
  const canAfford = balance >= cost;

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="font-serif text-brand-navy text-xl">
          Choose VIP Profile Theme
        </AlertDialogTitle>
        <AlertDialogDescription>
          Unlock exclusive VIP glow effects to make your avatar stand out on the leaderboard and
          header.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="my-4 grid gap-6 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-center relative overflow-hidden">
          <p className="z-10 mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Selected theme preview
          </p>
          <div className="relative my-2 flex h-28 w-28 items-center justify-center">
            <span
              className={cn(
                "flex size-24 items-center justify-center rounded-full bg-brand-navy text-2xl font-bold text-white ring-8",
                selectedTheme.ring,
                selectedTheme.shadow,
              )}
            >
              {initials}
            </span>
          </div>
          <p className="mt-4 text-sm font-semibold text-brand-navy">{selectedTheme.label}</p>
          <p className="mt-1 text-xs text-slate-500">{selectedTheme.desc}</p>
        </div>

        <div className="space-y-2">
          {vipThemes.map((theme) => {
            const owned = ownedGlows.includes(theme.id);
            const equipped = activeGlow === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelected(theme.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                  selected === theme.id
                    ? "border-brand-gold bg-brand-gold/5 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200",
                )}
              >
                <span className={cn("size-3 shrink-0 rounded-full", theme.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-navy">{theme.label}</p>
                  <p className="truncate text-xs text-slate-500">{theme.desc}</p>
                </div>
                {equipped ? (
                  <Badge className="bg-violet-100 text-[10px] text-violet-700 hover:bg-violet-100">
                    Equipped
                  </Badge>
                ) : owned ? (
                  <Badge className="bg-emerald-100 text-[10px] text-emerald-700 hover:bg-emerald-100">
                    Owned
                  </Badge>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          {!isOwned && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Price to unlock
              </p>
              <p className="text-lg font-bold text-slate-900">
                {cost.toLocaleString()}{" "}
                <span className="text-xs font-semibold text-slate-400">XP</span>
              </p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {isOwned ? (
            <Button
              className="bg-brand-navy hover:bg-brand-navy/90"
              disabled={isEquipped}
              onClick={() => onEquip(selected, selectedTheme.label)}
            >
              {isEquipped ? "Equipped" : "Equip"}
            </Button>
          ) : (
            <Button
              className="bg-brand-gold hover:brightness-110"
              disabled={!canAfford}
              onClick={() => onUnlock(selected, selectedTheme.label)}
            >
              {canAfford ? "Unlock VIP Theme" : "Not enough XP"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
