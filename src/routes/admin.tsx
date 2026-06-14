import { createFileRoute } from "@tanstack/react-router";

import { AdminDialogs } from "@/components/admin-dialogs";
import { AdminPanel } from "@/components/admin-panel";
import { AdminShell } from "@/components/admin-shell";
import { Toaster } from "@/components/ui/sonner";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { sectionMeta } from "@/lib/admin-types";

export const Route = createFileRoute("/admin")({
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
  const admin = useAdminDashboard();
  const meta = sectionMeta[admin.section];

  return (
    <>
      <AdminShell title={meta.title} description={meta.description} admin={admin}>
        <AdminPanel admin={admin} />
      </AdminShell>
      <AdminDialogs admin={admin} />
      <Toaster richColors position="top-right" />
    </>
  );
}
