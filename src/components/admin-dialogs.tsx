import { useState, type FormEvent } from "react";

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import type { AdminUser, QuickAction } from "@/lib/admin-types";

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
    addStudent,
    publishExam,
    uploadContent,
    createReward,
    updateUserStatus,
    sendMessage,
  } = admin;

  return (
    <>
      <QuickActionDialog
        action={activeDialog}
        onClose={() => setActiveDialog(null)}
        onAddStudent={addStudent}
        onPublishExam={publishExam}
        onUploadContent={uploadContent}
        onCreateReward={createReward}
      />
      <ProfileDialog user={profileUser} onClose={() => setProfileUser(null)} />
      <MessageDialog user={messageUser} onClose={() => setMessageUser(null)} onSend={sendMessage} />
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

function QuickActionDialog({
  action,
  onClose,
  onAddStudent,
  onPublishExam,
  onUploadContent,
  onCreateReward,
}: {
  action: QuickAction | null;
  onClose: () => void;
  onAddStudent: (d: { name: string; university: string; program: string }) => void;
  onPublishExam: (d: {
    title: string;
    subject: string;
    questions: number;
    duration: number;
  }) => void;
  onUploadContent: (d: { name: string; chapters: number }) => void;
  onCreateReward: (d: { title: string; xp: number; tag: string }) => void;
}) {
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState("40");
  const [duration, setDuration] = useState("60");
  const [chapters, setChapters] = useState("8");
  const [xp, setXp] = useState("500");
  const [tag, setTag] = useState("Platform");

  const reset = () => {
    setName("");
    setUniversity("");
    setProgram("");
    setTitle("");
    setSubject("");
    setQuestions("40");
    setDuration("60");
    setChapters("8");
    setXp("500");
    setTag("Platform");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const meta: Record<QuickAction, { title: string; description: string }> = {
    addStudent: {
      title: "Add student",
      description: "Register a new student account (pending approval).",
    },
    publishExam: { title: "Publish exam", description: "Create and publish a new mock exam." },
    uploadContent: { title: "Upload content", description: "Add a new book to the MoE library." },
    createReward: { title: "Create reward", description: "Add a new XP redemption item." },
  };

  if (!action) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (action === "addStudent") {
      onAddStudent({ name, university, program });
    } else if (action === "publishExam") {
      onPublishExam({
        title,
        subject,
        questions: parseInt(questions, 10) || 40,
        duration: parseInt(duration, 10) || 60,
      });
    } else if (action === "uploadContent") {
      onUploadContent({ name: title, chapters: parseInt(chapters, 10) || 8 });
    } else if (action === "createReward") {
      onCreateReward({ title, xp: parseInt(xp, 10) || 500, tag });
    }
    reset();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{meta[action].title}</DialogTitle>
            <DialogDescription>{meta[action].description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {action === "addStudent" && (
              <>
                <Field
                  label="Full name"
                  id="student-name"
                  value={name}
                  onChange={setName}
                  required
                />
                <Field
                  label="University"
                  id="student-uni"
                  value={university}
                  onChange={setUniversity}
                  required
                />
                <Field
                  label="Program"
                  id="student-program"
                  value={program}
                  onChange={setProgram}
                  required
                />
              </>
            )}
            {(action === "publishExam" ||
              action === "createReward" ||
              action === "uploadContent") && (
              <Field
                label={action === "uploadContent" ? "Book title" : "Title"}
                id="item-title"
                value={title}
                onChange={setTitle}
                required
              />
            )}
            {action === "publishExam" && (
              <>
                <Field
                  label="Subject"
                  id="exam-subject"
                  value={subject}
                  onChange={setSubject}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Questions"
                    id="exam-questions"
                    value={questions}
                    onChange={setQuestions}
                    type="number"
                    required
                  />
                  <Field
                    label="Duration (min)"
                    id="exam-duration"
                    value={duration}
                    onChange={setDuration}
                    type="number"
                    required
                  />
                </div>
              </>
            )}
            {action === "uploadContent" && (
              <Field
                label="Chapters"
                id="content-chapters"
                value={chapters}
                onChange={setChapters}
                type="number"
                required
              />
            )}
            {action === "createReward" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="XP cost"
                    id="reward-xp"
                    value={xp}
                    onChange={setXp}
                    type="number"
                    required
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="reward-tag">Category</Label>
                    <Select value={tag} onValueChange={setTag}>
                      <SelectTrigger id="reward-tag">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Platform", "Telecom", "Voucher", "Status", "Cosmetic", "Community"].map(
                          (t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function ProfileDialog({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
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
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Send</Button>
          </DialogFooter>
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
