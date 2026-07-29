import { useEffect, useRef } from "react";

import { useAuth } from "@/hooks/use-auth";
import { addReadingSeconds, penalizeReadingSeconds } from "@/lib/reading-time-store";
import { addBookReadingSeconds } from "@/lib/library-store";
import { readIntegrityRules, recordIntegrityEvent } from "@/lib/integrity-store";

const TICK_SECONDS = 30;

/**
 * Accumulates verified reading time while a PDF is open and the tab is visible.
 * Pass bookId to additionally track per-book progress and award XP to the reader.
 *
 * Anti-abuse: honours the `idleReading` integrity rule. If the student stops
 * interacting for longer than the configured timeout, reward accrual is paused,
 * some already-earned reading time is clawed back, and a violation is logged so
 * admins can see it — this is what stops "open a PDF and walk away" farming.
 */
export function useReadingTimer(active: boolean, bookId?: string, bookName?: string) {
  const { loggedIn, user } = useAuth();
  const userId = loggedIn && user ? user.id : "";
  const userName = loggedIn && user ? user.name : "";
  const activeRef = useRef(active);
  activeRef.current = active;

  const lastActivity = useRef(Date.now());
  const idleStruck = useRef(false);

  useEffect(() => {
    if (!userId || !active) return;

    // Any real interaction counts as "still reading" and resets the idle clock.
    const markActive = () => {
      lastActivity.current = Date.now();
      idleStruck.current = false;
    };
    lastActivity.current = Date.now();
    idleStruck.current = false;
    const activityEvents: (keyof WindowEventMap)[] = [
      "pointerdown",
      "pointermove",
      "keydown",
      "wheel",
      "touchstart",
      "click",
    ];
    for (const ev of activityEvents) window.addEventListener(ev, markActive, { passive: true });
    window.addEventListener("scroll", markActive, { passive: true, capture: true });

    const tick = () => {
      if (!activeRef.current || document.visibilityState !== "visible") return;

      const rules = readIntegrityRules();
      const idle = rules.idleReading;
      if (idle.enabled) {
        const idleMs = Date.now() - lastActivity.current;
        if (idleMs >= idle.threshold * 60_000) {
          // Student has walked away — do NOT count this time.
          if (!idleStruck.current) {
            idleStruck.current = true;
            const removedSeconds = Math.round(idle.penalty * 60);
            if (removedSeconds > 0) penalizeReadingSeconds(userId, removedSeconds);
            recordIntegrityEvent({
              rule: "idleReading",
              student: userName || "A student",
              detail: `Idle ${idle.threshold}m while "${bookName ?? "a book"}" was open — accrual paused${
                idle.penalty > 0 ? `, ${idle.penalty}m reading time removed` : ""
              }`,
              penalty: idle.penalty,
              severity: "medium",
            });
          }
          return;
        }
      }

      // Global reading-time counter (used for the 10h reading reward)
      addReadingSeconds(userId, TICK_SECONDS);
      // Per-book progress + XP reward
      if (bookId) {
        addBookReadingSeconds(userId, bookId, TICK_SECONDS);
      }
    };

    const interval = window.setInterval(tick, TICK_SECONDS * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible" && activeRef.current) {
        markActive();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      for (const ev of activityEvents) window.removeEventListener(ev, markActive);
      window.removeEventListener("scroll", markActive, { capture: true } as EventListenerOptions);
    };
  }, [userId, userName, active, bookId, bookName]);
}
