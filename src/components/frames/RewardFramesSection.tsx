import { useState, useMemo } from "react";
import {
  Layers,
  ChevronRight,
  Sparkles,
  Trophy,
  Search,
  X,
  SlidersHorizontal,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { RewardFrameCard } from "@/components/frames/RewardFrameCard";
import { RewardFrameModal } from "@/components/frames/RewardFrameModal";
import { ProfileFrameAvatar } from "@/components/frames/ProfileFrameAvatar";
import { Education3DIcon } from "@/components/frames/Education3DIcon";
import { RarityBadge } from "@/components/frames/RarityBadge";
import { useFrames } from "@/hooks/use-frames";
import { useAuth } from "@/hooks/use-auth";
import { useRedemptions } from "@/hooks/use-redemptions";
import { useWallet } from "@/hooks/use-wallet";
import { PROFILE_FRAMES, RARITY_ORDER, type ProfileFrame, type Rarity } from "@/lib/frame-data";
import { cn } from "@/lib/utils";

// ─── Filter types ─────────────────────────────────────────────────────────────

type FrameFilter =
  | "all"
  | Rarity
  | "unlocked"
  | "locked"
  | "equipped"
  | "affordable"
  | "achievement";

const FILTER_LABELS: Record<FrameFilter, string> = {
  all: "All Frames",
  SSR: "SSR",
  MYTHIC: "Mythic",
  LEGENDARY: "Legendary",
  EPIC: "Epic",
  RARE: "Rare",
  COMMON: "Common",
  affordable: "Affordable Now",
  achievement: "Achievements",
  unlocked: "Unlocked",
  locked: "Locked",
  equipped: "Equipped",
};

const FILTER_ORDER: FrameFilter[] = [
  "all",
  "affordable",
  ...RARITY_ORDER,
  "achievement",
  "unlocked",
  "locked",
  "equipped",
];

const RARITY_WEIGHT: Record<Rarity, number> = {
  SSR: 6,
  MYTHIC: 5,
  LEGENDARY: 4,
  EPIC: 3,
  RARE: 2,
  COMMON: 1,
};

// ─── Component ────────────────────────────────────────────────────────────────

interface RewardFramesSectionProps {
  /** Called when user wants to earn more XP — navigates away from frames */
  onEarnXp?: () => void;
  compact?: boolean;
}

export function RewardFramesSection({ onEarnXp, compact = false }: RewardFramesSectionProps) {
  const { user } = useAuth();
  const wallet = useWallet();
  const frames = useFrames();
  const { redeem } = useRedemptions();

  const [filter, setFilter] = useState<FrameFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "rarity-desc" | "price-asc" | "price-desc">("featured");
  const [selectedFrame, setSelectedFrame] = useState<ProfileFrame | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  // ── Filtering & Sorting ───────────────────────────────────────────────────────

  const filteredFrames = useMemo(() => {
    let list = PROFILE_FRAMES.slice();

    // 1. Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.themeLabel.toLowerCase().includes(q) ||
          f.rarity.toLowerCase().includes(q),
      );
    }

    // 2. Filter category
    switch (filter) {
      case "all":
        break;
      case "affordable":
        list = list.filter(
          (f) => !frames.isOwned(f.id) && f.type === "xp" && !!f.price && wallet.balance >= f.price,
        );
        break;
      case "achievement":
        list = list.filter((f) => f.type === "achievement");
        break;
      case "unlocked":
        list = list.filter((f) => frames.isOwned(f.id));
        break;
      case "locked":
        list = list.filter((f) => !frames.isOwned(f.id));
        break;
      case "equipped":
        list = list.filter((f) => frames.isEquipped(f.id));
        break;
      default:
        list = list.filter((f) => f.rarity === filter);
        break;
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === "featured") {
        // Equipped first, then owned, then affordable, then rarity weight
        if (frames.isEquipped(a.id)) return -1;
        if (frames.isEquipped(b.id)) return 1;
        if (frames.isOwned(a.id) && !frames.isOwned(b.id)) return -1;
        if (frames.isOwned(b.id) && !frames.isOwned(a.id)) return 1;
        const aCanAfford = a.type === "xp" && !!a.price && wallet.balance >= a.price;
        const bCanAfford = b.type === "xp" && !!b.price && wallet.balance >= b.price;
        if (aCanAfford && !bCanAfford) return -1;
        if (!aCanAfford && bCanAfford) return 1;
        return RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity];
      }
      if (sortBy === "rarity-desc") {
        return RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity];
      }
      if (sortBy === "price-asc") {
        return (a.price ?? 999999) - (b.price ?? 999999);
      }
      if (sortBy === "price-desc") {
        return (b.price ?? 0) - (a.price ?? 0);
      }
      return 0;
    });

    return list;
  }, [filter, searchQuery, sortBy, frames, wallet.balance]);

  // ── Badge counts for filters ─────────────────────────────────────────────────

  const filterCounts = useMemo(
    () => ({
      all: PROFILE_FRAMES.length,
      affordable: PROFILE_FRAMES.filter(
        (f) => !frames.isOwned(f.id) && f.type === "xp" && !!f.price && wallet.balance >= f.price,
      ).length,
      achievement: PROFILE_FRAMES.filter((f) => f.type === "achievement").length,
      unlocked: frames.owned.length,
      locked: PROFILE_FRAMES.length - frames.owned.length,
      equipped: frames.equipped ? 1 : 0,
      ...Object.fromEntries(
        RARITY_ORDER.map((r) => [r, PROFILE_FRAMES.filter((f) => f.rarity === r).length]),
      ),
    }),
    [frames, wallet.balance],
  );

  const collectionPct = Math.round((frames.owned.length / PROFILE_FRAMES.length) * 100);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handlePreview = (frame: ProfileFrame) => {
    setSelectedFrame(frame);
    setModalOpen(true);
  };

  const handleUnlock = (frame: ProfileFrame) => {
    if (!frame.price) return;
    const result = redeem({ title: frame.name, xp: frame.price, tag: "frame" }, wallet.balance);
    if (!result.ok) {
      toast.error("Not enough XP", { description: result.error });
      return;
    }
    frames.unlock(frame.id);
  };

  const handleEquip = (frameId: string) => {
    frames.equip(frameId);
    const frame = PROFILE_FRAMES.find((f) => f.id === frameId);
    toast.success(`${frame?.name ?? "Frame"} equipped!`, {
      description: "Your profile frame is now active across Study2Earn.",
    });
    setModalOpen(false);
  };

  const handleUnequip = () => {
    frames.equip(null);
    toast.info("Frame unequipped", {
      description: "You're now displaying the standard avatar border.",
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* ── Avatar Studio Command Header ── */}
      {!compact && (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/70 to-amber-50/30 p-5 sm:p-7 shadow-xs">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Left: Info */}
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-xs font-bold text-brand-gold">
                <Sparkles className="size-3.5" />
                Avatar Cosmetics & Insignias
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl font-serif">
                Profile Frames Gallery
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Unlock handcrafted 3D educational emblems to showcase your prestige across the
                Leaderboard, Library, and Discussion forums.
              </p>

              {/* Progress gauge */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Shield className="size-3.5 text-brand-gold" />
                    Collection Progress ({frames.owned.length}/{PROFILE_FRAMES.length})
                  </span>
                  <span className="font-bold text-slate-900">{collectionPct}% Complete</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-gold to-amber-400 transition-all duration-500"
                    style={{ width: `${collectionPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Live Avatar Studio preview box */}
            <div className="flex flex-col items-center sm:items-end">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                <div className="relative">
                  <ProfileFrameAvatar
                    initials={initials}
                    frameId={equippedFrame?.id}
                    size="md"
                    equipped={!!equippedFrame}
                  />
                  {equippedFrame && (
                    <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                      <CheckCircle2 className="size-3" />
                    </span>
                  )}
                </div>

                <div className="min-w-[150px] space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                    {equippedFrame ? "Active Showcase" : "Standard Frame"}
                  </p>
                  <p className="font-bold text-sm text-slate-900 truncate">
                    {equippedFrame ? equippedFrame.name : "Default Avatar"}
                  </p>
                  {equippedFrame ? (
                    <div className="flex items-center gap-1.5">
                      <RarityBadge rarity={equippedFrame.rarity} className="text-[9px] px-1.5 py-0.5" />
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                        <Education3DIcon theme={equippedFrame.theme} size={12} />
                        {equippedFrame.themeLabel}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Select any frame to equip</p>
                  )}

                  {equippedFrame && (
                    <button
                      type="button"
                      onClick={handleUnequip}
                      className="mt-1 text-[11px] font-semibold text-slate-500 hover:text-red-600 transition-colors underline"
                    >
                      Unequip
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Quick Counters ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Collected",
            value: `${frames.owned.length}/${PROFILE_FRAMES.length}`,
            icon: Layers,
            sub: `${collectionPct}% owned`,
          },
          {
            label: "XP Redeemable",
            value: String(PROFILE_FRAMES.filter((f) => f.type === "xp").length),
            icon: Sparkles,
            sub: "Spend XP to unlock",
          },
          {
            label: "Achievement Exclusives",
            value: String(PROFILE_FRAMES.filter((f) => f.type === "achievement").length),
            icon: Trophy,
            sub: "Earned by study streaks",
          },
          {
            label: "Ready to Unlock",
            value: String(
              PROFILE_FRAMES.filter(
                (f) =>
                  !frames.isOwned(f.id) &&
                  f.type === "xp" &&
                  !!f.price &&
                  wallet.balance >= f.price,
              ).length,
            ),
            icon: Sparkles,
            sub: "Affordable right now",
            highlight: true,
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              "flex flex-col justify-between rounded-2xl border bg-white p-4 transition-all",
              s.highlight && Number(s.value) > 0
                ? "border-emerald-200 bg-emerald-50/40 shadow-xs"
                : "border-slate-200/80 shadow-xs",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">{s.label}</span>
              <s.icon
                className={cn(
                  "size-4",
                  s.highlight && Number(s.value) > 0 ? "text-emerald-600" : "text-slate-400",
                )}
              />
            </div>
            <div className="mt-2">
              <p className="text-xl font-bold tabular-nums text-slate-900">{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by frame name, theme, or rarity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-medium text-slate-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="featured">Featured / Affordable</option>
            <option value="rarity-desc">Highest Rarity (SSR first)</option>
            <option value="price-asc">XP Price: Low to High</option>
            <option value="price-desc">XP Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* ── Filter Chips ── */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5 pb-1">
          {FILTER_ORDER.map((f) => {
            const count = (filterCounts as Record<string, number>)[f] ?? 0;
            const isActive = filter === f;
            if (count === 0 && f !== "all") return null;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                )}
              >
                {f === "affordable" && <Sparkles className="size-3 text-amber-400" />}
                {f === "achievement" && <Trophy className="size-3 text-violet-400" />}
                {FILTER_LABELS[f]}
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
      </div>

      {/* ── Frames Grid ── */}
      {filteredFrames.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <Layers className="mx-auto mb-3 size-10 text-slate-300" />
          <p className="font-bold text-slate-900 text-base">No profile frames found</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No frames match "${searchQuery}". Try a different search term or reset your filters.`
              : "No frames match this filter criteria."}
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setSearchQuery("");
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          id="profile-frames-grid"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 scroll-mt-24"
        >
          {filteredFrames.map((frame) => (
            <RewardFrameCard
              key={frame.id}
              frame={frame}
              userXp={wallet.balance}
              owned={frames.isOwned(frame.id)}
              equipped={frames.isEquipped(frame.id)}
              initials={initials}
              onPreview={() => handlePreview(frame)}
            />
          ))}
        </div>
      )}

      {/* ── Earn XP Prompt Banner ── */}
      {onEarnXp && (
        <button
          type="button"
          onClick={onEarnXp}
          className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-amber-50/40 p-4 transition-all hover:border-brand-gold/40 hover:shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
              <Sparkles className="size-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900">Need more XP for frames?</p>
              <p className="text-xs text-slate-500">
                Read verified PDFs, score 80%+ on mock exams, or refer friends to unlock Mythic & SSR frames.
              </p>
            </div>
          </div>
          <ChevronRight className="size-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-gold" />
        </button>
      )}

      {/* ── Frame Details & Unlock Modal ── */}
      <RewardFrameModal
        frame={selectedFrame}
        open={modalOpen}
        userXp={wallet.balance}
        owned={selectedFrame ? frames.isOwned(selectedFrame.id) : false}
        equipped={selectedFrame ? frames.isEquipped(selectedFrame.id) : false}
        initials={initials}
        onClose={() => setModalOpen(false)}
        onUnlock={handleUnlock}
        onEquip={handleEquip}
      />
    </div>
  );
}
