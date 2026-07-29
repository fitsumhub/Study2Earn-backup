/**
 * Subject detection (offline keyword classifier + filename heuristics) and
 * the per-subject visual theme used across the upload/results screens.
 */
import type { LibraryBook } from "@/lib/mock-data";

export function detectSubject(filename: string): string {
  const f = filename.toLowerCase();
  if (f.includes("phys") || f.includes("motion") || f.includes("force") || f.includes("wave"))
    return "physics";
  if (
    f.includes("bio") ||
    f.includes("cell") ||
    f.includes("gene") ||
    f.includes("dna") ||
    f.includes("organ")
  )
    return "biology";
  if (
    f.includes("chem") ||
    f.includes("react") ||
    f.includes("acid") ||
    f.includes("mole") ||
    f.includes("atom")
  )
    return "chemistry";
  if (
    f.includes("math") ||
    f.includes("calc") ||
    f.includes("alg") ||
    f.includes("trig") ||
    f.includes("stat")
  )
    return "math";
  if (
    f.includes("hist") ||
    f.includes("civic") ||
    f.includes("social") ||
    f.includes("ethio") ||
    f.includes("axum")
  )
    return "history";
  if (
    f.includes("eng") ||
    f.includes("liter") ||
    f.includes("grammar") ||
    f.includes("essay") ||
    f.includes("write")
  )
    return "english";
  return "general";
}

export function subjectLabel(subject: string): string {
  const labels: Record<string, string> = {
    physics: "General Physics",
    biology: "General Biology",
    chemistry: "General Chemistry",
    math: "Mathematics",
    history: "History & Civics",
    english: "English Language",
    general: "General Studies",
  };
  return labels[subject] ?? "General Studies";
}

// ─── Library book → AI Study subject mapping ─────────────────────────────────

/** Library catalog books that map 1:1 onto one of our AI Study question pools. */
const BOOK_ID_SUBJECT: Record<string, string> = {
  "bk-physics": "physics",
  "bk-biology": "biology",
  "bk-maths": "math",
  "bk-english": "english",
  "bk-civics": "history",
  "bk-geo": "history",
  "bk-global": "history",
};

/** Broader fallback when a book has no exact subject match (e.g. no dedicated chemistry title yet). */
const CATEGORY_SUBJECT_FALLBACK: Record<string, string> = {
  "Social Science": "history",
};

/** Best-effort subject for a library book, so "generate a study pack from this book" always has somewhere to land. */
export function subjectForBook(book: LibraryBook): string {
  return BOOK_ID_SUBJECT[book.id] ?? CATEGORY_SUBJECT_FALLBACK[book.category] ?? "general";
}

// ─── Real file reading (client-side only — no backend to send files to) ──────

const subjectKeywords: Record<string, string[]> = {
  physics: [
    "force",
    "velocity",
    "acceleration",
    "newton",
    "energy",
    "momentum",
    "gravity",
    "motion",
    "wave",
    "electric",
    "voltage",
    "current",
    "kinematics",
    "friction",
    "torque",
    "thermodynamics",
    "kinetic",
    "potential energy",
  ],
  biology: [
    "cell",
    "dna",
    "rna",
    "gene",
    "organism",
    "photosynthesis",
    "mitosis",
    "meiosis",
    "enzyme",
    "protein",
    "chromosome",
    "ecosystem",
    "evolution",
    "organelle",
    "membrane",
    "tissue",
    "species",
    "mitochondria",
  ],
  chemistry: [
    "atom",
    "molecule",
    "mole ",
    "reaction",
    "acid",
    "base",
    "bond",
    "electron",
    "compound",
    "solution",
    "oxidation",
    "reduction",
    "equilibrium",
    "periodic table",
    "element",
    "ion",
    "ph ",
  ],
  math: [
    "function",
    "derivative",
    "integral",
    "equation",
    "matrix",
    "probability",
    "theorem",
    "variable",
    "algebra",
    "calculus",
    "trigonometry",
    "statistics",
    "logarithm",
    "coefficient",
    "geometry",
  ],
  history: [
    "ethiopia",
    "emperor",
    "empire",
    "constitution",
    "colonial",
    "axum",
    "adwa",
    "independence",
    "government",
    "revolution",
    "monarchy",
    "century",
    "treaty",
    "war",
    "federation",
  ],
  english: [
    "sentence",
    "grammar",
    "paragraph",
    "essay",
    "vocabulary",
    "tense",
    "clause",
    "metaphor",
    "comprehension",
    "punctuation",
    "noun",
    "verb",
    "syntax",
  ],
};

const SUBJECT_MATCH_MIN_SCORE = 3;
const MIN_TEXT_LENGTH_FOR_DETECTION = 60;

export function detectSubjectFromText(text: string): string | null {
  if (text.trim().length < MIN_TEXT_LENGTH_FOR_DETECTION) return null;
  const lower = text.toLowerCase();
  let best: { subject: string; score: number } | null = null;
  for (const [subject, keywords] of Object.entries(subjectKeywords)) {
    let score = 0;
    for (const word of keywords) {
      score += lower.split(word).length - 1;
    }
    if (!best || score > best.score) best = { subject, score };
  }
  return best && best.score >= SUBJECT_MATCH_MIN_SCORE ? best.subject : null;
}

export const subjectTheme: Record<
  string,
  { banner: string; badge: string; accent: string; dot: string }
> = {
  physics: {
    banner: "from-blue-700 via-blue-600 to-indigo-700",
    badge: "bg-blue-100 text-blue-800",
    accent: "border-blue-400",
    dot: "bg-blue-400",
  },
  biology: {
    banner: "from-emerald-700 via-green-600 to-teal-700",
    badge: "bg-emerald-100 text-emerald-800",
    accent: "border-emerald-400",
    dot: "bg-emerald-400",
  },
  chemistry: {
    banner: "from-purple-700 via-violet-600 to-purple-800",
    badge: "bg-purple-100 text-purple-800",
    accent: "border-purple-400",
    dot: "bg-purple-400",
  },
  math: {
    banner: "from-orange-600 via-amber-600 to-yellow-600",
    badge: "bg-orange-100 text-orange-800",
    accent: "border-orange-400",
    dot: "bg-orange-400",
  },
  history: {
    banner: "from-amber-700 via-yellow-700 to-orange-700",
    badge: "bg-amber-100 text-amber-800",
    accent: "border-amber-400",
    dot: "bg-amber-400",
  },
  english: {
    banner: "from-pink-700 via-rose-600 to-red-700",
    badge: "bg-pink-100 text-pink-800",
    accent: "border-pink-400",
    dot: "bg-pink-400",
  },
  general: {
    banner: "from-slate-700 via-slate-600 to-brand-navy",
    badge: "bg-slate-100 text-slate-700",
    accent: "border-slate-400",
    dot: "bg-slate-400",
  },
};
