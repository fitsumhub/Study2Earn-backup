import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AIChat } from "@/components/ai-study/AIChat";
import { AIStudyHeader, type AIStudyActiveView } from "@/components/ai-study/AIStudyHeader";
import { ProcessingStep } from "@/components/ai-study/ProcessingStep";
import { RecentSessions } from "@/components/ai-study/RecentSessions";
import { ResultsStep } from "@/components/ai-study/ResultsStep";
import { SavedResponses } from "@/components/ai-study/SavedResponses";
import {
  StudySetDetailWorkspace,
  type StudySetTabKey,
} from "@/components/ai-study/StudySetDetailWorkspace";
import { StudySetLibrary } from "@/components/ai-study/StudySetLibrary";
import { StudyProgress } from "@/components/ai-study/StudyProgress";
import { StudyToolsGrid } from "@/components/ai-study/StudyToolsGrid";
import { UploadMaterial } from "@/components/ai-study/UploadMaterial";
import { ComingSoonGate } from "@/components/coming-soon-gate";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { useAiStudyFlow } from "@/hooks/use-ai-study-flow";
import { getStudySetById, subscribeStudySets } from "@/lib/study-set-store";

export const Route = createFileRoute("/ai-study")({
  head: () => ({
    meta: [
      { title: "AI Study Sets & Copilot — Study2Earn" },
      {
        name: "description",
        content:
          "Studley-style AI Study Sets platform for Ethiopian university students. One source material creates 3D flashcards, Exit Exam quizzes, written evaluations, audio podcasts, and grounded AI tutor.",
      },
    ],
  }),
  component: AiStudyPage,
});

function AiStudyPage() {
  const flow = useAiStudyFlow();
  const [activeView, setActiveView] = useState<AIStudyActiveView>("sets");
  const [activeStudySetId, setActiveStudySetId] = useState<string | null>(null);
  const [activeSetTab, setActiveSetTab] = useState<StudySetTabKey>("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>();
  const [chatInitialCourse, setChatInitialCourse] = useState<string | undefined>();
  const [chatInitialTool, setChatInitialTool] = useState<string | undefined>();

  // Deep linking: read ?set=<id>&tab=<tab> on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const setId = params.get("set");
      const tab = params.get("tab") as StudySetTabKey | null;
      if (setId) {
        setActiveStudySetId(setId);
        if (tab) setActiveSetTab(tab);
      }
    }
  }, []);

  // Subscribe to study set store changes
  useEffect(() => {
    return subscribeStudySets(() => {
      setRefreshKey((prev) => prev + 1);
    });
  }, []);

  const activeSet = activeStudySetId ? getStudySetById(activeStudySetId) : undefined;

  const handleOpenStudySet = (setId: string, tab?: string) => {
    setActiveStudySetId(setId);
    if (tab) setActiveSetTab(tab as StudySetTabKey);
    else setActiveSetTab("overview");

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("set", setId);
      if (tab) url.searchParams.set("tab", tab);
      else url.searchParams.delete("tab");
      window.history.pushState({}, "", url);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToLibrary = () => {
    setActiveStudySetId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("set");
      url.searchParams.delete("tab");
      window.history.pushState({}, "", url);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartStudying = () => {
    setActiveView("sets");
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  const handleOpenChatWithTopic = (topic: string, course: string, tool: string) => {
    setChatInitialPrompt(topic);
    setChatInitialCourse(course);
    setChatInitialTool(tool);
    setActiveView("chat");
    window.scrollTo({ top: 220, behavior: "smooth" });
  };

  const handleChatWithMaterial = (text: string, title: string, course?: string) => {
    setChatInitialPrompt(`Please analyze and teach me the main concepts from "${title}":\n\n${text}`);
    if (course) setChatInitialCourse(course);
    setActiveView("chat");
    window.scrollTo({ top: 220, behavior: "smooth" });
  };

  return (
    <ComingSoonGate pageKey="aiStudy">
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
        <SiteHeader />
        <main className="flex-1">
          {/* If a Study Set is open, show its full Studley-style workspace */}
          {activeSet ? (
            <StudySetDetailWorkspace
              key={`${activeSet.id}-${refreshKey}`}
              studySet={activeSet}
              initialTab={activeSetTab}
              onBackToLibrary={handleBackToLibrary}
              onStudySetUpdated={() => setRefreshKey((prev) => prev + 1)}
            />
          ) : (
            <>
              {/* Main Dashboard / Workspace */}
              {flow.phase === "upload" && (
                <div className="animate-in fade-in-0 duration-300">
                  {/* Personalized 2026/2030 AI Study Header & Rail */}
                  <AIStudyHeader
                    activeView={activeView}
                    onViewChange={setActiveView}
                    onStartStudyingWithAi={handleStartStudying}
                    aiReady={flow.aiReady}
                  />

                  {/* View-Specific Content Hub */}
                  <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
                    {/* 1. STUDLEY AI STUDY SETS LIBRARY (DEFAULT) */}
                    {activeView === "sets" && (
                      <div className="space-y-10">
                        <StudySetLibrary
                          key={refreshKey}
                          onOpenStudySet={handleOpenStudySet}
                          onStartStudyingWithAi={handleStartStudying}
                        />

                        {/* Recent sessions log */}
                        {flow.history.length > 0 && (
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <RecentSessions
                              history={flow.history}
                              onResume={flow.resumeFromHistory}
                              onRemove={flow.removeHistoryEntry}
                              onClear={flow.clearHistory}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. AI CHAT ASSISTANT */}
                    {activeView === "chat" && (
                      <div className="space-y-10">
                        <AIChat
                          initialPrompt={chatInitialPrompt}
                          initialCourse={chatInitialCourse}
                          initialTool={chatInitialTool}
                        />

                        {/* Quick Access to Tools beneath chat */}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white">
                                Jump to Specialized Study Tools
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Run dedicated engines for flashcards, practice exams, and lecture summaries
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveView("tools")}
                              className="text-xs font-bold text-brand-navy hover:underline dark:text-brand-gold"
                            >
                              View all 8 tools →
                            </button>
                          </div>
                          <StudyToolsGrid onOpenChatWithTopic={handleOpenChatWithTopic} />
                        </div>
                      </div>
                    )}

                    {/* 3. SPECIALIZED STUDY TOOLS */}
                    {activeView === "tools" && (
                      <div className="space-y-10">
                        <StudyToolsGrid onOpenChatWithTopic={handleOpenChatWithTopic} />

                        {flow.history.length > 0 && (
                          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                            <RecentSessions
                              history={flow.history}
                              onResume={flow.resumeFromHistory}
                              onRemove={flow.removeHistoryEntry}
                              onClear={flow.clearHistory}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. PROGRESS & SAVED NOTES */}
                    {activeView === "progress" && (
                      <div className="space-y-10">
                        <StudyProgress onStartStudy={() => setActiveView("sets")} />

                        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                          <SavedResponses />
                        </div>

                        {flow.history.length > 0 && (
                          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                            <RecentSessions
                              history={flow.history}
                              onResume={flow.resumeFromHistory}
                              onRemove={flow.removeHistoryEntry}
                              onClear={flow.clearHistory}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Processing Screen */}
              {flow.phase === "processing" && (
                <ProcessingStep
                  step={flow.processingStep}
                  pct={flow.processingPct}
                  filename={flow.processingFilename}
                />
              )}

              {/* Results Screen (3D Flashcards, Quiz, Written Practice, AI Podcast, Export) */}
              {flow.phase === "results" && flow.result && (
                <ResultsStep
                  result={flow.result}
                  retaking={flow.retaking}
                  onReset={flow.reset}
                  onRetake={flow.retake}
                  onChangeSubject={flow.changeSubject}
                  onComplete={flow.handlePackComplete}
                />
              )}
            </>
          )}
        </main>

        {!activeSet && flow.phase !== "results" && <SiteFooter />}
      </div>
    </ComingSoonGate>
  );
}
