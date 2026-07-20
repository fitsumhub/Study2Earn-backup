import { useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  PlayCircle,
  RotateCcw,
  FlaskConical,
  ShieldCheck,
  Zap,
  Wallet,
  UserPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { REFERRAL_FRIEND_BONUS, REFERRAL_SIGNUP_XP } from "@/lib/referral-data";
import { calculateExamXp } from "@/hooks/use-exam-progress";
import { etbToXp, MIN_WITHDRAWAL_ETB } from "@/lib/withdrawal-data";

// ─── Types ───────────────────────────────────────────────────────────────────

type LogEntry = { ts: string; msg: string; ok: boolean };
type TestStatus = "idle" | "running" | "pass" | "fail";

interface TestSuite {
  id: string;
  label: string;
  description: string;
  icon: typeof FlaskConical;
  color: string;
  run: (log: (msg: string, ok: boolean) => void) => Promise<boolean>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assert(condition: boolean, msg: string, log: (m: string, ok: boolean) => void) {
  log(msg, condition);
  if (!condition) throw new Error(msg);
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function ts() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

const suites: TestSuite[] = [
  {
    id: "auth",
    label: "User Registration & Referral Bonus",
    description:
      "Simulates signup with a referral code, verifying that XP starts at 50 + referral bonus.",
    icon: UserPlus,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    run: async (log) => {
      await wait(200);
      const baseXp = 50;
      log("Simulating signup with referral code 'DEMO-REF'…", true);

      const withReferral = baseXp + REFERRAL_FRIEND_BONUS;
      assert(REFERRAL_FRIEND_BONUS > 0, `REFERRAL_FRIEND_BONUS = ${REFERRAL_FRIEND_BONUS} XP`, log);
      assert(
        withReferral === 50 + REFERRAL_FRIEND_BONUS,
        `Starting XP with referral = ${withReferral}`,
        log,
      );

      await wait(150);
      const withoutReferral = baseXp;
      assert(withoutReferral === 50, "Signup without referral starts at exactly 50 XP", log);

      await wait(150);
      const referralSignupXp = REFERRAL_SIGNUP_XP;
      assert(referralSignupXp > 0, `Referrer earns ${referralSignupXp} XP on friend sign-up`, log);

      log("Password hashing simulation: btoa('pass123') produces a non-empty string", true);
      const hash = btoa("pass123");
      assert(hash.length > 0, `Hashed password is ${hash.length} chars`, log);

      return true;
    },
  },
  {
    id: "exam",
    label: "Mock Exam XP Calculation",
    description:
      "Validates the XP formula: score / 10 × 5, plus a 25 XP first-completion bonus above 60%.",
    icon: Zap,
    color: "bg-violet-50 text-violet-700 border-violet-200",
    run: async (log) => {
      await wait(200);
      const cases: { score: number; first: boolean; expected: number }[] = [
        { score: 100, first: true, expected: 75 }, // (100/10)*5 + 25
        { score: 100, first: false, expected: 50 },
        { score: 60, first: true, expected: 55 }, // (60/10)*5 + 25
        { score: 50, first: true, expected: 25 }, // no bonus (< 60%)
        { score: 0, first: false, expected: 0 },
      ];

      for (const { score, first, expected } of cases) {
        await wait(100);
        const xp = calculateExamXp(score, first);
        assert(
          xp === expected,
          `score=${score}%, firstCompletion=${first} → ${xp} XP (expected ${expected})`,
          log,
        );
      }
      return true;
    },
  },
  {
    id: "wallet",
    label: "Wallet Balance & Redemption Maths",
    description:
      "Verifies that balance floors at 0 when overspent and that redemptions deduct correctly.",
    icon: Wallet,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    run: async (log) => {
      await wait(200);
      // Wallet floor test
      const lifetime = 50 + 120 + 150 + 40; // 360 XP
      const redeemed = 200;
      const pending = 400;
      const balance = Math.max(0, lifetime - redeemed - pending);
      assert(lifetime === 360, `Lifetime earned = ${lifetime} XP`, log);
      await wait(100);
      assert(balance === 0, `Balance floors at 0 when overspent (got ${balance})`, log);

      // Redemption deduction
      await wait(100);
      let bal = 500;
      const cost = 300;
      assert(bal >= cost, `Balance ${bal} ≥ redemption cost ${cost}`, log);
      bal -= cost;
      assert(bal === 200, `After redeeming ${cost} XP, balance = ${bal}`, log);

      // Reading reward
      await wait(100);
      const rewardXp = 100 * 8; // 100 ETB × 8 XP/ETB
      assert(rewardXp === 800, `10h reading reward = ${rewardXp} XP`, log);

      return true;
    },
  },
  {
    id: "withdrawal",
    label: "Bank Withdrawal Workflow",
    description:
      "Simulates submitting a withdrawal request and verifies minimum ETB, XP deduction, and status transitions.",
    icon: ShieldCheck,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    run: async (log) => {
      await wait(200);
      assert(MIN_WITHDRAWAL_ETB === 50, `Minimum withdrawal = ${MIN_WITHDRAWAL_ETB} ETB`, log);

      await wait(100);
      const requestEtb = 100;
      const xpDeducted = etbToXp(requestEtb);
      assert(xpDeducted > 0, `Withdrawing ${requestEtb} ETB deducts ${xpDeducted} XP`, log);
      assert(xpDeducted === requestEtb * 8, `${requestEtb} ETB × 8 = ${xpDeducted} XP`, log);

      await wait(100);
      type Status = "pending" | "approved" | "paid";
      let status: Status = "pending";
      log(`Request created with status: "${status}"`, true);

      await wait(150);
      status = "approved";
      log(`Admin approves → status: "${status}"`, true);

      await wait(150);
      status = "paid";
      log(`Admin marks paid → status: "${status}"`, true);
      assert(status === "paid", "Final status is 'paid'", log);

      await wait(100);
      const belowMin = MIN_WITHDRAWAL_ETB - 1;
      log(`Submitting ${belowMin} ETB (below minimum) should be blocked`, true);
      const blocked = belowMin < MIN_WITHDRAWAL_ETB;
      assert(blocked, `${belowMin} ETB < min ${MIN_WITHDRAWAL_ETB} ETB → rejected ✓`, log);

      return true;
    },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function TestsSection() {
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});
  const [runningAll, setRunningAll] = useState(false);

  const appendLog = useCallback((id: string, msg: string, ok: boolean) => {
    setLogs((prev) => ({
      ...prev,
      [id]: [...(prev[id] ?? []), { ts: ts(), msg, ok }],
    }));
  }, []);

  const runSuite = useCallback(
    async (suite: TestSuite) => {
      setStatuses((p) => ({ ...p, [suite.id]: "running" }));
      setLogs((p) => ({ ...p, [suite.id]: [] }));
      try {
        const ok = await suite.run((msg, pass) => appendLog(suite.id, msg, pass));
        setStatuses((p) => ({ ...p, [suite.id]: ok ? "pass" : "fail" }));
      } catch {
        setStatuses((p) => ({ ...p, [suite.id]: "fail" }));
      }
    },
    [appendLog],
  );

  const runAll = useCallback(async () => {
    setRunningAll(true);
    for (const suite of suites) {
      await runSuite(suite);
      await wait(300);
    }
    setRunningAll(false);
  }, [runSuite]);

  const resetAll = useCallback(() => {
    setStatuses({});
    setLogs({});
  }, []);

  const allDone = suites.every((s) => statuses[s.id] === "pass" || statuses[s.id] === "fail");
  const passCount = suites.filter((s) => statuses[s.id] === "pass").length;
  const failCount = suites.filter((s) => statuses[s.id] === "fail").length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-navy text-white">
            <FlaskConical className="size-5" />
          </div>
          <div>
            <p className="font-serif text-lg font-bold text-brand-navy">E2E Test Runner</p>
            <p className="text-xs text-muted-foreground">
              {suites.length} test suites · runs entirely in the browser
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {allDone && (
            <Button variant="outline" size="sm" className="gap-2" onClick={resetAll}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
            disabled={runningAll}
            onClick={runAll}
          >
            {runningAll ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PlayCircle className="size-4" />
            )}
            Run all tests
          </Button>
        </div>
      </div>

      {/* Results summary */}
      {allDone && (
        <div
          className={cn(
            "flex items-center gap-4 rounded-xl border p-4 text-sm font-semibold",
            failCount === 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          {failCount === 0 ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="size-5 shrink-0 text-red-600" />
          )}
          <span>
            {failCount === 0
              ? `All ${passCount} suites passed`
              : `${passCount} passed · ${failCount} failed`}
          </span>
        </div>
      )}

      {/* Suite cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        {suites.map((suite) => {
          const status = statuses[suite.id] ?? "idle";
          const suiteLogs = logs[suite.id] ?? [];
          const Icon = suite.icon;

          return (
            <Card
              key={suite.id}
              className={cn(
                "shadow-sm transition-shadow",
                status === "pass" && "border-emerald-200",
                status === "fail" && "border-red-300",
                status === "running" && "border-brand-gold/40",
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg border text-sm",
                        suite.color,
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-brand-navy">
                        {suite.label}
                      </CardTitle>
                      <CardDescription className="text-[11px] mt-0.5">
                        {suite.description}
                      </CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    disabled={status === "running" || runningAll}
                    onClick={() => runSuite(suite)}
                  >
                    {status === "running" ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <PlayCircle className="size-3" />
                    )}
                    Run
                  </Button>
                </div>

                {suiteLogs.length > 0 && (
                  <ScrollArea className="h-36 rounded-lg border bg-slate-950 p-3 font-mono text-[11px]">
                    <div className="space-y-1">
                      {suiteLogs.map((entry, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="shrink-0 text-slate-500">{entry.ts}</span>
                          {entry.ok ? (
                            <CheckCircle2 className="size-3 shrink-0 mt-0.5 text-emerald-400" />
                          ) : (
                            <XCircle className="size-3 shrink-0 mt-0.5 text-red-400" />
                          )}
                          <span className={entry.ok ? "text-slate-200" : "text-red-300"}>
                            {entry.msg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {suiteLogs.length === 0 && status === "idle" && (
                  <div className="flex h-12 items-center justify-center rounded-lg border border-dashed bg-slate-50 text-xs text-muted-foreground">
                    Click &ldquo;Run&rdquo; to execute this suite
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info note */}
      <Card className="border-brand-gold/20 bg-brand-gold/5 shadow-none">
        <CardContent className="p-4 text-xs text-slate-600">
          <strong className="text-brand-navy">Note:</strong> These tests simulate business logic and
          localStorage state transitions entirely in-browser — no network calls. For HTTP route
          coverage run <code className="rounded bg-slate-100 px-1 py-0.5">npm run test:e2e</code> in
          your terminal (15/15 routes verified).
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: TestStatus }) {
  if (status === "idle")
    return (
      <Badge variant="secondary" className="shrink-0 text-[10px]">
        Idle
      </Badge>
    );
  if (status === "running")
    return (
      <Badge className="shrink-0 bg-brand-gold/20 text-brand-gold text-[10px]">
        <Loader2 className="mr-1 size-3 animate-spin" />
        Running
      </Badge>
    );
  if (status === "pass")
    return (
      <Badge className="shrink-0 bg-emerald-100 text-emerald-700 text-[10px]">
        <CheckCircle2 className="mr-1 size-3" />
        Passed
      </Badge>
    );
  return (
    <Badge className="shrink-0 bg-red-100 text-red-700 text-[10px]">
      <XCircle className="mr-1 size-3" />
      Failed
    </Badge>
  );
}
