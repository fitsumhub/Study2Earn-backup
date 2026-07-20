import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useActiveAds } from "@/hooks/use-ads";
import { usePerks } from "@/hooks/use-perks";
import {
  intervalMs,
  recordClick,
  recordImpression,
  type AdPlacement,
  type SponsorAd as SponsorAdType,
} from "@/lib/ad-store";
import { resolveMediaUrl } from "@/lib/media-store";
import { cn } from "@/lib/utils";

type CreativeAd = Pick<
  SponsorAdType,
  | "sponsor"
  | "title"
  | "body"
  | "format"
  | "imageUrl"
  | "videoUrl"
  | "adCode"
  | "ctaLabel"
  | "ctaUrl"
>;

function initials(sponsor: string) {
  return sponsor
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const FRAME = "relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";

function SponsoredChip({ label = "Sponsored" }: { label?: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {label}
    </span>
  );
}

function DismissButton({ onDismiss }: { onDismiss?: () => void }) {
  if (!onDismiss) return null;
  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss ad"
      className="absolute right-2 top-2 z-10 rounded-lg bg-white/70 p-1 text-slate-400 backdrop-blur transition hover:bg-slate-100 hover:text-slate-600"
    >
      <X className="size-3.5" />
    </button>
  );
}

function CtaLink({
  ad,
  preview,
  onCta,
  className,
}: {
  ad: CreativeAd;
  preview?: boolean;
  onCta?: () => void;
  className?: string;
}) {
  if (!ad.ctaLabel) return null;
  return (
    <a
      href={preview ? undefined : ad.ctaUrl}
      target={preview ? undefined : "_blank"}
      rel="noopener noreferrer sponsored"
      onClick={(e) => {
        if (preview) {
          e.preventDefault();
          return;
        }
        onCta?.();
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-navy/90 active:scale-95",
        className,
      )}
    >
      {ad.ctaLabel}
      <ExternalLink className="size-3.5" />
    </a>
  );
}

/* ── Format: Banner ─────────────────────────────────────────────── */
function BannerAd({ ad, onCta, onDismiss, preview, className }: CardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const resolvedImage = resolveMediaUrl(ad.imageUrl);
  const showImage = resolvedImage && !imgFailed;
  return (
    <aside aria-label={`Sponsored message from ${ad.sponsor}`} className={cn(FRAME, className)}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-40">
          {showImage ? (
            <img
              src={resolvedImage}
              alt={ad.sponsor}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-navy to-brand-gold">
              <span className="font-serif text-2xl font-bold text-white/90">
                {initials(ad.sponsor)}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SponsoredChip />
            <span className="truncate text-xs font-semibold text-brand-navy">{ad.sponsor}</span>
          </div>
          <p className="mt-1.5 font-serif text-base font-bold leading-snug text-brand-navy sm:text-lg">
            {ad.title || "Your headline here"}
          </p>
          {ad.body && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{ad.body}</p>}
        </div>
        <CtaLink ad={ad} preview={preview} onCta={onCta} />
      </div>
      <DismissButton onDismiss={onDismiss} />
    </aside>
  );
}

/* ── Format: Image ──────────────────────────────────────────────── */
function ImageAd({ ad, onCta, onDismiss, preview, className }: CardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const resolvedImage = resolveMediaUrl(ad.imageUrl);
  const showImage = resolvedImage && !imgFailed;
  return (
    <aside aria-label={`Sponsored image from ${ad.sponsor}`} className={cn(FRAME, className)}>
      <a
        href={preview ? undefined : ad.ctaUrl}
        target={preview ? undefined : "_blank"}
        rel="noopener noreferrer sponsored"
        onClick={(e) => {
          if (preview) {
            e.preventDefault();
            return;
          }
          onCta?.();
        }}
        className="group block"
      >
        <div className="relative min-h-[9rem] bg-slate-100 sm:min-h-[12rem]">
          {showImage ? (
            <img
              src={resolvedImage}
              alt={ad.title || ad.sponsor}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-navy to-brand-gold">
              <span className="font-serif text-3xl font-bold text-white/90">
                {initials(ad.sponsor)}
              </span>
            </div>
          )}
          {/* label + copy overlay */}
          <div className="absolute left-2 top-2 flex items-center gap-2">
            <SponsoredChip />
            <span className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
              {ad.sponsor}
            </span>
          </div>
          {(ad.title || ad.ctaLabel) && (
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="font-serif text-lg font-bold text-white drop-shadow">{ad.title}</p>
              {ad.ctaLabel && (
                <span className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-brand-navy shadow transition group-hover:bg-brand-gold group-hover:text-white">
                  {ad.ctaLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </a>
      <DismissButton onDismiss={onDismiss} />
    </aside>
  );
}

/* ── Format: Video ──────────────────────────────────────────────── */
function VideoAd({ ad, onCta, onDismiss, preview, className }: CardProps) {
  const resolvedVideo = resolveMediaUrl(ad.videoUrl);
  const resolvedPoster = resolveMediaUrl(ad.imageUrl);
  return (
    <aside aria-label={`Sponsored video from ${ad.sponsor}`} className={cn(FRAME, className)}>
      <div className="relative min-h-[13rem] bg-black sm:min-h-[16rem]">
        {resolvedVideo ? (
          <video
            src={resolvedVideo}
            poster={resolvedPoster}
            className="absolute inset-0 h-full w-full object-contain"
            muted
            autoPlay
            loop
            playsInline
            controls
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-navy to-slate-800">
            <span className="text-sm font-semibold text-white/70">No video source</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex items-center gap-2">
          <SponsoredChip />
          <span className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            {ad.sponsor}
          </span>
        </div>
        <DismissButton onDismiss={onDismiss} />
      </div>
      {(ad.title || ad.ctaLabel) && (
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-serif text-base font-bold text-brand-navy">{ad.title}</p>
            {ad.body && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{ad.body}</p>}
          </div>
          <CtaLink ad={ad} preview={preview} onCta={onCta} className="px-4 py-2.5" />
        </div>
      )}
    </aside>
  );
}

/* ── Format: Google / embed ─────────────────────────────────────── */
function GoogleAdSlot({ adCode }: { adCode?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || !adCode) return;
    // Admin-provided embed (their own ad-network snippet). Inject then
    // re-create <script> nodes so they actually execute.
    host.innerHTML = adCode;
    host.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      for (const attr of Array.from(old.attributes)) s.setAttribute(attr.name, attr.value);
      s.text = old.textContent ?? "";
      old.replaceWith(s);
    });
    try {
      // Nudge AdSense to fill any <ins class="adsbygoogle"> just injected.
      (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle =
        (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || [];
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({});
    } catch {
      /* no-op in dev / without a publisher account */
    }
  }, [adCode]);

  if (!adCode) {
    // Placeholder ad slot (no code configured yet).
    return (
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-6">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#4285F4]" />
          <span className="size-2.5 rounded-full bg-[#EA4335]" />
          <span className="size-2.5 rounded-full bg-[#FBBC05]" />
          <span className="size-2.5 rounded-full bg-[#34A853]" />
        </div>
        <p className="text-xs font-semibold text-slate-500">Google Ads slot</p>
        <p className="text-[10px] text-slate-400">
          Fills programmatically · paste ad code in admin
        </p>
      </div>
    );
  }
  return <div ref={ref} className="w-full overflow-hidden" />;
}

function GoogleAd({ ad, onDismiss, className }: CardProps) {
  return (
    <aside aria-label="Advertisement" className={cn(FRAME, className)}>
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Ad · {ad.sponsor}
        </span>
      </div>
      <div className="p-3">
        <GoogleAdSlot adCode={ad.adCode} />
      </div>
      <DismissButton onDismiss={onDismiss} />
    </aside>
  );
}

type CardProps = {
  ad: CreativeAd;
  onCta?: () => void;
  onDismiss?: () => void;
  preview?: boolean;
  className?: string;
};

/**
 * Presentational sponsor creative, rendered by format. Used on the public site
 * (wrapped by <SponsorAd /> / <SponsorInterstitial /> for tracking) and in the
 * admin dialog as a live preview.
 */
export function SponsorAdCard(props: CardProps) {
  switch (props.ad.format) {
    case "image":
      return <ImageAd {...props} />;
    case "video":
      return <VideoAd {...props} />;
    case "google":
      return <GoogleAd {...props} />;
    default:
      return <BannerAd {...props} />;
  }
}

/**
 * Renders the sponsor ad slot for a placement, or nothing if the admin hasn't
 * set an active ad there. When several ads share the placement, the slot rotates
 * through them on a time interval — each ad shows for its own `rotateEvery`
 * interval before the next takes over. Records an impression each time an ad
 * becomes visible and a click on the CTA, and can be dismissed for the session.
 */
export function SponsorAd({
  placement,
  className,
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const { adFreeActive } = usePerks();
  const ads = useActiveAds(placement);
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);
  const impressedId = useRef<string | null>(null);

  // Keep the index within range as ads are added/removed.
  useEffect(() => {
    if (ads.length > 0) setIndex((i) => i % ads.length);
  }, [ads.length]);

  const current = ads.length > 0 ? ads[index % ads.length] : null;

  // Rotate to the next ad after the current ad's interval (only if >1 ad).
  useEffect(() => {
    if (!current || ads.length <= 1) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % ads.length), intervalMs(current));
    return () => clearTimeout(t);
  }, [current, ads.length]);

  // Count one impression each time a different ad becomes visible — skipped
  // entirely while ad-free is active, since nothing is actually shown.
  useEffect(() => {
    if (!adFreeActive && current && impressedId.current !== current.id) {
      impressedId.current = current.id;
      recordImpression(current.id);
    }
  }, [adFreeActive, current]);

  if (adFreeActive || dismissed || !current) return null;

  return (
    <SponsorAdCard
      ad={current}
      className={className}
      onCta={() => recordClick(current.id)}
      onDismiss={() => setDismissed(true)}
    />
  );
}
