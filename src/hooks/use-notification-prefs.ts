import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";

import {
  browserNotificationsSupported,
  defaultNotificationPrefs,
  readNotificationPrefs,
  requestNotificationPermission,
  subscribeNotificationPrefs,
  writeNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/notification-store";

let cachedPrefs: NotificationPrefs = defaultNotificationPrefs;

function refreshPrefsCache() {
  cachedPrefs = readNotificationPrefs();
}

function subscribe(callback: () => void) {
  refreshPrefsCache();
  return subscribeNotificationPrefs(() => {
    refreshPrefsCache();
    callback();
  });
}

function getSnapshot() {
  return cachedPrefs;
}

function getServerSnapshot() {
  return defaultNotificationPrefs;
}

export function useNotificationPrefs() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const togglePref = useCallback(
    (key: keyof NotificationPrefs) => {
      const enabling = !prefs[key];
      writeNotificationPrefs({ ...prefs, [key]: enabling });

      // Ask for browser permission the first time an alert-style pref is switched on
      if (enabling && browserNotificationsSupported() && Notification.permission === "default") {
        void requestNotificationPermission().then((permission) => {
          if (permission === "granted") {
            toast.success("Browser notifications enabled");
          } else if (permission === "denied") {
            toast.info("Browser notifications blocked", {
              description: "You'll still see reminders inside the app.",
            });
          }
        });
      }
    },
    [prefs],
  );

  return { prefs, togglePref };
}
