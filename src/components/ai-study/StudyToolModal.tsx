import {
  ArrowRight,
  BookMarked,
  Check,
  Copy,
  Download,
  GraduationCap,
  Languages,
  Loader2,
  MessageSquare,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIntegrations } from "@/hooks/use-integrations";
import { addSavedResponse, incrementStudyStat } from "@/lib/ai-chat-store";
import { chatWithAiStudy } from "@/lib/api/ai-study.functions";
import { MarkdownRenderer } from "./MarkdownRenderer";
import type { StudyToolDef } from "./StudyToolCard";

const ETHIOPIAN_COURSES = [
  "General Physics (Phys 1011)",
  "Freshman Mathematics (Math 1011)",
  "Logic & Critical Thinking (Phil 1011)",
  "General Biology (Biol 1011)",
  "General Chemistry (Chem 1011)",
  "Communicative English Skills (EnLa 1011)",
  "Intro to Psychology (Psyc 1011)",
  "Civics & Ethics (CESt 1023)",
  "Global Trends (GlTr 1012)",
  "Intro to Computer Programming (CoSc 1011)",
  "National Exit Exam General",
];

interface StudyToolModalProps {
  tool: StudyToolDef | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChatWithTopic?: (topic: string, course: string, tool: string) => void;
}

export function StudyToolModal({
  tool,
  isOpen,
  onClose,
  onOpenChatWithTopic,
}: StudyToolModalProps) {
  const { config: integrations } = useIntegrations();
  const [course, setCourse] = useState(ETHIOPIAN_COURSES[0]);
  const [promptInput, setPromptInput] = useState("");
  const [language, setLanguage] = useState<"en" | "am">("en");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync sample input when tool changes
  React.useEffect(() => {
    if (tool) {
      setPromptInput(tool.sampleInput);
      setResult(null);
      setSaved(false);
    }
  }, [tool]);

  if (!tool) return null;

  const handleGenerate = async () => {
    if (!promptInput.trim() || loading) return;

    setLoading(true);
    setResult(null);
    setSaved(false);

    try {
      const activeProvider = integrations.aiStudy.provider;
      const settings = integrations.aiStudy.providers?.[activeProvider];
      const apiKey = settings?.apiKey?.trim() || integrations.aiStudy.apiKey?.trim();

      const res = await chatWithAiStudy({
        data: {
          messages: [{ role: "user", content: promptInput.trim() }],
          course,
          tool: tool.id,
          language,
          provider: activeProvider,
          apiKey: apiKey || undefined,
          model: settings?.model || undefined,
          baseUrl: settings?.baseUrl || undefined,
          systemPrompt: integrations.aiStudy.systemPrompt,
          temperature: integrations.aiStudy.temperature,
        },
      });

      setResult(res.content);
      incrementStudyStat("topicsExplored", 1);
      if (tool.id === "questions" || tool.id === "exam") {
        incrementStudyStat("questionsAnswered", 5);
      } else if (tool.id === "flashcards") {
        incrementStudyStat("cardsMastered", 5);
      }
      toast.success("Generation completed!");
    } catch (err) {
      toast.error("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!result) return;
    if (saved) {
      toast.info("Already saved to Study Library");
      return;
    }
    addSavedResponse({
      title: `${tool.title}: ${course}`,
      course,
      tool: tool.id,
      content: result,
      tags: [course, tool.title],
    });
    setSaved(true);
    toast.success("Saved to Study Library");
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studley-${tool.id}-${course.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded Markdown file");
  };

  const handleSendToChat = () => {
    if (onOpenChatWithTopic) {
      onOpenChatWithTopic(promptInput, course, tool.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tool.emoji}</span>
            <div>
              <DialogTitle className="font-serif text-xl font-bold text-brand-navy dark:text-white">
                {tool.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                {tool.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Input Controls */}
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Target Course / Subject
              </label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger className="h-9 rounded-xl text-xs font-semibold">
                  <GraduationCap className="mr-2 size-3.5 text-brand-gold shrink-0" />
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent className="max-h-60 text-xs">
                  {ETHIOPIAN_COURSES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Language Mode
              </label>
              <div className="flex rounded-xl border border-slate-200 p-0.5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                    language === "en"
                      ? "bg-brand-navy text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("am")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                    language === "am"
                      ? "bg-brand-navy text-brand-gold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  አማርኛ (Amharic)
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Topic, Concept, or Notes to Process
            </label>
            <textarea
              rows={4}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Enter the concept, formula, or paste notes here..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs leading-relaxed outline-none transition focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-400">
              ⚡ Grounded in Ethiopian University curriculum standards
            </span>
            <Button
              type="button"
              disabled={!promptInput.trim() || loading}
              onClick={handleGenerate}
              className="rounded-xl bg-brand-navy px-6 font-bold text-white hover:bg-brand-navy/90 dark:bg-brand-gold dark:text-slate-950"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4 text-brand-gold" />
                  Run {tool.title}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results State */}
        {result && (
          <div className="mt-6 space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/60 animate-in fade-in-0 duration-300">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-navy dark:text-brand-gold">
                <Sparkles className="size-3.5" />
                Generated Output
              </span>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <BookMarked className="size-3 text-brand-gold" />
                  <span>{saved ? "Saved" : "Save"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <Download className="size-3" />
                  <span>Export</span>
                </button>

                {onOpenChatWithTopic && (
                  <button
                    type="button"
                    onClick={handleSendToChat}
                    className="flex items-center gap-1 rounded-lg bg-brand-navy px-3 py-1 font-bold text-white hover:bg-brand-navy/90"
                  >
                    <MessageSquare className="size-3 text-brand-gold" />
                    <span>Open in AI Chat</span>
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto pr-1">
              <MarkdownRenderer content={result} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

