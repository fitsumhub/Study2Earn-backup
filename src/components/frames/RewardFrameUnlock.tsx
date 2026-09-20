import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

import { ProfileFrameAvatar } from "@/components/frames/ProfileFrameAvatar";
import { Education3DIcon } from "@/components/frames/Education3DIcon";
import { RarityBadge } from "@/components/frames/RarityBadge";
import { RARITY_META, type ProfileFrame } from "@/lib/frame-data";

interface RewardFrameUnlockProps {
  frame: ProfileFrame;
  initials: string;
  onEquip: () => void;
  onSkip: () => void;
}

type Stage = "appear" | "glow" | "aura" | "particles" | "text" | "name" | "deduct" | "done";

const STAGE_DELAYS: Record<Stage, number> = {
  appear: 0,
  glow: 500,
  aura: 800,
  particles: 1000,
  text: 1500,
  name: 1800,
  deduct: 2000,
  done: 2400,
};

export function RewardFrameUnlock({ frame, initials, onEquip, onSkip }: RewardFrameUnlockProps) {
  const [stage, setStage] = useState<Stage>("appear");
  const meta = RARITY_META[frame.rarity];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    (Object.entries(STAGE_DELAYS) as [Stage, number][]).forEach(([s, delay]) => {
      timers.push(setTimeout(() => setStage(s), delay));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const stageReached = (s: Stage) =>
    Object.keys(STAGE_DELAYS).indexOf(stage) >= Object.keys(STAGE_DELAYS).indexOf(s);

  return (
    <div className="relative flex flex-col items-center gap-6 py-4">
      {/* Skip button */}
      {stage !== "done" && (
        <button
          type="button"
          onClick={onSkip}
          className="absolute right-0 top-0 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="size-3" /> Skip
        </button>
      )}

      {/* ── Frame with animated glow ── */}
      <div
        className="relative flex items-center justify-center"
        style={{
          animation: stageReached("appear") ? "frameUnlockScale 0.5s ease-out forwards" : undefined,
          opacity: 0,
        }}
      >
        {/* Burst glow behind avatar */}
        {stageReached("glow") && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${meta.glowColor} 0%, transparent 70%)`,
              animation: "frameUnlockGlowBurst 0.6s ease-out forwards",
              transform: "scale(2.5)",
            }}
          />
        )}

        <ProfileFrameAvatar
          initials={initials}
          frameId={stageReached("aura") ? frame.id : undefined}
          size="xl"
          equipped
        />

        {/* Sparkle burst */}
        {stageReached("particles") &&
          Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * 360;
            const dist = 70 + (i % 3) * 15;
            const rad = (angle * Math.PI) / 180;
            return (
              <div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 6,
                  height: 6,
                  left: `calc(50% + ${Math.cos(rad) * dist}px)`,
                  top: `calc(50% + ${Math.sin(rad) * dist}px)`,
                  backgroundColor: i % 2 === 0 ? meta.glowColor : meta.auraColor,
                  transform: "translate(-50%, -50%)",
                  animation: `frameUnlockSparkle 0.8s ease-out forwards`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            );
          })}
      </div>

      {/* ── Text sequence ── */}
      <div className="space-y-2 text-center">
        {stageReached("text") && (
          <p
            className="text-2xl font-bold tracking-wide"
            style={{
              animation: "frameUnlockText 0.4s ease-out forwards",
              color: meta.glowColor,
              textShadow: `0 0 20px ${meta.glowColor}`,
            }}
          >
            FRAME UNLOCKED!
          </p>
        )}

        {stageReached("name") && (
          <div
            className="flex flex-col items-center gap-1.5"
            style={{ animation: "frameUnlockText 0.4s ease-out forwards" }}
          >
            <div className="flex items-center gap-2">
              <RarityBadge rarity={frame.rarity} />
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                <Education3DIcon theme={frame.theme} size={14} />
                {frame.themeLabel}
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900">{frame.name}</p>
            <p className="text-sm text-slate-500">{frame.description}</p>
          </div>
        )}

        {stageReached("deduct") && frame.price && (
          <p
            className="text-sm font-semibold text-red-500"
            style={{ animation: "frameUnlockText 0.4s ease-out forwards" }}
          >
            −{frame.price.toLocaleString()} XP deducted
          </p>
        )}
      </div>

      {/* ── Equip button ── */}
      {stageReached("done") && (
        <button
          type="button"
          onClick={onEquip}
          className="flex items-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-brand-navy/90 active:scale-[0.98]"
          style={{ animation: "frameUnlockText 0.4s ease-out forwards" }}
        >
          <CheckCircle2 className="size-4 text-brand-gold" />
          Equip Frame
        </button>
      )}
    </div>
  );
}
