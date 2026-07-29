import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock3,
  Gem,
  GraduationCap,
  Medal,
  Search,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";

import { ComingSoonGate } from "@/components/coming-soon-gate";
import { RequireAuthClient } from "@/components/require-auth-client";
import { SiteHeader, SiteFooter, BackToTop } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useLeaderboardPrizes } from "@/hooks/use-leaderboard-prizes";
import { useWallet } from "@/hooks/use-wallet";
import { PRIZE_ICON_MAP, PRIZE_TINT_MAP } from "@/lib/leaderboard-prizes-store";
import { requireAuth } from "@/lib/require-auth";
import {
  leaderboard,
  leaderboardMonthly,
  leaderboardYearly,
  leaderboardByUniversity,
  universityStudents,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  beforeLoad: () => requireAuth("/leaderboard"),
  head: () => ({
    meta: [
      { title: "Leaderboard — Study2Earn" },
      {
        name: "description",
        content: "National ranking of Ethiopian freshman students by verified reading time and XP.",
      },
    ],
  }),
  component: LeaderboardPage,
});

type Tab = "weekly" | "monthly" | "yearly" | "university";

const TABS: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: "weekly", label: "Weekly", icon: Clock3, description: "This week's top scorers" },
  { id: "monthly", label: "Monthly", icon: CalendarDays, description: "This month's champions" },
  { id: "yearly", label: "Yearly", icon: Calendar, description: "This year's top scholars" },
  { id: "university", label: "By University", icon: Building2, description: "University rankings" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function trendColor(trend: string) {
  if (trend.startsWith("▲")) return "text-green-600 bg-green-50 border border-green-200";
  if (trend.startsWith("▼")) return "text-red-500 bg-red-50 border border-red-100";
  return "text-slate-400 bg-slate-50 border border-slate-200";
}

/* ── Professional rank tiers: every position on the board reads as a
   climb through Diamond → Platinum → Gold → Silver, not a flat number. ── */
type RankTier = "diamond" | "platinum" | "gold" | "silver";

const TIER_STYLES: Record<RankTier, { label: string; icon: typeof Gem; badge: string }> = {
  diamond: {
    label: "Diamond",
    icon: Gem,
    badge: "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md shadow-blue-500/30",
  },
  platinum: {
    label: "Platinum",
    icon: Award,
    badge: "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm shadow-slate-400/30",
  },
  gold: {
    label: "Gold",
    icon: Medal,
    badge:
      "bg-gradient-to-br from-brand-gold to-amber-500 text-white shadow-sm shadow-brand-gold/30",
  },
  silver: {
    label: "Silver",
    icon: Shield,
    badge: "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500",
  },
};

function getRankTier(rank: number): RankTier {
  if (rank === 1) return "diamond";
  if (rank <= 3) return "platinum";
  if (rank <= 6) return "gold";
  return "silver";
}

function RankBadge({
  rank,
  className,
  showIcon = true,
}: {
  rank: number;
  className?: string;
  showIcon?: boolean;
}) {
  const tier = TIER_STYLES[getRankTier(rank)];
  const Icon = tier.icon;
  return (
    <div className={cn("flex items-center gap-1.5 shrink-0", className)}>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl font-mono font-bold text-sm",
          tier.badge,
        )}
      >
        {String(rank).padStart(2, "0")}
      </span>
      {showIcon && (
        <span className="hidden sm:block" title={`${tier.label} tier`}>
          <Icon className="size-3.5 text-slate-300" />
        </span>
      )}
    </div>
  );
}

function LeaderboardPage() {
  return (
    <ComingSoonGate pageKey="leaderboard">
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <SiteHeader />
        <RequireAuthClient redirectTo="/leaderboard">
          <LeaderboardContent />
        </RequireAuthClient>
        <SiteFooter />
        <BackToTop />
      </div>
    </ComingSoonGate>
  );
}

function LeaderboardContent() {
  const { user } = useAuth();
  const wallet = useWallet();
  const { config: prizesConfig } = useLeaderboardPrizes();
  const [activeTab, setActiveTab] = useState<Tab>("weekly");

  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  function selectUniversity(name: string | null) {
    setSelectedUniversity(name);
    setSearchQuery("");
  }

  const tabData =
    activeTab === "weekly"
      ? leaderboard
      : activeTab === "monthly"
        ? leaderboardMonthly
        : activeTab === "yearly"
          ? leaderboardYearly
          : leaderboardByUniversity;

  const isUniversity = activeTab === "university";
  const studentData = isUniversity ? [] : (tabData as typeof leaderboard);
  const uniData = isUniversity ? (tabData as typeof leaderboardByUniversity) : [];

  const uniStudents = selectedUniversity ? (universityStudents[selectedUniversity] ?? []) : [];
  const uniInfo = uniData.find((u) => u.name === selectedUniversity);

  const [first, second, third, ...rest] = studentData;
  const myEntry = studentData.find((s) => s.id === user?.id);
  const myXp = wallet.lifetimeEarned;

  const tabInfo = TABS.find((t) => t.id === activeTab)!;

  const query = searchQuery.trim().toLowerCase();
  const filteredRest = query ? rest.filter((s) => s.name.toLowerCase().includes(query)) : rest;
  const filteredUniData = query
    ? uniData.filter((u) => u.name.toLowerCase().includes(query))
    : uniData;
  const filteredUniStudents = query
    ? uniStudents.filter((s) => s.name.toLowerCase().includes(query))
    : uniStudents;

  return (
    <main className="flex-1">
      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-br from-brand-navy via-[#1e2d5c] to-[#162042] text-white">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="size-5 text-brand-gold" />
            <p className="text-sm font-bold uppercase tracking-widest text-brand-gold">
              National Ranking
            </p>
            <Badge
              variant="secondary"
              className="text-[10px] uppercase tracking-wider bg-white/10 text-white/70 border-white/20"
            >
              Preview season
            </Badge>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-center">Leaderboard</h1>
          <p className="mt-3 text-white/60 text-center max-w-md mx-auto text-sm">
            Live rankings by verified reading time and XP. Demo data shown.
          </p>

          {/* ── Tab switcher ── */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery("");
                    setSelectedUniversity(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                    active
                      ? "bg-brand-gold text-white shadow-lg shadow-brand-gold/30"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10",
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* ── Year-end grand prizes (shown above everything, on every tab) ── */}
        <div className="relative overflow-hidden rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-brand-navy via-[#1e2d5c] to-[#162042] p-6 sm:p-8 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="size-5 text-brand-gold" />
            <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
              Year-End Grand Prizes
            </p>
          </div>
          <h2 className="font-serif text-2xl font-bold mb-1">{prizesConfig.tagline}</h2>
          <p className="text-sm text-white/60 mb-6 max-w-md">{prizesConfig.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {prizesConfig.prizes.map((p, i) => {
              const Icon = PRIZE_ICON_MAP[p.icon];
              return (
                <div
                  key={p.id}
                  className="animate-in fade-in-0 zoom-in-95 rounded-xl bg-white/5 border border-white/10 p-4 text-center"
                  style={{ animationDelay: `${i * 120}ms`, animationFillMode: "backwards" }}
                >
                  <div
                    className={cn(
                      "mx-auto mb-3 size-12 rounded-2xl bg-gradient-to-br grid place-items-center shadow-lg",
                      PRIZE_TINT_MAP[p.tint],
                    )}
                  >
                    <Icon className="size-6 text-white" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                    {p.rankLabel}
                  </p>
                  <p className="font-bold text-sm mt-0.5">{p.title}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-[11px] text-white/40">
            Preview season — final prize list confirmed before each yearly cycle ends.
          </p>
        </div>

        {/* ── Tab description chip ── */}
        <div className="flex items-center gap-2">
          <tabInfo.icon className="size-4 text-brand-gold" />
          <span className="text-sm font-semibold text-brand-navy">{tabInfo.description}</span>
          <span className="ml-auto text-xs text-slate-400 bg-white border border-slate-200 rounded-full px-3 py-1">
            Top 10
          </span>
        </div>

        {/* ── Search ── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isUniversity
                ? selectedUniversity
                  ? `Search students at ${selectedUniversity}…`
                  : "Search universities…"
                : "Search students…"
            }
            className="pl-10 bg-white"
          />
        </div>

        {/* ── Your stats card (student tabs only) ── */}
        {!isUniversity && user && (
          <div className="rounded-2xl border-2 border-brand-gold/40 bg-white p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-gradient-to-br from-brand-navy to-brand-gold text-white flex items-center justify-center font-serif font-bold ring-2 ring-brand-gold/40 ring-offset-2">
                {initials(user.name)}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                  Your stats
                </p>
                <p className="font-bold text-brand-navy">{user.name}</p>
                <p className="text-xs text-slate-500">{user.university}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-serif text-3xl font-bold text-brand-navy">
                {myEntry ? `#${myEntry.rank}` : "Unranked"}
              </p>
              <p className="text-sm text-slate-600">
                {myXp.toLocaleString()}{" "}
                <span className="text-brand-gold font-bold text-xs">XP</span> lifetime
              </p>
            </div>
          </div>
        )}

        {/* ── STUDENT TABS: Podium + table ── */}
        {!isUniversity && first && second && third && (
          <>
            {/* Podium */}
            <div className="flex items-end justify-center gap-3 sm:gap-6">
              {/* 2nd */}
              <div className="flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                <div className="size-14 rounded-full bg-gradient-to-br from-slate-300 to-slate-200 flex items-center justify-center font-serif font-bold text-slate-600 ring-2 ring-slate-300 ring-offset-1 text-sm">
                  {initials(second.name)}
                </div>
                <p className="text-xs font-bold text-center text-slate-700 leading-tight">
                  {second.name.split(" ")[0]}
                </p>
                <p className="text-[10px] text-slate-400 text-center leading-tight">{second.uni}</p>
                <p className="text-[10px] font-mono font-bold text-slate-500">
                  {second.xp.toLocaleString()} XP
                </p>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <Award className="size-2.5" />
                  Platinum
                </span>
                <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-b from-slate-200 to-slate-100 border border-slate-300 shadow-sm flex items-center justify-center">
                  <span className="text-3xl font-serif font-bold text-slate-500">2</span>
                </div>
              </div>

              {/* 1st */}
              <div className="flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                <p className="text-2xl">👑</p>
                <div className="size-16 rounded-full bg-gradient-to-br from-brand-gold to-amber-500 flex items-center justify-center font-serif font-bold text-white ring-2 ring-brand-gold ring-offset-2 shadow-lg shadow-brand-gold/30">
                  {initials(first.name)}
                </div>
                <p className="text-xs font-bold text-center text-brand-navy leading-tight">
                  {first.name.split(" ")[0]}
                </p>
                <p className="text-[10px] text-slate-400 text-center leading-tight">{first.uni}</p>
                <p className="text-[10px] font-mono font-bold text-brand-gold">
                  {first.xp.toLocaleString()} XP
                </p>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-cyan-600">
                  <Gem className="size-2.5" />
                  Diamond
                </span>
                <div className="w-full h-36 sm:h-44 rounded-t-2xl bg-gradient-to-b from-brand-gold/20 to-brand-gold/5 border-2 border-brand-gold/50 shadow-md flex items-center justify-center">
                  <span className="text-4xl font-serif font-bold text-brand-gold">1</span>
                </div>
              </div>

              {/* 3rd */}
              <div className="flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                <div className="size-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 flex items-center justify-center font-serif font-bold text-amber-700 ring-2 ring-amber-200 ring-offset-1 text-sm">
                  {initials(third.name)}
                </div>
                <p className="text-xs font-bold text-center text-slate-700 leading-tight">
                  {third.name.split(" ")[0]}
                </p>
                <p className="text-[10px] text-slate-400 text-center leading-tight">{third.uni}</p>
                <p className="text-[10px] font-mono font-bold text-amber-600">
                  {third.xp.toLocaleString()} XP
                </p>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <Award className="size-2.5" />
                  Platinum
                </span>
                <div className="w-full h-16 sm:h-20 rounded-t-2xl bg-gradient-to-b from-amber-100 to-amber-50 border border-amber-200 shadow-sm flex items-center justify-center">
                  <span className="text-2xl font-serif font-bold text-amber-600">3</span>
                </div>
              </div>
            </div>

            {/* Full list */}
            <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-brand-navy">Top 10 Scholars</h2>
                <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                  {tabInfo.label} ranking
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {filteredRest.length === 0 ? (
                  <div className="px-6 py-10 text-center text-slate-400 text-sm">
                    No students match "{searchQuery}"
                  </div>
                ) : (
                  filteredRest.map((s) => {
                    const isYou = s.name === user?.name;
                    return (
                      <div
                        key={s.rank}
                        className={cn(
                          "flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/60",
                          isYou && "bg-brand-gold/5",
                          s.rank === 1 && "font-bold",
                        )}
                      >
                        <RankBadge rank={s.rank} />
                        <div className="size-10 rounded-full bg-gradient-to-br from-brand-navy/15 to-brand-gold/15 flex items-center justify-center text-xs font-bold text-brand-navy shrink-0">
                          {initials(s.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-brand-navy">
                            {s.name}
                            {isYou && (
                              <span className="ml-2 text-[10px] font-bold uppercase text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {s.uni} · {s.hours}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-brand-navy">
                            {(isYou ? wallet.lifetimeEarned : s.xp).toLocaleString()}{" "}
                            <span className="text-[10px] text-brand-gold font-bold">XP</span>
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              trendColor(s.trend),
                            )}
                          >
                            {s.trend}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* ── UNIVERSITY TAB ── */}
        {isUniversity && !selectedUniversity && (
          <>
            {/* University podium */}
            <div className="flex items-end justify-center gap-3 sm:gap-6">
              {/* 2nd */}
              <button
                type="button"
                onClick={() => selectUniversity(uniData[1]?.name ?? null)}
                className="flex flex-col items-center gap-2 flex-1 max-w-[160px] group"
              >
                <div className="size-14 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-200 flex items-center justify-center ring-2 ring-slate-300 ring-offset-1 group-hover:ring-slate-400 transition-all">
                  <Building2 className="size-6 text-slate-500" />
                </div>
                <p className="text-xs font-bold text-center text-slate-700 leading-tight">
                  {uniData[1]?.name.replace(" University", "")}
                </p>
                <p className="text-[10px] text-slate-400 text-center">
                  {uniData[1]?.students.toLocaleString()} students
                </p>
                <p className="text-[10px] font-mono font-bold text-slate-500">
                  {uniData[1]?.totalXp.toLocaleString()} XP
                </p>
                <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-b from-slate-200 to-slate-100 border border-slate-300 shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                  <span className="text-3xl font-serif font-bold text-slate-500">2</span>
                </div>
              </button>

              {/* 1st */}
              <button
                type="button"
                onClick={() => selectUniversity(uniData[0]?.name ?? null)}
                className="flex flex-col items-center gap-2 flex-1 max-w-[160px] group"
              >
                <p className="text-2xl">🏛️</p>
                <div className="size-16 rounded-2xl bg-gradient-to-br from-brand-gold to-amber-500 flex items-center justify-center ring-2 ring-brand-gold ring-offset-2 shadow-lg shadow-brand-gold/30 group-hover:shadow-brand-gold/50 transition-all">
                  <Building2 className="size-7 text-white" />
                </div>
                <p className="text-xs font-bold text-center text-brand-navy leading-tight">
                  {uniData[0]?.name.replace(" University", "")}
                </p>
                <p className="text-[10px] text-slate-400 text-center">
                  {uniData[0]?.students.toLocaleString()} students
                </p>
                <p className="text-[10px] font-mono font-bold text-brand-gold">
                  {uniData[0]?.totalXp.toLocaleString()} XP
                </p>
                <div className="w-full h-36 sm:h-44 rounded-t-2xl bg-gradient-to-b from-brand-gold/20 to-brand-gold/5 border-2 border-brand-gold/50 shadow-md flex items-center justify-center group-hover:shadow-lg transition-shadow">
                  <span className="text-4xl font-serif font-bold text-brand-gold">1</span>
                </div>
              </button>

              {/* 3rd */}
              <button
                type="button"
                onClick={() => selectUniversity(uniData[2]?.name ?? null)}
                className="flex flex-col items-center gap-2 flex-1 max-w-[160px] group"
              >
                <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-100 flex items-center justify-center ring-2 ring-amber-200 ring-offset-1 group-hover:ring-amber-300 transition-all">
                  <Building2 className="size-5 text-amber-600" />
                </div>
                <p className="text-xs font-bold text-center text-slate-700 leading-tight">
                  {uniData[2]?.name.replace(" University", "")}
                </p>
                <p className="text-[10px] text-slate-400 text-center">
                  {uniData[2]?.students.toLocaleString()} students
                </p>
                <p className="text-[10px] font-mono font-bold text-amber-600">
                  {uniData[2]?.totalXp.toLocaleString()} XP
                </p>
                <div className="w-full h-16 sm:h-20 rounded-t-2xl bg-gradient-to-b from-amber-100 to-amber-50 border border-amber-200 shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                  <span className="text-2xl font-serif font-bold text-amber-600">3</span>
                </div>
              </button>
            </div>

            {/* University table */}
            <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-brand-navy flex items-center gap-2">
                  <Building2 className="size-5 text-brand-gold" />
                  University Rankings
                </h2>
                <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                  <Users className="size-3" />
                  Click to see student rankings
                </span>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-12 px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 border-b border-slate-100">
                <span className="col-span-1">#</span>
                <span className="col-span-4">University</span>
                <span className="col-span-2 text-center">Students</span>
                <span className="col-span-2 text-center">Total XP</span>
                <span className="col-span-2 text-center">Avg XP</span>
                <span className="col-span-1 text-right">
                  <span className="hidden sm:inline">Trend</span>
                </span>
              </div>

              <div className="divide-y divide-slate-50">
                {filteredUniData.length === 0 ? (
                  <div className="px-6 py-10 text-center text-slate-400 text-sm">
                    No universities match "{searchQuery}"
                  </div>
                ) : (
                  filteredUniData.map((u) => {
                    const isMyUni = u.name === user?.university;
                    return (
                      <button
                        key={u.rank}
                        type="button"
                        onClick={() => selectUniversity(u.name)}
                        className={cn(
                          "grid grid-cols-12 items-center w-full px-6 py-4 text-left transition-all hover:bg-brand-navy/3 hover:shadow-sm group",
                          isMyUni && "bg-brand-gold/5",
                        )}
                      >
                        {/* Rank */}
                        <span className="col-span-1">
                          <span
                            className={cn(
                              "flex size-8 items-center justify-center rounded-lg font-mono font-bold text-xs",
                              TIER_STYLES[getRankTier(u.rank)].badge,
                            )}
                          >
                            {String(u.rank).padStart(2, "0")}
                          </span>
                        </span>

                        {/* Name + city + top student */}
                        <div className="col-span-4 min-w-0">
                          <p
                            className={cn(
                              "font-semibold text-sm truncate group-hover:text-brand-navy transition-colors",
                              isMyUni ? "text-brand-navy" : "text-slate-800",
                            )}
                          >
                            {u.name}
                            {isMyUni && (
                              <span className="ml-1.5 text-[9px] font-bold uppercase text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 rounded">
                                Your uni
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {u.city} · Top: {u.topStudent.split(" ")[0]}
                          </p>
                        </div>

                        {/* Students */}
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-semibold text-brand-navy">
                            {u.students.toLocaleString()}
                          </span>
                          <p className="text-[10px] text-slate-400">students</p>
                        </div>

                        {/* Total XP */}
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-bold text-brand-navy">
                            {(u.totalXp / 1000).toFixed(0)}k
                          </span>
                          <span className="text-[10px] text-brand-gold font-bold ml-0.5">XP</span>
                        </div>

                        {/* Avg XP */}
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-semibold text-slate-600">{u.avgXp}</span>
                          <p className="text-[10px] text-slate-400">avg</p>
                        </div>

                        {/* Trend + chevron */}
                        <div className="col-span-1 flex items-center justify-end gap-1">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded hidden sm:inline",
                              trendColor(u.trend),
                            )}
                          >
                            {u.trend}
                          </span>
                          <ChevronRight className="size-4 text-slate-300 group-hover:text-brand-navy group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* ── UNIVERSITY DRILL-DOWN: student rankings ── */}
        {isUniversity && selectedUniversity && (
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {/* Back button + header */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => selectUniversity(null)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-navy transition-colors mb-4 group"
              >
                <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to University Rankings
              </button>

              <div className="rounded-2xl border-2 border-brand-navy/15 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-navy text-white shadow-md">
                    <Building2 className="size-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold mb-0.5">
                      University Ranking #{uniInfo?.rank}
                    </p>
                    <h2 className="font-serif text-xl font-bold text-brand-navy">
                      {selectedUniversity}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {uniInfo?.city} · {uniInfo?.students.toLocaleString()} enrolled students
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="font-serif text-2xl font-bold text-brand-navy">
                      {uniInfo ? (uniInfo.totalXp / 1000).toFixed(0) : "—"}k
                    </p>
                    <p className="text-[10px] text-brand-gold font-bold uppercase">Total XP</p>
                  </div>
                  <div className="border-l border-slate-100 pl-6">
                    <p className="font-serif text-2xl font-bold text-brand-navy">
                      {uniInfo?.avgXp ?? "—"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Avg XP</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Student ranking table */}
            <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-brand-navy flex items-center gap-2">
                  <GraduationCap className="size-5 text-brand-gold" />
                  Top Students — {selectedUniversity}
                </h3>
                <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                  {query
                    ? `${filteredUniStudents.length} matching`
                    : `${uniStudents.length} ranked`}
                </span>
              </div>

              {uniStudents.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400 text-sm">
                  No student data available for this university yet.
                </div>
              ) : filteredUniStudents.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400 text-sm">
                  No students match "{searchQuery}"
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredUniStudents.map((s) => {
                    const isYou = s.name === user?.name;
                    const podiumStyles =
                      s.rank === 1
                        ? "bg-brand-gold/5 font-bold"
                        : s.rank === 2
                          ? "bg-slate-50/70"
                          : s.rank === 3
                            ? "bg-amber-50/40"
                            : "";
                    return (
                      <div
                        key={s.rank}
                        className={cn(
                          "flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/60",
                          podiumStyles,
                          isYou && "bg-brand-gold/10 ring-1 ring-inset ring-brand-gold/20",
                        )}
                      >
                        {/* Rank badge */}
                        <div className="relative shrink-0">
                          <RankBadge rank={s.rank} showIcon={false} />
                          {s.rank === 1 && (
                            <span className="absolute -top-2 -right-2 text-sm leading-none">
                              👑
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="size-10 rounded-full bg-gradient-to-br from-brand-navy/15 to-brand-gold/15 flex items-center justify-center text-xs font-bold text-brand-navy shrink-0">
                          {initials(s.name)}
                        </div>

                        {/* Name + dept */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-brand-navy truncate">
                            {s.name}
                            {isYou && (
                              <span className="ml-2 text-[10px] font-bold uppercase text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                            <GraduationCap className="size-3 shrink-0" />
                            {s.department} · {s.hours}
                          </p>
                        </div>

                        {/* XP + trend */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-brand-navy">
                            {(isYou ? wallet.lifetimeEarned : s.xp).toLocaleString()}{" "}
                            <span className="text-[10px] text-brand-gold font-bold">XP</span>
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              trendColor(s.trend),
                            )}
                          >
                            {s.trend}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
