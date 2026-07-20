/**
 * Sponsor ad store — localStorage-backed list of sponsor ads that the public
 * site renders and admins manage from the "Sponsors" admin section.
 *
 * Ads come in several formats:
 *   - banner : logo/image tile + headline + button (compact display ad)
 *   - image  : a full image creative that links out
 *   - video  : an autoplaying muted video creative + button
 *   - google : pasted ad-network / Google AdSense embed code (or a placeholder)
 *
 * When several ads share a placement, the slot rotates through them on a time
 * interval — each ad is shown for `rotateEvery` `rotateUnit` (seconds, minutes,
 * or hours) before the next one takes over.
 *
 * Impressions and clicks are tracked locally so the admin can see rough
 * performance. NOTE: this is a client-side demo store — counts live in the
 * browser and are trivially editable — treat them as illustrative, not billing.
 */

export type AdPlacement = "home" | "library" | "dashboard";
export type AdFormat = "banner" | "image" | "video" | "google";
export type RotateUnit = "seconds" | "minutes" | "hours";

export type SponsorAd = {
  id: string;
  sponsor: string;
  title: string;
  body: string;
  format: AdFormat;
  imageUrl?: string; // banner tile / image creative / video poster
  videoUrl?: string; // video format source
  adCode?: string; // google/embed format: raw HTML/script snippet
  ctaLabel: string;
  ctaUrl: string;
  placement: AdPlacement;
  active: boolean;
  rotateEvery: number; // how long this ad shows before the slot rotates
  rotateUnit: RotateUnit; // unit for rotateEvery
  impressions: number;
  clicks: number;
};

export const AD_PLACEMENTS: { value: AdPlacement; label: string; hint: string }[] = [
  { value: "home", label: "Home page", hint: "Landing page, below the stats strip" },
  { value: "library", label: "Library", hint: "Above the courseware grid" },
  { value: "dashboard", label: "Dashboard", hint: "Student dashboard, below quick actions" },
];

export const AD_FORMATS: { value: AdFormat; label: string; hint: string }[] = [
  { value: "banner", label: "Banner", hint: "Logo/image tile with headline and button" },
  { value: "image", label: "Image", hint: "A full image creative that links out" },
  { value: "video", label: "Video", hint: "Autoplaying muted video with a button" },
  { value: "google", label: "Google / embed", hint: "Paste AdSense or ad-network code" },
];

export const ROTATE_UNITS: { value: RotateUnit; label: string; short: string; ms: number }[] = [
  { value: "seconds", label: "seconds", short: "s", ms: 1000 },
  { value: "minutes", label: "minutes", short: "m", ms: 60_000 },
  { value: "hours", label: "hours", short: "h", ms: 3_600_000 },
];

export function placementLabel(placement: AdPlacement): string {
  return AD_PLACEMENTS.find((p) => p.value === placement)?.label ?? placement;
}

export function formatLabel(format: AdFormat): string {
  return AD_FORMATS.find((f) => f.value === format)?.label ?? format;
}

/** How long an ad stays before the slot rotates, in milliseconds. */
export function intervalMs(ad: Pick<SponsorAd, "rotateEvery" | "rotateUnit">): number {
  const unit = ROTATE_UNITS.find((u) => u.value === ad.rotateUnit) ?? ROTATE_UNITS[0];
  return Math.max(Math.round(ad.rotateEvery) || 1, 1) * unit.ms;
}

/** Compact interval label, e.g. "30s", "5m", "2h". */
export function rotateLabel(ad: Pick<SponsorAd, "rotateEvery" | "rotateUnit">): string {
  const unit = ROTATE_UNITS.find((u) => u.value === ad.rotateUnit) ?? ROTATE_UNITS[0];
  return `${ad.rotateEvery}${unit.short}`;
}

export const DEFAULT_ADS: SponsorAd[] = [
  {
    id: "ad-cbe-savings",
    sponsor: "Commercial Bank of Ethiopia",
    title: "Open a free student savings account",
    body: "No minimum balance for students. Withdraw your Study2Earn rewards straight to CBE.",
    format: "banner",
    ctaLabel: "Learn more",
    ctaUrl: "https://www.combanketh.et/",
    placement: "library",
    active: true,
    rotateEvery: 12,
    rotateUnit: "seconds",
    impressions: 0,
    clicks: 0,
  },
  {
    id: "ad-safaricom-image",
    sponsor: "Safaricom Ethiopia",
    title: "M-PESA is here",
    body: "Send money, buy airtime, and pay fees from your phone.",
    format: "image",
    imageUrl: "https://picsum.photos/seed/s2e-safaricom/1000/320",
    ctaLabel: "Discover M-PESA",
    ctaUrl: "https://www.safaricom.et/",
    placement: "library",
    active: true,
    rotateEvery: 12,
    rotateUnit: "seconds",
    impressions: 0,
    clicks: 0,
  },
  {
    id: "ad-ethiotel-bundle",
    sponsor: "Ethio Telecom",
    title: "Study data bundle — 2GB for 25 ETB",
    body: "Zero-rated access to Study2Earn textbooks and mock exams. Made for students.",
    format: "banner",
    ctaLabel: "Get the bundle",
    ctaUrl: "https://www.ethiotelecom.et/",
    placement: "home",
    active: true,
    rotateEvery: 10,
    rotateUnit: "seconds",
    impressions: 0,
    clicks: 0,
  },
  {
    id: "ad-moti-video",
    sponsor: "Moti Engineering",
    title: "Build Ethiopia's future in tech",
    body: "Internships and graduate roles for top-performing science students.",
    format: "video",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    imageUrl: "https://picsum.photos/seed/s2e-moti/1000/560",
    ctaLabel: "See open roles",
    ctaUrl: "https://example.com/",
    placement: "home",
    active: true,
    rotateEvery: 20,
    rotateUnit: "seconds",
    impressions: 0,
    clicks: 0,
  },
  {
    id: "ad-google-slot",
    sponsor: "Google Ads",
    title: "Google ad slot",
    body: "Programmatic ad slot — fills from your ad network.",
    format: "google",
    adCode: "",
    ctaLabel: "",
    ctaUrl: "#",
    placement: "dashboard",
    active: true,
    rotateEvery: 30,
    rotateUnit: "seconds",
    impressions: 0,
    clicks: 0,
  },
  {
    id: "ad-ride-campus",
    sponsor: "RIDE",
    title: "Get to campus for less",
    body: "20% off your first 3 rides with code STUDY20. Safe, tracked trips across Addis.",
    format: "banner",
    ctaLabel: "Ride now",
    ctaUrl: "https://www.ride.com.et/",
    placement: "dashboard",
    active: true,
    rotateEvery: 30,
    rotateUnit: "seconds",
    impressions: 0,
    clicks: 0,
  },
  {
    id: "ad-dashen-amole",
    sponsor: "Dashen Bank",
    title: "Amole wallet — pay campus fees in seconds",
    body: "Link your Amole wallet and cash out your Study2Earn rewards instantly.",
    format: "banner",
    imageUrl: "https://picsum.photos/seed/s2e-dashen/400/300",
    ctaLabel: "Open Amole",
    ctaUrl: "https://dashenbanksc.com/",
    placement: "home",
    active: true,
    rotateEvery: 15,
    rotateUnit: "seconds",
    impressions: 0,
    clicks: 0,
  },
];

const STORAGE_KEY = "study2earn-ads";
export const AD_CHANGE_EVENT = "ad-change";

const PLACEMENTS: AdPlacement[] = ["home", "library", "dashboard"];
const FORMATS: AdFormat[] = ["banner", "image", "video", "google"];
const UNITS: RotateUnit[] = ["seconds", "minutes", "hours"];

function isAd(value: unknown): value is SponsorAd {
  if (!value || typeof value !== "object") return false;
  const a = value as Partial<SponsorAd>;
  return (
    typeof a.id === "string" &&
    typeof a.sponsor === "string" &&
    typeof a.title === "string" &&
    typeof a.placement === "string"
  );
}

function normalize(a: SponsorAd): SponsorAd {
  const every = Number(a.rotateEvery);
  return {
    ...a,
    format: FORMATS.includes(a.format) ? a.format : "banner",
    placement: PLACEMENTS.includes(a.placement) ? a.placement : "home",
    ctaLabel: a.ctaLabel ?? "",
    ctaUrl: a.ctaUrl || "#",
    active: a.active !== false,
    rotateEvery: Number.isFinite(every) && every > 0 ? Math.round(every) : 30,
    rotateUnit: UNITS.includes(a.rotateUnit) ? a.rotateUnit : "seconds",
    impressions: Number.isFinite(a.impressions) ? a.impressions : 0,
    clicks: Number.isFinite(a.clicks) ? a.clicks : 0,
  };
}

export function readAds(): SponsorAd[] {
  if (typeof window === "undefined") return DEFAULT_ADS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ADS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ADS;
    return parsed.filter(isAd).map(normalize);
  } catch {
    return DEFAULT_ADS;
  }
}

export function writeAds(ads: SponsorAd[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
  window.dispatchEvent(new Event(AD_CHANGE_EVENT));
}

export function subscribeAds(cb: () => void) {
  window.addEventListener(AD_CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(AD_CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function resetAds() {
  writeAds(DEFAULT_ADS);
}

/** Active ads for a placement, in order (the slot rotates through them). */
export function activeAdsFor(placement: AdPlacement, ads: SponsorAd[] = readAds()): SponsorAd[] {
  return ads.filter((a) => a.active && a.placement === placement);
}

/** Bump a counter on an ad in-place and persist. Used for impressions/clicks. */
function bump(id: string, field: "impressions" | "clicks") {
  const ads = readAds();
  const next = ads.map((a) => (a.id === id ? { ...a, [field]: a[field] + 1 } : a));
  writeAds(next);
}

export function recordImpression(id: string) {
  bump(id, "impressions");
}

export function recordClick(id: string) {
  bump(id, "clicks");
}

export function slugifyAd(sponsor: string): string {
  const base = sponsor
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `ad-${base || Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 5)}`;
}
