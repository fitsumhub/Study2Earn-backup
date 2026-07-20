import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { MockExamTaker } from "@/components/mock-exam-taker";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { getChapter, getCourseById } from "@/lib/exam-data";

export const Route = createFileRoute("/exams/$courseId/$chapterId")({
  head: ({ params }) => {
    const course = getCourseById(params.courseId);
    const chapter = getChapter(params.courseId, params.chapterId);
    return {
      meta: [
        {
          title:
            chapter && course
              ? `${chapter.title} — ${course.short} Mock Exam`
              : "Mock Exam — Study2Earn",
        },
        {
          name: "description",
          content: chapter ? `Timed MCQ mock exam for ${chapter.title}.` : "Chapter mock exam",
        },
      ],
    };
  },
  component: ChapterExamPage,
});

function ChapterExamPage() {
  const { courseId, chapterId } = Route.useParams();
  const course = getCourseById(courseId);
  const chapter = getChapter(courseId, chapterId);

  if (!course || !chapter) throw notFound();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Breadcrumbs
            items={[
              { label: "Mock Exams", to: "/exams" },
              { label: course.short, to: "/exams/$courseId", params: { courseId: course.id } },
              { label: chapter.title },
            ]}
          />
          <Button variant="ghost" size="sm" className="mb-6 gap-2 -mt-2" asChild>
            <Link to="/exams/$courseId" params={{ courseId: course.id }}>
              <ArrowLeft className="size-4" />
              {course.short} chapters
            </Link>
          </Button>

          <MockExamTaker course={course} chapter={chapter} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
