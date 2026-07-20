import type { ReactNode } from "react";

import { getExamThumbnail } from "@/lib/exam-thumbnails";
import { resolveMediaUrl } from "@/lib/media-store";
import { cn } from "@/lib/utils";

type CourseCoverProps = {
  courseId: string;
  name: string;
  /** Real cover image (URL or local: pointer). Falls back to the generated cover. */
  coverUrl?: string;
  className?: string;
  children?: ReactNode;
};

export function CourseCover({ courseId, name, coverUrl, className, children }: CourseCoverProps) {
  const style = getExamThumbnail(courseId);
  const Icon = style.icon;
  const coverSrc = resolveMediaUrl(coverUrl);

  if (coverSrc) {
    return (
      <div className={cn("group/cover relative w-full overflow-hidden", className)}>
        <img
          src={coverSrc}
          alt={`${name} cover`}
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/5" />
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/cover relative w-full overflow-hidden bg-gradient-to-br",
        style.gradient,
        className,
      )}
    >
      {/* Dot texture */}
      <div
        className="absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.9) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      {/* Large ghost icon watermark */}
      <Icon
        className="pointer-events-none absolute -bottom-6 -right-5 size-32 text-white/[0.08] transition-transform duration-300 group-hover:scale-110"
        strokeWidth={1}
      />

      {/* Top gloss */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25" />

      {/* Foreground icon medallion */}
      <div className="absolute left-5 top-5 grid size-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
        <Icon className={cn("size-6", style.iconColor)} strokeWidth={1.75} />
      </div>

      {children}
    </div>
  );
}
