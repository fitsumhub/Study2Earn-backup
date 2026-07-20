export type AdminSection =
  | "overview"
  | "students"
  | "content"
  | "categories"
  | "siteContent"
  | "exams"
  | "rewards"
  | "ads"
  | "withdrawals"
  | "referrals"
  | "analytics"
  | "moderation"
  | "settings"
  | "tests";

export type UserStatus = "active" | "pending" | "suspended";

export type AdminUser = {
  id: string;
  name: string;
  university: string;
  program: string;
  status: UserStatus;
  joined: string;
  xp: number;
};

export type AdminActivity = {
  id: string;
  time: string;
  action: string;
  detail: string;
  type: "user" | "reward" | "exam" | "content" | "moderation" | "referral";
};

export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  section?: AdminSection;
};

export type AdminExamQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type AdminExam = {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  duration: number;
  questions: number;
  published: boolean;
  courseId: string;
  chapterId: string;
  chapterTitle: string;
  description: string;
  passScore: number;
  xpReward: number;
  questionBank: AdminExamQuestion[];
  attempts: number;
};

export type AdminReward = {
  id: string;
  title: string;
  xp: number;
  tag: string;
  active: boolean;
};

export type AdminContent = {
  id: string;
  name: string;
  short: string;
  chapters: number;
  students: string;
  synced: boolean;
  published: boolean;
  category: string;
  description: string;
  pdfUrl: string;
  pages: number;
  /** Optional cover image (URL or local: pointer). */
  coverUrl?: string;
};

export type ModerationFlag = {
  id: string;
  report: string;
  user: string;
  status: "open" | "resolved";
};

export type QuickAction = "addStudent" | "publishExam" | "uploadContent" | "createReward";

export type AdminSettings = {
  emailAlerts: boolean;
  autoApprove: boolean;
  maxDailyExams: string;
  defaultXpReward: string;
  referralFriendBonus: string;
  referralSignupXp: string;
  referralCompleteXp: string;
  autoApproveReferrals: boolean;
  withdrawalsEnabled: boolean;
  enabledBanks: string[];
  usdtWithdrawalsEnabled: boolean;
  referralsEnabled: boolean;
};

export type AdminReferral = {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerCode: string;
  referredName: string;
  referredUniversity: string;
  status: "pending" | "signed_up" | "completed";
  xpAwarded: number;
  date: string;
  notes?: string;
};

export type EditEntity =
  | { type: "student"; item: AdminUser }
  | { type: "exam"; item: AdminExam }
  | { type: "content"; item: AdminContent }
  | { type: "reward"; item: AdminReward };

export const sectionMeta: Record<AdminSection, { title: string; description: string }> = {
  overview: {
    title: "Platform Overview",
    description: "Real-time insights across Ethiopian universities — June 14, 2026",
  },
  students: {
    title: "Student Management",
    description: "Search, approve, and manage registered students",
  },
  content: {
    title: "Content Library",
    description: "MoE curriculum books and chapter sync status",
  },
  categories: {
    title: "Book Categories",
    description: "Manage the tracks and genres students filter the library by",
  },
  siteContent: {
    title: "Site Content",
    description: "Edit the public homepage — hero, trust strip, announcement, and FAQ",
  },
  exams: {
    title: "Mock Exam Management",
    description: "Create chapter exams, edit question banks, and publish to students",
  },
  rewards: {
    title: "Rewards Catalog",
    description: "XP redemption items and partner offers",
  },
  ads: {
    title: "Sponsor Ads",
    description: "Create and manage sponsor banner ads shown across the platform",
  },
  withdrawals: {
    title: "Withdrawal Management",
    description: "Review, approve, and process student bank cash-out requests",
  },
  referrals: {
    title: "Referral Management",
    description: "Track invites, approve bonuses, and manage ambassador codes",
  },
  analytics: {
    title: "Analytics",
    description: "Engagement trends and subject performance",
  },
  moderation: {
    title: "Moderation & Integrity",
    description: "Anti-abuse rules, integrity flags, and the report queue",
  },
  settings: {
    title: "Platform Settings",
    description: "Configure notifications, limits, and defaults",
  },
  tests: {
    title: "System Tests",
    description: "Run end-to-end test suites and inspect platform health in real-time",
  },
};
