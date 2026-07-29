import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Copy,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getQuestionIssues } from "@/lib/admin-exam-data";
import type { AdminExamQuestion } from "@/lib/admin-types";
import { cn } from "@/lib/utils";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

function newQuestion(index: number): AdminExamQuestion {
  return {
    id: `q-${Date.now()}-${index}`,
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  };
}

export function ExamQuestionEditor({
  questions,
  onChange,
  maxQuestions,
}: {
  questions: AdminExamQuestion[];
  onChange: (questions: AdminExamQuestion[]) => void;
  maxQuestions?: number;
}) {
  const [search, setSearch] = useState("");

  const update = (id: string, patch: Partial<AdminExamQuestion>) => {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const updateOption = (id: string, optIndex: number, value: string) => {
    const q = questions.find((item) => item.id === id);
    if (!q) return;
    const options = [...q.options];
    options[optIndex] = value;
    update(id, { options });
  };

  const addOption = (id: string) => {
    const q = questions.find((item) => item.id === id);
    if (!q || q.options.length >= MAX_OPTIONS) return;
    update(id, { options: [...q.options, ""] });
  };

  const removeOption = (id: string, optIndex: number) => {
    const q = questions.find((item) => item.id === id);
    if (!q || q.options.length <= MIN_OPTIONS) return;
    const options = q.options.filter((_, i) => i !== optIndex);
    const correctIndex =
      q.correctIndex === optIndex
        ? 0
        : q.correctIndex > optIndex
          ? q.correctIndex - 1
          : q.correctIndex;
    update(id, { options, correctIndex });
  };

  const remove = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const duplicate = (id: string) => {
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) return;
    const source = questions[index];
    const copy: AdminExamQuestion = {
      ...source,
      id: `q-${Date.now()}-copy`,
      options: [...source.options],
    };
    onChange([...questions.slice(0, index + 1), copy, ...questions.slice(index + 1)]);
  };

  const add = () => {
    onChange([...questions, newQuestion(questions.length)]);
  };

  const move = (id: string, direction: -1 | 1) => {
    const index = questions.findIndex((q) => q.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const [issuesOnly, setIssuesOnly] = useState(false);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return questions.filter((item) => {
      if (issuesOnly && getQuestionIssues(item).length === 0) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.options.some((o) => o.toLowerCase().includes(q)) ||
        item.explanation.toLowerCase().includes(q)
      );
    });
  }, [questions, search, issuesOnly]);

  const brokenCount = useMemo(
    () => questions.filter((q) => getQuestionIssues(q).length > 0).length,
    [questions],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-navy">Question bank</p>
          <p className="text-xs text-muted-foreground">
            {questions.length} question{questions.length !== 1 ? "s" : ""} in bank
            {maxQuestions ? ` · ${maxQuestions} shown per attempt` : ""}
            {brokenCount > 0 && (
              <span className="ml-1.5 font-semibold text-red-600">· {brokenCount} incomplete</span>
            )}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={add}>
          <Plus className="size-3.5" />
          Add question
        </Button>
      </div>

      {(questions.length > 3 || brokenCount > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search questions, options, explanations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
          {brokenCount > 0 && (
            <button
              type="button"
              onClick={() => setIssuesOnly((v) => !v)}
              aria-pressed={issuesOnly}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors",
                issuesOnly
                  ? "border-red-300 bg-red-50 text-red-600"
                  : "border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600",
              )}
            >
              <AlertTriangle className="size-3.5" />
              {brokenCount} issue{brokenCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          No questions yet. Add manually, load the MoE template bank, or import a JSON file.
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          {issuesOnly && !search
            ? "No questions with issues — the bank is healthy."
            : `No questions match “${search}”.`}
        </div>
      ) : (
        <div className="space-y-4 sm:max-h-[55vh] sm:overflow-y-auto sm:pr-1">
          {visible.map((q) => {
            const issues = getQuestionIssues(q);
            const index = questions.findIndex((item) => item.id === q.id);
            const number = index + 1;
            const canReorder = !search.trim() && !issuesOnly;
            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-xl border bg-slate-50/50 p-4",
                  issues.length > 0 && "border-red-200 bg-red-50/30",
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Question {number}
                    </Label>
                    {issues.length > 0 && (
                      <span
                        title={issues.join("\n")}
                        className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600"
                      >
                        <AlertTriangle className="size-2.5" />
                        {issues[0]}
                        {issues.length > 1 ? ` +${issues.length - 1}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {canReorder && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Move up"
                          disabled={index === 0}
                          className="size-7 text-slate-500 disabled:opacity-30"
                          onClick={() => move(q.id, -1)}
                        >
                          <ChevronUp className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Move down"
                          disabled={index === questions.length - 1}
                          className="size-7 text-slate-500 disabled:opacity-30"
                          onClick={() => move(q.id, 1)}
                        >
                          <ChevronDown className="size-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Duplicate question"
                      className="size-7 text-slate-500"
                      onClick={() => duplicate(q.id)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Delete question"
                      className="size-7 text-destructive"
                      onClick={() => remove(q.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  rows={2}
                  value={q.question}
                  placeholder="Question stem"
                  onChange={(e) => update(q.id, { question: e.target.value })}
                  className="mb-3 bg-white"
                />
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Mark as correct answer"
                        onClick={() => update(q.id, { correctIndex: oi })}
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition",
                          q.correctIndex === oi
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-400 hover:border-brand-navy/30",
                        )}
                      >
                        {String.fromCharCode(65 + oi)}
                      </button>
                      <Input
                        value={opt}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        onChange={(e) => updateOption(q.id, oi, e.target.value)}
                        className="min-w-0 flex-1 bg-white"
                      />
                      {q.correctIndex === oi ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Remove option"
                          disabled={q.options.length <= MIN_OPTIONS}
                          className="size-7 shrink-0 text-slate-300 hover:text-destructive"
                          onClick={() => removeOption(q.id, oi)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {q.options.length < MAX_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => addOption(q.id)}
                      className="ml-10 text-xs font-semibold text-brand-navy/60 hover:text-brand-navy"
                    >
                      + Add option {String.fromCharCode(65 + q.options.length)}
                    </button>
                  )}
                </div>
                <div className="mt-3 grid gap-2">
                  <Label className="text-xs text-muted-foreground">
                    Explanation (shown after submit)
                  </Label>
                  <Textarea
                    rows={2}
                    value={q.explanation}
                    onChange={(e) => update(q.id, { explanation: e.target.value })}
                    className="bg-white text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
