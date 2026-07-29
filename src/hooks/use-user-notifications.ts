import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  markAllUserNotificationsRead,
  markUserNotificationRead,
  readUserNotifications,
  subscribeUserNotifications,
  type UserNotification,
} from "@/lib/user-notifications-store";

/** Live-synced notification inbox for the currently signed-in user. */
export function useUserNotifications() {
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    setNotifications(readUserNotifications(userId));
    return subscribeUserNotifications(() => setNotifications(readUserNotifications(userId)));
  }, [userId]);

  const markRead = useCallback(
    (id: string) => {
      if (!userId) return;
      markUserNotificationRead(userId, id);
    },
    [userId],
  );

  const markAllRead = useCallback(() => {
    if (!userId) return;
    markAllUserNotificationsRead(userId);
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead };
}
