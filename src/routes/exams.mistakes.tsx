import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  RotateCcw,
  Sparkles,
  Trash2,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMistakes } from "@/hooks/use-mistakes";
import { bumpMistake, resolveMistake, type MistakeEntry } from "@/lib/mistake-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exams/mistakes")({
  head: () => ({
    meta: [
      { title: "Mistakes Bank — Study2Earn" },
      {
        name: "description",
        content:
          "Every question you missed in a mock exam, collected in one place. Practice until they're fixed.",
      },
    ],
  }),
  component: MistakesPage,
});

const LETTERS = ["A", "B", "C", "D", "E"] as const;
const PRACTICE_SIZE = 10;

function formatMissedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function MistakesPage() {
  const { mistakes, unresolved, unresolvedCount, resolvedCount, clearResolvedMistakes } =
    useMistakes();
  const [practicePool, setPracticePool] = useState<MistakeEntry[] | null>(null);
  const [practiceRound, setPracticeRound] = useState(0);

  const totalMisses = useMemo(() => mistakes.reduce((sum, m) => sum + m.missCount, 0), [mistakes]);

  const byCourse = useMemo(() => {
    const groups = new Map<string, MistakeEntry[]>();
    for (const m of mistakes) {
      const list = groups.get(m.courseName) ?? [];
      list.push(m);
      groups.set(m.courseName, list);
    }
    // Courses with the most unfixed mistakes first
    return [...groups.entries()].sort(
      (a, b) => b[1].filter((m) => !m.resolved).length - a[1].filter((m) => !m.resolved).length,
    );
  }, [mistakes]);

  const startPractice = () => {
    setPracticePool(shuffle(unresolved).slice(0, PRACTICE_SIZE));
    setPracticeRound((r) => r + 1); // remounts PracticeMode with fresh state
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <header className="mb-8 section-enter">
            <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
              Exam Center
            </p>
            <h1 className="mt-1 font-serif text-4xl font-bold text-brand-navy">Mistakes Bank</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Every question you missed in a mock exam lands here. Practice them until they're fixed
              — retaking only what you got wrong is the fastest way to raise your score.
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
              <Zap className="size-3 text-brand-gold" />
              Practice mode · untimed · no XP — answers are shown immediately
            </p>
          </header>

          {practicePool ? (
            <PracticeMode
              key={practiceRound}
              pool={practicePool}
              onExit={() => setPracticePool(null)}
              onRestart={startPractice}
            />
          ) : mistakes.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-emerald-50">
                <Sparkles className="size-7 text-emerald-500" />
              </div>
              <p className="font-serif text-xl font-bold text-brand-navy">No mistakes yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Take a mock exam and any question you miss will be collected here automatically for
                targeted practice.
              </p>
              <Button asChild className="mt-6 bg-brand-navy hover:bg-brand-navy/90">
                <Link to="/exams">
                  Browse mock exams <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Stats + start practice */}
              <div className="mb-8 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "To fix",
                    value: unresolvedCount,
                    icon: Brain,
                    color: "bg-red-50 border-red-100 text-red-700",
                  },
                  {
                    label: "Fixed",
                    value: resolvedCount,
                    icon: CheckCircle2,
                    color: "bg-emerald-50 border-emerald-100 text-emerald-700",
                  },
                  {
                    label: "Total misses",
                    value: totalMisses,
                    icon: ClipboardList,
                    color: "bg-slate-50 border-slate-200 text-slate-600",
                  },
                ].map((s) => (
                  <div key={s.label} className={cn("rounded-2xl border p-4", s.color)}>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        {s.label}
                      </p>
                      <s.icon className="size-4 opacity-60" />
                    </div>
                    <p className="mt-1 font-serif text-2xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="mb-8 flex flex-wrap items-center gap-3">
                <Button
                  onClick={startPractice}
                  disabled={unresolvedCount === 0}
                  className="gap-2 bg-brand-gold text-white shadow-md shadow-brand-gold/25 hover:bg-brand-gold/90"
                >
                  <Brain className="size-4" />
                  {unresolvedCount === 0
                    ? "All mistakes fixed!"
                    : `Practice ${Math.min(unresolvedCount, PRACTICE_SIZE)} mistake${Math.min(unresolvedCount, PRACTICE_SIZE) !== 1 ? "s" : ""}`}
                </Button>
                {resolvedCount > 0 && (
                  <Button variant="outline" onClick={clearResolvedMistakes} className="gap-2">
                    <Trash2 className="size-4" />
                    Clear {resolvedCount} fixed
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link to="/exams">All exams</Link>
                </Button>
              </div>

              {/* Grouped list */}
              <div className="space-y-8">
                {byCourse.map(([courseName, entries]) => {
                  const open = entries.filter((m) => !m.resolved).length;
                  return (
                    <section key={courseName}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="font-serif text-lg font-bold text-brand-navy">
                          {courseName}
                        </h2>
                        <span className="text-xs font-semibold text-slate-400">
                          {open > 0 ? `${open} to fix` : "All fixed ✓"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {[...entries]
                          .sort((a, b) => Number(a.resolved) - Number(b.resolved))
                          .map((m) => (
                            <MistakeRow key={m.questionId} mistake={m} />
                          ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function MistakeRow({ mistake }: { mistake: MistakeEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "rounded-xl border bg-white shadow-sm transition-all",
        mistake.resolved ? "border-emerald-100" : "border-slate-100",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-full",
            mistake.resolved ? "bg-emerald-100" : "bg-red-100",
          )}
        >
          {mistake.resolved ? (
            <CheckCircle2 className="size-3.5 text-emerald-600" />
          ) : (
            <XCircle className="size-3.5 text-red-500" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-brand-navy">{mistake.question}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {mistake.chapterTitle} · missed ×{mistake.missCount} · last{" "}
            {formatMissedDate(mistake.lastMissedAt)}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            "shrink-0",
            mistake.resolved
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700",
          )}
        >
          {mistake.resolved ? "Fixed" : "To fix"}
        </Badge>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <ul className="space-y-1.5">
            {mistake.options.map((opt, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
                  i === mistake.correctIndex
                    ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-800"
                    : "border-transparent text-slate-500",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold",
                    i === mistake.correctIndex
                      ? "bg-emerald-200 text-emerald-800"
                      : "bg-slate-100 text-slate-400",
                  )}
                >
                  {LETTERS[i]}
                </span>
                {opt}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <Zap className="mt-0.5 size-3.5 shrink-0 text-brand-gold" />
            <p className="text-xs text-slate-600">{mistake.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Practice mode: one question at a time, instant feedback ── */
function PracticeMode({
  pool,
  onExit,
  onRestart,
}: {
  pool: MistakeEntry[];
  onExit: () => void;
  onRestart: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [fixedCount, setFixedCount] = useState(0);

  const finished = index >= pool.length;
  const current = finished ? null : pool[index];
  const answered = selected !== null;

  const choose = (optionIndex: number) => {
    if (!current || answered) return;
    setSelected(optionIndex);
    if (optionIndex === current.correctIndex) {
      resolveMistake(current.questionId);
      setFixedCount((n) => n + 1);
    } else {
      bumpMistake(current.questionId);
    }
  };

  const next = () => {
    setSelected(null);
    setIndex((i) => i + 1);
  };

  if (finished || !current) {
    const allFixed = fixedCount === pool.length;
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm section-enter">
        <div
          className={cn(
            "mx-auto mb-4 grid size-16 place-items-center rounded-full",
            allFixed ? "bg-emerald-50" : "bg-amber-50",
          )}
        >
          <Trophy className={cn("size-7", allFixed ? "text-emerald-500" : "text-brand-gold")} />
        </div>
        <p className="font-serif text-2xl font-bold text-brand-navy">
          {fixedCount} of {pool.length} fixed
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          {allFixed
            ? "Perfect round — every mistake in this set is now fixed."
            : "Missed ones stay in the bank so you can practice them again."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={onExit} variant="outline">
            Back to Mistakes Bank
          </Button>
          {!allFixed && (
            <Button onClick={onRestart} className="gap-2 bg-brand-navy hover:bg-brand-navy/90">
              <RotateCcw className="size-4" />
              Practice again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 section-enter">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-600">
          Question {index + 1} of {pool.length}
          <span className="ml-2 text-xs font-medium text-slate-400">
            {current.courseName} · {current.chapterTitle}
          </span>
        </p>
        <button
          type="button"
          onClick={onExit}
          className="text-xs font-semibold text-slate-400 hover:text-brand-navy"
        >
          Exit practice
        </button>
      </div>
      <Progress value={(index / pool.length) * 100} className="h-1.5 [&>div]:bg-brand-gold" />

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <p className="font-medium leading-relaxed text-brand-navy">{current.question}</p>
        <div className="mt-4 space-y-2.5">
          {current.options.map((opt, i) => {
            const isAnswer = i === current.correctIndex;
            const isSelected = selected === i;
            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => choose(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all",
                  !answered && "border-slate-100 hover:border-brand-navy/30 hover:bg-slate-50",
                  answered && isAnswer && "border-emerald-300 bg-emerald-50 font-semibold",
                  answered && isSelected && !isAnswer && "border-red-300 bg-red-50",
                  answered && !isSelected && !isAnswer && "border-slate-100 opacity-50",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold",
                    answered && isAnswer
                      ? "bg-emerald-500 text-white"
                      : answered && isSelected
                        ? "bg-red-400 text-white"
                        : "bg-slate-100 text-slate-500",
                  )}
                >
                  {LETTERS[i]}
                </span>
                <span className="flex-1">{opt}</span>
                {answered && isAnswer && (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                )}
                {answered && isSelected && !isAnswer && (
                  <XCircle className="size-4 shrink-0 text-red-500" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-4 space-y-3 animate-in fade-in-0 duration-300">
            <div
              className={cn(
                "rounded-lg border px-4 py-2.5 text-sm font-semibold",
                selected === current.correctIndex
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700",
              )}
            >
              {selected === current.correctIndex
                ? "✓ Fixed! This question leaves your mistakes list."
                : "Not quite — it stays in the bank for another round."}
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <Zap className="mt-0.5 size-3.5 shrink-0 text-brand-gold" />
              <p className="text-xs text-slate-600">{current.explanation}</p>
            </div>
            <Button onClick={next} className="gap-2 bg-brand-navy hover:bg-brand-navy/90">
              {index + 1 < pool.length ? "Next question" : "See results"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
