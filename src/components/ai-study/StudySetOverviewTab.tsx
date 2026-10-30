import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Flame,
  GraduationCap,
  HelpCircle,
  Layers,
  Lightbulb,
  ListChecks,
  Loader2,
  Network,
  Pencil,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useIntegrations } from "@/hooks/use-integrations";
import { generateOverviewFn } from "@/lib/api/ai-study.functions";
import { updateStudySet, type StudySet } from "@/lib/study-set-store";
import { cn } from "@/lib/utils";

interface StudySetOverviewTabProps {
  studySet: StudySet;
  onNavigateTab: (tab: string) => void;
  onPracticeWeakAreas: () => void;
  onStudySetUpdated?: () => void;
}

export function StudySetOverviewTab({
  studySet,
  onNavigateTab,
  onPracticeWeakAreas,
  onStudySetUpdated,
}: StudySetOverviewTabProps) {
  const { config: integrations } = useIntegrations();
  const [isGenerating, setIsGenerating] = useState(false);

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
  const overview = studySet.overview;

  const handleGenerateOverview = async () => {
    setIsGenerating(true);
    try {
      const activeProvider = integrations.aiStudy.provider || "gemini";
      const settings = integrations.aiStudy.providers?.[activeProvider];
      const apiKey = settings?.apiKey?.trim() || integrations.aiStudy.apiKey?.trim();

      const contextText = studySet.sources
        ?.map((s) => s.contentSnippet || s.fullText)
        .filter(Boolean)
        .join("\n\n");

      const res = await generateOverviewFn({
        data: {
          title: studySet.title,
          subject: studySet.subject,
          courseCode: studySet.courseCode,
          contextText: contextText ? contextText.slice(0, 10000) : undefined,
          provider: activeProvider,
          apiKey: apiKey || undefined,
          baseUrl: settings?.baseUrl || undefined,
          model: settings?.model || undefined,
        },
      });

      if (res?.overview) {
        updateStudySet(studySet.id, { overview: res.overview });
        onStudySetUpdated?.();
        toast.success("Structured topic overview generated with Google Gemini!");
      }
    } catch (err) {
      console.error("Overview generation error:", err);
      toast.error("Failed to generate overview. Please check your Gemini API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Smart Academic Recommendation Algorithm
  let nextAction = {
    title: "Review Flashcards",
    desc: "Solidify conceptual definitions and core axioms with active recall.",
    tab: "flashcards",
    icon: Brain,
    badgeText: "Recommended First Step",
    color: "from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-800",
  };

  if (masteredCards > 0 && quizAccuracy === 0 && totalQuizzes > 0) {
    nextAction = {
      title: "Take Multiple-Choice Quiz",
      desc: "Simulate exit-exam conditions with timed active recall questions.",
      tab: "quiz",
      icon: HelpCircle,
      badgeText: "Exam Simulation",
      color: "from-purple-600 via-purple-500 to-purple-700 hover:from-purple-500 hover:to-purple-800",
    };
  } else if (quizAccuracy > 0 && writtenDone < writtenTotal && writtenTotal > 0) {
    nextAction = {
      title: "Practice Free-Response Test",
      desc: "Draft rigorous long-form answers evaluated by university AI rubrics.",
      tab: "written",
      icon: Pencil,
      badgeText: "Synthesis Practice",
      color: "from-emerald-600 via-emerald-500 to-emerald-700 hover:from-emerald-500 hover:to-emerald-800",
    };
  } else if (studySet.weakTopics.length > 0) {
    nextAction = {
      title: `Remediate: ${studySet.weakTopics[0]}`,
      desc: "Target specific misconceptions identified in your latest evaluation.",
      tab: "quiz",
      icon: AlertTriangle,
      badgeText: "Targeted Remediation",
      color: "from-rose-600 via-rose-500 to-rose-700 hover:from-rose-500 hover:to-rose-800",
    };
  } else if (overallMastery >= 80) {
    nextAction = {
      title: "Review Cheat Sheet",
      desc: "Finalize formula retention and review invariant laws before exam day.",
      tab: "summary",
      icon: Zap,
      badgeText: "Final Revision",
      color: "from-orange-600 via-orange-500 to-orange-700 hover:from-orange-500 hover:to-orange-800",
    };
  }

  const studyModes = [
    {
      id: "flashcards",
      title: "Flashcards",
      badge: `${totalCards} Cards`,
      status: masteredCards > 0 ? `${masteredCards} Mastered` : "Active Recall",
      desc: "3D perspective flip cards with Leitner spaced repetition system.",
      icon: Brain,
      tag: "Memorization",
      theme: {
        border: "border-amber-200/80 hover:border-amber-400 dark:border-amber-900/50 dark:hover:border-amber-600",
        badgeBg: "bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40",
        iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
        arrowColor: "text-amber-600 dark:text-amber-400",
      },
    },
    {
      id: "quiz",
      title: "Multiple Choice Quiz",
      badge: `${totalQuizzes} Questions`,
      status: quizAccuracy > 0 ? `${quizAccuracy}% Score` : "Exit Exam Style",
      desc: "Timed diagnostic multiple-choice questions with Socratic feedback.",
      icon: HelpCircle,
      tag: "Diagnostic",
      theme: {
        border: "border-purple-200/80 hover:border-purple-400 dark:border-purple-900/50 dark:hover:border-purple-600",
        badgeBg: "bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40",
        iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
        arrowColor: "text-purple-600 dark:text-purple-400",
      },
    },
    {
      id: "written",
      title: "Written Test",
      badge: `${writtenTotal} Exercises`,
      status: writtenDone > 0 ? `${writtenDone}/${writtenTotal} Graded` : "Rubric Graded",
      desc: "Free-response problem sets evaluated against academic benchmarks.",
      icon: Pencil,
      tag: "Deep Reasoning",
      theme: {
        border: "border-emerald-200/80 hover:border-emerald-400 dark:border-emerald-900/50 dark:hover:border-emerald-600",
        badgeBg: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40",
        iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
        arrowColor: "text-emerald-600 dark:text-emerald-400",
      },
    },
    {
      id: "fillblanks",
      title: "Fill in the Blanks",
      badge: `${fillBlanksTotal} Prompts`,
      status: fillBlanksDone > 0 ? `${fillBlanksDone} Solved` : "Cloze Recall",
      desc: "Precision cloze retrieval exercises to test exact technical vocabulary.",
      icon: CheckCircle2,
      tag: "Precision Recall",
      theme: {
        border: "border-cyan-200/80 hover:border-cyan-400 dark:border-cyan-900/50 dark:hover:border-cyan-600",
        badgeBg: "bg-cyan-50 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-800/40",
        iconBg: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400",
        arrowColor: "text-cyan-600 dark:text-cyan-400",
      },
    },
    {
      id: "notes",
      title: "Summarize Notes",
      badge: `${studySet.notes?.keyConcepts?.length || 4} Units`,
      status: "Manuscript View",
      desc: "Comprehensive syllabus synthesis, formulas, diagrams, and examiner traps.",
      icon: FileText,
      tag: "Syllabus Notes",
      theme: {
        border: "border-indigo-200/80 hover:border-indigo-400 dark:border-indigo-900/50 dark:hover:border-indigo-600",
        badgeBg: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40",
        iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
        arrowColor: "text-indigo-600 dark:text-indigo-400",
      },
    },
    {
      id: "summary",
      title: "Cheat Sheet",
      badge: `${studySet.notes?.formulasAndRules?.length || 3} Formulas`,
      status: "High-Yield Handout",
      desc: "Executive technical reference card with formulas, laws, and check criteria.",
      icon: Zap,
      tag: "Rapid Reference",
      theme: {
        border: "border-orange-200/80 hover:border-orange-400 dark:border-orange-900/50 dark:hover:border-orange-600",
        badgeBg: "bg-orange-50 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/40",
        iconBg: "bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400",
        arrowColor: "text-orange-600 dark:text-orange-400",
      },
    },
    {
      id: "tutor",
      title: "Deep Learning AI Copilot",
      badge: "6 Interactive Tools",
      status: "Gemini Tutor",
      desc: "Socratic Q&A, Step-by-Step breakdowns, Concept Comparisons & Revision Scheduler.",
      icon: Sparkles,
      tag: "Cognitive Acceleration",
      theme: {
        border: "border-blue-200/80 hover:border-blue-400 dark:border-blue-900/50 dark:hover:border-blue-600",
        badgeBg: "bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40",
        iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
        arrowColor: "text-blue-600 dark:text-blue-400",
      },
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* ── Oxford Scholarly Mastery Deck ── */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left: Mastery Index & Segments */}
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
                <GraduationCap className="size-3.5" />
                Academic Mastery Index
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {studySet.sources.length} Verified Sources Ingested
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-3.5">
                <span className="font-serif text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {overallMastery}%
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {overallMastery >= 80 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Trophy className="size-4 inline" /> Exit Exam Benchmark Met
                    </span>
                  ) : overallMastery >= 50 ? (
                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Flame className="size-4 inline text-amber-500" /> Proficient — Continuing Synthesis
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">
                      Foundational Stage — Active Recall Recommended
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Segmented Mastery Bar */}
            <div className="space-y-2 pt-1 max-w-xl">
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex shadow-inner">
                {totalCards > 0 ? (
                  <>
                    <div
                      style={{ width: `${(masteredCards / totalCards) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`${masteredCards} Mastered`}
                    />
                    <div
                      style={{ width: `${(familiarCards / totalCards) * 100}%` }}
                      className="bg-blue-500 transition-all duration-500"
                      title={`${familiarCards} Familiar`}
                    />
                    <div
                      style={{ width: `${(learningCards / totalCards) * 100}%` }}
                      className="bg-amber-400 transition-all duration-500"
                      title={`${learningCards} Learning`}
                    />
                    <div
                      style={{ width: `${(unfamiliarCards / totalCards) * 100}%` }}
                      className="bg-slate-200 dark:bg-slate-700 transition-all duration-500"
                      title={`${unfamiliarCards} Unfamiliar`}
                    />
                  </>
                ) : (
                  <div
                    style={{ width: `${overallMastery}%` }}
                    className="bg-blue-600 transition-all duration-500"
                  />
                )}
              </div>

              {/* Legend with exact metrics */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <strong className="text-slate-800 dark:text-slate-200">{masteredCards}</strong> Mastered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  <strong className="text-slate-800 dark:text-slate-200">{familiarCards}</strong> Familiar
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-400" />
                  <strong className="text-slate-800 dark:text-slate-200">{learningCards}</strong> Learning
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <strong className="text-slate-800 dark:text-slate-200">{unfamiliarCards}</strong> Unreviewed
                </span>
              </div>
            </div>
          </div>

          {/* Right: Academic Next Action Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:border-l lg:border-slate-200/80 lg:pl-8 dark:border-slate-800 shrink-0">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4.5 dark:border-slate-800/80 dark:bg-slate-800/40 min-w-[260px] max-w-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {nextAction.badgeText}
                </span>
                <Sparkles className="size-3 text-amber-500" />
              </div>
              <h4 className="font-serif text-sm font-bold text-slate-900 dark:white">
                {nextAction.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {nextAction.desc}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => onNavigateTab(nextAction.tab)}
              className={cn(
                "h-auto py-3.5 px-6 font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg cursor-pointer bg-gradient-to-r rounded-2xl",
                nextAction.color,
              )}
            >
              <span>Continue Studying</span>
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Targeted Misconceptions & Weak Topics Alert ── */}
      {studySet.weakTopics.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-200/90 bg-amber-50/60 p-4.5 dark:border-amber-900/40 dark:bg-amber-950/20 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <AlertTriangle className="size-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Targeted Misconceptions Detected:
              </h4>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                Questions on these topics were missed in recent quiz sessions:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {studySet.weakTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-lg bg-amber-100/90 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
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
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Practice Weak Areas →
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          AI STRUCTURED OVERVIEW OF THE TOPIC
      ══════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Header ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 px-6 py-5 bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <BookOpen className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  Structured Topic Overview
                </h3>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
                  <Zap className="size-3 text-emerald-500" />
                  Google Gemini Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rigorous curriculum taxonomy, governing principles, and mental model hierarchy
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleGenerateOverview}
            disabled={isGenerating}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Synthesizing with Gemini...
              </>
            ) : overview ? (
              <>
                <RefreshCw className="size-3.5 mr-1.5" />
                Regenerate with Gemini
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 mr-1.5 text-amber-300" />
                Generate Overview with Gemini
              </>
            )}
          </Button>
        </div>

        {/* Overview Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {overview ? (
            <>
              {/* 1. Academic Context */}
              {overview.academicContext && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 mb-2">
                    <GraduationCap className="size-4 text-blue-600" />
                    Academic Context & Disciplinary Foundations
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {overview.academicContext}
                  </p>
                </div>
              )}

              {/* 2. Targeted Learning Objectives */}
              {overview.learningObjectives && overview.learningObjectives.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-serif text-sm font-bold text-slate-900 dark:text-white">
                    <Target className="size-4 text-indigo-500" />
                    Targeted Learning Objectives (Bloom's Taxonomy)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {overview.learningObjectives.map((obj, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <CheckCircle2 className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {obj}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Mental Model Hierarchy */}
              {overview.mentalModelHierarchy && overview.mentalModelHierarchy.length > 0 && (
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-serif text-sm font-bold text-slate-900 dark:text-white">
                    <Layers className="size-4 text-purple-500" />
                    Mental Model Hierarchy & Modular Taxonomy
                  </h4>
                  <div className="space-y-3">
                    {overview.mentalModelHierarchy.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                            {item.unit}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {item.topic}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {item.concepts.map((concept, cIdx) => (
                            <div
                              key={cIdx}
                              className="rounded-xl border border-white bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 text-xs space-y-1"
                            >
                              <p className="font-bold text-slate-900 dark:text-white">
                                {concept.name}
                              </p>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                                {concept.details}
                              </p>
                              {concept.exampleOrApplication && (
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                                  💡 {concept.exampleOrApplication}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Core Principles & System Axioms */}
              {overview.keyPrinciples && overview.keyPrinciples.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-serif text-sm font-bold text-slate-900 dark:text-white">
                    <ShieldCheckIcon className="size-4 text-emerald-500" />
                    System Invariants & Governing Principles
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {overview.keyPrinciples.map((principle, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-3.5 text-xs text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200"
                      >
                        <p className="font-semibold leading-relaxed">
                          • {principle}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Essential Definitions & Lexicon */}
              {overview.importantDefinitions && overview.importantDefinitions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-serif text-sm font-bold text-slate-900 dark:text-white">
                    <BookOpen className="size-4 text-amber-500" />
                    Canonical Terminology & Definitions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {overview.importantDefinitions.map((def, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200/80 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900 space-y-1 shadow-2xs"
                      >
                        <span className="font-bold text-slate-900 dark:text-white">
                          {def.term}
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          {def.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Major Theories & Models */}
              {overview.majorTheoriesAndModels && overview.majorTheoriesAndModels.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-serif text-sm font-bold text-slate-900 dark:text-white">
                    <Compass className="size-4 text-cyan-500" />
                    Canonical Theories & Computational Models
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {overview.majorTheoriesAndModels.map((theory, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-cyan-200/70 bg-cyan-50/30 p-3.5 text-xs dark:border-cyan-900/40 dark:bg-cyan-950/20 space-y-1.5"
                      >
                        <p className="font-bold text-cyan-950 dark:text-cyan-200">
                          {theory.name}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          {theory.description}
                        </p>
                        <p className="text-[10px] font-semibold text-cyan-800 dark:text-cyan-300">
                          <strong>Core Premise:</strong> {theory.corePremise}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Concept Relationships & Dependencies */}
              {overview.conceptRelationships && overview.conceptRelationships.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-serif text-sm font-bold text-slate-900 dark:text-white">
                    <Network className="size-4 text-rose-500" />
                    Conceptual Interdependencies & Relationships
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {overview.conceptRelationships.map((rel, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-850 space-y-1"
                      >
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                          <span>{rel.sourceConcept}</span>
                          <span className="text-rose-500">→</span>
                          <span>{rel.targetConcept}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          {rel.relationship}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. Exam Relevant Areas & Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {overview.examRelevantAreas && overview.examRelevantAreas.length > 0 && (
                  <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4.5 dark:border-rose-900/40 dark:bg-rose-950/20 space-y-2">
                    <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200">
                      <Target className="size-4 text-rose-600" />
                      High-Yield Exit Exam Areas
                    </h5>
                    <ul className="space-y-1.5 text-xs text-rose-950 dark:text-rose-200">
                      {overview.examRelevantAreas.map((area, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-600 font-bold">•</span>
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {overview.keyTakeaways && overview.keyTakeaways.length > 0 && (
                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4.5 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-2">
                    <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                      <Award className="size-4 text-amber-600" />
                      Executive Takeaways
                    </h5>
                    <ul className="space-y-1.5 text-xs text-amber-950 dark:text-amber-200">
                      {overview.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">✓</span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Sparkles className="size-7 text-amber-400" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  Synthesize Structured Overview with Google Gemini
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generate a complete academic syllabus overview for <strong>{studySet.title}</strong>, including Bloom's Taxonomy learning objectives, mental models, governing theorems, and exam priorities.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleGenerateOverview}
                disabled={isGenerating}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs rounded-xl h-10 px-6 shadow-sm cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Generating Overview with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-2 text-amber-300" />
                    Generate Structured Overview
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── Academic Study Modes Grid (All 6 Modes) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="size-5 text-blue-600 dark:text-blue-400" />
              Syllabus Study Modes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Six synchronized learning instruments tailored for deep conceptual retention
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {studyModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                role="button"
                tabIndex={0}
                onClick={() => onNavigateTab(mode.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onNavigateTab(mode.id);
                  }
                }}
                className={cn(
                  "group relative flex flex-col justify-between rounded-2xl border bg-white p-5.5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:bg-slate-900 cursor-pointer select-none",
                  mode.theme.border,
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                        mode.theme.iconBg,
                      )}
                    >
                      <Icon className="size-5.5" />
                    </div>

                    <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", mode.theme.badgeBg)}>
                      {mode.tag}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {mode.title}
                  </h4>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300 font-bold">
                    {mode.badge}
                  </span>
                  <span className={cn("flex items-center gap-1 group-hover:translate-x-1 transition-transform", mode.theme.arrowColor)}>
                    <span>{mode.status}</span>
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Spaced Repetition & Study Guidelines Card ── */}
      <section className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <Target className="size-4 text-brand-navy dark:text-blue-400" />
            <span>Collegiate Retention Strategy:</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
            <span>1. Read Notes & Cheat Sheet</span>
            <span>→</span>
            <span>2. Master Flashcards</span>
            <span>→</span>
            <span>3. Drill Multiple Choice</span>
            <span>→</span>
            <span>4. Complete Written Prompts</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
