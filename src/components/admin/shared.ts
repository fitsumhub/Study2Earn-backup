import { BookOpen, ClipboardList, Gift, Share2, TrendingUp, UserPlus } from "lucide-react";

import type { UserStatus } from "@/lib/admin-types";
import type { WithdrawalRequest } from "@/lib/withdrawal-data";

export const engagementChartConfig = {
  active: { label: "Active users", color: "oklch(0.36 0.13 264)" },
  exams: { label: "Exams taken", color: "oklch(0.69 0.16 55)" },
};

export const subjectChartConfig = {
  count: { label: "Completions", color: "oklch(0.36 0.13 264)" },
};

export const readingChartConfig = {
  hours: { label: "Reading hours", color: "oklch(0.69 0.16 55)" },
};

export const xpChartConfig = {
  issued: { label: "XP issued", color: "oklch(0.36 0.13 264)" },
  redeemed: { label: "XP redeemed", color: "oklch(0.69 0.16 55)" },
};

export const statusStyles: Record<UserStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  suspended: "bg-red-50 text-red-700",
};

export const activityIcons = {
  user: UserPlus,
  reward: Gift,
  exam: ClipboardList,
  content: BookOpen,
  moderation: TrendingUp,
  referral: Share2,
};

export const quickActions = [
  { key: "addStudent" as const, label: "Add student", icon: UserPlus },
  { key: "publishExam" as const, label: "Publish exam", icon: ClipboardList },
  { key: "uploadContent" as const, label: "Upload content", icon: BookOpen },
  { key: "createReward" as const, label: "Create reward", icon: Gift },
];

export const withdrawalStatusStyles: Record<WithdrawalRequest["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-blue-50 text-blue-700",
  rejected: "bg-red-50 text-red-700",
  paid: "bg-emerald-50 text-emerald-700",
};
