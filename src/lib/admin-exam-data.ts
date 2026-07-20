import type { AdminExam, AdminExamQuestion } from "@/lib/admin-types";
import {
  buildQuestionBank,
  examCourses,
  getChapter,
  getCourseById,
  PASSING_SCORE,
  type ExamCourse,
} from "@/lib/exam-data";
import { readExamAttempts } from "@/hooks/use-exam-progress";

export const EXAM_DIFFICULTIES = ["Easy", "Intermediate", "Advanced"] as const;

/* ── Real attempt analytics ─────────────────────────────────────────────────
 * Aggregated from the actual attempt records students generate — replaces the
 * seeded random `attempts` numbers that shipped with the demo data. */

export type ExamRealStats = {
  attempts: number;
  avgScore: number;
  passRate: number; // 0–100
  lastAttempt?: string; // ISO date
};

export function buildRealExamStats(): Map<string, ExamRealStats> {
  const map = new Map<string, { scores: number[]; passed: number; last?: string }>();
  for (const a of readExamAttempts()) {
    const key = `${a.courseId}:${a.chapterId}`;
    const agg = map.get(key) ?? { scores: [], passed: 0, last: undefined };
    agg.scores.push(a.score);
    if (a.passed) agg.passed += 1;
    if (!agg.last || a.date > agg.last) agg.last = a.date;
    map.set(key, agg);
  }
  const stats = new Map<string, ExamRealStats>();
  for (const [key, agg] of map) {
    const attempts = agg.scores.length;
    stats.set(key, {
      attempts,
      avgScore: Math.round(agg.scores.reduce((s, n) => s + n, 0) / attempts),
      passRate: Math.round((agg.passed / attempts) * 100),
      lastAttempt: agg.last,
    });
  }
  return stats;
}

export function realStatsKey(exam: Pick<AdminExam, "courseId" | "chapterId">) {
  return `${exam.courseId}:${exam.chapterId}`;
}

/* ── Question-bank health checks ────────────────────────────────────────────
 * Surfaced as badges in the exam list and inside the manager sheet so an
 * admin can't publish a broken exam without noticing. */

export function getQuestionIssues(q: AdminExamQuestion): string[] {
  const issues: string[] = [];
  if (!q.question.trim()) issues.push("empty question stem");
  const filled = q.options.filter((o) => o.trim());
  if (filled.length < 2) issues.push("fewer than 2 filled options");
  if (q.options.some((o) => !o.trim())) issues.push("blank option");
  if (
    q.correctIndex < 0 ||
    q.correctIndex >= q.options.length ||
    !q.options[q.correctIndex]?.trim()
  )
    issues.push("correct answer not set to a filled option");
  if (!q.explanation.trim()) issues.push("missing explanation");
  return issues;
}

export type BankHealth = {
  ok: boolean;
  issues: string[];
  brokenQuestions: number;
};

export function getBankHealth(bank: AdminExamQuestion[], questionsPerAttempt: number): BankHealth {
  const issues: string[] = [];
  if (bank.length === 0) {
    issues.push("Question bank is empty");
  } else if (bank.length < questionsPerAttempt) {
    issues.push(
      `Bank has ${bank.length} question${bank.length !== 1 ? "s" : ""} but ${questionsPerAttempt} are shown per attempt`,
    );
  }

  const broken = bank.filter((q) => getQuestionIssues(q).length > 0);
  if (broken.length > 0) {
    issues.push(`${broken.length} question${broken.length !== 1 ? "s" : ""} incomplete`);
  }

  const stems = bank.map((q) => q.question.trim().toLowerCase()).filter(Boolean);
  const dupes = stems.length - new Set(stems).size;
  if (dupes > 0) issues.push(`${dupes} duplicate question stem${dupes !== 1 ? "s" : ""}`);

  return { ok: issues.length === 0, issues, brokenQuestions: broken.length };
}

export function adminQuestionFromMc(q: {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}): AdminExamQuestion {
  return {
    id: q.id,
    question: q.question,
    options: [...q.options],
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  };
}

export function templateQuestionsForChapter(
  courseId: string,
  chapterId: string,
): AdminExamQuestion[] {
  const course = getCourseById(courseId);
  const chapter = getChapter(courseId, chapterId);
  if (!course || !chapter) return [];
  return buildQuestionBank(course, chapter).map(adminQuestionFromMc);
}

function difficultyForCourse(course: ExamCourse): string {
  if (course.durationMinutes >= 30) return "Advanced";
  if (course.durationMinutes >= 20) return "Intermediate";
  return "Easy";
}

export function buildExamFromChapter(
  course: ExamCourse,
  chapter: { id: string; title: string },
  index: number,
  published = false,
): AdminExam {
  const bank = buildQuestionBank(course, chapter).map(adminQuestionFromMc);
  return {
    id: `EX-${1000 + index}`,
    title: `${course.short} — ${chapter.title}`,
    subject: course.category,
    difficulty: difficultyForCourse(course),
    duration: course.durationMinutes,
    questions: course.questionsPerExam,
    published,
    courseId: course.id,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    description: `Chapter mock exam for ${chapter.title} (${course.name}).`,
    passScore: PASSING_SCORE,
    xpReward: 100,
    questionBank: bank,
    attempts: Math.floor(Math.random() * 80) + 5,
  };
}

/** One admin exam per course chapter — aligned with student /exams routes. */
export function buildDefaultAdminExams(): AdminExam[] {
  const exams: AdminExam[] = [];
  let index = 0;
  for (const course of examCourses) {
    for (const chapter of course.chapters) {
      exams.push(buildExamFromChapter(course, chapter, index, index < 12));
      index += 1;
    }
  }
  return exams;
}

export function getCourseOptions() {
  return examCourses.map((c) => ({ id: c.id, name: c.name, category: c.category }));
}

export function getChapterOptions(courseId: string) {
  const course = getCourseById(courseId);
  return course?.chapters.map((ch) => ({ id: ch.id, title: ch.title })) ?? [];
}

export function mergeExamWithCourseDefaults(
  exam: Partial<AdminExam> & Pick<AdminExam, "id">,
): AdminExam {
  const defaults = buildDefaultAdminExams().find((e) => e.id === exam.id);
  const course = exam.courseId ? getCourseById(exam.courseId) : undefined;
  const chapter =
    exam.courseId && exam.chapterId ? getChapter(exam.courseId, exam.chapterId) : undefined;

  return {
    id: exam.id,
    title: exam.title ?? defaults?.title ?? "Untitled exam",
    subject: exam.subject ?? course?.category ?? defaults?.subject ?? "Common",
    difficulty: exam.difficulty ?? defaults?.difficulty ?? "Intermediate",
    duration: exam.duration ?? course?.durationMinutes ?? defaults?.duration ?? 60,
    questions: exam.questions ?? course?.questionsPerExam ?? defaults?.questions ?? 40,
    published: exam.published ?? defaults?.published ?? false,
    courseId: exam.courseId ?? defaults?.courseId ?? course?.id ?? "",
    chapterId: exam.chapterId ?? defaults?.chapterId ?? "",
    chapterTitle: exam.chapterTitle ?? chapter?.title ?? defaults?.chapterTitle ?? "",
    description: exam.description ?? defaults?.description ?? "",
    passScore: exam.passScore ?? defaults?.passScore ?? PASSING_SCORE,
    xpReward: exam.xpReward ?? defaults?.xpReward ?? 100,
    questionBank: exam.questionBank ?? defaults?.questionBank ?? [],
    attempts: exam.attempts ?? defaults?.attempts ?? 0,
  };
}
