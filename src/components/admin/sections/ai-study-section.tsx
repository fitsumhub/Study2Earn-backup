import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  ExternalLink,
  Flame,
  Key,
  Layers,
  Loader2,
  Play,
  Plug,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAiStudyHistory } from "@/hooks/use-ai-study-history";
import { useIntegrations } from "@/hooks/use-integrations";
import {
  generateStudyPack,
  getAiStudyStatus,
  testAiConnection,
} from "@/lib/api/ai-study.functions";
import {
  DEFAULT_AI_SYSTEM_PROMPT,
  DEFAULT_PROVIDER_SETTINGS,
  type AiStudyProvider,
} from "@/lib/integrations-store";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { cn } from "@/lib/utils";

type ServerEnvStatus = Record<string, boolean>;

type ProviderMeta = {
  id: AiStudyProvider;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  defaultBaseUrl: string;
  defaultModel: string;
  modelPresets: { value: string; label: string; desc: string }[];
  envVar: string;
  keyPlaceholder: string;
  icon: typeof Bot;
  color: string;
  accent: string;
};

const PROVIDERS: ProviderMeta[] = [
  {
    id: "openai",
    name: "OpenAI",
    badge: "Most Popular",
    tagline: "GPT-4o Mini & GPT-4o",
    description: "Industry-standard models with outstanding reasoning and structured formatting.",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    modelPresets: [
      { value: "gpt-4o-mini", label: "gpt-4o-mini", desc: "Fast, highly capable, very economical (Recommended)" },
      { value: "gpt-4o", label: "gpt-4o", desc: "Flagship intelligence for complex scientific problem solving" },
      { value: "gpt-3.5-turbo", label: "gpt-3.5-turbo", desc: "Legacy fast completions model" },
    ],
    envVar: "OPENAI_API_KEY",
    keyPlaceholder: "sk-proj-...",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-700",
    accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    badge: "Best Quality",
    tagline: "Claude 3.5 Sonnet & Haiku",
    description: "Superior nuanced comprehension, pedagogical tone, and native structured formatting.",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModel: "claude-3-5-sonnet-20241022",
    modelPresets: [
      { value: "claude-3-5-sonnet-20241022", label: "claude-3-5-sonnet", desc: "Highest intelligence & nuanced pedagogical writing" },
      { value: "claude-3-5-haiku-20241022", label: "claude-3-5-haiku", desc: "Blazing fast inference and low cost" },
      { value: "claude-3-opus-20240229", label: "claude-3-opus", desc: "Deep analytical and conceptual reasoning" },
    ],
    envVar: "ANTHROPIC_API_KEY",
    keyPlaceholder: "sk-ant-api03-...",
    icon: Bot,
    color: "from-amber-500 to-orange-700",
    accent: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    badge: "Lowest Cost",
    tagline: "DeepSeek-Chat & Reasoner",
    description: "Remarkably inexpensive generation with OpenAI-compatible API architecture.",
    defaultBaseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    modelPresets: [
      { value: "deepseek-chat", label: "deepseek-chat (V3)", desc: "Ultra-fast, fraction-of-a-cent cost, general knowledge" },
      { value: "deepseek-reasoner", label: "deepseek-reasoner (R1)", desc: "Deep chain-of-thought mathematical reasoning" },
    ],
    envVar: "DEEPSEEK_API_KEY",
    keyPlaceholder: "sk-...",
    icon: Zap,
    color: "from-blue-500 to-indigo-700",
    accent: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    id: "groq",
    name: "Groq LPU",
    badge: "Blazing Fast",
    tagline: "LLaMA 3.3 70B & Mixtral",
    description: "Sub-second inference speed running open-weights models at hundreds of tokens/sec.",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    modelPresets: [
      { value: "llama-3.3-70b-versatile", label: "llama-3.3-70b-versatile", desc: "State-of-the-art open model, near GPT-4 level (Recommended)" },
      { value: "llama-3.1-8b-instant", label: "llama-3.1-8b-instant", desc: "Instantaneous responses, lightweight" },
      { value: "mixtral-8x7b-32768", label: "mixtral-8x7b-32768", desc: "MoE architecture with large context window" },
    ],
    envVar: "GROQ_API_KEY",
    keyPlaceholder: "gsk_...",
    icon: Flame,
    color: "from-orange-500 to-rose-700",
    accent: "text-orange-600 bg-orange-50 border-orange-200",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "High Context",
    tagline: "Gemini 1.5 & 2.0 Flash",
    description: "Massive context window, multi-modal capabilities, and generous rate limits.",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-1.5-flash",
    modelPresets: [
      { value: "gemini-1.5-flash", label: "gemini-1.5-flash", desc: "Fast, light, optimized for high throughput" },
      { value: "gemini-1.5-pro", label: "gemini-1.5-pro", desc: "Complex reasoning and in-depth educational material" },
      { value: "gemini-2.0-flash", label: "gemini-2.0-flash", desc: "Next-generation fast experimental speed" },
    ],
    envVar: "GEMINI_API_KEY",
    keyPlaceholder: "AIzaSy...",
    icon: Cpu,
    color: "from-sky-500 to-cyan-700",
    accent: "text-sky-600 bg-sky-50 border-sky-200",
  },
  {
    id: "custom",
    name: "Custom / Self-Hosted",
    badge: "Flexible",
    tagline: "Ollama, vLLM, OpenRouter...",
    description: "Point to any OpenAI Chat Completions compatible endpoint or local instance.",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3",
    modelPresets: [
      { value: "openrouter/auto", label: "OpenRouter", desc: "Unified API gateway to all models" },
      { value: "llama3", label: "Ollama (Local)", desc: "Free local private inference" },
      { value: "mistral-large-latest", label: "Mistral AI", desc: "European AI models" },
    ],
    envVar: "CUSTOM_AI_API_KEY",
    keyPlaceholder: "Bearer token or custom key...",
    icon: Plug,
    color: "from-purple-500 to-violet-800",
    accent: "text-purple-600 bg-purple-50 border-purple-200",
  },
];

const SAMPLE_STUDY_TEXTS: { label: string; subject: string; text: string }[] = [
  {
    label: "Physics: Newton's Laws & Dynamics",
    subject: "physics",
    text: `Newton's First Law of Motion states that an object at rest remains at rest, and an object in motion continues in motion with constant velocity unless acted upon by a net external force. This property of matter to resist changes in its state of motion is called inertia.
Newton's Second Law establishes the fundamental equation F_net = m * a, where net force is the product of mass and acceleration. Acceleration is directly proportional to net force and inversely proportional to mass.
Newton's Third Law states that whenever one body exerts a force on a second body, the second body exerts an equal and opposite force on the first: for every action, there is an equal and opposite reaction. Friction is a resistive force that opposes relative motion between contacting surfaces.`,
  },
  {
    label: "Biology: Cellular Respiration & ATP",
    subject: "biology",
    text: `Cellular respiration is the metabolic process by which cells convert biochemical energy from nutrients into adenosine triphosphate (ATP), and then release waste products. The process consists of three main stages: glycolysis, the citric acid cycle (Krebs cycle), and oxidative phosphorylation.
Glycolysis occurs in the cytoplasm and breaks down one glucose molecule into two molecules of pyruvate, producing a net gain of 2 ATP and 2 NADH. In the presence of oxygen, pyruvate enters the mitochondrial matrix where it is converted into Acetyl-CoA.
The electron transport chain in the inner mitochondrial membrane uses electrons from NADH and FADH2 to pump protons into the intermembrane space, creating a proton gradient that drives ATP synthase to produce approximately 30 to 32 ATP molecules per glucose molecule.`,
  },
  {
    label: "Chemistry: Chemical Equilibrium",
    subject: "chemistry",
    text: `Chemical equilibrium is the state in a reversible chemical reaction where the forward reaction rate equals the reverse reaction rate. At equilibrium, the concentrations of reactants and products remain constant over time, although the reaction continues dynamically at the microscopic level.
The equilibrium constant (K_eq) is the ratio of product concentrations to reactant concentrations, each raised to the power of their stoichiometric coefficients.
Le Chatelier's Principle states that if an external stress (such as a change in temperature, pressure, or concentration) is applied to a system at equilibrium, the system adjusts in a way that counteracts the stress and establishes a new equilibrium state. An increase in temperature favors the endothermic reaction direction.`,
  },
];

export function AiStudySection({ admin }: { admin?: AdminDashboardState }) {
  const {
    config,
    setAiStudy,
    setAiStudyProviderSettings,
  } = useIntegrations();
  const { history, clear: clearHistory } = useAiStudyHistory();

  const [activeTab, setActiveTab] = useState<"api" | "prompt" | "sandbox" | "history">("api");
  const [serverEnvStatus, setServerEnvStatus] = useState<ServerEnvStatus>({});
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Selected provider in the UI view (can be different from active global provider while exploring)
  const [selectedProviderId, setSelectedProviderId] = useState<AiStudyProvider>(
    config.aiStudy.provider || "openai",
  );

  // Form drafts for current selected provider
  const currentProviderConfig =
    config.aiStudy.providers?.[selectedProviderId] ||
    DEFAULT_PROVIDER_SETTINGS[selectedProviderId];

  const [apiKeyDraft, setApiKeyDraft] = useState(currentProviderConfig.apiKey || "");
  const [modelDraft, setModelDraft] = useState(
    currentProviderConfig.model ||
      PROVIDERS.find((p) => p.id === selectedProviderId)?.defaultModel ||
      "",
  );
  const [baseUrlDraft, setBaseUrlDraft] = useState(
    currentProviderConfig.baseUrl ||
      PROVIDERS.find((p) => p.id === selectedProviderId)?.defaultBaseUrl ||
      "",
  );
  const [showApiKey, setShowApiKey] = useState(false);

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs?: number;
    message?: string;
  } | null>(null);

  // Prompt settings drafts
  const [systemPromptDraft, setSystemPromptDraft] = useState(
    config.aiStudy.systemPrompt || DEFAULT_AI_SYSTEM_PROMPT,
  );
  const [tempDraft, setTempDraft] = useState(config.aiStudy.temperature ?? 0.3);
  const [qCountDraft, setQCountDraft] = useState(config.aiStudy.defaultQuestionCount ?? 5);

  // Test sandbox state
  const [sandboxText, setSandboxText] = useState(SAMPLE_STUDY_TEXTS[0].text);
  const [sandboxCount, setSandboxCount] = useState(3);
  const [isGeneratingSandbox, setIsGeneratingSandbox] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);

  // Sync draft states when user switches selected provider
  useEffect(() => {
    const prov =
      config.aiStudy.providers?.[selectedProviderId] ||
      DEFAULT_PROVIDER_SETTINGS[selectedProviderId];
    const defaultMeta = PROVIDERS.find((p) => p.id === selectedProviderId);

    setApiKeyDraft(prov.apiKey || "");
    setModelDraft(prov.model || defaultMeta?.defaultModel || "");
    setBaseUrlDraft(prov.baseUrl || defaultMeta?.defaultBaseUrl || "");
    setTestResult(null);
  }, [selectedProviderId, config.aiStudy.providers]);

  // Load server env status on mount
  useEffect(() => {
    let cancelled = false;
    getAiStudyStatus()
      .then((status) => {
        if (!cancelled) {
          setServerEnvStatus(status);
          setLoadingStatus(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerEnvStatus({});
          setLoadingStatus(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeProviderMeta = PROVIDERS.find((p) => p.id === config.aiStudy.provider)!;
  const currentSelectedMeta = PROVIDERS.find((p) => p.id === selectedProviderId)!;

  const hasServerEnvForActive = Boolean(serverEnvStatus[config.aiStudy.provider]);
  const hasClientKeyForActive = Boolean(
    config.aiStudy.providers?.[config.aiStudy.provider]?.apiKey?.trim() ||
      config.aiStudy.apiKey?.trim(),
  );
  const isEngineLive = config.aiStudy.enabled && (hasClientKeyForActive || hasServerEnvForActive);

  // Activate provider as the global live engine
  const handleSetActiveEngine = (providerId: AiStudyProvider) => {
    setAiStudy({ provider: providerId });
    setSelectedProviderId(providerId);
    toast.success(`AI Study generation switched to ${PROVIDERS.find((p) => p.id === providerId)?.name}`);
  };

  // Save connection settings for currently inspected provider
  const handleSaveConnection = () => {
    const defaultMeta = PROVIDERS.find((p) => p.id === selectedProviderId);
    const finalModel = modelDraft.trim() || defaultMeta?.defaultModel || "gpt-4o-mini";
    const finalBaseUrl = baseUrlDraft.trim() || defaultMeta?.defaultBaseUrl;

    setAiStudyProviderSettings(selectedProviderId, {
      apiKey: apiKeyDraft.trim(),
      model: finalModel,
      baseUrl: finalBaseUrl,
    });

    toast.success(`${currentSelectedMeta.name} settings saved successfully!`);
  };

  // Test live connection to the AI provider
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testAiConnection({
        data: {
          provider: selectedProviderId,
          apiKey: apiKeyDraft.trim() || undefined,
          baseUrl: baseUrlDraft.trim() || undefined,
          model: modelDraft.trim() || undefined,
        },
      });

      setTestResult(res);
      if (res.ok) {
        toast.success(`Connected to ${currentSelectedMeta.name} in ${res.latencyMs}ms!`);
      } else {
        toast.error(`Connection failed: ${res.message}`);
      }
    } catch (err: any) {
      const msg = err?.message || "Network error while reaching AI provider";
      setTestResult({ ok: false, message: msg });
      toast.error(msg);
    } finally {
      setIsTesting(false);
    }
  };

  // Save prompt and parameters
  const handleSaveParameters = () => {
    setAiStudy({
      systemPrompt: systemPromptDraft.trim(),
      temperature: tempDraft,
      defaultQuestionCount: qCountDraft,
    });
    toast.success("AI Study prompt and generation rules saved!");
  };

  // Reset prompt to MoE standard
  const handleResetPrompt = () => {
    setSystemPromptDraft(DEFAULT_AI_SYSTEM_PROMPT);
    toast.info("Prompt restored to standard MoE curriculum instruction.");
  };

  // Run generation test in sandbox
  const handleRunSandbox = async () => {
    if (!sandboxText.trim()) {
      toast.error("Please enter or select sample study material first.");
      return;
    }

    setIsGeneratingSandbox(true);
    setSandboxResult(null);

    try {
      const activeSettings = config.aiStudy.providers?.[config.aiStudy.provider];
      const res = await generateStudyPack({
        data: {
          text: sandboxText,
          questionCount: sandboxCount,
          provider: config.aiStudy.provider,
          apiKey: activeSettings?.apiKey || config.aiStudy.apiKey || undefined,
          model: activeSettings?.model || undefined,
          baseUrl: activeSettings?.baseUrl || undefined,
          systemPrompt: config.aiStudy.systemPrompt,
          temperature: config.aiStudy.temperature,
        },
      });

      if (res.ok) {
        setSandboxResult(res.data);
        toast.success("Study Pack generated successfully via AI API!");
      } else {
        toast.error(`Generation failed: ${res.reason}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate study pack in sandbox.");
    } finally {
      setIsGeneratingSandbox(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Status Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute right-0 top-0 h-full w-96 bg-gradient-to-l from-brand-gold/10 via-brand-navy/5 to-transparent pointer-events-none" />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-indigo-800 text-brand-gold shadow-md shadow-brand-navy/20">
              <Sparkles className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-serif text-xl font-bold text-brand-navy">
                  AI Study Engine Manager
                </h2>
                {isEngineLive ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-300 gap-1.5 font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live AI Active: {activeProviderMeta.name}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 gap-1.5 font-medium">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    Offline / Demo Fallback Mode
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
                Powers real-time question generation, exam explanations, study notes, and the AI Tutor chat on{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-brand-navy">
                  /ai-study
                </code>
                . Configure your API keys below or seamlessly test your models.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/ai-study"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-brand-navy transition hover:bg-white hover:border-brand-gold hover:shadow-sm"
            >
              Open Student AI Study
              <ExternalLink className="size-3.5 text-slate-400" />
            </a>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5">
              <Label htmlFor="master-ai-switch" className="text-xs font-semibold text-slate-700 cursor-pointer">
                AI Engine
              </Label>
              <Switch
                id="master-ai-switch"
                checked={config.aiStudy.enabled}
                onCheckedChange={(enabled) => {
                  setAiStudy({ enabled });
                  toast.success(
                    enabled
                      ? `AI Engine enabled (${activeProviderMeta.name})`
                      : "Switched to offline question bank fallback",
                  );
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick summary stats pills */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50/60 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Engine</p>
            <p className="text-sm font-bold text-brand-navy">{activeProviderMeta.name}</p>
          </div>
          <div className="rounded-xl bg-slate-50/60 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Default Model</p>
            <p className="text-sm font-bold text-brand-navy truncate">
              {config.aiStudy.providers?.[config.aiStudy.provider]?.model || activeProviderMeta.defaultModel}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/60 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Key Source</p>
            <p className="text-sm font-bold text-brand-navy">
              {hasClientKeyForActive ? "Saved in Admin" : hasServerEnvForActive ? "Server .env" : "None"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/60 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Generated Packs</p>
            <p className="text-sm font-bold text-brand-navy">{history.length} Packs</p>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-11 rounded-xl bg-slate-200/70 p-1">
          <TabsTrigger value="api" className="rounded-lg gap-2 text-xs font-semibold">
            <Key className="size-3.5" />
            API Keys & Providers
          </TabsTrigger>
          <TabsTrigger value="prompt" className="rounded-lg gap-2 text-xs font-semibold">
            <Sliders className="size-3.5" />
            Prompt & Parameters
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="rounded-lg gap-2 text-xs font-semibold">
            <Play className="size-3.5" />
            Live Test Sandbox
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2 text-xs font-semibold">
            <Layers className="size-3.5" />
            Generation Logs ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1: API KEYS & PROVIDERS
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="api" className="space-y-6 mt-4">
          {/* Provider Cards Selection */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROVIDERS.map((provider) => {
              const isActiveEngine = config.aiStudy.provider === provider.id;
              const isInspected = selectedProviderId === provider.id;
              const hasClientKey = Boolean(
                config.aiStudy.providers?.[provider.id]?.apiKey?.trim() ||
                  (isActiveEngine && config.aiStudy.apiKey?.trim()),
              );
              const hasEnvKey = Boolean(serverEnvStatus[provider.id]);
              const Icon = provider.icon;

              return (
                <div
                  key={provider.id}
                  onClick={() => setSelectedProviderId(provider.id)}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all cursor-pointer",
                    isInspected
                      ? "border-brand-navy bg-white shadow-md ring-2 ring-brand-navy/10"
                      : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white",
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex size-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                            provider.color,
                          )}
                        >
                          <Icon className="size-4.5" />
                        </div>
                        <div>
                          <p className="font-serif text-sm font-bold text-brand-navy leading-tight">
                            {provider.name}
                          </p>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            {provider.tagline}
                          </p>
                        </div>
                      </div>

                      {isActiveEngine && (
                        <span className="flex items-center gap-1 rounded-full bg-brand-navy px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          <Check className="size-2.5" />
                          Active
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {provider.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      {hasClientKey ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Key Saved
                        </Badge>
                      ) : hasEnvKey ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                          Server .env
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-400 text-[10px]">
                          No Key Set
                        </Badge>
                      )}
                    </div>

                    {!isActiveEngine ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-brand-navy hover:bg-brand-navy/5 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetActiveEngine(provider.id);
                        }}
                      >
                        Set as Active
                      </Button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Live Engine
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Provider Detailed Configuration Form */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className={cn("h-1.5 w-full bg-gradient-to-r", currentSelectedMeta.color)} />
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-serif text-lg text-brand-navy flex items-center gap-2">
                    <currentSelectedMeta.icon className="size-5 text-brand-gold" />
                    Configure {currentSelectedMeta.name}
                  </CardTitle>
                  <CardDescription>
                    Enter your API key and customize model parameters. You can save your key here directly or via{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-brand-navy font-bold">
                      {currentSelectedMeta.envVar}
                    </code>{" "}
                    in your environment.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  {config.aiStudy.provider !== selectedProviderId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActiveEngine(selectedProviderId)}
                      className="border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white text-xs font-semibold"
                    >
                      Make Active Engine
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveConnection}
                    className="gap-1.5 bg-brand-navy text-white hover:bg-brand-navy/90 text-xs font-semibold"
                  >
                    <Save className="size-3.5" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* API Key Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="api-key" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Key className="size-3.5 text-brand-gold" />
                    {currentSelectedMeta.name} API Key
                  </Label>
                  {serverEnvStatus[selectedProviderId] && (
                    <span className="text-[11px] text-blue-600 font-medium">
                      ✓ Detected in server environment ({currentSelectedMeta.envVar})
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyDraft}
                    onChange={(e) => setApiKeyDraft(e.target.value)}
                    placeholder={currentSelectedMeta.keyPlaceholder}
                    className="pr-20 font-mono text-sm bg-white"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="rounded p-1 text-slate-400 hover:text-slate-600"
                      title={showApiKey ? "Hide key" : "Show key"}
                    >
                      {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                    {apiKeyDraft && (
                      <button
                        type="button"
                        onClick={() => setApiKeyDraft("")}
                        className="rounded p-1 text-slate-400 hover:text-red-500"
                        title="Clear"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Your API key is saved securely in the platform store and sent directly to the AI provider endpoint.
                </p>
              </div>

              {/* Model Selection & Custom Model */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Model Selection</Label>
                  <Select
                    value={modelDraft}
                    onValueChange={(val) => setModelDraft(val)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select or type model" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentSelectedMeta.modelPresets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          <div className="flex flex-col text-left py-0.5">
                            <span className="font-mono font-medium">{preset.label}</span>
                            <span className="text-[10px] text-muted-foreground">{preset.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-model-id" className="text-xs font-semibold text-slate-700">
                    Custom Model ID / Override
                  </Label>
                  <Input
                    id="custom-model-id"
                    value={modelDraft}
                    onChange={(e) => setModelDraft(e.target.value)}
                    placeholder="e.g. gpt-4o or custom-model"
                    className="font-mono text-sm bg-white"
                  />
                </div>
              </div>

              {/* Base URL (useful for custom endpoints, proxies, or local Ollama) */}
              <div className="space-y-2">
                <Label htmlFor="base-url" className="text-xs font-semibold text-slate-700">
                  API Base URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="base-url"
                    value={baseUrlDraft}
                    onChange={(e) => setBaseUrlDraft(e.target.value)}
                    placeholder={currentSelectedMeta.defaultBaseUrl}
                    className="font-mono text-sm bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBaseUrlDraft(currentSelectedMeta.defaultBaseUrl)}
                    className="text-xs shrink-0"
                    title="Reset to default URL"
                  >
                    Default
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Must follow the standard OpenAI Chat Completions endpoint format.
                </p>
              </div>

              {/* Test Connection Action & Result Banner */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-brand-navy">Connection Health Check</p>
                    <p className="text-[11px] text-slate-500">
                      Send a lightweight ping to verify that your credentials and model are live and responding.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isTesting}
                    onClick={handleTestConnection}
                    className="gap-2 bg-white text-xs font-semibold border-slate-300 hover:border-brand-navy hover:text-brand-navy"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Pinging Endpoint…
                      </>
                    ) : (
                      <>
                        <Zap className="size-3.5 text-brand-gold" />
                        Test API Connection
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg p-3 text-xs leading-relaxed",
                      testResult.ok
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200",
                    )}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">
                        {testResult.ok ? "✓ Connection Successful" : "✕ Connection Failed"}
                      </p>
                      <p className="mt-0.5 opacity-90">{testResult.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: PROMPT & GENERATION RULES
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="prompt" className="space-y-6 mt-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-serif text-lg text-brand-navy flex items-center gap-2">
                    <Sliders className="size-5 text-brand-gold" />
                    Curriculum Prompt & Generation Rules
                  </CardTitle>
                  <CardDescription>
                    Fine-tune how the AI designs exam questions, sets difficulty, explains answers, and structures study summaries.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetPrompt}
                    className="gap-1.5 text-xs text-slate-600"
                  >
                    <RotateCcw className="size-3.5" />
                    Reset to MoE Standard
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveParameters}
                    className="gap-1.5 bg-brand-navy text-white hover:bg-brand-navy/90 text-xs font-semibold"
                  >
                    <Save className="size-3.5" />
                    Save Parameters
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* System Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="system-prompt" className="text-xs font-semibold text-slate-700">
                    System Instructions (Grounding Prompt)
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    {systemPromptDraft.length} characters
                  </span>
                </div>
                <Textarea
                  id="system-prompt"
                  rows={6}
                  value={systemPromptDraft}
                  onChange={(e) => setSystemPromptDraft(e.target.value)}
                  className="font-mono text-xs leading-relaxed bg-slate-50/50 focus:bg-white resize-y"
                  placeholder="System instructions..."
                />
                <p className="text-[11px] text-slate-400">
                  Instruction given to the model before analyzing student notes. Crucial for strictly bounding questions to source facts without hallucination.
                </p>
              </div>

              {/* Temperature Slider */}
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold text-brand-navy">
                      Temperature (Creativity vs Strictness): {tempDraft}
                    </Label>
                    <p className="text-[11px] text-slate-400">
                      Lower values (0.1 - 0.3) yield factual, rigorous exam questions. Higher values produce more diverse variations.
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs font-bold bg-white text-brand-navy border">
                    {tempDraft === 0.3 ? "0.3 (Standard Exam)" : tempDraft < 0.3 ? `${tempDraft} (Strict)` : `${tempDraft} (Creative)`}
                  </Badge>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[tempDraft]}
                  onValueChange={([val]) => setTempDraft(val)}
                  className="py-2"
                />
              </div>

              {/* Default Question Count */}
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold text-brand-navy">
                      Default Question Count: {qCountDraft} Questions
                    </Label>
                    <p className="text-[11px] text-slate-400">
                      Standard quantity preset pre-selected for students on the upload step.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[3, 5, 8, 10, 15, 20].map((num) => (
                      <Button
                        key={num}
                        type="button"
                        size="sm"
                        variant={qCountDraft === num ? "default" : "outline"}
                        onClick={() => setQCountDraft(num)}
                        className={cn(
                          "size-8 p-0 text-xs font-bold",
                          qCountDraft === num && "bg-brand-navy text-white",
                        )}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: LIVE TEST SANDBOX
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="sandbox" className="space-y-6 mt-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-lg text-brand-navy flex items-center gap-2">
                <Play className="size-5 text-brand-gold" />
                Live AI Study Generation Sandbox
              </CardTitle>
              <CardDescription>
                Test real-time question generation and output schema verification using your active provider (
                <strong>{activeProviderMeta.name}</strong>) without leaving the admin panel.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Preset Sample buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Quick Samples:</span>
                {SAMPLE_STUDY_TEXTS.map((sample, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSandboxText(sample.text)}
                    className="text-xs bg-white hover:bg-slate-50 border-slate-200"
                  >
                    {sample.label}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sandbox-text" className="text-xs font-semibold text-slate-700">
                  Sample Source Material / Lecture Excerpt
                </Label>
                <Textarea
                  id="sandbox-text"
                  rows={6}
                  value={sandboxText}
                  onChange={(e) => setSandboxText(e.target.value)}
                  className="font-mono text-xs bg-white"
                  placeholder="Paste lecture notes, book excerpt, or syllabus summary..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-slate-700">Question Count:</Label>
                  {[3, 5, 10].map((count) => (
                    <Button
                      key={count}
                      type="button"
                      size="sm"
                      variant={sandboxCount === count ? "default" : "outline"}
                      onClick={() => setSandboxCount(count)}
                      className={cn(
                        "size-7 p-0 text-xs",
                        sandboxCount === count && "bg-brand-navy text-white",
                      )}
                    >
                      {count}
                    </Button>
                  ))}
                </div>

                <Button
                  type="button"
                  disabled={isGeneratingSandbox}
                  onClick={handleRunSandbox}
                  className="gap-2 bg-brand-navy text-white hover:bg-brand-navy/90 font-semibold"
                >
                  {isGeneratingSandbox ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Calling {activeProviderMeta.name} API…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 text-brand-gold" />
                      Generate Test Study Pack
                    </>
                  )}
                </Button>
              </div>

              {/* Sandbox Output Preview */}
              {sandboxResult && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <p className="font-serif text-base font-bold text-brand-navy">
                        Generated Output Preview
                      </p>
                      <p className="text-xs text-slate-500">
                        Subject: <strong className="capitalize">{sandboxResult.subject}</strong> · {sandboxResult.questions?.length} Questions Generated
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      ✓ Schema Verified Valid
                    </Badge>
                  </div>

                  {/* Summary & Key Concepts */}
                  <div className="rounded-xl bg-white p-4 border border-slate-200/80 space-y-2">
                    <p className="text-xs font-bold text-brand-navy">Executive Summary:</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{sandboxResult.notes?.summary}</p>
                    {sandboxResult.notes?.keyConcepts && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {sandboxResult.notes.keyConcepts.map((kc: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {kc}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Generated Questions */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-brand-navy">Generated Multiple Choice Questions:</p>
                    {sandboxResult.questions?.map((q: any, i: number) => (
                      <div key={i} className="rounded-xl bg-white p-4 border border-slate-200/80 space-y-2.5">
                        <div className="flex items-start gap-2">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[10px] font-bold text-white">
                            {i + 1}
                          </span>
                          <p className="text-sm font-semibold text-brand-navy">{q.question}</p>
                        </div>

                        <div className="grid gap-1.5 pl-7 sm:grid-cols-2">
                          {q.options?.map((opt: string, optIdx: number) => {
                            const isCorrect = optIdx === q.correctIndex;
                            return (
                              <div
                                key={optIdx}
                                className={cn(
                                  "rounded-lg p-2 text-xs border transition-colors",
                                  isCorrect
                                    ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold"
                                    : "bg-slate-50 text-slate-700 border-slate-100",
                                )}
                              >
                                <span className="font-mono mr-1.5 text-slate-400">
                                  {["A", "B", "C", "D"][optIdx]})
                                </span>
                                {opt}
                                {isCorrect && " ✓"}
                              </div>
                            );
                          })}
                        </div>

                        <div className="pl-7 pt-1">
                          <p className="text-[11px] text-slate-500 italic">
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 4: GENERATION LOGS & HISTORY
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="history" className="space-y-6 mt-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="font-serif text-lg text-brand-navy">
                  Recent Generated Study Packs
                </CardTitle>
                <CardDescription>
                  Audit log of recent user and admin study packs created across the platform.
                </CardDescription>
              </div>
              {history.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearHistory();
                    toast.success("History log cleared");
                  }}
                  className="gap-1.5 text-xs text-red-600 hover:bg-red-50 hover:border-red-200"
                >
                  <Trash2 className="size-3.5" />
                  Clear Logs
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {history.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <Sparkles className="size-8 mx-auto mb-2 opacity-40 text-brand-gold" />
                  No study packs generated yet in this session.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:bg-slate-50/60 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy font-bold text-xs capitalize">
                          {entry.subject.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-navy">{entry.filename}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="capitalize font-medium text-slate-600">{entry.subject}</span>
                            <span>•</span>
                            <span>{entry.questionCount} Questions</span>
                            <span>•</span>
                            <span>{new Date(entry.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-semibold uppercase",
                            entry.source === "ai"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {entry.source === "ai" ? "Real AI" : "Demo Bank"}
                        </Badge>
                        {entry.scorePct !== undefined && (
                          <Badge variant="outline" className="text-[10px] font-mono font-bold">
                            Score: {entry.scorePct}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

