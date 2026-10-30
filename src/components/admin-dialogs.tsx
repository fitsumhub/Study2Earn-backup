import { ContentForm, type ContentFormData } from "@/components/admin/forms/content-form";
import { ExamForm, type ExamFormData } from "@/components/admin/forms/exam-form";
import { RewardForm, type RewardFormData } from "@/components/admin/forms/reward-form";
import { StudentForm, type StudentFormData } from "@/components/admin/forms/student-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import type { AdminUser, QuickAction } from "@/lib/admin-types";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const createMeta: Record<QuickAction, { title: string; description: string }> = {
  addStudent: {
    title: "Add student",
    description: "Register a new student account (pending approval).",
  },
  publishExam: { title: "Publish exam", description: "Create and publish a new mock exam." },
  uploadContent: { title: "Upload content", description: "Add a new book or study material (PDF, PPT, DOC)." },
  createReward: { title: "Create reward", description: "Add a new XP redemption item." },
};

export function AdminDialogs({ admin }: { admin: AdminDashboardState }) {
  const {
    activeDialog,
    setActiveDialog,
    profileUser,
    setProfileUser,
    messageUser,
    setMessageUser,
    suspendUser,
    setSuspendUser,
    adjustPointsUser,
    setAdjustPointsUser,
    addStudent,
    publishExam,
    uploadContent,
    createReward,
    updateUserStatus,
    sendMessage,
    adjustUserXp,
    openEdit,
  } = admin;

  return (
    <>
      <CreateDialog
        action={activeDialog}
        onClose={() => setActiveDialog(null)}
        onAddStudent={addStudent}
        onPublishExam={publishExam}
        onUploadContent={uploadContent}
        onCreateReward={createReward}
      />
      <ProfileDialog
        user={profileUser}
        onClose={() => setProfileUser(null)}
        onEdit={(user) => {
          setProfileUser(null);
          openEdit({ type: "student", item: user });
        }}
      />
      <MessageDialog user={messageUser} onClose={() => setMessageUser(null)} onSend={sendMessage} />
      <AdjustPointsDialog
        user={adjustPointsUser}
        onClose={() => setAdjustPointsUser(null)}
        onSubmit={adjustUserXp}
      />
      <SuspendDialog
        user={suspendUser}
        onClose={() => setSuspendUser(null)}
        onConfirm={(id) => {
          updateUserStatus(id, "suspended");
          setSuspendUser(null);
        }}
      />
    </>
  );
}

function CreateDialog({
  action,
  onClose,
  onAddStudent,
  onPublishExam,
  onUploadContent,
  onCreateReward,
}: {
  action: QuickAction | null;
  onClose: () => void;
  onAddStudent: (d: StudentFormData) => void;
  onPublishExam: (d: ExamFormData) => void;
  onUploadContent: (d: ContentFormData) => void;
  onCreateReward: (d: RewardFormData) => void;
}) {
  if (!action) return null;
  const meta = createMeta[action];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={action === "uploadContent" ? "sm:max-w-2xl max-h-[90vh] overflow-y-auto" : undefined}>
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>
        {action === "addStudent" && (
          <StudentForm
            submitLabel="Add student"
            onCancel={onClose}
            onSubmit={(data) => {
              onAddStudent(data);
              onClose();
            }}
          />
        )}
        {action === "publishExam" && (
          <ExamForm
            submitLabel="Publish exam"
            onCancel={onClose}
            onSubmit={(data) => {
              onPublishExam(data);
              onClose();
            }}
          />
        )}
        {action === "uploadContent" && (
          <ContentForm
            submitLabel="Add book"
            onCancel={onClose}
            onSubmit={(data) => {
              onUploadContent(data);
              onClose();
            }}
          />
        )}
        {action === "createReward" && (
          <RewardForm
            submitLabel="Create reward"
            onCancel={onClose}
            onSubmit={(data) => {
              onCreateReward(data);
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProfileDialog({
  user,
  onClose,
  onEdit,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onEdit: (user: AdminUser) => void;
}) {
  if (!user) return null;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user.name}</DialogTitle>
          <DialogDescription>{user.id}</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3 text-sm">
          <Row label="University" value={user.university} />
          <Row label="Program" value={user.program} />
          <Row label="Status" value={user.status} />
          <Row label="Joined" value={user.joined} />
          <Row label="XP" value={user.xp > 0 ? user.xp.toLocaleString() : "—"} />
        </dl>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onEdit(user)}>Edit student</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}

function MessageDialog({
  user,
  onClose,
  onSend,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSend: (userId: string, message: string) => void;
}) {
  const [message, setMessage] = useState("");
  if (!user) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim()) onSend(user.id, message.trim());
            setMessage("");
          }}
        >
          <DialogHeader>
            <DialogTitle>Send message</DialogTitle>
            <DialogDescription>
              To {user.name} ({user.id})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="admin-message" className="sr-only">
              Message
            </Label>
            <Textarea
              id="admin-message"
              placeholder="Write your message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Send</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdjustPointsDialog({
  user,
  onClose,
  onSubmit,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSubmit: (userId: string, delta: number, reason: string) => void;
}) {
  const [direction, setDirection] = useState<"add" | "reduce">("add");
  const [amount, setAmount] = useState("50");
  const [reason, setReason] = useState("");

  if (!user) return null;

  const parsedAmount = Math.max(0, Math.round(Number(amount)) || 0);
  const delta = direction === "add" ? parsedAmount : -parsedAmount;
  const newBalance = Math.max(0, user.xp + delta);

  function reset() {
    setDirection("add");
    setAmount("50");
    setReason("");
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          reset();
        }
      }}
    >
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (parsedAmount === 0) return;
            onSubmit(user.id, delta, reason);
            reset();
          }}
        >
          <DialogHeader>
            <DialogTitle>Adjust points</DialogTitle>
            <DialogDescription>
              {user.name} ({user.id}) — current balance {user.xp.toLocaleString()} XP
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("add")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition-colors",
                  direction === "add"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                <Plus className="size-4" />
                Add points
              </button>
              <button
                type="button"
                onClick={() => setDirection("reduce")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition-colors",
                  direction === "reduce"
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                <Minus className="size-4" />
                Reduce points
              </button>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adjust-amount">XP amount</Label>
              <Input
                id="adjust-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adjust-reason">Reason (sent to the student)</Label>
              <Textarea
                id="adjust-reason"
                placeholder="e.g. Bonus for helping report a bug"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
              New balance:{" "}
              <span className="font-semibold text-brand-navy">
                {newBalance.toLocaleString()} XP
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={parsedAmount === 0}>
              {direction === "add" ? "Award" : "Deduct"} {parsedAmount || 0} XP
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SuspendDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onConfirm: (userId: string) => void;
}) {
  if (!user) return null;
  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Suspend account?</AlertDialogTitle>
          <AlertDialogDescription>
            {user.name} ({user.id}) will lose access until reactivated by an admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onConfirm(user.id)}
          >
            Suspend
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
