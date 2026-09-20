import {
  BookMarked,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  FileSearch,
  FileText,
  Headphones,
  Layers,
  Lightbulb,
  Loader2,
  Pencil,
  PencilLine,
  Radio,
  Repeat,
  RotateCcw,
  Share2,
  Sparkles,
  Target,
  Trophy,
  Upload,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { AiPodcastPlayer } from "./AiPodcastPlayer";
import { AiTutorChat } from "./AiTutorChat";
import { ExportModal } from "./ExportModal";
import { FlashcardsMode } from "./FlashcardsMode";
import { QuestionCard } from "./QuestionCard";
import { SourceBadge } from "./SourceBadge";
import {
  generateFlashcardsFromResult,
  generatePodcastFromResult,
  generateWrittenQuestionsFromResult,
} from "./study-pack";
import { subjectLabel, subjectTheme } from "./subject";
import type { AIResult } from "./types";
import { WrittenPracticeMode } from "./WrittenPracticeMode";

export type StudyModeTab = "flashcards" | "quiz" | "written" | "notes" | "tutor" | "podcast";

export function ResultsStep({
  result,
  retaking,
  onReset,
  onRetake,
  onChangeSubject,
  onComplete,
}: {
  result: AIResult;
  retaking: boolean;
  onReset: () => void;
  onRetake: () => void;
  onChangeSubject: (subject: string) => void;
  onComplete: (answeredCount: number, correctCount: number, scorePct: number) => void;
}) {
  const theme = subjectTheme[result.subject] ?? subjectTheme.general;
  const [activeTab, setActiveTab] = useState<StudyModeTab>("flashcards");
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Derived study sets
  const flashcards = useMemo(
    () => result.flashcards || generateFlashcardsFromResult(result),
    [result],
  );
  const writtenQuestions = useMemo(
    () => result.writtenQuestions || generateWrittenQuestionsFromResult(result),
    [result],
  );
  const podcast = useMemo(
    () => result.podcast || generatePodcastFromResult(result),
    [result],
  );

  // Quiz mode tracking
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [onlyMissed, setOnlyMissed] = useState(false);
  const [missedIndices, setMissedIndices] = useState<Set<number>>(new Set());
  const reportedRef = useRef(false);

  useEffect(() => {
    setAnsweredCount(0);
    setCorrectCount(0);
    setMissedIndices(new Set());
    setOnlyMissed(false);
    reportedRef.current = false;
    setAttempt((n) => n + 1);
  }, [result.questions]);

  const handleReveal = (isCorrect: boolean, index: number) => {
    setAnsweredCount((n) => n + 1);
    if (isCorrect) {
      setCorrectCount((n) => n + 1);
    } else {
      setMissedIndices((prev) => new Set([...prev, index]));
    }
  };

  const total = result.questions.length;
  const scorePct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  useEffect(() => {
    if (total > 0 && answeredCount === total && !reportedRef.current) {
      reportedRef.current = true;
      onComplete(answeredCount, correctCount, scorePct);
    }
  }, [answeredCount, total, correctCount, scorePct, onComplete]);

  const displayedQuestions = useMemo(() => {
    if (!onlyMissed) return result.questions;
    return result.questions.filter((_, i) => missedIndices.has(i));
  }, [result.questions, onlyMissed, missedIndices]);

  const tabs: Array<{
    id: StudyModeTab;
    label: string;
    icon: typeof Layers;
    badge?: string;
  }> = [
    { id: "flashcards", label: "Flashcards", icon: Layers, badge: `${flashcards.length}` },
    { id: "quiz", label: "Practice Quiz", icon: ClipboardList, badge: `${total}` },
    { id: "written", label: "Written Recall", icon: Pencil, badge: `${writtenQuestions.length}` },
    { id: "notes", label: "AI Notes & Summary", icon: BookOpen },
    { id: "tutor", label: "AI Tutor", icon: Bot, badge: "Live" },
    { id: "podcast", label: "AI Podcast", icon: Radio, badge: "Audio" },
  ];

  return (
    <div className="animate-in fade-in-0 duration-500 min-h-screen flex flex-col bg-slate-50/50">
      {/* ── Subject gradient banner ── */}
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-br px-6 py-10 text-white shadow-md",
          theme.banner,
        )}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 size-40 rounded-full bg-black/10 blur-2xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <Select value={result.subject} onValueChange={onChangeSubject}>
                  <SelectTrigger
                    aria-label="Correct the detected subject"
                    className={cn(
                      "h-auto w-auto gap-1.5 rounded-full border-0 px-3 py-1 text-xs font-bold shadow-none focus:ring-0",
                      theme.badge,
                    )}
                  >
                    <SelectValue>{subjectLabel(result.subject)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(subjectTheme).map((key) => (
                      <SelectItem key={key} value={key}>
                        {subjectLabel(key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  <FileText className="size-3 text-brand-gold" />
                  {result.filename}
                </span>

                <span
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                  title={
                    result.detectionSource === "content"
                      ? "We read the text inside your file to pick this subject"
                      : result.detectionSource === "manual"
                        ? "You corrected the detected subject"
                        : result.detectionSource === "library"
                          ? "Matched from the library book you were reading"
                          : "We couldn't pull enough readable text from this file, so we guessed the subject from the filename instead"
                  }
                >
                  {result.detectionSource === "content" ? (
                    <>
                      <FileSearch className="size-3" />
                      Detected from content
                    </>
                  ) : result.detectionSource === "manual" ? (
                    <>
                      <PencilLine className="size-3" />
                      Subject set by you
                    </>
                  ) : result.detectionSource === "library" ? (
                    <>
                      <BookMarked className="size-3" />
                      From library book
                    </>
                  ) : (
                    <>
                      <FileSearch className="size-3 opacity-60" />
                      Guessed from filename
                    </>
                  )}
                </span>

                <SourceBadge source={result.source} />
              </div>

              <h1 className="font-serif text-3xl font-bold md:text-4xl text-white">
                {subjectLabel(result.subject)} Study Set
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Interactive Flashcards, Practice Quiz, Written Recall, AI Notes, Tutor & Podcast
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRetake}
                disabled={retaking}
                title={
                  result.source === "ai"
                    ? "Ask the AI provider for a fresh set of questions from the same file"
                    : "Shuffle a fresh set of demo questions for the same subject"
                }
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-70"
              >
                {retaking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Repeat className="size-4" />
                )}
                Retake
              </button>

              <button
                type="button"
                onClick={() => setIsExportOpen(true)}
                title="Export to Anki, Quizlet, PDF or clipboard"
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/20"
              >
                <Share2 className="size-4" />
                Export
              </button>

              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/20"
              >
                <RotateCcw className="size-4" />
                New file
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Studley Study Modes Tab Bar ── */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-6 py-2.5 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200",
                  isActive
                    ? "bg-brand-navy text-white shadow-md shadow-brand-navy/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-navy",
                )}
              >
                <Icon className={cn("size-4", isActive ? "text-brand-gold" : "text-slate-400")} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                      isActive
                        ? "bg-white/20 text-brand-gold"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Tab Content Area ── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {/* ── 1. FLASHCARDS MODE ── */}
        {activeTab === "flashcards" && (
          <FlashcardsMode
            initialFlashcards={flashcards}
            subjectTitle={subjectLabel(result.subject)}
          />
        )}

        {/* ── 2. PRACTICE QUIZ MODE ── */}
        {activeTab === "quiz" && (
          <div className="space-y-8">
            {/* Live score tracker */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                    <Trophy className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Live Quiz Score
                    </p>
                    <p className="font-serif text-xl font-bold text-brand-navy">
                      {answeredCount === 0
                        ? "Answer questions below to track your score"
                        : `${correctCount} / ${answeredCount} correct (${scorePct}%)`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                    <CheckCircle2 className="size-4" /> {correctCount} correct
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-red-500">
                    <XCircle className="size-4" /> {answeredCount - correctCount} wrong
                  </span>
                  <span className="text-slate-400">{total - answeredCount} remaining</span>
                </div>
              </div>
              {answeredCount > 0 && (
                <div className="mt-3">
                  <Progress
                    value={scorePct}
                    className={cn(
                      "h-2 [&>div]:transition-all [&>div]:duration-500",
                      scorePct >= 80
                        ? "[&>div]:bg-emerald-500"
                        : scorePct >= 60
                          ? "[&>div]:bg-amber-400"
                          : "[&>div]:bg-red-400",
                    )}
                  />
                </div>
              )}
            </div>

            {/* Session complete banner */}
            {answeredCount === total && total > 0 && (
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 border",
                  scorePct >= 80
                    ? "border-emerald-200 bg-emerald-50"
                    : scorePct >= 60
                      ? "border-amber-200 bg-amber-50"
                      : "border-red-200 bg-red-50",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold font-serif text-brand-navy">
                      {scorePct}%
                    </div>
                    <div>
                      <h4 className="font-serif text-lg font-bold text-brand-navy">
                        {scorePct >= 80
                          ? "Mastery Achieved!"
                          : scorePct >= 60
                            ? "Good effort!"
                            : "Keep practising!"}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {correctCount} correct out of {total} questions.
                      </p>
                    </div>
                  </div>

                  {missedIndices.size > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOnlyMissed(!onlyMissed)}
                      className="rounded-xl border-slate-300 font-bold"
                    >
                      {onlyMissed
                        ? "Show All Questions"
                        : `Retry Missed Questions (${missedIndices.size})`}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Question Cards list */}
            <div className="space-y-4">
              {displayedQuestions.map((q, i) => (
                <QuestionCard
                  key={`${attempt}-${i}-${q.id}`}
                  question={q}
                  index={i}
                  onReveal={(isCorrect) => handleReveal(isCorrect, i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── 3. WRITTEN PRACTICE MODE ── */}
        {activeTab === "written" && (
          <WrittenPracticeMode
            questions={writtenQuestions}
            subjectTitle={subjectLabel(result.subject)}
          />
        )}

        {/* ── 4. AI NOTES & SUMMARY MODE ── */}
        {activeTab === "notes" && (
          <div className="space-y-8">
            {/* What was extracted */}
            {result.excerpt && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <FileSearch className="size-4 text-brand-gold" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Source Excerpt Read From File
                  </p>
                </div>
                <p className="text-sm italic leading-relaxed text-slate-600">"{result.excerpt}"</p>
              </div>
            )}

            {/* Chapter summary */}
            <div className="overflow-hidden rounded-3xl border border-brand-gold/30 bg-gradient-to-br from-brand-gold/10 to-amber-50/50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gold/20 text-brand-gold">
                  <Lightbulb className="size-5" />
                </div>
                <h3 className="font-serif text-xl font-bold text-brand-navy">Executive Summary</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {result.notes.summary}
              </p>
            </div>

            {/* Key Concepts */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-navy">
                    <Zap className="size-4" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-brand-navy">Key Concepts</h3>
                </div>
                <span className="rounded-full bg-brand-navy/10 px-3 py-0.5 text-xs font-bold text-brand-navy">
                  {result.notes.keyConcepts.length} concepts
                </span>
              </div>
              <ul className="divide-y divide-slate-100 px-6">
                {result.notes.keyConcepts.map((concept, i) => (
                  <li key={i} className="flex items-start gap-4 py-4">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-slate-700 font-medium">
                      {concept}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Definitions Glossary */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText className="size-4" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-brand-navy">Definitions & Glossary</h3>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700">
                  {result.notes.definitions.length} terms
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {result.notes.definitions.map((def, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row gap-2 sm:gap-6 px-6 py-4 text-sm hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="w-full sm:w-48 shrink-0 font-serif font-bold text-brand-navy">
                      {def.term}
                    </span>
                    <span className="leading-relaxed text-slate-600">{def.definition}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* High-yield Exam tips */}
            <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Target className="size-5" />
                </div>
                <h3 className="font-serif text-xl font-bold text-brand-navy">
                  High-Yield Exam Tips
                </h3>
              </div>
              <ul className="space-y-3">
                {result.notes.studyTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── 5. AI TUTOR MODE ── */}
        {activeTab === "tutor" && <AiTutorChat result={result} />}

        {/* ── 6. AI PODCAST MODE ── */}
        {activeTab === "podcast" && <AiPodcastPlayer podcast={podcast} />}
      </main>

      {/* Export & Share Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        result={result}
        flashcards={flashcards}
      />

      <SiteFooter />
    </div>
  );
}
