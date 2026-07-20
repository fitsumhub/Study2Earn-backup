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

export type ExamThumbnailStyle = {
  gradient: string;
  icon: LucideIcon;
  iconColor: string;
};

const byCourseId: Record<string, ExamThumbnailStyle> = {
  "emerging-tech": {
    gradient: "from-[#0c1f4a] via-[#1e3a8a] to-[#172554]",
    icon: Cpu,
    iconColor: "text-sky-300",
  },
  "general-physics": {
    gradient: "from-[#0c4a6e] via-[#0369a1] to-[#075985]",
    icon: Atom,
    iconColor: "text-cyan-200",
  },
  inclusiveness: {
    gradient: "from-[#9a3412] via-[#c2410c] to-[#9a3412]",
    icon: HeartHandshake,
    iconColor: "text-orange-200",
  },
  "general-biology": {
    gradient: "from-[#14532d] via-[#15803d] to-[#166534]",
    icon: Dna,
    iconColor: "text-lime-200",
  },
  "math-natural": {
    gradient: "from-[#4c1d95] via-[#6d28d9] to-[#5b21b6]",
    icon: Sigma,
    iconColor: "text-violet-200",
  },
  "math-social": {
    gradient: "from-[#581c87] via-[#7e22ce] to-[#6b21a8]",
    icon: Calculator,
    iconColor: "text-fuchsia-200",
  },
  "english-i": {
    gradient: "from-[#78350f] via-[#b45309] to-[#92400e]",
    icon: Languages,
    iconColor: "text-amber-200",
  },
  "english-ii": {
    gradient: "from-[#7c2d12] via-[#c2410c] to-[#9a3412]",
    icon: PenLine,
    iconColor: "text-orange-100",
  },
  "physical-fitness": {
    gradient: "from-[#7f1d1d] via-[#b91c1c] to-[#991b1b]",
    icon: Dumbbell,
    iconColor: "text-red-200",
  },
  "moral-citizenship": {
    gradient: "from-[#134e4a] via-[#0f766e] to-[#115e59]",
    icon: Landmark,
    iconColor: "text-teal-200",
  },
  economics: {
    gradient: "from-[#1e3a8a] via-[#1d4ed8] to-[#1e40af]",
    icon: TrendingUp,
    iconColor: "text-blue-200",
  },
  "global-affairs": {
    gradient: "from-[#0e7490] via-[#0891b2] to-[#155e75]",
    icon: Globe2,
    iconColor: "text-cyan-100",
  },
  "geography-ethiopia": {
    gradient: "from-[#854d0e] via-[#a16207] to-[#713f12]",
    icon: Mountain,
    iconColor: "text-yellow-200",
  },
  "general-psychology": {
    gradient: "from-[#881337] via-[#be123c] to-[#9f1239]",
    icon: Brain,
    iconColor: "text-rose-200",
  },
  entrepreneurship: {
    gradient: "from-[#312e81] via-[#4338ca] to-[#3730a3]",
    icon: Rocket,
    iconColor: "text-indigo-200",
  },
  anthropology: {
    gradient: "from-[#9d174d] via-[#db2777] to-[#be185d]",
    icon: UsersRound,
    iconColor: "text-pink-200",
  },
};

const fallback: ExamThumbnailStyle = {
  gradient: "from-brand-navy via-[#1e3a5f] to-[#0f172a]",
  icon: GraduationCap,
  iconColor: "text-brand-gold",
};

export function getExamThumbnail(courseId: string): ExamThumbnailStyle {
  return byCourseId[courseId] ?? fallback;
}
