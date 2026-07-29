import { useCallback, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  addAiStudyHistoryEntry,
  clearAiStudyHistory,
  getAiStudyHistory,
  removeAiStudyHistoryEntry,
  subscribeAiStudyHistory,
  updateAiStudyHistoryScore,
  type AiStudyHistoryEntry,
} from "@/lib/ai-study-store";

const EMPTY: AiStudyHistoryEntry[] = [];

// Cache mirrors use-favorites.ts — useSyncExternalStore needs a stable
// reference when nothing changed, and getAiStudyHistory re-parses
// localStorage on every call.
let cachedUserId = "";
let cachedHistory: AiStudyHistoryEntry[] = EMPTY;

function refreshCache(userId: string) {
  cachedUserId = userId;
  cachedHistory = userId ? getAiStudyHistory(userId) : EMPTY;
}

/** The signed-in student's recent AI Study packs — practice-again + score recall only, never XP. */
export function useAiStudyHistory() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const subscribe = useCallback(
    (callback: () => void) => {
      refreshCache(userId);
      return subscribeAiStudyHistory(() => {
        refreshCache(userId);
        callback();
      });
    },
    [userId],
  );

  const getSnapshot = useCallback(() => {
    if (cachedUserId !== userId) refreshCache(userId);
    return cachedHistory;
  }, [userId]);

  const history = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const addEntry = useCallback(
    (entry: Omit<AiStudyHistoryEntry, "id" | "createdAt">) => addAiStudyHistoryEntry(userId, entry),
    [userId],
  );

  const updateScore = useCallback(
    (id: string, score: { answeredCount: number; correctCount: number; scorePct: number }) =>
      updateAiStudyHistoryScore(userId, id, score),
    [userId],
  );

  const removeEntry = useCallback((id: string) => removeAiStudyHistoryEntry(userId, id), [userId]);

  const clear = useCallback(() => clearAiStudyHistory(userId), [userId]);

  return { history, addEntry, updateScore, removeEntry, clear };
}
