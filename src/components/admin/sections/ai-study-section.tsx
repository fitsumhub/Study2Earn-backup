import {
  Activity,
  AlertCircle,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Key,
  Layers,
  Loader2,
  Pencil,
  Play,
  Plug,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  SpellCheck,
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useIntegrations } from "@/hooks/use-integrations";
import { saveAdminApiConfigFn } from "@/lib/api/admin-api-config.functions";
import {
  generateMoreFillBlanksFn,
  generateMoreFlashcardsFn,
  generateMoreWrittenTestsFn,
  generateStudyPack,
  getAiStudyStatus,
  summarizeNotesFn,
  testAiConnection,
} from "@/lib/api/ai-study.functions";
import {
  DEFAULT_PROVIDER_SETTINGS,
  type AiStudyProvider,
  type ProviderConnectionSettings,
} from "@/lib/integrations-store";
import {
  getStudySets,
  subscribeStudySets,
  type StudySet,
  type StudySetFillBlank,
  type StudySetFlashcard,
  type StudySetNotes,
  type StudySetQuizQuestion,
  type StudySetWrittenQuestion,
} from "@/lib/study-set-store";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { cn } from "@/lib/utils";

import { AiBenchmarkDialog } from "./ai-study/ai-benchmark-dialog";
import { AiTutorSettings } from "./ai-study/ai-tutor-settings";
import { StudySetsManager } from "./ai-study/study-sets-manager";

interface ProviderConfig {
  id: AiStudyProvider;
  name: string;
  badge: string;
  keyUrl: string;
  keyHelp: string;
  keyPrefixHint: string;
  defaultModel: string;
  models: { id: string; label: string; desc: string }[];
  defaultBaseUrl: string;
  icon: typeof Bot;
  color: string;
}

type AiStudyTab = "api" | "curriculum" | "tutor" | "test";
type StudioOutput =
  | {
      type: "quiz";
      data: { questions: Array<Pick<StudySetQuizQuestion, "question" | "options" | "correctIndex" | "explanation">> };
    }
  | { type: "flashcards"; data: Array<Pick<StudySetFlashcard, "topic" | "front" | "back">> }
  | {
      type: "written";
      data: Array<Pick<StudySetWrittenQuestion, "prompt" | "modelAnswer" | "keyRubricPoints">>;
    }
  | {
      type: "fillblanks";
      data: Array<Pick<StudySetFillBlank, "sentenceWithBlank" | "blankAnswer" | "hint">>;
    }
  | { type: "notes"; data: StudySetNotes & { title?: string } };

const PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Recommended • Free Tier Active",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyHelp: "Get a free API key at Google AI Studio",
    keyPrefixHint: "Starts with AIzaSy...",
    defaultModel: "gemini-flash-lite-latest",
    models: [
      { id: "gemini-flash-lite-latest", label: "gemini-flash-lite-latest", desc: "Ultra-fast, high limits (<2s latency)" },
      { id: "gemini-1.5-flash", label: "gemini-1.5-flash", desc: "Reliable production standard" },
      { id: "gemini-2.0-flash", label: "gemini-2.0-flash", desc: "Next-gen ultra-fast flash" },
      { id: "gemini-1.5-pro", label: "gemini-1.5-pro", desc: "Deep analytical reasoning" },
    ],
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    icon: Cpu,
    color: "from-sky-500 to-blue-700",
  },
  {
    id: "groq",
    name: "Groq LPU",
    badge: "Ultra-Fast • Free Tier",
    keyUrl: "https://console.groq.com/keys",
    keyHelp: "Get a free API key at Groq Console",
    keyPrefixHint: "Starts with gsk_...",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      { id: "llama-3.3-70b-versatile", label: "llama-3.3-70b-versatile", desc: "Open weights, GPT-4 level (Recommended)" },
      { id: "llama-3.1-8b-instant", label: "llama-3.1-8b-instant", desc: "Instantaneous sub-second replies" },
    ],
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    icon: Flame,
    color: "from-orange-500 to-rose-700",
  },
  {
    id: "openai",
    name: "OpenAI",
    badge: "Industry Standard",
    keyUrl: "https://platform.openai.com/api-keys",
    keyHelp: "Get an API key from OpenAI Platform",
    keyPrefixHint: "Starts with sk-proj-...",
    defaultModel: "gpt-4o-mini",
    models: [
      { id: "gpt-4o-mini", label: "gpt-4o-mini", desc: "Fast, highly capable, economical (Recommended)" },
      { id: "gpt-4o", label: "gpt-4o", desc: "Flagship intelligence" },
    ],
    defaultBaseUrl: "https://api.openai.com/v1",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-700",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    badge: "Lowest Cost",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyHelp: "Get an API key from DeepSeek Platform",
    keyPrefixHint: "Starts with sk-...",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", label: "deepseek-chat (V3)", desc: "Ultra-cheap, fast general knowledge" },
      { id: "deepseek-reasoner", label: "deepseek-reasoner (R1)", desc: "Deep mathematical reasoning" },
    ],
    defaultBaseUrl: "https://api.deepseek.com",
    icon: Zap,
    color: "from-blue-500 to-indigo-700",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    badge: "Best Quality",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyHelp: "Get an API key from Anthropic Console",
    keyPrefixHint: "Starts with sk-ant-...",
    defaultModel: "claude-3-5-haiku-20241022",
    models: [
      { id: "claude-3-5-haiku-20241022", label: "claude-3-5-haiku", desc: "Fast & economical" },
      { id: "claude-3-5-sonnet-20241022", label: "claude-3-5-sonnet", desc: "Top reasoning & nuanced writing" },
    ],
    defaultBaseUrl: "https://api.anthropic.com",
    icon: Bot,
    color: "from-amber-500 to-orange-700",
  },
  {
    id: "custom",
    name: "Custom / Local",
    badge: "Ollama / Self-Hosted",
    keyUrl: "https://ollama.com",
    keyHelp: "Run Ollama locally on your computer",
    keyPrefixHint: "Optional token or bearer key",
    defaultModel: "llama3",
    models: [
      { id: "llama3", label: "llama3", desc: "Local Ollama model" },
      { id: "mistral", label: "mistral", desc: "Local Mistral model" },
    ],
    defaultBaseUrl: "http://localhost:11434/v1",
    icon: Plug,
    color: "from-purple-500 to-violet-800",
  },
];

export function AiStudySection({ admin }: { admin?: AdminDashboardState }) {
  const {
    config,
    setAiStudy,
    setAiStudyProviderSettings,
  } = useIntegrations();

  const [activeTab, setActiveTab] = useState<AiStudyTab>("api");
  const [selectedProviderId, setSelectedProviderId] = useState<AiStudyProvider>(
    config.aiStudy.provider || "gemini",
  );
  const [serverEnvStatus, setServerEnvStatus] = useState<Record<string, boolean>>({});
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);

  // Form drafts for selected provider
  const currentProviderConfig =
    config.aiStudy.providers?.[selectedProviderId] ||
    DEFAULT_PROVIDER_SETTINGS[selectedProviderId];

  const currentProviderMeta =
    PROVIDERS.find((p) => p.id === selectedProviderId) || PROVIDERS[0];

  const [apiKeyDraft, setApiKeyDraft] = useState(currentProviderConfig.apiKey || "");
  const [modelDraft, setModelDraft] = useState(
    currentProviderConfig.model || currentProviderMeta.defaultModel,
  );
  const [baseUrlDraft, setBaseUrlDraft] = useState(
    currentProviderConfig.baseUrl || currentProviderMeta.defaultBaseUrl,
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs?: number;
    message?: string;
  } | null>(null);

  // Live Test Sandbox Studio State
  const [studioMode, setStudioMode] = useState<"quiz" | "flashcards" | "notes" | "written" | "fillblanks">("quiz");
  const [studioPrompt, setStudioPrompt] = useState(
    `Newton's First Law states that an object at rest remains at rest, and an object in motion continues in motion with constant velocity unless acted upon by a net external force. This property to resist changes in motion is inertia.\nNewton's Second Law establishes F_net = m * a, where net force equals mass times acceleration.`,
  );
  const [studioTopic, setStudioTopic] = useState("Classical Mechanics & Newton's Laws");
  const [studioCount, setStudioCount] = useState(3);
  const [isStudioLoading, setIsStudioLoading] = useState(false);
  const [studioLatencyMs, setStudioLatencyMs] = useState<number | null>(null);
  const [studioOutput, setStudioOutput] = useState<StudioOutput | null>(null);

  // Study sets library state
  const [studySets, setStudySets] = useState<StudySet[]>(() => getStudySets());

  // Sync draft states when user switches selected provider
  useEffect(() => {
    const prov =
      config.aiStudy.providers?.[selectedProviderId] ||
      DEFAULT_PROVIDER_SETTINGS[selectedProviderId];
    const meta = PROVIDERS.find((p) => p.id === selectedProviderId);

    setApiKeyDraft(prov.apiKey || "");
    setModelDraft(prov.model || meta?.defaultModel || "");
    setBaseUrlDraft(prov.baseUrl || meta?.defaultBaseUrl || "");
    setTestResult(null);
  }, [selectedProviderId, config.aiStudy.providers]);

  // Load server env status on mount
  useEffect(() => {
    getAiStudyStatus().then(setServerEnvStatus).catch(() => setServerEnvStatus({}));
  }, []);

  // Listen to study set store changes
  useEffect(() => {
    return subscribeStudySets(() => setStudySets(getStudySets()));
  }, []);

  const activeProviderMeta =
    PROVIDERS.find((p) => p.id === config.aiStudy.provider) || PROVIDERS[0];

  const hasKeyForActive = Boolean(
    config.aiStudy.providers?.[config.aiStudy.provider]?.apiKey?.trim() ||
      config.aiStudy.apiKey?.trim() ||
      serverEnvStatus[config.aiStudy.provider],
  );

  const isLive = config.aiStudy.enabled && hasKeyForActive;

  // 1-Click: Test API Connection
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
        toast.success(`✓ Connection to ${currentProviderMeta.name} verified in ${res.latencyMs}ms!`);
      } else {
        toast.error(`Connection failed: ${res.message}`);
      }
    } catch (err: unknown) {
      setTestResult({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : "Failed to reach AI provider. Check your network or API key.",
      });
      toast.error("Connection failed.");
    } finally {
      setIsTesting(false);
    }
  };

  // 1-Click: Save and Activate
  const handleSaveAndActivate = async () => {
    const finalModel = modelDraft.trim() || currentProviderMeta.defaultModel;
    const finalBaseUrl = baseUrlDraft.trim() || currentProviderMeta.defaultBaseUrl;

    // 1. Save provider settings in client store
    setAiStudyProviderSettings(selectedProviderId, {
      apiKey: apiKeyDraft.trim(),
      model: finalModel,
      baseUrl: finalBaseUrl,
    });

    // 2. Set as active engine & ensure enabled
    setAiStudy({
      provider: selectedProviderId,
      enabled: true,
    });

    // 3. Persist to server-side admin API config
    try {
      const allProviders: Record<
        AiStudyProvider,
        ProviderConnectionSettings & { enabled?: boolean }
      > = {
        gemini: config.aiStudy.providers?.gemini || DEFAULT_PROVIDER_SETTINGS.gemini,
        openai: config.aiStudy.providers?.openai || DEFAULT_PROVIDER_SETTINGS.openai,
        anthropic: config.aiStudy.providers?.anthropic || DEFAULT_PROVIDER_SETTINGS.anthropic,
        deepseek: config.aiStudy.providers?.deepseek || DEFAULT_PROVIDER_SETTINGS.deepseek,
        groq: config.aiStudy.providers?.groq || DEFAULT_PROVIDER_SETTINGS.groq,
        custom: config.aiStudy.providers?.custom || DEFAULT_PROVIDER_SETTINGS.custom,
      };
      allProviders[selectedProviderId] = {
        apiKey: apiKeyDraft.trim(),
        model: finalModel,
        baseUrl: finalBaseUrl,
        enabled: true,
      };

      await saveAdminApiConfigFn({
        data: {
          activeProvider: selectedProviderId,
          aiEnabled: true,
          providers: allProviders,
        },
      });
    } catch (error: unknown) {
      console.error("Could not save server-side admin API configuration.", error);
      toast.error("Provider settings were updated locally, but could not be saved on the server.");
      return;
    }

    toast.success(`✓ ${currentProviderMeta.name} saved and activated as the live AI engine!`);
  };

  // Run Live AI Studio Generator
  const handleRunStudioTest = async () => {
    setIsStudioLoading(true);
    setStudioOutput(null);
    setStudioLatencyMs(null);

    const startTime = performance.now();
    const activeProvider = config.aiStudy.provider || "gemini";
    const settings = config.aiStudy.providers?.[activeProvider];
    const apiKey = settings?.apiKey?.trim() || config.aiStudy.apiKey?.trim();

    try {
      if (studioMode === "quiz") {
        const res = await generateStudyPack({
          data: {
            text: studioPrompt,
            questionCount: studioCount,
            provider: activeProvider,
            apiKey: apiKey || undefined,
            model: settings?.model || undefined,
            baseUrl: settings?.baseUrl || undefined,
            temperature: 0.2,
          },
        });
        const elapsed = Math.round(performance.now() - startTime);
        setStudioLatencyMs(elapsed);
        if (res.ok && res.data) {
          setStudioOutput({ type: "quiz", data: res.data });
          toast.success(`Generated ${res.data.questions.length} quiz questions in ${elapsed}ms!`);
        } else {
          toast.error(
            "reason" in res && res.reason ? res.reason : "Quiz generation failed.",
          );
        }
      } else if (studioMode === "flashcards") {
        const res = await generateMoreFlashcardsFn({
          data: {
            topic: studioTopic || "Core Concepts",
            count: studioCount,
            provider: activeProvider,
            apiKey: apiKey || undefined,
            model: settings?.model || undefined,
            baseUrl: settings?.baseUrl || undefined,
          },
        });
        const elapsed = Math.round(performance.now() - startTime);
        setStudioLatencyMs(elapsed);
        if (res?.data) {
          setStudioOutput({ type: "flashcards", data: res.data });
          toast.success(`Generated ${res.data.length} flashcards in ${elapsed}ms!`);
        }
      } else if (studioMode === "written") {
        const res = await generateMoreWrittenTestsFn({
          data: {
            topic: studioTopic || "Core Concepts",
            count: studioCount,
            provider: activeProvider,
            apiKey: apiKey || undefined,
            model: settings?.model || undefined,
            baseUrl: settings?.baseUrl || undefined,
          },
        });
        const elapsed = Math.round(performance.now() - startTime);
        setStudioLatencyMs(elapsed);
        if (res?.data) {
          setStudioOutput({ type: "written", data: res.data });
          toast.success(`Generated ${res.data.length} written test exercises in ${elapsed}ms!`);
        }
      } else if (studioMode === "fillblanks") {
        const res = await generateMoreFillBlanksFn({
          data: {
            topic: studioTopic || "Core Concepts",
            count: studioCount,
            provider: activeProvider,
            apiKey: apiKey || undefined,
            model: settings?.model || undefined,
            baseUrl: settings?.baseUrl || undefined,
          },
        });
        const elapsed = Math.round(performance.now() - startTime);
        setStudioLatencyMs(elapsed);
        if (res?.data) {
          setStudioOutput({ type: "fillblanks", data: res.data });
          toast.success(`Generated ${res.data.length} fill-in-the-blank items in ${elapsed}ms!`);
        }
      } else if (studioMode === "notes") {
        const res = await summarizeNotesFn({
          data: {
            text: studioPrompt,
            titleHint: studioTopic,
            subjectHint: "University Science",
            depth: "detailed",
            focus: "exam-focused",
            language: "en",
            provider: activeProvider,
            apiKey: apiKey || undefined,
            model: settings?.model || undefined,
            baseUrl: settings?.baseUrl || undefined,
          },
        });
        const elapsed = Math.round(performance.now() - startTime);
        setStudioLatencyMs(elapsed);
        if (res?.data) {
          setStudioOutput({ type: "notes", data: res.data });
          toast.success(`Generated detailed academic notes in ${elapsed}ms!`);
        }
      }
    } catch (err: unknown) {
      console.error("Studio generation error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Generation error. Check your provider credentials.",
      );
    } finally {
      setIsStudioLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Top Visual Status Banner ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-navy text-brand-gold shadow-xs dark:bg-blue-600 dark:text-white">
              <Sparkles className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-brand-navy dark:text-white">
                  AI Study & Curriculum Engine
                </h2>
                {isLive ? (
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 gap-1.5 font-medium text-xs">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Engine: {activeProviderMeta.name}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800 gap-1.5 font-medium text-xs">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Offline / Demo Fallback Mode
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Powers real-time question generation, spaced repetition, rubrics, and the AI Tutor on{" "}
                <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-brand-navy dark:text-blue-300 font-semibold">
                  /ai-study
                </code>
                . Manage credentials, course study sets, and pedagogical styles below.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBenchmarkOpen(true)}
              className="rounded-xl border-slate-200 dark:border-slate-700 gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Zap className="size-3.5 text-amber-500" />
              Benchmark All Engines
            </Button>

            <a
              href="/ai-study"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300"
            >
              Open /ai-study
              <ExternalLink className="size-3.5 text-blue-500" />
            </a>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5">
              <Label htmlFor="master-ai" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                AI Enabled
              </Label>
              <Switch
                id="master-ai"
                checked={config.aiStudy.enabled}
                onCheckedChange={(enabled) => {
                  setAiStudy({ enabled });
                  toast.success(enabled ? "AI Engine Enabled" : "Switched to Offline Fallback");
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (value === "api" || value === "curriculum" || value === "tutor" || value === "test") {
            setActiveTab(value);
          }
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-11 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 p-1">
          <TabsTrigger value="api" className="rounded-xl gap-2 text-xs font-semibold">
            <Key className="size-3.5 text-brand-gold" />
            1. AI Engines & Keys
          </TabsTrigger>
          <TabsTrigger value="curriculum" className="rounded-xl gap-2 text-xs font-semibold">
            <BookOpen className="size-3.5 text-blue-600 dark:text-blue-400" />
            2. Study Sets Manager ({studySets.length})
          </TabsTrigger>
          <TabsTrigger value="tutor" className="rounded-xl gap-2 text-xs font-semibold">
            <Bot className="size-3.5 text-purple-600 dark:text-purple-400" />
            3. AI Tutor Controls
          </TabsTrigger>
          <TabsTrigger value="test" className="rounded-xl gap-2 text-xs font-semibold">
            <Play className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            4. Live Test Sandbox
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1: AI PROVIDERS & CREDENTIALS
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="api" className="space-y-6 mt-4 animate-in fade-in duration-200">
          {/* Step 1: Provider Selection Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Step 1: Select AI Model Provider
              </Label>
              <span className="text-xs text-slate-400">
                Active Engine: <strong className="text-slate-800 dark:text-slate-200">{activeProviderMeta.name}</strong>
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {PROVIDERS.map((provider) => {
                const isSelected = selectedProviderId === provider.id;
                const isActiveEngine = config.aiStudy.provider === provider.id;
                const hasKey = Boolean(
                  config.aiStudy.providers?.[provider.id]?.apiKey?.trim() ||
                    (isActiveEngine && config.aiStudy.apiKey?.trim()) ||
                    serverEnvStatus[provider.id],
                );
                const Icon = provider.icon;

                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProviderId(provider.id)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border-2 p-3.5 text-left transition cursor-pointer",
                      isSelected
                        ? "border-brand-navy bg-white shadow-md ring-2 ring-brand-navy/10 dark:border-blue-500 dark:bg-slate-900"
                        : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-xs",
                          provider.color,
                        )}
                      >
                        <Icon className="size-4.5" />
                      </div>
                      <div>
                        <p className="font-serif text-sm font-bold text-brand-navy dark:text-white leading-tight">
                          {provider.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {provider.badge}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isActiveEngine && (
                        <span className="flex items-center gap-1 rounded-full bg-brand-navy dark:bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white">
                          <Check className="size-2.5" /> Active
                        </span>
                      )}
                      {hasKey ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● Ready</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">No Key</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 & 3: Selected Provider Configuration Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden dark:bg-slate-900">
            <div className={cn("h-1.5 w-full bg-gradient-to-r", currentProviderMeta.color)} />
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-serif text-lg text-brand-navy dark:text-white flex items-center gap-2">
                    <currentProviderMeta.icon className="size-5 text-brand-gold" />
                    Configure {currentProviderMeta.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure your API key and model parameters. Keys are resolved securely and never exposed in browser console logs.
                  </CardDescription>
                </div>

                <a
                  href={currentProviderMeta.keyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shrink-0 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-900"
                >
                  {currentProviderMeta.keyHelp}
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* API Key Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="key-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    API Key ({currentProviderMeta.keyPrefixHint})
                  </Label>
                  {serverEnvStatus[selectedProviderId] && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      ✓ Detected in server .env environment
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Input
                    id="key-input"
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyDraft}
                    onChange={(e) => setApiKeyDraft(e.target.value)}
                    placeholder={`Paste ${currentProviderMeta.name} API Key here...`}
                    className="pr-20 font-mono text-xs bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 rounded-xl"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title={showApiKey ? "Hide key" : "Show key"}
                    >
                      {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                    {apiKeyDraft && (
                      <button
                        type="button"
                        onClick={() => setApiKeyDraft("")}
                        className="rounded p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                        title="Clear"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Model Selection */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recommended Model</Label>
                  <Select value={modelDraft} onValueChange={setModelDraft}>
                    <SelectTrigger className="text-xs bg-slate-50/50 dark:bg-slate-800/60 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProviderMeta.models.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                          <span className="font-mono font-medium">{m.label}</span>
                          <span className="text-[10px] text-muted-foreground ml-1.5">({m.desc})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Custom Model Override</Label>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {showAdvanced ? "Hide advanced" : "Advanced URL"}
                    </button>
                  </div>
                  <Input
                    value={modelDraft}
                    onChange={(e) => setModelDraft(e.target.value)}
                    placeholder={currentProviderMeta.defaultModel}
                    className="font-mono text-xs bg-slate-50/50 dark:bg-slate-800/60 rounded-xl"
                  />
                </div>
              </div>

              {/* Optional Advanced Base URL */}
              {showAdvanced && (
                <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <Label htmlFor="base-url-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Endpoint Base URL (Optional / Proxies / Self-Hosted)
                  </Label>
                  <Input
                    id="base-url-input"
                    value={baseUrlDraft}
                    onChange={(e) => setBaseUrlDraft(e.target.value)}
                    placeholder={currentProviderMeta.defaultBaseUrl}
                    className="font-mono text-xs bg-white dark:bg-slate-900 rounded-xl"
                  />
                </div>
              )}

              {/* Test Results Banner */}
              {testResult && (
                <div
                  className={cn(
                    "flex items-start gap-2.5 rounded-2xl p-4 text-xs",
                    testResult.ok
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900"
                      : "bg-red-50 text-red-900 border border-red-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900",
                  )}
                >
                  {testResult.ok ? (
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="size-5 text-red-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">
                      {testResult.ok ? `✓ Connection to ${currentProviderMeta.name} Successful!` : "✕ Connection Test Failed"}
                    </p>
                    <p className="mt-0.5 opacity-90">{testResult.message}</p>
                    {testResult.latencyMs !== undefined && (
                      <p className="mt-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                        Response Latency: {testResult.latencyMs}ms
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons: Test Connection & Save & Activate */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="gap-2 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700 hover:border-brand-navy hover:text-brand-navy bg-white dark:bg-slate-900 cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Testing API…
                    </>
                  ) : (
                    <>
                      <Zap className="size-3.5 text-brand-gold" />
                      Test Connection
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveAndActivate}
                  className="gap-2 bg-brand-navy dark:bg-blue-600 text-white hover:bg-brand-navy/90 dark:hover:bg-blue-700 text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  <Check className="size-3.5" />
                  Save & Set as Live Engine
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: STUDY SETS & CURRICULUM MANAGEMENT
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="curriculum" className="space-y-4 mt-4 animate-in fade-in duration-200">
          <StudySetsManager />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: AI TUTOR & PEDAGOGICAL CONTROLS
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="tutor" className="space-y-4 mt-4 animate-in fade-in duration-200">
          <AiTutorSettings />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 4: LIVE AI TEST SANDBOX & GENERATION STUDIO
        ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="test" className="space-y-6 mt-4 animate-in fade-in duration-200">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-serif text-lg text-brand-navy dark:text-white flex items-center gap-2">
                    <Play className="size-5 text-emerald-600 dark:text-emerald-400" />
                    Live AI Generation Studio
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Test generating academic material with your live active provider (
                    <strong className="text-slate-800 dark:text-slate-200">{activeProviderMeta.name}</strong> · model: <code className="font-mono text-[11px]">{currentProviderConfig.model || activeProviderMeta.defaultModel}</code>).
                  </CardDescription>
                </div>

                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold text-xs">
                  Active Provider Live
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Mode Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Study Mode to Test
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudioMode("quiz")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer",
                      studioMode === "quiz"
                        ? "border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    <Activity className="size-3.5" />
                    Diagnostic MCQs
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudioMode("flashcards")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer",
                      studioMode === "flashcards"
                        ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    <Layers className="size-3.5" />
                    Flashcards
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudioMode("written")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer",
                      studioMode === "written"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    <Pencil className="size-3.5" />
                    Written & Rubric
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudioMode("fillblanks")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer",
                      studioMode === "fillblanks"
                        ? "border-cyan-500 bg-cyan-50 text-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    <SpellCheck className="size-3.5" />
                    Fill in Blanks
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudioMode("notes")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer",
                      studioMode === "notes"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    <BookOpen className="size-3.5" />
                    Summary Notes
                  </button>
                </div>
              </div>

              {/* Input Parameters */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Topic Title</Label>
                  <Input
                    value={studioTopic}
                    onChange={(e) => setStudioTopic(e.target.value)}
                    placeholder="e.g., Computer Networking, AVL Trees, Thermodynamics"
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Item Count</Label>
                  <Select value={String(studioCount)} onValueChange={(v) => setStudioCount(Number(v))}>
                    <SelectTrigger className="text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 items (Fast test)</SelectItem>
                      <SelectItem value="3">3 items (Standard)</SelectItem>
                      <SelectItem value="5">5 items (Comprehensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Source Document Context */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Source Document Context / Excerpt
                </Label>
                <Textarea
                  rows={4}
                  value={studioPrompt}
                  onChange={(e) => setStudioPrompt(e.target.value)}
                  placeholder="Paste lecture notes or textbook excerpt here..."
                  className="text-xs leading-relaxed font-sans rounded-2xl resize-y"
                />
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">
                  Target Engine: <strong>{activeProviderMeta.name}</strong>
                </span>

                <Button
                  type="button"
                  disabled={isStudioLoading}
                  onClick={handleRunStudioTest}
                  className="gap-2 bg-brand-navy dark:bg-blue-600 text-white hover:bg-brand-navy/90 dark:hover:bg-blue-700 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {isStudioLoading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Calling {activeProviderMeta.name}…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5 text-brand-gold" />
                      Run Live Generation Test
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Studio Results */}
              {studioOutput && (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/20 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20 space-y-4 animate-in fade-in duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                        Live Response Received from {activeProviderMeta.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {studioLatencyMs !== null && (
                        <Badge variant="outline" className="text-[11px] font-mono border-emerald-300 text-emerald-800 dark:text-emerald-300">
                          Latency: {studioLatencyMs}ms
                        </Badge>
                      )}
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        Validated Schema
                      </Badge>
                    </div>
                  </div>

                  {/* Render based on mode */}
                  {studioOutput.type === "quiz" && (
                    <div className="space-y-3">
                      {studioOutput.data.questions?.map((q, i) => (
                        <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                          <p className="text-xs font-bold text-brand-navy dark:text-white">
                            {i + 1}. {q.question}
                          </p>
                          <div className="grid gap-1 sm:grid-cols-2">
                            {q.options?.map((opt: string, optIdx: number) => (
                              <div
                                key={optIdx}
                                className={cn(
                                  "rounded-xl p-2 text-xs border",
                                  optIdx === q.correctIndex
                                    ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 font-semibold"
                                    : "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
                                )}
                              >
                                <span className="font-mono mr-1 text-slate-400">
                                  {["A", "B", "C", "D"][optIdx]})
                                </span>
                                {opt}
                                {optIdx === q.correctIndex && " ✓ Correct"}
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {studioOutput.type === "flashcards" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {studioOutput.data.map((c, i) => (
                        <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                          <Badge variant="outline" className="text-[10px]">{c.topic || "Card #" + (i + 1)}</Badge>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Front: {c.front}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2">
                            Back: {c.back}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {studioOutput.type === "written" && (
                    <div className="space-y-3">
                      {studioOutput.data.map((w, i) => (
                        <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Prompt: {w.prompt}</p>
                          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-700 dark:text-slate-300">
                            <strong>Model Answer:</strong> {w.modelAnswer}
                          </div>
                          {w.keyRubricPoints && (
                            <div className="text-[11px] text-slate-500 space-y-1">
                              <strong>Rubric Points:</strong>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {w.keyRubricPoints.map((r: string, idx: number) => (
                                  <li key={idx}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {studioOutput.type === "fillblanks" && (
                    <div className="space-y-3">
                      {studioOutput.data.map((b, i) => (
                        <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 space-y-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{b.sentenceWithBlank}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-emerald-600">Answer: {b.blankAnswer}</span>
                            {b.hint && <span className="text-slate-400">· Hint: {b.hint}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {studioOutput.type === "notes" && (
                    <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {studioOutput.data.title || "Academic Lecture Monograph"}
                        </p>
                        <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                          {studioOutput.data.summary}
                        </p>
                      </div>

                      {/* Key Concepts with Worked Examples */}
                      {studioOutput.data.keyConcepts && studioOutput.data.keyConcepts.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <p className="font-bold text-xs uppercase tracking-wider text-purple-700 dark:text-purple-400">
                            Key Concepts & Worked Examination Problems ({studioOutput.data.keyConcepts.length})
                          </p>
                          <div className="space-y-2.5">
                            {studioOutput.data.keyConcepts.map((kc, i) => (
                              <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white text-xs">{kc.unit ? `${kc.unit}: ` : ""}{kc.concept}</span>
                                </div>
                                {kc.definition && (
                                  <p className="text-slate-600 dark:text-slate-300 italic"><strong className="text-slate-700 dark:text-slate-200 not-italic">Definition:</strong> {kc.definition}</p>
                                )}
                                <p className="text-slate-600 dark:text-slate-300">{kc.explanation}</p>
                                {kc.workedExample && (
                                  <div className="rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/80 dark:bg-purple-950/30 p-2.5 space-y-1 text-[11px]">
                                    <p className="font-semibold text-purple-900 dark:text-purple-300">💡 Worked Examination Problem & Solution:</p>
                                    <p className="text-purple-800 dark:text-purple-200"><strong>Scenario:</strong> {typeof kc.workedExample === "object" ? kc.workedExample.problemStatement : kc.workedExample}</p>
                                    {typeof kc.workedExample === "object" && kc.workedExample.stepByStepSolution && (
                                      <pre className="whitespace-pre-wrap font-sans text-purple-900 dark:text-purple-200 pt-1 text-[11px] leading-relaxed">
                                        {kc.workedExample.stepByStepSolution}
                                      </pre>
                                    )}
                                    {typeof kc.workedExample === "object" && kc.workedExample.keyTakeaway && (
                                      <p className="text-purple-950 dark:text-purple-100 font-medium pt-1">🔑 <strong>Takeaway:</strong> {kc.workedExample.keyTakeaway}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Formulas & Calculation Examples */}
                      {studioOutput.data.formulasAndRules && studioOutput.data.formulasAndRules.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <p className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Formulas & Worked Calculation Examples ({studioOutput.data.formulasAndRules.length})
                          </p>
                          <div className="space-y-2">
                            {studioOutput.data.formulasAndRules.map((f, i) => (
                              <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-amber-50/40 dark:bg-amber-950/20 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900 dark:text-white text-xs">{f.title}</span>
                                  <code className="text-amber-800 dark:text-amber-300 font-mono text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded">{f.formula}</code>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300">{f.explanation}</p>
                                {f.workedCalculationExample && (
                                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/40 p-2 text-[11px] space-y-1">
                                    <p className="font-semibold text-amber-900 dark:text-amber-200">🧮 Numerical Calculation Example:</p>
                                    {typeof f.workedCalculationExample === "object" ? (
                                      <>
                                        <p className="text-amber-900 dark:text-amber-300"><strong>Given:</strong> {f.workedCalculationExample.given}</p>
                                        <p className="text-amber-900 dark:text-amber-300"><strong>Substitutions:</strong> {f.workedCalculationExample.substitutions}</p>
                                        <p className="font-bold text-amber-950 dark:text-amber-100"><strong>Result:</strong> {f.workedCalculationExample.result}</p>
                                      </>
                                    ) : (
                                      <p className="text-amber-900 dark:text-amber-200">{f.workedCalculationExample}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clarifying Examples & Examiner Traps */}
                      {studioOutput.data.clarifyingExamples && studioOutput.data.clarifyingExamples.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <p className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            Worked Examination Scenarios & Examiner Traps ({studioOutput.data.clarifyingExamples.length})
                          </p>
                          <div className="space-y-2">
                            {studioOutput.data.clarifyingExamples.map((ex, i) => (
                              <div key={i} className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-1.5 text-xs">
                                <p className="font-bold text-emerald-900 dark:text-emerald-200">{ex.title}</p>
                                <p className="text-slate-700 dark:text-slate-300"><strong>Scenario:</strong> {ex.scenario}</p>
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap"><strong>Analysis:</strong> {ex.analysis}</p>
                                {ex.examinerTrap && (
                                  <div className="rounded p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 text-[11px]">
                                    ⚠️ <strong>Examiner Trap:</strong> {ex.examinerTrap}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Multi-Provider Benchmark Dialog ── */}
      <AiBenchmarkDialog open={isBenchmarkOpen} onOpenChange={setIsBenchmarkOpen} />
    </div>
  );
}
