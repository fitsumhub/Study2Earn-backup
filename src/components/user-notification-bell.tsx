import { formatDistanceToNow } from "date-fns";
import { Bell, Coins, MessageSquare, Sparkles } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUserNotifications } from "@/hooks/use-user-notifications";
import type { UserNotificationKind } from "@/lib/user-notifications-store";
import { cn } from "@/lib/utils";
import { useState } from "react";

const kindIcon: Record<UserNotificationKind, typeof Bell> = {
  "xp-adjustment": Coins,
  message: MessageSquare,
  system: Sparkles,
};

export function UserNotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useUserNotifications();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open notifications"
        className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-gold text-[9px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>Updates from Study2Earn, including admin XP changes</SheetDescription>
          </SheetHeader>
          {notifications.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                Mark all read
              </Button>
            </div>
          )}
          <div
            className="mt-2 space-y-2 overflow-y-auto pr-1"
            style={{ maxHeight: "calc(100vh - 12rem)" }}
          >
            {notifications.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No notifications yet.</p>
            ) : (
              notifications.map((n) => {
                const Icon = kindIcon[n.kind] ?? Bell;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all hover:shadow-sm",
                      !n.read
                        ? "border-brand-gold/40 bg-brand-gold/5 hover:bg-brand-gold/8"
                        : "border-slate-100 bg-white hover:bg-slate-50/60",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                          !n.read
                            ? "bg-brand-gold/20 text-brand-gold"
                            : "bg-slate-100 text-slate-400",
                        )}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-brand-navy leading-tight">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-gold" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{n.body}</p>
                        <p className="mt-1.5 text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
