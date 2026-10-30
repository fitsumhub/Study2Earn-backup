import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Clock,
  Coins,
  CornerDownLeft,
  FileText,
  Flame,
  GraduationCap,
  HelpCircle,
  History,
  LayoutDashboard,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { examCourses } from "@/lib/exam-data";
import { libraryBooks } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export type SearchCategory = "all" | "exams" | "books" | "navigation" | "rewards";

interface SearchResultItem {
  id: string;
  category: "exams" | "books" | "navigation" | "rewards";
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ElementType;
  url: string;
  keywords: string[];
}

const NAVIGATION_ITEMS: SearchResultItem[] = [
  {
    id: "nav-dashboard",
    category: "navigation",
    title: "Student Dashboard",
    subtitle: "View wallet balance, streak marathon & reading progress",
    badge: "Student Hub",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
    icon: LayoutDashboard,
    url: "/dashboard",
    keywords: ["dashboard", "home", "stats", "wallet", "streak", "xp"],
  },
  {
    id: "nav-library",
    category: "navigation",
    title: "MoE Textbook Library",
    subtitle: "Access verified Ethiopian university curriculum textbooks & courseware",
    badge: "Courseware",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    icon: BookOpen,
    url: "/library",
    keywords: ["library", "books", "textbooks", "reading", "pdf", "moe", "courseware"],
  },
  {
    id: "nav-ai-study",
    category: "navigation",
    title: "AI Study Sets & Copilot",
    subtitle: "Upload files, audio, images, or record lectures to generate 3D flashcards, quizzes & notes",
    badge: "AI Sets",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    icon: Sparkles,
    url: "/ai-study",
    keywords: ["ai", "study sets", "flashcards", "quiz", "notes", "summary", "record", "lecture", "audio", "cheat sheet"],
  },
  {
    id: "nav-exams",
    category: "navigation",
    title: "Mock Exit Exams Hub",
    subtitle: "Timed practice tests & chapter quizzes with instant grading",
    badge: "Exit Exam",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
    icon: ClipboardList,
    url: "/exams",
    keywords: ["exams", "mock", "quiz", "test", "practice", "questions", "exit exam"],
  },
  {
    id: "nav-mistakes",
    category: "navigation",
    title: "Mistake Notebook Bank",
    subtitle: "Retry and master exam questions you previously answered incorrectly",
    badge: "Smart Review",
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
    icon: Target,
    url: "/exams/mistakes",
    keywords: ["mistakes", "errors", "wrong", "bank", "retry", "missed"],
  },
  {
    id: "nav-leaderboard",
    category: "navigation",
    title: "National Scholar Podium",
    subtitle: "Compete with top university students across Ethiopia for weekly prizes",
    badge: "Rankings",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    icon: Trophy,
    url: "/leaderboard",
    keywords: ["leaderboard", "rank", "podium", "scores", "top", "university", "competition"],
  },
  {
    id: "nav-rewards",
    category: "navigation",
    title: "Rewards & Cashout Center",
    subtitle: "Convert earned XP into real Telebirr, CBE Birr, or Binance USDT",
    badge: "Cashout",
    badgeColor: "bg-brand-gold/20 text-brand-gold",
    icon: Coins,
    url: "/rewards",
    keywords: ["rewards", "telebirr", "cbe", "cash", "withdraw", "money", "usdt", "etb", "xp"],
  },
  {
    id: "nav-help",
    category: "navigation",
    title: "Help Center & Exit Exam FAQ",
    subtitle: "Curriculum guides, withdrawal policies, and platform tutorials",
    badge: "Support",
    badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    icon: HelpCircle,
    url: "/help",
    keywords: ["help", "faq", "support", "rules", "how to earn", "terms", "guide"],
  },
  {
    id: "nav-profile",
    category: "navigation",
    title: "Student Profile & Frames",
    subtitle: "Customize your avatar, view earned badges & academic university standing",
    badge: "Profile",
    badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    icon: User,
    url: "/profile",
    keywords: ["profile", "account", "avatar", "badges", "frames", "settings"],
  },
];

const REWARD_ITEMS: SearchResultItem[] = [
  {
    id: "rew-telebirr",
    category: "rewards",
    title: "Telebirr Cash Withdrawal (100 ETB)",
    subtitle: "Instant mobile money transfer to any Ethio Telecom Telebirr account",
    badge: "800 XP",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    icon: Coins,
    url: "/rewards",
    keywords: ["telebirr", "ethio telecom", "etb", "100", "mobile money", "cashout"],
  },
  {
    id: "rew-cbe",
    category: "rewards",
    title: "Commercial Bank of Ethiopia (CBE Birr)",
    subtitle: "Direct bank transfer to your CBE account across Ethiopia",
    badge: "1,600 XP",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
    icon: Coins,
    url: "/rewards",
    keywords: ["cbe", "commercial bank of ethiopia", "cbe birr", "200 etb", "bank transfer"],
  },
  {
    id: "rew-usdt",
    category: "rewards",
    title: "Binance USDT Crypto Cashout",
    subtitle: "Direct zero-fee cryptocurrency transfer to your verified Binance UID",
    badge: "1,080 XP",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    icon: Coins,
    url: "/rewards",
    keywords: ["binance", "usdt", "crypto", "uid", "dollar", "1 usdt"],
  },
  {
    id: "rew-glow",
    category: "rewards",
    title: "Golden Scholar Profile Aura",
    subtitle: "Unlock prestigious animated gold border for your platform avatar",
    badge: "Cosmetic",
    badgeColor: "bg-brand-gold/20 text-brand-gold",
    icon: Sparkles,
    url: "/rewards",
    keywords: ["glow", "aura", "golden scholar", "avatar", "cosmetic", "profile"],
  },
];

const POPULAR_SUGGESTIONS = [
  { label: "General Physics (Phys 1011)", query: "Physics" },
  { label: "Freshman Mathematics (Math 1011)", query: "Math" },
  { label: "Database Systems (CoSc 2041)", query: "Database" },
  { label: "Mistake Notebook Bank", query: "Mistakes" },
  { label: "Telebirr Cashout (100 ETB)", query: "Telebirr" },
];

const RECENT_SEARCHES_KEY = "study2earn_recent_searches";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s !== text);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Build searchable index from textbooks & exam courses
  const allSearchItems = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];

    // 1. Textbooks
    libraryBooks.forEach((b) => {
      items.push({
        id: `book-${b.id}`,
        category: "books",
        title: b.name,
        subtitle: `${b.category} · ${b.chapters} Chapters · ${b.pages} Pages`,
        badge: b.short,
        badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
        icon: BookOpen,
        url: `/library/read/${b.id}`,
        keywords: [
          b.name.toLowerCase(),
          b.short.toLowerCase(),
          b.category.toLowerCase(),
          b.description.toLowerCase(),
          ...b.chapterList.map((c) => c.title.toLowerCase()),
        ],
      });
    });

    // 2. Mock Exam Courses & Chapters
    examCourses.forEach((c) => {
      items.push({
        id: `exam-${c.id}`,
        category: "exams",
        title: c.name,
        subtitle: `${c.category} · ${c.durationMinutes} min timed mock · ${c.chapters.length} chapters`,
        badge: c.short,
        badgeColor: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
        icon: ClipboardList,
        url: `/exams/${c.id}`,
        keywords: [
          c.name.toLowerCase(),
          c.short.toLowerCase(),
          c.category.toLowerCase(),
          ...c.chapters.map((ch) => ch.title.toLowerCase()),
        ],
      });

      // Individual chapters for quick access
      c.chapters.forEach((ch, idx) => {
        items.push({
          id: `exam-ch-${c.id}-${ch.id}`,
          category: "exams",
          title: `${c.short}: Chapter ${idx + 1} — ${ch.title}`,
          subtitle: `Chapter Mock Exam Quiz for ${c.name}`,
          badge: `Ch ${idx + 1}`,
          badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
          icon: CircleDot,
          url: `/exams/${c.id}/${ch.id}`,
          keywords: [c.name.toLowerCase(), c.short.toLowerCase(), ch.title.toLowerCase(), `chapter ${idx + 1}`],
        });
      });
    });

    // 3. Rewards & Cashouts
    items.push(...REWARD_ITEMS);

    // 4. Platform Navigation
    items.push(...NAVIGATION_ITEMS);

    return items;
  }, []);

  // Filter items based on active category & query
  const filteredResults = useMemo(() => {
    let list = allSearchItems;

    if (activeCategory !== "all") {
      list = list.filter((i) => i.category === activeCategory);
    }

    if (!query.trim()) {
      return list.slice(0, 10);
    }

    const q = query.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);

    return list
      .filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const subtitleMatch = item.subtitle.toLowerCase().includes(q);
        const badgeMatch = item.badge?.toLowerCase().includes(q);
        const keywordMatch = tokens.every((token) =>
          item.keywords.some((kw) => kw.includes(token)) ||
          item.title.toLowerCase().includes(token),
        );
        return titleMatch || subtitleMatch || badgeMatch || keywordMatch;
      })
      .slice(0, 12);
  }, [allSearchItems, activeCategory, query]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        setSelectedIndex(0);
      }, 50);
    } else {
      setQuery("");
      setActiveCategory("all");
    }
  }, [open]);

  // Handle keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSelectResult = (item: SearchResultItem) => {
    saveRecentSearch(query.trim() || item.title);
    onOpenChange(false);
    navigate({ to: item.url as any });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredResults[selectedIndex];
      if (selected) {
        handleSelectResult(selected);
      }
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogContent className="fixed left-1/2 top-[12%] z-50 w-[95vw] max-w-2xl -translate-x-1/2 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 duration-200">
          {/* ── Top Search Input Bar ── */}
          <div className="relative flex items-center border-b border-slate-200/80 px-4 py-3.5 dark:border-slate-800/80">
            <Search className="size-5 text-brand-gold shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search courses, textbooks, exit exams, rewards, chapters..."
              className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 outline-none dark:text-white"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 mr-2"
                title="Clear query"
              >
                <X className="size-4" />
              </button>
            )}
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              ESC
            </kbd>
          </div>

          {/* ── Category Filter Pills ── */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100 bg-slate-50/60 px-4 py-2 dark:border-slate-800/60 dark:bg-slate-950/40">
            {[
              { id: "all", label: "All Results" },
              { id: "exams", label: "🎯 Mock Exams" },
              { id: "books", label: "📚 Textbooks" },
              { id: "rewards", label: "🎁 Rewards" },
              { id: "navigation", label: "🧭 Quick Jump" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id as SearchCategory);
                  setSelectedIndex(0);
                }}
                className={cn(
                  "rounded-xl px-2.5 py-1 text-xs font-semibold transition cursor-pointer shrink-0",
                  activeCategory === cat.id
                    ? "bg-brand-navy text-white dark:bg-brand-gold dark:text-slate-950 font-bold shadow-2xs"
                    : "text-slate-500 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* ── Search Body Content ── */}
          <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
            {/* If query is empty: show Recent Searches & Popular Suggestions */}
            {!query.trim() && (
              <div className="space-y-4 py-1">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 mb-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <History className="size-3 text-brand-gold" />
                        Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={clearAllRecent}
                        className="text-[11px] text-slate-400 hover:text-rose-500 font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-2">
                      {recentSearches.map((term) => (
                        <div
                          key={term}
                          onClick={() => {
                            setQuery(term);
                            inputRef.current?.focus();
                          }}
                          className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand-gold hover:bg-brand-gold/5 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-2xs transition"
                        >
                          <Clock className="size-3 text-slate-400 group-hover:text-brand-gold" />
                          <span>{term}</span>
                          <button
                            type="button"
                            onClick={(e) => removeRecentSearch(term, e)}
                            className="rounded-full p-0.5 text-slate-400 hover:text-rose-500"
                            title="Remove"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="px-2 mb-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <Sparkles className="size-3 text-brand-gold" />
                      Popular Ethiopian Course Searches
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {POPULAR_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug.query}
                        type="button"
                        onClick={() => {
                          setQuery(sug.query);
                          inputRef.current?.focus();
                        }}
                        className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-gold hover:bg-white hover:text-brand-navy dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Matching Results List */}
            {filteredResults.length > 0 ? (
              <div className="space-y-1">
                {query.trim() && (
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Results ({filteredResults.length})
                  </div>
                )}
                {filteredResults.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "group flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 transition cursor-pointer",
                        isSelected
                          ? "bg-brand-navy text-white shadow-md dark:bg-brand-gold dark:text-slate-950"
                          : "hover:bg-slate-100 text-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/80",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-xl transition",
                            isSelected
                              ? "bg-white/20 text-white dark:bg-slate-900/30 dark:text-slate-950"
                              : "bg-slate-100 text-brand-navy dark:bg-slate-800 dark:text-brand-gold",
                          )}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-serif text-sm font-bold">
                              {item.title}
                            </p>
                            {item.badge && (
                              <span
                                className={cn(
                                  "rounded-md px-1.5 py-0.2 text-[10px] font-bold shrink-0",
                                  isSelected
                                    ? "bg-white/20 text-white dark:bg-slate-900/30 dark:text-slate-950"
                                    : item.badgeColor || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p
                            className={cn(
                              "truncate text-xs mt-0.5",
                              isSelected
                                ? "text-white/80 dark:text-slate-950/80"
                                : "text-slate-500 dark:text-slate-400",
                            )}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "text-xs font-bold transition-transform group-hover:translate-x-1 flex items-center gap-1",
                            isSelected
                              ? "text-brand-gold dark:text-slate-950"
                              : "text-slate-400 group-hover:text-brand-navy dark:group-hover:text-brand-gold",
                          )}
                        >
                          <span className="hidden sm:inline">Open</span>
                          <ArrowRight className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Search className="mx-auto size-10 text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                  No matches found for "{query}"
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Try searching for course names like "Physics", "Math", "Logic", or keywords like "Telebirr" or "Mistakes".
                </p>
              </div>
            )}
          </div>

          {/* ── Footer Keyboard Navigation Guide ── */}
          <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-[11px] text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/60 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                  ↑
                </kbd>
                <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                  ↓
                </kbd>
                <span>to navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                  ↵
                </kbd>
                <span>to select</span>
              </span>
            </div>
            <span className="flex items-center gap-1 text-brand-gold font-semibold">
              <GraduationCap className="size-3.5" />
              MoE Ethiopian Curriculum Search
            </span>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
