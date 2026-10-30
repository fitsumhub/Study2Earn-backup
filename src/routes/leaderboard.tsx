import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Flame,
  Gem,
  GraduationCap,
  Medal,
  Search,
  Share2,
  Shield,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { ComingSoonGate } from "@/components/coming-soon-gate";
import { ProfileFrameAvatar } from "@/components/frames/ProfileFrameAvatar";
import { RequireAuthClient } from "@/components/require-auth-client";
import { BackToTop, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useFrames } from "@/hooks/use-frames";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useLeaderboardPrizes } from "@/hooks/use-leaderboard-prizes";
import { useWallet } from "@/hooks/use-wallet";
import { PRIZE_ICON_MAP, PRIZE_TINT_MAP } from "@/lib/leaderboard-prizes-store";
import type { LeaderboardStudent, UniversityStudent } from "@/lib/leaderboard-store";
import { resolveMediaUrl } from "@/lib/media-store";
import { requireAuth } from "@/lib/require-auth";
import { xpToEtb } from "@/lib/withdrawal-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  beforeLoad: () => requireAuth("/leaderboard"),
  head: () => ({
    meta: [
      { title: "National Leaderboard — Study2Earn" },
      {
        name: "description",
        content:
          "Official national ranking of Ethiopian university scholars by verified reading time, study progression, and XP.",
      },
    ],
  }),
  component: LeaderboardPage,
});

type Tab = "weekly" | "monthly" | "yearly" | "university";

const TABS: { id: Tab; label: string; icon: React.ElementType; description: string; cadence: string }[] = [
  { id: "weekly", label: "Weekly Sprint", icon: Clock3, description: "Current week's highest study hours & XP", cadence: "Resets every Sunday at midnight" },
  { id: "monthly", label: "Monthly Season", icon: CalendarDays, description: "Monthly academic championship standings", cadence: "Season ends on the 30th" },
  { id: "yearly", label: "Annual Scholars", icon: Calendar, description: "National annual scholarship & grand prize race", cadence: "Academic Year 2026 Season" },
  { id: "university", label: "By University", icon: Building2, description: "Inter-university competition across Ethiopia", cadence: "Real-time campus aggregates" },
];

const ETHIOPIAN_UNIVERSITIES = [
  "All Universities",
  "Addis Ababa University",
  "Bahir Dar University",
  "Hawassa University",
  "Mekelle University",
  "Jimma University",
  "Adama Science and Technology University",
  "Arba Minch University",
  "University of Gondar",
  "Haramaya University",
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
  if (trend.startsWith("▲"))
    return "text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  if (trend.startsWith("▼"))
    return "text-rose-600 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
  return "text-slate-500 bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
}

type RankTier = "diamond" | "platinum" | "gold" | "silver";

const TIER_STYLES: Record<
  RankTier,
  { label: string; icon: typeof Gem; badge: string; pill: string; border: string }
> = {
  diamond: {
    label: "Diamond Scholar",
    icon: Gem,
    badge: "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md shadow-cyan-500/30",
    pill: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300",
    border: "border-cyan-400",
  },
  platinum: {
    label: "Platinum Scholar",
    icon: Award,
    badge: "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-800 shadow-md shadow-slate-300/30",
    pill: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200",
    border: "border-slate-300",
  },
  gold: {
    label: "Gold Scholar",
    icon: Medal,
    badge: "bg-gradient-to-br from-amber-400 via-brand-gold to-amber-600 text-slate-950 shadow-md shadow-amber-500/30",
    pill: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
    border: "border-amber-400",
  },
  silver: {
    label: "Silver Scholar",
    icon: Shield,
    badge: "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 border border-slate-300",
    pill: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400",
    border: "border-slate-200",
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
          "flex size-8 sm:size-9 items-center justify-center rounded-xl font-mono font-bold text-xs sm:text-sm tracking-tight",
          tier.badge,
        )}
      >
        {String(rank).padStart(2, "0")}
      </span>
      {showIcon && (
        <span className="hidden sm:block" title={`${tier.label}`}>
          <Icon className="size-3.5 text-slate-400" />
        </span>
      )}
    </div>
  );
}

function LeaderboardPage() {
  return (
    <ComingSoonGate pageKey="leaderboard">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col selection:bg-brand-gold/30">
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
  const { equipped: equippedFrame } = useFrames();
  const { config: prizesConfig } = useLeaderboardPrizes();
  const { getBoard, uniRankings, getUniStudents } = useLeaderboard();

  const [activeTab, setActiveTab] = useState<Tab>("weekly");
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUniversity, setFilterUniversity] = useState("All Universities");
  const [filterTrack, setFilterTrack] = useState("all");

  // Interactive Student Profile Modal
  const [inspectedStudent, setInspectedStudent] = useState<LeaderboardStudent | UniversityStudent | null>(null);
  const [kudosSent, setKudosSent] = useState(false);

  function selectUniversity(name: string | null) {
    setSelectedUniversity(name);
    setSearchQuery("");
  }

  const isUniversity = activeTab === "university";
  const rawStudentData = isUniversity ? [] : getBoard(activeTab as "weekly" | "monthly" | "yearly");
  const uniData = isUniversity ? uniRankings : [];

  const uniStudents = selectedUniversity ? getUniStudents(selectedUniversity) : [];
  const uniInfo = uniData.find((u) => u.name === selectedUniversity);

  // Filter student dataset based on search, university dropdown, and track
  const studentData = useMemo(() => {
    if (isUniversity) return [];
    return rawStudentData.filter((s) => {
      if (filterUniversity !== "All Universities" && s.uni !== filterUniversity) return false;
      if (filterTrack !== "all") {
        const d = (s.department || "").toLowerCase();
        if (filterTrack === "tech" && !d.includes("computer") && !d.includes("software") && !d.includes("eng")) return false;
        if (filterTrack === "med" && !d.includes("med") && !d.includes("health") && !d.includes("pharm")) return false;
        if (filterTrack === "natural" && !d.includes("phys") && !d.includes("chem") && !d.includes("bio") && !d.includes("math")) return false;
        if (filterTrack === "business" && !d.includes("econ") && !d.includes("mgmt") && !d.includes("acc") && !d.includes("biz")) return false;
      }
      return true;
    });
  }, [rawStudentData, filterUniversity, filterTrack, isUniversity]);

  const [first, second, third, ...rest] = studentData;
  const myEntry = rawStudentData.find((s) => s.isYou || s.id === user?.id || s.name === user?.name);
  const myXp = wallet.lifetimeEarned;

  const tabInfo = TABS.find((t) => t.id === activeTab)!;

  const query = searchQuery.trim().toLowerCase();
  const filteredRest = query ? rest.filter((s) => s.name.toLowerCase().includes(query)) : rest;
  const filteredUniData = query
    ? uniData.filter((u) => u.name.toLowerCase().includes(query) || u.city.toLowerCase().includes(query))
    : uniData;
  const filteredUniStudents = query
    ? uniStudents.filter((s) => s.name.toLowerCase().includes(query) || s.department.toLowerCase().includes(query))
    : uniStudents;

  // Calculate Next Rank Gap
  const nextTargetRank = useMemo(() => {
    if (!myEntry || myEntry.rank <= 1) return null;
    const higherIndex = studentData.findIndex((s) => s.rank === myEntry.rank - 1);
    if (higherIndex >= 0) {
      const target = studentData[higherIndex];
      const gap = Math.max(0, target.xp - myXp);
      return { targetName: target.name, targetRank: target.rank, xpGap: gap };
    }
    return null;
  }, [myEntry, studentData, myXp]);

  const handleShareRank = () => {
    const text = `I'm ranked #${myEntry?.rank ?? "12"} nationally on Study2Earn with ${myXp.toLocaleString()} XP! Check out the Ethiopian student leaderboard: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    toast.success("Leaderboard link & your rank copied to clipboard!", {
      description: "Share on Telegram or WhatsApp with your classmates.",
    });
  };

  const handleSendKudos = (studentName: string) => {
    setKudosSent(true);
    toast.success(`Sent high-five kudos to ${studentName}! 🎉`, {
      description: "Recognizing academic excellence inspires Ethiopian scholars.",
    });
    setTimeout(() => setKudosSent(false), 2500);
  };

  return (
    <main className="flex-1 pb-16">
      {/* ── Magnificent Atmospheric Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white border-b border-indigo-900/30">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-indigo-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute -top-12 right-12 w-64 h-64 bg-amber-400/10 blur-[90px] pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-300 shadow-sm backdrop-blur mb-4">
            <Trophy className="size-3.5 text-amber-400 animate-pulse" />
            <span className="uppercase tracking-widest text-[11px] font-bold">
              Ministry of Education Exit-Exam League
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Ethiopian National Leaderboard
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Live national rankings of university scholars by verified study hours, exit exam readiness,
            and XP rewards. Compete nationally to earn real scholarship prizes.
          </p>

          {/* Quick Stats Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 backdrop-blur">
              <Flame className="size-3.5 text-amber-400" />
              <span>50,000 ETB Prize Pool</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 backdrop-blur">
              <Building2 className="size-3.5 text-blue-400" />
              <span>15 Public Universities</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 backdrop-blur">
              <Zap className="size-3.5 text-emerald-400" />
              <span>Verified MoE Question Bank</span>
            </span>
          </div>

          {/* ── Modern Segmented Tab Switcher ── */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur max-w-fit mx-auto shadow-xl">
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
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer",
                    active
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/25"
                      : "text-slate-300 hover:text-white hover:bg-white/10",
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
        {/* ── Luxury Grand Prizes Showcase (Yearly & All Seasons) ── */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 size-56 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="size-4 text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                  Annual Scholarship Awards
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                {prizesConfig.tagline}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mt-0.5">
                {prizesConfig.description}
              </p>
            </div>

            <Badge
              variant="outline"
              className="bg-amber-400/10 border-amber-400/30 text-amber-300 text-xs px-3 py-1 self-start sm:self-auto font-mono"
            >
              Verified Payout Cycle
            </Badge>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {prizesConfig.prizes.map((p, i) => {
              const Icon = PRIZE_ICON_MAP[p.icon] || Trophy;
              const isRankOne = p.rankLabel.includes("1st");
              return (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-2xl border p-4 text-center transition-all duration-200 relative group overflow-hidden",
                    isRankOne
                      ? "bg-gradient-to-b from-amber-500/15 to-white/5 border-amber-400/50 shadow-lg shadow-amber-500/10"
                      : "bg-white/5 border-white/10 hover:border-white/20",
                  )}
                >
                  {isRankOne && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
                  )}

                  <div
                    className={cn(
                      "mx-auto mb-3 size-12 rounded-2xl bg-gradient-to-br grid place-items-center shadow-lg transition-transform group-hover:scale-105",
                      PRIZE_TINT_MAP[p.tint] || "from-amber-400 to-amber-600",
                    )}
                  >
                    <Icon className="size-6 text-white" />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    {p.rankLabel}
                  </span>
                  <p className="font-bold text-sm text-white mt-0.5 leading-tight">{p.title}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-[11px] text-slate-400">
            <span>Official university student leaderboard verified by MoE syllabus performance.</span>
            <span className="font-mono text-amber-300">SLA: Guaranteed Payout via CBE / Telebirr</span>
          </div>
        </div>

        {/* ── Active Student Standing & Rank Overtake Target ── */}
        {!isUniversity && user && (
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <ProfileFrameAvatar
                  initials={initials(user.name)}
                  avatarUrl={resolveMediaUrl(user.avatarUrl)}
                  frameId={equippedFrame}
                  size="md"
                  equipped={!!equippedFrame}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                      Your Standing
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {user.university}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {user.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {user.department ? `${user.department} · ` : ""}
                    Verified Ethiopian Scholar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="text-right">
                  <p className="font-serif text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                    {myEntry ? `#${myEntry.rank}` : "#12"}
                  </p>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {myXp.toLocaleString()}{" "}
                    <span className="text-[10px] uppercase font-bold">XP</span>
                    <span className="text-slate-400 font-normal"> (≈ {xpToEtb(myXp)} ETB)</span>
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleShareRank}
                  className="h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer"
                >
                  <Share2 className="size-3.5 mr-1 text-slate-500" />
                  Share
                </Button>
              </div>
            </div>

            {/* Overtake Progress Bar */}
            {nextTargetRank && (
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Target className="size-3.5 text-brand-gold shrink-0" />
                  <span>
                    Only <strong className="text-slate-900 dark:text-white font-mono">{nextTargetRank.xpGap.toLocaleString()} XP</strong> needed to overtake{" "}
                    <strong>{nextTargetRank.targetName}</strong> for #{nextTargetRank.targetRank}!
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={Math.max(15, 100 - (nextTargetRank.xpGap / (myXp + 1)) * 100)} className="w-32 h-2" />
                  <span className="text-[10px] font-mono text-slate-400">In Reach</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Filters & Search Studio ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <tabInfo.icon className="size-4 text-brand-gold" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {tabInfo.description}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">({tabInfo.cadence})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isUniversity && (
              <>
                <Select value={filterUniversity} onValueChange={setFilterUniversity}>
                  <SelectTrigger className="h-9 w-44 text-xs bg-white dark:bg-slate-900">
                    <SelectValue placeholder="University" />
                  </SelectTrigger>
                  <SelectContent>
                    {ETHIOPIAN_UNIVERSITIES.map((u) => (
                      <SelectItem key={u} value={u} className="text-xs">
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterTrack} onValueChange={setFilterTrack}>
                  <SelectTrigger className="h-9 w-36 text-xs bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Field of Study" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Academic Tracks
                    </SelectItem>
                    <SelectItem value="tech" className="text-xs">
                      Engineering & CS
                    </SelectItem>
                    <SelectItem value="med" className="text-xs">
                      Health & Medicine
                    </SelectItem>
                    <SelectItem value="natural" className="text-xs">
                      Natural Science
                    </SelectItem>
                    <SelectItem value="business" className="text-xs">
                      Business & Econ
                    </SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isUniversity
                    ? selectedUniversity
                      ? `Search ${selectedUniversity}…`
                      : "Search universities…"
                    : "Search scholar by name…"
                }
                className="pl-8 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* ── STUDENT TAB: 3D Champion Podium & Roster ── */}
        {!isUniversity && first && second && third && (
          <>
            {/* The Hall of Champions Podium */}
            <div className="relative pt-6 pb-2">
              <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-2xl mx-auto">
                {/* 🥈 #2 Platinum Scholar */}
                <div
                  onClick={() => setInspectedStudent(second)}
                  className="flex flex-col items-center gap-1.5 flex-1 max-w-[170px] cursor-pointer group"
                >
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    🥈 Rank #2
                  </span>
                  <div className="relative my-1">
                    <ProfileFrameAvatar
                      initials={initials(second.name)}
                      avatarUrl={resolveMediaUrl(second.avatarUrl)}
                      frameId={second.isYou ? equippedFrame : undefined}
                      size="md"
                      equipped={second.isYou && !!equippedFrame}
                    />
                  </div>
                  <p className="text-xs font-bold text-center text-slate-900 dark:text-white leading-tight truncate w-full group-hover:text-indigo-600 transition">
                    {second.name}
                  </p>
                  <p className="text-[10px] text-slate-400 text-center truncate w-full">
                    {second.uni.replace(" University", "")}
                  </p>
                  <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    <span>{second.xp.toLocaleString()} XP</span>
                    <span className="text-slate-400 font-normal">· {second.hours}</span>
                  </div>

                  {/* 2nd Pedestal */}
                  <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-700 shadow-md flex flex-col items-center justify-center group-hover:border-slate-400 transition">
                    <span className="text-3xl font-serif font-bold text-slate-500 dark:text-slate-300">
                      2
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Platinum
                    </span>
                  </div>
                </div>

                {/* 🥇 #1 Diamond National Champion */}
                <div
                  onClick={() => setInspectedStudent(first)}
                  className="flex flex-col items-center gap-1.5 flex-1 max-w-[190px] cursor-pointer group"
                >
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 shadow-xs">
                    <span>👑 Champion</span>
                  </div>
                  <div className="relative my-1">
                    <ProfileFrameAvatar
                      initials={initials(first.name)}
                      avatarUrl={resolveMediaUrl(first.avatarUrl)}
                      frameId={first.isYou ? equippedFrame || "golden-scholar" : "golden-scholar"}
                      size="lg"
                      equipped
                    />
                    <span className="absolute -top-1 -right-1 text-sm">✨</span>
                  </div>
                  <p className="text-sm font-extrabold text-center text-slate-900 dark:text-white leading-tight truncate w-full group-hover:text-amber-500 transition">
                    {first.name}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 text-center truncate w-full">
                    {first.uni.replace(" University", "")}
                  </p>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span>{first.xp.toLocaleString()} XP</span>
                    <span className="text-slate-400 font-normal">· {first.hours}</span>
                  </div>

                  {/* 1st Pedestal */}
                  <div className="w-full h-36 sm:h-44 rounded-t-2xl bg-gradient-to-b from-amber-500/20 via-amber-400/10 to-amber-500/5 dark:from-amber-500/30 dark:to-slate-900 border-2 border-amber-400/60 shadow-xl flex flex-col items-center justify-center group-hover:border-amber-400 transition">
                    <span className="text-4xl sm:text-5xl font-serif font-black text-amber-500 dark:text-amber-400">
                      1
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      Diamond
                    </span>
                  </div>
                </div>

                {/* 🥉 #3 Gold Scholar */}
                <div
                  onClick={() => setInspectedStudent(third)}
                  className="flex flex-col items-center gap-1.5 flex-1 max-w-[170px] cursor-pointer group"
                >
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    🥉 Rank #3
                  </span>
                  <div className="relative my-1">
                    <ProfileFrameAvatar
                      initials={initials(third.name)}
                      avatarUrl={resolveMediaUrl(third.avatarUrl)}
                      frameId={third.isYou ? equippedFrame : undefined}
                      size="md"
                      equipped={third.isYou && !!equippedFrame}
                    />
                  </div>
                  <p className="text-xs font-bold text-center text-slate-900 dark:text-white leading-tight truncate w-full group-hover:text-indigo-600 transition">
                    {third.name}
                  </p>
                  <p className="text-[10px] text-slate-400 text-center truncate w-full">
                    {third.uni.replace(" University", "")}
                  </p>
                  <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-500">
                    <span>{third.xp.toLocaleString()} XP</span>
                    <span className="text-slate-400 font-normal">· {third.hours}</span>
                  </div>

                  {/* 3rd Pedestal */}
                  <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-b from-amber-100 to-amber-50/50 dark:from-amber-950/40 dark:to-slate-900 border border-amber-300 dark:border-amber-800 shadow-md flex flex-col items-center justify-center group-hover:border-amber-400 transition">
                    <span className="text-2xl font-serif font-bold text-amber-700 dark:text-amber-400">
                      3
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600/80">
                      Gold
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Top Scholars Roster */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                    National Roster Standings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click any student to view their academic breakdown & study habits.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  {filteredRest.length + 3} Scholars Ranked
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRest.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-400 text-sm">
                    No scholars match "{searchQuery}"
                  </div>
                ) : (
                  filteredRest.map((s) => {
                    const isYou = s.isYou || s.id === user?.id || s.name === user?.name;
                    return (
                      <div
                        key={`${s.id || s.name}-${s.rank}`}
                        onClick={() => setInspectedStudent(s)}
                        className={cn(
                          "flex items-center gap-3.5 sm:gap-4 px-4 sm:px-6 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer group",
                          isYou && "bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-inset ring-amber-400/30",
                        )}
                      >
                        <RankBadge rank={s.rank} />

                        <ProfileFrameAvatar
                          initials={initials(s.name)}
                          avatarUrl={resolveMediaUrl(s.avatarUrl)}
                          frameId={isYou ? equippedFrame : undefined}
                          size="xs"
                          equipped={isYou && !!equippedFrame}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition">
                              {s.name}
                            </p>
                            {isYou && (
                              <span className="text-[10px] font-extrabold uppercase text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {s.uni}
                            </span>
                            {s.department && <span>· {s.department}</span>}
                            <span>·</span>
                            <span className="font-mono text-slate-400 flex items-center gap-0.5">
                              <BookOpen className="size-2.5" /> {s.hours}
                            </span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-mono">
                            {s.xp.toLocaleString()}{" "}
                            <span className="text-[10px] text-brand-gold font-bold">XP</span>
                          </p>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block", trendColor(s.trend))}>
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

        {/* ── UNIVERSITY TAB: Campus League Table ── */}
        {isUniversity && !selectedUniversity && (
          <div className="space-y-6">
            {/* University Table */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="size-5 text-brand-gold" />
                    University Leaderboard Standings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aggregated exit-exam preparation performance across Ethiopian public campuses.
                  </p>
                </div>
                <span className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  Click university for campus rankings →
                </span>
              </div>

              {/* Table Headers */}
              <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                <span className="col-span-1">#</span>
                <span className="col-span-5">University Campus</span>
                <span className="col-span-2 text-center">Active Scholars</span>
                <span className="col-span-2 text-center">Total XP Volume</span>
                <span className="col-span-1 text-center">Avg XP</span>
                <span className="col-span-1 text-right">Trend</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUniData.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-400 text-sm">
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
                          "grid grid-cols-12 items-center w-full px-6 py-4 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group",
                          isMyUni && "bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-inset ring-amber-400/30",
                        )}
                      >
                        <span className="col-span-1">
                          <span
                            className={cn(
                              "flex size-7 items-center justify-center rounded-lg font-mono font-bold text-xs",
                              TIER_STYLES[getRankTier(u.rank)].badge,
                            )}
                          >
                            {String(u.rank).padStart(2, "0")}
                          </span>
                        </span>

                        <div className="col-span-5 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition">
                              {u.name}
                            </p>
                            {isMyUni && (
                              <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded shrink-0">
                                Your Uni
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {u.city} · Top Scholar: <strong className="text-slate-600 dark:text-slate-300">{u.topStudent}</strong>
                          </p>
                        </div>

                        <div className="col-span-2 text-center">
                          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                            {u.students.toLocaleString()}
                          </span>
                          <p className="text-[10px] text-slate-400">students</p>
                        </div>

                        <div className="col-span-2 text-center">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
                            {(u.totalXp / 1000).toFixed(0)}k{" "}
                            <span className="text-[10px] text-amber-500 font-bold">XP</span>
                          </span>
                        </div>

                        <div className="col-span-1 text-center">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                            {u.avgXp}
                          </span>
                        </div>

                        <div className="col-span-1 flex items-center justify-end gap-1">
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", trendColor(u.trend))}>
                            {u.trend}
                          </span>
                          <ChevronRight className="size-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── UNIVERSITY CAMPUS DRILL-DOWN ── */}
        {isUniversity && selectedUniversity && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <button
              type="button"
              onClick={() => selectUniversity(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="size-4" /> Back to University Rankings
            </button>

            {/* University Campus Overview Banner */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
                  <Building2 className="size-7 text-brand-gold" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                    National Standing #{uniInfo?.rank}
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedUniversity}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {uniInfo?.city} · {uniInfo?.students.toLocaleString()} active students enrolled
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-6 text-center">
                <div>
                  <p className="font-serif text-2xl font-bold text-slate-900 dark:text-white font-mono">
                    {uniInfo ? (uniInfo.totalXp / 1000).toFixed(0) : "—"}k
                  </p>
                  <p className="text-[10px] text-amber-500 font-bold uppercase">Total XP</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-slate-900 dark:text-white font-mono">
                    {uniInfo?.avgXp ?? "—"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Avg XP</p>
                </div>
              </div>
            </div>

            {/* Campus Students Table */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="size-4.5 text-brand-gold" />
                  Top Scholars at {selectedUniversity}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {filteredUniStudents.length} Campus Scholars
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUniStudents.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-400 text-sm">
                    No scholars found matching query.
                  </div>
                ) : (
                  filteredUniStudents.map((s) => {
                    const isYou = s.isYou || s.id === user?.id || s.name === user?.name;
                    return (
                      <div
                        key={`${s.id || s.name}-${s.rank}`}
                        onClick={() => setInspectedStudent(s)}
                        className={cn(
                          "flex items-center gap-3.5 sm:gap-4 px-6 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group",
                          isYou && "bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-inset ring-amber-400/30",
                        )}
                      >
                        <RankBadge rank={s.rank} showIcon={false} />

                        <ProfileFrameAvatar
                          initials={initials(s.name)}
                          avatarUrl={resolveMediaUrl(s.avatarUrl)}
                          frameId={isYou ? equippedFrame : undefined}
                          size="xs"
                          equipped={isYou && !!equippedFrame}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition">
                            {s.name}
                            {isYou && (
                              <span className="ml-2 text-[9px] font-extrabold uppercase text-amber-700 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {s.department} · {s.hours} verified
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-mono">
                            {s.xp.toLocaleString()}{" "}
                            <span className="text-[10px] text-brand-gold font-bold">XP</span>
                          </p>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block", trendColor(s.trend))}>
                            {s.trend}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Interactive Student Scholar Profile Modal ── */}
      <Dialog open={Boolean(inspectedStudent)} onOpenChange={(open) => !open && setInspectedStudent(null)}>
        <DialogContent className="max-w-md">
          {inspectedStudent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <ProfileFrameAvatar
                    initials={initials(inspectedStudent.name)}
                    avatarUrl={resolveMediaUrl(inspectedStudent.avatarUrl)}
                    frameId={inspectedStudent.isYou ? equippedFrame : undefined}
                    size="md"
                    equipped={inspectedStudent.isYou && !!equippedFrame}
                  />
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                      {inspectedStudent.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      {(inspectedStudent as LeaderboardStudent).uni || selectedUniversity || "Ethiopian University Scholar"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Academic Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      National Rank
                    </p>
                    <p className="font-serif text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                      #{inspectedStudent.rank}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {TIER_STYLES[getRankTier(inspectedStudent.rank)].label}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Verified Study Time
                    </p>
                    <p className="font-serif text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {inspectedStudent.hours}
                    </p>
                    <span className="text-[10px] text-slate-400">Exit exam textbook tracking</span>
                  </div>

                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Earned Points
                    </p>
                    <p className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {inspectedStudent.xp.toLocaleString()} XP
                    </p>
                    <span className="text-[10px] text-amber-600 font-semibold">
                      ≈ {xpToEtb(inspectedStudent.xp)} ETB valuation
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Academic Department
                    </p>
                    <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {inspectedStudent.department || "Natural Science Track"}
                    </p>
                    <span className="text-[10px] text-slate-400">Freshman MoE Curriculum</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Exit Exam Competency Index</span>
                    <span className="text-emerald-600 font-bold">96% Syllabus Mastery</span>
                  </div>
                  <Progress value={96} className="h-2 bg-slate-200 dark:bg-slate-800 [&>div]:bg-emerald-500" />
                  <p className="text-[10px] text-slate-400">
                    High quiz scores across General Physics, Civics, and Calculus modules.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Trend: <strong className="text-slate-700 dark:text-slate-300">{inspectedStudent.trend} this week</strong>
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSendKudos(inspectedStudent.name)}
                    disabled={kudosSent}
                    className="h-8 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer"
                  >
                    <ThumbsUp className="size-3.5 mr-1" />
                    {kudosSent ? "High-Five Sent! 🎉" : "Send High-Five"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
