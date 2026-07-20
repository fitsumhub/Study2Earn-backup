export type NotificationPrefs = {
  dailyReminder: boolean;
  streakWarning: boolean;
  newExam: boolean;
  leaderboard: boolean;
  rewards: boolean;
};

export const defaultNotificationPrefs: NotificationPrefs = {
  dailyReminder: true,
  streakWarning: true,
  newExam: false,
  leaderboard: false,
  rewards: true,
};

const PREFS_KEY = "study2earn-notif-prefs";
const WITHDRAWAL_SEEN_KEY = "study2earn-withdrawal-seen";
const STREAK_WARNED_KEY = "study2earn-streak-warned";

export function readNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return defaultNotificationPrefs;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultNotificationPrefs;
    return { ...defaultNotificationPrefs, ...(JSON.parse(raw) as Partial<NotificationPrefs>) };
  } catch {
    return defaultNotificationPrefs;
  }
}

export function writeNotificationPrefs(prefs: NotificationPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event("notif-prefs-change"));
}

export function subscribeNotificationPrefs(cb: () => void) {
  window.addEventListener("notif-prefs-change", cb);
  return () => window.removeEventListener("notif-prefs-change", cb);
}

/* ── Browser (system) notifications ── */

export function browserNotificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!browserNotificationsSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function sendBrowserNotification(title: string, body: string) {
  if (!browserNotificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.svg" });
  } catch {
    // Some browsers (mobile) require a service worker — fail silently
  }
}

/* ── Watcher bookkeeping ── */

/** Last-seen status per withdrawal id, so we only alert on real transitions. */
export function readSeenWithdrawalStatuses(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WITHDRAWAL_SEEN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function writeSeenWithdrawalStatuses(seen: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WITHDRAWAL_SEEN_KEY, JSON.stringify(seen));
}

/** Streak warning fires at most once per calendar day. */
export function wasStreakWarnedToday(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STREAK_WARNED_KEY) === new Date().toISOString().slice(0, 10);
}

export function markStreakWarnedToday() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_WARNED_KEY, new Date().toISOString().slice(0, 10));
}
