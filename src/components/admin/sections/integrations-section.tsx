import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Key,
  Loader2,
  Megaphone,
  Plug,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";

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
import { Textarea } from "@/components/ui/textarea";
import { useIntegrations } from "@/hooks/use-integrations";
import { getAiStudyStatus, testAiConnection } from "@/lib/api/ai-study.functions";
import { saveAdminApiConfigFn, getAdminApiStatusFn } from "@/lib/api/admin-api-config.functions";
import {
  DEFAULT_PROVIDER_SETTINGS,
  type AiStudyProvider,
} from "@/lib/integrations-store";
import { cn } from "@/lib/utils";

type AiStatus = Record<AiStudyProvider, boolean>;

interface ProviderMeta {
  id: AiStudyProvider;
  name: string;
  badge: string;
  icon: typeof Bot;
  gradient: string;
  accent: string;
  keyUrl: string;
  keyHelp: string;
  keyPrefixHint: string;
  defaultModel: string;
  models: { id: string; label: string; desc: string; tier?: "fast" | "smart" | "powerful" }[];
  defaultBaseUrl: string;
  blurb: string;
  freeQuota: string;
}

const AI_PROVIDERS: ProviderMeta[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Free Tier • Recommended",
    icon: Cpu,
    gradient: "from-sky-500 via-blue-500 to-indigo-600",
    accent: "sky",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyHelp: "Get free API key at Google AI Studio",
    keyPrefixHint: "Starts with AIzaSy... or AQ.Ab...",
    defaultModel: "gemini-flash-lite-latest",
    models: [
      { id: "gemini-flash-lite-latest", label: "Gemini Flash Lite (Latest)", desc: "Ultra-fast, high limits (<2s latency)", tier: "fast" },
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite", desc: "Next-gen lightning speed", tier: "fast" },
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", desc: "Balanced academic quality & speed", tier: "smart" },
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", desc: "High-reasoning study intelligence", tier: "powerful" },
      { id: "gemini-flash-latest", label: "Gemini Flash Latest", desc: "General production flash tier", tier: "smart" },
    ],
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    blurb: "100% free generous quota. Best for production use with zero cost.",
    freeQuota: "1500 req/day free",
  },
  {
    id: "groq",
    name: "Groq LPU",
    badge: "500 tok/s • Free",
    icon: Flame,
    gradient: "from-orange-500 via-rose-500 to-pink-600",
    accent: "orange",
    keyUrl: "https://console.groq.com/keys",
    keyHelp: "Get free API key at Groq Console",
    keyPrefixHint: "Starts with gsk_...",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", desc: "GPT-4 level quality", tier: "powerful" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", desc: "Sub-second response", tier: "fast" },
    ],
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    blurb: "World's fastest inference hardware. 500+ tokens/sec with Llama models.",
    freeQuota: "14,400 req/day free",
  },
  {
    id: "openai",
    name: "OpenAI GPT",
    badge: "Industry Standard",
    icon: Sparkles,
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    accent: "emerald",
    keyUrl: "https://platform.openai.com/api-keys",
    keyHelp: "Create API key at OpenAI Platform",
    keyPrefixHint: "Starts with sk-proj-...",
    defaultModel: "gpt-4o-mini",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o Mini", desc: "Fast, capable, economical", tier: "smart" },
      { id: "gpt-4o", label: "GPT-4o", desc: "Flagship intelligence", tier: "powerful" },
    ],
    defaultBaseUrl: "https://api.openai.com/v1",
    blurb: "The industry gold standard. Reliable, extensively tested models.",
    freeQuota: "Pay-as-you-go",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    badge: "Lowest Cost",
    icon: Zap,
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
    accent: "blue",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyHelp: "Create API key at DeepSeek Platform",
    keyPrefixHint: "Starts with sk-...",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", label: "DeepSeek V3 Chat", desc: "Ultra-cheap, fast", tier: "fast" },
      { id: "deepseek-reasoner", label: "DeepSeek R1 Reasoner", desc: "Advanced math & logic", tier: "powerful" },
    ],
    defaultBaseUrl: "https://api.deepseek.com",
    blurb: "Cheapest frontier model. V3 Chat & R1 Reasoner at a fraction of GPT cost.",
    freeQuota: "~$0.27/M tokens",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    badge: "Best Quality",
    icon: Bot,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    accent: "amber",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyHelp: "Create API key at Anthropic Console",
    keyPrefixHint: "Starts with sk-ant-...",
    defaultModel: "claude-3-5-haiku-20241022",
    models: [
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", desc: "Fast & economical", tier: "fast" },
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", desc: "Best academic depth", tier: "powerful" },
    ],
    defaultBaseUrl: "https://api.anthropic.com",
    blurb: "Exceptional academic quality. Nuanced reasoning and structured outputs.",
    freeQuota: "Pay-as-you-go",
  },
  {
    id: "custom",
    name: "Custom / Ollama",
    badge: "Self-Hosted",
    icon: Plug,
    gradient: "from-purple-500 via-violet-500 to-fuchsia-600",
    accent: "purple",
    keyUrl: "https://ollama.com",
    keyHelp: "Set up Ollama or any OpenAI-compatible gateway",
    keyPrefixHint: "Optional bearer token",
    defaultModel: "llama3",
    models: [
      { id: "llama3", label: "llama3", desc: "Local Ollama model", tier: "smart" },
      { id: "mistral", label: "mistral", desc: "Local Mistral model", tier: "smart" },
    ],
    defaultBaseUrl: "http://localhost:11434/v1",
    blurb: "Any OpenAI-compatible endpoint: Ollama, vLLM, LiteLLM, or LM Studio.",
    freeQuota: "100% offline",
  },
];

const TIER_COLORS = {
  fast: "bg-sky-100 text-sky-700 border-sky-200",
  smart: "bg-emerald-100 text-emerald-700 border-emerald-200",
  powerful: "bg-purple-100 text-purple-700 border-purple-200",
};

type ServerStatus = {
  activeProvider: string;
  aiEnabled: boolean;
  updatedAt?: string;
  providerStatus?: Record<string, { hasKey: boolean; model: string; baseUrl?: string; enabled?: boolean; keyPreview: string }>;
};

export function IntegrationsSection({ admin }: { admin?: AdminDashboardState } = {}) {
  const {
    config,
    setAdsense,
    setAiStudy,
    setAiStudyProviderSettings,
    addCustomKey,
    updateCustomKey,
    removeCustomKey,
  } = useIntegrations();

  // Local draft state for each provider
  const [selectedProvider, setSelectedProvider] = useState<AiStudyProvider>(config.aiStudy.provider);
  const [aiEnabled, setAiEnabledState] = useState(config.aiStudy.enabled);
  const [apiKeyDrafts, setApiKeyDrafts] = useState<Record<AiStudyProvider, string>>(() => {
    const drafts: Record<string, string> = {};
    for (const p of AI_PROVIDERS) {
      drafts[p.id] = config.aiStudy.providers?.[p.id]?.apiKey || (p.id === config.aiStudy.provider ? config.aiStudy.apiKey || "" : DEFAULT_PROVIDER_SETTINGS[p.id]?.apiKey || "");
    }
    return drafts as Record<AiStudyProvider, string>;
  });
  const [modelDrafts, setModelDrafts] = useState<Record<AiStudyProvider, string>>(() => {
    const drafts: Record<string, string> = {};
    for (const p of AI_PROVIDERS) {
      drafts[p.id] = config.aiStudy.providers?.[p.id]?.model || p.defaultModel;
    }
    return drafts as Record<AiStudyProvider, string>;
  });
  const [baseUrlDrafts, setBaseUrlDrafts] = useState<Record<AiStudyProvider, string>>(() => {
    const drafts: Record<string, string> = {};
    for (const p of AI_PROVIDERS) {
      drafts[p.id] = config.aiStudy.providers?.[p.id]?.baseUrl || p.defaultBaseUrl;
    }
    return drafts as Record<AiStudyProvider, string>;
  });

  const [showKey, setShowKey] = useState<Record<AiStudyProvider, boolean>>({
    gemini: false, groq: false, openai: false, deepseek: false, anthropic: false, custom: false,
  });

  // Connection test state
  const [testingProvider, setTestingProvider] = useState<AiStudyProvider | null>(null);
  const [testResults, setTestResults] = useState<Record<AiStudyProvider, { ok: boolean; latencyMs?: number; message?: string } | null>>({
    gemini: null, groq: null, openai: null, deepseek: null, anthropic: null, custom: null,
  });

  // AI status from server (env-based)
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);

  // Server-side persisted status
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // AdSense
  const [publisherIdDraft, setPublisherIdDraft] = useState(config.googleAdsense.publisherId);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");

  const selectedMeta = AI_PROVIDERS.find((p) => p.id === selectedProvider) || AI_PROVIDERS[0];

  // Load server-side status on mount
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAiStudyStatus().catch(() => null),
      getAdminApiStatusFn().catch(() => null),
    ]).then(([status, serverCfg]) => {
      if (cancelled) return;
      if (status) setAiStatus(status as AiStatus);
      if (serverCfg) {
        setServerStatus(serverCfg as ServerStatus);
        // Sync selected provider to server's active provider
        if ((serverCfg as ServerStatus).activeProvider) {
          setSelectedProvider((serverCfg as ServerStatus).activeProvider as AiStudyProvider);
        }
      }
      setLoadingStatus(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Compute which providers have a key configured (admin or env)
  const providerHasKey = (id: AiStudyProvider): boolean => {
    const adminHas = Boolean(serverStatus?.providerStatus?.[id]?.hasKey);
    const localHas = Boolean(apiKeyDrafts[id]);
    const envHas = Boolean(aiStatus?.[id]);
    return adminHas || localHas || envHas;
  };

  async function handleTestConnection(providerId: AiStudyProvider) {
    setTestingProvider(providerId);
    const key = apiKeyDrafts[providerId];
    const model = modelDrafts[providerId];
    const baseUrl = baseUrlDrafts[providerId];

    try {
      const res = await testAiConnection({
        data: {
          provider: providerId,
          apiKey: key.trim() || undefined,
          model: model.trim() || undefined,
          baseUrl: baseUrl.trim() || undefined,
        },
      });
      setTestResults((prev) => ({ ...prev, [providerId]: res }));
      if (res.ok) {
        toast.success(`✅ ${AI_PROVIDERS.find((p) => p.id === providerId)?.name} connected in ${res.latencyMs}ms!`);
      } else {
        toast.error(`❌ ${res.message}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setTestResults((prev) => ({ ...prev, [providerId]: { ok: false, latencyMs: 0, message: msg } }));
      toast.error(`Connection failed: ${msg}`);
    } finally {
      setTestingProvider(null);
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      // 1. Persist to server
      await saveAdminApiConfigFn({
        data: {
          activeProvider: selectedProvider,
          aiEnabled,
          providers: {
            gemini: { apiKey: apiKeyDrafts.gemini, model: modelDrafts.gemini, baseUrl: baseUrlDrafts.gemini, enabled: selectedProvider === "gemini" },
            openai: { apiKey: apiKeyDrafts.openai, model: modelDrafts.openai, baseUrl: baseUrlDrafts.openai, enabled: selectedProvider === "openai" },
            anthropic: { apiKey: apiKeyDrafts.anthropic, model: modelDrafts.anthropic, baseUrl: baseUrlDrafts.anthropic, enabled: selectedProvider === "anthropic" },
            deepseek: { apiKey: apiKeyDrafts.deepseek, model: modelDrafts.deepseek, baseUrl: baseUrlDrafts.deepseek, enabled: selectedProvider === "deepseek" },
            groq: { apiKey: apiKeyDrafts.groq, model: modelDrafts.groq, baseUrl: baseUrlDrafts.groq, enabled: selectedProvider === "groq" },
            custom: { apiKey: apiKeyDrafts.custom, model: modelDrafts.custom, baseUrl: baseUrlDrafts.custom, enabled: selectedProvider === "custom" },
          },
        },
      });

      // 2. Sync to client-side integrations store
      for (const p of AI_PROVIDERS) {
        setAiStudyProviderSettings(p.id, {
          apiKey: apiKeyDrafts[p.id],
          model: modelDrafts[p.id],
          baseUrl: baseUrlDrafts[p.id],
        });
      }
      setAiStudy({ provider: selectedProvider, enabled: aiEnabled });

      // 3. Refresh server status
      const updated = await getAdminApiStatusFn().catch(() => null);
      if (updated) setServerStatus(updated as ServerStatus);

      toast.success("🎉 API configuration saved to server successfully!");
    } catch (err) {
      toast.error(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProvider(providerId: AiStudyProvider) {
    setSaving(true);
    try {
      const existing = serverStatus ? { ...serverStatus } : { activeProvider: selectedProvider, aiEnabled, providerStatus: {} };
      await saveAdminApiConfigFn({
        data: {
          activeProvider: selectedProvider,
          aiEnabled,
          providers: {
            gemini: { apiKey: apiKeyDrafts.gemini, model: modelDrafts.gemini, baseUrl: baseUrlDrafts.gemini, enabled: providerId === "gemini" ? true : selectedProvider === "gemini" },
            openai: { apiKey: apiKeyDrafts.openai, model: modelDrafts.openai, baseUrl: baseUrlDrafts.openai, enabled: providerId === "openai" ? true : selectedProvider === "openai" },
            anthropic: { apiKey: apiKeyDrafts.anthropic, model: modelDrafts.anthropic, baseUrl: baseUrlDrafts.anthropic, enabled: providerId === "anthropic" ? true : selectedProvider === "anthropic" },
            deepseek: { apiKey: apiKeyDrafts.deepseek, model: modelDrafts.deepseek, baseUrl: baseUrlDrafts.deepseek, enabled: providerId === "deepseek" ? true : selectedProvider === "deepseek" },
            groq: { apiKey: apiKeyDrafts.groq, model: modelDrafts.groq, baseUrl: baseUrlDrafts.groq, enabled: providerId === "groq" ? true : selectedProvider === "groq" },
            custom: { apiKey: apiKeyDrafts.custom, model: modelDrafts.custom, baseUrl: baseUrlDrafts.custom, enabled: providerId === "custom" ? true : selectedProvider === "custom" },
          },
        },
      });

      // Sync local store
      setAiStudyProviderSettings(providerId, {
        apiKey: apiKeyDrafts[providerId],
        model: modelDrafts[providerId],
        baseUrl: baseUrlDrafts[providerId],
      });
      setAiStudy({ provider: selectedProvider, enabled: aiEnabled });

      // Refresh
      const updated = await getAdminApiStatusFn().catch(() => null);
      if (updated) setServerStatus(updated as ServerStatus);

      toast.success(`✅ ${selectedMeta.name} saved to server!`);
    } catch (err) {
      toast.error(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  function savePublisherId() {
    const result = setAdsense({ publisherId: publisherIdDraft.trim() });
    if (!result.ok) { toast.error(result.error); return; }
    toast.success("AdSense publisher ID saved");
  }

  function handleAddKey() {
    if (!newKeyLabel.trim()) { toast.error("Give the key a label first"); return; }
    const result = addCustomKey(newKeyLabel, newKeyValue);
    if (!result.ok) { toast.error(result.error); return; }
    setNewKeyLabel(""); setNewKeyValue("");
    toast.success("Key added");
  }

  const activeProviderMeta = AI_PROVIDERS.find((p) => p.id === selectedProvider) || AI_PROVIDERS[0];

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── HEADER HERO CARD ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-navy p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15)_0%,_transparent_60%)]" />
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gold/20 backdrop-blur">
                <Sparkles className="size-5 text-brand-gold" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">AI API Integration Console</h2>
            </div>
            <p className="text-sm text-slate-300 max-w-xl">
              Connect Google Gemini, Groq, OpenAI, DeepSeek, Claude, or a local Ollama instance. Keys are saved server-side and used automatically for all AI generation.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", aiEnabled ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-700 text-slate-400 border border-slate-600")}>
                <span className={cn("size-1.5 rounded-full", aiEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500")} />
                {aiEnabled ? "AI Engine Active" : "Offline Mode"}
              </div>
              {serverStatus && (
                <div className="flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-700/50 px-2.5 py-1 text-xs text-slate-300">
                  <Activity className="size-3" />
                  Active: <span className="font-semibold text-white">{activeProviderMeta.name}</span>
                </div>
              )}
              {serverStatus?.updatedAt && (
                <span className="text-xs text-slate-500">
                  Last saved: {new Date(serverStatus.updatedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">AI Engine</span>
              <Switch
                checked={aiEnabled}
                onCheckedChange={(val) => {
                  setAiEnabledState(val);
                  setAiStudy({ enabled: val });
                  toast.success(val ? "AI Engine activated" : "Switched to offline curriculum engine");
                }}
              />
            </div>
            {admin && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => admin.setSection("aiStudy")}
                className="gap-1.5 text-xs border-white/20 text-white bg-white/10 hover:bg-white/20"
              >
                AI Console
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── PROVIDER GRID ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-brand-navy">
            <Key className="size-4 text-brand-gold" />
            AI Provider Configuration
          </CardTitle>
          <CardDescription>
            Select a provider, enter your API key, test the connection, and save to server. The active provider is used for all study generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Provider Selection Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {AI_PROVIDERS.map((provider) => {
              const isSelected = selectedProvider === provider.id;
              const hasKey = providerHasKey(provider.id);
              const Icon = provider.icon;
              const serverKey = serverStatus?.providerStatus?.[provider.id];
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setTestResults((prev) => ({ ...prev, [provider.id]: null }));
                  }}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all duration-200",
                    isSelected
                      ? "border-brand-navy bg-brand-navy/[0.04] shadow-md"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm",
                  )}
                >
                  {/* Active checkmark */}
                  {isSelected && (
                    <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-brand-navy text-white">
                      <Check className="size-3 stroke-[3]" />
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <div className={cn("flex size-8 items-center justify-center rounded-lg text-white bg-gradient-to-br shadow-sm", provider.gradient)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-brand-navy leading-tight truncate">{provider.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{provider.badge}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[9px] px-1.5 py-0 h-4 font-semibold",
                        hasKey
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}
                    >
                      {hasKey ? (
                        <><CheckCircle2 className="size-2.5 mr-0.5" /> Configured</>
                      ) : "No Key"}
                    </Badge>
                    {serverKey?.keyPreview && (
                      <span className="font-mono text-[9px] text-slate-400">{serverKey.keyPreview}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── SELECTED PROVIDER DETAIL PANEL ── */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white overflow-hidden shadow-sm">
            {/* Panel header */}
            <div className={cn("flex items-center justify-between gap-3 p-4 bg-gradient-to-r text-white", selectedMeta.gradient)}>
              <div className="flex items-center gap-3">
                {(() => { const Icon = selectedMeta.icon; return <Icon className="size-5 shrink-0" />; })()}
                <div>
                  <p className="font-bold text-sm">{selectedMeta.name}</p>
                  <p className="text-xs text-white/80">{selectedMeta.blurb}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge className="bg-white/20 text-white border-white/30 text-[10px]">{selectedMeta.badge}</Badge>
                <span className="text-[10px] text-white/70">{selectedMeta.freeQuota}</span>
              </div>
            </div>

            {/* Get key link */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-2">
              <p className="text-xs text-muted-foreground">{selectedMeta.keyHelp}</p>
              <a
                href={selectedMeta.keyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-navy hover:text-brand-gold underline decoration-dotted"
              >
                Get Key
                <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="space-y-4 p-4">
              {/* API Key Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`api-key-${selectedProvider}`} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Key className="size-3 text-slate-500" />
                    API Key
                  </Label>
                  <span className="text-[10px] font-mono text-muted-foreground">{selectedMeta.keyPrefixHint}</span>
                </div>
                <div className="relative">
                  <Input
                    id={`api-key-${selectedProvider}`}
                    type={showKey[selectedProvider] ? "text" : "password"}
                    placeholder={`Paste ${selectedMeta.name} API key here…`}
                    value={apiKeyDrafts[selectedProvider] || ""}
                    onChange={(e) => setApiKeyDrafts((prev) => ({ ...prev, [selectedProvider]: e.target.value }))}
                    className="font-mono text-xs pr-10 bg-white border-slate-200 focus-visible:ring-brand-navy/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((prev) => ({ ...prev, [selectedProvider]: !prev[selectedProvider] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showKey[selectedProvider] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {/* Server key status indicator */}
                {serverStatus?.providerStatus?.[selectedProvider]?.hasKey && (
                  <p className="flex items-center gap-1 text-[10px] text-emerald-600">
                    <CheckCircle2 className="size-3" />
                    Server has key: <span className="font-mono">{serverStatus.providerStatus[selectedProvider].keyPreview}</span>
                  </p>
                )}
              </div>

              {/* Model + Base URL */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`model-${selectedProvider}`} className="text-xs font-semibold text-slate-700">
                    Model
                  </Label>
                  <Select
                    value={modelDrafts[selectedProvider] || selectedMeta.defaultModel}
                    onValueChange={(val) => setModelDrafts((prev) => ({ ...prev, [selectedProvider]: val }))}
                  >
                    <SelectTrigger id={`model-${selectedProvider}`} className="text-xs font-mono bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedMeta.models.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{m.label}</span>
                            {m.tier && (
                              <span className={cn("text-[9px] px-1.5 py-0 rounded-full border font-medium", TIER_COLORS[m.tier])}>
                                {m.tier}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{m.desc}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`baseurl-${selectedProvider}`} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Globe className="size-3" />
                    Base URL
                  </Label>
                  <Input
                    id={`baseurl-${selectedProvider}`}
                    value={baseUrlDrafts[selectedProvider] || selectedMeta.defaultBaseUrl}
                    onChange={(e) => setBaseUrlDrafts((prev) => ({ ...prev, [selectedProvider]: e.target.value }))}
                    placeholder={selectedMeta.defaultBaseUrl}
                    className="text-xs font-mono bg-white border-slate-200"
                  />
                </div>
              </div>

              {/* Action bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
                {/* Test connection + result */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={testingProvider === selectedProvider}
                    onClick={() => handleTestConnection(selectedProvider)}
                    className="gap-1.5 text-xs text-brand-navy border-slate-200 hover:bg-slate-50"
                  >
                    {testingProvider === selectedProvider ? (
                      <><Loader2 className="size-3.5 animate-spin" /> Testing…</>
                    ) : (
                      <><Activity className="size-3.5 text-amber-500" /> Test Connection</>
                    )}
                  </Button>

                  {testResults[selectedProvider] && (
                    <div className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs border",
                      testResults[selectedProvider]?.ok
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {testResults[selectedProvider]?.ok ? (
                        <><CheckCircle2 className="size-3.5 shrink-0" />
                          <span className="font-semibold">{testResults[selectedProvider]?.latencyMs}ms</span></>
                      ) : (
                        <><XCircle className="size-3.5 shrink-0" />
                          <span className="truncate max-w-[200px] text-[11px]">{testResults[selectedProvider]?.message}</span></>
                      )}
                    </div>
                  )}
                </div>

                {/* Save buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveProvider(selectedProvider)}
                    disabled={saving}
                    className="gap-1.5 text-xs border-slate-200"
                  >
                    {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save Key
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setSelectedProvider(selectedProvider);
                      handleSaveProvider(selectedProvider);
                    }}
                    disabled={saving}
                    className="gap-1.5 text-xs bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold"
                  >
                    {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    {selectedProvider === config.aiStudy.provider ? "Save & Update" : "Save & Set Active"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* All Providers Status Table */}
          {serverStatus?.providerStatus && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Server-Side Provider Status</h3>
                <button
                  type="button"
                  onClick={async () => {
                    setLoadingStatus(true);
                    const updated = await getAdminApiStatusFn().catch(() => null);
                    if (updated) setServerStatus(updated as ServerStatus);
                    setLoadingStatus(false);
                  }}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-brand-navy"
                >
                  <RefreshCw className={cn("size-3", loadingStatus && "animate-spin")} />
                  Refresh
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {AI_PROVIDERS.map((provider) => {
                  const status = serverStatus.providerStatus?.[provider.id];
                  const isActive = serverStatus.activeProvider === provider.id;
                  const Icon = provider.icon;
                  return (
                    <div key={provider.id} className={cn("flex items-center justify-between gap-3 px-4 py-2.5", isActive && "bg-brand-navy/[0.02]")}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("flex size-6 shrink-0 items-center justify-center rounded-md text-white bg-gradient-to-br", provider.gradient)}>
                          <Icon className="size-3" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            {provider.name}
                            {isActive && <Badge className="text-[9px] h-3.5 px-1 bg-brand-navy text-white">Active</Badge>}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono">{status?.model || provider.defaultModel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {status?.keyPreview && (
                          <span className="font-mono text-[10px] text-slate-400">{status.keyPreview}</span>
                        )}
                        <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                          status?.hasKey
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200")}>
                          <span className={cn("size-1.5 rounded-full", status?.hasKey ? "bg-emerald-500" : "bg-slate-400")} />
                          {status?.hasKey ? "Key Set" : "No Key"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save All button */}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="gap-2 bg-gradient-to-r from-brand-navy to-indigo-700 hover:opacity-90 text-white font-semibold text-sm shadow-md"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Saving to Server…" : "Save All Providers to Server"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── GOOGLE ADSENSE ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-brand-navy">
            <Megaphone className="size-4 text-brand-gold" />
            Google AdSense
          </CardTitle>
          <CardDescription>
            Enable the AdSense loader site-wide. Individual ad placements are managed in the Sponsors section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adsense-pub-id" className="text-xs font-semibold text-slate-700">Publisher ID</Label>
            <div className="flex gap-2">
              <Input
                id="adsense-pub-id"
                placeholder="ca-pub-1234567890123456"
                value={publisherIdDraft}
                onChange={(e) => setPublisherIdDraft(e.target.value)}
                className="font-mono text-xs"
              />
              <Button variant="outline" onClick={savePublisherId} className="shrink-0">Save</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Find this in AdSense → Account → Settings → Account information.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
            <div>
              <p className="text-sm font-semibold text-brand-navy">Enable AdSense script</p>
              <p className="text-xs text-muted-foreground">Injects the loader script on every page once publisher ID is set</p>
            </div>
            <Switch
              checked={config.googleAdsense.enabled}
              disabled={!config.googleAdsense.publisherId}
              onCheckedChange={(enabled) => {
                const result = setAdsense({ enabled });
                if (!result.ok) { toast.error(result.error); return; }
                toast.success(enabled ? "AdSense enabled site-wide" : "AdSense disabled");
              }}
            />
          </div>
          {config.googleAdsense.enabled && config.googleAdsense.publisherId && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="size-4 shrink-0" />
              Live — injected with publisher: <span className="font-mono font-semibold">{config.googleAdsense.publisherId}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── CUSTOM API KEYS ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-brand-navy">
            <Key className="size-4 text-brand-gold" />
            Custom API Keys & Secrets
          </CardTitle>
          <CardDescription>
            Store any other third-party key or config value (Analytics, Firebase, payment gateway) without code changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.customKeys.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No custom keys yet.</p>
          ) : (
            <div className="space-y-2">
              {config.customKeys.map((key) => (
                <div key={key.id} className="flex items-center gap-2 rounded-xl border border-slate-100 p-3">
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <Input
                      value={key.label}
                      onChange={(e) => updateCustomKey(key.id, { label: e.target.value })}
                      placeholder="Label"
                      className="text-xs"
                    />
                    <Input
                      value={key.value}
                      onChange={(e) => updateCustomKey(key.id, { value: e.target.value })}
                      placeholder="Value"
                      className="font-mono text-xs"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:bg-destructive/10"
                    onClick={() => { removeCustomKey(key.id); toast.success(`"${key.label}" removed`); }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            <Badge variant="secondary" className="shrink-0">New</Badge>
            <Input
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder="e.g. Google Analytics ID"
              className="flex-1 text-xs"
            />
            <Input
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
              placeholder="G-XXXXXXX"
              className="flex-1 font-mono text-xs"
            />
            <Button className="shrink-0 gap-1.5" onClick={handleAddKey}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
