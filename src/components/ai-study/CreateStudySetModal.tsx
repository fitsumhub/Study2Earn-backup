import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Globe,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Mic,
  MicOff,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Video,
  Volume2,
  X,
  Youtube,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIntegrations } from "@/hooks/use-integrations";
import { generateCompleteStudySetFn } from "@/lib/api/ai-study.functions";
import {
  createStudySet,
  getStudySetFolders,
  type StudySetSource,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";
import { extractTextFromFile } from "./text-extraction";

export interface CreateStudySetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSetId: string) => void;
  initialTab?: IngestionTab;
}

export type IngestionTab =
  | "files"
  | "images"
  | "record"
  | "media"
  | "links"
  | "paste"
  | "books";

interface PendingSource {
  id: string;
  title: string;
  type: StudySetSource["type"];
  sizeBytes?: number;
  extractedText: string;
  snippet: string;
  thumbnailUrl?: string;
  audioBlobUrl?: string;
}

const COMMON_ETHIOPIAN_COURSES = [
  { code: "Phys 1011", name: "General Physics", subject: "Physics" },
  { code: "Math 1011", name: "Freshman Mathematics", subject: "Mathematics" },
  { code: "Phil 1011", name: "Logic & Critical Thinking", subject: "Philosophy" },
  { code: "SNIE 1012", name: "Inclusiveness", subject: "Education" },
  { code: "EmTe 1012", name: "Emerging Technologies", subject: "Technology" },
  { code: "CoSc 2041", name: "Database Systems", subject: "Computer Science" },
  { code: "EnLa 1011", name: "Communicative English", subject: "English" },
  { code: "Econ 1011", name: "Introduction to Economics", subject: "Economics" },
];

export function CreateStudySetModal({
  isOpen,
  onClose,
  onSuccess,
  initialTab = "files",
}: CreateStudySetModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const { config } = useIntegrations();

  const [activeTab, setActiveTab] = useState<IngestionTab>(initialTab);
  const [dragOver, setDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Sources queue
  const [sources, setSources] = useState<PendingSource[]>([]);

  // Metadata form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [courseCode, setCourseCode] = useState("GEN 1000");
  const [folderId, setFolderId] = useState<string | undefined>(undefined);

  // Tab: Paste
  const [pastedText, setPastedText] = useState("");
  const [pastedTitle, setPastedTitle] = useState("");

  // Tab: Link / YouTube
  const [inputUrl, setInputUrl] = useState("");
  const [detectedYtId, setDetectedYtId] = useState<string | null>(null);

  // Tab: Live Lecture Recording Studio
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "stopped">("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedTranscript, setRecordedTranscript] = useState("");
  const [recordedLectureTitle, setRecordedLectureTitle] = useState("");
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const folders = getStudySetFolders();

  // Clean up recording on unmount or close
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Detect YouTube URL
  useEffect(() => {
    if (!inputUrl) {
      setDetectedYtId(null);
      return;
    }
    const match = inputUrl.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i,
    );
    if (match && match[1]) {
      setDetectedYtId(match[1]);
    } else {
      setDetectedYtId(null);
    }
  }, [inputUrl]);

  if (!isOpen) return null;

  /* ── File Extraction Handler (Documents, Audio, Video) ── */
  const handleFiles = async (files: FileList | null, forcedType?: StudySetSource["type"]) => {
    if (!files || files.length === 0) return;
    setIsExtracting(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await extractTextFromFile(file);
        let type: StudySetSource["type"] = forcedType || "pdf";
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "pptx" || ext === "ppt") type = "pptx";
        else if (ext === "docx" || ext === "doc") type = "docx";
        else if (ext === "txt" || ext === "md") type = "txt";
        else if (["png", "jpg", "jpeg", "webp"].includes(ext || "")) type = "image";
        else if (["mp3", "wav", "m4a", "aac", "ogg"].includes(ext || "")) type = "audio";
        else if (["mp4", "mov", "webm"].includes(ext || "")) type = "video";

        let thumbnailUrl: string | undefined = undefined;
        let audioBlobUrl: string | undefined = undefined;

        if (type === "image") {
          thumbnailUrl = URL.createObjectURL(file);
        } else if (type === "audio") {
          audioBlobUrl = URL.createObjectURL(file);
        }

        const newSource: PendingSource = {
          id: `pend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: file.name,
          type,
          sizeBytes: file.size,
          extractedText:
            text || `Classroom learning material and lecture concepts extracted from ${file.name}.`,
          snippet: (text || file.name).slice(0, 200),
          thumbnailUrl,
          audioBlobUrl,
        };

        setSources((prev) => [...prev, newSource]);

        // Auto infer title if first source
        if (!title) {
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
          setTitle(cleanName);
          const lower = file.name.toLowerCase();
          for (const c of COMMON_ETHIOPIAN_COURSES) {
            if (lower.includes(c.subject.toLowerCase()) || lower.includes(c.code.toLowerCase())) {
              setSubject(c.subject);
              setCourseCode(c.code);
              break;
            }
          }
        }
      } catch (err) {
        console.error("Extraction error:", err);
      }
    }
    setIsExtracting(false);
  };

  /* ── Live Lecture Recording Logic ── */
  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setRecordingState("recording");
      setRecordingSeconds(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Start speech recognition if supported
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: any) => {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript + " ";
            }
            setRecordedTranscript(transcript.trim());
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn("Speech recognition error:", e);
        }
      }
    } catch (err) {
      console.error("Microphone access error:", err);
      setMicError("Microphone access was denied or is unavailable. Please check browser permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecordingState("stopped");
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }

      if (!recordedLectureTitle) {
        setRecordedLectureTitle(
          `Live Lecture Recording (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
        );
      }
    }
  };

  const handleAddRecordedLecture = () => {
    const lectureName =
      recordedLectureTitle.trim() ||
      `Live Lecture Recording (${new Date().toLocaleDateString()})`;
    const textContent =
      recordedTranscript.trim() ||
      `Live audio lecture recording covering university curriculum concepts, professor explanations, and core exam review points for ${lectureName}.`;

    const newSource: PendingSource = {
      id: `pend-rec-${Date.now()}`,
      title: lectureName,
      type: "recorded-lecture",
      extractedText: textContent,
      snippet: textContent.slice(0, 200),
      audioBlobUrl: recordedAudioUrl || undefined,
    };

    setSources((prev) => [...prev, newSource]);
    if (!title) setTitle(lectureName);

    // Reset recording studio
    setRecordingState("idle");
    setRecordingSeconds(0);
    setRecordedAudioUrl(null);
    setRecordedTranscript("");
    setRecordedLectureTitle("");
  };

  /* ── Add Pasted Text ── */
  const handleAddPastedText = () => {
    if (!pastedText.trim()) return;
    const pendingTitle = pastedTitle.trim() || `Lecture Notes (${new Date().toLocaleDateString()})`;
    const newSource: PendingSource = {
      id: `pend-paste-${Date.now()}`,
      title: pendingTitle,
      type: "notes",
      extractedText: pastedText.trim(),
      snippet: pastedText.trim().slice(0, 200),
    };

    setSources((prev) => [...prev, newSource]);
    if (!title) setTitle(pendingTitle);
    setPastedText("");
    setPastedTitle("");
  };

  /* ── Add Book Source ── */
  const handleAddBook = (course: (typeof COMMON_ETHIOPIAN_COURSES)[0]) => {
    const bookTitle = `MoE Ethiopian Curriculum: ${course.name} (${course.code})`;
    const sampleText = `Ethiopian Ministry of Education Standard Curriculum Module for ${course.name} (${course.code}).
Comprehensive higher education foundational framework, key axioms, boundary definitions, problem solving methods, and National Exit Exam review items.`;

    const newSource: PendingSource = {
      id: `pend-book-${Date.now()}`,
      title: bookTitle,
      type: "book",
      extractedText: sampleText,
      snippet: sampleText.slice(0, 200),
    };

    setSources((prev) => [...prev, newSource]);
    if (!title) setTitle(`${course.name} (${course.code})`);
    setSubject(course.subject);
    setCourseCode(course.code);
  };

  /* ── Add URL ── */
  const handleAddUrl = () => {
    if (!inputUrl.trim()) return;
    const isYt = !!detectedYtId;
    const itemTitle = isYt
      ? `YouTube Lecture: ${inputUrl.slice(0, 45)}`
      : `Web Article: ${inputUrl.slice(0, 45)}`;

    const newSource: PendingSource = {
      id: `pend-url-${Date.now()}`,
      title: itemTitle,
      type: isYt ? "youtube" : "web",
      extractedText: `Online learning resource: ${inputUrl}. Ingested academic lecture principles, conceptual definitions, and exam review takeaways.`,
      snippet: inputUrl,
      thumbnailUrl: detectedYtId
        ? `https://img.youtube.com/vi/${detectedYtId}/mqdefault.jpg`
        : undefined,
    };
    setSources((prev) => [...prev, newSource]);
    if (!title) setTitle(isYt ? "Video Lecture Study Pack" : "Web Article Study Pack");
    setInputUrl("");
  };

  const handleRemoveSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  /* ── Format Recording Seconds ── */
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  /* ── Generate Study Set ── */
  const handleGenerate = async () => {
    if (sources.length === 0) return;
    setIsGenerating(true);
    setGenerationStep(1);
    setGenerationError(null);

    // Combine extracted text from all sources
    const combinedText = sources
      .map((s) => `=== SOURCE (${s.type.toUpperCase()}): ${s.title} ===\n${s.extractedText}`)
      .join("\n\n");

    try {
      setTimeout(() => setGenerationStep(2), 600);
      setTimeout(() => setGenerationStep(3), 1400);
      setTimeout(() => setGenerationStep(4), 2200);
      setTimeout(() => setGenerationStep(5), 3000);

      const provider = config.aiStudy?.provider || "gemini";
      const settings = config.aiStudy?.providers?.[provider];
      const apiKey = settings?.apiKey || config.aiStudy?.apiKey;
      const baseUrl = settings?.baseUrl;
      const model = settings?.model;

      const result = await generateCompleteStudySetFn({
        data: {
          text: combinedText.slice(0, 24000),
          titleHint: title || undefined,
          subjectHint: subject || undefined,
          provider,
          apiKey,
          baseUrl,
          model,
        },
      });

      setGenerationStep(6);
      const generated = result.data;

      // Transform into store format
      const finalSources: StudySetSource[] = sources.map((s) => ({
        id: `src-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: s.title,
        type: s.type,
        sizeBytes: s.sizeBytes,
        contentSnippet: s.snippet,
        fullText: s.extractedText,
        uploadedAt: new Date().toISOString(),
      }));

      const newSet = createStudySet({
        title: generated.title || title || "Comprehensive Study Set",
        subject: generated.subject || subject || "General",
        courseCode: generated.courseCode || courseCode || "GEN 1000",
        description: generated.description,
        folderId,
        sources: finalSources,
        overview: generated.overview,
        cheatSheet: generated.cheatSheet,
        flashcards: generated.flashcards.map((f, i) => ({
          id: `fc-gen-${Date.now()}-${i}`,
          front: f.front,
          back: f.back,
          topic: f.topic || subject,
          mastery: "unfamiliar",
          reviewCount: 0,
        })),
        quizzes: generated.quizzes.map((q, i) => ({
          id: `qz-gen-${Date.now()}-${i}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          topic: q.topic || subject,
          difficulty: q.difficulty || "medium",
        })),
        writtenTests: generated.writtenTests.map((w, i) => ({
          id: `wt-gen-${Date.now()}-${i}`,
          prompt: w.prompt,
          modelAnswer: w.modelAnswer,
          keyRubricPoints: w.keyRubricPoints,
          topic: w.topic || subject,
        })),
        fillBlanks: generated.fillBlanks.map((b, i) => ({
          id: `fb-gen-${Date.now()}-${i}`,
          sentenceWithBlank: b.sentenceWithBlank,
          blankAnswer: b.blankAnswer,
          hint: b.hint,
          explanation: b.explanation,
          topic: b.topic || subject,
        })),
        notes: generated.notes,
        podcast: generated.podcast,
      });

      setIsGenerating(false);
      onSuccess(newSet.id);
      onClose();
    } catch (err) {
      console.error("Generation error:", err);
      setGenerationError(err instanceof Error ? err.message : "Failed to generate study set");
      setIsGenerating(false);
    }
  };

  const stepsList = [
    "Ingesting & analyzing learning sources and lecture recordings",
    "Extracting fundamental principles, axioms & definitions",
    "Generating active-recall 3D flashcards with mnemonic hints",
    "Formulating multiple-choice quizzes with distractor rationales",
    "Synthesizing executive summaries, formulas & exam morning cheat sheet",
    "Finalizing spoken audio briefing and grounding AI tutor",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[94vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-serif text-xl font-bold text-brand-navy dark:text-white flex items-center gap-2">
              <Sparkles className="size-5 text-brand-gold" />
              Create AI Study Set
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload files, images, audio/video, record a live lecture, or paste links → Complete interactive study set
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Generation Progress Overlay */}
          {isGenerating ? (
            <div className="py-10 space-y-6 text-center animate-in fade-in duration-300">
              <div className="relative mx-auto flex size-20 items-center justify-center rounded-3xl bg-linear-to-br from-brand-navy to-blue-600 shadow-xl shadow-blue-500/20">
                <Sparkles className="size-10 text-brand-gold animate-pulse" />
                <div className="absolute inset-0 rounded-3xl border-2 border-white/20 animate-ping opacity-25" />
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                  Generating Your AI Study Set
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Compiling {sources.length} sources into 3D flashcards, quizzes, executive summary & audio briefing.
                </p>
              </div>

              {/* Steps Progress */}
              <div className="mx-auto max-w-md space-y-2.5 text-left">
                {stepsList.map((st, i) => {
                  const stepNum = i + 1;
                  const isDone = generationStep > stepNum;
                  const isCurrent = generationStep === stepNum;
                  return (
                    <div
                      key={st}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-2.5 text-xs transition",
                        isDone &&
                          "border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300",
                        isCurrent &&
                          "border-blue-300 bg-blue-50/70 font-semibold text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 shadow-xs",
                        !isDone && !isCurrent && "border-slate-100 text-slate-400 dark:border-slate-800/60 dark:text-slate-500",
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      ) : isCurrent ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-blue-500" />
                      ) : (
                        <div className="size-4 shrink-0 rounded-full border border-slate-300 dark:border-slate-600" />
                      )}
                      <span className="flex-1">{st}</span>
                    </div>
                  );
                })}
              </div>

              {generationError && (
                <div className="mx-auto max-w-md rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Step 1: Input Source Ingestion Hub */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    1. Ingest Learning Material
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Choose one or combine multiple formats
                  </span>
                </div>

                {/* Tabs bar */}
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/70">
                  <button
                    type="button"
                    onClick={() => setActiveTab("files")}
                    className={cn(
                      "flex flex-col sm:flex-row items-center justify-center gap-1 rounded-xl py-2 px-1.5 text-[11px] font-semibold transition cursor-pointer text-center",
                      activeTab === "files"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <Upload className="size-3.5 text-blue-500" />
                    <span>Files</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("images")}
                    className={cn(
                      "flex flex-col sm:flex-row items-center justify-center gap-1 rounded-xl py-2 px-1.5 text-[11px] font-semibold transition cursor-pointer text-center",
                      activeTab === "images"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <ImageIcon className="size-3.5 text-emerald-500" />
                    <span>Images</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("record")}
                    className={cn(
                      "flex flex-col sm:flex-row items-center justify-center gap-1 rounded-xl py-2 px-1.5 text-[11px] font-semibold transition cursor-pointer text-center relative",
                      activeTab === "record"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <Mic className="size-3.5 text-rose-500" />
                    <span>Record</span>
                    <span className="hidden sm:inline-block size-1.5 rounded-full bg-rose-500 animate-pulse" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("media")}
                    className={cn(
                      "flex flex-col sm:flex-row items-center justify-center gap-1 rounded-xl py-2 px-1.5 text-[11px] font-semibold transition cursor-pointer text-center",
                      activeTab === "media"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <Headphones className="size-3.5 text-purple-500" />
                    <span>Audio/Vid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("links")}
                    className={cn(
                      "flex flex-col sm:flex-row items-center justify-center gap-1 rounded-xl py-2 px-1.5 text-[11px] font-semibold transition cursor-pointer text-center",
                      activeTab === "links"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <Youtube className="size-3.5 text-red-500" />
                    <span>Links</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("paste")}
                    className={cn(
                      "flex flex-col sm:flex-row items-center justify-center gap-1 rounded-xl py-2 px-1.5 text-[11px] font-semibold transition cursor-pointer text-center",
                      activeTab === "paste"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <FileText className="size-3.5 text-amber-500" />
                    <span>Paste</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("books")}
                    className={cn(
                      "flex flex-col sm:flex-row items-center justify-center gap-1 rounded-xl py-2 px-1.5 text-[11px] font-semibold transition cursor-pointer text-center",
                      activeTab === "books"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <BookOpen className="size-3.5 text-indigo-500" />
                    <span>Curriculum</span>
                  </button>
                </div>

                {/* Tab 1: Upload Documents / Files */}
                {activeTab === "files" && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition cursor-pointer",
                      dragOver
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30",
                    )}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-3">
                      {isExtracting ? (
                        <Loader2 className="size-6 animate-spin" />
                      ) : (
                        <Upload className="size-6" />
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {isExtracting
                        ? "Extracting concepts & text from file..."
                        : "Drag & drop lecture documents, or browse"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Supports PDF, PPT/PPTX slides, Word DOCX, and TXT/Markdown (up to 50MB)
                    </p>
                  </div>
                )}

                {/* Tab 2: Upload Images */}
                {activeTab === "images" && (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-7 text-center transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30 cursor-pointer"
                  >
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      multiple
                      accept="image/*,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => handleFiles(e.target.files, "image")}
                    />
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-3">
                      <ImageIcon className="size-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Upload Photos of Notes, Whiteboard, or Diagrams
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Snap a photo of blackboard or textbook pages (PNG, JPG, WEBP). AI extracts text & equations.
                    </p>
                  </div>
                )}

                {/* Tab 3: Record a Lecture Studio */}
                {activeTab === "record" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-3 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Live Lecture Recording Studio
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                        {formatSeconds(recordingSeconds)}
                      </span>
                    </div>

                    {micError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
                        {micError}
                      </div>
                    )}

                    {/* Waveform / Visualizer */}
                    <div className="flex h-16 items-center justify-center gap-1 rounded-xl bg-slate-900/90 px-4 py-2">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1.5 rounded-full transition-all duration-150",
                            recordingState === "recording"
                              ? "bg-rose-400 animate-pulse"
                              : "bg-slate-700",
                          )}
                          style={{
                            height:
                              recordingState === "recording"
                                ? `${Math.max(12, Math.sin(i * 0.7 + recordingSeconds) * 45 + 15)}%`
                                : "20%",
                          }}
                        />
                      ))}
                    </div>

                    {/* Recording Controls */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {recordingState === "idle" && (
                        <Button
                          type="button"
                          onClick={startRecording}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                        >
                          <Mic className="size-4 mr-1.5" />
                          Start Recording Lecture
                        </Button>
                      )}

                      {recordingState === "recording" && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={pauseRecording}
                            className="text-xs"
                          >
                            <Pause className="size-3.5 mr-1" />
                            Pause
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={stopRecording}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                          >
                            <Square className="size-3.5 mr-1 fill-white" />
                            Finish Recording
                          </Button>
                        </>
                      )}

                      {recordingState === "paused" && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={resumeRecording}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            <Play className="size-3.5 mr-1 fill-white" />
                            Resume
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={stopRecording}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                          >
                            <Square className="size-3.5 mr-1 fill-white" />
                            Finish Recording
                          </Button>
                        </>
                      )}

                      {recordingState === "stopped" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={startRecording}
                          className="text-xs"
                        >
                          <RefreshCw className="size-3.5 mr-1" />
                          Re-record
                        </Button>
                      )}
                    </div>

                    {/* Audio Playback & Review if stopped */}
                    {recordingState === "stopped" && (
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        {recordedAudioUrl && (
                          <div className="rounded-xl bg-white p-2.5 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <audio src={recordedAudioUrl} controls className="w-full h-8" />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Lecture Title
                          </label>
                          <Input
                            placeholder="e.g. Physics 101 Lecture: Projectile Motion"
                            value={recordedLectureTitle}
                            onChange={(e) => setRecordedLectureTitle(e.target.value)}
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Speech-to-Text Transcript (Editable)
                          </label>
                          <Textarea
                            placeholder="Transcribed lecture text appears here..."
                            rows={3}
                            value={recordedTranscript}
                            onChange={(e) => setRecordedTranscript(e.target.value)}
                            className="text-xs"
                          />
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddRecordedLecture}
                          className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white text-xs font-bold"
                        >
                          <Plus className="size-3.5 mr-1.5" />
                          Add Recorded Lecture to Study Set
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: Upload Audio / Video Files */}
                {activeTab === "media" && (
                  <div
                    onClick={() => mediaInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-7 text-center transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30 cursor-pointer"
                  >
                    <input
                      type="file"
                      ref={mediaInputRef}
                      className="hidden"
                      multiple
                      accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.mov,.webm"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 mb-3">
                      <Headphones className="size-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Upload Audio or Video Lecture Files
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Supports MP3, WAV, M4A audio or MP4/MOV video lecture captures (up to 100MB)
                    </p>
                  </div>
                )}

                {/* Tab 5: Links (YouTube / Web) */}
                {activeTab === "links" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://youtube.com/watch?v=... or https://example.edu/lecture"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddUrl}
                        disabled={!inputUrl.trim()}
                        className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs shrink-0"
                      >
                        <Plus className="size-3.5 mr-1" />
                        Add Link
                      </Button>
                    </div>

                    {detectedYtId && (
                      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 p-2.5 dark:border-red-950 dark:bg-red-950/20">
                        <img
                          src={`https://img.youtube.com/vi/${detectedYtId}/mqdefault.jpg`}
                          alt="YouTube Preview"
                          className="h-14 w-24 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1 text-xs">
                          <p className="font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                            <Youtube className="size-4 text-red-600 shrink-0" />
                            YouTube Lecture Detected
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            Ready to synthesize into interactive notes and flashcards.
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400">
                      Paste YouTube video URL (e.g. 3Blue1Brown, MIT OCW) or academic website article URL.
                    </p>
                  </div>
                )}

                {/* Tab 6: Paste Notes */}
                {activeTab === "paste" && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Source Title (e.g. Chapter 3: Relational Algebra & SQL)"
                      value={pastedTitle}
                      onChange={(e) => setPastedTitle(e.target.value)}
                      className="text-xs"
                    />
                    <Textarea
                      placeholder="Paste your lecture notes, textbook chapters, or syllabus text here..."
                      rows={5}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="text-xs leading-relaxed"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddPastedText}
                      disabled={!pastedText.trim()}
                      className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs"
                    >
                      <Plus className="size-3.5 mr-1" />
                      Add to Ingestion Queue
                    </Button>
                  </div>
                )}

                {/* Tab 7: MoE Curriculum Books */}
                {activeTab === "books" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select official Ethiopian university common freshman courses to generate full study set:
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {COMMON_ETHIOPIAN_COURSES.map((course) => (
                        <button
                          key={course.code}
                          type="button"
                          onClick={() => handleAddBook(course)}
                          className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-2.5 text-left transition hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                        >
                          <BookOpen className="size-4 shrink-0 text-blue-500 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {course.name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {course.code} • {course.subject}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ingestion Queue / Selected Sources */}
              {sources.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Selected Sources ({sources.length})
                    </label>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ Ready to compile into 1 Study Set
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {sources.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {s.thumbnailUrl ? (
                            <img
                              src={s.thumbnailUrl}
                              alt=""
                              className="size-8 rounded-md object-cover shrink-0"
                            />
                          ) : s.type === "recorded-lecture" ? (
                            <Mic className="size-4 text-rose-500 shrink-0" />
                          ) : s.type === "youtube" ? (
                            <Youtube className="size-4 text-red-500 shrink-0" />
                          ) : s.type === "image" ? (
                            <ImageIcon className="size-4 text-emerald-500 shrink-0" />
                          ) : s.type === "audio" ? (
                            <Headphones className="size-4 text-purple-500 shrink-0" />
                          ) : (
                            <FileText className="size-4 text-blue-500 shrink-0" />
                          )}

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {s.title}
                            </p>
                            <span className="rounded-sm bg-slate-200 px-1 py-0.2 text-[9px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {s.type.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSource(s.id)}
                          className="text-slate-400 hover:text-rose-500 transition p-1"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Metadata Configuration */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  2. Study Set Details
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Study Set Title
                    </label>
                    <Input
                      placeholder="e.g. General Physics: Mechanics & Kinematics"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Subject
                      </label>
                      <Input
                        placeholder="Physics, CS, Math"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Course Code
                      </label>
                      <Input
                        placeholder="Phys 1011"
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isGenerating && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-400">
              {sources.length === 0
                ? "Add at least 1 source to continue"
                : `${sources.length} ${sources.length === 1 ? "source" : "sources"} ready`}
            </span>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerate}
                disabled={sources.length === 0}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold"
              >
                <Sparkles className="size-4 mr-1.5 text-brand-gold" />
                Generate Study Set
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
