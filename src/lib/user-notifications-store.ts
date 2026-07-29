/**
 * Per-user notification inbox — keyed by user id so it's forward-compatible
 * with a real multi-user backend. In this client-only demo, every account
 * lives in the same browser's localStorage, so a user only ever sees their
 * own notifications when THEY are the signed-in session — but the storage
 * shape (Record<userId, Notification[]>) is exactly what a real backend
 * would key by, so no rework is needed if this moves server-side later.
 */

export type UserNotificationKind = "xp-adjustment" | "message" | "system";

export type UserNotification = {
  id: string;
  kind: UserNotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

type Inbox = Record<string, UserNotification[]>;

const STORAGE_KEY = "study2earn-user-notifications";
export const USER_NOTIFICATIONS_CHANGE_EVENT = "user-notifications-change";
const MAX_PER_USER = 50;

function isNotification(value: unknown): value is UserNotification {
  if (!value || typeof value !== "object") return false;
  const n = value as Partial<UserNotification>;
  return (
    typeof n.id === "string" &&
    typeof n.title === "string" &&
    typeof n.body === "string" &&
    typeof n.createdAt === "string"
  );
}

function readInbox(): Inbox {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const inbox: Inbox = {};
    for (const [userId, list] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(list)) inbox[userId] = list.filter(isNotification);
    }
    return inbox;
  } catch {
    return {};
  }
}

function writeInbox(inbox: Inbox) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inbox));
  window.dispatchEvent(new Event(USER_NOTIFICATIONS_CHANGE_EVENT));
}

export function readUserNotifications(userId: string): UserNotification[] {
  return readInbox()[userId] ?? [];
}

export function addUserNotification(
  userId: string,
  notification: Omit<UserNotification, "id" | "createdAt" | "read">,
) {
  const inbox = readInbox();
  const list = inbox[userId] ?? [];
  const entry: UserNotification = {
    ...notification,
    id: `un-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  inbox[userId] = [entry, ...list].slice(0, MAX_PER_USER);
  writeInbox(inbox);
  return entry;
}

export function markUserNotificationRead(userId: string, id: string) {
  const inbox = readInbox();
  const list = inbox[userId];
  if (!list) return;
  inbox[userId] = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  writeInbox(inbox);
}

export function markAllUserNotificationsRead(userId: string) {
  const inbox = readInbox();
  const list = inbox[userId];
  if (!list) return;
  inbox[userId] = list.map((n) => ({ ...n, read: true }));
  writeInbox(inbox);
}

export function subscribeUserNotifications(cb: () => void) {
  window.addEventListener(USER_NOTIFICATIONS_CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(USER_NOTIFICATIONS_CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
