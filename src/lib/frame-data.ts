// ─── Types ────────────────────────────────────────────────────────────────────

export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "SSR";
export type FrameUnlockType = "xp" | "achievement";

export type EducationTheme =
  | "seedling"
  | "compass"
  | "lightning"
  | "mortarboard"
  | "diploma"
  | "tome"
  | "crown"
  | "platinum-cap"
  | "phoenix-sun"
  | "shield"
  | "sword-quill"
  | "diamond-star"
  | "quantum-brain"
  | "eternal-torch"
  | "trophy-cup"
  | "laurel-crown";

export type ProfileFrame = {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  type: FrameUnlockType;
  /** 3D Education insignia theme */
  theme: EducationTheme;
  /** Human-readable badge for 3D education insignia */
  themeLabel: string;
  /** XP cost — only present when type === "xp" */
  price?: number;
  /** Achievement requirement — only present when type === "achievement" */
  requirement?: {
    label: string;
    description: string;
  };
};

// ─── Rarity meta ──────────────────────────────────────────────────────────────

export type RarityMeta = {
  label: string;
  /** Tailwind text color class */
  textColor: string;
  /** Tailwind bg color class */
  bgColor: string;
  /** Tailwind border color class */
  borderColor: string;
  /** CSS color string for primary inline glow styles */
  glowColor: string;
  /** CSS color string for secondary aura conic-gradient */
  auraColor: string;
  /** CSS color string for outer radiant ambient halo */
  haloColor: string;
  /** Aura rotation duration in seconds */
  rotationSecs: number;
  /** Whether to show floating particles */
  particles: boolean;
};

export const RARITY_META: Record<Rarity, RarityMeta> = {
  COMMON: {
    label: "Common",
    textColor: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    glowColor: "rgba(148, 163, 184, 0.7)",
    auraColor: "rgba(203, 213, 225, 0.5)",
    haloColor: "rgba(241, 245, 249, 0.4)",
    rotationSecs: 10,
    particles: false,
  },
  RARE: {
    label: "Rare",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-400",
    glowColor: "rgba(59, 130, 246, 0.85)",
    auraColor: "rgba(96, 165, 250, 0.65)",
    haloColor: "rgba(191, 219, 254, 0.45)",
    rotationSecs: 8,
    particles: false,
  },
  EPIC: {
    label: "Epic",
    textColor: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-500",
    glowColor: "rgba(168, 85, 247, 0.9)",
    auraColor: "rgba(192, 132, 252, 0.7)",
    haloColor: "rgba(233, 213, 255, 0.5)",
    rotationSecs: 7,
    particles: true,
  },
  LEGENDARY: {
    label: "Legendary",
    textColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-500",
    glowColor: "rgba(245, 158, 11, 0.95)",
    auraColor: "rgba(251, 191, 36, 0.75)",
    haloColor: "rgba(254, 240, 138, 0.55)",
    rotationSecs: 6,
    particles: true,
  },
  MYTHIC: {
    label: "Mythic",
    textColor: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-500",
    glowColor: "rgba(6, 182, 212, 1)",
    auraColor: "rgba(168, 85, 247, 0.8)",
    haloColor: "rgba(165, 243, 252, 0.6)",
    rotationSecs: 5,
    particles: true,
  },
  SSR: {
    label: "SSR",
    textColor: "text-amber-50",
    bgColor: "bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-400",
    borderColor: "border-amber-400",
    glowColor: "rgba(245, 158, 11, 1)",
    auraColor: "rgba(6, 182, 212, 0.9)",
    haloColor: "rgba(253, 224, 71, 0.7)",
    rotationSecs: 4,
    particles: true,
  },
};

// ─── Frame catalog ─────────────────────────────────────────────────────────────

export const PROFILE_FRAMES: ProfileFrame[] = [
  // ── XP frames ──────────────────────────────────────────────────────────────
  {
    id: "new-learner",
    name: "New Learner",
    rarity: "COMMON",
    description:
      "Every great scholar starts somewhere. This frame marks the beginning of your journey.",
    type: "xp",
    theme: "seedling",
    themeLabel: "Sprouting Seedling",
    price: 500,
  },
  {
    id: "knowledge-seeker",
    name: "Knowledge Seeker",
    rarity: "RARE",
    description:
      "You've shown dedication to learning. This frame honours your curiosity and drive.",
    type: "xp",
    theme: "compass",
    themeLabel: "Wisdom Compass",
    price: 2_000,
  },
  {
    id: "quiz-champion",
    name: "Quiz Champion",
    rarity: "EPIC",
    description: "Reserved for those who dominate mock exams and push their limits every day.",
    type: "xp",
    theme: "lightning",
    themeLabel: "Lightning Speed Medal",
    price: 10_000,
  },
  {
    id: "scholar",
    name: "Scholar",
    rarity: "EPIC",
    description:
      "A mark of academic excellence. Worn by those who study with purpose and consistency.",
    type: "xp",
    theme: "mortarboard",
    themeLabel: "Scholar Mortarboard",
    price: 25_000,
  },
  {
    id: "exam-master",
    name: "Exam Master",
    rarity: "LEGENDARY",
    description:
      "You've conquered the hardest exams and risen above the competition. Legendary status awaits.",
    type: "xp",
    theme: "diploma",
    themeLabel: "Honor Diploma & Wax Seal",
    price: 50_000,
  },
  {
    id: "book-master",
    name: "Book Master",
    rarity: "LEGENDARY",
    description: "An endless reader. You devour knowledge like fuel and never stop growing.",
    type: "xp",
    theme: "tome",
    themeLabel: "Ancient Rune Tome",
    price: 80_000,
  },
  {
    id: "future-leader",
    name: "Future Leader",
    rarity: "MYTHIC",
    description:
      "Ethiopia's next generation of leaders study hard, dream bigger, and never settle.",
    type: "xp",
    theme: "crown",
    themeLabel: "Imperial Crown of Wisdom",
    price: 150_000,
  },
  {
    id: "graduation-legend",
    name: "Graduation Legend",
    rarity: "MYTHIC",
    description: "The pinnacle of academic achievement. Earned only by those who go all the way.",
    type: "xp",
    theme: "platinum-cap",
    themeLabel: "Platinum Mortarboard & Sunburst",
    price: 300_000,
  },
  {
    id: "xp-legend",
    name: "XP Legend",
    rarity: "SSR",
    description:
      "A symbol of exceptional learning, reserved for those who reach the highest peaks of Study2Earn.",
    type: "xp",
    theme: "phoenix-sun",
    themeLabel: "Majestic Knowledge Phoenix",
    price: 700_000,
  },

  // ── Achievement frames ──────────────────────────────────────────────────────
  {
    id: "learning-hero",
    name: "Learning Hero",
    rarity: "COMMON",
    description:
      "Awarded to every student who completes their first mock exam. Every hero has a first step.",
    type: "achievement",
    theme: "shield",
    themeLabel: "Hero's Academic Shield",
    requirement: {
      label: "Complete your first mock exam",
      description: "Take and submit any mock exam on the Exams page.",
    },
  },
  {
    id: "study-warrior",
    name: "Study Warrior",
    rarity: "RARE",
    description:
      "Finish reading 5 books in the Study2Earn library. Warriors never stop sharpening their skills.",
    type: "achievement",
    theme: "sword-quill",
    themeLabel: "Scholar's Blade & Emerald Ribbon",
    requirement: {
      label: "Read 5 books in the library",
      description: "Complete reading progress on 5 different library books.",
    },
  },
  {
    id: "top-student",
    name: "Top Student",
    rarity: "RARE",
    description:
      "Score 80% or above on 5 different mock exams. Consistency is the mark of a top student.",
    type: "achievement",
    theme: "diamond-star",
    themeLabel: "Star Diamond Medal",
    requirement: {
      label: "Score 80%+ on 5 mock exams",
      description: "Achieve 80% or higher on 5 different exams.",
    },
  },
  {
    id: "genius",
    name: "Genius",
    rarity: "EPIC",
    description:
      "Score 90%+ on 10 exams. True genius is built through relentless pursuit of excellence.",
    type: "achievement",
    theme: "quantum-brain",
    themeLabel: "Quantum Intellect & Atoms",
    requirement: {
      label: "Score 90%+ on 10 mock exams",
      description: "Achieve 90% or higher on 10 different exams.",
    },
  },
  {
    id: "streak-master",
    name: "Streak Master",
    rarity: "EPIC",
    description:
      "Study every day for 30 consecutive days. Discipline is the foundation of mastery.",
    type: "achievement",
    theme: "eternal-torch",
    themeLabel: "Eternal Torch of Study",
    requirement: {
      label: "Maintain a 30-day study streak",
      description: "Log study activity every day for 30 days straight.",
    },
  },
  {
    id: "exam-hero",
    name: "Exam Hero",
    rarity: "LEGENDARY",
    description:
      "Complete 10 mock exams and prove you're ready for the real thing. Heroes are made in practice.",
    type: "achievement",
    theme: "trophy-cup",
    themeLabel: "Champion Trophy of Honor",
    requirement: {
      label: "Complete 10 mock exams",
      description: "Take and submit 10 mock exams across any courses.",
    },
  },
  {
    id: "academic-elite",
    name: "Academic Elite",
    rarity: "LEGENDARY",
    description: "Reach the top 10 on the Study2Earn leaderboard. Only the elite earn this frame.",
    type: "achievement",
    theme: "laurel-crown",
    themeLabel: "Imperial Golden Laurel Wreath",
    requirement: {
      label: "Reach the top 10 leaderboard",
      description: "Appear in the top 10 on the weekly XP leaderboard.",
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getFrameById(id: string): ProfileFrame | undefined {
  return PROFILE_FRAMES.find((f) => f.id === id);
}

export function getFramesByRarity(rarity: Rarity): ProfileFrame[] {
  return PROFILE_FRAMES.filter((f) => f.rarity === rarity);
}

export const RARITY_ORDER: Rarity[] = ["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC", "SSR"];

export function rarityRank(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}
