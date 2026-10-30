import {
  Check,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Key,
  Layers,
  Loader2,
  Plug,
  Sparkles,
  Zap,
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
import { testAiConnection } from "@/lib/api/ai-study.functions";
import type { AiStudyProvider } from "@/lib/integrations-store";

interface AiProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS: Array<{
  id: AiStudyProvider;
  name: string;
  defaultModel: string;
  models: string[];
  keyPlaceholder: string;
  keyUrl: string;
  freeOption?: boolean;
}> = [
  {
    id: "gemini",
    name: "Google Gemini (Recommended)",
    defaultModel: "gemini-flash-lite-latest",
    models: [
      "gemini-flash-lite-latest",
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.8-flash",
      "gemini-flash-latest",
    ],
    keyPlaceholder: "Server environment variable GEMINI_API_KEY or custom key",
    keyUrl: "https://aistudio.google.com/app/apikey",
    freeOption: true,
  },
  {
    id: "groq",
    name: "Groq (Ultra-Fast & Free Tier)",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    keyPlaceholder: "gsk_...",
    keyUrl: "https://console.groq.com/keys",
    freeOption: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    keyPlaceholder: "sk-proj-...",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    keyPlaceholder: "sk-...",
    keyUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    defaultModel: "claude-3-5-sonnet-20241022",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"],
    keyPlaceholder: "sk-ant-...",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "custom",
    name: "Custom / Local AI (Ollama, vLLM)",
    defaultModel: "llama3",
    models: ["llama3", "mistral", "qwen2.5"],
    keyPlaceholder: "Optional API key",
    keyUrl: "http://localhost:11434",
  },
];

export function AiProviderSettingsModal({ isOpen, onClose }: AiProviderSettingsModalProps) {
  const { config: integrations, setAiStudy, setAiStudyProviderSettings } = useIntegrations();

  const [provider, setProvider] = useState<AiStudyProvider>(
    integrations.aiStudy.provider || "gemini",
  );
  const [apiKey, setApiKey] = useState(
    integrations.aiStudy.providers?.[provider]?.apiKey ||
      integrations.aiStudy.apiKey ||
      "",
  );
  const [model, setModel] = useState(
    integrations.aiStudy.providers?.[provider]?.model ||
      PROVIDERS.find((p) => p.id === provider)?.defaultModel ||
      "gemini-flash-lite-latest",
  );
  const [baseUrl, setBaseUrl] = useState(
    integrations.aiStudy.providers?.[provider]?.baseUrl ||
      (provider === "gemini" ? "https://generativelanguage.googleapis.com/v1beta/openai/" : ""),
  );
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);

  const selectedProviderMeta = PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0];

  const handleProviderChange = (newP: AiStudyProvider) => {
    setProvider(newP);
    const existing = integrations.aiStudy.providers?.[newP];
    const meta = PROVIDERS.find((p) => p.id === newP);
    setApiKey(existing?.apiKey || "");
    setModel(existing?.model || meta?.defaultModel || "");
    setBaseUrl(
      existing?.baseUrl ||
        (newP === "gemini" ? "https://generativelanguage.googleapis.com/v1beta/openai/" : ""),
    );
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim() && provider !== "custom") {
      toast.error("Please enter an API key first.");
      return;
    }
    setTesting(true);
    setTestResult(null);

    try {
      const res = await testAiConnection({
        data: {
          provider,
          apiKey: apiKey.trim(),
          model: model.trim() || undefined,
          baseUrl: baseUrl.trim() || undefined,
        },
      });
      setTestResult(res);
      if (res.ok) {
        toast.success(`Connected to ${selectedProviderMeta.name} in ${res.latencyMs}ms!`);
      } else {
        toast.error(`Connection failed: ${res.message}`);
      }
    } catch (err) {
      setTestResult({
        ok: false,
        latencyMs: 0,
        message: err instanceof Error ? err.message : "Network error",
      });
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setAiStudy({
      enabled: true,
      provider,
      apiKey: apiKey.trim(),
    });
    setAiStudyProviderSettings(provider, {
      apiKey: apiKey.trim(),
      model: model.trim(),
      baseUrl: baseUrl.trim() || undefined,
    });
    toast.success("AI Provider settings saved!", {
      description: `Now using ${selectedProviderMeta.name} (${model}) for all study generations.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
              <Zap className="size-4" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-brand-navy dark:text-white">
                Connect Real AI Provider
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Choose an AI engine to power your questions, notes, and study chat.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Provider selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select AI Provider
            </label>
            <Select value={provider} onValueChange={(v) => handleProviderChange(v as AiStudyProvider)}>
              <SelectTrigger className="h-10 rounded-xl text-xs font-bold">
                <Cpu className="mr-2 size-4 text-brand-gold shrink-0" />
                <SelectValue placeholder="Choose provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs font-medium">
                    <span className="flex items-center gap-2">
                      <span>{p.name}</span>
                      {p.freeOption && (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                          Free Available
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {selectedProviderMeta.name} API Key
              </label>
              <a
                href={selectedProviderMeta.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-navy hover:underline dark:text-brand-gold"
              >
                <span>Get API key</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="relative">
              <Key className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedProviderMeta.keyPlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-10 text-xs font-mono outline-none focus:border-brand-navy focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Keys are stored securely in your browser and processed exclusively on the server.
            </p>
          </div>

          {/* Model selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              AI Model
            </label>
            <div className="flex gap-2">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="h-9 rounded-xl text-xs font-semibold flex-1">
                  <SelectValue placeholder="Choose model" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProviderMeta.models.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom base url if custom */}
          {provider === "custom" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Custom Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434/v1"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs outline-none focus:border-brand-navy dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
          )}

          {/* Test connection result pill */}
          {testResult && (
            <div
              className={`rounded-xl p-3 text-xs flex items-start gap-2 ${
                testResult.ok
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <Plug className="size-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{testResult.ok ? "Success" : "Connection Failed"}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testing || (!apiKey.trim() && provider !== "custom")}
              onClick={handleTestConnection}
              className="rounded-xl text-xs"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Plug className="mr-1.5 size-3.5" />
                  Test Connection
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                className="rounded-xl bg-brand-navy font-bold text-white hover:bg-brand-navy/90 dark:bg-brand-gold dark:text-slate-950 text-xs"
              >
                <Check className="mr-1.5 size-3.5" />
                Save & Connect
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
