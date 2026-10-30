import {
  AlertTriangle,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  GraduationCap,
  Languages,
  Lightbulb,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useIntegrations } from "@/hooks/use-integrations";
import { DEFAULT_SUGGESTED_PROMPTS } from "@/lib/integrations-store";
import { cn } from "@/lib/utils";

const PERSONAS = [
  {
    id: "socratic",
    title: "Socratic Mentor",
    tagline: "Guides students via inquiry & structured hints",
    desc: "Instead of simply giving away the final answer, asks probing questions that help the student deduce the solution step-by-step.",
    icon: Lightbulb,
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "strict_exam",
    title: "National Exit Exam Drillmaster",
    tagline: "Rigorous Ethiopian MoE curriculum grading",
    desc: "Focuses sharply on Ministry of Education exit exam competencies, scoring rubrics, formula rigor, and warns about classic examiner traps.",
    icon: GraduationCap,
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "friendly_tutor",
    title: "Encouraging Academic Coach",
    tagline: "Empathetic, clear everyday analogies",
    desc: "Breaks difficult concepts down into relatable real-world analogies, provides positive reinforcement, and simplifies intimidating proofs.",
    icon: UserCheck,
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
] as const;

export function AiTutorSettings() {
  const { config, setAiStudy } = useIntegrations();

  const [persona, setPersona] = useState<"socratic" | "strict_exam" | "friendly_tutor">(
    config.aiStudy.tutorPersona || "socratic",
  );
  const [tone, setTone] = useState<"academic" | "simplified" | "exam_prep">(
    config.aiStudy.tutorTone || "academic",
  );
  const [enableAmharic, setEnableAmharic] = useState(
    config.aiStudy.enableAmharicSupport !== false,
  );
  const [maxQuestionLimit, setMaxQuestionLimit] = useState(
    config.aiStudy.maxQuestionLimit || 20,
  );
  const [fallbackMode, setFallbackMode] = useState<"question_bank" | "strict_error">(
    config.aiStudy.fallbackMode || "question_bank",
  );
  const [prompts, setPrompts] = useState<string[]>(
    config.aiStudy.suggestedPrompts || DEFAULT_SUGGESTED_PROMPTS,
  );
  const [newPromptText, setNewPromptText] = useState("");

  const handleAddPrompt = () => {
    if (!newPromptText.trim()) return;
    if (prompts.includes(newPromptText.trim())) {
      toast.error("This starter prompt already exists.");
      return;
    }
    const updated = [...prompts, newPromptText.trim()];
    setPrompts(updated);
    setNewPromptText("");
    toast.success("Prompt suggestion chip added!");
  };

  const handleRemovePrompt = (index: number) => {
    const updated = prompts.filter((_, i) => i !== index);
    setPrompts(updated);
  };

  const handleResetPrompts = () => {
    setPrompts(DEFAULT_SUGGESTED_PROMPTS);
    toast.info("Prompt suggestion chips reset to default.");
  };

  const handleSave = () => {
    setAiStudy({
      tutorPersona: persona,
      tutorTone: tone,
      enableAmharicSupport: enableAmharic,
      maxQuestionLimit,
      fallbackMode,
      suggestedPrompts: prompts,
    });
    toast.success("AI Tutor & Student Copilot settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      {/* ── Tutor Persona Card Selector ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-serif text-lg text-brand-navy flex items-center gap-2">
                <Brain className="size-5 text-brand-gold" />
                AI Tutor Persona & Pedagogical Style
              </CardTitle>
              <CardDescription className="text-xs">
                Select the guiding teaching philosophy used when students chat with the AI Tutor on{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-brand-navy font-bold">
                  /ai-study
                </code>
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="gap-1.5 bg-brand-navy text-white hover:bg-brand-navy/90 text-xs font-semibold shrink-0"
            >
              <Save className="size-3.5" />
              Save Tutor Config
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {PERSONAS.map((item) => {
              const isSelected = persona === item.id;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => setPersona(item.id)}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition cursor-pointer",
                    isSelected
                      ? "border-brand-navy bg-white shadow-md ring-2 ring-brand-navy/10"
                      : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white",
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
                        <Icon className="size-4.5" />
                      </div>
                      {isSelected && (
                        <span className="flex items-center gap-1 rounded-full bg-brand-navy px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          <Check className="size-2.5" />
                          Active
                        </span>
                      )}
                    </div>

                    <h4 className="mt-3 font-serif text-sm font-bold text-brand-navy">
                      {item.title}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                      {item.tagline}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Badge variant="outline" className={cn("text-[10px]", item.badgeColor)}>
                      {item.title.split(" ")[0]} Style
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Academic Tone and Language Selection */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Response Depth & Tone</Label>
              <Select
                value={tone}
                onValueChange={(value) => {
                  if (value === "academic" || value === "simplified" || value === "exam_prep") {
                    setTone(value);
                  }
                }}
              >
                <SelectTrigger className="text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic" className="text-xs">
                    Academic & Rigorous (University exit-exam terminology & structured proofs)
                  </SelectItem>
                  <SelectItem value="simplified" className="text-xs">
                    Simplified & Intuitive (ELI5 analogies, conversational guidance)
                  </SelectItem>
                  <SelectItem value="exam_prep" className="text-xs">
                    Exam Drill Focused (Formulas, traps, scoring benchmarks)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="amharic-toggle" className="text-xs font-semibold text-brand-navy cursor-pointer flex items-center gap-1.5">
                  <Languages className="size-4 text-brand-gold" />
                  Bilingual Amharic Support (አማርኛ ድጋፍ)
                </Label>
                <p className="text-[11px] text-slate-500">
                  Allow students to ask in Amharic and receive native transliteration aids.
                </p>
              </div>
              <Switch
                id="amharic-toggle"
                checked={enableAmharic}
                onCheckedChange={setEnableAmharic}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Starter Suggestion Prompts Manager ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-serif text-lg text-brand-navy flex items-center gap-2">
                <MessageSquare className="size-5 text-brand-gold" />
                Student Quick-Prompt Suggestion Chips
              </CardTitle>
              <CardDescription className="text-xs">
                These clickable prompt chips appear above the AI chat input for students on{" "}
                <code>/ai-study</code> to initiate high-yield inquiries.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetPrompts}
              className="gap-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="size-3.5" />
              Reset to MoE Defaults
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPrompt()}
              placeholder="e.g. Compare the two main algorithms side-by-side..."
              className="text-xs bg-white"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddPrompt}
              className="gap-1 bg-brand-navy text-white hover:bg-brand-navy/90 text-xs shrink-0 font-semibold"
            >
              <Plus className="size-3.5" />
              Add Prompt
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {prompts.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 text-xs text-slate-700 shadow-2xs hover:bg-white transition"
              >
                <span>"{p}"</span>
                <button
                  type="button"
                  onClick={() => handleRemovePrompt(idx)}
                  className="rounded-full p-0.5 text-slate-400 hover:text-red-500 transition"
                  title="Remove chip"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Quotas, Fallbacks & Safety Policies ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg text-brand-navy flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand-gold" />
            Generation Guardrails & Fallback Policy
          </CardTitle>
          <CardDescription className="text-xs">
            Safeguards against excessive token consumption and automated fallback when AI quotas run out.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
              <Label className="text-xs font-semibold text-brand-navy">
                Max Questions Cap per Generation: {maxQuestionLimit}
              </Label>
              <p className="text-[11px] text-slate-500">
                Upper limit allowed for a student in a single study set generation request to control token consumption.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                {[10, 15, 20, 25, 30].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    size="sm"
                    variant={maxQuestionLimit === num ? "default" : "outline"}
                    onClick={() => setMaxQuestionLimit(num)}
                    className={cn(
                      "size-8 p-0 text-xs font-bold",
                      maxQuestionLimit === num && "bg-brand-navy text-white",
                    )}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
              <Label className="text-xs font-semibold text-brand-navy">
                Quota Exhaustion / Key Absence Fallback Policy
              </Label>
              <p className="text-[11px] text-slate-500">
                Determines behavior if the active AI API provider returns quota errors or is unreachable.
              </p>
              <Select
                value={fallbackMode}
                onValueChange={(value) => {
                  if (value === "question_bank" || value === "strict_error") {
                    setFallbackMode(value);
                  }
                }}
              >
                <SelectTrigger className="text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="question_bank" className="text-xs">
                    ✓ Seamless Fallback to Ethiopian High-Yield Question Bank (Recommended)
                  </SelectItem>
                  <SelectItem value="strict_error" className="text-xs">
                    ✕ Strict Error Notification (Block until API recovers)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
