import { Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Clock, RotateCcw, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  type ExamChapter,
  type ExamCourse,
  type MCQuestion,
  PASSING_SCORE,
  getExamQuestions,
} from "@/lib/exam-data";
import { useExamProgress } from "@/hooks/use-exam-progress";
import { getChapterMeta } from "@/lib/chapter-meta";
import { cn } from "@/lib/utils";

type Phase = "intro" | "active" | "results";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MockExamTaker({ course, chapter }: { course: ExamCourse; chapter: ExamChapter }) {
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
  const [secondsLeft, setSecondsLeft] = useState(course.durationMinutes * 60);

  const questions = useMemo(
    () => getExamQuestions(course, chapter, attemptSeed),
    [course, chapter, attemptSeed],
  );

  const totalSeconds = course.durationMinutes * 60;

  const submitExam = useCallback(() => {
    setPhase("results");
  }, []);

  useEffect(() => {
    if (phase !== "active") return;
    if (secondsLeft <= 0) {
      submitExam();
      return;
    }
    const id = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [phase, secondsLeft, submitExam]);

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
      const result = recordAttempt(course.id, chapter.id, score, score >= PASSING_SCORE);
      setLastResult(result);
      if (score >= PASSING_SCORE) {
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
  }, [phase, score, course.id, chapter.id, recordAttempt]);

  const startExam = () => {
    setAttemptSeed(Date.now());
    setAnswers({});
    setSecondsLeft(totalSeconds);
    setPhase("active");
  };

  const retakeExam = () => {
    setAttemptSeed(Date.now() + Math.random() * 1000);
    setAnswers({});
    setSecondsLeft(totalSeconds);
    setPhase("active");
  };

  const answeredCount = Object.keys(answers).length;
  const progressPct = (answeredCount / questions.length) * 100;
  const timerPct = (secondsLeft / totalSeconds) * 100;
  const timerUrgent = secondsLeft <= 60;

  if (phase === "intro") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
            Chapter {chapterIndex + 1} · Ready to begin
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-brand-navy">{chapter.title}</h2>
          <p className="mt-2 text-slate-600">{meta.summary}</p>

          {chapterProgress && chapterProgress.attempts > 0 && (
            <div
              className={cn(
                "mt-4 rounded-lg px-4 py-3 text-sm",
                chapterProgress.completed
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-800",
              )}
            >
              {chapterProgress.completed
                ? `Completed · Best score: ${chapterProgress.bestScore}%`
                : `Previous best: ${chapterProgress.bestScore}% — need ${PASSING_SCORE}% to complete`}
              {" · "}
              {chapterProgress.attempts} attempt{chapterProgress.attempts !== 1 ? "s" : ""}
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Questions", value: course.questionsPerExam },
              { label: "Time limit", value: `${course.durationMinutes} min` },
              { label: "Pass mark", value: `${PASSING_SCORE}%` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 font-serif text-xl font-bold text-brand-navy">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={startExam} className="bg-brand-navy hover:bg-brand-navy/90">
              Start Mock Exam
            </Button>
            <Button variant="outline" asChild>
              <Link to="/exams/$courseId" params={{ courseId: course.id }}>
                Back to chapters
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-brand-navy">Learning objectives</h3>
          <ul className="mt-4 space-y-2">
            {meta.objectives.map((obj, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-gold" />
                {obj}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
          <h3 className="text-sm font-bold text-brand-navy">Before you start</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {meta.examTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-brand-gold" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    const passed = score >= PASSING_SCORE;
    let correctCount = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) correctCount++;
    }

    return (
      <div className="space-y-6">
        <div
          className={cn(
            "rounded-2xl border p-8 text-center",
            passed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
          )}
        >
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Your score</p>
          <p className="mt-2 font-serif text-6xl font-bold text-brand-navy">{score}%</p>
          <p className="mt-2 text-slate-600">
            {correctCount} of {questions.length} correct
            {passed ? " — Chapter marked complete!" : ` — Need ${PASSING_SCORE}% to complete`}
          </p>
          {lastResult && (
            <p className="mt-1 text-sm font-semibold text-brand-gold">+{lastResult.xp} XP earned</p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={retakeExam} className="gap-2 bg-brand-navy hover:bg-brand-navy/90">
              <RotateCcw className="size-4" />
              Retake with new questions
            </Button>
            <Button variant="outline" asChild>
              <Link to="/exams/$courseId" params={{ courseId: course.id }}>
                Back to chapters
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="font-serif text-xl font-bold text-brand-navy">Answer review</h3>
          <p className="mt-1 text-sm text-slate-500">
            Review each question with the correct answer highlighted.
          </p>
          <div className="mt-6 space-y-6">
            {questions.map((q, idx) => {
              const selected = answers[q.id];
              const isCorrect = selected === q.correctIndex;
              return (
                <QuestionReview
                  key={q.id}
                  index={idx + 1}
                  question={q}
                  selected={selected}
                  isCorrect={isCorrect}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky timer bar */}
      <div className="sticky top-16 z-20 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {chapter.title}
            </p>
            <p className="text-sm text-slate-600">
              Question {answeredCount} of {questions.length} answered
            </p>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold",
              timerUrgent ? "bg-red-100 text-red-700" : "bg-brand-navy/5 text-brand-navy",
            )}
          >
            <Clock className="size-5" />
            {formatTime(secondsLeft)}
          </div>
        </div>
        <Progress value={progressPct} className="mt-3 h-1.5" />
        <Progress
          value={timerPct}
          className={cn("mt-1 h-1", timerUrgent && "[&>div]:bg-red-500")}
        />
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            index={idx + 1}
            question={q}
            selected={answers[q.id]}
            onSelect={(optionIndex) => setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }))}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3 pb-8">
        <Button
          onClick={submitExam}
          disabled={answeredCount === 0}
          className="bg-brand-gold hover:bg-brand-gold/90 text-white"
        >
          Submit Exam ({answeredCount}/{questions.length})
        </Button>
        <Button variant="outline" asChild>
          <Link to="/exams/$courseId" params={{ courseId: course.id }}>
            Exit without submitting
          </Link>
        </Button>
      </div>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  selected,
  onSelect,
}: {
  index: number;
  question: MCQuestion;
  selected?: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Question {index}</p>
      <p className="mt-2 font-medium text-brand-navy">{question.question}</p>
      <RadioGroup
        value={selected !== undefined ? String(selected) : undefined}
        onValueChange={(v) => onSelect(Number(v))}
        className="mt-4 space-y-3"
      >
        {question.options.map((opt, i) => (
          <label
            key={i}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
              selected === i
                ? "border-brand-navy bg-brand-navy/5"
                : "border-slate-100 hover:border-slate-200 hover:bg-slate-50",
            )}
          >
            <RadioGroupItem value={String(i)} id={`${question.id}-${i}`} />
            <Label htmlFor={`${question.id}-${i}`} className="flex-1 cursor-pointer font-normal">
              {opt}
            </Label>
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
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        isCorrect ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50",
      )}
    >
      <div className="flex items-start gap-3">
        {isCorrect ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        ) : (
          <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Question {index}
          </p>
          <p className="mt-1 font-medium text-brand-navy">{question.question}</p>
          <ul className="mt-3 space-y-2">
            {question.options.map((opt, i) => {
              const isSelected = selected === i;
              const isAnswer = i === question.correctIndex;
              return (
                <li
                  key={i}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    isAnswer && "bg-emerald-100 font-semibold text-emerald-800",
                    isSelected && !isAnswer && "bg-red-100 text-red-800 line-through",
                    !isSelected && !isAnswer && "text-slate-600",
                  )}
                >
                  {opt}
                  {isAnswer && " ✓"}
                  {isSelected && !isAnswer && " (your answer)"}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-500">{question.explanation}</p>
        </div>
      </div>
    </div>
  );
}
