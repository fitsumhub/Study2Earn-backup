import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  Layers,
  MessageSquare,
  Radio,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { STUDY_TRACK_LABELS } from "@/lib/auth-data";
import { cn } from "@/lib/utils";
import { AiProviderSettingsModal } from "./AiProviderSettingsModal";

export type AIStudyActiveView = "sets" | "chat" | "tools" | "upload" | "progress";

interface AIStudyHeaderProps {
  activeView: AIStudyActiveView;
  onViewChange: (view: AIStudyActiveView) => void;
  onStartStudyingWithAi: () => void;
  aiReady: boolean;
  className?: string;
}

export function AIStudyHeader({
  activeView,
  onViewChange,
  onStartStudyingWithAi,
  aiReady,
  className,
}: AIStudyHeaderProps) {
  const { loggedIn, user } = useAuth();
  const { balance: xpBalance } = useWallet();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const trackLabel = user?.studyTrack ? STUDY_TRACK_LABELS[user.studyTrack] : null;

  return (
    <div className={cn("w-full", className)}>
      {/* ── 2026/2030 Hero Banner ── */}
      <div
        className="relative overflow-hidden border-b border-slate-800 px-6 py-12 text-white shadow-xl"
        style={{
          backgroundColor: "#0b101b",
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(217, 119, 6, 0.12) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(30, 58, 138, 0.25) 0%, transparent 50%), radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 100% 100%, 24px 24px",
        }}
      >
        <div className="relative mx-auto max-w-6xl">
          {/* Top personalization bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {loggedIn && user ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-xs">
                    👋 Welcome back, <strong className="text-white">{user.name}</strong>
                    {user.university ? ` · ${user.university}` : ""}
                  </span>
                  {trackLabel && (
                    <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-300">
                      {trackLabel}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 rounded-full border border-brand-gold/40 bg-brand-gold/15 px-3 py-1 text-xs font-bold text-brand-gold">
                    <Sparkles className="size-3" />
                    {xpBalance ? xpBalance.toLocaleString() : (user.xp?.toLocaleString() || "1,240")} XP
                  </span>
                </>
              ) : (
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                  🇪🇹 Ethiopian University Study Suite · Freshman & Exit Exam Edition
                </span>
              )}
            </div>

            {/* Clickable AI Provider Status Pill */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-xs transition hover:scale-105 active:scale-95 cursor-pointer",
                aiReady
                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300 hover:border-emerald-400/60"
                  : "border-brand-gold/30 bg-brand-gold/15 text-amber-300 hover:border-brand-gold/60",
              )}
              title="Click to configure AI provider & API key"
            >
              {aiReady ? <Zap className="size-3.5 text-emerald-400" /> : <Brain className="size-3.5 text-brand-gold" />}
              <span>{aiReady ? "Real AI Provider Active" : "Curriculum Engine (Connect API)"}</span>
              <Settings className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Hero Headline & CTA */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mt-6">
            <div className="max-w-2xl space-y-3">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white tracking-tight">
                Master any topic with your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-brand-gold to-yellow-200">
                  AI Study Copilot.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-xl">
                Chat with an intelligent tutor, generate 3D flashcards, take Exit Exam mocks, or distill
                PDF lecture notes in seconds.
              </p>
            </div>

            {/* PRIMARY HERO ACTION */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                type="button"
                size="lg"
                onClick={onStartStudyingWithAi}
                className="group relative h-14 rounded-2xl bg-gradient-to-r from-amber-500 via-brand-gold to-amber-600 px-8 font-serif text-base font-bold text-slate-950 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-amber-500/30 active:scale-[0.98]"
              >
                <Sparkles className="mr-2 size-5 fill-slate-950 animate-pulse" />
                <span>Start Studying with AI</span>
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation / Mode Switcher Rail ── */}
      <div className="border-b border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 sticky top-16 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between overflow-x-auto no-scrollbar px-6">
          <div className="flex items-center gap-1 sm:gap-2 py-2">
            {[
              {
                id: "sets",
                label: "Study Sets",
                icon: Layers,
                badge: "Studley AI",
              },
              {
                id: "chat",
                label: "AI Study Assistant",
                icon: MessageSquare,
                badge: "Live Chat",
              },
              {
                id: "tools",
                label: "Study Tools",
                icon: Brain,
                badge: "8 Tools",
              },
              {
                id: "progress",
                label: "Progress & Saved",
                icon: FileCheck2,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onViewChange(tab.id as AIStudyActiveView)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all",
                    isActive
                      ? "bg-brand-navy text-white shadow-xs dark:bg-brand-gold dark:text-slate-950"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                  )}
                >
                  <Icon className={cn("size-4", isActive ? "text-brand-gold dark:text-slate-950" : "text-slate-400")} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.2 text-[10px] font-bold",
                        isActive
                          ? "bg-white/20 text-white dark:bg-slate-900/30 dark:text-slate-950"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
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
      </div>

      {/* AI Provider Settings Modal */}
      <AiProviderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

