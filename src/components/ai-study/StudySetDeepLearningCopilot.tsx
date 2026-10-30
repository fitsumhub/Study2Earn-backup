import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  ChevronRight,
  Copy,
  HelpCircle,
  Layers,
  Lightbulb,
  MessageSquare,
  RotateCcw,
  Scale,
  Send,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIntegrations } from "@/hooks/use-integrations";
import { deepLearningToolFn } from "@/lib/api/ai-study.functions";
import type { StudySet } from "@/lib/study-set-store";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface StudySetDeepLearningCopilotProps {
  studySet: StudySet;
  initialTool?: "explain" | "step_by_step" | "example" | "compare" | "test_understanding" | "tutor_qa";
  initialConcept?: string;
  onNavigateTab?: (tab: string) => void;
}

type ToolType = "explain" | "step_by_step" | "example" | "compare" | "test_understanding" | "tutor_qa";

interface ChatMessage {
  id: string;
  sender: "user" | "tutor";
  text: string;
  tool?: ToolType;
  citations?: Array<{ title: string; section?: string }>;
  quizQuestion?: {
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
  };
  userAnsweredIndex?: number;
}

export function StudySetDeepLearningCopilot({
  studySet,
  initialTool = "explain",
  initialConcept = "",
  onNavigateTab,
}: StudySetDeepLearningCopilotProps) {
  const { config: integrations } = useIntegrations();
  const [activeTool, setActiveTool] = useState<ToolType>(initialTool);
  const [explainLevel, setExplainLevel] = useState<"simple" | "intermediate" | "advanced">("intermediate");
  const [conceptQuery, setConceptQuery] = useState(
    initialConcept || studySet.notes?.keyConcepts?.[0]?.concept || studySet.title,
  );
  const [secondaryConcept, setSecondaryConcept] = useState(
    studySet.notes?.keyConcepts?.[1]?.concept || "Alternative Method",
  );
  const [language, setLanguage] = useState<"en" | "am">("en");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Freeform chat state
  const [chatInput, setChatInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "tutor",
      text: `👋 **Welcome to your AI Deep Learning Tutor for "${studySet.title}"!**\n\nI am grounded in your uploaded lecture materials, definitions, and formulas. Choose a high-yield learning action below or ask me any question to test your retention before exam day!`,
    },
  ]);

  const contextText =
    studySet.sources?.map((s) => s.fullText || s.contentSnippet).filter(Boolean).join("\n\n") ||
    studySet.notes?.summary ||
    studySet.title;

  const handleExecuteTool = (customTool?: ToolType, customQuery?: string) => {
    const toolToRun = customTool || activeTool;
    const queryToRun = (customQuery || (toolToRun === "tutor_qa" ? chatInput : conceptQuery)).trim();

    if (!queryToRun) {
      toast.error("Please enter a concept or question to explore.");
      return;
    }

    const userMsgId = `usr-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: "user",
        text:
          toolToRun === "explain"
            ? `Explain "${queryToRun}" (${explainLevel} level)`
            : toolToRun === "step_by_step"
              ? `Teach me step-by-step: "${queryToRun}"`
              : toolToRun === "example"
                ? `Give me a worked exam problem & solution for: "${queryToRun}"`
                : toolToRun === "compare"
                  ? `Compare "${queryToRun}" vs. "${secondaryConcept}"`
                  : toolToRun === "test_understanding"
                    ? `Test my understanding on: "${queryToRun}"`
                    : queryToRun,
        tool: toolToRun,
      },
    ];

    setMessages(newMessages);
    if (toolToRun === "tutor_qa") setChatInput("");

    startTransition(async () => {
      try {
        const activeProvider = integrations.aiStudy.provider || "gemini";
        const settings = integrations.aiStudy.providers?.[activeProvider];
        const apiKey = settings?.apiKey?.trim() || integrations.aiStudy.apiKey?.trim();

        const res = await deepLearningToolFn({
          data: {
            tool: toolToRun,
            query: queryToRun,
            contextText: contextText.slice(0, 12000),
            titleHint: studySet.title,
            subjectHint: studySet.subject,
            level: explainLevel,
            secondaryConcept: toolToRun === "compare" ? secondaryConcept : undefined,
            language,
            provider: activeProvider,
            apiKey: apiKey || undefined,
            baseUrl: settings?.baseUrl || undefined,
            model: settings?.model || undefined,
          },
        });

        if (res) {
          setMessages((prev) => [
            ...prev,
            {
              id: `tutor-${Date.now()}`,
              sender: "tutor",
              text: res.content,
              tool: toolToRun,
              citations: res.citations,
              quizQuestion: res.quizQuestion,
            },
          ]);
        }
      } catch (err) {
        console.error("Deep learning execution error:", err);
        toast.error("Failed to execute AI tutoring request. Please try again.");
      }
    });
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAnswerQuiz = (messageId: string, chosenIndex: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, userAnsweredIndex: chosenIndex } : m)),
    );
  };

  const toolButtons: Array<{ id: ToolType; label: string; icon: React.ElementType; color: string }> = [
    { id: "explain", label: "Explain Concept", icon: Lightbulb, color: "text-amber-500" },
    { id: "step_by_step", label: "Teach Step-by-Step", icon: Layers, color: "text-indigo-500" },
    { id: "example", label: "Worked Example", icon: Zap, color: "text-emerald-500" },
    { id: "compare", label: "Compare Concepts", icon: Scale, color: "text-purple-500" },
    { id: "test_understanding", label: "Test My Retention", icon: HelpCircle, color: "text-rose-500" },
    { id: "tutor_qa", label: "Ask AI Tutor", icon: MessageSquare, color: "text-blue-500" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-300">
      {/* ── Header Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 via-indigo-600 to-blue-600 text-white shadow-md shadow-rose-500/20">
              <Bot className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                  AI Deep Learning Tutor & Copilot
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Grounded on {studySet.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Break down complex derivations, verify retention, and master exam problem-solving from first principles.
              </p>
            </div>
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-semibold text-slate-500">Language:</span>
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                  language === "en"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white",
                )}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("am")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                  language === "am"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white",
                )}
              >
                አማርኛ (Amharic)
              </button>
            </div>
          </div>
        </div>

        {/* Tool Action Switcher Bar */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
          {toolButtons.map((btn) => {
            const Icon = btn.icon;
            const isSelected = activeTool === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setActiveTool(btn.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer",
                  isSelected
                    ? "bg-brand-navy text-white shadow-sm dark:bg-blue-600"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                )}
              >
                <Icon className={cn("size-3.5", isSelected ? "text-amber-300" : btn.color)} />
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Parameter Controls based on Active Tool */}
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {activeTool === "tutor_qa" ? "Question to Ask Tutor:" : "Target Concept / Term:"}
              </label>
              <Input
                value={activeTool === "tutor_qa" ? chatInput : conceptQuery}
                onChange={(e) =>
                  activeTool === "tutor_qa" ? setChatInput(e.target.value) : setConceptQuery(e.target.value)
                }
                placeholder={
                  activeTool === "tutor_qa"
                    ? "e.g. Why does congestion window drop to 1 MSS on timeout vs 3 duplicate ACKs?"
                    : "e.g. Spaced Repetition, TCP Windowing, AVL Rotation..."
                }
                className="bg-white dark:bg-slate-900 text-xs font-medium"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleExecuteTool();
                  }
                }}
              />
            </div>

            {/* Level selector for Explain */}
            {activeTool === "explain" && (
              <div className="shrink-0">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Explanatory Depth:
                </label>
                <div className="flex rounded-xl bg-white p-1 border border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  {(["simple", "intermediate", "advanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExplainLevel(lvl)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition-all cursor-pointer",
                        explainLevel === lvl
                          ? "bg-brand-navy text-white dark:bg-blue-600"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400",
                      )}
                    >
                      {lvl === "simple" ? "Freshman (ELI5)" : lvl === "intermediate" ? "Undergrad" : "Exit Exam"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Secondary concept input for Compare */}
            {activeTool === "compare" && (
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Compare Against:
                </label>
                <Input
                  value={secondaryConcept}
                  onChange={(e) => setSecondaryConcept(e.target.value)}
                  placeholder="e.g. UDP, Linear Search, Massed Practice..."
                  className="bg-white dark:bg-slate-900 text-xs font-medium"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleExecuteTool();
                    }
                  }}
                />
              </div>
            )}

            <div className="self-end sm:self-auto sm:pt-5">
              <Button
                type="button"
                onClick={() => handleExecuteTool()}
                disabled={isPending}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs rounded-xl shadow-sm px-5"
              >
                {isPending ? (
                  <>
                    <Sparkles className="size-3.5 mr-2 animate-spin text-amber-300" />
                    Analyzing with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 mr-2 text-amber-300" />
                    Generate Deep Breakdown
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Concept Pickers from the Active Study Set */}
          {studySet.notes?.keyConcepts && studySet.notes.keyConcepts.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-[11px]">
              <span className="font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                From notes:
              </span>
              {studySet.notes.keyConcepts.slice(0, 5).map((kc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setConceptQuery(kc.concept);
                    handleExecuteTool(activeTool, kc.concept);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-medium text-slate-600 hover:border-brand-navy/40 hover:text-brand-navy dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 shrink-0 cursor-pointer transition-colors"
                >
                  {kc.concept}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Conversation Stream & Responses ── */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "rounded-3xl border p-6 transition-all",
              msg.sender === "user"
                ? "border-blue-200 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20 text-slate-900 dark:text-white"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs",
            )}
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                {msg.sender === "user" ? (
                  <div className="flex size-7 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs">
                    <User className="size-4" />
                  </div>
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-indigo-600 text-white shadow-xs">
                    <Bot className="size-4 text-amber-300" />
                  </div>
                )}
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {msg.sender === "user" ? "You" : "Studley AI Tutor"}
                  </span>
                  {msg.tool && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider">
                      {msg.tool.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>

              {msg.sender === "tutor" && (
                <button
                  type="button"
                  onClick={() => handleCopyText(msg.id, msg.text)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer text-xs"
                >
                  {copiedId === msg.id ? (
                    <>
                      <Check className="size-3 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Body */}
            {msg.sender === "user" ? (
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{msg.text}</p>
            ) : (
              <div className="space-y-4">
                <MarkdownRenderer content={msg.text} />

                {/* Adaptive Quiz Question if present */}
                {msg.quizQuestion && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/50 p-5 dark:border-rose-900/30 dark:bg-rose-950/20 space-y-3">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                      <HelpCircle className="size-4" />
                      Diagnostic Retention Challenge
                    </div>
                    <p className="font-serif font-bold text-slate-900 dark:text-white text-sm">
                      {msg.quizQuestion.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {msg.quizQuestion.options.map((opt, optIdx) => {
                        const isAnswered = msg.userAnsweredIndex !== undefined;
                        const isChosen = msg.userAnsweredIndex === optIdx;
                        const isCorrect = msg.quizQuestion?.correctIndex === optIdx;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isAnswered}
                            onClick={() => handleAnswerQuiz(msg.id, optIdx)}
                            className={cn(
                              "flex items-start gap-2.5 rounded-xl border p-3 text-left text-xs font-medium transition-all cursor-pointer",
                              !isAnswered &&
                                "border-slate-200 bg-white hover:border-brand-navy/40 dark:border-slate-700 dark:bg-slate-900",
                              isAnswered && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold",
                              isAnswered && isChosen && !isCorrect && "border-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/60 dark:text-rose-200",
                              isAnswered && !isChosen && !isCorrect && "opacity-50 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                                isAnswered && isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : isAnswered && isChosen && !isCorrect
                                    ? "bg-rose-600 text-white"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                              )}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {msg.userAnsweredIndex !== undefined && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200 font-medium">
                        <span className="font-bold">Pedagogical Explanation: </span>
                        {msg.quizQuestion.explanation}
                      </div>
                    )}
                  </div>
                )}

                {/* Source Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Grounded In:</span>
                    {msg.citations.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {c.title} {c.section ? `· ${c.section}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isPending && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-pulse space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 animate-spin text-amber-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Google Gemini formulating deep academic breakdown...
              </span>
            </div>
            <div className="h-4 w-3/4 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-1/2 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        )}
      </div>
    </div>
  );
}
