import { adminActivity as initialActivity, recentUsers as initialUsers } from "@/lib/admin-data";
import type {
  AdminActivity,
  AdminContent,
  AdminExam,
  AdminReferral,
  AdminReward,
  AdminSettings,
  AdminUser,
  ModerationFlag,
} from "@/lib/admin-types";
import { defaultAdminReferrals } from "@/lib/admin-referral-data";
import { buildDefaultAdminExams, mergeExamWithCourseDefaults } from "@/lib/admin-exam-data";
import { rewards as mockRewards, libraryBooks } from "@/lib/mock-data";

const STORAGE_KEY = "study2earn-admin-data";

export type AdminStoreData = {
  users: AdminUser[];
  exams: AdminExam[];
  rewards: AdminReward[];
  referrals: AdminReferral[];
  content: AdminContent[];
  flags: ModerationFlag[];
  settings: AdminSettings;
  activity: AdminActivity[];
};

const defaultFlags: ModerationFlag[] = [
  { id: "FL-101", report: "Duplicate account", user: "STU-7712", status: "open" },
  { id: "FL-102", report: "Inappropriate username", user: "STU-6621", status: "open" },
  { id: "FL-103", report: "Exam answer leak", user: "STU-5590", status: "resolved" },
];

const defaultSettings: AdminSettings = {
  emailAlerts: true,
  autoApprove: false,
  maxDailyExams: "5",
  defaultXpReward: "100",
  referralFriendBonus: "50",
  referralSignupXp: "50",
  referralCompleteXp: "100",
  autoApproveReferrals: false,
  withdrawalsEnabled: true,
  enabledBanks: [
    "cbe",
    "awash",
    "dashen",
    "abyssinia",
    "united",
    "nib",
    "cbo",
    "oromia",
    "lion",
    "wegagen",
    "zemen",
    "bunna",
    "berhan",
    "abay",
    "addis",
  ],
  usdtWithdrawalsEnabled: true,
  referralsEnabled: true,
};

export function buildDefaultAdminData(): AdminStoreData {
  return {
    users: initialUsers,
    exams: buildDefaultAdminExams(),
    rewards: mockRewards.map((r, i) => ({ ...r, id: `RW-${100 + i}`, active: true })),
    referrals: defaultAdminReferrals,
    content: libraryBooks.map((b, i) => ({
      id: b.id,
      name: b.name,
      short: b.short,
      chapters: b.chapters,
      students: b.students,
      synced: i % 3 !== 0,
      published: true,
      category: b.category,
      description: b.description,
      pdfUrl: b.pdfUrl ?? "/pdfs/sample-textbook.pdf",
      pages: b.pages,
      coverUrl: b.coverUrl,
      chapterList: b.chapterList.map((c) => ({ title: c.title, pages: c.pages })),
    })),
    flags: defaultFlags,
    settings: defaultSettings,
    activity: initialActivity.map((a, i) => ({ ...a, id: `act-${i}` })),
  };
}

function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

function mergeById<T extends { id: string }>(stored: T[], defaults: T[]): T[] {
  const storedIds = new Set(stored.map((item) => item.id));
  return [...stored, ...defaults.filter((item) => !storedIds.has(item.id))];
}

function sanitizeAdminData(partial: unknown): AdminStoreData {
  const defaults = buildDefaultAdminData();
  if (!partial || typeof partial !== "object") return defaults;

  const data = partial as Partial<AdminStoreData>;

  return {
    users: isArray<AdminUser>(data.users)
      ? data.users.filter((u) => u?.id && u?.name)
      : defaults.users,
    exams: isArray<AdminExam>(data.exams)
      ? data.exams
          .filter((e) => e?.id && e?.title)
          .map((e) => mergeExamWithCourseDefaults(e as AdminExam))
      : defaults.exams,
    rewards: isArray<AdminReward>(data.rewards)
      ? data.rewards.filter((r) => r?.id && r?.title)
      : defaults.rewards,
    referrals: isArray<AdminReferral>(data.referrals)
      ? data.referrals.filter((r) => r?.id && r?.referrerName)
      : defaults.referrals,
    content: isArray<AdminContent>(data.content)
      ? mergeById(data.content, defaults.content)
          .filter((c) => c?.id && c?.name)
          .map((c) => ({
            ...c,
            short: c.short ?? c.name.split(" ")[0],
            pages: c.pages ?? 180,
            category: c.category ?? "Common",
            description: c.description ?? "",
            pdfUrl: c.pdfUrl ?? "/pdfs/sample-textbook.pdf",
            published: c.published ?? true,
            chapterList: c.chapterList ?? defaults.content.find((d) => d.id === c.id)?.chapterList,
          }))
      : defaults.content,
    flags: isArray<ModerationFlag>(data.flags) ? data.flags.filter((f) => f?.id) : defaults.flags,
    settings:
      data.settings && typeof data.settings === "object"
        ? { ...defaults.settings, ...data.settings }
        : defaults.settings,
    activity: isArray<AdminActivity>(data.activity)
      ? data.activity.filter((a) => a?.id && a?.action)
      : defaults.activity,
  };
}

export function readAdminData(): AdminStoreData {
  if (typeof window === "undefined") return buildDefaultAdminData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDefaultAdminData();
    return sanitizeAdminData({ ...buildDefaultAdminData(), ...JSON.parse(raw) });
  } catch {
    return buildDefaultAdminData();
  }
}

export function writeAdminData(data: Partial<AdminStoreData>) {
  if (typeof window === "undefined") return;
  const current = readAdminData();
  const next = sanitizeAdminData({ ...current, ...data });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("admin-data-change"));
}

export function subscribeAdminData(cb: () => void) {
  window.addEventListener("admin-data-change", cb);
  return () => window.removeEventListener("admin-data-change", cb);
}

export function clearAdminData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("admin-data-change"));
}
