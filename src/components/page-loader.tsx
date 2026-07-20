import { cn } from "@/lib/utils";

/**
 * Branded loading state used anywhere the app needs to show a full section
 * (or full page) is still resolving — auth checks, admin hydration, lazy
 * chunk loads, async record lookups.
 */
export function PageLoader({
  label = "Loading…",
  fullScreen = false,
  className,
}: {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center px-6 py-20 animate-in fade-in-0 duration-500",
        fullScreen ? "min-h-screen" : "min-h-[50vh]",
        className,
      )}
    >
      <div className="relative flex size-28 items-center justify-center">
        {/* Ambient radar pulses */}
        <span className="absolute size-28 animate-ping rounded-full bg-brand-gold/10 [animation-duration:2.4s]" />
        <span className="absolute size-20 animate-ping rounded-full bg-brand-gold/15 [animation-duration:2.4s] [animation-delay:0.4s]" />

        {/* Rotating dashed ring */}
        <svg
          className="loader-orbit absolute size-24 text-brand-gold"
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="70 210"
          />
        </svg>

        {/* Breathing brand mark */}
        <div className="loader-pulse relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-[#162042] shadow-xl shadow-brand-navy/30">
          <span className="font-serif text-2xl font-bold text-brand-gold">S</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="font-serif text-lg font-bold tracking-tight text-brand-navy">Study2Earn</p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </div>

      <div className="mt-5 h-1 w-44 overflow-hidden rounded-full bg-slate-100">
        <div className="loader-sweep h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-brand-gold to-transparent" />
      </div>
    </div>
  );
}
