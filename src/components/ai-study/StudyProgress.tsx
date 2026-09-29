import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import {
  getStudyProgressStats,
  subscribeToAiChatStore,
  type StudyProgressStats,
} from "@/lib/ai-chat-store";
import { cn } from "@/lib/utils";

interface StudyProgressProps {
  onStartStudy?: () => void;
  className?: string;
}

export function StudyProgress({ onStartStudy, className }: StudyProgressProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudyProgressStats>(() => getStudyProgressStats());

  useEffect(() => {
    return subscribeToAiChatStore(() => {
      setStats(getStudyProgressStats());
    });
  }, []);

  const metrics = [
    {
      label: "Active Recall Cards Mastered",
      value: stats.cardsMastered,
      target: 50,
      icon: Layers,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      progress: Math.min(100, Math.round((stats.cardsMastered / 50) * 100)),
    },
    {
      label: "Practice Questions Answered",
      value: stats.questionsAnswered,
      target: 100,
      icon: Target,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      progress: Math.min(100, Math.round((stats.questionsAnswered / 100) * 100)),
    },
    {
      label: "Topics Deeply Explored",
      value: stats.topicsExplored,
      target: 20,
      icon: BookOpen,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
      progress: Math.min(100, Math.round((stats.topicsExplored / 20) * 100)),
    },
    {
      label: "Study Streak",
      value: `${stats.studyStreakDays} Days`,
      target: 7,
      icon: Flame,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      progress: Math.min(100, Math.round((stats.studyStreakDays / 7) * 100)),
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-navy dark:text-white">
            Study Progress & Exam Readiness
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time tracking of questions solved, flashcard mastery, and active recall streak.
          </p>
        </div>

        {/* Total Time & XP */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <Clock className="size-4 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Study Time</p>
              <p className="text-xs font-bold text-brand-navy dark:text-white">
                {stats.activeHours} hrs logged
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-brand-gold/30 bg-brand-gold/10 px-3.5 py-2">
            <Sparkles className="size-4 text-brand-gold" />
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-800 dark:text-brand-gold">
                Earned XP
              </p>
              <p className="text-xs font-bold text-amber-900 dark:text-white">
                {user?.xp ? user.xp.toLocaleString() : "1,240"} XP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    m.bg,
                    m.color,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {m.progress}% of goal
                </span>
              </div>

              <p className="font-serif text-2xl font-bold text-brand-navy dark:text-white">
                {m.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{m.label}</p>

              <div className="mt-3">
                <Progress value={m.progress} className="h-1.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended Study Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-brand-gold/30 bg-gradient-to-r from-amber-500/10 via-brand-gold/5 to-transparent p-6 shadow-xs dark:border-brand-gold/20 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gold text-slate-950 font-bold shadow-xs">
            <Trophy className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 dark:text-brand-gold">
                Recommended Action
              </span>
              <span className="text-xs text-slate-400">Exit Exam Milestone</span>
            </div>
            <h3 className="mt-1 font-serif text-base font-bold text-brand-navy dark:text-white">
              Take a 10-Question Exit Exam Mock in Physics or Calculus
            </h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              Complete your daily practice set to maintain your {stats.studyStreakDays}-day study
              streak and earn +50 bonus XP.
            </p>
          </div>
        </div>

        {onStartStudy && (
          <Button
            type="button"
            onClick={onStartStudy}
            className="rounded-xl bg-brand-navy px-5 py-2 font-bold text-white hover:bg-brand-navy/90 shadow-xs dark:bg-brand-gold dark:text-slate-950 shrink-0"
          >
            Start Practice
            <ArrowRight className="ml-1.5 size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

