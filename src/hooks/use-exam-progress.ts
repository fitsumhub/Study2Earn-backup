import { useCallback, useSyncExternalStore } from "react";

import { examCourses, getChapter, getCourseById } from "@/lib/exam-data";

/** Highest XP a single attempt can legitimately earn (perfect score, first pass). */
const MAX_XP_PER_ATTEMPT = calculateExamXp(100, true);

function isRealChapter(courseId: string, chapterId: string) {
  return !!getChapter(courseId, chapterId);
}

export type ChapterProgress = {
  completed: boolean;
  bestScore: number;
  attempts: number;
  lastAttempt?: string;
  lastScore?: number;
};

export type ExamAttemptRecord = {
  id: string;
  courseId: string;
  chapterId: string;
  courseName: string;
  chapterTitle: string;
  score: number;
  xp: number;
  passed: boolean;
  date: string;
};

type ProgressStore = Record<string, ChapterProgress>;
type AttemptsStore = ExamAttemptRecord[];

const STORAGE_KEY = "study2earn-exam-progress";
const ATTEMPTS_KEY = "study2earn-exam-attempts";
const RECORDED_SEEDS_KEY = "study2earn-exam-recorded-seeds";
const MAX_RECORDED_SEEDS = 200;

/**
 * Marks an exam session as "already graded" so the same resumed session
 * opened in two tabs can't both award XP for one logical completion. Returns
 * false (and records nothing) if this exact session was already recorded.
 */
function claimSessionSeed(seed: string): boolean {
  if (typeof window === "undefined") return true;
  let seeds: string[] = [];
  try {
    const raw = localStorage.getItem(RECORDED_SEEDS_KEY);
    seeds = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    seeds = [];
  }
  if (seeds.includes(seed)) return false;
  localStorage.setItem(
    RECORDED_SEEDS_KEY,
    JSON.stringify([seed, ...seeds].slice(0, MAX_RECORDED_SEEDS)),
  );
  return true;
}

function progressKey(courseId: string, chapterId: string) {
  return `${courseId}:${chapterId}`;
}

/**
 * Reads are sanitized against plausible bounds — this can't stop someone
 * from editing their own localStorage (there's no backend to be the source
 * of truth), but it does stop a raw `{xp: 999999}` write from being trusted
 * at face value: scores clamp to 0–100, XP clamps to what that chapter could
 * legitimately award, and entries referencing a chapter that doesn't exist
 * are dropped.
 */
function readStore(): ProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressStore;
    if (!parsed || typeof parsed !== "object") return {};
    const clean: ProgressStore = {};
    for (const [key, value] of Object.entries(parsed)) {
      const sep = key.indexOf(":");
      if (sep < 0) continue;
      const courseId = key.slice(0, sep);
      const chapterId = key.slice(sep + 1);
      if (!isRealChapter(courseId, chapterId)) continue;
      if (!value || typeof value !== "object") continue;
      clean[key] = {
        completed: !!value.completed,
        bestScore: Math.min(100, Math.max(0, Number(value.bestScore) || 0)),
        attempts: Math.max(0, Math.floor(Number(value.attempts) || 0)),
        lastAttempt: value.lastAttempt,
        lastScore:
          value.lastScore === undefined
            ? undefined
            : Math.min(100, Math.max(0, Number(value.lastScore) || 0)),
      };
    }
    return clean;
  } catch {
    return {};
  }
}

function readAttempts(): AttemptsStore {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AttemptsStore;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (a) =>
          a &&
          typeof a.courseId === "string" &&
          typeof a.chapterId === "string" &&
          isRealChapter(a.courseId, a.chapterId),
      )
      .map((a) => ({
        ...a,
        score: Math.min(100, Math.max(0, Number(a.score) || 0)),
        xp: Math.min(MAX_XP_PER_ATTEMPT, Math.max(0, Number(a.xp) || 0)),
      }));
  } catch {
    return [];
  }
}

/** Non-hook access to recorded attempts (e.g. admin analytics). */
export function readExamAttempts(): ExamAttemptRecord[] {
  return readAttempts();
}

function writeStore(store: ProgressStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("exam-progress-change"));
}

function writeAttempts(attempts: AttemptsStore) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts.slice(0, 50)));
  window.dispatchEvent(new Event("exam-progress-change"));
}

let cachedSnapshot = readStore();
let cachedAttempts = readAttempts();

function subscribe(callback: () => void) {
  const handler = () => {
    cachedSnapshot = readStore();
    cachedAttempts = readAttempts();
    callback();
  };
  window.addEventListener("exam-progress-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("exam-progress-change", handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot() {
  return cachedSnapshot;
}

function getAttemptsSnapshot() {
  return cachedAttempts;
}

// Stable module-level defaults — a fresh `{}`/`[]` literal on every call
// would make React think the store never settles and warn about a possible
// infinite loop (it also does needlessly bust memoization on every render).
const EMPTY_PROGRESS_STORE: ProgressStore = {};
const EMPTY_ATTEMPTS: AttemptsStore = [];

function getServerSnapshot(): ProgressStore {
  return EMPTY_PROGRESS_STORE;
}

function getServerAttemptsSnapshot(): AttemptsStore {
  return EMPTY_ATTEMPTS;
}

/** XP scales with score; bonus for first-time chapter completion. */
export function calculateExamXp(score: number, firstCompletion: boolean) {
  const base = Math.round(score / 10) * 5;
  return base + (firstCompletion && score >= 60 ? 25 : 0);
}

export function useExamProgress() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const attempts = useSyncExternalStore(subscribe, getAttemptsSnapshot, getServerAttemptsSnapshot);

  const getChapterProgress = useCallback(
    (courseId: string, chapterId: string): ChapterProgress | undefined => {
      return store[progressKey(courseId, chapterId)];
    },
    [store],
  );

  const isChapterCompleted = useCallback(
    (courseId: string, chapterId: string) => {
      return store[progressKey(courseId, chapterId)]?.completed ?? false;
    },
    [store],
  );

  const getCourseStats = useCallback(
    (courseId: string, totalChapters: number) => {
      const prefix = `${courseId}:`;
      const entries = Object.entries(store).filter(([k]) => k.startsWith(prefix));
      const completed = entries.filter(([, v]) => v.completed).length;
      return {
        completed,
        total: totalChapters,
        percent: totalChapters ? Math.round((completed / totalChapters) * 100) : 0,
      };
    },
    [store],
  );

  const getOverallStats = useCallback(() => {
    let completed = 0;
    let total = 0;
    for (const course of examCourses) {
      for (const ch of course.chapters) {
        total++;
        if (store[progressKey(course.id, ch.id)]?.completed) completed++;
      }
    }
    const totalXp = attempts.reduce((sum, a) => sum + a.xp, 0);
    return {
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : 0,
      totalAttempts: attempts.length,
      totalXp,
    };
  }, [store, attempts]);

  const getRecentAttempts = useCallback((limit = 5) => attempts.slice(0, limit), [attempts]);

  const getNextChapter = useCallback(() => {
    for (const course of examCourses) {
      for (const chapter of course.chapters) {
        if (!store[progressKey(course.id, chapter.id)]?.completed) {
          return { course, chapter };
        }
      }
    }
    const course = examCourses[0];
    return course ? { course, chapter: course.chapters[0] } : null;
  }, [store]);

  const recordAttempt = useCallback(
    (
      courseId: string,
      chapterId: string,
      score: number,
      passed: boolean,
      sessionSeed: string,
      options?: { withholdXp?: boolean },
    ) => {
      if (!claimSessionSeed(`${courseId}:${chapterId}:${sessionSeed}`)) {
        // Same resumed session already graded in another tab — don't double-award.
        return { xp: 0, firstCompletion: false, duplicate: true as const };
      }

      const key = progressKey(courseId, chapterId);
      const current = readStore()[key];
      const firstCompletion = passed && !(current?.completed ?? false);
      const xp = options?.withholdXp ? 0 : calculateExamXp(score, firstCompletion);

      const next: ChapterProgress = {
        completed: passed || (current?.completed ?? false),
        bestScore: Math.max(score, current?.bestScore ?? 0),
        attempts: (current?.attempts ?? 0) + 1,
        lastAttempt: new Date().toISOString(),
        lastScore: score,
      };
      writeStore({ ...readStore(), [key]: next });

      const course = getCourseById(courseId);
      const chapter = getChapter(courseId, chapterId);
      const record: ExamAttemptRecord = {
        id: `${Date.now()}-${courseId}-${chapterId}`,
        courseId,
        chapterId,
        courseName: course?.name ?? courseId,
        chapterTitle: chapter?.title ?? chapterId,
        score,
        xp,
        passed,
        date: new Date().toISOString(),
      };
      writeAttempts([record, ...readAttempts()]);

      return { xp, firstCompletion, duplicate: false as const };
    },
    [],
  );

  return {
    getChapterProgress,
    isChapterCompleted,
    getCourseStats,
    getOverallStats,
    getRecentAttempts,
    getNextChapter,
    recordAttempt,
  };
}
