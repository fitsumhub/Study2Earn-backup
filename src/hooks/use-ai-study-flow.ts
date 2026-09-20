import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";

import { useAiStudyHistory } from "@/hooks/use-ai-study-history";
import { useAuth } from "@/hooks/use-auth";
import { useIntegrations } from "@/hooks/use-integrations";
import { useLastReadBook } from "@/hooks/use-last-read-book";
import { generateStudyPack, getAiStudyStatus } from "@/lib/api/ai-study.functions";
import type { AiStudyHistoryEntry } from "@/lib/ai-study-store";
import type { LibraryBook } from "@/lib/mock-data";

import { DEMO_FILE_CONTENT, PROCESSING_STEPS } from "@/components/ai-study/demo-content";
import { notePools, questionPools, shuffleAndTake } from "@/components/ai-study/question-bank";
import {
  detectSubject,
  detectSubjectFromText,
  subjectForBook,
} from "@/components/ai-study/subject";
import { cleanExcerpt, extractFileText, validateFile } from "@/components/ai-study/text-extraction";
import type { AIQuestion, AINote, AIResult, Phase } from "@/components/ai-study/types";

/** What a real AI call needs to regenerate — cached so "Retake" can ask for a
 * genuinely fresh AI-generated set instead of silently falling back to demo
 * questions for a pack that was originally AI-generated. */
type CachedGeneration = {
  text: string;
  subjectHint: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useAiStudyFlow() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [result, setResult] = useState<AIResult | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingPct, setProcessingPct] = useState(0);
  const [processingFilename, setProcessingFilename] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [retaking, setRetaking] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<Record<string, boolean> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Guards against overlapping runs (double-click, drop while already processing, etc.) —
  // only the most recent invocation is allowed to keep writing state.
  const runIdRef = useRef(0);
  // Tracks which history row the currently-displayed pack belongs to, so a
  // completed practice session can write its score back to that same row.
  const activeHistoryIdRef = useRef<string | null>(null);
  // The extracted text + subject behind the currently-displayed AI pack, kept
  // only so "Retake" can ask the AI provider for a genuinely fresh set.
  const lastGenerationRef = useRef<CachedGeneration | null>(null);

  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { history, addEntry, updateScore, removeEntry, clear } = useAiStudyHistory();
  const { book: lastReadBook, lastPage: lastReadPage } = useLastReadBook();
  const { config: integrations } = useIntegrations();

  useEffect(() => {
    let cancelled = false;
    getAiStudyStatus()
      .then((status) => {
        if (!cancelled) setAiConfigured(status);
      })
      .catch(() => {
        if (!cancelled) setAiConfigured({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeProvider = integrations.aiStudy.provider;
  const activeSettings = integrations.aiStudy.providers?.[activeProvider];
  const adminApiKey = activeSettings?.apiKey?.trim() || integrations.aiStudy.apiKey?.trim();
  const hasServerEnv = Boolean(aiConfigured?.[activeProvider]);
  const aiReady = integrations.aiStudy.enabled && (Boolean(adminApiKey) || hasServerEnv);

  const requestAiGeneration = useCallback(
    async (text: string, count: number, subjectHint: string) => {
      const provider = integrations.aiStudy.provider;
      const settings = integrations.aiStudy.providers?.[provider];
      const apiKey = settings?.apiKey?.trim() || integrations.aiStudy.apiKey?.trim();

      const response = await generateStudyPack({
        data: {
          text,
          questionCount: count,
          subjectHint,
          provider,
          apiKey: apiKey || undefined,
          model: settings?.model || undefined,
          baseUrl: settings?.baseUrl || undefined,
          systemPrompt: integrations.aiStudy.systemPrompt,
          temperature: integrations.aiStudy.temperature,
          deepseekModel: integrations.aiStudy.deepseekModel,
          customBaseUrl: integrations.aiStudy.custom.baseUrl,
          customModel: integrations.aiStudy.custom.model,
        },
      });
      if (response.ok) {
        return {
          subject: response.data.subject,
          questions: response.data.questions.map((q, i) => ({ id: `ai-${i}`, ...q })),
          notes: response.data.notes,
        } satisfies { subject: string; questions: AIQuestion[]; notes: AINote };
      }
      return null;
    },
    [integrations.aiStudy],
  );

  const processFile = useCallback(
    (file: File, count: number) => {
      if (!file) return;
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const runId = (runIdRef.current += 1);
      const isCurrent = () => runIdRef.current === runId;

      const filename = file.name;

      setPhase("processing");
      setProcessingStep(0);
      setProcessingPct(0);
      setProcessingFilename(filename);

      void (async () => {
        // Step 1 is gated on real extraction, not a fake timer — but keep a floor so
        // instant local reads (tiny .txt files) don't flash past too fast to read.
        const startedAt = Date.now();
        const extractedText = await extractFileText(file);
        if (!isCurrent()) return;
        const elapsed = Date.now() - startedAt;
        if (elapsed < 700) await wait(700 - elapsed);
        if (!isCurrent()) return;

        const contentSubject = detectSubjectFromText(extractedText);
        const subject = contentSubject ?? detectSubject(filename);

        setProcessingStep(1);
        setProcessingPct(Math.round((1 / PROCESSING_STEPS.length) * 100));

        // Steps "Analysing" + "Generating" — a real AI call when the admin has
        // configured and enabled it, otherwise the same timed simulation as before.
        let aiResult: { subject: string; questions: AIQuestion[]; notes: AINote } | null = null;
        const wantsRealAi = integrations.aiStudy.enabled && extractedText.trim().length > 0;

        if (wantsRealAi) {
          setProcessingStep(2);
          setProcessingPct(Math.round((2 / PROCESSING_STEPS.length) * 100));

          try {
            aiResult = await requestAiGeneration(extractedText, count, subject);
          } catch {
            aiResult = null;
          }
          if (!isCurrent()) return;

          if (!aiResult) {
            toast.info("Using demo question bank", {
              description:
                "AI generation isn't available right now — showing demo questions instead.",
            });
          }

          setProcessingStep(3);
          setProcessingPct(Math.round((3 / PROCESSING_STEPS.length) * 100));
          await wait(400);
          if (!isCurrent()) return;
          setProcessingStep(4);
          setProcessingPct(Math.round((4 / PROCESSING_STEPS.length) * 100));
        } else {
          for (let step = 2; step <= PROCESSING_STEPS.length; step += 1) {
            await wait(900);
            if (!isCurrent()) return;
            setProcessingStep(step);
            setProcessingPct(Math.round((step / PROCESSING_STEPS.length) * 100));
          }
        }
        await wait(450);
        if (!isCurrent()) return;

        const finalSubject = aiResult?.subject ?? subject;
        const detectionSource: AiStudyHistoryEntry["detectionSource"] = contentSubject
          ? "content"
          : "filename";
        const pool = questionPools[finalSubject] ?? questionPools.general;
        const source: "ai" | "demo" = aiResult ? "ai" : "demo";

        lastGenerationRef.current =
          source === "ai" && extractedText.trim().length > 0
            ? { text: extractedText, subjectHint: finalSubject }
            : null;

        setResult({
          subject: finalSubject,
          filename,
          questions: aiResult ? aiResult.questions : shuffleAndTake(pool, count),
          notes: aiResult ? aiResult.notes : (notePools[finalSubject] ?? notePools.general),
          excerpt: extractedText ? cleanExcerpt(extractedText) : "",
          detectionSource,
          source,
        });
        setPhase("results");
        activeHistoryIdRef.current = addEntry({
          subject: finalSubject,
          filename,
          questionCount: count,
          detectionSource,
          source,
        });
      })();
    },
    [addEntry, integrations.aiStudy, requestAiGeneration],
  );

  const tryDemo = useCallback(() => {
    const demoFile = new File([DEMO_FILE_CONTENT], "General_Physics_Ch3.txt", {
      type: "text/plain",
    });
    processFile(demoFile, questionCount);
  }, [processFile, questionCount]);

  const processPastedText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length < 60) {
        toast.error("Add a little more study material", {
          description:
            "Paste at least 60 characters so we can detect the subject and build useful questions.",
        });
        return;
      }
      const pastedFile = new File([trimmed], "Pasted-study-notes.txt", { type: "text/plain" });
      processFile(pastedFile, questionCount);
    },
    [processFile, questionCount],
  );

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, questionCount);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file, questionCount);
  };

  const reset = () => {
    runIdRef.current += 1; // invalidate any in-flight processing run
    activeHistoryIdRef.current = null;
    lastGenerationRef.current = null;
    setPhase("upload");
    setResult(null);
    setProcessingStep(0);
    setProcessingPct(0);
    setProcessingFilename("");
  };

  // Reshuffles a fresh set of questions for the same subject. If the current
  // pack was genuinely AI-generated and we still have its source text, asks
  // the AI provider for a fresh set too — rather than silently swapping in
  // unrelated demo questions for a pack the student was told was AI-generated.
  const retake = useCallback(async () => {
    const cached = lastGenerationRef.current;
    if (result?.source === "ai" && cached) {
      setRetaking(true);
      try {
        const aiResult = await requestAiGeneration(
          cached.text,
          result.questions.length,
          cached.subjectHint,
        );
        if (aiResult) {
          setResult((prev) =>
            prev
              ? { ...prev, questions: aiResult.questions, notes: aiResult.notes, source: "ai" }
              : prev,
          );
          return;
        }
        toast.info("Using demo question bank", {
          description: "Couldn't reach the AI provider — showing demo questions instead.",
        });
      } catch {
        toast.info("Using demo question bank", {
          description: "Couldn't reach the AI provider — showing demo questions instead.",
        });
      } finally {
        setRetaking(false);
      }
    }

    lastGenerationRef.current = null;
    setResult((prev) => {
      if (!prev) return prev;
      const pool = questionPools[prev.subject] ?? questionPools.general;
      return { ...prev, questions: shuffleAndTake(pool, prev.questions.length), source: "demo" };
    });
  }, [result, requestAiGeneration]);

  // Lets the student correct a wrong auto-detected subject without re-uploading.
  // Reads `result` from closure (rather than a setResult updater) because
  // logging the history entry is a side effect, and updater functions must stay pure.
  const changeSubject = useCallback(
    (subject: string) => {
      if (!result || result.subject === subject) return;
      const pool = questionPools[subject] ?? questionPools.general;
      const count = result.questions.length;
      lastGenerationRef.current = null;
      activeHistoryIdRef.current = addEntry({
        subject,
        filename: result.filename,
        questionCount: count,
        detectionSource: "manual",
        source: "demo",
      });
      setResult({
        ...result,
        subject,
        questions: shuffleAndTake(pool, count),
        notes: notePools[subject] ?? notePools.general,
        detectionSource: "manual",
        source: "demo",
      });
    },
    [result, addEntry],
  );

  // "Practice again" from the Recent Study Packs list — regenerates a fresh
  // pack for that subject instantly from the demo bank (we don't retain the
  // original file's text across sessions, so a genuine AI re-run isn't possible).
  const resumeFromHistory = useCallback(
    (entry: AiStudyHistoryEntry) => {
      const runId = (runIdRef.current += 1);
      const isCurrent = () => runIdRef.current === runId;

      setPhase("processing");
      setProcessingStep(PROCESSING_STEPS.length);
      setProcessingPct(100);
      setProcessingFilename(entry.filename);
      setQuestionCount(entry.questionCount);

      setTimeout(() => {
        if (!isCurrent()) return;
        lastGenerationRef.current = null;
        const pool = questionPools[entry.subject] ?? questionPools.general;
        setResult({
          subject: entry.subject,
          filename: entry.filename,
          questions: shuffleAndTake(pool, entry.questionCount),
          notes: notePools[entry.subject] ?? notePools.general,
          excerpt: "",
          detectionSource: entry.detectionSource,
          source: "demo",
        });
        setPhase("results");
        activeHistoryIdRef.current = addEntry({
          subject: entry.subject,
          filename: entry.filename,
          questionCount: entry.questionCount,
          detectionSource: entry.detectionSource,
          source: "demo",
        });
      }, 500);
    },
    [addEntry],
  );

  // "Get key points & exam from this book" on the last-read-book suggestion —
  // generates an instant pack whose subject is matched from the library book,
  // rather than from an uploaded file.
  const generateFromBook = useCallback(
    (book: LibraryBook) => {
      const runId = (runIdRef.current += 1);
      const isCurrent = () => runIdRef.current === runId;
      const subject = subjectForBook(book);

      setPhase("processing");
      setProcessingStep(PROCESSING_STEPS.length);
      setProcessingPct(100);
      setProcessingFilename(book.name);

      setTimeout(() => {
        if (!isCurrent()) return;
        lastGenerationRef.current = null;
        const pool = questionPools[subject] ?? questionPools.general;
        setResult({
          subject,
          filename: book.name,
          questions: shuffleAndTake(pool, questionCount),
          notes: notePools[subject] ?? notePools.general,
          excerpt: "",
          detectionSource: "library",
          source: "demo",
        });
        setPhase("results");
        activeHistoryIdRef.current = addEntry({
          subject,
          filename: book.name,
          questionCount,
          detectionSource: "library",
          source: "demo",
        });
      }, 500);
    },
    [addEntry, questionCount],
  );

  const handlePackComplete = useCallback(
    (answeredCount: number, correctCount: number, scorePct: number) => {
      if (!userId || !activeHistoryIdRef.current) return;
      updateScore(activeHistoryIdRef.current, { answeredCount, correctCount, scorePct });
    },
    [userId, updateScore],
  );

  return {
    phase,
    result,
    processingStep,
    processingPct,
    processingFilename,
    dragOver,
    setDragOver,
    questionCount,
    setQuestionCount,
    fileInputRef,
    retaking,
    aiReady,
    history,
    lastReadBook,
    lastReadPage,
    handleFileInput,
    handleDrop,
    tryDemo,
    processPastedText,
    reset,
    retake,
    changeSubject,
    resumeFromHistory,
    generateFromBook,
    handlePackComplete,
    removeHistoryEntry: removeEntry,
    clearHistory: clear,
  };
}
