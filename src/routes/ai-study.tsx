import { createFileRoute } from "@tanstack/react-router";

import { ComingSoonGate } from "@/components/coming-soon-gate";
import { ProcessingStep } from "@/components/ai-study/ProcessingStep";
import { ResultsStep } from "@/components/ai-study/ResultsStep";
import { UploadStep } from "@/components/ai-study/UploadStep";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { useAiStudyFlow } from "@/hooks/use-ai-study-flow";

export const Route = createFileRoute("/ai-study")({
  head: () => ({
    meta: [
      { title: "AI Study — Study2Earn" },
      {
        name: "description",
        content:
          "Upload your notes, PPT or PDF and instantly generate practice exam questions with answers and study summaries.",
      },
    ],
  }),
  component: AiStudyPage,
});

function AiStudyPage() {
  const flow = useAiStudyFlow();

  return (
    <ComingSoonGate pageKey="aiStudy">
      <div className="flex min-h-screen flex-col bg-slate-50">
        <SiteHeader />
        <main className="flex-1">
          {flow.phase === "upload" && (
            <UploadStep
              dragOver={flow.dragOver}
              setDragOver={flow.setDragOver}
              onDrop={flow.handleDrop}
              onFileInput={flow.handleFileInput}
              onDemo={flow.tryDemo}
              onTextSubmit={flow.processPastedText}
              fileInputRef={flow.fileInputRef}
              questionCount={flow.questionCount}
              setQuestionCount={flow.setQuestionCount}
              aiReady={flow.aiReady}
              history={flow.history}
              onResumeHistory={flow.resumeFromHistory}
              onRemoveHistory={flow.removeHistoryEntry}
              onClearHistory={flow.clearHistory}
              lastReadBook={flow.lastReadBook}
              lastReadPage={flow.lastReadPage}
              onGenerateFromBook={flow.generateFromBook}
            />
          )}
          {flow.phase === "processing" && (
            <ProcessingStep
              step={flow.processingStep}
              pct={flow.processingPct}
              filename={flow.processingFilename}
            />
          )}
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
        </main>
        {/* ResultsStep renders its own SiteFooter (it sits after the study
            notes, not at the bottom of the viewport like the other phases). */}
        {flow.phase !== "results" && <SiteFooter />}
      </div>
    </ComingSoonGate>
  );
}
