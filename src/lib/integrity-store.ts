/**
 * Integrity / anti-abuse engine — localStorage-backed configuration for the
 * rules that keep students honest (so people can't just farm rewards without
 * actually studying), plus a log of the violations those rules catch.
 *
 * Admins manage this from Moderation → "Integrity & anti-abuse controls".
 *
 * The `idleReading` rule is enforced live in the app: while a PDF is open, if a
 * student stops interacting for the configured timeout, reward accrual is paused
 * and (optionally) some already-earned reading time is clawed back, and a flag is
 * logged here. The other rules are platform policies surfaced for configuration
 * (their enforcement points live in the exam / withdrawal / decay flows).
 *
 * NOTE: client-side demo store — values live in the browser and are editable —
 * treat counts as illustrative, not authoritative.
 */

export type IntegrityRuleId =
  | "idleReading"
  | "speedReading"
  | "examRush"
  | "dailyCap"
  | "inactivityDecay"
  | "withdrawalHold";

export type IntegrityRuleConfig = {
  enabled: boolean;
  threshold: number;
  penalty: number;
};

export type IntegrityRules = Record<IntegrityRuleId, IntegrityRuleConfig>;

export type IntegrityRuleMeta = {
  id: IntegrityRuleId;
  title: string;
  description: string;
  thresholdLabel: string;
  thresholdUnit: string;
  penaltyLabel?: string;
  penaltyUnit?: string;
  /** true = enforced live in the app; false = policy surfaced for config. */
  live: boolean;
};

export const INTEGRITY_RULE_META: IntegrityRuleMeta[] = [
  {
    id: "idleReading",
    title: "Idle reading auto-pause",
    description:
      "If a book is open but the student stops interacting, stop counting reading time and claw back some already-earned minutes. Stops people opening a PDF and walking away to farm the reading reward.",
    thresholdLabel: "Idle timeout",
    thresholdUnit: "minutes",
    penaltyLabel: "Reading time removed",
    penaltyUnit: "minutes",
    live: true,
  },
  {
    id: "speedReading",
    title: "Impossible reading speed",
    description:
      "Withhold chapter XP and flag the student when a chapter is marked complete faster than it could realistically be read.",
    thresholdLabel: "Min time per chapter",
    thresholdUnit: "seconds",
    live: false,
  },
  {
    id: "examRush",
    title: "Exam rushing / random answers",
    description:
      "Withhold exam XP and flag the attempt when a mock exam is submitted far too quickly to have been read.",
    thresholdLabel: "Min time per exam",
    thresholdUnit: "seconds",
    live: true,
  },
  {
    id: "dailyCap",
    title: "Daily earning cap",
    description:
      "Cap how much XP a single student can earn per day so no one can grind the platform around the clock.",
    thresholdLabel: "Daily XP cap",
    thresholdUnit: "XP",
    live: false,
  },
  {
    id: "inactivityDecay",
    title: "Inactivity point decay",
    description:
      "Slowly decay the balance of students who stop studying entirely, so rewards reflect ongoing effort (use-it-or-lose-it).",
    thresholdLabel: "Inactive for",
    thresholdUnit: "days",
    penaltyLabel: "Decay",
    penaltyUnit: "XP/day",
    live: false,
  },
  {
    id: "withdrawalHold",
    title: "Study-before-withdrawal",
    description:
      "Require a minimum amount of verified reading before a student can cash out, so accounts can't be created purely to withdraw.",
    thresholdLabel: "Min verified reading",
    thresholdUnit: "hours",
    live: false,
  },
];

export const DEFAULT_RULES: IntegrityRules = {
  idleReading: { enabled: true, threshold: 10, penalty: 5 },
  speedReading: { enabled: true, threshold: 20, penalty: 0 },
  examRush: { enabled: true, threshold: 60, penalty: 0 },
  dailyCap: { enabled: true, threshold: 500, penalty: 0 },
  inactivityDecay: { enabled: false, threshold: 14, penalty: 10 },
  withdrawalHold: { enabled: true, threshold: 2, penalty: 0 },
};

export type IntegritySeverity = "low" | "medium" | "high";
export type IntegrityStatus = "auto" | "reviewed" | "dismissed";

export type IntegrityEvent = {
  id: string;
  rule: IntegrityRuleId;
  student: string;
  detail: string;
  penalty: number; // points/minutes removed
  severity: IntegritySeverity;
  at: string; // display timestamp
  status: IntegrityStatus;
};

const SEED_EVENTS: IntegrityEvent[] = [
  {
    id: "iv-seed-1",
    rule: "idleReading",
    student: "Samuel Girma",
    detail: 'Idle 14m while "General Physics (Phys 1011)" was open — accrual paused',
    penalty: 5,
    severity: "medium",
    at: "Jul 13, 9:42 AM",
    status: "auto",
  },
  {
    id: "iv-seed-2",
    rule: "examRush",
    student: "Hanna Bekele",
    detail: "Submitted a 40-question mock in 22s — XP withheld",
    penalty: 120,
    severity: "high",
    at: "Jul 13, 8:15 AM",
    status: "auto",
  },
  {
    id: "iv-seed-3",
    rule: "speedReading",
    student: "Yonas Alemu",
    detail: "Marked 6 chapters complete in under 30s total — XP withheld",
    penalty: 60,
    severity: "medium",
    at: "Jul 12, 6:03 PM",
    status: "reviewed",
  },
  {
    id: "iv-seed-4",
    rule: "dailyCap",
    student: "Meron Tesfaye",
    detail: "Hit the 500 XP daily cap — further earning paused until tomorrow",
    penalty: 0,
    severity: "low",
    at: "Jul 12, 4:20 PM",
    status: "auto",
  },
];

const RULES_KEY = "study2earn-integrity-rules";
const EVENTS_KEY = "study2earn-integrity-events";
export const INTEGRITY_CHANGE_EVENT = "integrity-change";

const RULE_IDS = INTEGRITY_RULE_META.map((r) => r.id);

function broadcast() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(INTEGRITY_CHANGE_EVENT));
}

export function subscribeIntegrity(cb: () => void) {
  window.addEventListener(INTEGRITY_CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(INTEGRITY_CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/* ── Rules ─────────────────────────────────────────────────────── */

export function readIntegrityRules(): IntegrityRules {
  if (typeof window === "undefined") return DEFAULT_RULES;
  try {
    const raw = localStorage.getItem(RULES_KEY);
    if (!raw) return DEFAULT_RULES;
    const parsed = JSON.parse(raw) as Partial<IntegrityRules>;
    // Merge over defaults so new rules always exist.
    const merged = { ...DEFAULT_RULES };
    for (const id of RULE_IDS) {
      const r = parsed[id];
      if (r && typeof r === "object") {
        merged[id] = {
          enabled: r.enabled !== false,
          threshold: Number.isFinite(r.threshold)
            ? Number(r.threshold)
            : DEFAULT_RULES[id].threshold,
          penalty: Number.isFinite(r.penalty) ? Number(r.penalty) : DEFAULT_RULES[id].penalty,
        };
      }
    }
    return merged;
  } catch {
    return DEFAULT_RULES;
  }
}

export function writeIntegrityRules(rules: IntegrityRules) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  broadcast();
}

export function updateIntegrityRule(id: IntegrityRuleId, patch: Partial<IntegrityRuleConfig>) {
  const rules = readIntegrityRules();
  const next = { ...rules, [id]: { ...rules[id], ...patch } };
  // Guard numeric fields.
  next[id].threshold = Math.max(0, Math.round(next[id].threshold) || 0);
  next[id].penalty = Math.max(0, Math.round(next[id].penalty) || 0);
  writeIntegrityRules(next);
}

export function resetIntegrityRules() {
  writeIntegrityRules(DEFAULT_RULES);
}

/* ── Events / violations ───────────────────────────────────────── */

export function readIntegrityEvents(): IntegrityEvent[] {
  if (typeof window === "undefined") return SEED_EVENTS;
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return SEED_EVENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IntegrityEvent[]) : SEED_EVENTS;
  } catch {
    return SEED_EVENTS;
  }
}

function writeIntegrityEvents(events: IntegrityEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  broadcast();
}

export function recordIntegrityEvent(
  input: Omit<IntegrityEvent, "id" | "at" | "status"> & { status?: IntegrityStatus },
) {
  const events = readIntegrityEvents();
  const event: IntegrityEvent = {
    id: `iv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    status: input.status ?? "auto",
    rule: input.rule,
    student: input.student,
    detail: input.detail,
    penalty: input.penalty,
    severity: input.severity,
  };
  writeIntegrityEvents([event, ...events].slice(0, 100));
}

export function setIntegrityEventStatus(id: string, status: IntegrityStatus) {
  writeIntegrityEvents(readIntegrityEvents().map((e) => (e.id === id ? { ...e, status } : e)));
}

export function clearIntegrityEvents() {
  writeIntegrityEvents([]);
}
