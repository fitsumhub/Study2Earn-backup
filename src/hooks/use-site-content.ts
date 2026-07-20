import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_SITE_CONTENT,
  readSiteContent,
  subscribeSiteContent,
  writeSiteContent,
  type FaqEntry,
  type SiteContent,
} from "@/lib/site-content-store";

let cached: SiteContent = DEFAULT_SITE_CONTENT;

function refresh() {
  cached = readSiteContent();
}

function subscribe(callback: () => void) {
  refresh();
  return subscribeSiteContent(() => {
    refresh();
    callback();
  });
}

function getSnapshot() {
  return cached;
}

function getServerSnapshot() {
  return DEFAULT_SITE_CONTENT;
}

function nextFaqId(faqs: FaqEntry[]) {
  const nums = faqs
    .map((f) => parseInt(f.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  return `faq-${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

/**
 * Public-facing site copy (hero, trust strip, announcement banner, FAQ) that
 * admins can edit without touching code. Read-only callers (the homepage,
 * the header banner) just use `content`; the admin section also uses the
 * mutators below.
 */
export function useSiteContent() {
  const content = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateHero = useCallback((patch: Partial<SiteContent["hero"]>) => {
    const current = readSiteContent();
    writeSiteContent({ ...current, hero: { ...current.hero, ...patch } });
  }, []);

  const updateTrustStripItem = useCallback((index: 0 | 1 | 2, value: string) => {
    const current = readSiteContent();
    const next = [...current.trustStrip] as [string, string, string];
    next[index] = value;
    writeSiteContent({ ...current, trustStrip: next });
  }, []);

  const updateAnnouncement = useCallback((patch: Partial<SiteContent["announcement"]>) => {
    const current = readSiteContent();
    writeSiteContent({ ...current, announcement: { ...current.announcement, ...patch } });
  }, []);

  const addFaq = useCallback(() => {
    const current = readSiteContent();
    const entry: FaqEntry = { id: nextFaqId(current.faqs), q: "New question", a: "New answer" };
    writeSiteContent({ ...current, faqs: [...current.faqs, entry] });
  }, []);

  const updateFaq = useCallback((id: string, patch: Partial<Omit<FaqEntry, "id">>) => {
    const current = readSiteContent();
    writeSiteContent({
      ...current,
      faqs: current.faqs.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  }, []);

  const deleteFaq = useCallback((id: string) => {
    const current = readSiteContent();
    writeSiteContent({ ...current, faqs: current.faqs.filter((f) => f.id !== id) });
  }, []);

  const moveFaq = useCallback((id: string, direction: "up" | "down") => {
    const current = readSiteContent();
    const index = current.faqs.findIndex((f) => f.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || swapWith < 0 || swapWith >= current.faqs.length) return;
    const next = [...current.faqs];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    writeSiteContent({ ...current, faqs: next });
  }, []);

  const resetToDefaults = useCallback(() => {
    writeSiteContent(DEFAULT_SITE_CONTENT);
  }, []);

  return {
    content,
    updateHero,
    updateTrustStripItem,
    updateAnnouncement,
    addFaq,
    updateFaq,
    deleteFaq,
    moveFaq,
    resetToDefaults,
  };
}
