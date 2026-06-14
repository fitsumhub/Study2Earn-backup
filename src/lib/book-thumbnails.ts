import type { LucideIcon } from "lucide-react";
import {
  Atom,
  BookOpen,
  Brain,
  Building2,
  Calculator,
  Dna,
  Globe2,
  HeartPulse,
  Landmark,
  Lightbulb,
  Map,
  Scale,
  Users,
  UsersRound,
} from "lucide-react";

export type BookThumbnailStyle = {
  gradient: string;
  icon: LucideIcon;
  iconColor: string;
  label: string;
};

const byShort: Record<string, BookThumbnailStyle> = {
  Physics: {
    gradient: "from-[#0c1f4a] via-[#1e3a8a] to-[#172554]",
    icon: Atom,
    iconColor: "text-sky-300",
    label: "Natural Science",
  },
  English: {
    gradient: "from-[#78350f] via-[#b45309] to-[#92400e]",
    icon: BookOpen,
    iconColor: "text-amber-200",
    label: "Common Course",
  },
  Logic: {
    gradient: "from-[#064e3b] via-[#047857] to-[#065f46]",
    icon: Scale,
    iconColor: "text-emerald-200",
    label: "Common Course",
  },
  Maths: {
    gradient: "from-[#4c1d95] via-[#6d28d9] to-[#5b21b6]",
    icon: Calculator,
    iconColor: "text-violet-200",
    label: "Natural Science",
  },
  Psych: {
    gradient: "from-[#881337] via-[#be123c] to-[#9f1239]",
    icon: Brain,
    iconColor: "text-rose-200",
    label: "Social Science",
  },
  Global: {
    gradient: "from-[#0c4a6e] via-[#0369a1] to-[#075985]",
    icon: Globe2,
    iconColor: "text-sky-200",
    label: "Social Science",
  },
  Civics: {
    gradient: "from-[#134e4a] via-[#0f766e] to-[#115e59]",
    icon: Landmark,
    iconColor: "text-teal-200",
    label: "Social Science",
  },
  Biology: {
    gradient: "from-[#14532d] via-[#15803d] to-[#166534]",
    icon: Dna,
    iconColor: "text-lime-200",
    label: "Natural Science",
  },
  "Inclus.": {
    gradient: "from-[#9a3412] via-[#c2410c] to-[#9a3412]",
    icon: Users,
    iconColor: "text-orange-200",
    label: "Common Course",
  },
  Geo: {
    gradient: "from-[#854d0e] via-[#a16207] to-[#713f12]",
    icon: Map,
    iconColor: "text-yellow-200",
    label: "Social Science",
  },
  Anthro: {
    gradient: "from-[#9d174d] via-[#db2777] to-[#be185d]",
    icon: UsersRound,
    iconColor: "text-pink-200",
    label: "Social Science",
  },
  "Entrep.": {
    gradient: "from-[#312e81] via-[#4338ca] to-[#3730a3]",
    icon: Lightbulb,
    iconColor: "text-indigo-200",
    label: "Common Course",
  },
  "Struct.": {
    gradient: "from-[#1e293b] via-[#334155] to-[#0f172a]",
    icon: Building2,
    iconColor: "text-slate-300",
    label: "Engineering",
  },
  Anatomy: {
    gradient: "from-[#7f1d1d] via-[#b91c1c] to-[#991b1b]",
    icon: HeartPulse,
    iconColor: "text-red-200",
    label: "Medicine",
  },
};

const byId: Record<string, BookThumbnailStyle> = {
  "bk-physics": byShort.Physics,
  "bk-english": byShort.English,
  "bk-logic": byShort.Logic,
  "bk-maths": byShort.Maths,
  "bk-psych": byShort.Psych,
  "bk-global": byShort.Global,
  "bk-civics": byShort.Civics,
  "bk-biology": byShort.Biology,
  "bk-inclusiveness": byShort["Inclus."],
  "bk-geo": byShort.Geo,
  "bk-anthro": byShort.Anthro,
  "bk-entrep": byShort["Entrep."],
  "bk-structural": byShort["Struct."],
  "bk-anatomy": byShort.Anatomy,
};

export function getBookThumbnail(short: string, id?: string): BookThumbnailStyle {
  if (id && byId[id]) return byId[id];
  if (byShort[short]) return byShort[short];
  return {
    gradient: "from-brand-navy via-[#1e3a5f] to-[#0f172a]",
    icon: BookOpen,
    iconColor: "text-brand-gold",
    label: "Courseware",
  };
}
