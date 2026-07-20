import { useSyncExternalStore } from "react";

import {
  bumpMistake,
  clearResolvedMistakes,
  readMistakes,
  resolveMistake,
  subscribeMistakes,
  type MistakeEntry,
} from "@/lib/mistake-store";

let cachedMistakes: MistakeEntry[] = [];

function refreshCache() {
  cachedMistakes = readMistakes();
}

function subscribe(callback: () => void) {
  refreshCache();
  return subscribeMistakes(() => {
    refreshCache();
    callback();
  });
}

function getSnapshot() {
  return cachedMistakes;
}

const EMPTY: MistakeEntry[] = [];

function getServerSnapshot() {
  return EMPTY;
}

export function useMistakes() {
  const mistakes = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const unresolved = mistakes.filter((m) => !m.resolved);

  return {
    mistakes,
    unresolved,
    unresolvedCount: unresolved.length,
    resolvedCount: mistakes.length - unresolved.length,
    resolveMistake,
    bumpMistake,
    clearResolvedMistakes,
  };
}
