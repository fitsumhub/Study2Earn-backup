import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/exams/$courseId")({
  component: CourseLayout,
});

function CourseLayout() {
  return <Outlet />;
}
