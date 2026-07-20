import { useCallback, useEffect, useState } from "react";

import {
  activeAdsFor,
  DEFAULT_ADS,
  readAds,
  slugifyAd,
  subscribeAds,
  writeAds,
  type AdFormat,
  type AdPlacement,
  type RotateUnit,
  type SponsorAd,
} from "@/lib/ad-store";
import { cloneLocalFile, deleteLocalFile, isLocalFileUrl } from "@/lib/media-store";

export type AdInput = {
  sponsor: string;
  title: string;
  body: string;
  format: AdFormat;
  imageUrl?: string;
  videoUrl?: string;
  adCode?: string;
  ctaLabel: string;
  ctaUrl: string;
  placement: AdPlacement;
  active: boolean;
  rotateEvery: number;
  rotateUnit: RotateUnit;
};

function sanitize(input: AdInput) {
  return {
    sponsor: input.sponsor.trim(),
    title: input.title.trim(),
    body: input.body.trim(),
    format: input.format,
    imageUrl: input.imageUrl?.trim() || undefined,
    videoUrl: input.videoUrl?.trim() || undefined,
    adCode: input.adCode?.trim() || undefined,
    ctaLabel: input.ctaLabel.trim(),
    ctaUrl: input.ctaUrl.trim() || "#",
    placement: input.placement,
    active: input.active,
    rotateEvery: Math.max(Math.round(input.rotateEvery) || 30, 1),
    rotateUnit: input.rotateUnit,
  };
}

/**
 * Live-synced access to the sponsor ad list for the admin console. Changes
 * persist to localStorage and broadcast to every subscriber (admin + the
 * public banners rendered by <SponsorAd /> / <SponsorInterstitial />).
 */
export function useAds() {
  const [ads, setAds] = useState<SponsorAd[]>(DEFAULT_ADS);

  useEffect(() => {
    setAds(readAds());
    return subscribeAds(() => setAds(readAds()));
  }, []);

  const persist = useCallback((next: SponsorAd[]) => {
    setAds(next);
    writeAds(next);
  }, []);

  const validate = (input: AdInput) => {
    if (!input.sponsor.trim()) return "Sponsor name is required";
    if (input.format !== "google" && !input.title.trim()) return "Headline is required";
    return null;
  };

  const addAd = useCallback(
    (input: AdInput) => {
      const error = validate(input);
      if (error) return { ok: false as const, error };
      const clean = sanitize(input);
      const ad: SponsorAd = {
        id: slugifyAd(clean.sponsor),
        ...clean,
        impressions: 0,
        clicks: 0,
      };
      persist([...readAds(), ad]);
      return { ok: true as const, ad };
    },
    [persist],
  );

  const updateAd = useCallback(
    (id: string, input: AdInput) => {
      const error = validate(input);
      if (error) return { ok: false as const, error };
      const clean = sanitize(input);
      const current = readAds().find((a) => a.id === id);
      // Clean up any browser-stored upload that's being replaced or cleared.
      if (current && isLocalFileUrl(current.imageUrl) && current.imageUrl !== clean.imageUrl) {
        deleteLocalFile(current.imageUrl);
      }
      persist(readAds().map((a) => (a.id === id ? { ...a, ...clean } : a)));
      return { ok: true as const };
    },
    [persist],
  );

  const deleteAd = useCallback(
    (id: string) => {
      const ad = readAds().find((a) => a.id === id);
      if (ad && isLocalFileUrl(ad.imageUrl)) deleteLocalFile(ad.imageUrl);
      persist(readAds().filter((a) => a.id !== id));
    },
    [persist],
  );

  const duplicateAd = useCallback(
    (id: string) => {
      const ad = readAds().find((a) => a.id === id);
      if (!ad) return { ok: false as const, error: "Ad not found" };
      // Clone the underlying file (if any) so deleting one copy doesn't blank
      // out the other's image.
      const cloned = cloneLocalFile(ad.imageUrl);
      const copy: SponsorAd = {
        ...ad,
        id: slugifyAd(`${ad.sponsor}-copy`),
        imageUrl: cloned?.ok ? cloned.pointer : ad.imageUrl,
        active: false,
        impressions: 0,
        clicks: 0,
      };
      persist([copy, ...readAds()]);
      return { ok: true as const, ad: copy };
    },
    [persist],
  );

  const toggleActive = useCallback(
    (id: string) => {
      persist(readAds().map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
    },
    [persist],
  );

  const resetToDefaults = useCallback(() => {
    persist(DEFAULT_ADS);
  }, [persist]);

  return { ads, addAd, updateAd, deleteAd, duplicateAd, toggleActive, resetToDefaults };
}

/** Live-synced active ads for a single placement (the slot rotates through them). */
export function useActiveAds(placement: AdPlacement) {
  const [ads, setAds] = useState<SponsorAd[]>([]);

  useEffect(() => {
    setAds(activeAdsFor(placement));
    return subscribeAds(() => setAds(activeAdsFor(placement)));
  }, [placement]);

  return ads;
}
