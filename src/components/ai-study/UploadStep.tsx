import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  ClipboardPaste,
  FileCheck2,
  FileText,
  Gauge,
  Headphones,
  History,
  Layers,
  Lightbulb,
  Link as LinkIcon,
  Mic,
  MicOff,
  Radio,
  Repeat,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  StopCircle,
  Trash2,
  Trophy,
  Upload,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useState, useRef, useEffect, type ChangeEvent, type DragEvent, type RefObject } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import type { AiStudyHistoryEntry } from "@/lib/ai-study-store";
import { libraryBooks, type LibraryBook } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import { ACCEPT_TYPES, FILE_TYPES } from "./text-extraction";
import { QUESTION_COUNT_OPTIONS } from "./demo-content";
import { relativeTime } from "./study-pack";
import { subjectLabel, subjectTheme } from "./subject";

export type UploadInputMode = "file" | "paste" | "youtube" | "audio" | "books";

export function UploadStep({
  dragOver,
  setDragOver,
  onDrop,
  onFileInput,
  onDemo,
  onTextSubmit,
  fileInputRef,
  questionCount,
  setQuestionCount,
  aiReady,
  history,
  onResumeHistory,
  onRemoveHistory,
  onClearHistory,
  lastReadBook,
  lastReadPage,
  onGenerateFromBook,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: DragEvent) => void;
  onFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
  onDemo: () => void;
  onTextSubmit: (text: string) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  questionCount: number;
  setQuestionCount: (n: number) => void;
  aiReady: boolean;
  history: AiStudyHistoryEntry[];
  onResumeHistory: (entry: AiStudyHistoryEntry) => void;
  onRemoveHistory: (id: string) => void;
  onClearHistory: () => void;
  lastReadBook: LibraryBook | null;
  lastReadPage: number;
  onGenerateFromBook: (book: LibraryBook) => void;
}) {
  const { loggedIn, user } = useAuth();
  const { balance: xpBalance } = useWallet();
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
    // Pass transcription placeholder to generation
    onTextSubmit(
      `Audio Lecture Recording (${recordingDuration} seconds)\n\nKey discussion points covered:\n- Primary lecture topic definitions and core laws of motion\n- Experimental kinematics formulas and vector decomposition\n- Conservation principles and exam preparation advice.`,
    );
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    toast.info("Extracting video lecture transcript...");
    // Simulate YouTube transcript extraction & submit
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
    <div className="animate-in fade-in-0 duration-500">
      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden px-6 py-14 text-white shadow-lg"
        style={{
          backgroundColor: "#0e1420",
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="relative mx-auto max-w-5xl">
          {/* Personalization row */}
          {loggedIn && user && (
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold text-white/70">
                👋 Welcome back, <span className="text-white font-bold">{user.name}</span>
                {user.university ? ` · ${user.university}` : ""}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-xs font-bold text-brand-gold">
                <Sparkles className="size-3" />
                {xpBalance.toLocaleString()} XP
              </span>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div
              title={
                aiReady
                  ? "A real AI provider is configured — study sets are generated from your actual content"
                  : "No AI provider is configured yet — you'll get smart demo study sets instead"
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-sm",
                aiReady
                  ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-300"
                  : "border-white/15 bg-white/5 text-white/60",
              )}
            >
              {aiReady ? <Zap className="size-3.5" /> : <ClipboardList className="size-3.5" />}
              {aiReady ? "AI generation live" : "Demo mode ready"}
            </div>
          </div>

          <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl text-white">
            Turn any material into a{" "}
            <span className="text-brand-gold">full study set.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/65 md:text-lg">
            Upload, paste, or pick a book — get flashcards, quizzes, notes and an AI tutor in seconds.
          </p>
        </div>
      </div>

      {/* ── Studley Capability Rail ── */}
      <div className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto grid max-w-5xl gap-px bg-slate-200 sm:grid-cols-3">
          {[
            {
              icon: FileCheck2,
              label: "Multi-Source Extraction",
              detail: "Upload PDF, PPTX, paste notes, YouTube links, or voice recordings.",
              color: "bg-blue-50 text-blue-700",
            },
            {
              icon: Layers,
              label: "Active Recall & Spaced Repetition",
              detail: "Rate cards as Mastered or Still Learning to target your weak spots.",
              color: "bg-amber-50 text-amber-700",
            },
            {
              icon: Radio,
              label: "AI Podcast & 24/7 Tutor",
              detail: "Listen to audio discussions on the go and ask grounded questions.",
              color: "bg-emerald-50 text-emerald-700",
            },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 bg-white px-6 py-5">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  item.color,
                )}
              >
                <item.icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-navy">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Input Hub ── */}
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Continue reading alert if student was reading a book */}
        {lastReadBook && (
          <div className="flex flex-col gap-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-brand-navy",
                lastReadBook.tint,
              )}
            >
              <BookMarked className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Continue where you left off
              </p>
              <p className="mt-0.5 truncate font-serif text-lg font-bold text-brand-navy">
                {lastReadBook.name}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                Page {lastReadPage} · {lastReadBook.progress}% read
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                to="/library/read/$bookId"
                params={{ bookId: lastReadBook.id }}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:border-brand-navy/30 hover:bg-slate-50"
              >
                Continue reading
                <ArrowRight className="size-4" />
              </Link>
              <button
                type="button"
                onClick={() => onGenerateFromBook(lastReadBook)}
                className="flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-navy/90"
              >
                <Sparkles className="size-4 text-brand-gold" />
                Generate Study Set
              </button>
            </div>
          </div>
        )}

        {/* ── Studley Input Switcher Card ── */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Input Selector Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/60 overflow-x-auto no-scrollbar">
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
                    "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all duration-150",
                    isActive
                      ? "border-brand-navy bg-white text-brand-navy shadow-xs"
                      : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800",
                  )}
                >
                  <Icon className={cn("size-4", isActive ? "text-brand-gold" : "text-slate-400")} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          <div className="p-8">
            {/* ── 1. FILE UPLOAD ── */}
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
                  "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                  dragOver
                    ? "border-brand-gold bg-brand-gold/5 scale-[1.01] shadow-xl"
                    : "border-slate-200 bg-slate-50/50 hover:border-brand-gold hover:bg-brand-gold/5",
                )}
              >
                <div
                  className={cn(
                    "relative mb-5 flex size-20 items-center justify-center rounded-2xl transition-all duration-300",
                    dragOver
                      ? "bg-brand-gold text-white scale-110 shadow-lg"
                      : "bg-brand-navy/10 text-brand-navy group-hover:bg-brand-gold group-hover:text-white",
                  )}
                >
                  <Upload className="size-9" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-brand-navy">
                  {dragOver ? "Drop your file here" : "Drag & drop your study material"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  or{" "}
                  <span className="font-semibold text-brand-navy underline decoration-brand-gold underline-offset-4">
                    browse files
                  </span>{" "}
                  from your computer
                </p>

                {/* File types */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {FILE_TYPES.map((ft) => (
                    <span
                      key={ft.ext}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                        ft.color,
                      )}
                    >
                      <CheckCircle2 className="size-3" />
                      {ft.ext}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  PDF, PPT, PPTX, DOC, DOCX, TXT, EPUB · Up to 50 MB
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

            {/* ── 2. PASTE NOTES ── */}
            {inputMode === "paste" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-brand-navy">Paste Study Notes</h3>
                    <p className="text-xs text-slate-500">
                      Paste lecture summaries, textbook excerpts, or revision points
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-slate-400">
                    Generates flashcards, practice exam, AI tutor context, and podcast dialogue.
                  </p>
                  <Button
                    type="button"
                    disabled={pastedText.trim().length < 60}
                    onClick={() => onTextSubmit(pastedText)}
                    className="rounded-xl bg-brand-navy px-6 font-bold text-white hover:bg-brand-navy/90"
                  >
                    <Sparkles className="mr-2 size-4 text-brand-gold" />
                    Generate Study Set
                  </Button>
                </div>
              </div>
            )}

            {/* ── 3. YOUTUBE / VIDEO LINK ── */}
            {inputMode === "youtube" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-navy">
                    Generate from YouTube or Video Lecture
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paste any YouTube lecture link, Coursera URL, or video lesson to extract concepts
                  </p>
                </div>

                <form onSubmit={handleYoutubeSubmit} className="space-y-4">
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10"
                      required
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">
                    💡 <strong>Tip:</strong> Works with full lecture recordings, tutorial videos, and crash courses. Our AI analyzes the transcript and structures it into active study tools.
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!youtubeUrl.trim()}
                      className="rounded-xl bg-brand-navy px-6 font-bold text-white hover:bg-brand-navy/90"
                    >
                      <Sparkles className="mr-2 size-4 text-brand-gold" />
                      Process Video Lecture
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* ── 4. VOICE / AUDIO LECTURE ── */}
            {inputMode === "audio" && (
              <div className="space-y-6 text-center py-4">
                <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-brand-navy/10 text-brand-navy">
                  <Mic className="size-9" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-brand-navy">
                    Record Live Lecture Audio
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                    Record a live professor explanation or study group discussion to create study materials.
                  </p>
                </div>

                {/* Recorder controls */}
                <div className="flex flex-col items-center justify-center gap-4">
                  {!isRecording ? (
                    <Button
                      type="button"
                      onClick={handleStartRecording}
                      className="rounded-2xl bg-rose-600 px-8 py-6 text-base font-bold text-white hover:bg-rose-700 shadow-lg shadow-rose-200"
                    >
                      <Mic className="mr-2 size-5" />
                      Start Recording Lecture
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 rounded-full bg-rose-50 border border-rose-200 px-6 py-2 text-rose-700">
                        <span className="size-3 rounded-full bg-rose-500 animate-ping" />
                        <span className="font-mono text-lg font-bold">
                          {Math.floor(recordingDuration / 60)}:
                          {(recordingDuration % 60).toString().padStart(2, "0")}
                        </span>
                        <span className="text-xs font-semibold">Recording...</span>
                      </div>
                      <Button
                        type="button"
                        onClick={handleStopRecording}
                        className="rounded-2xl bg-brand-navy px-8 py-4 font-bold text-white hover:bg-brand-navy/90"
                      >
                        <StopCircle className="mr-2 size-5 text-brand-gold" />
                        Stop & Generate Study Set
                      </Button>
                    </div>
                  )}

                  <div className="pt-2">
                    <span className="text-xs text-slate-400">or drop an audio file (.mp3, .wav, .m4a) in the file tab</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── 5. CURRICULUM BOOKS PICKER ── */}
            {inputMode === "books" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-brand-navy">
                      Study from MoE Textbooks
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pick any freshman Exit Exam textbook to instantly generate a full study set
                    </p>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      placeholder="Search books..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-navy focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-80 overflow-y-auto pr-1">
                  {filteredBooks.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => onGenerateFromBook(book)}
                      className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-3.5 transition-all hover:border-brand-gold hover:bg-brand-gold/5 hover:shadow-md"
                    >
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-brand-navy font-bold text-xs",
                          book.tint,
                        )}
                      >
                        {book.short}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-serif font-bold text-sm text-brand-navy truncate group-hover:text-brand-navy">
                          {book.name}
                        </p>
                        <p className="text-xs text-slate-500">{book.category}</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-navy/70 group-hover:text-brand-gold">
                          <Sparkles className="size-3" />
                          Generate set
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Suggested prompts ── */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick study prompts</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Explain Newton's laws step by step",
              "Summarize Chapter 3 key concepts",
              "Create 20 multiple-choice questions",
              "What will be on the Exit Exam?",
              "Define all terms in my notes",
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setPastedText(prompt);
                  setInputMode("paste");
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-navy/40 hover:bg-brand-navy/5 hover:text-brand-navy"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* ── Ready-Made Demo Banner ── */}
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-brand-gold/30 bg-gradient-to-r from-brand-gold/10 via-amber-50/50 to-transparent px-6 py-4 sm:flex-row shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold text-brand-navy font-bold shadow-sm">
              <Brain className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-navy">
                Want to see the Studley experience in action?
              </p>
              <p className="text-xs text-slate-600">
                Instantly load our ready-made Physics study set with 3D flashcards and podcast.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={onDemo}
            className="rounded-xl bg-brand-navy px-5 font-bold text-white hover:bg-brand-navy/90 shadow-sm"
          >
            Try Demo Study Set
            <ArrowRight className="ml-1.5 size-4 text-brand-gold" />
          </Button>
        </div>

        {/* ── Study Set Preferences (Item count & difficulty) ── */}
        <div className="grid grid-cols-1 gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
          {/* Question Count */}
          <div>
            <p className="font-serif font-bold text-brand-navy">Study Set Size</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Select how many questions & cards to generate
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUESTION_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuestionCount(n)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-bold transition-all",
                    questionCount === n
                      ? "bg-brand-navy text-white shadow-md shadow-brand-navy/20"
                      : "border border-slate-200 text-slate-600 hover:border-brand-navy/30 hover:bg-slate-50",
                  )}
                >
                  {n} items
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <p className="font-serif font-bold text-brand-navy">Target Exam Difficulty</p>
            <p className="text-xs text-slate-500 mt-0.5">Calibrate questions for your exam level</p>
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
                    "rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
                    selectedDifficulty === diff.id
                      ? "bg-brand-navy text-brand-gold shadow-md"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent study packs (Study Library) ── */}
        {history.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                  <History className="size-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-brand-navy">
                    Your Study Set Library
                  </h3>
                  <p className="text-xs text-slate-500">Jump right back into previous packs</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClearHistory}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="size-3.5" />
                Clear history
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {history.map((entry) => {
                const theme = subjectTheme[entry.subject] ?? subjectTheme.general;
                return (
                  <div
                    key={entry.id}
                    className="group relative flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition-all hover:border-brand-navy/30 hover:bg-slate-50/80"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("size-2 rounded-full", theme.dot)} />
                        <span className="font-bold text-sm text-brand-navy">
                          {subjectLabel(entry.subject)}
                        </span>
                        {entry.scorePct !== undefined && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              entry.scorePct >= 80
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700",
                            )}
                          >
                            {entry.scorePct}% score
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500 font-medium">
                        {entry.filename}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {entry.questionCount} questions · {relativeTime(entry.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onResumeHistory(entry)}
                        className="rounded-xl bg-brand-navy/10 font-bold text-brand-navy hover:bg-brand-navy hover:text-white text-xs"
                      >
                        Study
                      </Button>
                      <button
                        type="button"
                        onClick={() => onRemoveHistory(entry.id)}
                        className="rounded-lg p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
