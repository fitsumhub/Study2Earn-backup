import {
  Headphones,
  Mic,
  Pause,
  Play,
  Radio,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { PodcastEpisode } from "./types";

export function AiPodcastPlayer({ podcast }: { podcast: PodcastEpisode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const dialogue = podcast.dialogue;
  const currentItem = dialogue[currentLineIndex] || dialogue[0];
  const progressPct = dialogue.length > 0 ? Math.round(((currentLineIndex + 1) / dialogue.length) * 100) : 0;

  // Auto scroll transcript to active dialogue line
  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentLineIndex]);

  // Handle SpeechSynthesis speech playback
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (!isPlaying) {
      window.speechSynthesis.cancel();
      return;
    }

    const speakCurrentLine = () => {
      window.speechSynthesis.cancel();
      if (currentLineIndex >= dialogue.length) {
        setIsPlaying(false);
        setCurrentLineIndex(0);
        return;
      }

      const item = dialogue[currentLineIndex];
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.rate = playbackSpeed;

      // Assign distinct voices if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 1) {
        if (item.speaker === "Alex") {
          utterance.voice = voices.find((v) => v.name.includes("Male") || v.name.includes("David") || v.name.includes("Natural")) || voices[0];
        } else {
          utterance.voice = voices.find((v) => v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Google") || v.name.includes("Samantha")) || voices[1] || voices[0];
        }
      }

      utterance.onend = () => {
        if (currentLineIndex < dialogue.length - 1) {
          setCurrentLineIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentLineIndex(0);
        }
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakCurrentLine();

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isPlaying, currentLineIndex, playbackSpeed, dialogue]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsPlaying(true);
    }
  };

  const handleNextLine = () => {
    if (currentLineIndex < dialogue.length - 1) {
      setCurrentLineIndex((p) => p + 1);
    }
  };

  const handlePrevLine = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex((p) => p - 1);
    }
  };

  const handleRestart = () => {
    setCurrentLineIndex(0);
    setIsPlaying(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const speeds = [0.8, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ── Podcast Hero Player Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-navy/20 bg-gradient-to-br from-brand-navy via-[#1e2d5a] to-[#0f1a38] p-8 text-white shadow-xl">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 size-48 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="relative space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-brand-gold backdrop-blur-sm">
              <Radio className="size-3.5 animate-pulse" />
              AI Conversational Podcast
            </div>
            <span className="text-xs font-semibold text-white/70">
              Est. runtime: {podcast.durationEstimate}
            </span>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold leading-tight md:text-3xl text-white">
              {podcast.title}
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Hosted by <span className="font-semibold text-brand-gold">Alex</span> &{" "}
              <span className="font-semibold text-brand-gold">Jordan</span>
            </p>
          </div>

          {/* ── Host Avatars & Animated Voice Waves ── */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
            {/* Host Alex */}
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl p-3 transition-all",
                currentItem?.speaker === "Alex" && isPlaying
                  ? "bg-brand-gold/20 ring-1 ring-brand-gold/50"
                  : "opacity-75",
              )}
            >
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gold text-brand-navy font-bold text-lg shadow-md">
                A
                {currentItem?.speaker === "Alex" && isPlaying && (
                  <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 border-2 border-brand-navy animate-ping" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-white truncate">Alex</p>
                <p className="text-[11px] text-white/60">Lead Instructor</p>
                {currentItem?.speaker === "Alex" && isPlaying && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="h-2.5 w-1 rounded-full bg-brand-gold animate-bounce" />
                    <span className="h-4 w-1 rounded-full bg-brand-gold animate-bounce [animation-delay:0.15s]" />
                    <span className="h-3 w-1 rounded-full bg-brand-gold animate-bounce [animation-delay:0.3s]" />
                    <span className="h-5 w-1 rounded-full bg-brand-gold animate-bounce [animation-delay:0.45s]" />
                  </div>
                )}
              </div>
            </div>

            {/* Host Jordan */}
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl p-3 transition-all",
                currentItem?.speaker === "Jordan" && isPlaying
                  ? "bg-brand-gold/20 ring-1 ring-brand-gold/50"
                  : "opacity-75",
              )}
            >
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-400 text-brand-navy font-bold text-lg shadow-md">
                J
                {currentItem?.speaker === "Jordan" && isPlaying && (
                  <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 border-2 border-brand-navy animate-ping" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-white truncate">Jordan</p>
                <p className="text-[11px] text-white/60">Study Co-Host</p>
                {currentItem?.speaker === "Jordan" && isPlaying && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="h-2.5 w-1 rounded-full bg-teal-300 animate-bounce" />
                    <span className="h-4 w-1 rounded-full bg-teal-300 animate-bounce [animation-delay:0.15s]" />
                    <span className="h-3 w-1 rounded-full bg-teal-300 animate-bounce [animation-delay:0.3s]" />
                    <span className="h-5 w-1 rounded-full bg-teal-300 animate-bounce [animation-delay:0.45s]" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Scrubber & Current Line Display ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>
                Section {currentLineIndex + 1} of {dialogue.length}
              </span>
              <span>{progressPct}% Completed</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full bg-brand-gold transition-all duration-300"
              />
            </div>
          </div>

          {/* Current quote highlight */}
          <div className="min-h-20 rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-gold mb-1">
              Currently Speaking: {currentItem?.speaker}
            </p>
            <p className="text-base font-medium leading-relaxed text-white/95 italic">
              "{currentItem?.text}"
            </p>
          </div>

          {/* ── Audio Controls Bar ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4">
            {/* Speed Control */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white/60">Speed:</span>
              <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
                {speeds.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPlaybackSpeed(s)}
                    className={cn(
                      "rounded-lg px-2 py-0.5 text-xs font-bold transition-colors",
                      playbackSpeed === s
                        ? "bg-brand-gold text-brand-navy"
                        : "text-white/70 hover:text-white",
                    )}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Play/Pause & Skipping */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrevLine}
                disabled={currentLineIndex === 0}
                className="size-10 rounded-xl text-white hover:bg-white/10"
              >
                <SkipBack className="size-5" />
              </Button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause podcast" : "Play podcast"}
                className="flex size-14 items-center justify-center rounded-2xl bg-brand-gold text-brand-navy shadow-lg shadow-brand-gold/30 transition-transform hover:scale-105 active:scale-95 font-bold"
              >
                {isPlaying ? <Pause className="size-7" /> : <Play className="ml-1 size-7" />}
              </button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNextLine}
                disabled={currentLineIndex >= dialogue.length - 1}
                className="size-10 rounded-xl text-white hover:bg-white/10"
              >
                <SkipForward className="size-5" />
              </Button>
            </div>

            {/* Restart */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              className="rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="mr-1.5 size-4" />
              Restart
            </Button>
          </div>
        </div>
      </div>

      {/* ── Synchronized Interactive Transcript ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Headphones className="size-4 text-brand-navy" />
            <h3 className="font-serif text-base font-bold text-brand-navy">
              Synchronized Transcript
            </h3>
          </div>
          <span className="text-xs text-slate-400">Click any line to jump audio</span>
        </div>

        <div
          ref={transcriptRef}
          className="max-h-96 overflow-y-auto space-y-3 pr-2 scroll-smooth"
        >
          {dialogue.map((line, idx) => {
            const isCurrent = idx === currentLineIndex;
            return (
              <div
                key={line.id}
                ref={isCurrent ? activeLineRef : null}
                onClick={() => {
                  setCurrentLineIndex(idx);
                  if (!isPlaying) setIsPlaying(true);
                }}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl p-3.5 transition-all",
                  isCurrent
                    ? "bg-brand-gold/15 border border-brand-gold/40 shadow-sm"
                    : "hover:bg-slate-50 border border-transparent",
                )}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                    line.speaker === "Alex"
                      ? "bg-brand-navy text-brand-gold"
                      : "bg-teal-600 text-white",
                  )}
                >
                  {line.speaker[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-xs text-brand-navy">{line.speaker}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{line.role}</span>
                  </div>
                  <p
                    className={cn(
                      "text-sm leading-relaxed",
                      isCurrent ? "font-semibold text-brand-navy" : "text-slate-600",
                    )}
                  >
                    {line.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

