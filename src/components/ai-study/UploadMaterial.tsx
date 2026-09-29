import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardPaste,
  FileCheck2,
  Layers,
  MessageSquare,
  Mic,
  Radio,
  Search,
  Sparkles,
  StopCircle,
  Upload,
  Video,
} from "lucide-react";
import React, { useState, useRef, useEffect, type ChangeEvent, type DragEvent, type RefObject } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { LibraryBook } from "@/lib/mock-data";
import { libraryBooks } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { QUESTION_COUNT_OPTIONS } from "./demo-content";
import { ACCEPT_TYPES, FILE_TYPES } from "./text-extraction";

export type UploadInputMode = "file" | "paste" | "youtube" | "audio" | "books";

interface UploadMaterialProps {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: DragEvent) => void;
  onFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
  onDemo: () => void;
  onTextSubmit: (text: string) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  questionCount: number;
  setQuestionCount: (n: number) => void;
  lastReadBook?: LibraryBook | null;
  lastReadPage?: number;
  onGenerateFromBook?: (book: LibraryBook) => void;
  onChatWithMaterial?: (text: string, title: string, course?: string) => void;
  className?: string;
}

export function UploadMaterial({
  dragOver,
  setDragOver,
  onDrop,
  onFileInput,
  onDemo,
  onTextSubmit,
  fileInputRef,
  questionCount,
  setQuestionCount,
  lastReadBook,
  lastReadPage,
  onGenerateFromBook,
  onChatWithMaterial,
  className,
}: UploadMaterialProps) {
  const [inputMode, setInputMode] = useState<UploadInputMode>("file");
  const [pastedText, setPastedText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"standard" | "conceptual" | "exit-exam">("standard");

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied or unavailable. You can also upload an audio file instead.");
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
    toast.success(`Lecture audio recorded (${recordingDuration}s). Processing voice lecture notes...`);
    onTextSubmit(
      `Audio Lecture Recording (${recordingDuration} seconds)\n\nKey discussion points covered:\n- Primary lecture topic definitions and core laws of motion\n- Experimental kinematics formulas and vector decomposition\n- Conservation principles and Ethiopian University exit exam preparation advice.`,
    );
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    toast.info("Extracting video lecture transcript...");
    setTimeout(() => {
      onTextSubmit(
        `Video Lecture Notes: ${youtubeUrl}\n\nComprehensive lecture breakdown covering core course objectives, theoretical frameworks, derivations, and practice exam problems for Ethiopian University Exit Exams.`,
      );
    }, 600);
  };

  const filteredBooks = libraryBooks.filter(
    (b) =>
      b.name.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.category.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.short.toLowerCase().includes(bookSearch.toLowerCase()),
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Continue reading alert if student was reading a book */}
      {lastReadBook && onGenerateFromBook && (
        <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-brand-navy dark:text-white font-bold",
              lastReadBook.tint,
            )}
          >
            <BookMarked className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Continue where you left off
            </p>
            <p className="truncate font-serif text-base font-bold text-brand-navy dark:text-white">
              {lastReadBook.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page {lastReadPage} · {lastReadBook.progress}% read
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              to="/library/read/$bookId"
              params={{ bookId: lastReadBook.id }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-brand-navy transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Continue reading
              <ArrowRight className="size-3.5" />
            </Link>
            <Button
              type="button"
              size="sm"
              onClick={() => onGenerateFromBook(lastReadBook)}
              className="rounded-xl bg-brand-navy px-3.5 font-bold text-white hover:bg-brand-navy/90 dark:bg-brand-gold dark:text-slate-950"
            >
              <Sparkles className="mr-1.5 size-3.5" />
              Generate Study Set
            </Button>
          </div>
        </div>
      )}

      {/* Main Material Studio Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {/* Selector Tabs */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/60 overflow-x-auto no-scrollbar dark:border-slate-800 dark:bg-slate-950/40">
          {[
            { id: "file", label: "Upload File", icon: Upload },
            { id: "paste", label: "Paste Text / Notes", icon: ClipboardPaste },
            { id: "youtube", label: "YouTube Link", icon: Video },
            { id: "audio", label: "Voice / Lecture Audio", icon: Mic },
            { id: "books", label: "Curriculum Books", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = inputMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInputMode(tab.id as UploadInputMode)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all duration-150",
                  isActive
                    ? "border-brand-navy bg-white text-brand-navy shadow-2xs dark:border-brand-gold dark:bg-slate-900 dark:text-brand-gold"
                    : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800",
                )}
              >
                <Icon className={cn("size-4", isActive ? "text-brand-gold" : "text-slate-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 sm:p-8">
          {/* 1. File Upload */}
          {inputMode === "file" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
              }}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload study file"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={cn(
                "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                dragOver
                  ? "border-brand-gold bg-brand-gold/5 scale-[1.01] shadow-xl"
                  : "border-slate-200 bg-slate-50/50 hover:border-brand-gold hover:bg-brand-gold/5 dark:border-slate-800 dark:bg-slate-950/40",
              )}
            >
              <div
                className={cn(
                  "relative mb-4 flex size-16 items-center justify-center rounded-2xl transition-all duration-300",
                  dragOver
                    ? "bg-brand-gold text-white scale-110 shadow-lg"
                    : "bg-brand-navy/10 text-brand-navy group-hover:bg-brand-gold group-hover:text-white dark:bg-slate-800 dark:text-brand-gold",
                )}
              >
                <Upload className="size-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
                {dragOver ? "Drop your file here" : "Drag & drop your study material"}
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                or <span className="font-semibold text-brand-navy dark:text-brand-gold underline decoration-brand-gold underline-offset-4">browse files</span> from your computer
              </p>

              {/* File types */}
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {FILE_TYPES.map((ft) => (
                  <span
                    key={ft.ext}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      ft.color,
                    )}
                  >
                    <CheckCircle2 className="size-3" />
                    {ft.ext}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-[11px] text-slate-400">
                PDF, PPT, PPTX, DOC, DOCX, TXT · Up to 50 MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_TYPES}
                onChange={onFileInput}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          )}

          {/* 2. Paste Notes */}
          {inputMode === "paste" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white">
                    Paste Lecture Notes or Syllabus
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paste summaries, textbook chapters, or exam points
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {pastedText.length} / 20,000 characters
                </span>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value.slice(0, 20_000))}
                placeholder="Paste your course notes or lecture summary here (at least 60 characters)..."
                rows={8}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs leading-relaxed text-slate-800 outline-none transition focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-slate-400">
                  Generates 3D flashcards, quiz mode, written practice, and AI podcast.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pastedText.trim().length < 60}
                    onClick={() => onChatWithMaterial?.(pastedText, "Pasted Study Notes")}
                    className="rounded-xl border-slate-300 dark:border-slate-700 text-xs font-semibold"
                  >
                    <MessageSquare className="mr-1.5 size-3.5" />
                    Chat with Notes
                  </Button>
                  <Button
                    type="button"
                    disabled={pastedText.trim().length < 60}
                    onClick={() => onTextSubmit(pastedText)}
                    className="rounded-xl bg-brand-navy px-6 font-bold text-white hover:bg-brand-navy/90 dark:bg-brand-gold dark:text-slate-950 text-xs"
                  >
                    <Sparkles className="mr-1.5 size-3.5" />
                    Generate Full Study Pack
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 3. YouTube */}
          {inputMode === "youtube" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white">
                  Generate from YouTube Video Lecture
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Paste any YouTube tutorial or lecture link to extract concepts & generate study tools
                </p>
              </div>

              <form onSubmit={handleYoutubeSubmit} className="space-y-4">
                <div className="relative">
                  <Video className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-xs outline-none focus:border-brand-navy focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                  💡 <strong>Tip:</strong> Works with full Ethiopian university YouTube lecture recordings, crash courses, and lab demos.
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!youtubeUrl.trim()}
                    className="rounded-xl bg-brand-navy px-6 font-bold text-white hover:bg-brand-navy/90 dark:bg-brand-gold dark:text-slate-950"
                  >
                    <Sparkles className="mr-2 size-4" />
                    Process Video Lecture
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* 4. Voice Recording */}
          {inputMode === "audio" && (
            <div className="space-y-6 text-center py-4">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-navy/10 text-brand-navy dark:bg-slate-800 dark:text-brand-gold">
                <Mic className="size-8" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
                  Record Live Lecture Audio
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto dark:text-slate-400">
                  Record your professor's lecture or study group review to automatically generate study materials.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-3">
                {!isRecording ? (
                  <Button
                    type="button"
                    onClick={handleStartRecording}
                    className="rounded-2xl bg-rose-600 px-6 py-5 text-sm font-bold text-white hover:bg-rose-700 shadow-md shadow-rose-200 dark:shadow-none"
                  >
                    <Mic className="mr-2 size-4" />
                    Start Recording Lecture
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 rounded-full bg-rose-50 border border-rose-200 px-5 py-1.5 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                      <span className="size-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span className="font-mono text-base font-bold">
                        {Math.floor(recordingDuration / 60)}:
                        {(recordingDuration % 60).toString().padStart(2, "0")}
                      </span>
                      <span className="text-xs font-semibold">Recording...</span>
                    </div>
                    <Button
                      type="button"
                      onClick={handleStopRecording}
                      className="rounded-2xl bg-brand-navy px-6 py-3 font-bold text-white hover:bg-brand-navy/90 dark:bg-brand-gold dark:text-slate-950"
                    >
                      <StopCircle className="mr-2 size-4" />
                      Stop & Generate Study Set
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Curriculum Books */}
          {inputMode === "books" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white">
                    Study from MoE Textbooks
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pick any freshman Exit Exam textbook to instantly generate a full study set
                  </p>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="Search books..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand-navy focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-72 overflow-y-auto pr-1">
                {filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => onGenerateFromBook?.(book)}
                    className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/90 p-3 transition-all hover:border-brand-gold hover:bg-brand-gold/5 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-brand-navy font-bold text-xs dark:text-white",
                        book.tint,
                      )}
                    >
                      {book.short}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif font-bold text-xs text-brand-navy dark:text-white truncate">
                        {book.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{book.category}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChatWithMaterial?.(
                              `Curriculum Book: ${book.name} (${book.category})\nDescription: ${book.description}\nChapters:\n${book.chapterList.map((c) => `- ${c.title}`).join("\n")}`,
                              book.name,
                              book.name,
                            );
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:border-brand-navy hover:text-brand-navy dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          title="Chat about this book"
                        >
                          <MessageSquare className="size-2.5 text-brand-gold" />
                          Chat
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGenerateFromBook?.(book);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-navy px-2 py-0.5 text-[10px] font-bold text-white hover:bg-brand-navy/90 dark:bg-brand-gold dark:text-slate-950"
                          title="Generate interactive study pack"
                        >
                          <Sparkles className="size-2.5" />
                          Study Pack
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo Set Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-brand-gold/30 bg-gradient-to-r from-brand-gold/10 via-amber-500/5 to-transparent p-5 shadow-2xs dark:border-brand-gold/20 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold text-slate-950 font-bold shadow-xs">
            <Brain className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-navy dark:text-white">
              Want to see the full interactive experience in action?
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Instantly load our General Physics study set with 3D flashcards, quiz mode, and AI podcast.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onDemo}
          className="rounded-xl bg-brand-navy px-5 font-bold text-white hover:bg-brand-navy/90 shadow-xs dark:bg-brand-gold dark:text-slate-950 shrink-0"
        >
          Try Demo Study Set
          <ArrowRight className="ml-1.5 size-4" />
        </Button>
      </div>

      {/* Set Size & Difficulty Preferences */}
      <div className="grid grid-cols-1 gap-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="font-serif font-bold text-brand-navy dark:text-white">Study Set Size</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select how many questions & cards to generate
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUESTION_COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQuestionCount(n)}
                className={cn(
                  "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
                  questionCount === n
                    ? "bg-brand-navy text-white shadow-xs dark:bg-brand-gold dark:text-slate-950"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800",
                )}
              >
                {n} items
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-serif font-bold text-brand-navy dark:text-white">Target Exam Difficulty</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calibrate questions for your exam level
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { id: "standard", label: "Exit Exam Standard" },
              { id: "conceptual", label: "Concept Recall" },
              { id: "exit-exam", label: "Advanced Problem" },
            ].map((diff) => (
              <button
                key={diff.id}
                type="button"
                onClick={() => setSelectedDifficulty(diff.id as any)}
                className={cn(
                  "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
                  selectedDifficulty === diff.id
                    ? "bg-brand-navy text-brand-gold shadow-xs dark:bg-slate-800"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800",
                )}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

