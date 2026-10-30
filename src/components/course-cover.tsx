import type { ReactNode } from "react";
import {
  getExamThumbnail,
  type ExamThumbnailPattern,
} from "@/lib/exam-thumbnails";
import { resolveMediaUrl } from "@/lib/media-store";
import { cn } from "@/lib/utils";

type CourseCoverProps = {
  courseId: string;
  name: string;
  /** Real cover image (URL or local: pointer). Falls back to the generated cover. */
  coverUrl?: string;
  className?: string;
  showCourseCode?: boolean;
  children?: ReactNode;
};

export function CourseCover({
  courseId,
  name,
  coverUrl,
  className,
  showCourseCode = true,
  children,
}: CourseCoverProps) {
  const style = getExamThumbnail(courseId);
  const Icon = style.icon;
  const coverSrc = resolveMediaUrl(coverUrl);

  if (coverSrc) {
    return (
      <div className={cn("group/cover relative w-full overflow-hidden", className)}>
        <img
          src={coverSrc}
          alt={`${name} cover`}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover/cover:scale-105"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        {showCourseCode && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center rounded-lg bg-black/60 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-white backdrop-blur-md border border-white/20 shadow-sm">
              {style.courseCode}
            </span>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/cover relative w-full overflow-hidden bg-gradient-to-br transition-all duration-300",
        style.gradient,
        className,
      )}
    >
      {/* ── 1. Dynamic Subject-Specific SVG Graphic Motif ── */}
      <CoursePatternSvg pattern={style.pattern} />

      {/* ── 2. Ambient Glowing Orbs ── */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full blur-2xl transition-transform duration-700 group-hover/cover:scale-125"
        style={{ background: style.glowColor }}
      />
      <div
        className="pointer-events-none absolute -left-10 -bottom-10 size-32 rounded-full blur-xl opacity-60"
        style={{ background: style.glowColor }}
      />

      {/* ── 3. Subtle Micro-Dot Texture ── */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.9) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* ── 4. Large Ghost Watermark Icon in Corner ── */}
      <Icon
        className="pointer-events-none absolute -bottom-4 -right-4 size-32 text-white/[0.07] transition-transform duration-500 group-hover/cover:scale-110 group-hover/cover:rotate-3"
        strokeWidth={1}
      />

      {/* ── 5. Luxury Glassmorphic Top Light Overlay ── */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/35" />

      {/* ── 6. Floating Glassmorphic Icon Medallion ── */}
      <div className="absolute left-4 top-4 z-10 flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg shadow-black/20 transition-transform duration-300 group-hover/cover:scale-105">
        <Icon className={cn("size-6 drop-shadow-sm", style.iconColor)} strokeWidth={2} />
      </div>

      {/* ── 7. Top-Right Course Code Pill ── */}
      {showCourseCode && (
        <div className="absolute right-4 top-4 z-10">
          <span className="inline-flex items-center rounded-xl bg-black/40 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-white backdrop-blur-md border border-white/20 shadow-sm transition group-hover/cover:bg-black/60">
            {style.courseCode}
          </span>
        </div>
      )}

      {/* ── 8. Child Badges Overlay ── */}
      {children}
    </div>
  );
}

/** Vector SVG illustrations matched to academic domains */
function CoursePatternSvg({ pattern }: { pattern: ExamThumbnailPattern }) {
  switch (pattern) {
    case "circuits":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 40 H120 L160 80 H280 L310 50 H400" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M40 200 V130 L90 80 V0" stroke="white" strokeWidth="1.5" />
          <path d="M220 200 V120 L260 80 H360 V200" stroke="white" strokeWidth="1.5" strokeDasharray="6 3" />
          <circle cx="160" cy="80" r="4" fill="white" />
          <circle cx="280" cy="80" r="4" fill="white" />
          <circle cx="90" cy="80" r="3.5" fill="white" />
          <rect x="230" y="60" width="40" height="40" rx="4" stroke="white" strokeWidth="1.2" />
        </svg>
      );

    case "atom":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="260" cy="100" rx="90" ry="32" stroke="white" strokeWidth="1.5" transform="rotate(-25 260 100)" />
          <ellipse cx="260" cy="100" rx="90" ry="32" stroke="white" strokeWidth="1.5" transform="rotate(35 260 100)" />
          <ellipse cx="260" cy="100" rx="90" ry="32" stroke="white" strokeWidth="1.5" transform="rotate(95 260 100)" />
          <circle cx="260" cy="100" r="7" fill="white" />
          <circle cx="330" cy="70" r="3.5" fill="white" />
          <circle cx="210" cy="125" r="3.5" fill="white" />
        </svg>
      );

    case "dna":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M120 20 Q160 100 200 180 T280 20 T360 180" stroke="white" strokeWidth="2" />
          <path d="M120 180 Q160 100 200 20 T280 180 T360 20" stroke="white" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="140" y1="60" x2="140" y2="140" stroke="white" strokeWidth="1.5" />
          <line x1="180" y1="40" x2="180" y2="160" stroke="white" strokeWidth="1.5" />
          <line x1="220" y1="40" x2="220" y2="160" stroke="white" strokeWidth="1.5" />
          <line x1="260" y1="60" x2="260" y2="140" stroke="white" strokeWidth="1.5" />
          <line x1="300" y1="40" x2="300" y2="160" stroke="white" strokeWidth="1.5" />
          <circle cx="200" cy="100" r="4" fill="white" />
        </svg>
      );

    case "geometry":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="160" y1="0" x2="160" y2="200" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="110" x2="400" y2="110" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="240" cy="110" r="60" stroke="white" strokeWidth="1.5" />
          <path d="M140 170 Q240 20 340 170" stroke="white" strokeWidth="2" />
          <polygon points="240,50 300,150 180,150" stroke="white" strokeWidth="1.5" fill="none" />
          <text x="320" y="80" fill="white" fontSize="22" fontFamily="serif" opacity="0.8">∫</text>
          <text x="180" y="70" fill="white" fontSize="18" fontFamily="serif" opacity="0.8">π</text>
        </svg>
      );

    case "matrix":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M150 40 H140 V160 H150" stroke="white" strokeWidth="2" />
          <path d="M330 40 H340 V160 H330" stroke="white" strokeWidth="2" />
          <path d="M120 160 Q240 20 360 160" stroke="white" strokeWidth="2" strokeDasharray="4 3" />
          <rect x="170" y="60" width="30" height="20" rx="3" stroke="white" strokeWidth="1" />
          <rect x="220" y="60" width="30" height="20" rx="3" stroke="white" strokeWidth="1" />
          <rect x="270" y="60" width="30" height="20" rx="3" stroke="white" strokeWidth="1" />
          <rect x="170" y="100" width="30" height="20" rx="3" stroke="white" strokeWidth="1" />
          <rect x="220" y="100" width="30" height="20" rx="3" stroke="white" strokeWidth="1" />
          <rect x="270" y="100" width="30" height="20" rx="3" stroke="white" strokeWidth="1" />
          <text x="210" y="150" fill="white" fontSize="20" fontFamily="serif">∑</text>
        </svg>
      );

    case "growth":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="140" y1="160" x2="380" y2="160" stroke="white" strokeWidth="1.5" />
          <line x1="140" y1="30" x2="140" y2="160" stroke="white" strokeWidth="1.5" />
          <rect x="170" y="110" width="16" height="50" fill="white" opacity="0.4" rx="2" />
          <rect x="205" y="90" width="16" height="70" fill="white" opacity="0.5" rx="2" />
          <rect x="240" y="120" width="16" height="40" fill="white" opacity="0.3" rx="2" />
          <rect x="275" y="70" width="16" height="90" fill="white" opacity="0.6" rx="2" />
          <rect x="310" y="50" width="16" height="110" fill="white" opacity="0.8" rx="2" />
          <path d="M150 140 Q220 120 280 80 T360 40" stroke="white" strokeWidth="2.5" />
          <polygon points="360,40 345,43 355,53" fill="white" />
        </svg>
      );

    case "contours":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M80 180 Q160 60 260 100 T390 40" stroke="white" strokeWidth="1.5" />
          <path d="M100 190 Q170 90 260 120 T390 70" stroke="white" strokeWidth="1.5" />
          <path d="M130 190 Q200 120 280 140 T390 100" stroke="white" strokeWidth="1.5" />
          <path d="M160 200 Q240 150 310 160 T390 130" stroke="white" strokeWidth="1.5" />
          <polygon points="260,70 290,140 230,140" stroke="white" strokeWidth="1.5" fill="none" />
          <polygon points="310,90 330,140 290,140" stroke="white" strokeWidth="1" fill="none" />
        </svg>
      );

    case "literary":
    case "quill":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M160 70 Q240 50 240 160" stroke="white" strokeWidth="1.5" />
          <path d="M320 70 Q240 50 240 160" stroke="white" strokeWidth="1.5" />
          <line x1="170" y1="90" x2="230" y2="90" stroke="white" strokeWidth="1" />
          <line x1="170" y1="110" x2="230" y2="110" stroke="white" strokeWidth="1" />
          <line x1="170" y1="130" x2="220" y2="130" stroke="white" strokeWidth="1" />
          <line x1="250" y1="90" x2="310" y2="90" stroke="white" strokeWidth="1" />
          <line x1="250" y1="110" x2="310" y2="110" stroke="white" strokeWidth="1" />
          <line x1="250" y1="130" x2="300" y2="130" stroke="white" strokeWidth="1" />
          <text x="330" y="80" fill="white" fontSize="40" fontFamily="serif" opacity="0.6">“</text>
        </svg>
      );

    case "pulse":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 100 H120 L135 70 L150 140 L170 30 L190 170 L205 85 L220 100 H400"
            stroke="white"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="170" cy="30" r="4" fill="white" />
          <circle cx="190" cy="170" r="4" fill="white" />
        </svg>
      );

    case "justice":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="190" y1="60" x2="330" y2="60" stroke="white" strokeWidth="2" />
          <line x1="260" y1="40" x2="260" y2="170" stroke="white" strokeWidth="2.5" />
          <polygon points="210,60 190,120 230,120" stroke="white" strokeWidth="1.5" fill="none" />
          <polygon points="310,60 290,120 330,120" stroke="white" strokeWidth="1.5" fill="none" />
          <rect x="230" y="170" width="60" height="15" rx="2" fill="white" opacity="0.6" />
        </svg>
      );

    case "globe":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="260" cy="100" r="65" stroke="white" strokeWidth="2" />
          <ellipse cx="260" cy="100" rx="35" ry="65" stroke="white" strokeWidth="1.5" />
          <ellipse cx="260" cy="100" rx="65" ry="30" stroke="white" strokeWidth="1.5" />
          <line x1="195" y1="100" x2="325" y2="100" stroke="white" strokeWidth="1.5" />
        </svg>
      );

    case "synapse":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M160 100 Q200 60 240 70 T320 50" stroke="white" strokeWidth="1.5" />
          <path d="M200 60 L220 120 L270 140 L340 130" stroke="white" strokeWidth="1.5" />
          <path d="M220 120 L190 170" stroke="white" strokeWidth="1.5" />
          <circle cx="160" cy="100" r="5" fill="white" />
          <circle cx="240" cy="70" r="4" fill="white" />
          <circle cx="320" cy="50" r="6" fill="white" />
          <circle cx="270" cy="140" r="5" fill="white" />
          <circle cx="340" cy="130" r="4" fill="white" />
        </svg>
      );

    case "rocket":
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M120 190 Q220 160 300 60" stroke="white" strokeWidth="2.5" strokeDasharray="5 3" />
          <polygon points="300,60 270,75 285,95" stroke="white" strokeWidth="2" fill="none" />
          <circle cx="330" cy="30" r="2.5" fill="white" />
          <circle cx="210" cy="40" r="1.5" fill="white" />
          <circle cx="350" cy="90" r="2" fill="white" />
          <circle cx="160" cy="100" r="2" fill="white" />
        </svg>
      );

    case "community":
    case "ancient":
    default:
      return (
        <svg
          className="pointer-events-none absolute inset-0 size-full opacity-25"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="250" cy="100" r="70" stroke="white" strokeWidth="1.5" strokeDasharray="5 3" />
          <circle cx="250" cy="100" r="45" stroke="white" strokeWidth="1.5" />
          <circle cx="250" cy="100" r="22" stroke="white" strokeWidth="2" />
          <circle cx="205" cy="100" r="4" fill="white" />
          <circle cx="295" cy="100" r="4" fill="white" />
          <circle cx="250" cy="55" r="4" fill="white" />
          <circle cx="250" cy="145" r="4" fill="white" />
        </svg>
      );
  }
}
