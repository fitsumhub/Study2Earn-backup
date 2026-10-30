import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Brain,
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  Flag,
  GraduationCap,
  HelpCircle,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Target,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ExamChapter,
  type ExamCourse,
  type MCQuestion,
  PASSING_SCORE,
  getExamQuestions,
  ETHIOPIAN_EXAM_UNIVERSITIES,
  getUniversityById,
  TOTAL_QUESTIONS_PER_COURSE,
} from "@/lib/exam-data";
import { useAuth } from "@/hooks/use-auth";
import { calculateExamXp, useExamProgress } from "@/hooks/use-exam-progress";
import { getChapterMeta } from "@/lib/chapter-meta";
import {
  clearExamSession,
  readExamSession,
  writeExamSession,
  type ActiveExamSession,
} from "@/lib/exam-session-store";
import { readIntegrityRules, recordIntegrityEvent } from "@/lib/integrity-store";
import { recordExamMistakes } from "@/lib/mistake-store";
import { cn } from "@/lib/utils";

type Phase = "intro" | "active" | "results";

const LETTERS = ["A", "B", "C", "D", "E"] as const;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function gradeLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "A+", color: "text-emerald-600" };
  if (score >= 80) return { label: "A", color: "text-emerald-600" };
  if (score >= 70) return { label: "B", color: "text-blue-600" };
  if (score >= 60) return { label: "C", color: "text-amber-600" };
  return { label: "F", color: "text-red-600" };
}

/** SVG ring that shows the score percentage */
function ScoreRing({ score, passed }: { score: number; passed: boolean }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg viewBox="0 0 128 128" className="size-40 -rotate-90">
      <circle cx="64" cy="64" r={r} className="score-ring-track" />
      <circle
        cx="64"
        cy="64"
        r={r}
        className="score-ring-fill"
        stroke={passed ? "oklch(0.53 0.18 142)" : "oklch(0.58 0.22 27)"}
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export function MockExamTaker({ course, chapter }: { course: ExamCourse; chapter: ExamChapter }) {
  const { user } = useAuth();
  const { recordAttempt, getChapterProgress } = useExamProgress();
  const chapterIndex = course.chapters.findIndex((ch) => ch.id === chapter.id);
  const meta = getChapterMeta(course, chapter, chapterIndex >= 0 ? chapterIndex : 0);
  const chapterProgress = getChapterProgress(course.id, chapter.id);
  const recordedRef = useRef(false);
  const [lastResult, setLastResult] = useState<{ xp: number; firstCompletion: boolean } | null>(
    null,
  );
  const [phase, setPhase] = useState<Phase>("intro");
  const [attemptSeed, setAttemptSeed] = useState(() => Date.now());
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set());
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "missed">("all");
  const [secondsLeft, setSecondsLeft] = useState(course.durationMinutes * 60);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [savedSession, setSavedSession] = useState<ActiveExamSession | null>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const userUniMatch = user?.university ? getUniversityById(user.university) : undefined;
  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    userUniMatch?.id || "moe-national",
  );

  useEffect(() => {
    if (user?.university) {
      const match = getUniversityById(user.university);
      if (match) setSelectedUniversity(match.id);
    }
  }, [user?.university]);

  // Look for an autosaved attempt for this chapter (client-only, after mount)
  useEffect(() => {
    const saved = readExamSession();
    if (saved && saved.courseId === course.id && saved.chapterId === chapter.id) {
      setSavedSession(saved);
      if (saved.universityId) setSelectedUniversity(saved.universityId);
    }
  }, [course.id, chapter.id]);

  const activeUni = useMemo(
    () => getUniversityById(selectedUniversity) || ETHIOPIAN_EXAM_UNIVERSITIES[0],
    [selectedUniversity],
  );

  const questions = useMemo(
    () => getExamQuestions(course, chapter, attemptSeed, selectedUniversity),
    [course, chapter, attemptSeed, selectedUniversity],
  );

  const totalSeconds = course.durationMinutes * 60;

  const submitExam = useCallback(() => {
    clearExamSession();
    setPhase("results");
  }, []);

  // Wall-clock countdown derived from the deadline — stays correct across
  // refreshes, resumes, and background-tab timer throttling.
  useEffect(() => {
    if (phase !== "active" || endsAt === null) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) submitExam();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase, endsAt, submitExam]);

  // Autosave the in-progress attempt so a refresh or crash never loses answers
  useEffect(() => {
    if (phase !== "active" || endsAt === null) return;
    writeExamSession({
      courseId: course.id,
      chapterId: chapter.id,
      attemptSeed,
      answers,
      flagged: [...flagged],
      endsAt,
      universityId: selectedUniversity,
    });
  }, [phase, endsAt, attemptSeed, answers, flagged, course.id, chapter.id, selectedUniversity]);

  const score = useMemo(() => {
    if (phase !== "results") return 0;
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) correct++;
    }
    return Math.round((correct / questions.length) * 100);
  }, [phase, questions, answers]);

  useEffect(() => {
    if (phase === "results" && !recordedRef.current) {
      recordedRef.current = true;
      clearExamSession();

      const rush = readIntegrityRules().examRush;
      const elapsedSeconds = Math.max(0, Math.round((Date.now() - attemptSeed) / 1000));
      const rushed = rush.enabled && elapsedSeconds < rush.threshold;

      const result = recordAttempt(
        course.id,
        chapter.id,
        score,
        score >= PASSING_SCORE,
        String(attemptSeed),
        { withholdXp: rushed },
      );
      recordExamMistakes(course, chapter, questions, answers);
      setLastResult(result);

      if (rushed && !result.duplicate) {
        recordIntegrityEvent({
          rule: "examRush",
          student: user?.name || "A student",
          detail: `Submitted "${chapter.title}" (${questions.length} questions) in ${elapsedSeconds}s — XP withheld`,
          penalty: result.firstCompletion
            ? calculateExamXp(score, true)
            : calculateExamXp(score, false),
          severity: "high",
        });
      }

      if (result.duplicate) {
        toast.info("This attempt was already recorded (e.g. in another tab).");
      } else if (rushed) {
        toast.warning("Submitted too quickly to review — XP withheld", {
          description: `Take at least ${rush.threshold}s so the attempt counts toward XP.`,
        });
      } else if (score >= PASSING_SCORE) {
        toast.success(
          result.firstCompletion
            ? `Chapter complete! +${result.xp} XP (includes first-pass bonus)`
            : `Exam passed! +${result.xp} XP`,
        );
      } else {
        toast.info(
          `Score: ${score}% — need ${PASSING_SCORE}% to complete. +${result.xp} XP earned.`,
        );
      }
    }
    if (phase !== "results") {
      recordedRef.current = false;
      setLastResult(null);
    }
  }, [phase, score, course, chapter, questions, answers, recordAttempt, attemptSeed, user]);

  const startExam = () => {
    setAttemptSeed(Date.now());
    setAnswers({});
    setReviewFilter("all");
    setFlagged(new Set());
    setSecondsLeft(totalSeconds);
    setEndsAt(Date.now() + totalSeconds * 1000);
    setSavedSession(null);
    setPhase("active");
  };

  const retakeExam = () => {
    setAttemptSeed(Date.now() + Math.random() * 1000);
    setAnswers({});
    setReviewFilter("all");
    setFlagged(new Set());
    setSecondsLeft(totalSeconds);
    setEndsAt(Date.now() + totalSeconds * 1000);
    setSavedSession(null);
    setPhase("active");
  };

  const resumeExam = () => {
    if (!savedSession) return;
    const remaining = Math.max(0, Math.ceil((savedSession.endsAt - Date.now()) / 1000));
    setAttemptSeed(savedSession.attemptSeed);
    setAnswers(savedSession.answers);
    setFlagged(new Set(savedSession.flagged));
    setEndsAt(savedSession.endsAt);
    setSecondsLeft(remaining);
    if (savedSession.universityId) setSelectedUniversity(savedSession.universityId);
    setSavedSession(null);
    // Clock ran out while away → grade the saved answers directly
    setPhase(remaining > 0 ? "active" : "results");
  };

  const discardSavedSession = () => {
    clearExamSession();
    setSavedSession(null);
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const scrollToQuestion = (questionId: string) => {
    questionRefs.current[questionId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const answeredCount = Object.keys(answers).length;

  const requestSubmit = () => {
    const unanswered = questions.length - answeredCount;
    if (unanswered > 0) {
      setSubmitDialogOpen(true);
      return;
    }
    submitExam();
  };

  const progressPct = (answeredCount / questions.length) * 100;
  const timerPct = (secondsLeft / totalSeconds) * 100;
  const timerCritical = secondsLeft <= 60;
  const timerWarning = secondsLeft <= totalSeconds * 0.25 && !timerCritical;

  /* ── INTRO ──────────────────────────────────────────── */
  if (phase === "intro") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          {/* Subject icon */}
          <div className="size-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 grid place-items-center mb-6">
            <BookOpen className="size-8 text-brand-gold" />
          </div>

          <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
            Chapter {chapterIndex + 1} · Ready to begin
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-brand-navy">{chapter.title}</h2>
          <p className="mt-2 text-slate-600">{meta.summary}</p>

          {chapterProgress && chapterProgress.attempts > 0 && (
            <div
              className={cn(
                "mt-4 rounded-lg px-4 py-3 text-sm border",
                chapterProgress.completed
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200",
              )}
            >
              {chapterProgress.completed
                ? `✓ Completed · Best score: ${chapterProgress.bestScore}%`
                : `Previous best: ${chapterProgress.bestScore}% — need ${PASSING_SCORE}% to complete`}
              {" · "}
              {chapterProgress.attempts} attempt{chapterProgress.attempts !== 1 ? "s" : ""}
            </div>
          )}

          {/* Autosaved attempt found — offer to resume (or grade it if time ran out) */}
          {savedSession &&
            (savedSession.endsAt > Date.now() ? (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 animate-in fade-in-0 duration-300">
                <p className="flex items-center gap-2 text-sm font-bold text-brand-navy">
                  <PlayCircle className="size-4 text-blue-600" />
                  Unfinished attempt found
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {Object.keys(savedSession.answers).length} of {course.questionsPerExam} answered ·{" "}
                  {formatTime(Math.max(0, Math.ceil((savedSession.endsAt - Date.now()) / 1000)))}{" "}
                  left — the exam clock keeps running until you submit.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={resumeExam}
                    className="bg-brand-navy hover:bg-brand-navy/90"
                  >
                    Resume exam
                  </Button>
                  <Button size="sm" variant="outline" onClick={discardSavedSession}>
                    Discard attempt
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 animate-in fade-in-0 duration-300">
                <p className="flex items-center gap-2 text-sm font-bold text-brand-navy">
                  <Clock className="size-4 text-amber-600" />
                  Time expired on your unfinished attempt
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  The clock ran out while you were away. Your{" "}
                  {Object.keys(savedSession.answers).length} saved answer
                  {Object.keys(savedSession.answers).length !== 1 ? "s" : ""} can still be graded.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={resumeExam}
                    className="bg-brand-navy hover:bg-brand-navy/90"
                  >
                    Grade saved answers
                  </Button>
                  <Button size="sm" variant="outline" onClick={discardSavedSession}>
                    Discard attempt
                  </Button>
                </div>
              </div>
            ))}

          {/* Exam stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: HelpCircle,
                label: "Questions",
                value: course.questionsPerExam,
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: Clock,
                label: "Time limit",
                value: `${course.durationMinutes} min`,
                color: "text-amber-600 bg-amber-50",
              },
              {
                icon: Target,
                label: "Pass mark",
                value: `${PASSING_SCORE}%`,
                color: "text-emerald-600 bg-emerald-50",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center"
              >
                <div
                  className={cn(
                    "size-9 rounded-full grid place-items-center mx-auto mb-2",
                    item.color,
                  )}
                >
                  <item.icon className="size-4" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 font-serif text-xl font-bold text-brand-navy">{item.value}</p>
              </div>
            ))}
          </div>

          {/* University Exam Blueprint & 10,000 Question Pool */}
          <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-slate-50/50 to-amber-50/40 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-blue-600/10 border border-blue-600/20 grid place-items-center text-blue-600">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-brand-navy">
                    University & Exam Blueprint
                  </h4>
                  <p className="text-xs text-slate-500">
                    Curriculum target for question generation & difficulty curve
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold self-start sm:self-auto">
                <Sparkles className="size-3.5 text-emerald-600" />
                <span>{TOTAL_QUESTIONS_PER_COURSE.toLocaleString()}+ Questions Pool Active</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Select University Exam Pattern
                </Label>
                <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                  <SelectTrigger className="w-full bg-white border-slate-200">
                    <SelectValue placeholder="Choose university blueprint..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ETHIOPIAN_EXAM_UNIVERSITIES.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id}>
                        <span className="font-medium">{uni.name}</span>{" "}
                        <span className="text-slate-400 text-xs">({uni.short})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs shadow-xs">
                <p className="font-semibold text-brand-navy flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-blue-600" />
                  {activeUni.name}
                </p>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  {activeUni.focus}
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                  <span>Years: {activeUni.years.join(", ")}</span>
                  <span>•</span>
                  <span>Ethiopian MoE Curriculum Standards</span>
                </div>
              </div>
            </div>
          </div>

          {/* XP reward potential */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand-gold/25 bg-brand-gold/5 px-4 py-3">
            <Coins className="size-4 shrink-0 text-brand-gold" />
            <p className="text-sm text-slate-600">
              Pass to earn{" "}
              <span className="font-bold text-brand-gold">
                up to {chapterProgress?.completed ? "100" : "200"} XP
              </span>
              {!chapterProgress?.completed && (
                <span className="text-slate-400"> · includes first-pass bonus</span>
              )}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={startExam}
              className="bg-brand-gold hover:bg-brand-gold/90 text-white shadow-md shadow-brand-gold/25 hover:scale-105 transition-all"
            >
              {savedSession ? "Start Fresh Exam" : "Start Mock Exam"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/exams/$courseId" params={{ courseId: course.id }}>
                Back to chapters
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-brand-navy">Learning objectives</h3>
          <ul className="mt-4 space-y-2.5">
            {meta.objectives.map((obj, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                {obj}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-6">
          <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2">
            <AlertCircle className="size-4 text-brand-gold" />
            Before you start
          </h3>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
            {meta.examTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 size-1.5 rounded-full bg-brand-gold shrink-0 mt-2" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  /* ── RESULTS ────────────────────────────────────────── */
  if (phase === "results") {
    const passed = score >= PASSING_SCORE;
    const grade = gradeLabel(score);
    let correctCount = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) correctCount++;
    }
    const wrongCount = questions.length - correctCount;
    const nextChapter =
      chapterIndex >= 0 && chapterIndex < course.chapters.length - 1
        ? course.chapters[chapterIndex + 1]
        : null;
    const reviewedQuestions = questions
      .map((question, index) => ({ question, index }))
      .filter(
        ({ question }) =>
          reviewFilter === "all" || answers[question.id] !== question.correctIndex,
      );

    return (
      <div className="space-y-6">
        {/* Score card */}
        <div
          className={cn(
            "rounded-2xl border p-8 text-center relative overflow-hidden",
            passed
              ? "border-emerald-200 bg-gradient-to-b from-emerald-50 to-white"
              : "border-amber-200 bg-gradient-to-b from-amber-50 to-white",
          )}
        >
          {/* Decorative blob */}
          <div
            className={cn(
              "pointer-events-none absolute -right-12 -top-12 size-40 rounded-full blur-3xl opacity-40",
              passed ? "bg-emerald-200" : "bg-amber-200",
            )}
          />

          <p className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            {passed ? "🎉 Chapter complete!" : "Keep practising"}
          </p>

          {/* SVG score ring */}
          <div className="relative inline-block">
            <ScoreRing score={score} passed={passed} />
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90">
              <span
                className={cn(
                  "font-serif text-4xl font-bold",
                  passed ? "text-emerald-700" : "text-red-600",
                )}
              >
                {score}%
              </span>
              <span className={cn("text-lg font-bold font-serif", grade.color)}>{grade.label}</span>
              <span className="text-xs text-slate-500 mt-0.5">
                {correctCount}/{questions.length}
              </span>
            </div>
          </div>

          {/* Correct / Wrong mini-stats */}
          <div className="mt-5 flex justify-center gap-6 text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
              <CheckCircle2 className="size-4" /> {correctCount} correct
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-red-500">
              <XCircle className="size-4" /> {wrongCount} wrong
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 font-medium">
              <GraduationCap className="size-3.5 text-blue-600" />
              Pattern: {activeUni.name} ({activeUni.short})
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs text-emerald-700 font-medium">
              <Sparkles className="size-3.5 text-emerald-600" />
              10,000 Questions MoE Curriculum Engine
            </span>
          </div>

          {!passed && (
            <p className="mt-2 text-xs text-slate-500">Need {PASSING_SCORE}% to mark complete</p>
          )}

          {lastResult && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-gold/10 px-3 py-1 text-sm font-bold text-brand-gold animate-in zoom-in-75 duration-500">
              +{lastResult.xp} XP earned{lastResult.firstCompletion ? " · first-pass bonus!" : ""}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {nextChapter && passed && (
              <Button
                asChild
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
              >
                <Link
                  to="/exams/$courseId/$chapterId"
                  params={{ courseId: course.id, chapterId: nextChapter.id }}
                >
                  Next:{" "}
                  {nextChapter.title.length > 24
                    ? nextChapter.title.slice(0, 24) + "…"
                    : nextChapter.title}{" "}
                  →
                </Link>
              </Button>
            )}
            <Button
              onClick={retakeExam}
              variant={passed ? "outline" : "default"}
              className={cn("gap-2", !passed && "bg-brand-navy hover:bg-brand-navy/90")}
            >
              <RotateCcw className="size-4" />
              {passed ? "Retake" : "Try again"}
            </Button>
            {wrongCount > 0 && (
              <Button
                variant="outline"
                asChild
                className="gap-2 border-brand-gold/40 text-brand-navy"
              >
                <Link to="/exams/mistakes">
                  <Brain className="size-4 text-brand-gold" />
                  Practice my {wrongCount} mistake{wrongCount !== 1 ? "s" : ""}
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/exams/$courseId" params={{ courseId: course.id }}>
                All chapters
              </Link>
            </Button>
          </div>

          {/* Next chapter teaser when not passed */}
          {nextChapter && !passed && (
            <p className="mt-4 text-xs text-slate-400">
              Pass this chapter first to unlock{" "}
              <span className="font-semibold text-slate-600">{nextChapter.title}</span>
            </p>
          )}
        </div>

        {/* Performance breakdown */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: "Grade",
              value: grade.label,
              color: grade.color,
              bg: passed ? "bg-emerald-50" : "bg-red-50",
            },
            {
              label: "Score",
              value: `${score}%`,
              color: passed ? "text-emerald-600" : "text-red-500",
              bg: passed ? "bg-emerald-50/60" : "bg-red-50/60",
            },
            {
              label: "Correct",
              value: `${correctCount}/${questions.length}`,
              color: "text-brand-navy",
              bg: "bg-blue-50",
            },
            {
              label: "XP earned",
              value: lastResult ? `+${lastResult.xp}` : "—",
              color: "text-brand-gold",
              bg: "bg-amber-50",
            },
          ].map((s) => (
            <div key={s.label} className={cn("rounded-xl p-3 text-center", s.bg)}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {s.label}
              </p>
              <p className={cn("mt-1 font-serif text-xl font-bold", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Answer review */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="font-serif text-xl font-bold text-brand-navy">Answer review</h3>
          <p className="mt-1 text-sm text-slate-500">
            Review explanations and focus on questions you missed.
          </p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter answer review">
            {([
              { id: "all", label: `All questions (${questions.length})` },
              { id: "missed", label: `Missed (${wrongCount})` },
            ] as const).map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={reviewFilter === filter.id}
                disabled={filter.id === "missed" && wrongCount === 0}
                onClick={() => setReviewFilter(filter.id)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  reviewFilter === filter.id
                    ? "border-brand-navy bg-brand-navy text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-5">
            {reviewedQuestions.map(({ question, index }) => {
              const selected = answers[question.id];
              return (
                <QuestionReview
                  key={question.id}
                  index={index + 1}
                  question={question}
                  selected={selected}
                  isCorrect={selected === question.correctIndex}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── ACTIVE EXAM ─────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {questions.length - answeredCount} unanswered question
              {questions.length - answeredCount !== 1 ? "s" : ""}. Unanswered questions count as
              incorrect. Submit anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSubmitDialogOpen(false);
                submitExam();
              }}
            >
              Submit now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sticky timer bar */}
      <div className="sticky top-16 z-20 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {chapter.title}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                <GraduationCap className="size-3" />
                {activeUni.short}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {answeredCount} of {questions.length} answered
              {flagged.size > 0 && (
                <span className="ml-2 text-amber-600 font-medium">· {flagged.size} flagged</span>
              )}
            </p>
          </div>

          {/* Countdown timer */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-bold transition-colors",
              timerCritical
                ? "bg-red-100 text-red-700 animate-pulse"
                : timerWarning
                  ? "bg-amber-100 text-amber-700"
                  : "bg-brand-navy/5 text-brand-navy",
            )}
            aria-live="polite"
          >
            <Clock className="size-5" />
            {formatTime(secondsLeft)}
          </div>
        </div>

        {/* Answer progress */}
        <Progress value={progressPct} className="mt-3 h-1.5 [&>div]:bg-brand-navy" />
        {/* Time progress */}
        <Progress
          value={timerPct}
          className={cn(
            "mt-1 h-1",
            timerCritical
              ? "[&>div]:bg-red-500"
              : timerWarning
                ? "[&>div]:bg-amber-500"
                : "[&>div]:bg-emerald-500",
          )}
        />

        {/* All answered banner */}
        {answeredCount === questions.length && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 animate-in fade-in-0 duration-300">
            <CheckCircle2 className="size-4 shrink-0" />
            All {questions.length} questions answered — ready to submit!
          </div>
        )}

        {/* Question navigator */}
        <div className="mt-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {questions.map((q, idx) => {
            const answered = answers[q.id] !== undefined;
            const isFlagged = flagged.has(q.id);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => scrollToQuestion(q.id)}
                className={cn(
                  "size-8 rounded-lg text-xs font-bold transition-all",
                  answered && !isFlagged && "bg-brand-navy text-white shadow-sm",
                  isFlagged && "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
                  !answered && !isFlagged && "bg-slate-100 text-slate-500 hover:bg-slate-200",
                )}
                title={`Question ${idx + 1}${answered ? " ✓" : ""}${isFlagged ? " 🚩" : ""}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Jump to first unanswered */}
        {answeredCount < questions.length && answeredCount > 0 && (
          <button
            type="button"
            onClick={() => {
              const first = questions.find((q) => answers[q.id] === undefined);
              if (first) scrollToQuestion(first.id);
            }}
            className="mt-2 text-[11px] font-semibold text-brand-gold hover:underline"
          >
            Jump to first unanswered →
          </button>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            ref={(el) => {
              questionRefs.current[q.id] = el;
            }}
            id={`question-${q.id}`}
          >
            <QuestionCard
              index={idx + 1}
              question={q}
              selected={answers[q.id]}
              flagged={flagged.has(q.id)}
              onToggleFlag={() => toggleFlag(q.id)}
              onSelect={(optionIndex) => setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }))}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 pb-8">
        <Button
          onClick={requestSubmit}
          disabled={answeredCount === 0}
          className="bg-brand-gold hover:bg-brand-gold/90 text-white shadow-md shadow-brand-gold/20 hover:scale-105 transition-all"
        >
          Submit Exam ({answeredCount}/{questions.length})
        </Button>
        <Button variant="outline" asChild>
          <Link to="/exams/$courseId" params={{ courseId: course.id }}>
            Save & exit
          </Link>
        </Button>
        <p className="w-full text-[11px] text-slate-400">
          Progress autosaves — you can leave and resume this exam, but the clock keeps running.
        </p>
      </div>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  selected,
  flagged,
  onToggleFlag,
  onSelect,
}: {
  index: number;
  question: MCQuestion;
  selected?: number;
  flagged?: boolean;
  onToggleFlag?: () => void;
  onSelect: (index: number) => void;
}) {
  const isAnswered = selected !== undefined;
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-6 shadow-sm transition-all",
        isAnswered
          ? "border-brand-navy/25 shadow-sm"
          : flagged
            ? "border-amber-200"
            : "border-slate-100 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-lg text-xs font-bold font-mono",
              isAnswered ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-500",
            )}
          >
            {index}
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Question {index}
          </p>
          {isAnswered && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-navy/60">
              <CheckCircle2 className="size-3" /> Answered
            </span>
          )}
        </div>
        {onToggleFlag && (
          <button
            type="button"
            onClick={onToggleFlag}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors",
              flagged
                ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
            )}
          >
            <Flag className="size-3.5" />
            {flagged ? "Flagged" : "Flag"}
          </button>
        )}
      </div>
      <p className="mt-3 font-medium text-brand-navy leading-relaxed">{question.question}</p>
      <RadioGroup
        value={selected !== undefined ? String(selected) : undefined}
        onValueChange={(v) => onSelect(Number(v))}
        className="mt-4 space-y-2.5"
      >
        {question.options.map((opt, i) => (
          <label
            key={i}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all",
              selected === i
                ? "border-brand-navy bg-brand-navy/5 ring-2 ring-brand-navy/20"
                : "border-slate-100 hover:border-slate-200 hover:bg-slate-50",
            )}
          >
            <RadioGroupItem value={String(i)} id={`${question.id}-${i}`} className="sr-only" />
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-mono transition-colors",
                selected === i ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-500",
              )}
            >
              {LETTERS[i]}
            </span>
            <Label
              htmlFor={`${question.id}-${i}`}
              className="flex-1 cursor-pointer font-normal text-sm"
            >
              {opt}
            </Label>
            {selected === i && <CheckCircle2 className="size-4 shrink-0 text-brand-navy" />}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

function QuestionReview({
  index,
  question,
  selected,
  isCorrect,
}: {
  index: number;
  question: MCQuestion;
  selected?: number;
  isCorrect: boolean;
}) {
  const skipped = selected === undefined;
  return (
    <div
      className={cn(
        "rounded-xl border-l-4 p-5 bg-white shadow-sm",
        skipped
          ? "border-l-slate-300 border border-slate-100"
          : isCorrect
            ? "border-l-emerald-500 border border-emerald-100"
            : "border-l-red-400 border border-red-100",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
            skipped ? "bg-slate-100" : isCorrect ? "bg-emerald-100" : "bg-red-100",
          )}
        >
          {skipped ? (
            <span className="text-[10px] font-bold text-slate-400">–</span>
          ) : isCorrect ? (
            <CheckCircle2 className="size-3.5 text-emerald-600" />
          ) : (
            <XCircle className="size-3.5 text-red-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Q{index}
            </p>
            {skipped && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                Not answered
              </span>
            )}
          </div>
          <p className="font-medium text-brand-navy text-sm">{question.question}</p>
          <ul className="mt-3 space-y-1.5">
            {question.options.map((opt, i) => {
              const isSelected = selected === i;
              const isAnswer = i === question.correctIndex;
              return (
                <li
                  key={i}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm border",
                    isAnswer
                      ? "bg-emerald-50 border-emerald-200 font-semibold text-emerald-800"
                      : isSelected && !isAnswer
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "border-transparent text-slate-500",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold font-mono",
                      isAnswer
                        ? "bg-emerald-200 text-emerald-800"
                        : isSelected && !isAnswer
                          ? "bg-red-200 text-red-700"
                          : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className={isSelected && !isAnswer ? "line-through" : ""}>{opt}</span>
                  {isAnswer && (
                    <span className="ml-auto text-[10px] font-bold text-emerald-600 shrink-0">
                      ✓ Correct
                    </span>
                  )}
                  {isSelected && !isAnswer && (
                    <span className="ml-auto text-[10px] font-bold text-red-500 shrink-0">
                      Your answer
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
            <Zap className="size-3.5 shrink-0 text-brand-gold mt-0.5" />
            <p className="text-xs text-slate-600">{question.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
