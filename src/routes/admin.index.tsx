import { createFileRoute } from "@tanstack/react-router";

import { RequireAuthClient } from "@/components/require-auth-client";
import { AdminDialogs } from "@/components/admin-dialogs";
import { AdminEditSheet } from "@/components/admin/admin-edit-sheet";
import { ExamManagerSheet } from "@/components/admin/exam-manager-sheet";
import { AdminPanel } from "@/components/admin-panel";
import { AdminShell } from "@/components/admin-shell";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { sectionMeta } from "@/lib/admin-types";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Study2Earn" },
      {
        name: "description",
        content:
          "Platform administration console for Study2Earn — students, content, exams, and rewards.",
      },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return (
    <RequireAuthClient redirectTo="/admin" requireAdmin loginPath="/admin/login">
      <AdminDashboardContent />
    </RequireAuthClient>
  );
}

function AdminDashboardContent() {
  const admin = useAdminDashboard();
  const meta = sectionMeta[admin.section];

  return (
    <>
      <AdminShell title={meta.title} description={meta.description} admin={admin}>
        <AdminPanel admin={admin} />
      </AdminShell>
      <AdminDialogs admin={admin} />
      <AdminEditSheet admin={admin} />
      <ExamManagerSheet
        exam={admin.managingExam}
        open={admin.examManagerMode !== null}
        mode={admin.examManagerMode === "create" ? "create" : "edit"}
        preset={admin.examManagerPreset}
        initialTab={admin.examManagerInitialTab}
        onClose={admin.closeExamManager}
        onSave={admin.saveExamManager}
      />
    </>
  );
}

