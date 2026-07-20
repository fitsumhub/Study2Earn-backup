import { useEffect } from "react";

import {
  ContentForm,
  contentToForm,
  type ContentFormData,
} from "@/components/admin/forms/content-form";
import {
  RewardForm,
  rewardToForm,
  type RewardFormData,
} from "@/components/admin/forms/reward-form";
import {
  StudentForm,
  studentToForm,
  type StudentFormData,
} from "@/components/admin/forms/student-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import type { EditEntity } from "@/lib/admin-types";

const editMeta: Record<
  Exclude<EditEntity["type"], "exam">,
  { title: string; description: string }
> = {
  student: { title: "Edit student", description: "Update student profile and account status." },
  content: { title: "Edit book", description: "Update library book metadata and sync status." },
  reward: { title: "Edit reward", description: "Update reward catalog item." },
};

export function AdminEditSheet({ admin }: { admin: AdminDashboardState }) {
  const { editEntity, setEditEntity, updateStudent, updateContent, updateReward, openExamManager } =
    admin;

  useEffect(() => {
    if (editEntity?.type === "exam") {
      openExamManager(editEntity.item);
      setEditEntity(null);
    }
  }, [editEntity, openExamManager, setEditEntity]);

  if (!editEntity || editEntity.type === "exam") return null;

  const meta = editMeta[editEntity.type];
  const handleClose = () => setEditEntity(null);

  return (
    <Sheet open onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{meta.title}</SheetTitle>
          <SheetDescription>{meta.description}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {editEntity.type === "student" && (
            <StudentForm
              key={editEntity.item.id}
              initial={studentToForm(editEntity.item)}
              submitLabel="Save changes"
              onCancel={handleClose}
              onSubmit={(data: StudentFormData) => {
                updateStudent(editEntity.item.id, data);
                handleClose();
              }}
            />
          )}
          {editEntity.type === "content" && (
            <ContentForm
              key={editEntity.item.id}
              initial={contentToForm(editEntity.item)}
              submitLabel="Save changes"
              onCancel={handleClose}
              onSubmit={(data: ContentFormData) => {
                updateContent(editEntity.item.id, data);
                handleClose();
              }}
            />
          )}
          {editEntity.type === "reward" && (
            <RewardForm
              key={editEntity.item.id}
              initial={rewardToForm(editEntity.item)}
              submitLabel="Save changes"
              onCancel={handleClose}
              onSubmit={(data: RewardFormData) => {
                updateReward(editEntity.item.id, data);
                handleClose();
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
