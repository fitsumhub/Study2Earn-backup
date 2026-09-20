/**
 * ProfileFrameAvatar
 *
 * Renders a user avatar with an authentic collectible profile frame overlay,
 * multi-tier radiant glow, rotating energy auras, and a 3D Education Insignia crest.
 *
 * Visual layer stack (bottom → top):
 *   1. Ambient outer halo bloom
 *   2. Concentric radial glow core
 *   3. Outer rotating conic-gradient aura ring
 *   4. Counter-rotating inner energy vortex (Mythic & SSR)
 *   5. Avatar circle (initials or custom photo)
 *   6. Metallic 3D beveled frame ring border with specular highlight
 *   7. Light sweep beam
 *   8. Floating ambient energy particles (EPIC+)
 *   9. 3D Education Insignia Crest mounted with floating elevation
 *
 * All animations respect `prefers-reduced-motion`.
 */

import { getFrameById, RARITY_META, type Rarity } from "@/lib/frame-data";
import { Education3DIcon } from "@/components/frames/Education3DIcon";
import { cn } from "@/lib/utils";

// ─── Size config ──────────────────────────────────────────────────────────────

const SIZE_MAP = {
  xs: {
    outer: 44,
    avatar: 32,
    border: 3,
    crestSize: 18,
    crestTop: -7,
    fontSize: "text-[10px]",
  },
  sm: {
    outer: 62,
    avatar: 44,
    border: 3.5,
    crestSize: 24,
    crestTop: -9,
    fontSize: "text-xs",
  },
  md: {
    outer: 92,
    avatar: 64,
    border: 4.5,
    crestSize: 34,
    crestTop: -14,
    fontSize: "text-sm",
  },
  lg: {
    outer: 128,
    avatar: 88,
    border: 5.5,
    crestSize: 46,
    crestTop: -18,
    fontSize: "text-base",
  },
  xl: {
    outer: 180,
    avatar: 128,
    border: 6.5,
    crestSize: 64,
    crestTop: -24,
    fontSize: "text-xl",
  },
} as const;

type AvatarSize = keyof typeof SIZE_MAP;

// ─── Component ────────────────────────────────────────────────────────────────

interface ProfileFrameAvatarProps {
  /** User initials to display when no avatar image */
  initials: string;
  /** Avatar image URL — if provided, shown instead of initials */
  avatarUrl?: string;
  /** Frame ID from PROFILE_FRAMES — drives all visual styling */
  frameId?: string | null;
  size?: AvatarSize;
  className?: string;
  /** Extra CSS class applied to the inner avatar circle */
  avatarClassName?: string;
  /** Whether this frame is currently equipped (adds extra radiant emphasis) */
  equipped?: boolean;
}

export function ProfileFrameAvatar({
  initials,
  avatarUrl,
  frameId,
  size = "md",
  className,
  avatarClassName,
  equipped = false,
}: ProfileFrameAvatarProps) {
  const frame = frameId ? getFrameById(frameId) : null;
  const rarity: Rarity | null = frame?.rarity ?? null;
  const meta = rarity ? RARITY_META[rarity] : null;
  const s = SIZE_MAP[size];
  const hasFrame = !!frame && !!meta;
  const showParticles = hasFrame && meta.particles;

  // Primary rotating aura
  const auraStyle = hasFrame
    ? {
        animation: `frameAuraRotate ${meta.rotationSecs}s linear infinite`,
        background: `conic-gradient(from 0deg, transparent 0%, ${meta.auraColor} 25%, transparent 50%, ${meta.glowColor} 75%, transparent 100%)`,
      }
    : undefined;

  // Frame outer & inner multi-layer glow
  const glowStyle = hasFrame
    ? {
        boxShadow: `0 0 ${equipped ? 28 : 16}px ${equipped ? 4 : 2}px ${meta.glowColor}, 0 0 ${equipped ? 54 : 36}px ${meta.auraColor}, 0 0 ${equipped ? 80 : 50}px ${meta.haloColor}`,
      }
    : undefined;

  // Metallic 3D beveled frame border
  const frameRingStyle = hasFrame
    ? {
        border: `${s.border}px solid`,
        borderColor:
          rarity === "SSR"
            ? "transparent"
            : meta.glowColor.replace("0.", "0.9").replace(", 0.", ", 0.9"),
        background:
          rarity === "SSR"
            ? `linear-gradient(white, white) padding-box, linear-gradient(135deg, #f59e0b, #fbbf24, #06b6d4, #f59e0b) border-box`
            : undefined,
      }
    : undefined;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center select-none", className)}
      style={{ width: s.outer, height: s.outer }}
    >
      {/* ── 1. Deep Ambient Halo Bloom ── */}
      {hasFrame && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -12,
            background: `radial-gradient(circle, ${meta.haloColor} 0%, transparent 72%)`,
            opacity: equipped ? 0.95 : 0.65,
            animation: "frameHaloPulse 3.5s ease-in-out infinite",
          }}
        />
      )}

      {/* ── 2. Concentric Core Radial Glow ── */}
      {hasFrame && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -4,
            background: `radial-gradient(circle, ${meta.glowColor} 0%, ${meta.auraColor} 45%, transparent 75%)`,
            opacity: equipped ? 1 : 0.8,
            animation: "frameGlowPulse 2.8s ease-in-out infinite",
          }}
        />
      )}

      {/* ── 3. Primary Rotating Energy Aura Ring ── */}
      {hasFrame && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -6,
            ...auraStyle,
          }}
        />
      )}

      {/* ── 4. Counter-rotating inner energy vortex for Mythic & SSR ── */}
      {hasFrame && (rarity === "MYTHIC" || rarity === "SSR") && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -2,
            background: `conic-gradient(from 180deg, transparent 0%, ${meta.glowColor} 30%, transparent 60%, ${meta.auraColor} 80%, transparent 100%)`,
            animation: `frameAuraRotate ${meta.rotationSecs * 1.5}s linear infinite reverse`,
            opacity: 0.85,
          }}
        />
      )}

      {/* ── 5. Avatar circle with Metallic 3D Frame Ring ── */}
      <div
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full overflow-hidden font-bold text-white",
          avatarUrl ? "bg-transparent" : "bg-gradient-to-br from-brand-navy to-slate-900",
          s.fontSize,
          avatarClassName,
        )}
        style={{
          width: s.avatar,
          height: s.avatar,
          ...glowStyle,
          ...frameRingStyle,
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
        ) : (
          <span className="z-10 tracking-tight font-serif drop-shadow-md">{initials}</span>
        )}

        {/* ── 6. Periodic Light Sweep Beam ── */}
        {hasFrame && (
          <div
            className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
            aria-hidden
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.6) 50%, transparent 80%)",
                animation: "frameLightSweep 4.5s ease-in-out infinite",
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          </div>
        )}
      </div>

      {/* ── 7. 3D Education Insignia Crest (Mounted at Top) ── */}
      {hasFrame && frame.theme && (
        <div
          className="absolute z-30 pointer-events-none transition-transform"
          style={{
            top: s.crestTop,
            animation: "frameCrestFloat 3.5s ease-in-out infinite",
            filter: `drop-shadow(0 0 ${equipped ? 12 : 6}px ${meta.glowColor})`,
          }}
        >
          <Education3DIcon theme={frame.theme} size={s.crestSize} />
        </div>
      )}

      {/* ── 8. Corner Laurel Ornaments for EPIC+ ── */}
      {hasFrame && ["EPIC", "LEGENDARY", "MYTHIC", "SSR"].includes(rarity!) && (
        <CornerDecorations size={s.outer} rarity={rarity!} color={meta.glowColor} />
      )}

      {/* ── 9. Ambient Orbit Energy Particles for EPIC+ ── */}
      {showParticles && <FrameParticles rarity={rarity!} meta={meta} containerSize={s.outer} />}

      {/* ── 10. Equipped Pulse Highlight Ring ── */}
      {equipped && hasFrame && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `2px solid ${meta.glowColor}`,
            animation: "frameEquippedPulse 2s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CornerDecorations({
  size,
  rarity,
  color,
}: {
  size: number;
  rarity: Rarity;
  color: string;
}) {
  const decorSize = Math.max(10, size * 0.17);
  const offset = -decorSize * 0.25;
  const opacity = rarity === "SSR" ? 1 : rarity === "MYTHIC" ? 0.9 : 0.75;

  return (
    <>
      {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((corner) => {
        const isTop = corner.startsWith("top");
        const isLeft = corner.endsWith("left");
        return (
          <svg
            key={corner}
            width={decorSize}
            height={decorSize}
            viewBox="0 0 16 16"
            className="absolute pointer-events-none z-20"
            style={{
              top: isTop ? offset : undefined,
              bottom: !isTop ? offset : undefined,
              left: isLeft ? offset : undefined,
              right: !isLeft ? offset : undefined,
              opacity,
              filter: `drop-shadow(0 0 4px ${color})`,
              transform: `rotate(${isTop && isLeft ? 0 : isTop && !isLeft ? 90 : !isTop && isLeft ? 270 : 180}deg)`,
            }}
            fill={color}
          >
            {/* Laurel leaf corner flourish */}
            <path d="M8 0 C12 2 15 6 15 12 C10 10 6 7 8 0 Z" />
            <circle cx="8" cy="14" r="1.5" />
          </svg>
        );
      })}
    </>
  );
}

function FrameParticles({
  rarity,
  meta,
  containerSize,
}: {
  rarity: Rarity;
  meta: (typeof RARITY_META)[Rarity];
  containerSize: number;
}) {
  const particleCount = rarity === "SSR" ? 10 : rarity === "MYTHIC" ? 7 : 5;
  const r = containerSize / 2 + 12;

  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * 360;
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * r + containerSize / 2;
        const y = Math.sin(rad) * r + containerSize / 2;
        const pSize = 2.5 + (i % 3);
        const delay = (i / particleCount) * 2;

        return (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: pSize,
              height: pSize,
              left: x,
              top: y,
              backgroundColor: i % 2 === 0 ? meta.glowColor : meta.auraColor,
              opacity: 0.75,
              transform: "translate(-50%, -50%)",
              animation: `frameParticleFloat ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
              filter: `blur(${pSize > 3.5 ? 0.6 : 0}px)`,
              boxShadow: `0 0 6px ${meta.glowColor}`,
            }}
          />
        );
      })}
    </>
  );
}
