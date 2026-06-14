import { useCallback, useSyncExternalStore } from "react";

import { examCourses, getChapter, getCourseById } from "@/lib/exam-data";

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

function progressKey(courseId: string, chapterId: string) {
  return `${courseId}:${chapterId}`;
}

function readStore(): ProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressStore) : {};
  } catch {
    return {};
  }
}

function readAttempts(): AttemptsStore {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    return raw ? (JSON.parse(raw) as AttemptsStore) : [];
  } catch {
    return [];
  }
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

function getServerSnapshot(): ProgressStore {
  return {};
}

function getServerAttemptsSnapshot(): AttemptsStore {
  return [];
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
    (courseId: string, chapterId: string, score: number, passed: boolean) => {
      const key = progressKey(courseId, chapterId);
      const current = readStore()[key];
      const firstCompletion = passed && !(current?.completed ?? false);
      const xp = calculateExamXp(score, firstCompletion);

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

      return { xp, firstCompletion };
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
