import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Banknote,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Coins,
  Crown,
  Eye,
  Flame,
  Footprints,
  Gift,
  Info,
  Landmark,
  Layers,
  Lock,
  Moon,
  Palette,
  Receipt as ReceiptIcon,
  Search,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users2,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { ComingSoonGate } from "@/components/coming-soon-gate";
import { ReferralPanel } from "@/components/referral-panel";
import { ReadingRewardCard } from "@/components/reading-reward-card";
import { RequireAuthClient } from "@/components/require-auth-client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { WithdrawalPanel, type WithdrawalPrefill } from "@/components/withdrawal-panel";
import { RewardFramesSection } from "@/components/frames/RewardFramesSection";
import { ProfileFrameAvatar } from "@/components/frames/ProfileFrameAvatar";
import { RarityBadge } from "@/components/frames/RarityBadge";
import { Education3DIcon } from "@/components/frames/Education3DIcon";
import { PROFILE_FRAMES } from "@/lib/frame-data";
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
import { usePerks } from "@/hooks/use-perks";
import { useRedemptions } from "@/hooks/use-redemptions";
import { useReadingTime } from "@/hooks/use-reading-time";
import { useRewardsCatalog } from "@/hooks/use-rewards-catalog";
import { useWallet } from "@/hooks/use-wallet";
import { useWithdrawals } from "@/hooks/use-withdrawals";
import { useFrames } from "@/hooks/use-frames";
import { requireAuth } from "@/lib/require-auth";
import { glowFromRewardTitle, type GlowTheme } from "@/lib/cosmetics-store";
import { resolveMediaUrl } from "@/lib/media-store";
import { adFreeDaysFromTitle, kindMeta, kindOf, type Kind } from "@/lib/reward-kind";
import { XP_PER_ETB, MIN_WITHDRAWAL_ETB, xpToEtb, xpToUsdt } from "@/lib/withdrawal-data";
import { badges } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ─── Rank / level system ───────────────────────────────────────────────────────
const XP_TIERS = [
  {
    name: "Beginner",
    min: 0,
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-300",
    perk: "Standard withdrawals & library access",
  },
  {
    name: "Bronze",
    min: 500,
    color: "text-amber-700",
    bg: "bg-amber-100",
    border: "border-amber-300",
    perk: "Bronze Badge + 5% faster exam XP rewards",
  },
  {
    name: "Silver",
    min: 1500,
    color: "text-slate-700",
    bg: "bg-slate-200",
    border: "border-slate-400",
    perk: "Priority payout review under 24 hours",
  },
  {
    name: "Gold",
    min: 4000,
    color: "text-amber-600",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    perk: "Zero processing fees on all withdrawals",
  },
  {
    name: "Platinum",
    min: 10000,
    color: "text-violet-600",
    bg: "bg-violet-100",
    border: "border-violet-300",
    perk: "Exclusive VIP Avatar Glow & Instant USDT approvals",
  },
] as const;

function getRank(xp: number) {
  for (let i = XP_TIERS.length - 1; i >= 0; i--) {
    if (xp >= XP_TIERS[i].min) return { tier: XP_TIERS[i], next: XP_TIERS[i + 1] ?? null };
  }
  return { tier: XP_TIERS[0], next: XP_TIERS[1] };
}

// XP source categories
const XP_SOURCES = [
  { key: "library" as const, label: "Reading Time", hex: "#2563eb", icon: BookOpen },
  { key: "exam" as const, label: "Mock Exams", hex: "#f59e0b", icon: Award },
  { key: "referral" as const, label: "Referrals", hex: "#10b981", icon: Users2 },
  { key: "base" as const, label: "Study Bonuses", hex: "#8b5cf6", icon: Sparkles },
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
type Section = "overview" | "catalog" | "frames" | "withdraw" | "badges" | "referrals" | "history";

export const Route = createFileRoute("/rewards/")({
  beforeLoad: () => requireAuth("/rewards"),
  head: () => ({
    meta: [
      { title: "Rewards Command Center — Study2Earn" },
      {
        name: "description",
        content:
          "Convert study XP into Ethiopian Birr (ETB), USDT crypto, prestigious profile frames, VIP glows, or ad-free reading.",
      },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  return (
    <ComingSoonGate pageKey="rewards">
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-brand-gold/20">
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
  const frames = useFrames();
  const {
    owned: ownedGlows,
    active: activeGlow,
    unlock: unlockGlow,
    setActive: setActiveGlow,
  } = useCosmetics();
  const { adFreeUntil, adFreeActive, extendAdFree } = usePerks();

  // Navigation & Filtering State
  const [section, setSection] = useState<Section>("overview");
  const [catalogFilter, setCatalogFilter] = useState<string>("all");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSort, setCatalogSort] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [withdrawPrefill, setWithdrawPrefill] = useState<WithdrawalPrefill | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | Kind>("all");
  const [historySearch, setHistorySearch] = useState("");

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

  // Derived rank & progress
  const { tier, next } = getRank(wallet.lifetimeEarned);
  const rankPct = next
    ? Math.min(100, Math.round(((wallet.lifetimeEarned - tier.min) / (next.min - tier.min)) * 100))
    : 100;
  const xpToNext = next ? Math.max(0, next.min - wallet.lifetimeEarned) : 0;

  // Withdrawal readiness
  const MIN_XP = MIN_WITHDRAWAL_ETB * XP_PER_ETB; // 400 XP
  const wdPct = Math.min(100, Math.round((wallet.balance / MIN_XP) * 100));
  const xpNeeded = Math.max(0, MIN_XP - wallet.balance);
  const isReadyToWithdraw = wallet.balance >= MIN_XP;

  // Avatar initials
  const initials = useMemo(
    () =>
      (user?.name ?? "ST")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user?.name],
  );

  const equippedFrame = frames.equipped
    ? (PROFILE_FRAMES.find((f) => f.id === frames.equipped) ?? null)
    : null;

  const earnedBadges = badges.filter((b) => b.earned).length;
  const isThemeOwned = (title: string) => ownedGlows.includes(glowFromRewardTitle(title));

  const unlockableCount = catalog.filter((r) => {
    const kind = kindOf(r.tag, r.title);
    if (kind === "theme") {
      return !isThemeOwned(r.title) && wallet.balance >= r.xp;
    }
    return wallet.balance >= r.xp;
  }).length;
  const nextBadge = badges.find((b) => !b.earned);

  // XP sources breakdown
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

  // Unified activity history
  const activity = useMemo(() => {
    return [
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
  }, [records, myRequests]);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    let list = catalog.slice();

    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tag.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)),
      );
    }

    if (catalogFilter === "affordable") {
      list = list.filter((r) => wallet.balance >= r.xp);
    } else if (catalogFilter !== "all") {
      list = list.filter((r) => {
        const k = kindOf(r.tag, r.title);
        return k === catalogFilter || r.tag.toLowerCase() === catalogFilter;
      });
    }

    list.sort((a, b) => {
      if (catalogSort === "featured") {
        const canA = wallet.balance >= a.xp ? 1 : 0;
        const canB = wallet.balance >= b.xp ? 1 : 0;
        return canB - canA || a.xp - b.xp;
      }
      if (catalogSort === "price-asc") return a.xp - b.xp;
      if (catalogSort === "price-desc") return b.xp - a.xp;
      return 0;
    });

    return list;
  }, [catalog, catalogFilter, catalogSearch, catalogSort, wallet.balance]);

  // Handlers
  const handleRedeemTheme = (reward: { title: string; xp: number; tag: string }) => {
    const theme = glowFromRewardTitle(reward.title);
    if (isThemeOwned(reward.title)) {
      setActiveGlow(theme);
      toast.success(`${reward.title} equipped!`, {
        description: "Your glowing avatar ring is now active.",
      });
      return;
    }
    const result = redeem({ title: reward.title, xp: reward.xp, tag: reward.tag }, wallet.balance);
    if (!result.ok) {
      toast.error("Not enough XP", { description: result.error });
      return;
    }
    unlockGlow(theme);
    toast.success(`${reward.title} unlocked!`, {
      description: "Now glowing on your avatar — visible across Study2Earn.",
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
      toast.error("Not enough XP", {
        description: `You need ${(reward.xp - wallet.balance).toLocaleString()} more XP.`,
      });
      return;
    }
    const kind = kindOf(reward.tag, reward.title);
    setWithdrawPrefill(
      kind === "usdt"
        ? { method: "usdt", amountUsdt: xpToUsdt(reward.xp) }
        : { method: "bank", amountEtb: xpToEtb(reward.xp) },
    );
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
        : `Ads are disabled across the site for the next ${days} days.`,
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

  // Nav Items with dynamic badges
  const NAV: { id: Section; label: string; icon: LucideIcon; badge?: string }[] = [
    { id: "overview", label: "Overview", icon: Coins },
    {
      id: "catalog",
      label: "Redeem Store",
      icon: Gift,
      badge: unlockableCount > 0 ? `${unlockableCount} Ready` : undefined,
    },
    {
      id: "frames",
      label: "Profile Frames",
      icon: Layers,
      badge: `${frames.owned.length}/${PROFILE_FRAMES.length}`,
    },
    {
      id: "withdraw",
      label: "Withdraw",
      icon: Landmark,
      badge: isReadyToWithdraw ? "Ready" : undefined,
    },
    { id: "badges", label: "Badges", icon: Award, badge: `${earnedBadges}/${badges.length}` },
    { id: "referrals", label: "Refer & Earn", icon: Users2 },
    {
      id: "history",
      label: "History",
      icon: ReceiptIcon,
      badge: activity.length > 0 ? String(activity.length) : undefined,
    },
  ];

  return (
    <main className="flex-1 pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:pt-8 space-y-6">
        {/* ═══════════════════════════════════════════════════════════════════════
            HERO COMMAND CENTER BANNER
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-2xl border border-slate-800/80">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: User Identity & Rank */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <ProfileFrameAvatar
                  initials={initials}
                  frameId={equippedFrame?.id}
                  size="lg"
                  equipped={!!equippedFrame}
                />
                <button
                  type="button"
                  onClick={() => setSection("frames")}
                  className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-md hover:scale-110 transition-transform"
                  title="Customize Frame"
                >
                  <Sparkles className="size-3.5" />
                </button>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-serif text-white truncate">
                    {user?.name ?? "Student"}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border",
                      tier.bg,
                      tier.color,
                      tier.border,
                    )}
                  >
                    <Trophy className="size-3" />
                    {tier.name} Earner
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  {user?.university ?? "Addis Ababa University"} · Level {XP_TIERS.findIndex((t) => t.name === tier.name) + 1}
                </p>

                {/* Tier perk tooltip / summary */}
                <p className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1.5 pt-0.5">
                  <Crown className="size-3 shrink-0" />
                  {tier.perk}
                </p>
              </div>
            </div>

            {/* Right: Wealth Counter & Quick Converter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800/90 backdrop-blur-md">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Available Balance
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-serif text-3xl sm:text-4xl font-black text-amber-400 tabular-nums">
                    {wallet.balance.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-slate-400">XP</span>
                </div>

                {/* Live Estimated Fiat/Crypto values */}
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <span className="text-emerald-400 font-semibold">
                    ≈ {xpToEtb(wallet.balance)} ETB
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-teal-400 font-semibold">
                    ≈ ${xpToUsdt(wallet.balance).toFixed(2)} USDT
                  </span>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex sm:flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => setSection("withdraw")}
                  className={cn(
                    "font-bold text-xs h-9 shadow-md transition-all active:scale-[0.98]",
                    isReadyToWithdraw
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-slate-950",
                  )}
                >
                  <Landmark className="size-3.5 mr-1.5" />
                  {isReadyToWithdraw ? "Cash Out ETB" : "Withdraw"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSection("catalog")}
                  className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-800 text-xs h-9"
                >
                  <Gift className="size-3.5 mr-1.5" />
                  Redeem Store
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Rank Progress in Hero */}
          {next && (
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="size-3.5 text-amber-400" />
                  Rank Progress: <strong className="text-white">{tier.name}</strong> to{" "}
                  <strong className="text-amber-300">{next.name}</strong>
                </span>
                <span className="font-semibold text-slate-300">
                  {xpToNext.toLocaleString()} XP needed ({rankPct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 transition-all duration-500 rounded-full"
                  style={{ width: `${rankPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            MODERN TAB NAVIGATION BAR
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="sticky top-16 z-20 -mx-4 px-4 bg-slate-50/90 backdrop-blur-md py-2 border-b border-slate-200/80 sm:mx-0 sm:px-0 sm:border-0 sm:bg-transparent sm:static">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = section === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSection(n.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-200",
                    active
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                      : "bg-white text-slate-600 border border-slate-200/90 hover:border-slate-300 hover:text-slate-900",
                  )}
                >
                  <Icon className={cn("size-4", active ? "text-amber-400" : "text-slate-400")} />
                  <span>{n.label}</span>
                  {n.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600 border border-slate-200",
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

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 1: OVERVIEW COMMAND CENTER
            ═══════════════════════════════════════════════════════════════════════ */}
        {section === "overview" && (
          <div className="space-y-6 animate-in fade-in-0 duration-300">
            {/* Top Row: Cashout Meter & XP Breakdown */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Cashout Readiness Card */}
              <div
                className={cn(
                  "flex flex-col justify-between rounded-3xl border p-6 transition-all shadow-xs",
                  isReadyToWithdraw
                    ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30"
                    : "border-slate-200 bg-white",
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl",
                          isReadyToWithdraw ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        <Landmark className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Cashout Readiness
                        </p>
                        <h2 className="text-base font-bold text-slate-900">
                          {isReadyToWithdraw
                            ? `${xpToEtb(wallet.balance)} ETB Ready to Withdraw`
                            : `${xpNeeded.toLocaleString()} XP until first cashout`}
                        </h2>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        isReadyToWithdraw
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-50 text-amber-800 border border-amber-200",
                      )}
                    >
                      {wdPct}% Reached
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    Minimum withdrawal threshold is <strong>{MIN_WITHDRAWAL_ETB} ETB</strong> (
                    {MIN_XP} XP). Cash out directly to <strong>Telebirr</strong>,{" "}
                    <strong>CBE</strong>, Awash, or <strong>USDT Binance</strong>.
                  </p>

                  <div className="mt-4">
                    <Progress
                      value={wdPct}
                      className={cn(
                        "h-2.5 rounded-full",
                        isReadyToWithdraw ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500",
                      )}
                    />
                    <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                      <span>Current: {wallet.balance.toLocaleString()} XP</span>
                      <span>Target: {MIN_XP.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Button
                    onClick={() => setSection("withdraw")}
                    className={cn(
                      "flex-1 font-bold text-xs h-10 rounded-xl",
                      isReadyToWithdraw
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-slate-900 text-white hover:bg-slate-800",
                    )}
                  >
                    {isReadyToWithdraw ? "Withdraw ETB Cash Now" : "Go to Withdrawal Hub"}
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSection("catalog")}
                    className="text-xs h-10 rounded-xl border-slate-200"
                  >
                    View Store Items
                  </Button>
                </div>
              </div>

              {/* XP Provenance Breakdown */}
              <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Earnings Provenance
                      </p>
                      <h2 className="text-base font-bold text-slate-900">
                        Lifetime Earned: {wallet.lifetimeEarned.toLocaleString()} XP
                      </h2>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      <TrendingUp className="size-3 text-emerald-600" />
                      4 Channels
                    </span>
                  </div>

                  {/* Multi-color segment bar */}
                  <div className="mt-4">
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                      {sourceBreakdown.map((s) => {
                        const pct = Math.max(
                          2,
                          Math.round((s.xp / (wallet.lifetimeEarned || 1)) * 100),
                        );
                        return (
                          <div
                            key={s.key}
                            style={{
                              width: `${pct}%`,
                              backgroundColor: s.hex,
                            }}
                            className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                            title={`${s.label}: ${s.xp.toLocaleString()} XP (${pct}%)`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Legends */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {sourceBreakdown.map((s) => {
                      const Icon = s.icon;
                      const pct = Math.round((s.xp / (wallet.lifetimeEarned || 1)) * 100);
                      return (
                        <div
                          key={s.key}
                          className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5"
                        >
                          <div
                            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: s.hex }}
                          >
                            <Icon className="size-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-slate-500 truncate">{s.label}</p>
                            <p className="text-xs font-bold text-slate-900 tabular-nums">
                              {s.xp.toLocaleString()} XP{" "}
                              <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="mt-4 text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                  All XP is permanently recorded on your student ledger and validated through study proofs.
                </p>
              </div>
            </div>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                {
                  label: "Lifetime XP",
                  value: wallet.lifetimeEarned.toLocaleString(),
                  sub: `≈ ${xpToEtb(wallet.lifetimeEarned)} ETB`,
                  icon: TrendingUp,
                  color: "text-blue-600 bg-blue-50",
                },
                {
                  label: "Redeemed Claims",
                  value: String(redemptionCount),
                  sub: "Store & Cosmetics",
                  icon: Gift,
                  color: "text-amber-600 bg-amber-50",
                },
                {
                  label: "Badges Unlocked",
                  value: `${earnedBadges}/${badges.length}`,
                  sub: `${Math.round((earnedBadges / badges.length) * 100)}% complete`,
                  icon: Award,
                  color: "text-violet-600 bg-violet-50",
                },
                {
                  label: "Pending Review",
                  value: wallet.pendingXp.toLocaleString(),
                  sub: "Awaiting cashout",
                  icon: Landmark,
                  color: "text-emerald-600 bg-emerald-50",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                    <div className={cn("flex size-7 items-center justify-center rounded-lg", s.color)}>
                      <s.icon className="size-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xl font-bold tabular-nums text-slate-900">{s.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Quests / Earning Accelerators */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Earning Accelerators</h2>
                  <p className="text-xs text-slate-500">
                    High-yield study actions to boost your daily XP balance
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    title: "Verified Reading Sprint",
                    sub: "+50 XP / 30 mins reading",
                    desc: "Read university-verified PDFs in the digital library.",
                    icon: BookOpen,
                    to: "/library" as const,
                    tag: "Continuous",
                    color: "text-blue-600 bg-blue-50 border-blue-200",
                  },
                  {
                    title: "Ethiopian Mock Exams",
                    sub: "+100–200 XP per exam",
                    desc: "Test your skills against official ministry exam banks.",
                    icon: ClipboardList,
                    to: "/exams" as const,
                    tag: "High Yield",
                    color: "text-amber-600 bg-amber-50 border-amber-200",
                  },
                  {
                    title: "Classmate Referrals",
                    sub: "+500 XP per invited friend",
                    desc: "Give classmates 200 XP welcome bonus and earn cash XP.",
                    icon: Users2,
                    onClick: () => setSection("referrals"),
                    tag: "Bounty",
                    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
                  },
                ].map((a) => (
                  <div
                    key={a.title}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn("flex size-10 items-center justify-center rounded-xl", a.color)}>
                          <a.icon className="size-5" />
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {a.tag}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{a.title}</h3>
                      <p className="text-xs font-semibold text-brand-gold mt-0.5">{a.sub}</p>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">{a.desc}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {a.to ? (
                        <Link
                          to={a.to}
                          className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-brand-gold transition-colors"
                        >
                          <span>Start Earning</span>
                          <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={a.onClick}
                          className="flex w-full items-center justify-between text-xs font-bold text-slate-900 group-hover:text-brand-gold transition-colors"
                        >
                          <span>Share Referral Code</span>
                          <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reading Milestone Reward Card */}
            <ReadingRewardCard reading={reading} />

            {/* Recent Activity Ledger Preview */}
            <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Redemptions & Payouts</h3>
                  <p className="text-xs text-slate-400">Your latest claims and financial deliveries</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSection("history")}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
                >
                  View All History <ArrowRight className="size-3.5" />
                </button>
              </div>

              {activity.length === 0 ? (
                <div className="py-12 text-center">
                  <Gift className="mx-auto mb-2 size-8 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No redemptions yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Visit the Redeem Store to spend your XP on real ETB, USDT, or cosmetics.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setSection("catalog")}
                    className="mt-4 bg-slate-900 text-white text-xs"
                  >
                    Open Store Catalog
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activity.slice(0, 4).map((item) => {
                    const meta = kindMeta[item.kind];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-xl",
                              meta.chip,
                            )}
                          >
                            <Icon className="size-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {item.date} · <span className="font-medium text-slate-600">{item.xp.toLocaleString()} XP</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <StatusPill status={item.status} />
                          {(item.kind === "theme" || item.kind === "adfree") && (
                            <Link
                              to="/rewards/claim/$redemptionId"
                              params={{ redemptionId: item.id }}
                              className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300"
                            >
                              <ReceiptIcon className="size-3" /> Receipt
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── XP Tier Roadmap ── */}
            <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rank Tier Roadmap</h3>
                  <p className="text-xs text-slate-400">Unlock exclusive perks as you accumulate XP</p>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold border", tier.bg, tier.color, tier.border)}>
                  <Trophy className="size-3 inline mr-1" />{tier.name}
                </span>
              </div>
              <div className="px-6 py-4 space-y-3">
                {XP_TIERS.map((t, i) => {
                  const isActive = t.name === tier.name;
                  const isPast = wallet.lifetimeEarned >= t.min && !isActive;
                  const nextT = XP_TIERS[i + 1];
                  const pctInTier = nextT
                    ? Math.min(100, Math.round(((wallet.lifetimeEarned - t.min) / (nextT.min - t.min)) * 100))
                    : 100;
                  return (
                    <div
                      key={t.name}
                      className={cn(
                        "rounded-2xl border p-3.5 transition-all",
                        isActive ? "border-amber-300/80 bg-amber-50/60 shadow-xs" : "border-slate-100 bg-slate-50/30",
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={cn("flex size-6 items-center justify-center rounded-full text-[10px] font-black border", t.bg, t.color, t.border)}>
                            {isPast || isActive ? <Check className="size-3" /> : i + 1}
                          </div>
                          <span className={cn("text-xs font-bold", isActive ? t.color : isPast ? "text-slate-500" : "text-slate-400")}>
                            {t.name} Earner
                          </span>
                          {isActive && (
                            <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wide">YOU</span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                          {t.min.toLocaleString()} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 pl-8 leading-relaxed">{t.perk}</p>
                      {isActive && nextT && (
                        <div className="mt-2 pl-8">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                              style={{ width: `${pctInTier}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {pctInTier}% to <span className="font-semibold text-slate-600">{nextT.name}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 2: REDEEM STORE / CATALOG
            ═══════════════════════════════════════════════════════════════════════ */}
        {section === "catalog" && (
          <div className="space-y-6 animate-in fade-in-0 duration-300">
            {/* Store Header Banner */}
            <div className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200/60 mb-2">
                  <Gift className="size-3.5 text-amber-600" />
                  Official Study2Earn Marketplace
                </div>
                <h2 className="text-2xl font-bold font-serif text-slate-900">Redeem Store</h2>
                <p className="mt-1 text-sm text-slate-500 max-w-xl">
                  Convert study XP into Ethiopian Birr bank transfers, USDT Binance crypto,
                  exclusive avatar profile frames, glowing cosmetics, or ad-free reading.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Spending Balance
                </p>
                <p className="font-serif text-2xl font-bold text-slate-900">
                  {wallet.balance.toLocaleString()}{" "}
                  <span className="text-xs font-bold text-slate-400">XP</span>
                </p>
                <p className="text-xs font-semibold text-emerald-600">
                  ≈ {xpToEtb(wallet.balance)} ETB Withdrawable
                </p>
              </div>
            </div>

            {/* Clean Filter Chips & Search Controls */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search rewards (e.g., 'ETB', 'USDT', 'Glow', 'Ad-Free')..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  {catalogSearch && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Option */}
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-500">Sort:</span>
                  <select
                    value={catalogSort}
                    onChange={(e) => setCatalogSort(e.target.value as typeof catalogSort)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="featured">Recommended / Affordable</option>
                    <option value="price-asc">XP Cost: Low to High</option>
                    <option value="price-desc">XP Cost: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Category Pills */}
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 scrollbar-none">
                <div className="flex gap-2 pb-1">
                  {[
                    { id: "all", label: "All Items", count: catalog.length },
                    {
                      id: "affordable",
                      label: "Affordable Now",
                      count: catalog.filter((r) => wallet.balance >= r.xp).length,
                      icon: Sparkles,
                    },
                    {
                      id: "etb",
                      label: "Cash · ETB",
                      count: catalog.filter((r) => kindOf(r.tag, r.title) === "etb").length,
                      icon: Banknote,
                    },
                    {
                      id: "usdt",
                      label: "Crypto · USDT",
                      count: catalog.filter((r) => kindOf(r.tag, r.title) === "usdt").length,
                      icon: CircleDollarSign,
                    },
                    {
                      id: "theme",
                      label: "VIP Glows",
                      count: catalog.filter((r) => kindOf(r.tag, r.title) === "theme").length,
                      icon: Palette,
                    },
                    {
                      id: "adfree",
                      label: "Study Perks",
                      count: catalog.filter((r) => kindOf(r.tag, r.title) === "adfree").length,
                      icon: ShieldCheck,
                    },
                  ].map((tab) => {
                    const isActive = catalogFilter === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCatalogFilter(tab.id)}
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all",
                          isActive
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                        )}
                      >
                        {Icon && <Icon className="size-3.5" />}
                        <span>{tab.label}</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-px text-[10px] font-bold",
                            isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}

                  {/* Direct shortcut to Frames collection */}
                  <button
                    type="button"
                    onClick={() => setSection("frames")}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/70 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    <Layers className="size-3.5 text-amber-600" />
                    <span>Avatar Frames Gallery ({PROFILE_FRAMES.length})</span>
                    <ArrowRight className="size-3 text-amber-700" />
                  </button>
                </div>
              </div>
            </div>

            {/* Catalog Grid */}
            {filteredCatalog.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
                <Target className="mx-auto mb-3 size-10 text-slate-300" />
                <p className="font-bold text-slate-900 text-base">No rewards match your filter</p>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing your search or switching filter categories.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCatalogFilter("all");
                    setCatalogSearch("");
                  }}
                  className="mt-4"
                >
                  Reset Store Filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredCatalog.map((r) => {
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
                  const progressPct = Math.min(100, Math.round((wallet.balance / r.xp) * 100));
                  const isExpanded = expandedId === r.id;
                  const photo = resolveMediaUrl(r.imageUrl);

                  const ctaLabel = owned
                    ? equipped
                      ? "Equipped"
                      : "Equip Glow"
                    : canAfford
                      ? isAdFree
                        ? adFreeActive
                          ? "Extend Ad-Free"
                          : "Activate Ad-Free"
                        : kind === "theme"
                          ? "Unlock VIP Theme"
                          : kind === "usdt"
                            ? "Cash Out USDT"
                            : "Withdraw ETB"
                      : "Not enough XP";
                  const ctaDisabled = equipped || (!owned && !canAfford);

                  return (
                    <div
                      key={r.id}
                      className={cn(
                        "group flex flex-col justify-between rounded-3xl border bg-white p-5 transition-all duration-200 shadow-xs hover:-translate-y-1 hover:shadow-md",
                        canAfford || owned
                          ? "border-brand-gold/50 ring-1 ring-brand-gold/20"
                          : "border-slate-200/90 hover:border-slate-300",
                      )}
                    >
                      <div>
                        {photo && (
                          <img
                            src={photo}
                            alt=""
                            className="-mx-5 -mt-5 mb-4 h-36 w-[calc(100%+2.5rem)] rounded-t-3xl object-cover"
                          />
                        )}

                        <div className="flex items-start justify-between">
                          <div
                            className={cn(
                              "flex size-10 items-center justify-center rounded-xl",
                              meta.chip,
                            )}
                          >
                            <Icon className="size-5" />
                          </div>

                          <span
                            className={cn(
                              "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              owned || (isAdFree && adFreeActive)
                                ? "bg-violet-50 text-violet-700 border border-violet-200"
                                : canAfford
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-400 border border-slate-200",
                            )}
                          >
                            {owned ? (
                              <>
                                <Check className="size-2.5" /> Owned
                              </>
                            ) : isAdFree && adFreeActive ? (
                              <>
                                <Check className="size-2.5" /> Active ({adFreeDaysLeft}d)
                              </>
                            ) : canAfford ? (
                              <>
                                <Zap className="size-2.5 text-emerald-600" /> Ready
                              </>
                            ) : (
                              <>
                                <Lock className="size-2.5" /> Locked
                              </>
                            )}
                          </span>
                        </div>

                        <div className="mt-3.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {meta.label}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5">
                            {r.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                            {r.description || meta.desc}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-serif text-xl font-bold text-slate-900 tabular-nums">
                                {r.xp.toLocaleString()}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">XP</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                              {kind === "usdt"
                                ? `≈ ${xpToUsdt(r.xp).toFixed(2)} USDT on Binance`
                                : kind === "etb"
                                  ? `≈ ${xpToEtb(r.xp)} ETB Bank Payout`
                                  : isAdFree
                                    ? "Instant · Stacks with active days"
                                    : "Permanent Avatar Cosmetic"}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar for Locked Items — gradient by kind */}
                        {!owned && !canAfford && (
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-[10px] font-medium text-slate-400">
                              <span>
                                {wallet.balance.toLocaleString()} / {r.xp.toLocaleString()} XP
                              </span>
                              <span className="font-bold text-slate-500">{progressPct}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={cn(
                                  "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                                  kind === "etb"
                                    ? "from-emerald-400 to-emerald-500"
                                    : kind === "usdt"
                                      ? "from-teal-400 to-teal-500"
                                      : kind === "theme"
                                        ? "from-violet-400 to-purple-500"
                                        : "from-slate-400 to-slate-500",
                                )}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Expandable Info */}
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : r.id)}
                          className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <Info className="size-3" />
                          Delivery & How it works
                          <ChevronRight
                            className={cn(
                              "size-3 transition-transform",
                              isExpanded && "rotate-90",
                            )}
                          />
                        </button>
                        {isExpanded && (
                          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-600 leading-relaxed animate-in fade-in-0 duration-150">
                            {meta.claimNote}
                          </div>
                        )}

                        {/* Primary Action Button */}
                        <button
                          type="button"
                          disabled={ctaDisabled}
                          onClick={() => !ctaDisabled && handleRedeem(r)}
                          className={cn(
                            "mt-4 w-full rounded-xl py-2.5 text-xs font-bold transition-all shadow-xs active:scale-[0.98] flex items-center justify-center gap-2",
                            ctaDisabled
                              ? "cursor-not-allowed bg-slate-100 text-slate-400"
                              : owned
                                ? "bg-violet-600 text-white hover:bg-violet-700"
                                : kind === "etb" || kind === "usdt"
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-brand-gold text-white hover:brightness-110",
                          )}
                        >
                          {!ctaDisabled && (kind === "etb" ? (
                            <Banknote className="size-3.5" />
                          ) : kind === "usdt" ? (
                            <CircleDollarSign className="size-3.5" />
                          ) : kind === "theme" ? (
                            <Palette className="size-3.5" />
                          ) : kind === "adfree" ? (
                            <ShieldCheck className="size-3.5" />
                          ) : null)}
                          {ctaLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 3: PROFILE FRAMES GALLERY
            ═══════════════════════════════════════════════════════════════════════ */}
        {section === "frames" && (
          <RewardFramesSection onEarnXp={() => setSection("overview")} />
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 4: WITHDRAWAL HUB
            ═══════════════════════════════════════════════════════════════════════ */}
        {section === "withdraw" && (
          <div className="animate-in fade-in-0 duration-300">
            <WithdrawalPanel
              availableXp={wallet.balance + wallet.pendingXp}
              prefill={withdrawPrefill}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 5: BADGES & ACHIEVEMENTS
            ═══════════════════════════════════════════════════════════════════════ */}
        {section === "badges" && (
          <div className="space-y-6 animate-in fade-in-0 duration-300">
            {/* Header & Total XP Award Progress */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 border border-violet-200 mb-2">
                    <Award className="size-3.5 text-violet-600" />
                    Milestones & Bounties
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">
                    Achievement Badges
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Earn permanent badges by reaching study streaks, high exam scores, and verified hours.
                    Each badge grants a one-time cash XP award.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <Trophy className="size-8 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Total Bounty Pool
                    </p>
                    <p className="text-lg font-bold text-slate-900">+1,300 XP Total</p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">
                    Collection: {earnedBadges} of {badges.length} Badges Unlocked
                  </span>
                  <span className="text-amber-600">
                    {Math.round((earnedBadges / badges.length) * 100)}% Complete
                  </span>
                </div>
                <Progress
                  value={(earnedBadges / badges.length) * 100}
                  className="h-2.5 [&>div]:bg-amber-500"
                />
              </div>
            </div>

            {/* Next to earn spotlight */}
            {nextBadge && BADGE_PROGRESS[nextBadge.name] && (
              (() => {
                const meta = badgeMeta[nextBadge.name];
                const Icon = meta?.icon ?? Award;
                const prog = BADGE_PROGRESS[nextBadge.name];
                const award = badges.find((b) => b.name === nextBadge.name)?.xpAward ?? 0;
                return (
                  <div className="rounded-3xl border border-brand-gold/40 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div
                        className={cn(
                          "flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                          meta.chip,
                        )}
                      >
                        <Icon className="size-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                            Next Target to Unlock
                          </span>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            +{award} XP Bounty
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-0.5">{nextBadge.name}</h3>
                        <p className="text-xs text-slate-600 mt-0.5">{meta.desc}</p>

                        <div className="mt-3 space-y-1 max-w-md">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{prog.current}</span>
                            <span className="font-bold text-slate-900">{prog.pct}%</span>
                          </div>
                          <Progress value={prog.pct} className="h-2 [&>div]:bg-brand-gold" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* All Badges Grid */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {badges.map((b) => {
                const meta = badgeMeta[b.name] ?? badgeMeta["First Steps"];
                const Icon = meta.icon;
                const prog = BADGE_PROGRESS[b.name];
                const isNext = b.name === nextBadge?.name;

                return (
                  <div
                    key={b.name}
                    className={cn(
                      "flex flex-col justify-between rounded-3xl border p-5 transition-all shadow-xs",
                      b.earned
                        ? "border-emerald-200/80 bg-white"
                        : isNext
                          ? "border-brand-gold/40 bg-white ring-1 ring-brand-gold/30"
                          : "border-slate-200/80 bg-slate-50/60",
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={cn(
                            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                            b.earned || isNext ? meta.chip : "bg-slate-200 text-slate-400",
                          )}
                        >
                          <Icon className="size-6" />
                        </div>

                        {b.earned ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3" /> Unlocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                            <Lock className="size-2.5" /> Locked
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <h3 className="font-bold text-sm text-slate-900">{b.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{meta.desc}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Bounty Award</span>
                        <span className="font-bold text-amber-600">+{b.xpAward} XP</span>
                      </div>

                      {!b.earned && prog && (
                        <div className="mt-2 space-y-1">
                          <Progress
                            value={prog.pct}
                            className={cn(
                              "h-1.5 rounded-full",
                              isNext ? "[&>div]:bg-amber-500" : "[&>div]:bg-slate-300",
                            )}
                          />
                          <p className="text-[10px] text-slate-400 text-right">{prog.pct}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 6: REFERRALS PANEL
            ═══════════════════════════════════════════════════════════════════════ */}
        {section === "referrals" && (
          <div className="animate-in fade-in-0 duration-300">
            <ReferralPanel />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 7: REDEMPTION HISTORY & AUDIT LEDGER
            ═══════════════════════════════════════════════════════════════════════ */}
        {section === "history" && (
          <div className="space-y-6 animate-in fade-in-0 duration-300">
            {/* Header & Stats */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 mb-2">
                    <ReceiptIcon className="size-3.5" />
                    Ledger Audit Trail
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-slate-900">
                    Redemption & Payout History
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Transparent transaction log of every cash payout, USDT transfer, profile frame, and VIP theme.
                  </p>
                </div>
              </div>

              {/* Stats row */}
              {activity.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Total XP Spent
                    </p>
                    <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      {activity.reduce((s, r) => s + r.xp, 0).toLocaleString()} XP
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Total Claims
                    </p>
                    <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      {activity.length} Records
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Awaiting Review
                    </p>
                    <p className="text-base sm:text-lg font-bold text-amber-600 mt-0.5">
                      {activity.filter((a) => a.status === "pending" || a.status === "approved").length} Requests
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search history by title..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
                {historySearch && (
                  <button
                    type="button"
                    onClick={() => setHistorySearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {(["all", "etb", "usdt", "theme", "adfree"] as const).map((filterKey) => {
                  const count = filterKey === "all"
                    ? activity.length
                    : activity.filter((i) => i.kind === filterKey).length;
                  const label = filterKey === "all"
                    ? "All"
                    : filterKey === "etb"
                      ? "ETB Cash"
                      : filterKey === "usdt"
                        ? "USDT"
                        : filterKey === "theme"
                          ? "Themes"
                          : "Perks";
                  return (
                    <button
                      key={filterKey}
                      type="button"
                      onClick={() => setHistoryFilter(filterKey as typeof historyFilter)}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all",
                        historyFilter === filterKey
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
                      )}
                    >
                      {label}
                      {count > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums",
                            historyFilter === filterKey
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* History List */}
            {activity.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
                <ReceiptIcon className="mx-auto mb-3 size-10 text-slate-300" />
                <p className="font-bold text-slate-900 text-base">No redemption records yet</p>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Redeem rewards from the store or cash out to see transactions here.
                </p>
                <Button
                  size="sm"
                  onClick={() => setSection("catalog")}
                  className="mt-4 bg-slate-900 text-white text-xs"
                >
                  Browse Store Catalog
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activity
                  .filter((item) => {
                    if (historyFilter !== "all" && item.kind !== historyFilter) return false;
                    if (historySearch.trim() && !item.title.toLowerCase().includes(historySearch.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .map((item) => {
                    const meta = kindMeta[item.kind];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-xl",
                              meta.chip,
                            )}
                          >
                            <Icon className="size-5" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                  meta.badge,
                                )}
                              >
                                {meta.label}
                              </span>
                              <StatusPill status={item.status} />
                            </div>
                            <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {item.date} · <strong className="text-slate-700">{item.xp.toLocaleString()} XP</strong>
                            </p>
                            {item.adminNote && (
                              <p className="mt-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-xs text-red-700">
                                Note: {item.adminNote}
                              </p>
                            )}
                          </div>
                        </div>

                        {(item.kind === "theme" || item.kind === "adfree") && (
                          <Link
                            to="/rewards/claim/$redemptionId"
                            params={{ redemptionId: item.id }}
                            className="self-start sm:self-center flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 transition-all shadow-xs"
                          >
                            <ReceiptIcon className="size-3.5 text-slate-500" />
                            View Digital Voucher
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

      {/* ═══════════════════════════════════════════════════════════════════════
          CONFIRMATION MODAL BEFORE SPENDING XP
          ═══════════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!confirmReward} onOpenChange={(open) => !open && setConfirmReward(null)}>
        <AlertDialogContent className="rounded-3xl">
          {confirmReward &&
            (() => {
              const meta = kindMeta[confirmReward.kind];
              const Icon = meta.icon;
              const balanceAfter = wallet.balance - confirmReward.xp;
              return (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif text-xl font-bold text-slate-900">
                      Confirm XP Redemption
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-slate-500">
                      This will deduct XP from your wallet and activate your perk immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          meta.chip,
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{confirmReward.title}</p>
                        <p className="text-slate-500">{meta.label}</p>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-200/80 pt-2 border-t border-slate-200/80">
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-500">XP Cost</span>
                        <span className="font-bold text-red-600 tabular-nums">
                          −{confirmReward.xp.toLocaleString()} XP
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-500">Wallet Balance After</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {balanceAfter.toLocaleString()} XP
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/60">
                      {confirmReward.kind === "theme"
                        ? "✨ Unlocks permanently on your account — equip any time from Profile Frames or the Store."
                        : adFreeActive
                          ? "⚡ Stacks on top of your existing ad-free days."
                          : "🛡️ Ads turn off immediately across Study2Earn."}
                    </p>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-brand-gold hover:brightness-110 font-bold text-xs rounded-xl"
                      onClick={confirmSpend}
                    >
                      Confirm Redemption
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </>
              );
            })()}
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          VIP THEMES SELECTOR DIALOG
          ═══════════════════════════════════════════════════════════════════════ */}
      <AlertDialog
        open={!!vipDialogReward}
        onOpenChange={(open) => !open && setVipDialogReward(null)}
      >
        <AlertDialogContent className="max-w-xl rounded-3xl">
          {vipDialogReward && (
            <VIPThemesSelector
              cost={vipDialogReward.xp}
              balance={wallet.balance}
              ownedGlows={ownedGlows}
              activeGlow={activeGlow}
              onEquip={(themeId, label) => {
                setActiveGlow(themeId);
                toast.success(`${label} equipped!`);
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
                toast.success(`${label} unlocked!`, {
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
    delivered: { label: "Delivered", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    pending: { label: "Pending Review", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Info },
    approved: { label: "Approved", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
    paid: { label: "Sent / Paid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    rejected: { label: "Rejected", cls: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "shrink-0 flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
        c.cls,
      )}
    >
      <Icon className="size-3" /> {c.label}
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
        <AlertDialogTitle className="font-serif text-slate-900 text-xl font-bold">
          Choose VIP Profile Theme
        </AlertDialogTitle>
        <AlertDialogDescription className="text-xs text-slate-500">
          Unlock exclusive VIP aura glow effects to make your avatar stand out on leaderboards and forum discussions.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="my-4 grid gap-6 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-center relative overflow-hidden">
          <p className="z-10 mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Selected Theme Live Preview
          </p>
          <div className="relative my-2 flex h-28 w-28 items-center justify-center">
            <span
              className={cn(
                "flex size-24 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white ring-8 transition-all duration-300",
                selectedTheme.ring,
                selectedTheme.shadow,
              )}
            >
              {initials}
            </span>
          </div>
          <p className="mt-4 text-sm font-bold text-slate-900">{selectedTheme.label}</p>
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
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                  selected === theme.id
                    ? "border-amber-500 bg-amber-50/20 shadow-xs ring-1 ring-amber-500/30"
                    : "border-slate-100 bg-white hover:border-slate-200",
                )}
              >
                <span className={cn("size-3.5 shrink-0 rounded-full", theme.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{theme.label}</p>
                  <p className="truncate text-[11px] text-slate-500">{theme.desc}</p>
                </div>
                {equipped ? (
                  <Badge className="bg-violet-100 text-[10px] text-violet-700 hover:bg-violet-100 font-bold">
                    Equipped
                  </Badge>
                ) : owned ? (
                  <Badge className="bg-emerald-100 text-[10px] text-emerald-700 hover:bg-emerald-100 font-bold">
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          {isOwned ? (
            <Button
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              disabled={isEquipped}
              onClick={() => onEquip(selected, selectedTheme.label)}
            >
              {isEquipped ? "Equipped" : "Equip"}
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-brand-gold hover:brightness-110 text-white rounded-xl text-xs font-bold"
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
