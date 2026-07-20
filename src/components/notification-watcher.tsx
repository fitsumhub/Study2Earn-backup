import { useEffect } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { useExamProgress } from "@/hooks/use-exam-progress";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";
import { useWithdrawals } from "@/hooks/use-withdrawals";
import {
  markStreakWarnedToday,
  readSeenWithdrawalStatuses,
  sendBrowserNotification,
  wasStreakWarnedToday,
  writeSeenWithdrawalStatuses,
} from "@/lib/notification-store";
import type { WithdrawalStatus } from "@/lib/withdrawal-data";

const STATUS_MESSAGES: Partial<
  Record<WithdrawalStatus, { title: string; tone: "success" | "error" }>
> = {
  approved: { title: "Withdrawal approved", tone: "success" },
  paid: { title: "Withdrawal paid", tone: "success" },
  rejected: { title: "Withdrawal rejected", tone: "error" },
};

/**
 * Invisible component mounted at the root. Watches for withdrawal status
 * changes and expiring streaks, surfacing them as toasts and (when permitted)
 * browser notifications, according to the user's notification preferences.
 */
export function NotificationWatcher() {
  const { loggedIn, user } = useAuth();
  const { myRequests } = useWithdrawals();
  const { getRecentAttempts } = useExamProgress();
  const { prefs } = useNotificationPrefs();

  // Withdrawal status transitions → "Withdrawal & reward updates" pref
  useEffect(() => {
    if (!loggedIn || !user) return;
    const seen = readSeenWithdrawalStatuses();
    const next: Record<string, string> = { ...seen };
    let changed = false;

    for (const req of myRequests) {
      const previous = seen[req.id];
      next[req.id] = req.status;
      if (previous === req.status) continue;
      changed = true;
      // Only alert on transitions we've tracked before — first sight just seeds the map
      if (previous === undefined) continue;
      const message = STATUS_MESSAGES[req.status];
      if (!message || !prefs.rewards) continue;

      const body =
        req.status === "rejected"
          ? `${req.amountEtb} ETB to ${req.bankName} was rejected${req.adminNote ? ` — ${req.adminNote}` : ""}. Your XP has been released.`
          : req.status === "paid"
            ? `${req.amountEtb} ETB has been sent to your ${req.bankName} account.`
            : `${req.amountEtb} ETB to ${req.bankName} was approved and is being processed.`;

      if (message.tone === "success") toast.success(message.title, { description: body });
      else toast.error(message.title, { description: body });
      sendBrowserNotification(`Study2Earn — ${message.title}`, body);
    }

    if (changed) writeSeenWithdrawalStatuses(next);
  }, [loggedIn, user, myRequests, prefs.rewards]);

  // Streak about to break → "Streak warning" pref, at most once per day
  useEffect(() => {
    if (!loggedIn || !prefs.streakWarning || wasStreakWarnedToday()) return;
    const attempts = getRecentAttempts(50);
    const days = new Set(attempts.map((a) => a.date.slice(0, 10)));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const studiedToday = days.has(today.toISOString().slice(0, 10));
    const studiedYesterday = days.has(yesterday.toISOString().slice(0, 10));

    if (studiedYesterday && !studiedToday) {
      markStreakWarnedToday();
      const body =
        "You studied yesterday — take one quick mock exam today to keep your streak alive.";
      toast.warning("Your streak ends today", { description: body });
      sendBrowserNotification("Study2Earn — Your streak ends today", body);
    }
  }, [loggedIn, prefs.streakWarning, getRecentAttempts]);

  return null;
}
