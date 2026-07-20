/**
 * Mistakes bank — every question a student gets wrong (or skips) in a mock
 * exam is collected here so it can be re-practised until fixed.
 *
 * Lifecycle: miss a question → entry created (or missCount bumped, resolved
 * reset). Answer it correctly — in a later exam or in practice mode — and the
 * entry is marked resolved. Practice mode awards no XP: it shows answers
 * immediately, so paying for it would be free money.
 */

import type { ExamChapter, ExamCourse, MCQuestion } from "@/lib/exam-data";

export type MistakeEntry = {
  questionId: string;
  courseId: string;
  chapterId: string;
  courseName: string;
  chapterTitle: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  missCount: number;
  lastMissedAt: string; // ISO date
  resolved: boolean;
};

const STORAGE_KEY = "study2earn-mistakes";
const CHANGE_EVENT = "mistakes-change";

export function readMistakes(): MistakeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as MistakeEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeMistakes(mistakes: MistakeEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeMistakes(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}

/** After a graded exam: upsert misses, resolve questions answered correctly. */
export function recordExamMistakes(
  course: ExamCourse,
  chapter: ExamChapter,
  questions: MCQuestion[],
  answers: Record<string, number>,
) {
  const now = new Date().toISOString();
  const byId = new Map(readMistakes().map((m) => [m.questionId, m]));

  for (const q of questions) {
    const missed = answers[q.id] !== q.correctIndex; // skipped counts as missed
    const existing = byId.get(q.id);

    if (missed) {
      byId.set(q.id, {
        questionId: q.id,
        courseId: course.id,
        chapterId: chapter.id,
        courseName: course.name,
        chapterTitle: chapter.title,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        missCount: (existing?.missCount ?? 0) + 1,
        lastMissedAt: now,
        resolved: false,
      });
    } else if (existing && !existing.resolved) {
      byId.set(q.id, { ...existing, resolved: true });
    }
  }

  writeMistakes([...byId.values()]);
}

/** Practice mode: answered correctly → fixed. */
export function resolveMistake(questionId: string) {
  writeMistakes(
    readMistakes().map((m) => (m.questionId === questionId ? { ...m, resolved: true } : m)),
  );
}

/** Practice mode: missed again → bump the counter. */
export function bumpMistake(questionId: string) {
  const now = new Date().toISOString();
  writeMistakes(
    readMistakes().map((m) =>
      m.questionId === questionId
        ? { ...m, missCount: m.missCount + 1, lastMissedAt: now, resolved: false }
        : m,
    ),
  );
}

export function clearResolvedMistakes() {
  writeMistakes(readMistakes().filter((m) => !m.resolved));
}
