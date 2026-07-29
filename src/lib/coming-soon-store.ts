/**
 * Per-page "Coming Soon" toggles — lets an admin replace an entire public
 * page with a placeholder poster instead of its real content, e.g. while a
 * feature is still being finished. Client-side demo store: localStorage,
 * same pattern as ad-store.ts.
 */

export type ComingSoonPageKey = "library" | "exams" | "aiStudy" | "leaderboard" | "rewards";

export type ComingSoonPageConfig = {
  enabled: boolean;
  title: string;
  message: string;
};

export type ComingSoonConfig = Record<ComingSoonPageKey, ComingSoonPageConfig>;

export const COMING_SOON_PAGES: { key: ComingSoonPageKey; label: string }[] = [
  { key: "library", label: "Library" },
  { key: "exams", label: "Mock Exams" },
  { key: "aiStudy", label: "AI Study" },
  { key: "leaderboard", label: "Leaderboard" },
  { key: "rewards", label: "Rewards" },
];

export const DEFAULT_COMING_SOON: ComingSoonConfig = {
  library: { enabled: false, title: "Coming Soon", message: "The library is being restocked." },
  exams: { enabled: false, title: "Coming Soon", message: "Mock exams are being prepared." },
  aiStudy: { enabled: false, title: "Coming Soon", message: "AI Study is launching shortly." },
  leaderboard: { enabled: false, title: "Coming Soon", message: "The leaderboard is warming up." },
  rewards: {
    enabled: false,
    title: "Coming Soon",
    message: "The rewards catalog is being updated.",
  },
};

const STORAGE_KEY = "study2earn-coming-soon";
export const COMING_SOON_CHANGE_EVENT = "coming-soon-change";

const PAGE_KEYS = COMING_SOON_PAGES.map((p) => p.key);

function normalize(raw: unknown): ComingSoonConfig {
  const value = (raw && typeof raw === "object" ? raw : {}) as Partial<
    Record<ComingSoonPageKey, Partial<ComingSoonPageConfig>>
  >;
  const result = {} as ComingSoonConfig;
  for (const key of PAGE_KEYS) {
    const stored = value[key];
    const fallback = DEFAULT_COMING_SOON[key];
    result[key] = {
      enabled: stored?.enabled === true,
      title:
        typeof stored?.title === "string" && stored.title.trim() ? stored.title : fallback.title,
      message:
        typeof stored?.message === "string" && stored.message.trim()
          ? stored.message
          : fallback.message,
    };
  }
  return result;
}

export function readComingSoon(): ComingSoonConfig {
  if (typeof window === "undefined") return DEFAULT_COMING_SOON;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMING_SOON;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_COMING_SOON;
  }
}

export function writeComingSoon(config: ComingSoonConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(COMING_SOON_CHANGE_EVENT));
}

export function subscribeComingSoon(cb: () => void) {
  window.addEventListener(COMING_SOON_CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(COMING_SOON_CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
