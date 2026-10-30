import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileCode,
  FileText,
  GraduationCap,
  Layers,
  Lightbulb,
  Printer,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
  Loader2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useIntegrations } from "@/hooks/use-integrations";
import { generateCheatSheetFn } from "@/lib/api/ai-study.functions";
import { updateStudySet, type StudySet } from "@/lib/study-set-store";
import { cn } from "@/lib/utils";

interface StudySetSummaryTabProps {
  studySet: StudySet;
  onStudySetUpdated?: () => void;
}

export function StudySetSummaryTab({ studySet, onStudySetUpdated }: StudySetSummaryTabProps) {
  const { config: integrations } = useIntegrations();
  const [copied, setCopied] = useState(false);
  const [copiedFormulaIndex, setCopiedFormulaIndex] = useState<number | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleRegenerateAiCheatSheet = async () => {
    setIsAiGenerating(true);
    try {
      const activeProvider = integrations.aiStudy.provider || "gemini";
      const settings = integrations.aiStudy.providers?.[activeProvider];
      const apiKey = settings?.apiKey?.trim() || integrations.aiStudy.apiKey?.trim();

      const contextText = studySet.sources
        ?.map((s) => s.contentSnippet || s.fullText)
        .filter(Boolean)
        .join("\n\n");

      const res = await generateCheatSheetFn({
        data: {
          title: studySet.title,
          subject: studySet.subject,
          contextText: contextText ? contextText.slice(0, 10000) : undefined,
          provider: activeProvider,
          apiKey: apiKey || undefined,
          baseUrl: settings?.baseUrl || undefined,
          model: settings?.model || undefined,
        },
      });

      if (res?.cheatSheet) {
        updateStudySet(studySet.id, {
          cheatSheet: res.cheatSheet,
          notes: {
            ...studySet.notes,
            formulasAndRules:
              res.cheatSheet.importantFormulas?.map((f) => ({
                title: f.title,
                formula: f.formula,
                explanation: f.variables,
                examTrick: f.quickTip,
              })) || studySet.notes?.formulasAndRules,
            studyTips: res.cheatSheet.examReminders || studySet.notes?.studyTips,
          },
        });
        onStudySetUpdated?.();
        toast.success("Cheat Sheet regenerated with Google Gemini!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Cheat Sheet. Please check your Gemini API key.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const notes = studySet.notes || {
    summary: "",
    keyConcepts: [],
    definitions: [],
    formulasAndRules: [],
    studyTips: [],
  };

  const checklistItems = [
    { id: "c1", label: "I have reviewed the executive abstract and core theoretical units." },
    { id: "c2", label: "I can state all key definitions and academic terminology without assistance." },
    { id: "c3", label: "I have verified all governing formulas, validity conditions, and variable units." },
    { id: "c4", label: "I understand the applied engineering principles and boundary constraints." },
    { id: "c5", label: "I have resolved identified misconceptions and completed practice exit questions." },
  ];

  const completedCount = checklistItems.filter((item) => checklist[item.id]).length;
  const checklistPct = Math.round((completedCount / checklistItems.length) * 100);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCheatSheet = () => {
    const text = `# ${studySet.title} — Executive Technical Reference Cheat Sheet
Course: ${studySet.courseCode || studySet.subject}

## Executive Abstract
${notes.summary}

## Modular Theoretical Takeaways
${notes.keyConcepts.map((k, i) => `${i + 1}. **${k.concept}**: ${k.explanation}`).join("\n")}

## Verified Academic Definitions
${notes.definitions.map((d) => `• **${d.term}**: ${d.definition}`).join("\n")}

## Governing Theorems & Formulas
${notes.formulasAndRules.map((f) => `### ${f.title}\nFormula: ${f.formula}\nNote: ${f.explanation}`).join("\n\n")}

## Applied Engineering Principles & System Invariants
${notes.studyTips.map((t) => `• ${t}`).join("\n")}
`;

    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Cheat sheet copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyFormula = (formula: string, idx: number) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormulaIndex(idx);
    toast.success("Formula copied to clipboard!");
    setTimeout(() => setCopiedFormulaIndex(null), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-200">
      {/* ── Top Bar with Distinct Identity ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-orange-200/80 bg-gradient-to-r from-orange-50/50 via-white to-amber-50/30 p-5 shadow-xs dark:border-orange-950/60 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-2.5 py-0.5 text-xs font-bold text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200/60 dark:border-orange-900/40">
              <Zap className="size-3.5 fill-orange-500 text-orange-500" />
              Executive Reference Card
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {studySet.courseCode || studySet.subject}
            </span>
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            High-Yield Technical Reference & Formula Sheet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Synthesized rapid-fire review • Designed for final revision before exam day
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={handleRegenerateAiCheatSheet}
            disabled={isAiGenerating}
            className="text-xs h-9 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-xs cursor-pointer"
          >
            {isAiGenerating ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 mr-1.5 text-amber-200" />
                Regenerate Cheat Sheet (AI)
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCheatSheet}
            className="text-xs h-9 rounded-xl font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3.5 mr-1 text-emerald-500" />
                Copied Reference
              </>
            ) : (
              <>
                <Copy className="size-3.5 mr-1" />
                Copy Guide
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-9 rounded-xl font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Printer className="size-3.5 mr-1" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* ── Executive Abstract Card ── */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-amber-950/50 dark:bg-slate-900">
        <div className="absolute top-0 left-0 h-full w-1.5 bg-amber-500" />

        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50">
            <Clock className="size-3.5" />
            Executive Abstract & Axioms
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            ~3 min synthesis reading
          </span>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
          {notes.summary}
        </p>
      </section>

      {/* ── High-Yield Conceptual Units ── */}
      {notes.keyConcepts && notes.keyConcepts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                Core Conceptual Units & Governing Principles
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {notes.keyConcepts.length} theoretical pillars synthesized for exam applications
              </p>
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {notes.keyConcepts.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-6.5 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {item.concept}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.explanation}
                    </p>
                    {item.takeaway && (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800">
                        Takeaway: {item.takeaway}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Governing Formulas & Equations ── */}
      {notes.formulasAndRules && notes.formulasAndRules.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
              <FileCode className="size-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                Governing Formulas & Invariant Laws
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Mathematical relations and boundary constraints
              </p>
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {notes.formulasAndRules.map((rule, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-orange-200/80 bg-orange-50/30 p-5 dark:border-orange-950/60 dark:bg-orange-950/20 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-950 dark:text-orange-200">
                    {rule.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyFormula(rule.formula, idx)}
                    className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-slate-900 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/50 hover:bg-orange-100 transition-colors cursor-pointer"
                    title="Copy LaTeX formula"
                  >
                    {copiedFormulaIndex === idx ? (
                      <>
                        <Check className="size-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" /> Formula
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-xl border border-orange-200/60 bg-white px-4 py-2.5 text-center font-mono text-xs font-bold text-slate-900 shadow-2xs dark:border-slate-800 dark:bg-slate-950 dark:text-orange-300 overflow-x-auto">
                  {rule.formula}
                </div>

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {rule.explanation}
                </p>

                {rule.validityConditions && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    ⚠️ Valid when: {rule.validityConditions}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Worked Examination Scenarios & Concrete Examples ── */}
      {((notes.clarifyingExamples && notes.clarifyingExamples.length > 0) ||
        notes.keyConcepts.some((k) => k.workedExample || k.example)) && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Lightbulb className="size-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                Worked Examination Scenarios & Practical Examples
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Step-by-step problem resolutions and realistic engineering applications
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {notes.clarifyingExamples && notes.clarifyingExamples.length > 0 ? (
              notes.clarifyingExamples.map((ex, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-amber-200/80 bg-amber-50/20 p-5 dark:border-amber-950/60 dark:bg-amber-950/10 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      Scenario #{idx + 1}: {ex.title}
                    </span>
                    <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      {ex.conceptIllustrated}
                    </span>
                  </div>
                  <div className="rounded-xl border border-amber-200/60 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Problem / Scenario:
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {ex.scenario}
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white pt-1">
                      Step-by-Step Analysis & Solution:
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {ex.analysis}
                    </p>
                  </div>
                  {ex.examinerTrap && (
                    <div className="flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 p-2.5 text-[11px] text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                      <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                      <span><strong>Examiner Trap:</strong> {ex.examinerTrap}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              notes.keyConcepts
                .filter((k) => k.workedExample || k.example)
                .slice(0, 3)
                .map((k, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-amber-200/80 bg-amber-50/20 p-5 dark:border-amber-950/60 dark:bg-amber-950/10 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                        Worked Example #{idx + 1}: {k.concept}
                      </span>
                    </div>
                    {typeof k.workedExample === "object" && k.workedExample ? (
                      <div className="rounded-xl border border-amber-200/60 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          Problem:
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {k.workedExample.problemStatement}
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white pt-1">
                          Step-by-Step Solution:
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">
                          {k.workedExample.stepByStepSolution}
                        </p>
                        {k.workedExample.keyTakeaway && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold pt-1">
                            Key Insight: {k.workedExample.keyTakeaway}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-200/60 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-700 dark:text-slate-300">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {typeof k.workedExample === "string" ? k.workedExample : k.example}
                        </p>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </section>
      )}

      {/* ── Verified Definitions Glossary ── */}
      {notes.definitions && notes.definitions.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <BookOpen className="size-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                Essential Technical Taxonomy & Definitions
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Canonical vocabulary frequently tested on university examinations
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            {notes.definitions.map((def, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2.5 p-4.5 text-xs">
                <span className="font-bold text-slate-900 dark:text-white sm:w-1/3 shrink-0 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {def.term}
                </span>
                <span className="text-slate-600 dark:text-slate-300 sm:w-2/3 leading-relaxed">
                  {def.definition}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Applied Engineering Principles & System Invariants ── */}
      {notes.studyTips && notes.studyTips.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <ShieldCheck className="size-4" />
            </div>
            <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
              Applied Principles & Invariant Rules
            </h3>
          </div>

          <div className="space-y-2">
            {notes.studyTips.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-indigo-200/70 bg-indigo-50/30 p-3.5 text-xs text-slate-800 dark:border-indigo-950/60 dark:bg-slate-900 dark:text-slate-200 shadow-2xs"
              >
                <Terminal className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{tip}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Module Mastery & Knowledge Verification Checklist ── */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                Module Verification Checklist
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Verify each requirement before sitting for exam assessments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {completedCount} of {checklistItems.length} Verified ({checklistPct}%)
            </span>
          </div>
        </div>

        {/* Mini progress bar for checklist */}
        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            style={{ width: `${checklistPct}%` }}
            className="h-full bg-emerald-500 transition-all duration-300"
          />
        </div>

        <div className="space-y-2 pt-1">
          {checklistItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleCheck(item.id)}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left text-xs transition cursor-pointer select-none",
                checklist[item.id]
                  ? "border-emerald-300 bg-emerald-50/60 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : "border-slate-200 hover:border-slate-300 text-slate-700 dark:border-slate-800 dark:hover:border-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900",
              )}
            >
              <div
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-lg border transition",
                  checklist[item.id]
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-300 dark:border-slate-600",
                )}
              >
                {checklist[item.id] && <Check className="size-3.5 stroke-3" />}
              </div>
              <span className={cn(checklist[item.id] && "line-through text-slate-400 dark:text-slate-500 font-normal")}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
