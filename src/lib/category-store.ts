/**
 * Book category store — localStorage-backed list of library categories that
 * both the public library and the admin console read from. Admins can add,
 * rename, recolor, and remove categories from the "Categories" admin section.
 */

export type CategoryColor =
  | "navy"
  | "blue"
  | "violet"
  | "amber"
  | "orange"
  | "rose"
  | "emerald"
  | "teal"
  | "pink"
  | "indigo"
  | "sky"
  | "slate";

export type BookCategory = {
  id: string;
  name: string;
  color: CategoryColor;
  description?: string;
};

/** Tailwind class fragments per color, used for badges, pills and swatches. */
export const CATEGORY_COLORS: Record<
  CategoryColor,
  { label: string; badge: string; swatch: string; dot: string }
> = {
  navy: {
    label: "Navy",
    badge: "bg-brand-navy/10 text-brand-navy",
    swatch: "bg-brand-navy",
    dot: "bg-brand-navy",
  },
  blue: {
    label: "Blue",
    badge: "bg-blue-50 text-blue-700",
    swatch: "bg-blue-500",
    dot: "bg-blue-500",
  },
  violet: {
    label: "Violet",
    badge: "bg-violet-50 text-violet-700",
    swatch: "bg-violet-500",
    dot: "bg-violet-500",
  },
  amber: {
    label: "Amber",
    badge: "bg-amber-50 text-amber-700",
    swatch: "bg-amber-500",
    dot: "bg-amber-500",
  },
  orange: {
    label: "Orange",
    badge: "bg-orange-50 text-orange-700",
    swatch: "bg-orange-500",
    dot: "bg-orange-500",
  },
  rose: {
    label: "Rose",
    badge: "bg-rose-50 text-rose-700",
    swatch: "bg-rose-500",
    dot: "bg-rose-500",
  },
  emerald: {
    label: "Emerald",
    badge: "bg-emerald-50 text-emerald-700",
    swatch: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  teal: {
    label: "Teal",
    badge: "bg-teal-50 text-teal-700",
    swatch: "bg-teal-500",
    dot: "bg-teal-500",
  },
  pink: {
    label: "Pink",
    badge: "bg-pink-50 text-pink-700",
    swatch: "bg-pink-500",
    dot: "bg-pink-500",
  },
  indigo: {
    label: "Indigo",
    badge: "bg-indigo-50 text-indigo-700",
    swatch: "bg-indigo-500",
    dot: "bg-indigo-500",
  },
  sky: { label: "Sky", badge: "bg-sky-50 text-sky-700", swatch: "bg-sky-500", dot: "bg-sky-500" },
  slate: {
    label: "Slate",
    badge: "bg-slate-100 text-slate-600",
    swatch: "bg-slate-400",
    dot: "bg-slate-400",
  },
};

export const CATEGORY_COLOR_KEYS = Object.keys(CATEGORY_COLORS) as CategoryColor[];

export const DEFAULT_CATEGORIES: BookCategory[] = [
  {
    id: "cat-common",
    name: "Common",
    color: "amber",
    description: "Shared freshman courses taken by every track.",
  },
  {
    id: "cat-natural",
    name: "Natural Science",
    color: "blue",
    description: "Physics, chemistry, biology and mathematics.",
  },
  {
    id: "cat-social",
    name: "Social Science",
    color: "violet",
    description: "Civics, geography, psychology and the humanities.",
  },
  {
    id: "cat-engineering",
    name: "Engineering",
    color: "orange",
    description: "Applied and engineering-stream courseware.",
  },
  {
    id: "cat-medicine",
    name: "Medicine",
    color: "rose",
    description: "Pre-medical and health science material.",
  },
  {
    id: "cat-poetry",
    name: "Poetry",
    color: "pink",
    description: "Ethiopian poems and verse anthologies.",
  },
  {
    id: "cat-fiction",
    name: "Fiction",
    color: "emerald",
    description: "Free Ethiopian novels and short stories.",
  },
];

const STORAGE_KEY = "study2earn-categories";
export const CATEGORY_CHANGE_EVENT = "category-change";

function isCategory(value: unknown): value is BookCategory {
  if (!value || typeof value !== "object") return false;
  const c = value as Partial<BookCategory>;
  return typeof c.id === "string" && typeof c.name === "string" && typeof c.color === "string";
}

export function readCategories(): BookCategory[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_CATEGORIES;
    const clean = parsed.filter(isCategory).map((c) => ({
      ...c,
      color: (CATEGORY_COLORS[c.color as CategoryColor] ? c.color : "slate") as CategoryColor,
    }));
    return clean.length > 0 ? clean : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function writeCategories(categories: BookCategory[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  window.dispatchEvent(new Event(CATEGORY_CHANGE_EVENT));
}

export function subscribeCategories(cb: () => void) {
  window.addEventListener(CATEGORY_CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CATEGORY_CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function resetCategories() {
  writeCategories(DEFAULT_CATEGORIES);
}

/** Badge classes for a category name, falling back to slate for unknowns. */
export function categoryBadgeClass(
  name: string,
  categories: BookCategory[] = readCategories(),
): string {
  const match = categories.find((c) => c.name === name);
  return CATEGORY_COLORS[match?.color ?? "slate"].badge;
}

export function categoryColorKey(
  name: string,
  categories: BookCategory[] = readCategories(),
): CategoryColor {
  return categories.find((c) => c.name === name)?.color ?? "slate";
}

export function slugifyCategory(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `cat-${base || Math.random().toString(36).slice(2, 8)}`;
}
