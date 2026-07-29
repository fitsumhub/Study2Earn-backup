import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  History,
  Lightbulb,
  Repeat,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { type ChangeEvent, type DragEvent, type RefObject } from "react";

import { Progress } from "@/components/ui/progress";
import type { AiStudyHistoryEntry } from "@/lib/ai-study-store";
import type { LibraryBook } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import { ACCEPT_TYPES, FILE_TYPES } from "./text-extraction";
import { QUESTION_COUNT_OPTIONS } from "./demo-content";
import { relativeTime } from "./study-pack";
import { subjectLabel, subjectTheme } from "./subject";

export function UploadStep({
  dragOver,
  setDragOver,
  onDrop,
  onFileInput,
  onDemo,
  fileInputRef,
  questionCount,
  setQuestionCount,
  aiReady,
  history,
  onResumeHistory,
  onRemoveHistory,
  onClearHistory,
  lastReadBook,
  lastReadPage,
  onGenerateFromBook,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: DragEvent) => void;
  onFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
  onDemo: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  questionCount: number;
  setQuestionCount: (n: number) => void;
  aiReady: boolean;
  history: AiStudyHistoryEntry[];
  onResumeHistory: (entry: AiStudyHistoryEntry) => void;
  onRemoveHistory: (id: string) => void;
  onClearHistory: () => void;
  lastReadBook: LibraryBook | null;
  lastReadPage: number;
  onGenerateFromBook: (book: LibraryBook) => void;
}) {
  return (
    <div className="animate-in fade-in-0 duration-500">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-[#1e2d5a] to-[#0f1a38] px-6 py-16 text-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 size-64 rounded-full bg-brand-gold/5 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-gold backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              AI-Powered Study Tool
            </div>
            <div
              title={
                aiReady
                  ? "A real AI provider is configured — packs are generated from your file's actual content"
                  : "No AI provider is configured yet — you'll get demo questions instead of ones generated from your file"
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-sm",
                aiReady
                  ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
                  : "border-white/15 bg-white/5 text-white/60",
              )}
            >
              {aiReady ? <Zap className="size-3.5" /> : <ClipboardList className="size-3.5" />}
              {aiReady ? "AI generation is live" : "Demo mode — sample questions only"}
            </div>
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight md:text-6xl">
            Upload. Analyse. <span className="text-brand-gold">Ace the exam.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 md:text-lg">
            Drop any lecture note, textbook chapter, or past paper — our AI generates exam-style
            MCQs with explanations plus a structured study summary instantly.
          </p>

          {/* Stat pills */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { icon: ClipboardList, label: `${questionCount} MCQs generated` },
              { icon: Lightbulb, label: "Full explanations" },
              { icon: BookOpen, label: "Structured notes" },
              { icon: Zap, label: "Results in seconds" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm"
              >
                <s.icon className="size-4 text-brand-gold" />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Upload area ── */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* ── Continue where you left off (last book opened in the reader) ── */}
        {lastReadBook && (
          <div className="mb-8 flex flex-col gap-5 overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-brand-navy",
                lastReadBook.tint,
              )}
            >
              <BookMarked className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Continue where you left off
              </p>
              <p className="mt-0.5 truncate font-serif text-lg font-bold text-brand-navy">
                {lastReadBook.name}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                Page {lastReadPage} · {lastReadBook.progress}% read
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                to="/library/read/$bookId"
                params={{ bookId: lastReadBook.id }}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:border-brand-navy/30 hover:bg-slate-50"
              >
                Continue reading
                <ArrowRight className="size-4" />
              </Link>
              <button
                type="button"
                onClick={() => onGenerateFromBook(lastReadBook)}
                className="flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-navy/90"
              >
                <Sparkles className="size-4 text-brand-gold" />
                Get key points & exam
              </button>
            </div>
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
          }}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload study file (PDF, DOC, DOCX, PPT, PPTX, TXT)"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed px-8 py-16 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2",
            dragOver
              ? "border-brand-gold bg-brand-gold/5 scale-[1.01] shadow-xl shadow-brand-gold/10"
              : "border-slate-200 bg-white hover:border-brand-gold/60 hover:shadow-xl hover:shadow-brand-gold/5",
          )}
        >
          {/* Animated corner blobs */}
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand-gold/8 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-brand-gold/12" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-brand-navy/5 blur-2xl transition-all duration-500 group-hover:scale-150" />

          {/* Upload icon */}
          <div
            className={cn(
              "relative mb-6 flex size-24 items-center justify-center rounded-3xl transition-all duration-300",
              dragOver
                ? "bg-brand-gold text-white scale-110 shadow-lg shadow-brand-gold/40"
                : "bg-gradient-to-br from-brand-navy/8 to-brand-navy/4 text-brand-navy group-hover:from-brand-gold/15 group-hover:to-brand-gold/5 group-hover:text-brand-gold",
            )}
          >
            <Upload
              className={cn("size-11 transition-transform duration-300", dragOver && "scale-90")}
            />
            {/* Pulsing ring when dragging */}
            {dragOver && (
              <span className="absolute inset-0 animate-ping rounded-3xl bg-brand-gold/30" />
            )}
          </div>

          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            {dragOver ? "Release to analyse" : "Drag & drop your file here"}
          </h2>
          <p className="mt-2 text-slate-500">
            or{" "}
            <span className="font-semibold text-brand-navy underline decoration-brand-gold underline-offset-4">
              click to browse
            </span>{" "}
            from your device
          </p>

          {/* File type badges */}
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {FILE_TYPES.map((f) => (
              <span
                key={f.ext}
                title={
                  f.fullAnalysis
                    ? "We read the actual text inside this file"
                    : "We generate practice questions based on the filename for this format"
                }
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-3 py-1 text-[11px] font-bold tracking-wide",
                  f.color,
                )}
              >
                {f.ext}
                {f.fullAnalysis && <CheckCircle2 className="size-3" strokeWidth={2.5} />}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            <CheckCircle2 className="mr-1 inline size-3 -translate-y-px" strokeWidth={2.5} /> = we
            read the file's actual text · Maximum file size: 50 MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_TYPES}
            onChange={onFileInput}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        {/* Demo link */}
        <div className="mt-5 text-center">
          <p className="text-sm text-slate-500">
            Don't have a file handy?{" "}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDemo();
              }}
              className="font-semibold text-brand-navy underline decoration-brand-gold underline-offset-4 hover:text-brand-gold transition-colors"
            >
              Try the Physics demo →
            </button>
          </p>
        </div>

        {/* ── Question count selector ── */}
        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-brand-navy">How many questions?</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Choose how many MCQs to generate from your file
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUESTION_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuestionCount(n)}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-150",
                    questionCount === n
                      ? "bg-brand-navy text-white shadow-md shadow-brand-navy/20"
                      : "border border-slate-200 text-slate-600 hover:border-brand-navy/30 hover:bg-slate-50 hover:text-brand-navy",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {/* Mini progress indicator */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-slate-400">Selected:</span>
            <Progress
              value={100}
              className="h-1.5 flex-1 [&>div]:bg-brand-navy [&>div]:transition-all [&>div]:duration-300"
            />
            <span className="shrink-0 rounded-full bg-brand-gold/10 px-2.5 py-0.5 text-xs font-bold text-brand-gold">
              {questionCount} MCQs
            </span>
          </div>
        </div>

        {/* ── Recent study packs ── */}
        {history.length > 0 && (
          <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-brand-navy/8 text-brand-navy">
                  <History className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-brand-navy">Recent Study Packs</p>
                  <p className="text-xs text-slate-500">Jump back in without re-uploading</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClearHistory}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="size-3.5" />
                Clear all
              </button>
            </div>
            <ul className="space-y-2">
              {history.map((entry) => {
                const theme = subjectTheme[entry.subject] ?? subjectTheme.general;
                return (
                  <li
                    key={entry.id}
                    className="group flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:border-brand-navy/20 hover:bg-slate-50/60"
                  >
                    <span className={cn("size-2.5 shrink-0 rounded-full", theme.dot)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-brand-navy">
                          {subjectLabel(entry.subject)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {entry.questionCount} MCQs · {relativeTime(entry.createdAt)}
                        </span>
                        {entry.source === "ai" && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <Sparkles className="size-2.5" />
                            AI
                          </span>
                        )}
                        {entry.scorePct !== undefined && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-bold",
                              entry.scorePct >= 80
                                ? "bg-emerald-100 text-emerald-700"
                                : entry.scorePct >= 60
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-600",
                            )}
                          >
                            {entry.scorePct}% last time
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-400">{entry.filename}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onResumeHistory(entry)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-navy/8 px-3 py-1.5 text-xs font-bold text-brand-navy transition-colors hover:bg-brand-navy hover:text-white"
                    >
                      <Repeat className="size-3.5" />
                      Practice again
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveHistory(entry.id)}
                      aria-label={`Remove ${subjectLabel(entry.subject)} pack from history`}
                      className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ── How it works ── */}
        <div className="mt-12">
          <p className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            How it works
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Upload,
                color: "bg-blue-50 text-blue-600",
                ring: "ring-blue-100",
                step: "01",
                title: "Upload your material",
                desc: "PDF, PPT, DOC, DOCX or plain text — any course file works.",
              },
              {
                icon: Brain,
                color: "bg-purple-50 text-purple-600",
                ring: "ring-purple-100",
                step: "02",
                title: "AI analyses content",
                desc: "Extracts key concepts, facts, and exam-worthy topics from your file.",
              },
              {
                icon: Trophy,
                color: "bg-amber-50 text-amber-600",
                ring: "ring-amber-100",
                step: "03",
                title: "Get your study pack",
                desc: `${questionCount} MCQs with full explanations + key concepts, definitions & summary.`,
              },
            ].map((s) => (
              <div
                key={s.step}
                className="card-lift rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl ring-4",
                      s.color,
                      s.ring,
                    )}
                  >
                    <s.icon className="size-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-500">{s.step}</span>
                </div>
                <p className="font-semibold text-brand-navy">{s.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
