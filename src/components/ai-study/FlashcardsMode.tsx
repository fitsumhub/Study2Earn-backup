import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
  LayoutGrid,
  Plus,
  RotateCw,
  Search,
  Shuffle,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { Flashcard, FlashcardMastery } from "./types";

export function FlashcardsMode({
  initialFlashcards,
  subjectTitle,
}: {
  initialFlashcards: Flashcard[];
  subjectTitle: string;
}) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<"slideshow" | "grid">("slideshow");
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newTopic, setNewTopic] = useState("");

  // Sync if initialFlashcards changes
  useEffect(() => {
    setFlashcards(initialFlashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [initialFlashcards]);

  const activeCards = useMemo(() => {
    let list = flashcards;
    if (filterStarredOnly) {
      list = list.filter((c) => c.starred);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.front.toLowerCase().includes(q) ||
          c.back.toLowerCase().includes(q) ||
          (c.topic && c.topic.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [flashcards, filterStarredOnly, searchQuery]);

  const currentCard = activeCards[currentIndex] || activeCards[0];

  // Stats calculation
  const total = flashcards.length;
  const masteredCount = flashcards.filter((c) => c.mastery === "mastered").length;
  const learningCount = flashcards.filter((c) => c.mastery === "learning").length;
  const unfamiliarCount = total - masteredCount - learningCount;
  const masteredPct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "1") {
        e.preventDefault();
        handleSetMastery(currentCard?.id, "learning");
      } else if (e.key === "2") {
        e.preventDefault();
        handleSetMastery(currentCard?.id, "mastered");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, activeCards.length, currentCard?.id]);

  const handleNext = () => {
    if (activeCards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % activeCards.length);
  };

  const handlePrev = () => {
    if (activeCards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setFlashcards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
  };

  const handleSetMastery = (id: string | undefined, mastery: FlashcardMastery) => {
    if (!id) return;
    setFlashcards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, mastery } : c)),
    );
    // Auto advance on rating in slideshow mode
    if (viewMode === "slideshow" && currentIndex < activeCards.length - 1) {
      setTimeout(() => handleNext(), 150);
    }
  };

  const handleToggleStar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFlashcards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c)),
    );
  };

  const handleResetProgress = () => {
    setFlashcards((prev) =>
      prev.map((c) => ({ ...c, mastery: "unfamiliar" })),
    );
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    const newCard: Flashcard = {
      id: `custom-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      topic: newTopic.trim() || "Custom Card",
      mastery: "unfamiliar",
    };
    setFlashcards((prev) => [newCard, ...prev]);
    setNewFront("");
    setNewBack("");
    setNewTopic("");
    setIsAddingCard(false);
    setCurrentIndex(0);
  };

  return (
    <div className="space-y-6">
      {/* ── Progress & Controls Banner ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Flame className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Spaced Repetition Mastery
              </p>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold text-brand-navy">
                  {masteredPct}% Mastered
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({masteredCount} of {total} cards)
                </span>
              </div>
            </div>
          </div>

          {/* Mini Mastery Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 border border-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500" />
              {masteredCount} Mastered
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 border border-amber-200">
              <span className="size-2 rounded-full bg-amber-500" />
              {learningCount} Learning
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600 border border-slate-200">
              <span className="size-2 rounded-full bg-slate-400" />
              {unfamiliarCount} Unfamiliar
            </span>
          </div>
        </div>

        {/* View Switcher & Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "slideshow" ? "grid" : "slideshow")}
            className="rounded-xl border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
          >
            {viewMode === "slideshow" ? (
              <>
                <LayoutGrid className="mr-1.5 size-4" />
                Grid View
              </>
            ) : (
              <>
                <Layers className="mr-1.5 size-4" />
                Slideshow
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            title="Shuffle cards"
            className="rounded-xl border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Shuffle className="size-4" />
            <span className="ml-1.5 hidden sm:inline">Shuffle</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFilterStarredOnly(!filterStarredOnly)}
            className={cn(
              "rounded-xl border-slate-200 font-semibold transition-colors",
              filterStarredOnly
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "text-slate-700 hover:bg-slate-50",
            )}
          >
            <Star className={cn("size-4", filterStarredOnly ? "fill-amber-400 text-amber-400" : "")} />
            <span className="ml-1.5 hidden sm:inline">Starred</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddingCard(true)}
            className="rounded-xl bg-brand-navy font-semibold text-white hover:bg-brand-navy/90"
          >
            <Plus className="mr-1.5 size-4" />
            Add Card
          </Button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 flex">
        <div
          style={{ width: `${total > 0 ? (masteredCount / total) * 100 : 0}%` }}
          className="bg-emerald-500 transition-all duration-300"
          title={`${masteredCount} Mastered`}
        />
        <div
          style={{ width: `${total > 0 ? (learningCount / total) * 100 : 0}%` }}
          className="bg-amber-400 transition-all duration-300"
          title={`${learningCount} Learning`}
        />
      </div>

      {/* ── ADD CARD MODAL ── */}
      {isAddingCard && (
        <div className="rounded-2xl border border-brand-gold/40 bg-brand-gold/5 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-brand-navy">Create Custom Flashcard</h3>
            <button
              type="button"
              onClick={() => setIsAddingCard(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
            >
              <X className="size-4" />
            </button>
          </div>
          <form onSubmit={handleAddCustomCard} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Front (Question or Term)
              </label>
              <textarea
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                rows={2}
                placeholder="e.g., What is Newton's Second Law?"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-navy"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Back (Answer or Definition)
              </label>
              <textarea
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                rows={3}
                placeholder="e.g., F = ma. The acceleration of an object is directly proportional to net force..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-navy"
                required
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Optional Topic / Chapter tag"
                className="w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-navy"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingCard(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="rounded-xl bg-brand-navy text-white">
                  Save Card
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {activeCards.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Layers className="size-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-brand-navy">No flashcards found</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {filterStarredOnly
              ? "You haven't starred any cards yet. Star cards to study them in a focused session."
              : "Try clearing your search query or reset your filters."}
          </p>
          {filterStarredOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFilterStarredOnly(false)}
              className="mt-4 rounded-xl"
            >
              View All Cards
            </Button>
          )}
        </div>
      )}

      {/* ── MODE 1: SLIDESHOW VIEW (The Studley 3D Flip Experience) ── */}
      {viewMode === "slideshow" && currentCard && (
        <div className="flex flex-col items-center space-y-6">
          {/* Card counter header */}
          <div className="flex w-full max-w-2xl items-center justify-between px-2 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-brand-navy">
              <Sparkles className="size-3.5 text-brand-gold" />
              Card {currentIndex + 1} of {activeCards.length}
            </span>
            <span className="text-slate-400">
              Press <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">Space</kbd> to flip ·{" "}
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">←</kbd>{" "}
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">→</kbd> to navigate
            </span>
          </div>

          {/* The 3D Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            role="button"
            tabIndex={0}
            aria-label="Flashcard. Click to flip."
            className="group relative h-80 w-full max-w-2xl cursor-pointer select-none [perspective:1200px]"
          >
            <div
              className={cn(
                "relative size-full rounded-3xl transition-transform duration-500 [transform-style:preserve-3d]",
                isFlipped ? "[transform:rotateY(180deg)]" : "",
              )}
            >
              {/* ── FRONT FACE ── */}
              <div className="absolute inset-0 flex flex-col justify-between rounded-3xl border-2 border-slate-200/90 bg-white p-8 shadow-xl shadow-slate-200/50 [backface-visibility:hidden]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {currentCard.topic || subjectTitle}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(currentCard.id, e)}
                      title={currentCard.starred ? "Remove star" : "Star this card"}
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-amber-500"
                    >
                      <Star
                        className={cn(
                          "size-5 transition-colors",
                          currentCard.starred ? "fill-amber-400 text-amber-400" : "",
                        )}
                      />
                    </button>
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-400">
                      FRONT
                    </span>
                  </div>
                </div>

                <div className="my-auto text-center px-4">
                  <p className="font-serif text-2xl font-bold leading-relaxed text-brand-navy md:text-3xl">
                    {currentCard.front}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="size-3.5" />
                    Click or press space to flip
                  </span>
                  {currentCard.mastery === "mastered" ? (
                    <span className="font-bold text-emerald-600">✓ Mastered</span>
                  ) : currentCard.mastery === "learning" ? (
                    <span className="font-bold text-amber-600">● Still Learning</span>
                  ) : (
                    <span>○ Unfamiliar</span>
                  )}
                </div>
              </div>

              {/* ── BACK FACE ── */}
              <div className="absolute inset-0 flex flex-col justify-between rounded-3xl border-2 border-brand-navy/20 bg-gradient-to-br from-brand-navy to-[#1e2d5a] p-8 text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-brand-gold backdrop-blur-sm">
                    {currentCard.topic || subjectTitle}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(currentCard.id, e)}
                      title={currentCard.starred ? "Remove star" : "Star this card"}
                      className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-brand-gold"
                    >
                      <Star
                        className={cn(
                          "size-5 transition-colors",
                          currentCard.starred ? "fill-brand-gold text-brand-gold" : "",
                        )}
                      />
                    </button>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/70">
                      BACK / EXPLANATION
                    </span>
                  </div>
                </div>

                <div className="my-auto max-h-48 overflow-y-auto px-4 text-center">
                  <p className="whitespace-pre-line text-lg font-medium leading-relaxed text-white/95 md:text-xl">
                    {currentCard.back}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="size-3.5" />
                    Click to flip back
                  </span>
                  <span className="font-bold text-brand-gold">Tap below to rate mastery</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Navigation & Mastery Action Buttons ── */}
          <div className="flex w-full max-w-2xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Prev / Next controls */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={activeCards.length <= 1}
                className="size-11 rounded-2xl border-slate-200 p-0 text-brand-navy hover:bg-slate-50"
              >
                <ChevronLeft className="size-6" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleNext}
                disabled={activeCards.length <= 1}
                className="size-11 rounded-2xl border-slate-200 p-0 text-brand-navy hover:bg-slate-50"
              >
                <ChevronRight className="size-6" />
              </Button>
            </div>

            {/* Mastery Quick Rate (Studley Active Recall) */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSetMastery(currentCard.id, "learning")}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all shadow-sm",
                  currentCard.mastery === "learning"
                    ? "border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-amber-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/50",
                )}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">
                  1
                </span>
                Still Learning
              </button>

              <button
                type="button"
                onClick={() => handleSetMastery(currentCard.id, "mastered")}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all shadow-sm",
                  currentCard.mastery === "mastered"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50",
                )}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                  2
                </span>
                Mastered
                <Check className="size-4 text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 2: GRID VIEW (Browse all flashcards with search) ── */}
      {viewMode === "grid" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search flashcards or concepts..."
                className="rounded-xl border-slate-200 pl-9"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Showing {activeCards.length} of {flashcards.length} cards</span>
              <button
                type="button"
                onClick={handleResetProgress}
                className="font-semibold text-brand-navy hover:underline"
              >
                Reset Mastery
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCards.map((card, idx) => (
              <div
                key={card.id}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 bg-white shadow-sm hover:shadow-md",
                  card.mastery === "mastered"
                    ? "border-emerald-200 bg-emerald-50/20"
                    : card.mastery === "learning"
                      ? "border-amber-200 bg-amber-50/20"
                      : "border-slate-200",
                )}
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      #{idx + 1} {card.topic}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(card.id, e)}
                        className="p-1 text-slate-400 hover:text-amber-500"
                      >
                        <Star
                          className={cn(
                            "size-4",
                            card.starred ? "fill-amber-400 text-amber-400" : "",
                          )}
                        />
                      </button>
                      <span
                        className={cn(
                          "size-2.5 rounded-full",
                          card.mastery === "mastered"
                            ? "bg-emerald-500"
                            : card.mastery === "learning"
                              ? "bg-amber-400"
                              : "bg-slate-300",
                        )}
                        title={card.mastery}
                      />
                    </div>
                  </div>

                  <p className="font-serif font-bold text-brand-navy mb-2">{card.front}</p>
                  <p className="text-sm text-slate-600 whitespace-pre-line border-t border-slate-100 pt-2">
                    {card.back}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="font-semibold capitalize text-slate-400">
                    {card.mastery || "Unfamiliar"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetMastery(card.id, "learning")}
                      className={cn(
                        "rounded-lg px-2.5 py-1 font-semibold",
                        card.mastery === "learning"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      Learning
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetMastery(card.id, "mastered")}
                      className={cn(
                        "rounded-lg px-2.5 py-1 font-semibold",
                        card.mastery === "mastered"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      Mastered
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

