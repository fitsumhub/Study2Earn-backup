import { cn } from "@/lib/utils";
import { RARITY_META, type Rarity } from "@/lib/frame-data";

interface FrameProgressProps {
  current: number;
  required: number;
  rarity?: Rarity;
  className?: string;
}

const RARITY_GRADIENT: Record<Rarity, string> = {
  COMMON: "from-slate-400 to-slate-500",
  RARE: "from-blue-400 to-blue-600",
  EPIC: "from-violet-400 to-violet-600",
  LEGENDARY: "from-amber-400 to-amber-500",
  MYTHIC: "from-cyan-400 to-purple-500",
  SSR: "from-amber-400 via-yellow-300 to-cyan-400",
};

export function FrameProgress({ current, required, rarity, className }: FrameProgressProps) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  const needed = Math.max(0, required - current);
  const gradient = rarity ? RARITY_GRADIENT[rarity] : "from-brand-navy to-brand-navy";
  const glowColor = rarity ? RARITY_META[rarity].glowColor : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
        <span className="tabular-nums">
          {current.toLocaleString()} / {required.toLocaleString()} XP
        </span>
        <span className="font-bold text-slate-500">{pct}%</span>
      </div>

      {/* Gradient progress track */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-700",
            gradient,
          )}
          style={{
            width: `${pct}%`,
            boxShadow: pct > 0 ? `0 0 8px ${glowColor ?? "rgba(100,100,255,0.4)"}` : undefined,
          }}
        />
        {/* Sheen sweep effect */}
        <div
          className="absolute inset-y-0 left-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      {needed > 0 && (
        <p className="text-[10px] text-slate-400">
          Need{" "}
          <span className="font-semibold text-slate-600">{needed.toLocaleString()} more XP</span>{" "}
          to unlock
        </p>
      )}
    </div>
  );
}
