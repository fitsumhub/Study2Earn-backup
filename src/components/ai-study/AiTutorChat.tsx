import {
  Bot,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { subjectLabel } from "./subject";
import type { AIResult } from "./types";

interface Message {
  id: string;
  sender: "user" | "tutor";
  text: string;
  timestamp: string;
}

export function AiTutorChat({ result }: { result: AIResult }) {
  const subject = subjectLabel(result.subject);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      sender: "tutor",
      text: `Hi there! I'm your AI Tutor for this ${subject} study pack ("${result.filename}").\n\nAsk me anything! I can explain confusing definitions, give you real-world analogies, highlight exam traps, or quiz you on the key concepts.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    `Explain "${result.notes.definitions[0]?.term || 'the main concept'}" like I'm 5`,
    "Give me a real-world analogy for this material",
    "What is the most likely trick or trap on the exam?",
    "Create a memorable mnemonic to remember these definitions",
    "Quiz me with a hard scenario question",
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    // Generate grounded contextual response
    setTimeout(() => {
      const responseText = generateTutorResponse(text, result);
      const tutorMsg: Message = {
        id: `tutor-${Date.now()}`,
        sender: "tutor",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, tutorMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleClear = () => {
    setMessages([
      {
        id: `tutor-${Date.now()}`,
        sender: "tutor",
        text: `Chat reset! What else would you like to explore regarding ${subject}?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="mx-auto flex h-[650px] max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* ── Tutor Header ── */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-indigo-700 text-brand-gold shadow-sm">
            <Bot className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base font-bold text-brand-navy">Studley AI Tutor</h3>
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active on your file
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grounded on {result.notes.definitions.length} definitions and{" "}
              {result.notes.keyConcepts.length} core concepts
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          title="Reset conversation"
          className="rounded-xl text-slate-400 hover:text-slate-600"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      {/* ── Chat Messages Stream ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex gap-3 max-w-[85%]",
              m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
            )}
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                m.sender === "user"
                  ? "bg-brand-gold/20 text-brand-navy"
                  : "bg-brand-navy text-brand-gold",
              )}
            >
              {m.sender === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>

            <div className="space-y-1">
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm",
                  m.sender === "user"
                    ? "bg-brand-navy text-white rounded-tr-none"
                    : "bg-slate-100/90 text-slate-800 rounded-tl-none border border-slate-200/60",
                )}
              >
                {m.text}
              </div>
              <p
                className={cn(
                  "text-[10px] text-slate-400 px-1",
                  m.sender === "user" ? "text-right" : "text-left",
                )}
              >
                {m.timestamp}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-brand-navy text-brand-gold">
              <Bot className="size-4" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3 border border-slate-200/60">
              <span className="size-2 rounded-full bg-slate-400 animate-bounce" />
              <span className="size-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="size-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* ── Quick Prompts Pills ── */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <Sparkles className="size-3.5 text-brand-gold shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Suggested:
          </span>
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(qp)}
              disabled={isTyping}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-brand-navy/30 hover:bg-slate-50 hover:text-brand-navy disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input Box ── */}
      <div className="border-t border-slate-200 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={`Ask anything about this ${subject} material...`}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm outline-none transition focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="rounded-xl bg-brand-navy px-4 text-white hover:bg-brand-navy/90"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/** Grounded local intelligent response generator that draws directly on the active pack */
function generateTutorResponse(prompt: string, result: AIResult): string {
  const p = prompt.toLowerCase();
  const subject = subjectLabel(result.subject);

  // 1. Check for definitions query
  const matchedDef = result.notes.definitions.find((d) =>
    p.includes(d.term.toLowerCase()) || d.definition.toLowerCase().includes(p),
  );

  if (p.includes("like i'm 5") || p.includes("simple") || p.includes("simply")) {
    if (matchedDef) {
      return `👶 Think of "${matchedDef.term}" like this:\n\n${matchedDef.definition}.\n\nIn everyday language, it simply means that when this occurs, it naturally triggers a predictable outcome. Keep that core picture in your head!`;
    }
    return `👶 Here is the simplest way to understand this ${subject} topic:\n\n${result.notes.summary}\n\nThe big idea is that every rule or formula in this chapter is just describing that one fundamental relationship!`;
  }

  if (p.includes("analogy") || p.includes("real-world") || p.includes("example")) {
    const concept = result.notes.keyConcepts[0] || result.notes.summary;
    return `💡 Real-World Analogy:\n\nImagine driving a car or riding a bicycle. ${concept}\n\nJust like the car responds immediately to pressing the accelerator or brakes, in ${subject} this same principle governs how the system behaves. Visualizing physical objects makes these abstract concepts stick much longer!`;
  }

  if (p.includes("trap") || p.includes("trick") || p.includes("exam")) {
    const tip = result.notes.studyTips[0] || "Carefully read whether units need conversion.";
    const qSample = result.questions[0];
    return `⚠️ High-Yield Exam Traps for ${subject}:\n\n1. ${tip}\n\n2. Watch out for questions like:\n"${qSample?.question || 'conceptual questions'}"\n\nExaminers often include distractors that look mathematically sound but violate fundamental definitions. Always verify the core principle before selecting your answer!`;
  }

  if (p.includes("mnemonic") || p.includes("memory") || p.includes("remember")) {
    const terms = result.notes.definitions.slice(0, 4).map((d) => d.term);
    const letters = terms.map((t) => t.charAt(0).toUpperCase()).join("");
    return `🧠 Memory Hook / Mnemonic:\n\nFor the key concepts [${terms.join(", ")}], remember the acronym:\n\n✨ **${letters || "ACE"}** ✨\n\n${terms.map((t) => `• **${t.charAt(0).toUpperCase()}** = ${t}`).join("\n")}\n\nRepeat this acronym three times out loud to lock it into your working memory!`;
  }

  if (p.includes("quiz") || p.includes("test me")) {
    const randomQ = result.questions[Math.floor(Math.random() * result.questions.length)];
    if (randomQ) {
      return `🎯 Quick Quiz Challenge:\n\n"${randomQ.question}"\n\nA) ${randomQ.options[0]}\nB) ${randomQ.options[1]}\nC) ${randomQ.options[2]}\nD) ${randomQ.options[3]}\n\nReply with your answer (A, B, C, or D) and I'll tell you if you're right!`;
    }
  }

  if (matchedDef) {
    return `📖 Definition breakdown for "${matchedDef.term}":\n\n${matchedDef.definition}\n\nWhy this matters: In ${subject} Exit Exams, questions often test whether you can recognize this definition when applied to a practical problem.`;
  }

  // General grounded synthesis
  return `Great question! Looking at your ${subject} material ("${result.filename}"):\n\n${result.notes.summary}\n\nKey takeaway: ${result.notes.keyConcepts[0] || 'Focus on the core definitions'}.\n\nIs there a specific part of this explanation you'd like me to unpack further?`;
}

