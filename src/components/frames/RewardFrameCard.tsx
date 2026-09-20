import { Check, Lock, Sparkles, Trophy, Zap, Eye } from "lucide-react";

import { ProfileFrameAvatar } from "@/components/frames/ProfileFrameAvatar";
import { Education3DIcon } from "@/components/frames/Education3DIcon";
import { RarityBadge } from "@/components/frames/RarityBadge";
import { FrameProgress } from "@/components/frames/FrameProgress";
import { RARITY_META, type ProfileFrame } from "@/lib/frame-data";
import { xpToEtb } from "@/lib/withdrawal-data";
import { cn } from "@/lib/utils";

interface RewardFrameCardProps {
  frame: ProfileFrame;
  userXp: number;
  owned: boolean;
  equipped: boolean;
  initials: string;
  onPreview: () => void;
}

export function RewardFrameCard({
  frame,
  userXp,
  owned,
  equipped,
  initials,
  onPreview,
}: RewardFrameCardProps) {
  const meta = RARITY_META[frame.rarity];
  const isXpFrame = frame.type === "xp";
  const canAfford = isXpFrame && !!frame.price && userXp >= frame.price;
  const isLocked = !owned;

  // Status badge config
  const statusBadge = equipped
    ? { label: "Equipped", cls: "bg-violet-50 text-violet-700 border-violet-200" }
    : owned
      ? { label: "Owned", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : canAfford
        ? { label: "Ready", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
        : { label: "Locked", cls: "bg-slate-100 text-slate-400 border-slate-200" };

  // Card border & glow
  const cardBorder = equipped
    ? "border-2 border-brand-gold ring-2 ring-brand-gold/30 shadow-lg"
    : owned || canAfford
      ? "border border-brand-gold/40 shadow-sm"
      : "border border-slate-200 hover:border-slate-300";

  const cardGlow = equipped
    ? { boxShadow: `0 0 0 2px ${meta.glowColor}, 0 12px 40px ${meta.auraColor}` }
    : undefined;

  // ETB value hint for XP frames
  const etbHint = isXpFrame && frame.price ? xpToEtb(frame.price) : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white transition-all duration-300",
        "hover:-translate-y-1.5 hover:shadow-xl cursor-pointer",
        cardBorder,
      )}
      style={cardGlow}
      onClick={onPreview}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onPreview()}
    >
      {/* ── Ambient Background Glow Bloom ── */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle, ${meta.auraColor} 0%, transparent 70%)`,
          opacity: equipped ? 0.85 : canAfford ? 0.5 : 0.25,
        }}
      />

      {/* ── Inner Rarity gradient overlay ── */}
      {(equipped || frame.rarity === "SSR" || frame.rarity === "MYTHIC" || frame.rarity === "LEGENDARY") && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl"
          style={{
            background: frame.rarity === "SSR"
              ? "linear-gradient(90deg, #f59e0b, #fbbf24, #06b6d4)"
              : frame.rarity === "MYTHIC"
                ? "linear-gradient(90deg, #06b6d4, #a855f7)"
                : `linear-gradient(90deg, ${meta.glowColor}, ${meta.auraColor})`,
          }}
        />
      )}

      <div className="p-4">
        {/* ── Top row: rarity + status badge ── */}
        <div className="relative z-10 mb-3 flex items-center justify-between">
          <RarityBadge rarity={frame.rarity} />
          <span
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              statusBadge.cls,
            )}
          >
            {equipped ? (
              <>
                <Check className="size-2.5" /> Equipped
              </>
            ) : owned ? (
              <>
                <Check className="size-2.5" /> Owned
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

        {/* ── Frame avatar preview with 3D insignia ── */}
        <div className="relative flex justify-center py-4">
          <div
            className="relative transition-all duration-300 group-hover:scale-105"
            style={{
              filter: equipped
                ? `drop-shadow(0 0 20px ${meta.glowColor})`
                : canAfford || owned
                  ? `drop-shadow(0 0 12px ${meta.glowColor})`
                  : `drop-shadow(0 0 6px ${meta.glowColor})`,
            }}
          >
            <ProfileFrameAvatar
              initials={initials}
              frameId={frame.id}
              size="md"
              equipped={equipped}
            />

            {/* Small lock pill if locked and cannot afford */}
            {isLocked && !canAfford && (
              <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-md border border-white/30">
                <Lock className="size-3" />
              </div>
            )}
          </div>
        </div>

        {/* ── 3D Theme Insignia Pill ── */}
        <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600 border border-slate-100">
          <Education3DIcon theme={frame.theme} size={14} className="shrink-0" />
          <span className="truncate">{frame.themeLabel}</span>
        </div>

        {/* ── Frame Info ── */}
        <div className="space-y-0.5">
          <h3 className="font-bold leading-snug text-slate-900 text-sm">{frame.name}</h3>
          <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">
            {frame.description}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 p-4 pt-3">
        {/* ── Price / requirement ── */}
        <div className="mb-3">
          {isXpFrame && frame.price ? (
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="font-bold tabular-nums text-slate-900 text-base">
                  {frame.price.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-400">XP</span>
                {frame.rarity === "SSR" && <Sparkles className="ml-1 size-3 text-amber-400" />}
              </div>
              {etbHint !== null && etbHint > 0 && (
                <span className="text-[10px] font-medium text-slate-400">
                  ≈ {etbHint} ETB
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-600">
              <Trophy className="size-3" />
              Achievement Unlock
            </div>
          )}
        </div>

        {/* ── XP progress bar (locked XP frames) ── */}
        {isLocked && isXpFrame && frame.price && !canAfford && (
          <div className="mb-3">
            <FrameProgress current={userXp} required={frame.price} rarity={frame.rarity} />
          </div>
        )}

        {/* ── Achievement requirement ── */}
        {isLocked && !isXpFrame && frame.requirement && (
          <p className="mb-3 rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] text-violet-700 leading-relaxed">
            {frame.requirement.label}
          </p>
        )}

        {/* ── CTA button ── */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className={cn(
            "w-full rounded-xl py-2.5 text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2",
            equipped
              ? "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
              : owned
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : canAfford
                  ? "bg-brand-gold text-white hover:brightness-110 shadow-md shadow-brand-gold/20"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300",
          )}
        >
          {equipped ? (
            <>
              <Check className="size-3.5" /> Equipped
            </>
          ) : owned ? (
            <>
              <Eye className="size-3.5" /> Preview / Equip
            </>
          ) : canAfford ? (
            <>
              <Zap className="size-3.5" /> Unlock Now
            </>
          ) : (
            <>
              <Eye className="size-3.5" /> Preview
            </>
          )}
        </button>
      </div>
    </div>
  );
}
