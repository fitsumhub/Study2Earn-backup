import { useState, useMemo } from "react";
import { Layers, ChevronRight, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";

import { RewardFrameCard } from "@/components/frames/RewardFrameCard";
import { RewardFrameModal } from "@/components/frames/RewardFrameModal";
import { ProfileFrameAvatar } from "@/components/frames/ProfileFrameAvatar";
import { RarityBadge } from "@/components/frames/RarityBadge";
import { useFrames } from "@/hooks/use-frames";
import { useAuth } from "@/hooks/use-auth";
import { useRedemptions } from "@/hooks/use-redemptions";
import { useWallet } from "@/hooks/use-wallet";
import { resolveMediaUrl } from "@/lib/media-store";
import {
  PROFILE_FRAMES,
  RARITY_ORDER,
  type ProfileFrame,
  type Rarity,
} from "@/lib/frame-data";
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
  all: "All",
  COMMON: "Common",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
  MYTHIC: "Mythic",
  SSR: "SSR",
  affordable: "Affordable",
  achievement: "Achievement",
  unlocked: "Unlocked",
  locked: "Locked",
  equipped: "Equipped",
};

const FILTER_ORDER: FrameFilter[] = [
  "all",
  ...RARITY_ORDER,
  "affordable",
  "achievement",
  "unlocked",
  "locked",
  "equipped",
];

// ─── Component ────────────────────────────────────────────────────────────────

interface RewardFramesSectionProps {
  /** Called when user wants to earn more XP — navigates away from frames */
  onEarnXp?: () => void;
}

export function RewardFramesSection({ onEarnXp }: RewardFramesSectionProps) {
  const { user } = useAuth();
  const wallet = useWallet();
  const frames = useFrames();
  const { redeem } = useRedemptions();

  const [filter, setFilter] = useState<FrameFilter>("all");
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
    ? PROFILE_FRAMES.find((f) => f.id === frames.equipped) ?? null
    : null;

  // ── Filtering ───────────────────────────────────────────────────────────────

  const filteredFrames = useMemo(() => {
    const all = PROFILE_FRAMES.slice().sort((a, b) => {
      // Equipped first, then owned, then affordable, then by rarity/price
      if (frames.isEquipped(a.id)) return -1;
      if (frames.isEquipped(b.id)) return 1;
      if (frames.isOwned(a.id) && !frames.isOwned(b.id)) return -1;
      if (frames.isOwned(b.id) && !frames.isOwned(a.id)) return 1;
      return 0;
    });

    switch (filter) {
      case "all":
        return all;
      case "affordable":
        return all.filter(
          (f) => !frames.isOwned(f.id) && f.type === "xp" && !!f.price && wallet.balance >= f.price,
        );
      case "achievement":
        return all.filter((f) => f.type === "achievement");
      case "unlocked":
        return all.filter((f) => frames.isOwned(f.id));
      case "locked":
        return all.filter((f) => !frames.isOwned(f.id));
      case "equipped":
        return all.filter((f) => frames.isEquipped(f.id));
      default:
        // rarity filter
        return all.filter((f) => f.rarity === filter);
    }
  }, [filter, frames, wallet.balance]);

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

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handlePreview = (frame: ProfileFrame) => {
    setSelectedFrame(frame);
    setModalOpen(true);
  };

  const handleUnlock = (frame: ProfileFrame) => {
    if (!frame.price) return;
    const result = redeem(
      { title: frame.name, xp: frame.price, tag: "frame" },
      wallet.balance,
    );
    if (!result.ok) {
      toast.error("Not enough XP", { description: result.error });
      return;
    }
    frames.unlock(frame.id);
    // Modal drives the animation; no toast here — the animation IS the feedback
  };

  const handleEquip = (frameId: string) => {
    frames.equip(frameId);
    const frame = PROFILE_FRAMES.find((f) => f.id === frameId);
    toast.success(`${frame?.name ?? "Frame"} equipped!`, {
      description: "Your profile frame is now active across Study2Earn.",
    });
    setModalOpen(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="animate-in fade-in-0 duration-300 space-y-6">
      {/* ── Section header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-gold/20 to-amber-100">
            <Layers className="size-5 text-brand-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Profile Frames</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Show your learning journey with an exclusive Study2Earn profile frame.
            </p>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <Sparkles className="size-3 text-brand-gold" />
              Collect
              <span className="text-slate-300">·</span>
              Equip
              <span className="text-slate-300">·</span>
              Showcase
            </div>
          </div>
        </div>

        {/* Currently equipped preview & View Collection action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-sm">
            <ProfileFrameAvatar
              initials={initials}
              avatarUrl={resolveMediaUrl(user?.avatarUrl)}
              frameId={equippedFrame?.id}
              size="sm"
              equipped={!!equippedFrame}
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                {equippedFrame ? "Equipped" : "Active Avatar"}
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {equippedFrame ? equippedFrame.name : "Default Frame"}
              </p>
              {equippedFrame ? (
                <div className="mt-0.5 flex items-center gap-2">
                  <RarityBadge rarity={equippedFrame.rarity} className="text-[9px]" />
                  <button
                    type="button"
                    onClick={() => {
                      frames.equip(null);
                      toast.info("Frame unequipped", {
                        description: "Your standard avatar border is now active.",
                      });
                    }}
                    className="text-[10px] font-semibold text-slate-400 hover:text-red-500 transition-colors underline"
                  >
                    Unequip
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400">None equipped</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("profile-frames-grid");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-xl border border-brand-navy/20 bg-brand-navy/5 px-3.5 py-2.5 text-xs font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
          >
            View Collection
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Collected",
            value: `${frames.owned.length}/${PROFILE_FRAMES.length}`,
            icon: Layers,
          },
          {
            label: "XP Frames",
            value: String(PROFILE_FRAMES.filter((f) => f.type === "xp").length),
            icon: Sparkles,
          },
          {
            label: "Achievement",
            value: String(PROFILE_FRAMES.filter((f) => f.type === "achievement").length),
            icon: Trophy,
          },
          {
            label: "Affordable",
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
            highlight: true,
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-xl border bg-white p-3 text-center",
              s.highlight && Number(s.value) > 0
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-slate-200",
            )}
          >
            <s.icon
              className={cn(
                "mx-auto mb-1 size-4",
                s.highlight && Number(s.value) > 0 ? "text-emerald-500" : "text-slate-400",
              )}
            />
            <p className="text-lg font-bold tabular-nums text-slate-900">{s.value}</p>
            <p className="text-[10px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filter chips ── */}
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
                  "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
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

      {/* ── Frame grid ── */}
      {filteredFrames.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white py-14 text-center">
          <Layers className="mx-auto mb-3 size-10 text-slate-300" />
          <p className="font-semibold text-slate-900">No frames match this filter</p>
          <p className="mt-1 text-sm text-slate-500">Keep earning XP to unlock more</p>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="mt-4 text-sm font-semibold text-brand-gold underline"
          >
            View all frames
          </button>
        </div>
      ) : (
        <div id="profile-frames-grid" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 scroll-mt-24">
          {filteredFrames.map((frame) => (
            <RewardFrameCard
              key={frame.id}
              frame={frame}
              userXp={wallet.balance}
              owned={frames.isOwned(frame.id)}
              equipped={frames.isEquipped(frame.id)}
              initials={initials}
              avatarUrl={resolveMediaUrl(user?.avatarUrl)}
              onPreview={() => handlePreview(frame)}
            />
          ))}
        </div>
      )}

      {/* ── Earn XP prompt ── */}
      {onEarnXp && (
        <button
          type="button"
          onClick={onEarnXp}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
              <Sparkles className="size-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">Earn more XP</p>
              <p className="text-xs text-slate-400">
                Read books, take exams, and invite classmates to unlock frames faster
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-slate-300" />
        </button>
      )}

      {/* ── Frame modal ── */}
      <RewardFrameModal
        frame={selectedFrame}
        open={modalOpen}
        userXp={wallet.balance}
        owned={selectedFrame ? frames.isOwned(selectedFrame.id) : false}
        equipped={selectedFrame ? frames.isEquipped(selectedFrame.id) : false}
        initials={initials}
        avatarUrl={resolveMediaUrl(user?.avatarUrl)}
        onClose={() => setModalOpen(false)}
        onUnlock={handleUnlock}
        onEquip={handleEquip}
        onUnequip={() => {
          frames.equip(null);
          toast.info("Frame unequipped", {
            description: "Your standard avatar border is now active.",
          });
        }}
      />
    </div>
  );
}
