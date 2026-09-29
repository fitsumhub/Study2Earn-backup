import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
  Youtube,
} from "lucide-react";
import React, { useRef, useState } from "react";
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

interface CreateStudySetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSetId: string) => void;
}

type IngestionTab = "file" | "paste" | "books" | "url";

interface PendingSource {
  id: string;
  title: string;
  type: StudySetSource["type"];
  sizeBytes?: number;
  extractedText: string;
  snippet: string;
}

const COMMON_ETHIOPIAN_COURSES = [
  { code: "Phys 1011", name: "General Physics", subject: "Physics" },
  { code: "Math 1011", name: "Freshman Mathematics", subject: "Mathematics" },
  { code: "Phil 1011", name: "Logic & Critical Thinking", subject: "Philosophy" },
  { code: "SNIE 1012", name: "Inclusiveness", subject: "Education" },
  { code: "EmTe 1012", name: "Emerging Technologies", subject: "Technology" },
  { code: "CoSc 2041", name: "Database Systems", subject: "Computer Science" },
  { code: "EnLa 1011", name: "Communicative English", subject: "English" },
  { code: "SpSc 1011", name: "Physical Fitness", subject: "General" },
];

export function CreateStudySetModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateStudySetModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { config } = useIntegrations();

  const [activeTab, setActiveTab] = useState<IngestionTab>("file");
  const [dragOver, setDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Sources queue
  const [sources, setSources] = useState<PendingSource[]>([]);

  // Metadata form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [courseCode, setCourseCode] = useState("GEN 1000");
  const [folderId, setFolderId] = useState<string | undefined>(undefined);

  // Tab 2: Paste
  const [pastedText, setPastedText] = useState("");
  const [pastedTitle, setPastedTitle] = useState("");

  // Tab 3: Books
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  // Tab 4: URL
  const [inputUrl, setInputUrl] = useState("");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const folders = getStudySetFolders();

  if (!isOpen) return null;

  /* ── File Extraction Handler ── */
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsExtracting(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await extractTextFromFile(file);
        let type: StudySetSource["type"] = "pdf";
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "pptx" || ext === "ppt") type = "pptx";
        else if (ext === "docx" || ext === "doc") type = "docx";
        else if (ext === "txt") type = "txt";
        else if (["mp3", "wav", "m4a"].includes(ext || "")) type = "audio";
        else if (["mp4", "mov", "webm"].includes(ext || "")) type = "video";

        const newSource: PendingSource = {
          id: `pend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: file.name,
          type,
          sizeBytes: file.size,
          extractedText: text || `Lecture notes and practice concepts extracted from ${file.name}.`,
          snippet: (text || file.name).slice(0, 200),
        };

        setSources((prev) => [...prev, newSource]);

        // Auto infer title if first source
        if (!title) {
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
          setTitle(cleanName);
          // Auto infer subject
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
    const isYt = inputUrl.includes("youtube.com") || inputUrl.includes("youtu.be");
    const newSource: PendingSource = {
      id: `pend-url-${Date.now()}`,
      title: inputUrl.slice(0, 40),
      type: isYt ? "youtube" : "web",
      extractedText: `Online learning resource: ${inputUrl}. Ingested lecture concepts and key exam principles.`,
      snippet: inputUrl,
    };
    setSources((prev) => [...prev, newSource]);
    if (!title) setTitle(isYt ? "Video Lecture Study Pack" : "Web Article Study Pack");
    setInputUrl("");
  };

  const handleRemoveSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  /* ── Generate Study Set ── */
  const handleGenerate = async () => {
    if (sources.length === 0) return;
    setIsGenerating(true);
    setGenerationStep(1);
    setGenerationError(null);

    // Combine extracted text from all sources
    const combinedText = sources
      .map((s) => `=== SOURCE: ${s.title} ===\n${s.extractedText}`)
      .join("\n\n");

    try {
      // Step 2: Extracting concepts
      setTimeout(() => setGenerationStep(2), 500);
      // Step 3: Flashcards & Quizzes
      setTimeout(() => setGenerationStep(3), 1200);
      // Step 4: Written tests & blanks
      setTimeout(() => setGenerationStep(4), 2000);
      // Step 5: Podcast & notes
      setTimeout(() => setGenerationStep(5), 2800);

      // Call server generation function
      const provider = config.aiStudy?.provider || "openai";
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
    "Ingesting & analyzing learning sources",
    "Extracting fundamental concepts & boundary definitions",
    "Generating 3D Flashcards with active recall prompts",
    "Formulating multiple-choice questions & detailed explanations",
    "Creating written evaluation exercises & fill-in-the-blanks",
    "Finalizing AI Tutor grounding and podcast dialogue",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-serif text-xl font-bold text-brand-navy dark:text-white flex items-center gap-2">
              <Sparkles className="size-5 text-brand-gold" />
              Create AI Study Set
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              One source → one study set → 9 specialized study modes (Flashcards, Quizzes, Written Tests & AI Tutor)
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Generation Progress Overlay */}
          {isGenerating ? (
            <div className="py-12 text-center space-y-6 animate-in fade-in duration-300">
              <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50">
                <Loader2 className="size-10 animate-spin text-blue-600 dark:text-blue-400" />
                <Sparkles className="absolute -top-1 -right-1 size-5 text-amber-500 animate-pulse" />
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                  Preparing your AI Study Set...
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Synthesizing learning materials and generating study modes
                </p>
              </div>

              {/* Progress Steps List */}
              <div className="mx-auto max-w-md space-y-2.5 text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {stepsList.map((st, idx) => {
                  const stepNum = idx + 1;
                  const isDone = generationStep > stepNum;
                  const isCurrent = generationStep === stepNum;
                  return (
                    <div
                      key={st}
                      className={cn(
                        "flex items-center gap-3 text-xs transition-colors",
                        isDone && "text-emerald-600 dark:text-emerald-400 font-semibold",
                        isCurrent && "text-blue-600 dark:text-blue-400 font-bold",
                        !isDone && !isCurrent && "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      ) : isCurrent ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-blue-500" />
                      ) : (
                        <div className="size-4 shrink-0 rounded-full border border-slate-300 dark:border-slate-600" />
                      )}
                      <span>{st}</span>
                    </div>
                  );
                })}
              </div>

              {generationError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Source Tabs */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  1. Ingest Learning Materials
                </label>

                <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
                  <button
                    type="button"
                    onClick={() => setActiveTab("file")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition cursor-pointer",
                      activeTab === "file"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <Upload className="size-3.5" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("paste")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition cursor-pointer",
                      activeTab === "paste"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <FileText className="size-3.5" />
                    <span>Paste Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("books")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition cursor-pointer",
                      activeTab === "books"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <BookOpen className="size-3.5" />
                    <span>MoE Curriculum</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("url")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition cursor-pointer",
                      activeTab === "url"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <Globe className="size-3.5" />
                    <span>Link / YouTube</span>
                  </button>
                </div>

                {/* Tab 1: Upload File */}
                {activeTab === "file" && (
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
                      "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer",
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
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,audio/*,video/*"
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
                        ? "Extracting text and formulas from file..."
                        : "Drag & drop files here, or browse"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Supports PDF, PPT/PPTX slides, Word DOCX, TXT notes, and recordings (up to 30MB)
                    </p>
                  </div>
                )}

                {/* Tab 2: Paste Notes */}
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

                {/* Tab 3: MoE Curriculum Books */}
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

                {/* Tab 4: Web / YouTube Link */}
                {activeTab === "url" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://youtube.com/watch?v=... or https://example.edu/notes"
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
                    <p className="text-[11px] text-slate-400">
                      Paste YouTube video URL or public academic lecture link to transcribe concepts.
                    </p>
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

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {sources.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="size-3.5 text-blue-500 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {s.title}
                          </span>
                          <span className="rounded-sm bg-slate-200 px-1 py-0.2 text-[10px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            {s.type.toUpperCase()}
                          </span>
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

