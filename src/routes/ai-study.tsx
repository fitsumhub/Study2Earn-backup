import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AIStudyHeader, type AIStudyActiveView } from "@/components/ai-study/AIStudyHeader";
import { ProcessingStep } from "@/components/ai-study/ProcessingStep";
import { RecentSessions } from "@/components/ai-study/RecentSessions";
import { ResultsStep } from "@/components/ai-study/ResultsStep";
import {
  StudySetDetailWorkspace,
  type StudySetTabKey,
} from "@/components/ai-study/StudySetDetailWorkspace";
import { StudySetLibrary } from "@/components/ai-study/StudySetLibrary";
import type { IngestionTab } from "@/components/ai-study/CreateStudySetModal";
import { extractTextFromFile } from "@/components/ai-study/text-extraction";
import { UploadMaterial } from "@/components/ai-study/UploadMaterial";
import { ComingSoonGate } from "@/components/coming-soon-gate";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { useAiStudyFlow } from "@/hooks/use-ai-study-flow";
import { generateCompleteStudySetFn } from "@/lib/api/ai-study.functions";
import { readIntegrations } from "@/lib/integrations-store";
import {
  createStudySet,
  getStudySetById,
  subscribeStudySets,
  type StudySetSource,
} from "@/lib/study-set-store";

export const Route = createFileRoute("/ai-study")({
  head: () => ({
    meta: [
      { title: "AI Study Sets & Copilot — Study2Earn" },
      {
        name: "description",
        content:
          "Complete AI Study Sets platform for Ethiopian university students. Upload lecture files, images, recordings, or links to instantly generate interactive 3D flashcards, quizzes, executive notes, cheat sheets, and audio overviews.",
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

  // Ingestion creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<IngestionTab>("files");

  const handleOpenCreateWithTab = (tab: IngestionTab) => {
    setCreateModalTab(tab);
    setIsCreateModalOpen(true);
  };

  // Direct file upload progress state (bypasses modal entirely)
  const [directProgress, setDirectProgress] = useState<{
    fileName: string;
    stepText: string;
    pct: number;
  } | null>(null);

  const handleDirectUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const fileCount = files.length;
    const displayName = fileCount > 1 ? `${file.name} (+${fileCount - 1} more)` : file.name;

    setDirectProgress({
      fileName: displayName,
      stepText: `Extracting content from ${file.name}...`,
      pct: 20,
    });

    try {
      let combinedText = "";
      const pendingSources: StudySetSource[] = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const text = await extractTextFromFile(f);
        const snippet = text.slice(0, 300).trim();
        const content =
          text.trim() ||
          `Course study material extracted from ${f.name}. Key concepts, formulas, definitions, and lecture review notes.`;
        combinedText += `=== SOURCE: ${f.name} ===\n${content}\n\n`;

        const ext = f.name.split(".").pop()?.toLowerCase();
        const sourceType: StudySetSource["type"] =
          ext === "pdf" ? "pdf" :
          ext === "docx" ? "docx" :
          ext === "doc" ? "doc" :
          ext === "pptx" ? "pptx" :
          ext === "ppt" ? "ppt" :
          ext === "txt" || ext === "md" ? "txt" :
          ["png", "jpg", "jpeg", "webp"].includes(ext || "") ? "image" :
          ["mp3", "wav", "m4a", "aac", "ogg"].includes(ext || "") ? "audio" :
          ["mp4", "mov", "webm"].includes(ext || "") ? "video" : "notes";

        pendingSources.push({
          id: `src-${Date.now()}-${i}`,
          title: f.name,
          type: sourceType,
          sizeBytes: f.size,
          contentSnippet: snippet,
          fullText: content,
          uploadedAt: new Date().toISOString(),
        });
      }

      setDirectProgress({
        fileName: displayName,
        stepText: "Analyzing with Google Gemini & formulating study set...",
        pct: 55,
      });

      const integrations = readIntegrations();
      const provider = integrations.aiStudy?.provider || "gemini";
      const settings = integrations.aiStudy?.providers?.[provider];
      const apiKey = settings?.apiKey || integrations.aiStudy?.apiKey;
      const baseUrl = settings?.baseUrl;
      const model = settings?.model || "gemini-flash-lite-latest";

      const titleHint = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      const genRes = await generateCompleteStudySetFn({
        data: {
          text: combinedText.slice(0, 24000),
          titleHint,
          provider,
          apiKey,
          baseUrl,
          model,
        },
      });

      setDirectProgress({
        fileName: displayName,
        stepText: "Creating flashcards, quizzes & executive summary...",
        pct: 90,
      });

      const generated = genRes.data;

      const newSet = createStudySet({
        title: generated.title || titleHint || "New Study Set",
        subject: generated.subject || "Academic Study",
        courseCode: generated.courseCode || "CoSc 3000",
        description: generated.description,
        sources: pendingSources,
        overview: generated.overview,
        cheatSheet: generated.cheatSheet,
        flashcards: generated.flashcards.map((f, i) => ({
          id: `fc-gen-${Date.now()}-${i}`,
          front: f.front,
          back: f.back,
          topic: f.topic || generated.subject || "General",
          mastery: "unfamiliar",
          reviewCount: 0,
        })),
        quizzes: generated.quizzes.map((q, i) => ({
          id: `qz-gen-${Date.now()}-${i}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          topic: q.topic || generated.subject || "General",
          difficulty: q.difficulty || "medium",
        })),
        writtenTests: generated.writtenTests.map((w, i) => ({
          id: `wt-gen-${Date.now()}-${i}`,
          prompt: w.prompt,
          modelAnswer: w.modelAnswer,
          keyRubricPoints: w.keyRubricPoints,
          topic: w.topic || generated.subject || "General",
        })),
        fillBlanks: generated.fillBlanks.map((b, i) => ({
          id: `fb-gen-${Date.now()}-${i}`,
          sentenceWithBlank: b.sentenceWithBlank,
          blankAnswer: b.blankAnswer,
          explanation: b.explanation,
          topic: b.topic || generated.subject || "General",
        })),
        notes: {
          summary: generated.notes?.summary || `Executive study summary for ${titleHint}.`,
          keyConcepts: generated.notes?.keyConcepts || [],
          definitions: generated.notes?.definitions || [],
          formulasAndRules: generated.notes?.formulasAndRules || [],
          studyTips: generated.notes?.studyTips || [],
          learningObjectives: generated.notes?.learningObjectives || [],
          principlesAndTheories: generated.notes?.principlesAndTheories || [],
          classificationsAndCategories: generated.notes?.classificationsAndCategories || [],
          processesAndWorkflows: generated.notes?.processesAndWorkflows || [],
          clarifyingExamples: generated.notes?.clarifyingExamples || [],
          commonConfusions: generated.notes?.commonConfusions || [],
          examFocusedKnowledge: generated.notes?.examFocusedKnowledge,
          finalTakeaways: generated.notes?.finalTakeaways || [],
        },
        podcast: generated.podcast || {
          title: `${titleHint} — Audio Brief`,
          description: "Summary audio briefing",
          durationSeconds: 180,
          dialogue: [],
        },
      });

      setDirectProgress({
        fileName: displayName,
        stepText: "Ready!",
        pct: 100,
      });

      toast.success(`Study Set "${newSet.title}" created with Google Gemini!`);
      setTimeout(() => {
        setDirectProgress(null);
        handleOpenStudySet(newSet.id);
      }, 500);
    } catch (err) {
      console.error("Direct upload error:", err);
      toast.error("Failed to generate study set. Please try again.");
      setDirectProgress(null);
    }
  };

  // Deep linking: read ?set=<id>&tab=<tab> on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const setId = params.get("set");
      const tab = params.get("tab") as StudySetTabKey | null;
      if (setId) {
        const found = getStudySetById(setId);
        if (found) {
          setActiveStudySetId(setId);
          if (tab) setActiveSetTab(tab);
        } else {
          // Gracefully clean invalid search param and notify
          const url = new URL(window.location.href);
          url.searchParams.delete("set");
          url.searchParams.delete("tab");
          window.history.replaceState({}, "", url);
          toast.info("Requested study set not found. Browsing available library sets.");
        }
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
                  {/* Personalized AI Study Header & 3 Ingestion Action Cards */}
                  <AIStudyHeader
                    activeView={activeView}
                    onViewChange={setActiveView}
                    onStartStudyingWithAi={handleStartStudying}
                    aiReady={flow.aiReady}
                    onOpenCreateWithTab={handleOpenCreateWithTab}
                    onDirectUpload={handleDirectUpload}
                  />

                  {/* View-Specific Content Hub */}
                  <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
                    {/* 1. STUDLEY AI STUDY SETS LIBRARY */}
                    <div className="space-y-10">
                      <StudySetLibrary
                        key={refreshKey}
                        onOpenStudySet={handleOpenStudySet}
                        onStartStudyingWithAi={handleStartStudying}
                        isCreateModalOpen={isCreateModalOpen}
                        createModalTab={createModalTab}
                        onCloseCreateModal={() => setIsCreateModalOpen(false)}
                        onOpenCreateWithTab={handleOpenCreateWithTab}
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

        {/* Direct Upload & Gemini Generation Floating Progress Overlay */}
        {directProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                <Sparkles className="size-8 animate-pulse text-amber-300" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Zap className="size-3 text-emerald-500" />
                  Google Gemini Engine
                </div>
                <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-white">
                  Generating Study Set
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs mx-auto">
                  {directProgress.fileName}
                </p>
              </div>

              <div className="space-y-2">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    style={{ width: `${directProgress.pct}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-slate-700 dark:text-slate-300 animate-pulse">
                    {directProgress.stepText}
                  </span>
                  <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                    {directProgress.pct}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ComingSoonGate>
  );
}
