import type { SVGProps } from "react";
import type { EducationTheme } from "@/lib/frame-data";
import { cn } from "@/lib/utils";

interface Education3DIconProps extends SVGProps<SVGSVGElement> {
  theme: EducationTheme;
  className?: string;
  size?: number;
}

/**
 * High-fidelity 3D-styled SVG Education Insignias & Crests.
 * Each insignia features metallic gradients, 3D specular bevels,
 * depth shading, and glowing accents to give collectible profile frames
 * a rich academic prestige aesthetic.
 */
export function Education3DIcon({ theme, className, size = 32, ...props }: Education3DIconProps) {
  switch (theme) {
    // ── 1. New Learner: Sprouting Leaf & Mini Quill ──
    case "seedling":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_8px_rgba(34,197,94,0.5)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="seedlingGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
            <linearGradient id="leafGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="40%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="soilBrown" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
          {/* Base badge */}
          <circle cx="32" cy="32" r="28" fill="url(#seedlingGold)" />
          <circle cx="32" cy="32" r="25" fill="#0f172a" />
          {/* Sprout stem */}
          <path
            d="M32 46 C32 38 28 32 32 20"
            stroke="url(#leafGreen)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Left leaf */}
          <path
            d="M32 26 C24 24 20 16 26 14 C32 12 33 22 32 26 Z"
            fill="url(#leafGreen)"
            filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))"
          />
          {/* Right leaf */}
          <path
            d="M32 20 C38 18 44 14 42 8 C36 8 33 16 32 20 Z"
            fill="url(#leafGreen)"
            filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))"
          />
          {/* Dew drop highlight */}
          <circle cx="28" cy="18" r="1.5" fill="#ffffff" opacity="0.8" />
        </svg>
      );

    // ── 2. Knowledge Seeker: Astrolabe / Wisdom Compass ──
    case "compass":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_10px_rgba(59,130,246,0.6)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="compassRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="needleGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="url(#compassRing)" />
          <circle cx="32" cy="32" r="24" fill="#090d16" />
          {/* Dial tick marks */}
          <circle
            cx="32"
            cy="32"
            r="21"
            stroke="#60a5fa"
            strokeWidth="1"
            strokeDasharray="2 4"
            fill="none"
            opacity="0.6"
          />
          {/* North needle */}
          <polygon
            points="32,10 36,32 32,29 28,32"
            fill="#ef4444"
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.6))"
          />
          {/* South needle */}
          <polygon
            points="32,54 36,32 32,35 28,32"
            fill="url(#needleGold)"
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.6))"
          />
          {/* Center pivot */}
          <circle cx="32" cy="32" r="4" fill="#ffffff" />
          <circle cx="32" cy="32" r="2" fill="#1e3a8a" />
        </svg>
      );

    // ── 3. Quiz Champion: Winged Lightning Speed Medal ──
    case "lightning":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_12px_rgba(234,179,8,0.7)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="medallionPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#6b21a8" />
            </linearGradient>
          </defs>
          <polygon points="32,4 58,16 58,48 32,60 6,48 6,16" fill="url(#medallionPurple)" />
          <polygon points="32,8 54,19 54,45 32,55 10,45 10,19" fill="#1e1b4b" />
          {/* 3D Lightning Bolt */}
          <path
            d="M34 14 L20 32 L30 32 L26 50 L44 28 L32 28 Z"
            fill="url(#boltGrad)"
            filter="drop-shadow(0 2px 6px rgba(250,204,21,0.8))"
          />
          <path d="M34 14 L30 32 L44 28 Z" fill="#ffffff" opacity="0.4" />
        </svg>
      );

    // ── 4. Scholar: 3D Mortarboard & Golden Laurel ──
    case "mortarboard":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_12px_rgba(168,85,247,0.7)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="capGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            <linearGradient id="capTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          {/* Laurel branch arc left */}
          <path
            d="M12 44 C8 32 14 18 22 14"
            stroke="url(#capGold)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Laurel branch arc right */}
          <path
            d="M52 44 C56 32 50 18 42 14"
            stroke="url(#capGold)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Cap skull cap under */}
          <path
            d="M22 30 Q32 38 42 30 L42 38 Q32 46 22 38 Z"
            fill="#0f172a"
            stroke="url(#capGold)"
            strokeWidth="1.5"
          />
          {/* Diamond top */}
          <polygon
            points="32,12 56,24 32,36 8,24"
            fill="url(#capTop)"
            stroke="url(#capGold)"
            strokeWidth="2"
            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
          />
          {/* Button center */}
          <circle cx="32" cy="24" r="3" fill="url(#capGold)" />
          {/* Tassel */}
          <path
            d="M32 24 C40 25 46 32 45 42"
            stroke="url(#capGold)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="45" cy="42" r="2.5" fill="url(#capGold)" />
        </svg>
      );

    // ── 5. Exam Master: Diploma & Red Wax Seal ──
    case "diploma":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_12px_rgba(245,158,11,0.8)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="parchment" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="70%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="waxSeal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="70%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>
          {/* Rolled parchment diploma */}
          <rect
            x="12"
            y="24"
            width="40"
            height="16"
            rx="4"
            transform="rotate(-15 32 32)"
            fill="url(#parchment)"
            stroke="#b45309"
            strokeWidth="2"
            filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))"
          />
          {/* Ribbon */}
          <rect x="29" y="22" width="6" height="20" transform="rotate(-15 32 32)" fill="#dc2626" />
          {/* Red Wax Seal */}
          <circle
            cx="36"
            cy="30"
            r="9"
            fill="url(#waxSeal)"
            filter="drop-shadow(0 2px 5px rgba(0,0,0,0.6))"
          />
          <circle
            cx="36"
            cy="30"
            r="7"
            stroke="#fecaca"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
          <polygon
            points="36,25 38,29 42,29 39,32 40,36 36,33 32,36 33,32 30,29 34,29"
            fill="#fef08a"
          />
        </svg>
      );

    // ── 6. Book Master: Ancient Rune Tome ──
    case "tome":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_14px_rgba(217,119,6,0.8)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="50%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="runeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          {/* Book base */}
          <rect
            x="14"
            y="14"
            width="36"
            height="42"
            rx="4"
            fill="url(#bookCover)"
            stroke="#f59e0b"
            strokeWidth="2.5"
            filter="drop-shadow(0 6px 10px rgba(0,0,0,0.6))"
          />
          {/* Spine bar */}
          <rect
            x="14"
            y="14"
            width="7"
            height="42"
            fill="#451a03"
            stroke="#d97706"
            strokeWidth="1"
          />
          {/* Pages block bottom */}
          <path d="M21 54 L48 54 L50 51 L21 51 Z" fill="#fef3c7" />
          {/* Gold corner ornaments */}
          <polygon points="42,14 50,14 50,22" fill="#fbbf24" />
          <polygon points="42,56 50,56 50,48" fill="#fbbf24" />
          {/* Center glowing emblem */}
          <circle cx="34" cy="35" r="9" fill="#0f172a" stroke="url(#runeGlow)" strokeWidth="2" />
          <polygon
            points="34,29 36,33 40,33 37,36 38,40 34,37 30,40 31,36 28,33 32,33"
            fill="url(#runeGlow)"
          />
        </svg>
      );

    // ── 7. Future Leader: Imperial Crown of Wisdom ──
    case "crown":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_14px_rgba(6,182,212,0.85)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fde047" />
              <stop offset="65%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id="emeraldGem" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
          </defs>
          {/* Velvet base cap */}
          <path d="M16 44 C16 34 24 28 32 28 C40 28 48 34 48 44 Z" fill="#064e3b" opacity="0.9" />
          {/* 3D Crown rim */}
          <rect
            x="12"
            y="44"
            width="40"
            height="9"
            rx="3"
            fill="url(#crownGold)"
            stroke="#78350f"
            strokeWidth="1"
            filter="drop-shadow(0 3px 5px rgba(0,0,0,0.5))"
          />
          {/* Crown peaks */}
          <path
            d="M12 44 L16 26 L24 35 L32 20 L40 35 L48 26 L52 44 Z"
            fill="url(#crownGold)"
            stroke="#854d0e"
            strokeWidth="1.5"
            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
          />
          {/* Center emerald gem */}
          <polygon
            points="32,45 35,48 32,51 29,48"
            fill="url(#emeraldGem)"
            stroke="#ffffff"
            strokeWidth="0.8"
          />
          {/* Peak stars */}
          <circle cx="32" cy="18" r="2.5" fill="#ffffff" />
          <circle cx="16" cy="24" r="2" fill="#38bdf8" />
          <circle cx="48" cy="24" r="2" fill="#38bdf8" />
        </svg>
      );

    // ── 8. Graduation Legend: Platinum Mortarboard & Gold Ribbon ──
    case "platinum-cap":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_16px_rgba(56,189,248,0.9)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="platinum" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#e2e8f0" />
              <stop offset="80%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="solarCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>
          {/* Sunburst rays behind */}
          <circle
            cx="32"
            cy="30"
            r="22"
            fill="none"
            stroke="url(#solarCyan)"
            strokeWidth="1.5"
            strokeDasharray="3 4"
            opacity="0.6"
          />
          {/* Cap base skull */}
          <path
            d="M22 36 Q32 44 42 36 L42 42 Q32 50 22 42 Z"
            fill="#1e293b"
            stroke="url(#platinum)"
            strokeWidth="1.5"
          />
          {/* Main diamond top */}
          <polygon
            points="32,14 58,26 32,38 6,26"
            fill="url(#platinum)"
            stroke="#38bdf8"
            strokeWidth="2.5"
            filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"
          />
          <polygon points="32,17 52,26 32,35 12,26" fill="#0f172a" />
          {/* Center radiant jewel */}
          <circle cx="32" cy="26" r="3.5" fill="#38bdf8" />
          {/* Floating gold tassel */}
          <path
            d="M32 26 C42 27 50 34 49 46"
            stroke="#facc15"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="49" cy="46" r="3" fill="#facc15" />
        </svg>
      );

    // ── 9. SSR: Grand Cosmic Phoenix of Knowledge ──
    case "phoenix-sun":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_6px_20px_rgba(245,158,11,1)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="ssrGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
            <linearGradient id="ssrCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
          </defs>
          {/* Outer rotating halo aura ring */}
          <ellipse
            cx="32"
            cy="32"
            rx="26"
            ry="16"
            fill="none"
            stroke="url(#ssrCyan)"
            strokeWidth="2"
            transform="rotate(-25 32 32)"
            opacity="0.8"
          />
          <ellipse
            cx="32"
            cy="32"
            rx="26"
            ry="16"
            fill="none"
            stroke="url(#ssrGold)"
            strokeWidth="2"
            transform="rotate(25 32 32)"
            opacity="0.8"
          />
          {/* Golden Wings left & right */}
          <path
            d="M32 36 C20 30 10 20 4 10 C14 14 24 22 32 32 Z"
            fill="url(#ssrGold)"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
          />
          <path
            d="M32 36 C44 30 54 20 60 10 C50 14 40 22 32 32 Z"
            fill="url(#ssrGold)"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
          />
          {/* Center glowing core solar sphere */}
          <circle
            cx="32"
            cy="32"
            r="10"
            fill="url(#ssrGold)"
            filter="drop-shadow(0 0 10px #f59e0b)"
          />
          <circle cx="32" cy="32" r="7" fill="#0f172a" />
          {/* Multi-tier star burst */}
          <polygon points="32,22 35,29 42,32 35,35 32,42 29,35 22,32 29,29" fill="url(#ssrCyan)" />
          <circle cx="32" cy="32" r="2.5" fill="#ffffff" />
        </svg>
      );

    // ── 10. Learning Hero: Hero's Shield ──
    case "shield":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_10px_rgba(100,116,139,0.6)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <path
            d="M32 6 C48 6 54 14 54 28 C54 44 38 56 32 60 C26 56 10 44 10 28 C10 14 16 6 32 6 Z"
            fill="url(#shieldGrad)"
            stroke="#f8fafc"
            strokeWidth="2"
            filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))"
          />
          {/* Open Book Ingot */}
          <path
            d="M22 28 C26 26 30 27 32 29 C34 27 38 26 42 28 L42 40 C38 38 34 39 32 41 C30 39 26 38 22 40 Z"
            fill="#ffffff"
          />
        </svg>
      );

    // ── 11. Study Warrior: Blade & Emerald Ribbon ──
    case "sword-quill":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_10px_rgba(16,185,129,0.7)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="steel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          {/* Crossed quill & sword */}
          <line
            x1="12"
            y1="52"
            x2="52"
            y2="12"
            stroke="url(#steel)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="52"
            y1="52"
            x2="12"
            y2="12"
            stroke="#eab308"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Center emerald seal */}
          <circle cx="32" cy="32" r="9" fill="#059669" stroke="#34d399" strokeWidth="2" />
          <polygon
            points="32,26 34,30 38,30 35,33 36,37 32,34 28,37 29,33 26,30 30,30"
            fill="#ffffff"
          />
        </svg>
      );

    // ── 12. Top Student: Star Diamond ──
    case "diamond-star":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_12px_rgba(59,130,246,0.8)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="diamondCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#93c5fd" />
              <stop offset="80%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
          <polygon
            points="32,6 52,22 42,56 22,56 12,22"
            fill="url(#diamondCyan)"
            stroke="#ffffff"
            strokeWidth="2"
            filter="drop-shadow(0 6px 10px rgba(0,0,0,0.5))"
          />
          {/* Facet lines */}
          <polygon points="32,6 40,22 32,34 24,22" fill="#ffffff" opacity="0.6" />
          <polygon points="32,34 40,22 42,56" fill="#1d4ed8" opacity="0.4" />
          <polygon points="32,34 24,22 22,56" fill="#1e40af" opacity="0.4" />
        </svg>
      );

    // ── 13. Genius: Quantum Brain & Atom Orbit ──
    case "quantum-brain":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_14px_rgba(168,85,247,0.85)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="brainNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0abfc" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>
          </defs>
          {/* Orbital electron rings */}
          <ellipse
            cx="32"
            cy="32"
            rx="26"
            ry="10"
            fill="none"
            stroke="#e879f9"
            strokeWidth="1.5"
            transform="rotate(30 32 32)"
            opacity="0.8"
          />
          <ellipse
            cx="32"
            cy="32"
            rx="26"
            ry="10"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            transform="rotate(-30 32 32)"
            opacity="0.8"
          />
          <circle
            cx="32"
            cy="32"
            r="14"
            fill="url(#brainNeon)"
            filter="drop-shadow(0 0 10px #c084fc)"
          />
          {/* Synapse node lights */}
          <circle cx="28" cy="28" r="2" fill="#ffffff" />
          <circle cx="36" cy="28" r="2" fill="#ffffff" />
          <circle cx="32" cy="36" r="2" fill="#ffffff" />
        </svg>
      );

    // ── 14. Streak Master: Flaming Torch of Study ──
    case "eternal-torch":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_14px_rgba(249,115,22,0.85)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="torchFlame" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="90%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <linearGradient id="torchHandle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          {/* Torch cone handle */}
          <polygon
            points="26,38 38,38 34,60 30,60"
            fill="url(#torchHandle)"
            stroke="#451a03"
            strokeWidth="1.5"
          />
          <rect
            x="23"
            y="34"
            width="18"
            height="6"
            rx="2"
            fill="#f59e0b"
            stroke="#78350f"
            strokeWidth="1"
          />
          {/* Outer flame */}
          <path
            d="M32 6 C42 16 44 26 38 34 C34 32 30 32 26 34 C20 26 22 16 32 6 Z"
            fill="url(#torchFlame)"
            filter="drop-shadow(0 0 10px #f97316)"
          />
          {/* Inner core flame */}
          <path
            d="M32 14 C36 20 38 26 34 32 C32 30 30 30 28 32 C26 26 28 20 32 14 Z"
            fill="#ffffff"
            opacity="0.9"
          />
        </svg>
      );

    // ── 15. Exam Hero: Golden Champion Trophy ──
    case "trophy-cup":
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_14px_rgba(245,158,11,0.85)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="goldTrophy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fde047" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          {/* Handles */}
          <path
            d="M18 18 C8 18 8 32 22 34"
            stroke="url(#goldTrophy)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M46 18 C56 18 56 32 42 34"
            stroke="url(#goldTrophy)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Cup chalice */}
          <path
            d="M20 12 L44 12 L40 36 C38 42 26 42 24 36 Z"
            fill="url(#goldTrophy)"
            stroke="#78350f"
            strokeWidth="1.5"
            filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))"
          />
          {/* Stem & base */}
          <rect
            x="29"
            y="38"
            width="6"
            height="12"
            fill="url(#goldTrophy)"
            stroke="#78350f"
            strokeWidth="1"
          />
          <rect
            x="20"
            y="50"
            width="24"
            height="8"
            rx="2"
            fill="#1e293b"
            stroke="url(#goldTrophy)"
            strokeWidth="1.5"
          />
          {/* Star on cup */}
          <polygon
            points="32,18 34,23 39,23 35,26 37,31 32,28 27,31 29,26 25,23 30,23"
            fill="#ffffff"
          />
        </svg>
      );

    // ── 16. Academic Elite: Imperial Laurel Crown ──
    case "laurel-crown":
    default:
      return (
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("drop-shadow-[0_4px_14px_rgba(234,179,8,0.85)]", className)}
          {...props}
        >
          <defs>
            <linearGradient id="laurelGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fde047" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
          </defs>
          {/* Left wreath leaves */}
          <path
            d="M14 44 C8 28 16 16 26 10 C22 18 20 28 26 36"
            stroke="url(#laurelGold)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Right wreath leaves */}
          <path
            d="M50 44 C56 28 48 16 38 10 C42 18 44 28 38 36"
            stroke="url(#laurelGold)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Central Imperial Gem */}
          <circle
            cx="32"
            cy="34"
            r="8"
            fill="#1e1b4b"
            stroke="url(#laurelGold)"
            strokeWidth="2.5"
          />
          <polygon
            points="32,28 34,32 38,32 35,35 36,39 32,36 28,39 29,35 26,32 30,32"
            fill="#facc15"
          />
          {/* Tied ribbon at bottom */}
          <path
            d="M26 48 Q32 54 38 48 L42 58 L32 52 L22 58 Z"
            fill="url(#laurelGold)"
            stroke="#78350f"
            strokeWidth="1"
          />
        </svg>
      );
  }
}
