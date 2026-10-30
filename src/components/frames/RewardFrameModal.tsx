import { X, BookOpen, Trophy, Zap, Sparkles } from "lucide-react";
import { useState } from "react";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProfileFrameAvatar } from "@/components/frames/ProfileFrameAvatar";
import { Education3DIcon } from "@/components/frames/Education3DIcon";
import { RarityBadge } from "@/components/frames/RarityBadge";
import { FrameProgress } from "@/components/frames/FrameProgress";
import { RewardFrameUnlock } from "@/components/frames/RewardFrameUnlock";
import { RARITY_META, type ProfileFrame } from "@/lib/frame-data";
import { cn } from "@/lib/utils";

interface RewardFrameModalProps {
  frame: ProfileFrame | null;
  open: boolean;
  userXp: number;
  owned: boolean;
  equipped: boolean;
  initials: string;
  avatarUrl?: string;
  onClose: () => void;
  onUnlock: (frame: ProfileFrame) => void;
  onEquip: (frameId: string) => void;
  onUnequip?: () => void;
}

export function RewardFrameModal({
  frame,
  open,
  userXp,
  owned,
  equipped,
  initials,
  avatarUrl,
  onClose,
  onUnlock,
  onEquip,
  onUnequip,
}: RewardFrameModalProps) {
  const [unlocking, setUnlocking] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  if (!frame) return null;

  const meta = RARITY_META[frame.rarity];
  const isXpFrame = frame.type === "xp";
  const canAfford = isXpFrame && !!frame.price && userXp >= frame.price;

  const handleUnlock = () => {
    setUnlocking(true);
    onUnlock(frame);
  };

  const handleSkip = () => {
    setUnlocking(false);
    setJustUnlocked(true);
  };

  const handleEquip = () => {
    onEquip(frame.id);
    setUnlocking(false);
    setJustUnlocked(false);
    onClose();
  };

  const handleClose = () => {
    setUnlocking(false);
    setJustUnlocked(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-md overflow-hidden p-0 rounded-3xl border border-white/20"
        style={{
          boxShadow: `0 0 60px ${meta.auraColor}, 0 25px 60px rgba(0,0,0,0.25)`,
        }}
      >
        <DialogTitle className="sr-only">{frame.name} Profile Frame</DialogTitle>
        <DialogDescription className="sr-only">
          {frame.rarity} frame: {frame.description}
        </DialogDescription>

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-20 flex size-8 items-center justify-center rounded-full bg-slate-100/90 backdrop-blur-sm text-slate-600 transition hover:bg-slate-200"
        >
          <X className="size-4" />
        </button>

        {/* ── Unlock animation sequence ── */}
        {unlocking && (
          <div className="p-6">
            <RewardFrameUnlock
              frame={frame}
              initials={initials}
              avatarUrl={avatarUrl}
              onEquip={handleEquip}
              onSkip={handleSkip}
            />
          </div>
        )}

        {/* ── Post-skip equip prompt ── */}
        {!unlocking && justUnlocked && (
          <div className="flex flex-col items-center gap-5 p-8 text-center">
            <ProfileFrameAvatar
              initials={initials}
              avatarUrl={avatarUrl}
              frameId={frame.id}
              size="xl"
              equipped
            />
            <div>
              <RarityBadge rarity={frame.rarity} />
              <p className="mt-2 text-2xl font-bold text-slate-900">{frame.name} unlocked!</p>
              <p className="mt-1 text-sm text-slate-500">Ready to showcase on your profile</p>
            </div>
            <button
              type="button"
              onClick={handleEquip}
              className="rounded-xl bg-brand-navy px-8 py-3.5 text-sm font-bold text-white transition hover:bg-brand-navy/90 shadow-lg shadow-brand-navy/25 active:scale-[0.98]"
            >
              Equip Frame
            </button>
          </div>
        )}

        {/* ── Normal preview state ── */}
        {!unlocking && !justUnlocked && (
          <>
            {/* Luminous gradient header */}
            <div
              className="relative flex flex-col items-center gap-4 px-6 pb-6 pt-9 overflow-hidden"
              style={{
                background: `linear-gradient(180deg, ${meta.auraColor} 0%, rgba(255,255,255,0) 100%)`,
              }}
            >
              {/* Radial ambient glow blooms */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
                <div
                  className="h-32 w-64 rounded-full blur-3xl"
                  style={{ backgroundColor: meta.glowColor, opacity: 0.45 }}
                />
              </div>

              {/* Large glowing preview avatar */}
              <div className="relative z-10 my-2">
                <ProfileFrameAvatar
                  initials={initials}
                  avatarUrl={avatarUrl}
                  frameId={frame.id}
                  size="xl"
                  equipped={equipped}
                />
              </div>

              {/* Title & 3D Insignia badge */}
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <RarityBadge rarity={frame.rarity} />
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-xs border border-slate-200/50">
                    <Education3DIcon theme={frame.theme} size={14} />
                    {frame.themeLabel}
                  </span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-slate-900">{frame.name}</h2>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-5 px-6 pb-6">
              <p className="text-center text-sm leading-relaxed text-slate-600">
                {frame.description}
              </p>

              {/* 3D Insignia Feature Spotlight */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 shadow-xs">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200/50">
                  <Education3DIcon theme={frame.theme} size={30} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Academic Crest & Insignia
                  </p>
                  <p className="text-sm font-bold text-slate-900">{frame.themeLabel}</p>
                  <p className="text-xs text-slate-500">
                    3D metallic insignia mounted atop your profile ring.
                  </p>
                </div>
              </div>

              {/* Price / Requirement */}
              <div
                className="rounded-2xl border p-4.5 bg-white shadow-xs"
                style={{ borderColor: meta.glowColor + "44" }}
              >
                {isXpFrame && frame.price ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        XP Required
                      </span>
                      <span className="font-bold tabular-nums text-slate-900 text-base">
                        {frame.price.toLocaleString()}{" "}
                        <span className="text-xs font-medium text-slate-400">XP</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Your Balance
                      </span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {userXp.toLocaleString()}{" "}
                        <span className="text-xs font-medium text-slate-400">XP</span>
                      </span>
                    </div>

                    {!owned && <FrameProgress current={userXp} required={frame.price} rarity={frame.rarity} />}
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Trophy className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                        Achievement Requirement
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {frame.requirement?.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {frame.requirement?.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="space-y-2">
                {owned ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => onEquip(frame.id)}
                      disabled={equipped}
                      className={cn(
                        "w-full rounded-xl py-3 text-sm font-bold transition active:scale-[0.98]",
                        equipped
                          ? "cursor-default bg-violet-100 text-violet-700"
                          : "bg-brand-navy text-white hover:bg-brand-navy/90 shadow-md shadow-brand-navy/20",
                      )}
                    >
                      {equipped ? "✓ Currently Equipped" : "Equip Frame"}
                    </button>
                    {equipped && onUnequip && (
                      <button
                        type="button"
                        onClick={() => {
                          onUnequip();
                          onClose();
                        }}
                        className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
                      >
                        Unequip this frame
                      </button>
                    )}
                  </div>
                ) : isXpFrame ? (
                  <>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={handleUnlock}
                      className={cn(
                        "flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-bold transition active:scale-[0.98]",
                        canAfford
                          ? "bg-brand-gold text-white hover:brightness-110 shadow-lg shadow-brand-gold/30"
                          : "cursor-not-allowed bg-slate-100 text-slate-400",
                      )}
                    >
                      {canAfford ? (
                        <>
                          <Sparkles className="size-4" />
                          Unlock Frame ({frame.price?.toLocaleString()} XP)
                        </>
                      ) : (
                        "Not Enough XP to Unlock"
                      )}
                    </button>
                    {!canAfford && (
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300 transition"
                      >
                        <Zap className="size-3.5 text-brand-gold" />
                        Earn More XP →
                      </button>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl bg-violet-50 px-4 py-3 text-center border border-violet-100">
                    <p className="flex items-center justify-center gap-2 text-sm font-semibold text-violet-700">
                      <BookOpen className="size-4" />
                      Complete the academic achievement to unlock
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
