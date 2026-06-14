import { getBookThumbnail } from "@/lib/book-thumbnails";
import { cn } from "@/lib/utils";

type BookCoverProps = {
  short: string;
  tint?: string;
  id?: string;
  name?: string;
  category?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function BookCover({ short, id, name, category, className, size = "md" }: BookCoverProps) {
  const style = getBookThumbnail(short, id);
  const Icon = style.icon;
  const trackLabel = category ?? style.label;

  return (
    <div
      className={cn(
        "group/cover relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-md outline-1 -outline-offset-1 outline-black/10 transition duration-300 group-hover:scale-[1.02] group-hover:shadow-xl",
        className,
      )}
    >
      {/* Main cover face */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", style.gradient)} />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />

      {/* Top gloss */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/30" />

      {/* Spine */}
      <div className="absolute bottom-0 left-0 top-0 w-[10%] bg-black/25 shadow-[inset_-2px_0_8px_rgba(0,0,0,0.35)]" />
      <div className="absolute bottom-2 left-[3%] top-2 w-px bg-white/15" />

      {/* Content */}
      <div className="relative flex h-full flex-col justify-between p-[10%] pl-[14%]">
        <div>
          <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/50 sm:text-[8px]">
            MoE · Ethiopia
          </p>
          <p
            className={cn(
              "mt-1 font-bold uppercase tracking-wider text-brand-gold/90",
              size === "sm" ? "text-[6px]" : "text-[7px] sm:text-[8px]",
            )}
          >
            {trackLabel}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center py-2">
          <div
            className={cn(
              "grid place-items-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm",
              size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-10 sm:size-12",
            )}
          >
            <Icon
              className={cn(
                style.iconColor,
                size === "sm" ? "size-4" : size === "lg" ? "size-7" : "size-5 sm:size-6",
              )}
              strokeWidth={1.5}
            />
          </div>
        </div>

        <div>
          <p
            className={cn(
              "font-serif font-bold leading-tight text-white",
              size === "sm" ? "text-[10px]" : size === "lg" ? "text-base" : "text-xs sm:text-sm",
            )}
          >
            {short}
          </p>
          {name && size !== "sm" && (
            <p className="mt-0.5 line-clamp-2 text-[7px] leading-snug text-white/65 sm:text-[8px]">
              {name}
            </p>
          )}
        </div>
      </div>

      {/* Bottom edge highlight */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}
