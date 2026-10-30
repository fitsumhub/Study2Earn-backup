import { Banknote, CircleDollarSign, Layers, Palette, ShieldCheck, type LucideIcon } from "lucide-react";

// Every reward is one of these kinds:
// - ETB / USDT: Real cash / crypto withdrawal to bank or Binance UID
// - Theme: Profile glow cosmetics (instant client-side)
// - Frame: Avatar profile frames (instant client-side)
// - AdFree: Ad-free browsing perk (instant client-side)
export type Kind = "etb" | "usdt" | "theme" | "adfree" | "frame";

export function kindOf(tag: string, title?: string): Kind {
  // If the title contains clear keywords, override the tag to prevent admin
  // configuration errors defaulting everything to bank payouts.
  if (title) {
    const tLower = title.toLowerCase();
    if (tLower.includes("frame")) return "frame";
    if (tLower.includes("theme") || tLower.includes("glow")) return "theme";
    if (tLower.includes("ad-free") || tLower.includes("adfree") || tLower.includes("no ads")) {
      return "adfree";
    }
    if (tLower.includes("usdt") || tLower.includes("binance")) return "usdt";
  }

  const t = tag.toLowerCase();
  if (t === "frame") return "frame";
  if (t === "usdt") return "usdt";
  if (t === "theme") return "theme";
  if (t === "adfree") return "adfree";
  return "etb";
}

export const kindMeta: Record<
  Kind,
  { icon: LucideIcon; chip: string; badge: string; label: string; desc: string; claimNote: string }
> = {
  etb: {
    icon: Banknote,
    chip: "bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
    label: "Cash · ETB",
    desc: "Real Ethiopian Birr sent to your bank account.",
    claimNote:
      "You'll enter your bank details on the Withdraw page. An admin reviews and sends the ETB within 24–48 hours — track its status under History.",
  },
  usdt: {
    icon: CircleDollarSign,
    chip: "bg-teal-50 text-teal-600",
    badge: "bg-teal-50 text-teal-700",
    label: "Crypto · USDT",
    desc: "Real USDT sent to your Binance account.",
    claimNote:
      "You'll enter your Binance UID on the Withdraw page. An admin reviews and sends the USDT within 24–48 hours — track its status under History.",
  },
  theme: {
    icon: Palette,
    chip: "bg-violet-50 text-violet-600",
    badge: "bg-violet-50 text-violet-700",
    label: "Avatar Glow",
    desc: "A glowing ring for your avatar — profile, header, leaderboard, everywhere.",
    claimNote:
      "Applied instantly across the site the moment you unlock it — no waiting, no admin step.",
  },
  frame: {
    icon: Layers,
    chip: "bg-amber-50 text-amber-600",
    badge: "bg-amber-50 text-amber-700",
    label: "Profile Frame",
    desc: "An exclusive animated profile frame to showcase on your avatar.",
    claimNote:
      "Unlocked permanently — equipped immediately and managed anytime from the Frames Studio.",
  },
  adfree: {
    icon: ShieldCheck,
    chip: "bg-sky-50 text-sky-600",
    badge: "bg-sky-50 text-sky-700",
    label: "Ad-Free Perk",
    desc: "Sponsor banners stop showing on Home, Dashboard, and Library.",
    claimNote:
      "Applied instantly the moment you redeem it. Redeeming again while active stacks more days on top instead of resetting the clock.",
  },
};

/** Best-effort duration from a catalog title (e.g. "1-Month", "3 Month", "1-Year") — defaults to 30 days. */
export function adFreeDaysFromTitle(title: string): number {
  const months = title.match(/(\d+)\s*-?\s*month/i);
  if (months) return parseInt(months[1], 10) * 30;
  const years = title.match(/(\d+)\s*-?\s*year/i);
  if (years) return parseInt(years[1], 10) * 365;
  return 30;
}
