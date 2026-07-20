/**
 * Active exam session — persists an in-progress mock exam so a refresh,
 * crash, or lost connection doesn't wipe the student's answers.
 *
 * The question paper is reproducible from `attemptSeed` (see getExamQuestions),
 * so we only store the seed, the answers, and a wall-clock deadline. Storing
 * `endsAt` (instead of seconds remaining) means the timer keeps counting while
 * the tab is closed — resuming late costs time, same as a real exam hall.
 *
 * Single-slot store: starting a new exam replaces any unfinished one.
 */

export type ActiveExamSession = {
  courseId: string;
  chapterId: string;
  attemptSeed: number;
  answers: Record<string, number>;
  flagged: string[];
  /** Epoch ms deadline — exam auto-submits when the clock passes this. */
  endsAt: number;
};

const STORAGE_KEY = "study2earn-active-exam";

export function readExamSession(): ActiveExamSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveExamSession;
    if (!parsed.courseId || !parsed.chapterId || typeof parsed.endsAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeExamSession(session: ActiveExamSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearExamSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
