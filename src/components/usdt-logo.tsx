import { cn } from "@/lib/utils";

/** Visual badge for USDT-via-Binance withdrawals, styled with official Tether vector graphics. */
export function UsdtLogo({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-10",
    md: "size-14",
    lg: "size-20",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm ring-1 ring-black/10 dark:ring-white/10 transition-transform hover:scale-105",
        sizes[size],
        className,
      )}
      title="USDT (Tether via Binance)"
    >
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
        <defs>
          <radialGradient id="usdt-grad" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#26A17B" />
            <stop offset="100%" stopColor="#1E7A5E" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#usdt-grad)" />
        {/* Tether Token Ring */}
        <circle cx="32" cy="27" r="15" stroke="#FFFFFF" strokeWidth="2.8" strokeOpacity="0.3" fill="none" />
        {/* Tether Horizontal Bar & Stem */}
        <rect x="20" y="18" width="24" height="4.5" rx="1.5" fill="#FFFFFF" />
        <rect x="29.6" y="21" width="4.8" height="17" rx="1.5" fill="#FFFFFF" />
        {/* Tether curved ring contour */}
        <path
          d="M19 28C19 33 24.5 36.5 32 36.5C39.5 36.5 45 33 45 28"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
        {/* USDT label */}
        <text
          x="32"
          y="55"
          textAnchor="middle"
          fill="#A7F3D0"
          fontSize="8"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.8"
        >
          USDT
        </text>
      </svg>
    </div>
  );
}
