import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_COMING_SOON,
  readComingSoon,
  subscribeComingSoon,
  writeComingSoon,
  type ComingSoonConfig,
  type ComingSoonPageConfig,
  type ComingSoonPageKey,
} from "@/lib/coming-soon-store";

/** Live-synced Coming Soon config for the admin console. */
export function useComingSoon() {
  const [config, setConfig] = useState<ComingSoonConfig>(DEFAULT_COMING_SOON);

  useEffect(() => {
    setConfig(readComingSoon());
    return subscribeComingSoon(() => setConfig(readComingSoon()));
  }, []);

  const updatePage = useCallback((key: ComingSoonPageKey, patch: Partial<ComingSoonPageConfig>) => {
    const current = readComingSoon();
    const next = { ...current, [key]: { ...current[key], ...patch } };
    setConfig(next);
    writeComingSoon(next);
  }, []);

  return { config, updatePage };
}

/** Live-synced Coming Soon state for a single public page. */
export function useIsComingSoon(key: ComingSoonPageKey): ComingSoonPageConfig {
  const [page, setPage] = useState<ComingSoonPageConfig>(DEFAULT_COMING_SOON[key]);

  useEffect(() => {
    setPage(readComingSoon()[key]);
    return subscribeComingSoon(() => setPage(readComingSoon()[key]));
  }, [key]);

  return page;
}
