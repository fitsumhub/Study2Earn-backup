import {
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit2,
  FileText,
  Lightbulb,
  Printer,
  Save,
  Sparkles,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateStudySet, type StudySet, type StudySetNotes } from "@/lib/study-set-store";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface StudySetNotesTabProps {
  studySet: StudySet;
}

export function StudySetNotesTab({ studySet }: StudySetNotesTabProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [summaryText, setSummaryText] = useState(studySet.notes.summary);

  const notes = studySet.notes;

  const handleCopy = () => {
    const markdown = `# ${studySet.title} — AI Study Notes
Course: ${studySet.courseCode || studySet.subject}

## Executive Summary
${notes.summary}

## Key Concepts
${notes.keyConcepts.map((k) => `### ${k.concept}\n${k.explanation}`).join("\n\n")}

## Verified Definitions
${notes.definitions.map((d) => `* **${d.term}**: ${d.definition}`).join("\n")}

## Governing Formulas & Rules
${notes.formulasAndRules.map((f) => `### ${f.title}\n$$\n${f.formula}\n$$\n${f.explanation}`).join("\n\n")}

## Exam Study Tips
${notes.studyTips.map((t) => `* ${t}`).join("\n")}
`;

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob(
      [
        `# ${studySet.title} — AI Study Notes\n\n${notes.summary}\n\n## Key Concepts\n${notes.keyConcepts
          .map((k) => `- **${k.concept}**: ${k.explanation}`)
          .join("\n")}`,
      ],
      { type: "text/markdown" },
    );
    element.href = URL.createObjectURL(file);
    element.download = `${studySet.title.replace(/\s+/g, "_")}_Notes.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveEdit = () => {
    updateStudySet(studySet.id, {
      notes: {
        ...studySet.notes,
        summary: summaryText,
      },
    });
    setIsEditing(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-200">
      {/* ── Top Header Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="size-4 text-blue-500" />
            Comprehensive Notes & High-Yield Summary
          </h2>
          <p className="text-xs text-slate-500">
            Synthesized from {studySet.sources.length} learning sources for {studySet.courseCode}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check className="size-3.5 mr-1 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="size-3.5 mr-1" />
                Copy Markdown
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="text-xs font-semibold"
          >
            <Download className="size-3.5 mr-1" />
            Export .md
          </Button>

          <Button
            type="button"
            size="sm"
            variant={isEditing ? "default" : "outline"}
            onClick={() => {
              if (isEditing) handleSaveEdit();
              else setIsEditing(true);
            }}
            className={cn("text-xs font-semibold", isEditing && "bg-emerald-600 hover:bg-emerald-700")}
          >
            {isEditing ? (
              <>
                <Save className="size-3.5 mr-1" />
                Save Notes
              </>
            ) : (
              <>
                <Edit2 className="size-3.5 mr-1" />
                Edit Summary
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── 1. Executive Summary ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <FileText className="size-4" />
          </span>
          <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
            Executive Summary
          </h3>
        </div>

        {isEditing ? (
          <Textarea
            rows={5}
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            className="text-xs leading-relaxed"
          />
        ) : (
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            <MarkdownRenderer content={notes.summary} />
          </div>
        )}
      </div>

      {/* ── 2. Key Concepts ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Sparkles className="size-4" />
          </span>
          <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
            Core Concepts & Axioms ({notes.keyConcepts.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.keyConcepts.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5"
            >
              <h4 className="font-serif text-sm font-bold text-brand-navy dark:text-blue-300">
                {idx + 1}. {item.concept}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Formulas & Mathematical Rules (with LaTeX) ── */}
      {notes.formulasAndRules && notes.formulasAndRules.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <span className="text-xs font-serif font-black">∑x</span>
            </span>
            <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
              Formulas & Mathematical Rules
            </h3>
          </div>

          <div className="space-y-3">
            {notes.formulasAndRules.map((rule, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-purple-100 bg-purple-50/30 p-4 dark:border-purple-950 dark:bg-purple-950/20"
              >
                <div className="space-y-1">
                  <p className="font-bold text-xs text-purple-900 dark:text-purple-200">
                    {rule.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {rule.explanation}
                  </p>
                </div>

                <div className="shrink-0 rounded-xl bg-white px-4 py-2 font-mono text-sm font-bold text-purple-900 shadow-xs dark:bg-slate-900 dark:text-purple-200 border border-purple-200 dark:border-purple-900/50">
                  <MarkdownRenderer content={`$$${rule.formula}$$`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Verified Definitions Glossary ── */}
      {notes.definitions && notes.definitions.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
            High-Yield Definitions & Terminology
          </h3>

          <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5 w-1/3">Term</th>
                  <th className="px-4 py-2.5">Academic Definition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {notes.definitions.map((def, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold text-brand-navy dark:text-blue-300 align-top">
                      {def.term}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                      {def.definition}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Ethiopian Exam Study Tips ── */}
      {notes.studyTips && notes.studyTips.length > 0 && (
        <div className="rounded-3xl border border-amber-200/90 bg-amber-50/50 p-6 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-serif text-base font-bold text-amber-900 dark:text-amber-200">
              Ethiopian Exit Exam & Midterm Tips
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-amber-900/90 dark:text-amber-200/90">
            {notes.studyTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

