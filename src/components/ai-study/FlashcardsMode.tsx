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
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useIntegrations } from "@/hooks/use-integrations";
import { generateMoreFlashcardsFn } from "@/lib/api/ai-study.functions";
import { cn } from "@/lib/utils";

import type { Flashcard, FlashcardMastery } from "./types";

export function FlashcardsMode({
  initialFlashcards,
  subjectTitle,
  onMasteryChange,
  onCardAdd,
}: {
  initialFlashcards: Flashcard[];
  subjectTitle: string;
  onMasteryChange?: (cardId: string, mastery: FlashcardMastery) => void;
  onCardAdd?: (card: { front: string; back: string; topic: string }) => void;
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

  const { config: integrations } = useIntegrations();
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleGenerateAiCards = async () => {
    setIsAiGenerating(true);
    try {
      const activeProvider = integrations.aiStudy.provider || "gemini";
      const settings = integrations.aiStudy.providers?.[activeProvider];
      const apiKey = settings?.apiKey?.trim() || integrations.aiStudy.apiKey?.trim();

      const res = await generateMoreFlashcardsFn({
        data: {
          topic: subjectTitle,
          count: 5,
          provider: activeProvider,
          apiKey: apiKey || undefined,
          baseUrl: settings?.baseUrl || undefined,
          model: settings?.model || undefined,
        },
      });

      if (res?.data && res.data.length > 0) {
        const newCards: Flashcard[] = res.data.map((card, i) => ({
          id: `ai-fc-${Date.now()}-${i}`,
          front: card.front,
          back: card.back,
          topic: card.topic || subjectTitle,
          mastery: "unfamiliar",
        }));

        setFlashcards((prev) => [...newCards, ...prev]);
        newCards.forEach((c) =>
          onCardAdd?.({ front: c.front, back: c.back, topic: c.topic || subjectTitle }),
        );
        toast.success(`Generated ${newCards.length} flashcards with Google Gemini!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate AI flashcards. Please check your Gemini API key.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Sync and hydrate with saved spaced-repetition progress
  useEffect(() => {
    try {
      const storageKey = `study2earn_fc_progress_${subjectTitle}`;
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (Object.keys(saved).length > 0) {
        setFlashcards(
          initialFlashcards.map((c) => (saved[c.id] ? { ...c, ...saved[c.id] } : c)),
        );
      } else {
        setFlashcards(initialFlashcards);
      }
    } catch {
      setFlashcards(initialFlashcards);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [initialFlashcards, subjectTitle]);

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
  const familiarCount = flashcards.filter((c) => c.mastery === "familiar").length;
  const learningCount = flashcards.filter((c) => c.mastery === "learning").length;
  const unfamiliarCount = total - masteredCount - familiarCount - learningCount;
  const masteredPct =
    total > 0
      ? Math.round(((masteredCount + familiarCount * 0.7 + learningCount * 0.3) / total) * 100)
      : 0;

  // Spaced repetition scheduler helper
  const calculateSpacedRepetition = (rating: "again" | "hard" | "good" | "easy", currentRepetitions = 0) => {
    let intervalDays = 1;
    let mastery: FlashcardMastery = "unfamiliar";

    switch (rating) {
      case "again":
        intervalDays = 1;
        mastery = "unfamiliar";
        break;
      case "hard":
        intervalDays = Math.max(1, Math.round((currentRepetitions || 1) * 1.5));
        mastery = "learning";
        break;
      case "good":
        intervalDays = Math.max(2, Math.round((currentRepetitions + 1) * 2.5));
        mastery = "familiar";
        break;
      case "easy":
        intervalDays = Math.max(4, Math.round((currentRepetitions + 1) * 4));
        mastery = "mastered";
        break;
    }

    const dueDateObj = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
    const dueDate = dueDateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return { intervalDays, dueDate, mastery };
  };

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

      if (e.code === "Space" || e.code === "Enter") {
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
        handleRateCard(currentCard?.id, "again");
      } else if (e.key === "2") {
        e.preventDefault();
        handleRateCard(currentCard?.id, "hard");
      } else if (e.key === "3") {
        e.preventDefault();
        handleRateCard(currentCard?.id, "good");
      } else if (e.key === "4") {
        e.preventDefault();
        handleRateCard(currentCard?.id, "easy");
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

  const handleRateCard = (id: string | undefined, rating: "again" | "hard" | "good" | "easy") => {
    if (!id) return;
    const card = flashcards.find((c) => c.id === id);
    const { intervalDays, dueDate, mastery } = calculateSpacedRepetition(rating, card?.repetitions || 0);

    setFlashcards((prev) => {
      const updated = prev.map((c) =>
        c.id === id
          ? {
              ...c,
              mastery,
              lastRating: rating,
              intervalDays,
              dueDate,
              repetitions: (c.repetitions || 0) + 1,
            }
          : c,
      );
      try {
        const storageKey = `study2earn_fc_progress_${subjectTitle}`;
        const map = updated.reduce<Record<string, any>>((acc, item) => {
          if (item.lastRating || item.mastery) {
            acc[item.id] = {
              mastery: item.mastery,
              lastRating: item.lastRating,
              intervalDays: item.intervalDays,
              dueDate: item.dueDate,
              repetitions: item.repetitions,
            };
          }
          return acc;
        }, {});
        localStorage.setItem(storageKey, JSON.stringify(map));
      } catch {}
      return updated;
    });

    onMasteryChange?.(id, mastery);

    // Auto advance on rating in slideshow mode
    if (viewMode === "slideshow" && currentIndex < activeCards.length - 1) {
      setTimeout(() => handleNext(), 160);
    }
  };

  const handleSetMastery = (id: string | undefined, mastery: FlashcardMastery) => {
    if (!id) return;
    setFlashcards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, mastery } : c)),
    );
    onMasteryChange?.(id, mastery);
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
      prev.map((c) => ({
        ...c,
        mastery: "unfamiliar",
        intervalDays: undefined,
        dueDate: undefined,
        lastRating: undefined,
        repetitions: 0,
      })),
    );
    try {
      localStorage.removeItem(`study2earn_fc_progress_${subjectTitle}`);
    } catch {}
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
    onCardAdd?.({
      front: newCard.front,
      back: newCard.back,
      topic: newCard.topic || "Custom Card",
    });
    setNewFront("");
    setNewBack("");
    setNewTopic("");
    setIsAddingCard(false);
    setCurrentIndex(0);
  };

  return (
    <div className="space-y-6">
      {/* ── Progress & Controls Banner ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Flame className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Spaced Repetition Mastery
              </p>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                  {masteredPct}% Mastered
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  ({masteredCount} of {total} cards)
                </span>
              </div>
            </div>
          </div>

          {/* Mini Mastery Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
              <span className="size-2 rounded-full bg-emerald-500" />
              {masteredCount} Mastered
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
              <span className="size-2 rounded-full bg-blue-500" />
              {familiarCount} Familiar
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
              <span className="size-2 rounded-full bg-amber-500" />
              {learningCount} Learning
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
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
            className="rounded-xl border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            {viewMode === "slideshow" ? (
              <>
                <LayoutGrid className="mr-1.5 size-4 text-slate-500" />
                Grid View
              </>
            ) : (
              <>
                <Layers className="mr-1.5 size-4 text-slate-500" />
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
            className="rounded-xl border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Shuffle className="size-4 text-slate-500" />
            <span className="ml-1.5 hidden sm:inline">Shuffle</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFilterStarredOnly(!filterStarredOnly)}
            className={cn(
              "rounded-xl border-slate-200 dark:border-slate-700 font-semibold transition-colors cursor-pointer",
              filterStarredOnly
                ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
            )}
          >
            <Star className={cn("size-4", filterStarredOnly ? "fill-amber-400 text-amber-400" : "text-slate-400")} />
            <span className="ml-1.5 hidden sm:inline">Starred</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleGenerateAiCards}
            disabled={isAiGenerating}
            className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 font-semibold text-white hover:from-amber-700 hover:to-orange-700 shadow-xs cursor-pointer"
          >
            {isAiGenerating ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 size-4 text-amber-200" />
                Generate AI Cards
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddingCard(true)}
            className="rounded-xl bg-brand-navy dark:bg-blue-600 font-semibold text-white hover:bg-brand-navy/90 dark:hover:bg-blue-700 shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 size-4" />
            Add Card
          </Button>
        </div>
      </div>

      {/* Segmented Progress Line */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex shadow-inner">
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
        <div className="rounded-3xl border border-amber-300/80 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
              Create Custom Flashcard
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingCard(false)}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
          <form onSubmit={handleAddCustomCard} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Front (Question or Term)
              </label>
              <textarea
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                rows={2}
                placeholder="e.g., What is Newton's Second Law of Motion?"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-navy dark:text-white"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Back (Answer or Definition)
              </label>
              <textarea
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                rows={3}
                placeholder="e.g., F = ma. The net force applied to a body produces an acceleration directly proportional to..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-navy dark:text-white"
                required
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Optional Topic / Chapter tag"
                className="w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-navy dark:text-white"
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
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-brand-navy hover:bg-brand-navy/90 text-white font-bold"
                >
                  Save Card
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {activeCards.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-16 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Layers className="size-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
            No flashcards found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
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
          <div className="flex w-full max-w-2xl items-center justify-between px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              <Sparkles className="size-3.5 text-amber-500" />
              Card {currentIndex + 1} of {activeCards.length}
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">Space</kbd> flip ·{" "}
              <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">←</kbd>{" "}
              <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">→</kbd> navigate
            </span>
          </div>

          {/* The 3D Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            role="button"
            tabIndex={0}
            aria-label="Flashcard. Click to flip."
            className="group relative h-84 w-full max-w-2xl cursor-pointer select-none [perspective:1400px]"
          >
            <div
              className={cn(
                "relative size-full rounded-3xl transition-transform duration-500 [transform-style:preserve-3d]",
                isFlipped ? "[transform:rotateY(180deg)]" : "",
              )}
            >
              {/* ── FRONT FACE ── */}
              <div className="absolute inset-0 flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none [backface-visibility:hidden]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {currentCard.topic || subjectTitle}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(currentCard.id, e)}
                      title={currentCard.starred ? "Remove star" : "Star this card"}
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500 transition-colors"
                    >
                      <Star
                        className={cn(
                          "size-5 transition-colors",
                          currentCard.starred ? "fill-amber-400 text-amber-400" : "",
                        )}
                      />
                    </button>
                    <span className="rounded-full bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Question / Axiom
                    </span>
                  </div>
                </div>

                <div className="my-auto text-center px-4">
                  <p className="font-serif text-2xl font-bold leading-relaxed text-slate-900 dark:text-white md:text-3xl tracking-tight">
                    {currentCard.front}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="size-3.5" />
                    Click or press space to flip
                  </span>
                  <div className="flex items-center gap-2">
                    {currentCard.dueDate && (
                      <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        Due: {currentCard.dueDate}
                      </span>
                    )}
                    {currentCard.mastery === "mastered" ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ Mastered</span>
                    ) : currentCard.mastery === "familiar" ? (
                      <span className="font-bold text-blue-600 dark:text-blue-400">★ Familiar</span>
                    ) : currentCard.mastery === "learning" ? (
                      <span className="font-bold text-amber-600 dark:text-amber-400">● Learning</span>
                    ) : (
                      <span>○ Unfamiliar</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── BACK FACE ── */}
              <div className="absolute inset-0 flex flex-col justify-between rounded-3xl border border-indigo-950/40 bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 p-8 text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-sm border border-white/10">
                    {currentCard.topic || subjectTitle}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(currentCard.id, e)}
                      title={currentCard.starred ? "Remove star" : "Star this card"}
                      className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-amber-300"
                    >
                      <Star
                        className={cn(
                          "size-5 transition-colors",
                          currentCard.starred ? "fill-amber-300 text-amber-300" : "",
                        )}
                      />
                    </button>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/70 uppercase tracking-wider">
                      Answer / Explanation
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
                  <div className="flex items-center gap-2">
                    {currentCard.dueDate && (
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/90">
                        Next: {currentCard.dueDate}
                      </span>
                    )}
                    <span className="font-bold text-amber-300">Rate [1, 2, 3, 4]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Navigation & Spaced Repetition 4-Grade Rating Buttons ── */}
          <div className="flex w-full max-w-2xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Prev / Next controls */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={activeCards.length <= 1}
                className="size-11 rounded-2xl border-slate-200 dark:border-slate-700 p-0 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="size-6" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleNext}
                disabled={activeCards.length <= 1}
                className="size-11 rounded-2xl border-slate-200 dark:border-slate-700 p-0 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="size-6" />
              </Button>
            </div>

            {/* Spaced Repetition 4 Ratings */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleRateCard(currentCard.id, "again")}
                className={cn(
                  "flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer",
                  currentCard.lastRating === "again"
                    ? "border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 ring-2 ring-rose-300 dark:ring-rose-700"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-rose-300 hover:bg-rose-50/50",
                )}
                title="Review again in 1 day (Shortcut: 1)"
              >
                <span className="flex size-4.5 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/60 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                  1
                </span>
                <span>Again</span>
                <span className="rounded bg-rose-100 dark:bg-rose-900/60 px-1 py-0.2 text-[9px] font-semibold text-rose-600 dark:text-rose-300">
                  1d
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRateCard(currentCard.id, "hard")}
                className={cn(
                  "flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer",
                  currentCard.lastRating === "hard"
                    ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 ring-2 ring-amber-300 dark:ring-amber-700"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-amber-300 hover:bg-amber-50/50",
                )}
                title="Review in 2 days (Shortcut: 2)"
              >
                <span className="flex size-4.5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/60 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  2
                </span>
                <span>Hard</span>
                <span className="rounded bg-amber-100 dark:bg-amber-900/60 px-1 py-0.2 text-[9px] font-semibold text-amber-700 dark:text-amber-300">
                  2d
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRateCard(currentCard.id, "good")}
                className={cn(
                  "flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer",
                  currentCard.lastRating === "good"
                    ? "border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 ring-2 ring-blue-300 dark:ring-blue-700"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-300 hover:bg-blue-50/50",
                )}
                title="Review in 4 days (Shortcut: 3)"
              >
                <span className="flex size-4.5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  3
                </span>
                <span>Good</span>
                <span className="rounded bg-blue-100 dark:bg-blue-900/60 px-1 py-0.2 text-[9px] font-semibold text-blue-700 dark:text-blue-300">
                  4d
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRateCard(currentCard.id, "easy")}
                className={cn(
                  "flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer",
                  currentCard.lastRating === "easy"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 ring-2 ring-emerald-300 dark:ring-emerald-700"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50/50",
                )}
                title="Mastered! Review in 7 days (Shortcut: 4)"
              >
                <span className="flex size-4.5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  4
                </span>
                <span>Easy</span>
                <span className="rounded bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.2 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">
                  7d
                </span>
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
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
                className="rounded-xl border-slate-200 dark:border-slate-700 pl-9 dark:bg-slate-900"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Showing {activeCards.length} of {flashcards.length} cards</span>
              <button
                type="button"
                onClick={handleResetProgress}
                className="font-bold text-brand-navy dark:text-blue-400 hover:underline cursor-pointer"
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
                  "flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 shadow-xs hover:shadow-md dark:bg-slate-900",
                  card.mastery === "mastered"
                    ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20"
                    : card.mastery === "learning"
                      ? "border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-white",
                )}
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      #{idx + 1} {card.topic}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(card.id, e)}
                        className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer"
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
                              : "bg-slate-300 dark:bg-slate-700",
                        )}
                        title={card.mastery}
                      />
                    </div>
                  </div>

                  <p className="font-serif font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                    {card.front}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line border-t border-slate-100 dark:border-slate-800 pt-2.5 leading-relaxed">
                    {card.back}
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold capitalize text-slate-400 dark:text-slate-500 text-[11px]">
                      {card.mastery || "Unfamiliar"}
                    </span>
                    {card.dueDate && (
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        Due: {card.dueDate}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() => handleRateCard(card.id, "again")}
                      className={cn(
                        "rounded-lg py-1 text-center text-[11px] font-bold transition cursor-pointer",
                        card.lastRating === "again"
                          ? "bg-rose-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-950/60",
                      )}
                      title="Again (1d)"
                    >
                      Again
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRateCard(card.id, "hard")}
                      className={cn(
                        "rounded-lg py-1 text-center text-[11px] font-bold transition cursor-pointer",
                        card.lastRating === "hard"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950/60",
                      )}
                      title="Hard (2d)"
                    >
                      Hard
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRateCard(card.id, "good")}
                      className={cn(
                        "rounded-lg py-1 text-center text-[11px] font-bold transition cursor-pointer",
                        card.lastRating === "good"
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-950/60",
                      )}
                      title="Good (4d)"
                    >
                      Good
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRateCard(card.id, "easy")}
                      className={cn(
                        "rounded-lg py-1 text-center text-[11px] font-bold transition cursor-pointer",
                        card.lastRating === "easy"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60",
                      )}
                      title="Easy (7d)"
                    >
                      Easy
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

