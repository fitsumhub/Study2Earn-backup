import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  Flame,
  GraduationCap,
  Headphones,
  HelpCircle,
  Pencil,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import type { StudySet } from "@/lib/study-set-store";
import { cn } from "@/lib/utils";

interface StudySetOverviewTabProps {
  studySet: StudySet;
  onNavigateTab: (tab: string) => void;
  onPracticeWeakAreas: () => void;
}

export function StudySetOverviewTab({
  studySet,
  onNavigateTab,
  onPracticeWeakAreas,
}: StudySetOverviewTabProps) {
  const totalCards = studySet.flashcards.length;
  const masteredCards = studySet.flashcards.filter((c) => c.mastery === "mastered").length;
  const familiarCards = studySet.flashcards.filter((c) => c.mastery === "familiar").length;
  const learningCards = studySet.flashcards.filter((c) => c.mastery === "learning").length;
  const unfamiliarCards = totalCards - masteredCards - familiarCards - learningCards;

  const totalQuizzes = studySet.quizzes.length;
  const quizAccuracy = studySet.progress.quizAccuracyPct;
  const writtenDone = studySet.progress.writtenTestsCompleted;
  const writtenTotal = studySet.writtenTests.length;
  const fillBlanksDone = studySet.progress.fillBlanksCompleted;
  const fillBlanksTotal = studySet.fillBlanks.length;

  const overallMastery = studySet.progress.overallPct;

  // Determine smart recommendation
  let nextAction = {
    title: "Review Flashcards",
    desc: "Solidify unfamiliar concepts with 3D spaced repetition",
    tab: "flashcards",
    icon: Brain,
    color: "from-blue-600 to-indigo-600",
  };

  if (masteredCards > 0 && quizAccuracy === 0 && totalQuizzes > 0) {
    nextAction = {
      title: "Take Multiple-Choice Quiz",
      desc: "Test your active recall with timed exit-exam questions",
      tab: "quiz",
      icon: HelpCircle,
      color: "from-purple-600 to-pink-600",
    };
  } else if (quizAccuracy > 0 && writtenDone < writtenTotal && writtenTotal > 0) {
    nextAction = {
      title: "Complete Written Test",
      desc: "Practice free-response questions with AI grading & rubric feedback",
      tab: "written",
      icon: Pencil,
      color: "from-emerald-600 to-teal-600",
    };
  } else if (studySet.weakTopics.length > 0) {
    nextAction = {
      title: `Practice Weak Area: ${studySet.weakTopics[0]}`,
      desc: "Target the specific concepts where you missed questions",
      tab: "quiz",
      icon: AlertTriangle,
      color: "from-amber-600 to-orange-600",
    };
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* ── Mastery Banner & Continue CTA ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                Study Set Mastery
              </span>
              <span className="text-xs text-slate-400">
                {studySet.sources.length} sources ingested
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-4xl font-extrabold text-slate-900 dark:text-white">
                  {overallMastery}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {overallMastery >= 80
                    ? "🎉 Mastered for Exit Exams"
                    : overallMastery >= 50
                      ? "📈 Good progress — keep practicing"
                      : "🌱 Starting out — active recall recommended"}
                </span>
              </div>
            </div>

            {/* Segmented Mastery Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex">
                {totalCards > 0 ? (
                  <>
                    <div
                      style={{ width: `${(masteredCards / totalCards) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${(familiarCards / totalCards) * 100}%` }}
                      className="bg-blue-500 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${(learningCards / totalCards) * 100}%` }}
                      className="bg-amber-400 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${(unfamiliarCards / totalCards) * 100}%` }}
                      className="bg-slate-200 dark:bg-slate-700 transition-all duration-500"
                    />
                  </>
                ) : (
                  <div
                    style={{ width: `${overallMastery}%` }}
                    className="bg-blue-600 transition-all duration-500"
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <strong>{masteredCards}</strong> Mastered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  <strong>{familiarCards}</strong> Familiar
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-400" />
                  <strong>{learningCards}</strong> Learning
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <strong>{unfamiliarCards}</strong> Unfamiliar
                </span>
              </div>
            </div>
          </div>

          {/* Smart Next Step CTA Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:border-l lg:border-slate-100 lg:pl-6 dark:border-slate-800">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-800/40 min-w-[240px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Recommended Next Step
              </span>
              <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {nextAction.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {nextAction.desc}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => onNavigateTab(nextAction.tab)}
              className={cn(
                "h-auto py-3.5 px-6 font-bold text-white shadow-md transition hover:scale-102 active:scale-98 cursor-pointer bg-gradient-to-r",
                nextAction.color,
              )}
            >
              <span>Continue Studying</span>
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Weak Topics Alert (if any) ── */}
      {studySet.weakTopics.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4.5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Identified Weak Areas:
              </h4>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {studySet.weakTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-md bg-amber-100/90 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={onPracticeWeakAreas}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
          >
            Practice Weak Areas →
          </Button>
        </div>
      )}

      {/* ── All 8 Interactive Study Modes Grid ── */}
      <div>
        <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white mb-4">
          Study Modes in this Set
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Flashcards */}
          <div
            onClick={() => onNavigateTab("flashcards")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-3 group-hover:scale-110 transition">
              <Brain className="size-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">
              Flashcards
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              3D flip cards with spaced repetition mastery
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{studySet.flashcards.length} Cards</span>
              <span>{masteredCards} Mastered →</span>
            </div>
          </div>

          {/* 2. Multiple Choice Quiz */}
          <div
            onClick={() => onNavigateTab("quiz")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 mb-3 group-hover:scale-110 transition">
              <HelpCircle className="size-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">
              AI Quiz
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Exit-exam multiple choice with explanations
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-purple-600 dark:text-purple-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{totalQuizzes} Questions</span>
              <span>{quizAccuracy > 0 ? `${quizAccuracy}% Score` : "Start Quiz →"}</span>
            </div>
          </div>

          {/* 3. Written Test */}
          <div
            onClick={() => onNavigateTab("written")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-3 group-hover:scale-110 transition">
              <Pencil className="size-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">
              Written Test
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Free-response prompts with AI rubric grading
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{writtenTotal} Exercises</span>
              <span>{writtenDone > 0 ? `${writtenDone}/${writtenTotal} Graded` : "Take Test →"}</span>
            </div>
          </div>

          {/* 4. Fill in the Blanks */}
          <div
            onClick={() => onNavigateTab("fillblanks")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400 mb-3 group-hover:scale-110 transition">
              <CheckCircle2 className="size-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">
              Fill in Blanks
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Cloze sentence completion with instant check
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{fillBlanksTotal} Prompts</span>
              <span>{fillBlanksDone > 0 ? `${fillBlanksDone} Solved` : "Practice →"}</span>
            </div>
          </div>

          {/* 5. AI Study Tutor */}
          <div
            onClick={() => onNavigateTab("tutor")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-3 group-hover:scale-110 transition">
              <GraduationCap className="size-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">
              AI Study Tutor
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Grounded Socratic chat on this exact study set
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>MoE Socratic AI</span>
              <span>Ask Tutor →</span>
            </div>
          </div>

          {/* 6. Comprehensive Notes */}
          <div
            onClick={() => onNavigateTab("notes")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3 group-hover:scale-110 transition">
              <BookOpen className="size-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">
              AI Notes & Formulas
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Key concepts, definitions, formulas & tips
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{studySet.notes.keyConcepts.length} Key Concepts</span>
              <span>View Notes →</span>
            </div>
          </div>

          {/* 7. AI Podcast */}
          <div
            onClick={() => onNavigateTab("podcast")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-rose-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mb-3 group-hover:scale-110 transition">
              <Headphones className="size-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">
              AI Podcast
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Two AI hosts breakdown with synchronized audio
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-rose-600 dark:text-rose-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{studySet.podcast.durationEstimate}</span>
              <span>Listen Now →</span>
            </div>
          </div>

          {/* 8. Sources */}
          <div
            onClick={() => onNavigateTab("sources")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-slate-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 mb-3 group-hover:scale-110 transition">
              <FileText className="size-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">
              Sources & Material
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              View ingested files and add more anytime
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{studySet.sources.length} Documents</span>
              <span>Manage →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

