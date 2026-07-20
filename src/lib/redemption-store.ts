export type RedemptionRecord = {
  id: string;
  userId: string;
  title: string;
  xp: number;
  tag: string;
  redeemedAt: string;
  voucherCode: string;
  claimUrl: string;
};

const STORAGE_KEY = "study2earn-redemptions";

const serverDefault: RedemptionRecord[] = [];

function generateVoucherCode() {
  const segment = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `S2E-${segment}`;
}

function buildClaimUrl(id: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/rewards/claim/${id}`;
  }
  return `/rewards/claim/${id}`;
}

function normalizeRecord(
  raw: Partial<RedemptionRecord> &
    Pick<RedemptionRecord, "id" | "title" | "xp" | "tag" | "redeemedAt">,
): RedemptionRecord {
  return {
    id: raw.id,
    // Records saved before per-user scoping was added have no owner — they no
    // longer match any signed-in user, which is correct: we can't retroactively
    // know who redeemed them.
    userId: raw.userId ?? "",
    title: raw.title,
    xp: raw.xp,
    tag: raw.tag,
    redeemedAt: raw.redeemedAt,
    voucherCode: raw.voucherCode ?? generateVoucherCode(),
    claimUrl: raw.claimUrl ?? buildClaimUrl(raw.id),
  };
}

export function readRedemptions(): RedemptionRecord[] {
  if (typeof window === "undefined") return serverDefault;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<RedemptionRecord>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r?.id && r?.title)
      .map((r) =>
        normalizeRecord({
          id: r.id!,
          userId: r.userId,
          title: r.title!,
          xp: r.xp ?? 0,
          tag: r.tag ?? "Reward",
          redeemedAt: r.redeemedAt ?? "",
          voucherCode: r.voucherCode,
          claimUrl: r.claimUrl,
        }),
      );
  } catch {
    return [];
  }
}

export function writeRedemptions(records: RedemptionRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event("redemption-change"));
}

export function subscribeRedemptions(cb: () => void) {
  window.addEventListener("redemption-change", cb);
  return () => window.removeEventListener("redemption-change", cb);
}

export function getRedemptionById(id: string): RedemptionRecord | null {
  return readRedemptions().find((r) => r.id === id) ?? null;
}

export function addRedemption(
  record: Omit<RedemptionRecord, "id" | "redeemedAt" | "voucherCode" | "claimUrl">,
) {
  const current = readRedemptions();
  const id = `RD-${Date.now()}`;
  const next = normalizeRecord({
    ...record,
    id,
    redeemedAt: new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  });
  writeRedemptions([next, ...current]);
  return next;
}

export function openRedemptionInBrowser(record: Pick<RedemptionRecord, "claimUrl">) {
  if (typeof window === "undefined") return;
  window.open(record.claimUrl, "_blank", "noopener,noreferrer");
}
