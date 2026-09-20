import { cn } from "@/lib/utils";
import { RARITY_META, type Rarity } from "@/lib/frame-data";

export function RarityBadge({ rarity, className }: { rarity: Rarity; className?: string }) {
  const meta = RARITY_META[rarity];
  const isSSR = rarity === "SSR";

  if (isSSR) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white",
          "bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-400 shadow-sm",
          className,
        )}
      >
        ✦ SSR
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        meta.bgColor,
        meta.textColor,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
