import type { ExamChapter, ExamCourse } from "@/lib/exam-data";
import { PASSING_SCORE } from "@/lib/exam-data";

export type ChapterMeta = {
  summary: string;
  objectives: string[];
  topics: string[];
  studyMinutes: number;
  examTips: string[];
};

export function getChapterMeta(
  course: ExamCourse,
  chapter: ExamChapter,
  chapterIndex: number,
): ChapterMeta {
  const moduleNum = chapterIndex + 1;
  return {
    summary: `${chapter.title} is module ${moduleNum} of ${course.name}. This chapter aligns with the Ethiopian Ministry of Education freshman curriculum and prepares you for exit exam questions on ${chapter.title.toLowerCase()}.`,
    objectives: [
      `Master the core concepts and terminology of ${chapter.title}`,
      `Apply module knowledge to scenario-based multiple-choice questions`,
      `Identify common misconceptions tested in exit exams`,
      `Score ${PASSING_SCORE}% or higher on the timed chapter mock exam`,
    ],
    topics: [
      `${chapter.title} — key definitions`,
      `${chapter.title} — theory & principles`,
      `${chapter.title} — worked examples`,
      `${chapter.title} — exit exam practice`,
    ],
    studyMinutes: Math.max(20, Math.round(course.durationMinutes * 1.5)),
    examTips: [
      `You have ${course.durationMinutes} minutes for ${course.questionsPerExam} MCQ questions`,
      "Questions and answer order change on every attempt",
      "Read all four options before selecting your answer",
      "Flag difficult questions mentally and return if time allows",
    ],
  };
}
