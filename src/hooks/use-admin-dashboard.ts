import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { useWithdrawals } from "@/hooks/use-withdrawals";
import { adminActivity as initialActivity, recentUsers as initialUsers } from "@/lib/admin-data";
import type {
  AdminActivity,
  AdminContent,
  AdminExam,
  AdminNotification,
  AdminReward,
  AdminSection,
  AdminUser,
  ModerationFlag,
  QuickAction,
} from "@/lib/admin-types";
import { exams as mockExams, rewards as mockRewards, subjects } from "@/lib/mock-data";

function nextId(prefix: string, items: { id: string }[]) {
  const nums = items
    .map((i) => parseInt(i.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 8800) + 1;
  return `${prefix}-${next}`;
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

export function useAdminDashboard() {
  const {
    all: withdrawals,
    pendingCount: pendingWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    markPaid,
  } = useWithdrawals();

  const [section, setSection] = useState<AdminSection>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [activity, setActivity] = useState<AdminActivity[]>(
    initialActivity.map((a, i) => ({ ...a, id: `act-${i}` })),
  );
  const [notifications, setNotifications] = useState<AdminNotification[]>([
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
      section: "rewards",
    },
    {
      id: "n3",
      title: "Moderation flag",
      body: "Duplicate account report for STU-7712",
      read: false,
      section: "moderation",
    },
  ]);
  const [exams, setExams] = useState<AdminExam[]>(
    mockExams.map((e, i) => ({ ...e, id: `EX-${1000 + i}`, published: i < 4 })),
  );
  const [rewards, setRewards] = useState<AdminReward[]>(
    mockRewards.map((r, i) => ({ ...r, id: `RW-${100 + i}`, active: true })),
  );
  const [content, setContent] = useState<AdminContent[]>(
    subjects.map((s, i) => ({
      id: `BK-${i}`,
      name: s.name,
      chapters: s.chapters,
      students: s.students,
      synced: i % 3 !== 0,
    })),
  );
  const [flags, setFlags] = useState<ModerationFlag[]>([
    { id: "FL-101", report: "Duplicate account", user: "STU-7712", status: "open" },
    { id: "FL-102", report: "Inappropriate username", user: "STU-6621", status: "open" },
    { id: "FL-103", report: "Exam answer leak", user: "STU-5590", status: "resolved" },
  ]);
  const [settings, setSettings] = useState({
    emailAlerts: true,
    autoApprove: false,
    maxDailyExams: "5",
    defaultXpReward: "100",
  });

  const [activeDialog, setActiveDialog] = useState<QuickAction | null>(null);
  const [profileUser, setProfileUser] = useState<AdminUser | null>(null);
  const [messageUser, setMessageUser] = useState<AdminUser | null>(null);
  const [suspendUser, setSuspendUser] = useState<AdminUser | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pendingStudents = useMemo(
    () => users.filter((u) => u.status === "pending").length,
    [users],
  );
  const openFlags = useMemo(() => flags.filter((f) => f.status === "open").length, [flags]);
  const unsyncedContent = useMemo(() => content.filter((c) => !c.synced).length, [content]);
  const draftExams = useMemo(() => exams.filter((e) => !e.published).length, [exams]);

  const navBadges = useMemo(
    () => ({
      students: pendingStudents,
      moderation: openFlags,
      content: unsyncedContent,
      exams: draftExams,
      rewards: pendingWithdrawals,
    }),
    [pendingStudents, openFlags, unsyncedContent, draftExams, pendingWithdrawals],
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

  const goToSection = useCallback((next: AdminSection) => {
    setSection(next);
    setSearchQuery("");
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
    (format: "csv" | "summary") => {
      if (format === "csv") {
        const header = "ID,Name,University,Program,Status,Joined,XP\n";
        const rows = users
          .map((u) => [u.id, u.name, u.university, u.program, u.status, u.joined, u.xp].join(","))
          .join("\n");
        downloadFile("study2earn-students.csv", header + rows, "text/csv");
        toast.success("Student report exported as CSV");
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
        detail: format === "csv" ? "Student CSV download" : "Platform summary download",
        type: "content",
      });
    },
    [users, exams, rewards, pushActivity],
  );

  const addStudent = useCallback(
    (data: { name: string; university: string; program: string }) => {
      const user: AdminUser = {
        id: nextId("STU", users),
        name: data.name,
        university: data.university,
        program: data.program,
        status: "pending",
        joined: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        xp: 0,
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

  const publishExam = useCallback(
    (data: { title: string; subject: string; questions: number; duration: number }) => {
      const exam: AdminExam = {
        id: nextId("EX", exams),
        title: data.title,
        subject: data.subject,
        difficulty: "Intermediate",
        duration: data.duration,
        questions: data.questions,
        published: true,
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

  const uploadContent = useCallback(
    (data: { name: string; chapters: number }) => {
      const item: AdminContent = {
        id: nextId("BK", content),
        name: data.name,
        chapters: data.chapters,
        students: "0",
        synced: false,
      };
      setContent((prev) => [item, ...prev]);
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

  const createReward = useCallback(
    (data: { title: string; xp: number; tag: string }) => {
      const reward: AdminReward = {
        id: nextId("RW", rewards),
        title: data.title,
        xp: data.xp,
        tag: data.tag,
        active: true,
      };
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

  const toggleExamPublished = useCallback((examId: string) => {
    setExams((prev) =>
      prev.map((e) => {
        if (e.id !== examId) return e;
        const published = !e.published;
        toast.success(published ? `"${e.title}" published` : `"${e.title}" unpublished`);
        return { ...e, published };
      }),
    );
  }, []);

  const toggleRewardActive = useCallback((rewardId: string) => {
    setRewards((prev) =>
      prev.map((r) => {
        if (r.id !== rewardId) return r;
        const active = !r.active;
        toast.success(active ? `"${r.title}" activated` : `"${r.title}" deactivated`);
        return { ...r, active };
      }),
    );
  }, []);

  const syncContent = useCallback(
    (contentId: string) => {
      setContent((prev) =>
        prev.map((c) => {
          if (c.id !== contentId) return c;
          pushActivity({
            time: "Just now",
            action: "Content synced",
            detail: `${c.name} — MoE curriculum`,
            type: "content",
          });
          toast.success(`"${c.name}" synced with MoE curriculum`);
          return { ...c, synced: true };
        }),
      );
    },
    [pushActivity],
  );

  const resolveFlag = useCallback(
    (flagId: string) => {
      setFlags((prev) =>
        prev.map((f) => {
          if (f.id !== flagId) return f;
          pushActivity({
            time: "Just now",
            action: "Flag resolved",
            detail: `${f.report} — ${f.user}`,
            type: "moderation",
          });
          toast.success(`Flag ${flagId} resolved`);
          return { ...f, status: "resolved" };
        }),
      );
    },
    [pushActivity],
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
      setActiveDialog(action);
      if (action === "addStudent") goToSection("students");
      if (action === "publishExam") goToSection("exams");
      if (action === "uploadContent") goToSection("content");
      if (action === "createReward") goToSection("rewards");
    },
    [goToSection],
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
    content: filteredContent,
    flags,
    settings,
    setSettings,
    activeDialog,
    setActiveDialog,
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
    publishExam,
    uploadContent,
    createReward,
    updateUserStatus,
    sendMessage,
    toggleExamPublished,
    toggleRewardActive,
    syncContent,
    resolveFlag,
    saveSettings,
    openQuickAction,
  };
}

export type AdminDashboardState = ReturnType<typeof useAdminDashboard>;
