import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileQuestion,
  Settings2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import {
  ExamForm,
  examToForm,
  loadTemplateBank,
  type ExamFormData,
} from "@/components/admin/forms/exam-form";
import { ExamQuestionEditor } from "@/components/admin/exam-question-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getBankHealth } from "@/lib/admin-exam-data";
import type { AdminExam, AdminExamQuestion } from "@/lib/admin-types";
import { cn } from "@/lib/utils";

type Tab = "details" | "questions" | "preview";

const emptyForm: ExamFormData = {
  title: "",
  subject: "Common",
  questions: "10",
  duration: "25",
  difficulty: "Intermediate",
  published: false,
  courseId: "",
  chapterId: "",
  chapterTitle: "",
  description: "",
  passScore: "60",
  xpReward: "100",
  questionBank: [],
};

export function ExamManagerSheet({
  exam,
  open,
  onClose,
  onSave,
  mode,
  preset,
  initialTab = "details",
}: {
  exam: AdminExam | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: ExamFormData) => void;
  mode: "create" | "edit";
  /** Prefill for create mode (e.g. courseId when adding a chapter from a course group). */
  preset?: Partial<ExamFormData> | null;
  /** Which tab to land on when the sheet opens — e.g. "preview" for the Preview button. */
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>("details");
  const [form, setForm] = useState<ExamFormData>(emptyForm);
  // Snapshot of the question bank as of the last successful save (or initial load),
  // used to warn before discarding unsaved question edits on close.
  const savedQuestionBankRef = useRef<AdminExamQuestion[]>([]);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      const loaded = exam ? examToForm(exam) : { ...emptyForm, ...preset };
      setForm(loaded);
      savedQuestionBankRef.current = loaded.questionBank;
    }
    // initialTab is read once per open (a fresh mode/tab request), not tracked live —
    // omitting it from deps is intentional so re-renders don't reset the active tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exam, preset]);

  const hasUnsavedQuestions =
    JSON.stringify(form.questionBank) !== JSON.stringify(savedQuestionBankRef.current);

  const handleSave = (data: ExamFormData) => {
    savedQuestionBankRef.current = data.questionBank;
    onSave(data);
  };

  const requestClose = () => {
    if (hasUnsavedQuestions) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const loadTemplates = () => {
    if (!form.courseId || !form.chapterId) return;
    setForm((prev) => ({
      ...prev,
      questionBank: loadTemplateBank(form.courseId, form.chapterId),
    }));
    setTab("questions");
  };

  // ── JSON export / import of the question bank ──
  const importInputRef = useRef<HTMLInputElement>(null);

  const exportBank = () => {
    const blob = new Blob([JSON.stringify(form.questionBank, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(form.title || "exam").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-questions.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${form.questionBank.length} questions`);
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("not an array");
        const stamp = Date.now();
        const imported: AdminExamQuestion[] = [];
        parsed.forEach((raw: unknown, i) => {
          if (typeof raw !== "object" || raw === null) return;
          const r = raw as Record<string, unknown>;
          if (typeof r.question !== "string" || !Array.isArray(r.options)) return;
          const options = r.options.map((o) => String(o));
          if (options.length < 2) return;
          const correctIndex =
            typeof r.correctIndex === "number" &&
            r.correctIndex >= 0 &&
            r.correctIndex < options.length
              ? r.correctIndex
              : 0;
          imported.push({
            id: `q-import-${stamp}-${i}`,
            question: r.question,
            options,
            correctIndex,
            explanation: typeof r.explanation === "string" ? r.explanation : "",
          });
        });
        if (imported.length === 0) {
          toast.error("No valid questions found in that file");
          return;
        }
        setForm((prev) => ({ ...prev, questionBank: [...prev.questionBank, ...imported] }));
        const skipped = parsed.length - imported.length;
        toast.success(
          `Imported ${imported.length} question${imported.length !== 1 ? "s" : ""}`,
          skipped > 0 ? { description: `${skipped} invalid entries were skipped` } : undefined,
        );
        setTab("questions");
      } catch {
        toast.error("Invalid JSON file", {
          description:
            "Expected an array of { question, options[], correctIndex, explanation } objects.",
        });
      }
    };
    reader.readAsText(file);
  };

  const bankHealth = getBankHealth(form.questionBank, parseInt(form.questions, 10) || 0);

  const tabs: { id: Tab; label: string; icon: typeof Settings2 }[] = [
    { id: "details", label: "Details", icon: Settings2 },
    { id: "questions", label: "Questions", icon: FileQuestion },
    { id: "preview", label: "Preview", icon: Eye },
  ];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && requestClose()}>
      <SheetContent className="flex w-full flex-col overflow-hidden sm:max-w-2xl lg:max-w-3xl">
        <SheetHeader className="shrink-0">
          <SheetTitle className="font-serif text-brand-navy">
            {mode === "create" ? "Create mock exam" : "Manage mock exam"}
          </SheetTitle>
          <SheetDescription>
            Configure chapter exam settings, edit the question bank, and publish to students.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex shrink-0 gap-1 overflow-x-auto border-b pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                tab === t.id ? "bg-brand-navy text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
              {t.id === "questions" && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {form.questionBank.length}
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          {tab === "details" && (
            <ExamForm
              key={exam?.id ?? "new"}
              initial={form}
              submitLabel={mode === "create" ? "Create exam" : "Save changes"}
              onCancel={requestClose}
              onSubmit={(data) => handleSave({ ...data, questionBank: form.questionBank })}
            />
          )}

          {tab === "questions" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadTemplates}
                  disabled={!form.courseId || !form.chapterId}
                >
                  Load MoE template bank
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => importInputRef.current?.click()}
                >
                  <Upload className="size-3.5" /> Import JSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={form.questionBank.length === 0}
                  onClick={exportBank}
                >
                  <Download className="size-3.5" /> Export JSON
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportFile}
                />
                <Button type="button" size="sm" onClick={() => handleSave(form)}>
                  Save question bank
                </Button>
              </div>

              {/* Bank health summary */}
              {form.questionBank.length > 0 &&
                (bankHealth.ok ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    Bank is healthy — {form.questionBank.length} complete questions, enough for{" "}
                    {form.questions} per attempt.
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="flex items-center gap-2 text-xs font-bold text-amber-800">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      {bankHealth.issues.length} issue{bankHealth.issues.length !== 1 ? "s" : ""} to
                      fix before publishing
                    </p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-amber-700">
                      {bankHealth.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                ))}

              <ExamQuestionEditor
                questions={form.questionBank}
                maxQuestions={parseInt(form.questions, 10) || undefined}
                onChange={(questionBank) => setForm((prev) => ({ ...prev, questionBank }))}
              />
            </div>
          )}

          {tab === "preview" && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-brand-navy/5 p-4">
                <h3 className="font-serif text-lg font-bold text-brand-navy">
                  {form.title || "Untitled exam"}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {form.description || "No description"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{form.subject}</Badge>
                  <Badge variant="secondary">{form.difficulty}</Badge>
                  <Badge variant="secondary">{form.duration} min</Badge>
                  <Badge variant="secondary">{form.questions} Q / attempt</Badge>
                  <Badge variant="secondary">Pass {form.passScore}%</Badge>
                  <Badge className="bg-brand-gold/15 text-brand-gold">+{form.xpReward} XP</Badge>
                </div>
              </div>
              {form.questionBank.slice(0, parseInt(form.questions, 10) || 3).map((q, i) => (
                <div key={q.id} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold text-brand-navy">
                    {i + 1}. {q.question || "(empty question)"}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {q.options.map((opt, oi) => (
                      <li
                        key={oi}
                        className={cn(
                          "rounded px-2 py-1 text-sm",
                          oi === q.correctIndex && "bg-emerald-50 font-medium text-emerald-800",
                        )}
                      >
                        {String.fromCharCode(65 + oi)}. {opt || "—"}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {form.questionBank.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Add questions in the Questions tab to preview the student experience.
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved question changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You've edited the question bank without saving. Closing now will lose those changes —
              go back and click "Save question bank" first if you want to keep them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setConfirmDiscard(false);
                onClose();
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
