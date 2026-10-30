import type { LucideIcon } from "lucide-react";
import {
  Atom,
  Brain,
  Calculator,
  Cpu,
  Dna,
  Dumbbell,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Languages,
  Mountain,
  PenLine,
  Rocket,
  Sigma,
  TrendingUp,
  UsersRound,
} from "lucide-react";

export type ExamThumbnailPattern =
  | "circuits"
  | "atom"
  | "community"
  | "dna"
  | "geometry"
  | "matrix"
  | "literary"
  | "quill"
  | "pulse"
  | "justice"
  | "growth"
  | "globe"
  | "contours"
  | "synapse"
  | "rocket"
  | "ancient";

export type ExamThumbnailStyle = {
  courseCode: string;
  gradient: string;
  glowColor: string;
  icon: LucideIcon;
  iconColor: string;
  pattern: ExamThumbnailPattern;
  accentBadge: string;
  borderColor: string;
};

const byCourseId: Record<string, ExamThumbnailStyle> = {
  "emerging-tech": {
    courseCode: "EMTG 1011",
    gradient: "from-[#081534] via-[#0f2c69] to-[#0a183d]",
    glowColor: "rgba(56, 189, 248, 0.4)",
    icon: Cpu,
    iconColor: "text-cyan-300",
    pattern: "circuits",
    accentBadge: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
    borderColor: "#38bdf8",
  },
  "general-physics": {
    courseCode: "PHYS 1011",
    gradient: "from-[#042036] via-[#03456c] to-[#022b44]",
    glowColor: "rgba(34, 211, 238, 0.4)",
    icon: Atom,
    iconColor: "text-cyan-200",
    pattern: "atom",
    accentBadge: "bg-sky-500/20 text-sky-200 border-sky-400/30",
    borderColor: "#22d3ee",
  },
  inclusiveness: {
    courseCode: "INCL 1011",
    gradient: "from-[#431407] via-[#852a0a] to-[#5a1b05]",
    glowColor: "rgba(251, 146, 60, 0.4)",
    icon: HeartHandshake,
    iconColor: "text-amber-200",
    pattern: "community",
    accentBadge: "bg-orange-500/20 text-orange-200 border-orange-400/30",
    borderColor: "#fb923c",
  },
  "general-biology": {
    courseCode: "BIOL 1012",
    gradient: "from-[#052e16] via-[#14532d] to-[#0a351a]",
    glowColor: "rgba(74, 222, 128, 0.4)",
    icon: Dna,
    iconColor: "text-emerald-300",
    pattern: "dna",
    accentBadge: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    borderColor: "#4ade80",
  },
  "math-natural": {
    courseCode: "MATH 1011",
    gradient: "from-[#2e1065] via-[#4c1d95] to-[#3b0764]",
    glowColor: "rgba(192, 132, 252, 0.4)",
    icon: Sigma,
    iconColor: "text-purple-200",
    pattern: "geometry",
    accentBadge: "bg-purple-500/20 text-purple-200 border-purple-400/30",
    borderColor: "#c084fc",
  },
  "math-social": {
    courseCode: "MATH 1012",
    gradient: "from-[#3b0764] via-[#581c87] to-[#4a044e]",
    glowColor: "rgba(232, 121, 249, 0.4)",
    icon: Calculator,
    iconColor: "text-fuchsia-200",
    pattern: "matrix",
    accentBadge: "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/30",
    borderColor: "#e879f9",
  },
  "english-i": {
    courseCode: "ENGL 1011",
    gradient: "from-[#451a03] via-[#78350f] to-[#542104]",
    glowColor: "rgba(251, 191, 36, 0.4)",
    icon: Languages,
    iconColor: "text-amber-200",
    pattern: "literary",
    accentBadge: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    borderColor: "#fbbf24",
  },
  "english-ii": {
    courseCode: "ENGL 1012",
    gradient: "from-[#431407] via-[#7c2d12] to-[#501704]",
    glowColor: "rgba(249, 115, 22, 0.4)",
    icon: PenLine,
    iconColor: "text-orange-200",
    pattern: "quill",
    accentBadge: "bg-orange-500/20 text-orange-200 border-orange-400/30",
    borderColor: "#f97316",
  },
  "physical-fitness": {
    courseCode: "SPTE 1011",
    gradient: "from-[#450a0a] via-[#7f1d1d] to-[#580b0b]",
    glowColor: "rgba(248, 113, 113, 0.4)",
    icon: Dumbbell,
    iconColor: "text-rose-200",
    pattern: "pulse",
    accentBadge: "bg-rose-500/20 text-rose-200 border-rose-400/30",
    borderColor: "#f87171",
  },
  "moral-citizenship": {
    courseCode: "MCED 1011",
    gradient: "from-[#042f2e] via-[#115e59] to-[#0a3f3d]",
    glowColor: "rgba(45, 212, 191, 0.4)",
    icon: Landmark,
    iconColor: "text-teal-200",
    pattern: "justice",
    accentBadge: "bg-teal-500/20 text-teal-200 border-teal-400/30",
    borderColor: "#2dd4bf",
  },
  economics: {
    courseCode: "ECON 1011",
    gradient: "from-[#172554] via-[#1e40af] to-[#1e3a8a]",
    glowColor: "rgba(96, 165, 250, 0.4)",
    icon: TrendingUp,
    iconColor: "text-blue-200",
    pattern: "growth",
    accentBadge: "bg-blue-500/20 text-blue-200 border-blue-400/30",
    borderColor: "#60a5fa",
  },
  "global-affairs": {
    courseCode: "GLAF 1011",
    gradient: "from-[#083344] via-[#0e7490] to-[#155e75]",
    glowColor: "rgba(56, 189, 248, 0.4)",
    icon: Globe2,
    iconColor: "text-sky-200",
    pattern: "globe",
    accentBadge: "bg-sky-500/20 text-sky-200 border-sky-400/30",
    borderColor: "#38bdf8",
  },
  "geography-ethiopia": {
    courseCode: "GEOG 1011",
    gradient: "from-[#422006] via-[#713f12] to-[#542d07]",
    glowColor: "rgba(250, 204, 21, 0.4)",
    icon: Mountain,
    iconColor: "text-yellow-200",
    pattern: "contours",
    accentBadge: "bg-yellow-500/20 text-yellow-200 border-yellow-400/30",
    borderColor: "#facc15",
  },
  "general-psychology": {
    courseCode: "PSYC 1011",
    gradient: "from-[#4c0519] via-[#881337] to-[#5b0821]",
    glowColor: "rgba(251, 113, 133, 0.4)",
    icon: Brain,
    iconColor: "text-rose-200",
    pattern: "synapse",
    accentBadge: "bg-pink-500/20 text-pink-200 border-pink-400/30",
    borderColor: "#fb7185",
  },
  entrepreneurship: {
    courseCode: "MGMT 1011",
    gradient: "from-[#1e1b4b] via-[#3730a3] to-[#28226e]",
    glowColor: "rgba(129, 140, 248, 0.4)",
    icon: Rocket,
    iconColor: "text-indigo-200",
    pattern: "rocket",
    accentBadge: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
    borderColor: "#818cf8",
  },
  anthropology: {
    courseCode: "ANTH 1011",
    gradient: "from-[#500724] via-[#831843] to-[#610a30]",
    glowColor: "rgba(244, 114, 182, 0.4)",
    icon: UsersRound,
    iconColor: "text-pink-200",
    pattern: "ancient",
    accentBadge: "bg-rose-500/20 text-rose-200 border-rose-400/30",
    borderColor: "#f472b6",
  },
};

const fallback: ExamThumbnailStyle = {
  courseCode: "GEN 1000",
  gradient: "from-brand-navy via-[#1e3a5f] to-[#0f172a]",
  glowColor: "rgba(217, 119, 6, 0.4)",
  icon: GraduationCap,
  iconColor: "text-brand-gold",
  pattern: "geometry",
  accentBadge: "bg-brand-gold/20 text-brand-gold border-brand-gold/30",
  borderColor: "#d97706",
};

export function getExamThumbnail(courseId: string): ExamThumbnailStyle {
  return byCourseId[courseId] ?? fallback;
}
