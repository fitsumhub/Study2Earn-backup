import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { ContentFormData } from "@/components/admin/forms/content-form";
import { formToContent } from "@/components/admin/forms/content-form";
import type { ExamFormData } from "@/components/admin/forms/exam-form";
import { formToExam } from "@/components/admin/forms/exam-form";
import type { RewardFormData } from "@/components/admin/forms/reward-form";
import { formToReward } from "@/components/admin/forms/reward-form";
import type { StudentFormData } from "@/components/admin/forms/student-form";
import { formToStudent } from "@/components/admin/forms/student-form";
import { useWithdrawals } from "@/hooks/use-withdrawals";
import { buildDefaultAdminData, readAdminData, writeAdminData } from "@/lib/admin-store";
import { readLibraryBooks, writeLibraryBooks } from "@/lib/library-store";
import { deleteLocalFile, isLocalFileUrl } from "@/lib/media-store";
import type { LibraryBook } from "@/lib/mock-data";
import type {
  AdminActivity,
  AdminContent,
  AdminExam,
  AdminNotification,
  AdminReferral,
  AdminReward,
  AdminSection,
  AdminSettings,
  AdminUser,
  EditEntity,
  ModerationFlag,
  QuickAction,
} from "@/lib/admin-types";

function nextId(prefix: string, items: { id: string }[]) {
  const nums = items
    .map((i) => parseInt(String(i?.id ?? "").replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 8800) + 1;
  return `${prefix}-${next}`;
}

/**
 * Mirror an admin content item into the student library store so uploads,
 * edits, covers, and publish toggles show up for students immediately.
 * Student-owned fields (progress, XP, chapter completion) are preserved.
 */
function syncContentToLibrary(item: AdminContent) {
  const books = readLibraryBooks();
  const idx = books.findIndex((b) => b.id === item.id);
  const shared = {
    name: item.name,
    short: item.short,
    chapters: item.chapters,
    students: item.students,
    category: item.category,
    description: item.description,
    pages: item.pages,
    pdfUrl: item.pdfUrl,
    coverUrl: item.coverUrl,
    published: item.published,
  };
  if (idx >= 0) {
    const prev = books[idx];
    const chapterList =
      prev.chapterList.length === item.chapters
        ? prev.chapterList
        : Array.from({ length: item.chapters }, (_, i) => ({
            title: prev.chapterList[i]?.title ?? `Chapter ${i + 1}`,
            pages: prev.chapterList[i]?.pages ?? Math.max(1, Math.ceil(item.pages / item.chapters)),
            done: prev.chapterList[i]?.done ?? false,
          }));
    books[idx] = { ...prev, ...shared, chapterList };
  } else {
    const book: LibraryBook = {
      id: item.id,
      ...shared,
      tint: "from-slate-100 to-slate-50",
      progress: 0,
      xpEarned: 0,
      rating: 4.5,
      chapterList: Array.from({ length: item.chapters }, (_, i) => ({
        title: `Chapter ${i + 1}`,
        pages: Math.max(1, Math.ceil(item.pages / item.chapters)),
        done: false,
      })),
    };
    books.unshift(book);
  }
  writeLibraryBooks(books);
}

function removeContentFromLibrary(item: AdminContent) {
  writeLibraryBooks(readLibraryBooks().filter((b) => b.id !== item.id));
  // Clean up any browser-stored uploads the book owned.
  if (isLocalFileUrl(item.pdfUrl)) deleteLocalFile(item.pdfUrl);
  if (isLocalFileUrl(item.coverUrl)) deleteLocalFile(item.coverUrl);
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const defaultNotifications: AdminNotification[] = [
  {
    id: "n1",
    title: "Pending approval",
    body: "Hanna Demissie is awaiting account verification",
    read: false,
    section: "students",
  },
  {
    id: "n2",
    title: "Withdrawal requests",
    body: "2 pending bank withdrawal requests awaiting approval",
    read: false,
    section: "withdrawals",
  },
  {
    id: "n3",
    title: "Moderation flag",
    body: "Duplicate account report for STU-7712",
    read: false,
    section: "moderation",
  },
];

export function useAdminDashboard() {
  const {
    all: withdrawals,
    pendingCount: pendingWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    markPaid,
  } = useWithdrawals();

  // Lazy: building defaults constructs every course question bank — far too
  // heavy to re-run on every render (it used to run per search keystroke).
  const [defaults] = useState(buildDefaultAdminData);

  const [section, setSection] = useState<AdminSection>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>(defaults.users);
  const [activity, setActivity] = useState<AdminActivity[]>(defaults.activity);
  const [notifications, setNotifications] = useState<AdminNotification[]>(defaultNotifications);
  const [exams, setExams] = useState<AdminExam[]>(defaults.exams);
  const [rewards, setRewards] = useState<AdminReward[]>(defaults.rewards);
  const [referrals, setReferrals] = useState<AdminReferral[]>(defaults.referrals);
  const [content, setContent] = useState<AdminContent[]>(defaults.content);
  const [flags, setFlags] = useState<ModerationFlag[]>(defaults.flags);
  const [settings, setSettings] = useState<AdminSettings>(defaults.settings);
  const [storeReady, setStoreReady] = useState(false);

  const [activeDialog, setActiveDialog] = useState<QuickAction | null>(null);
  const [editEntity, setEditEntity] = useState<EditEntity | null>(null);
  const [profileUser, setProfileUser] = useState<AdminUser | null>(null);
  const [messageUser, setMessageUser] = useState<AdminUser | null>(null);
  const [suspendUser, setSuspendUser] = useState<AdminUser | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [examManagerMode, setExamManagerMode] = useState<"create" | "edit" | null>(null);
  const [managingExam, setManagingExam] = useState<AdminExam | null>(null);
  const [examManagerPreset, setExamManagerPreset] = useState<Partial<ExamFormData> | null>(null);

  useEffect(() => {
    const stored = readAdminData();
    setUsers(stored.users);
    setActivity(stored.activity);
    setExams(stored.exams);
    setRewards(stored.rewards);
    setReferrals(stored.referrals);
    setContent(stored.content);
    setFlags(stored.flags);
    setSettings(stored.settings);
    setStoreReady(true);
  }, []);

  useEffect(() => {
    if (!storeReady) return;
    writeAdminData({ users, exams, rewards, referrals, content, flags, settings, activity });
  }, [storeReady, users, exams, rewards, referrals, content, flags, settings, activity]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pendingStudents = useMemo(
    () => users.filter((u) => u.status === "pending").length,
    [users],
  );
  const openFlags = useMemo(() => flags.filter((f) => f.status === "open").length, [flags]);
  const unsyncedContent = useMemo(() => content.filter((c) => !c.synced).length, [content]);
  const draftExams = useMemo(() => exams.filter((e) => !e.published).length, [exams]);
  const pendingReferrals = useMemo(
    () => referrals.filter((r) => r.status === "pending" || r.status === "signed_up").length,
    [referrals],
  );

  const navBadges = useMemo(
    () => ({
      students: pendingStudents,
      moderation: openFlags,
      content: unsyncedContent,
      exams: draftExams,
      rewards: 0,
      withdrawals: pendingWithdrawals,
      referrals: pendingReferrals,
    }),
    [pendingStudents, openFlags, unsyncedContent, draftExams, pendingWithdrawals, pendingReferrals],
  );

  const pushActivity = useCallback((entry: Omit<AdminActivity, "id">) => {
    setActivity((prev) => [{ ...entry, id: nextId("act", prev) }, ...prev].slice(0, 20));
  }, []);

  const handleApproveWithdrawal = useCallback(
    (id: string) => {
      const req = withdrawals.find((w) => w.id === id);
      if (!req) return;
      approveWithdrawal(id);
      pushActivity({
        time: "Just now",
        action: "Withdrawal approved",
        detail: `${req.userName} — ${req.amountEtb} ETB to ${req.bankName}`,
        type: "reward",
      });
      toast.success(`Withdrawal approved for ${req.userName}`, {
        description: `${req.amountEtb} ETB → ${req.bankName}`,
      });
    },
    [withdrawals, approveWithdrawal, pushActivity],
  );

  const handleRejectWithdrawal = useCallback(
    (id: string, note?: string) => {
      const req = withdrawals.find((w) => w.id === id);
      if (!req) return;
      rejectWithdrawal(id, note);
      pushActivity({
        time: "Just now",
        action: "Withdrawal rejected",
        detail: `${req.userName} — ${req.amountEtb} ETB`,
        type: "reward",
      });
      toast.success(`Withdrawal rejected for ${req.userName}`);
    },
    [withdrawals, rejectWithdrawal, pushActivity],
  );

  const handleMarkPaid = useCallback(
    (id: string) => {
      const req = withdrawals.find((w) => w.id === id);
      if (!req) return;
      markPaid(id);
      pushActivity({
        time: "Just now",
        action: "Withdrawal paid",
        detail: `${req.amountEtb} ETB sent to ${req.bankName}`,
        type: "reward",
      });
      toast.success(`Marked as paid — ${req.amountEtb} ETB to ${req.bankName}`);
    },
    [withdrawals, markPaid, pushActivity],
  );

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.university.toLowerCase().includes(q) ||
        u.program.toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return exams;
    return exams.filter(
      (e) => e.title.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q),
    );
  }, [exams, searchQuery]);

  const filteredContent = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return content;
    return content.filter((c) => c.name.toLowerCase().includes(q));
  }, [content, searchQuery]);

  const getReferralXp = useCallback(
    (kind: "signup" | "complete") => {
      const raw = kind === "signup" ? settings.referralSignupXp : settings.referralCompleteXp;
      const parsed = parseInt(raw, 10);
      return Number.isNaN(parsed) ? (kind === "signup" ? 50 : 100) : parsed;
    },
    [settings.referralSignupXp, settings.referralCompleteXp],
  );

  const markReferralSignedUp = useCallback(
    (id: string) => {
      const xp = getReferralXp("signup");
      const target = referrals.find((r) => r.id === id && r.status === "pending");
      if (!target) return;
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === id && r.status === "pending"
            ? { ...r, status: "signed_up" as const, xpAwarded: xp }
            : r,
        ),
      );
      pushActivity({
        time: "Just now",
        action: "Referral signup confirmed",
        detail: `${target.referredName} via ${target.referrerName}`,
        type: "referral",
      });
      toast.success(`Signup confirmed for ${target.referredName}`, {
        description: `${xp} XP queued for ${target.referrerName}`,
      });
    },
    [referrals, getReferralXp, pushActivity],
  );

  const approveReferral = useCallback(
    (id: string) => {
      const xp = getReferralXp("complete");
      const target = referrals.find((r) => r.id === id && r.status !== "completed");
      if (!target) return;
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === id && r.status !== "completed"
            ? { ...r, status: "completed" as const, xpAwarded: xp }
            : r,
        ),
      );
      pushActivity({
        time: "Just now",
        action: "Referral bonus approved",
        detail: `${target.referrerName} — ${xp} XP for ${target.referredName}`,
        type: "referral",
      });
      toast.success(`Referral approved for ${target.referrerName}`, {
        description: `${xp} XP awarded`,
      });
    },
    [referrals, getReferralXp, pushActivity],
  );

  const rejectReferral = useCallback(
    (id: string) => {
      const ref = referrals.find((r) => r.id === id);
      if (!ref) return;
      setReferrals((prev) => prev.filter((r) => r.id !== id));
      pushActivity({
        time: "Just now",
        action: "Referral rejected",
        detail: `${ref.referredName} — ${ref.referrerName}`,
        type: "referral",
      });
      toast.success("Referral removed");
    },
    [referrals, pushActivity],
  );

  const deleteReferral = useCallback(
    (id: string) => {
      const ref = referrals.find((r) => r.id === id);
      if (!ref) return;
      setReferrals((prev) => prev.filter((r) => r.id !== id));
      pushActivity({
        time: "Just now",
        action: "Referral record deleted",
        detail: `${ref.referredName}`,
        type: "referral",
      });
      toast.success("Referral record deleted");
    },
    [referrals, pushActivity],
  );

  const goToSection = useCallback((next: AdminSection) => {
    setSection(next);
    setSearchQuery("");
  }, []);

  const openEdit = useCallback((entity: EditEntity) => {
    setEditEntity(entity);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  }, []);

  const openNotification = useCallback(
    (notification: AdminNotification) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
      if (notification.section) goToSection(notification.section);
      setNotificationsOpen(false);
    },
    [goToSection],
  );

  const exportReport = useCallback(
    (format: "csv" | "summary" | "withdrawals") => {
      // Quote every field so commas in names/universities can't break columns
      const csvRow = (fields: (string | number)[]) =>
        fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",");

      if (format === "csv") {
        const header = csvRow(["ID", "Name", "University", "Program", "Status", "Joined", "XP"]);
        const rows = users.map((u) =>
          csvRow([u.id, u.name, u.university, u.program, u.status, u.joined, u.xp]),
        );
        downloadFile("study2earn-students.csv", [header, ...rows].join("\n"), "text/csv");
        toast.success("Student report exported as CSV");
      } else if (format === "withdrawals") {
        const header = csvRow([
          "ID",
          "Student",
          "University",
          "Method",
          "Destination",
          "Account / UID",
          "Amount ETB",
          "XP deducted",
          "Status",
          "Requested",
          "Processed",
        ]);
        const rows = withdrawals.map((w) => {
          const isUsdt = w.method === "usdt";
          return csvRow([
            w.id,
            w.userName,
            w.university,
            isUsdt ? "USDT (Binance)" : "Bank transfer",
            isUsdt ? "Binance" : (w.bankName ?? ""),
            isUsdt ? (w.binanceUid ?? "") : (w.accountNumber ?? ""),
            w.amountEtb,
            w.xpDeducted,
            w.status,
            w.requestedAt,
            w.processedAt ?? "",
          ]);
        });
        downloadFile("study2earn-withdrawals.csv", [header, ...rows].join("\n"), "text/csv");
        toast.success("Withdrawal report exported as CSV");
      } else {
        const summary = [
          "Study2Earn Platform Report",
          `Generated: ${new Date().toLocaleString()}`,
          "",
          `Total students: ${users.length}`,
          `Active: ${users.filter((u) => u.status === "active").length}`,
          `Pending: ${users.filter((u) => u.status === "pending").length}`,
          `Suspended: ${users.filter((u) => u.status === "suspended").length}`,
          `Published exams: ${exams.filter((e) => e.published).length}`,
          `Active rewards: ${rewards.filter((r) => r.active).length}`,
        ].join("\n");
        downloadFile("study2earn-summary.txt", summary, "text/plain");
        toast.success("Summary report downloaded");
      }
      pushActivity({
        time: "Just now",
        action: "Report exported",
        detail:
          format === "csv"
            ? "Student CSV download"
            : format === "withdrawals"
              ? "Withdrawal CSV download"
              : "Platform summary download",
        type: "content",
      });
    },
    [users, exams, rewards, withdrawals, pushActivity],
  );

  const addStudent = useCallback(
    (data: StudentFormData) => {
      const user: AdminUser = {
        ...formToStudent(data),
        id: nextId("STU", users),
        joined: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
      setUsers((prev) => [user, ...prev]);
      setActiveDialog(null);
      pushActivity({
        time: "Just now",
        action: "Student added",
        detail: `${data.name} — ${data.university}`,
        type: "user",
      });
      toast.success(`${data.name} added — pending approval`);
    },
    [users, pushActivity],
  );

  const updateStudent = useCallback(
    (id: string, data: StudentFormData) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...formToStudent(data, id), joined: u.joined } : u)),
      );
      pushActivity({
        time: "Just now",
        action: "Student updated",
        detail: `${data.name} (${id})`,
        type: "user",
      });
      toast.success(`${data.name} updated`);
    },
    [pushActivity],
  );

  const deleteStudent = useCallback(
    (id: string) => {
      const user = users.find((u) => u.id === id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (user) {
        pushActivity({
          time: "Just now",
          action: "Student removed",
          detail: `${user.name} (${id})`,
          type: "user",
        });
        toast.success(`${user.name} removed`);
      }
    },
    [users, pushActivity],
  );

  const publishExam = useCallback(
    (data: ExamFormData) => {
      const exam: AdminExam = {
        ...(formToExam(data) as AdminExam),
        id: nextId("EX", exams),
        attempts: 0,
      };
      setExams((prev) => [exam, ...prev]);
      setActiveDialog(null);
      pushActivity({
        time: "Just now",
        action: "Exam published",
        detail: `${data.title} — ${data.questions} questions`,
        type: "exam",
      });
      toast.success(`"${data.title}" published`);
    },
    [exams, pushActivity],
  );

  const openExamManager = useCallback((exam?: AdminExam, preset?: Partial<ExamFormData>) => {
    if (exam) {
      setManagingExam(exam);
      setExamManagerMode("edit");
      setExamManagerPreset(null);
    } else {
      setManagingExam(null);
      setExamManagerMode("create");
      setExamManagerPreset(preset ?? null);
    }
    setActiveDialog(null);
  }, []);

  const closeExamManager = useCallback(() => {
    setExamManagerMode(null);
    setManagingExam(null);
    setExamManagerPreset(null);
  }, []);

  const saveExamManager = useCallback(
    (data: ExamFormData) => {
      if (examManagerMode === "create") {
        const exam: AdminExam = {
          ...(formToExam(data) as AdminExam),
          id: nextId("EX", exams),
          attempts: 0,
        };
        setExams((prev) => [exam, ...prev]);
        pushActivity({
          time: "Just now",
          action: "Exam created",
          detail: `${data.title} — ${data.questionBank.length} questions in bank`,
          type: "exam",
        });
        toast.success(`"${data.title}" created`);
      } else if (managingExam) {
        setExams((prev) =>
          prev.map((e) =>
            e.id === managingExam.id
              ? ({
                  ...e,
                  ...formToExam(data, e.id),
                  attempts: e.attempts,
                } as AdminExam)
              : e,
          ),
        );
        pushActivity({
          time: "Just now",
          action: "Exam updated",
          detail: `${data.title} (${managingExam.id})`,
          type: "exam",
        });
        toast.success(`"${data.title}" saved`);
      }
      closeExamManager();
    },
    [examManagerMode, managingExam, exams, pushActivity, closeExamManager],
  );

  const duplicateExam = useCallback(
    (id: string) => {
      const exam = exams.find((e) => e.id === id);
      if (!exam) return;
      const copy: AdminExam = {
        ...exam,
        id: nextId("EX", exams),
        title: `${exam.title} (copy)`,
        published: false,
        attempts: 0,
        questionBank: exam.questionBank.map((q) => ({
          ...q,
          id: `${q.id}-dup-${Date.now()}`,
        })),
      };
      setExams((prev) => [copy, ...prev]);
      toast.success("Exam duplicated as draft");
    },
    [exams],
  );

  const publishCourseExams = useCallback(
    (courseId: string) => {
      const count = exams.filter((e) => e.courseId === courseId && !e.published).length;
      if (count === 0) return;
      setExams((prev) =>
        prev.map((e) => (e.courseId === courseId && !e.published ? { ...e, published: true } : e)),
      );
      pushActivity({
        time: "Just now",
        action: "Bulk publish",
        detail: `${count} exams in ${courseId}`,
        type: "exam",
      });
      toast.success(`Published ${count} exam${count !== 1 ? "s" : ""}`);
    },
    [exams, pushActivity],
  );

  const updateExam = useCallback(
    (id: string, data: ExamFormData) => {
      setExams((prev) =>
        prev.map((e) =>
          e.id === id ? ({ ...e, ...formToExam(data, id), attempts: e.attempts } as AdminExam) : e,
        ),
      );
      pushActivity({
        time: "Just now",
        action: "Exam updated",
        detail: `${data.title} (${id})`,
        type: "exam",
      });
      toast.success(`"${data.title}" updated`);
    },
    [pushActivity],
  );

  const deleteExam = useCallback(
    (id: string) => {
      const exam = exams.find((e) => e.id === id);
      setExams((prev) => prev.filter((e) => e.id !== id));
      if (exam) {
        pushActivity({
          time: "Just now",
          action: "Exam removed",
          detail: `${exam.title} (${id})`,
          type: "exam",
        });
        toast.success(`"${exam.title}" removed`);
      }
    },
    [exams, pushActivity],
  );

  const uploadContent = useCallback(
    (data: ContentFormData) => {
      const item: AdminContent = {
        ...formToContent(data),
        id: nextId("BK", content),
      } as AdminContent;
      setContent((prev) => [item, ...prev]);
      syncContentToLibrary(item);
      setActiveDialog(null);
      pushActivity({
        time: "Just now",
        action: "Content uploaded",
        detail: `${data.name} — ${data.chapters} chapters`,
        type: "content",
      });
      toast.success(`"${data.name}" added to library`);
    },
    [content, pushActivity],
  );

  const updateContent = useCallback(
    (id: string, data: ContentFormData) => {
      setContent((prev) =>
        prev.map((c) => (c.id === id ? ({ ...c, ...formToContent(data, id) } as AdminContent) : c)),
      );
      syncContentToLibrary({ ...formToContent(data, id), id } as AdminContent);
      pushActivity({
        time: "Just now",
        action: "Content updated",
        detail: `${data.name} (${id})`,
        type: "content",
      });
      toast.success(`"${data.name}" updated`);
    },
    [pushActivity],
  );

  const deleteContent = useCallback(
    (id: string) => {
      const item = content.find((c) => c.id === id);
      setContent((prev) => prev.filter((c) => c.id !== id));
      if (item) removeContentFromLibrary(item);
      if (item) {
        pushActivity({
          time: "Just now",
          action: "Content removed",
          detail: `${item.name} (${id})`,
          type: "content",
        });
        toast.success(`"${item.name}" removed`);
      }
    },
    [content, pushActivity],
  );

  const createReward = useCallback(
    (data: RewardFormData) => {
      const reward: AdminReward = {
        ...formToReward(data),
        id: nextId("RW", rewards),
      } as AdminReward;
      setRewards((prev) => [reward, ...prev]);
      setActiveDialog(null);
      pushActivity({
        time: "Just now",
        action: "Reward created",
        detail: `${data.title} — ${data.xp} XP`,
        type: "reward",
      });
      toast.success(`Reward "${data.title}" created`);
    },
    [rewards, pushActivity],
  );

  const updateReward = useCallback(
    (id: string, data: RewardFormData) => {
      setRewards((prev) =>
        prev.map((r) => (r.id === id ? ({ ...r, ...formToReward(data, id) } as AdminReward) : r)),
      );
      pushActivity({
        time: "Just now",
        action: "Reward updated",
        detail: `${data.title} (${id})`,
        type: "reward",
      });
      toast.success(`"${data.title}" updated`);
    },
    [pushActivity],
  );

  const deleteReward = useCallback(
    (id: string) => {
      const reward = rewards.find((r) => r.id === id);
      setRewards((prev) => prev.filter((r) => r.id !== id));
      if (reward) {
        pushActivity({
          time: "Just now",
          action: "Reward removed",
          detail: `${reward.title} (${id})`,
          type: "reward",
        });
        toast.success(`"${reward.title}" removed`);
      }
    },
    [rewards, pushActivity],
  );

  const updateUserStatus = useCallback(
    (userId: string, status: AdminUser["status"]) => {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      const label =
        status === "active" ? "approved" : status === "suspended" ? "suspended" : "updated";
      pushActivity({
        time: "Just now",
        action: `Account ${label}`,
        detail: `${user.name} (${userId})`,
        type: status === "suspended" ? "moderation" : "user",
      });
      toast.success(`${user.name} ${label}`);
    },
    [users, pushActivity],
  );

  const sendMessage = useCallback(
    (userId: string, message: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      setMessageUser(null);
      pushActivity({
        time: "Just now",
        action: "Message sent",
        detail: `To ${user.name}: ${message.slice(0, 40)}${message.length > 40 ? "…" : ""}`,
        type: "user",
      });
      toast.success(`Message sent to ${user.name}`);
    },
    [users, pushActivity],
  );

  const toggleExamPublished = useCallback(
    (examId: string) => {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) return;
      const published = !exam.published;
      setExams((prev) => prev.map((e) => (e.id === examId ? { ...e, published } : e)));
      toast.success(published ? `"${exam.title}" published` : `"${exam.title}" unpublished`);
    },
    [exams],
  );

  const toggleRewardActive = useCallback(
    (rewardId: string) => {
      const reward = rewards.find((r) => r.id === rewardId);
      if (!reward) return;
      const active = !reward.active;
      setRewards((prev) => prev.map((r) => (r.id === rewardId ? { ...r, active } : r)));
      toast.success(active ? `"${reward.title}" activated` : `"${reward.title}" deactivated`);
    },
    [rewards],
  );

  const syncContent = useCallback(
    (contentId: string) => {
      const item = content.find((c) => c.id === contentId);
      if (!item || item.synced) return;
      setContent((prev) => prev.map((c) => (c.id === contentId ? { ...c, synced: true } : c)));
      pushActivity({
        time: "Just now",
        action: "Content synced",
        detail: `${item.name} — MoE curriculum`,
        type: "content",
      });
      toast.success(`"${item.name}" synced with MoE curriculum`);
    },
    [content, pushActivity],
  );

  const resolveFlag = useCallback(
    (flagId: string) => {
      const flag = flags.find((f) => f.id === flagId);
      if (!flag || flag.status === "resolved") return;
      setFlags((prev) => prev.map((f) => (f.id === flagId ? { ...f, status: "resolved" } : f)));
      pushActivity({
        time: "Just now",
        action: "Flag resolved",
        detail: `${flag.report} — ${flag.user}`,
        type: "moderation",
      });
      toast.success(`Flag ${flagId} resolved`);
    },
    [flags, pushActivity],
  );

  const saveSettings = useCallback(() => {
    toast.success("Platform settings saved");
    pushActivity({
      time: "Just now",
      action: "Settings updated",
      detail: "Platform configuration saved",
      type: "moderation",
    });
  }, [pushActivity]);

  const openQuickAction = useCallback(
    (action: QuickAction) => {
      if (action === "publishExam") {
        goToSection("exams");
        openExamManager();
        return;
      }
      setActiveDialog(action);
      if (action === "addStudent") goToSection("students");
      if (action === "uploadContent") goToSection("content");
      if (action === "createReward") goToSection("rewards");
    },
    [goToSection, openExamManager],
  );

  return {
    section,
    setSection: goToSection,
    searchQuery,
    setSearchQuery,
    users,
    filteredUsers,
    activity,
    notifications,
    unreadCount,
    pendingStudents,
    openFlags,
    unsyncedContent,
    draftExams,
    pendingReferrals,
    navBadges,
    withdrawals,
    pendingWithdrawals,
    approveWithdrawal: handleApproveWithdrawal,
    rejectWithdrawal: handleRejectWithdrawal,
    markPaid: handleMarkPaid,
    notificationsOpen,
    setNotificationsOpen,
    exams: filteredExams,
    rewards,
    referrals,
    content: filteredContent,
    flags,
    settings,
    setSettings,
    activeDialog,
    setActiveDialog,
    editEntity,
    setEditEntity,
    openEdit,
    profileUser,
    setProfileUser,
    messageUser,
    setMessageUser,
    suspendUser,
    setSuspendUser,
    markAllNotificationsRead,
    openNotification,
    exportReport,
    addStudent,
    updateStudent,
    deleteStudent,
    publishExam,
    updateExam,
    deleteExam,
    uploadContent,
    updateContent,
    deleteContent,
    createReward,
    updateReward,
    deleteReward,
    updateUserStatus,
    sendMessage,
    toggleExamPublished,
    toggleRewardActive,
    syncContent,
    resolveFlag,
    saveSettings,
    openQuickAction,
    examManagerMode,
    managingExam,
    examManagerPreset,
    openExamManager,
    closeExamManager,
    saveExamManager,
    duplicateExam,
    publishCourseExams,
    approveReferral,
    markReferralSignedUp,
    rejectReferral,
    deleteReferral,
  };
}

export type AdminDashboardState = ReturnType<typeof useAdminDashboard>;
