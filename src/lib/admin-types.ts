export type AdminSection =
  | "overview"
  | "students"
  | "content"
  | "exams"
  | "rewards"
  | "analytics"
  | "moderation"
  | "settings";

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
  type: "user" | "reward" | "exam" | "content" | "moderation";
};

export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  section?: AdminSection;
};

export type AdminExam = {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  duration: number;
  questions: number;
  published: boolean;
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
  chapters: number;
  students: string;
  synced: boolean;
};

export type ModerationFlag = {
  id: string;
  report: string;
  user: string;
  status: "open" | "resolved";
};

export type QuickAction = "addStudent" | "publishExam" | "uploadContent" | "createReward";

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
  exams: {
    title: "Mock Exams",
    description: "Publish and manage exit exam practice tests",
  },
  rewards: {
    title: "Rewards Catalog",
    description: "XP redemption items and partner offers",
  },
  analytics: {
    title: "Analytics",
    description: "Engagement trends and subject performance",
  },
  moderation: {
    title: "Moderation Queue",
    description: "Review reports and platform flags",
  },
  settings: {
    title: "Platform Settings",
    description: "Configure notifications, limits, and defaults",
  },
};
