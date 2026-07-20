import { examCourses } from "@/lib/exam-data";
import { libraryBooks } from "@/lib/mock-data";

export function getPlatformStats() {
  const bookCount = libraryBooks.length;
  const courseCount = examCourses.length;
  const chapterExamCount = examCourses.reduce((sum, course) => sum + course.chapters.length, 0);
  return { bookCount, courseCount, chapterExamCount };
}
