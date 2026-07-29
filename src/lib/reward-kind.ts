import { Banknote, CircleDollarSign, Palette, ShieldCheck, type LucideIcon } from "lucide-react";

// Every reward is exactly one of these four kinds. ETB/USDT are real cash —
// redeeming one routes to the actual (admin-approved) withdrawal flow so the
// XP ledger only ever moves once, correctly. Theme and AdFree are
// self-fulfilling: they apply instantly, client-side, no admin step needed.
export type Kind = "etb" | "usdt" | "theme" | "adfree";

export function kindOf(tag: string): Kind {
  const t = tag.toLowerCase();
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
    label: "Cosmetic",
    desc: "A glowing ring for your avatar — profile, header, everywhere.",
    claimNote:
      "Applied instantly across the site the moment you unlock it — no waiting, no admin step.",
  },
  adfree: {
    icon: ShieldCheck,
    chip: "bg-sky-50 text-sky-600",
    badge: "bg-sky-50 text-sky-700",
    label: "Perk",
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
