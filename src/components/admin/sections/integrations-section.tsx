import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Key,
  Megaphone,
  Plug,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { useIntegrations } from "@/hooks/use-integrations";
import { getAiStudyStatus } from "@/lib/api/ai-study.functions";
import type { AiStudyProvider } from "@/lib/integrations-store";
import { cn } from "@/lib/utils";

type AiStatus = { anthropic: boolean; deepseek: boolean; custom: boolean };

const AI_PROVIDERS: {
  id: AiStudyProvider;
  name: string;
  icon: typeof Bot;
  envVar: string;
  blurb: string;
}[] = [
  {
    id: "anthropic",
    name: "Claude",
    icon: Bot,
    envVar: "ANTHROPIC_API_KEY",
    blurb: "claude-opus-4-8 · strongest reasoning, guaranteed valid output",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: Zap,
    envVar: "DEEPSEEK_API_KEY",
    blurb: "Low cost per generation, OpenAI-compatible API",
  },
  {
    id: "custom",
    name: "Custom",
    icon: Plug,
    envVar: "CUSTOM_AI_API_KEY",
    blurb: "Any OpenAI-compatible endpoint — Groq, Mistral, a self-hosted gateway…",
  },
];

export function IntegrationsSection({ admin }: { admin?: AdminDashboardState } = {}) {
  const {
    config,
    setAdsense,
    setAiStudy,
    setAiStudyCustom,
    addCustomKey,
    updateCustomKey,
    removeCustomKey,
  } = useIntegrations();
  const [publisherIdDraft, setPublisherIdDraft] = useState(config.googleAdsense.publisherId);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [customLabelDraft, setCustomLabelDraft] = useState(config.aiStudy.custom.label);
  const [customBaseUrlDraft, setCustomBaseUrlDraft] = useState(config.aiStudy.custom.baseUrl);
  const [customModelDraft, setCustomModelDraft] = useState(config.aiStudy.custom.model);

  useEffect(() => {
    let cancelled = false;
    getAiStudyStatus()
      .then((status) => {
        if (!cancelled) setAiStatus(status);
      })
      .catch(() => {
        if (!cancelled) setAiStatus({ anthropic: false, deepseek: false, custom: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeProvider = AI_PROVIDERS.find((p) => p.id === config.aiStudy.provider)!;
  const activeConfigured = aiStatus?.[config.aiStudy.provider] ?? null;

  function selectProvider(id: AiStudyProvider) {
    setAiStudy({ provider: id });
    toast.success(`AI Study will generate with ${AI_PROVIDERS.find((p) => p.id === id)!.name}`);
  }

  function saveCustomConnection() {
    setAiStudyCustom({
      label: customLabelDraft.trim(),
      baseUrl: customBaseUrlDraft.trim(),
      model: customModelDraft.trim(),
    });
    toast.success("Custom endpoint saved");
  }

  function savePublisherId() {
    const result = setAdsense({ publisherId: publisherIdDraft.trim() });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("AdSense publisher ID saved");
  }

  function toggleAdsenseEnabled(enabled: boolean) {
    const result = setAdsense({ enabled });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(enabled ? "AdSense script enabled site-wide" : "AdSense script disabled");
  }

  function handleAddKey() {
    if (!newKeyLabel.trim()) {
      toast.error("Give the key a label first");
      return;
    }
    const result = addCustomKey(newKeyLabel, newKeyValue);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setNewKeyLabel("");
    setNewKeyValue("");
    toast.success("Key added");
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-brand-navy flex items-center gap-2">
            <Megaphone className="size-5 text-brand-gold" />
            Google AdSense
          </CardTitle>
          <CardDescription>
            When enabled, the AdSense loader script is injected site-wide so ad slots can serve real
            ads. Individual ad units are still managed per-placement in Sponsors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="adsense-pub-id">Publisher ID</Label>
            <div className="flex gap-2">
              <Input
                id="adsense-pub-id"
                placeholder="ca-pub-1234567890123456"
                value={publisherIdDraft}
                onChange={(e) => setPublisherIdDraft(e.target.value)}
                className="font-mono"
              />
              <Button variant="outline" onClick={savePublisherId}>
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Found in AdSense under Account → Settings → Account information.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
            <div>
              <p className="text-sm font-semibold text-brand-navy">Enable AdSense script</p>
              <p className="text-xs text-muted-foreground">
                Loads the AdSense JS loader on every page once a publisher ID is saved
              </p>
            </div>
            <Switch
              checked={config.googleAdsense.enabled}
              disabled={!config.googleAdsense.publisherId}
              onCheckedChange={toggleAdsenseEnabled}
            />
          </div>
          {config.googleAdsense.enabled && config.googleAdsense.publisherId && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="size-4 shrink-0" />
              Live — script tag injected with client={config.googleAdsense.publisherId}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-2xl shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-brand-navy flex items-center gap-2">
              <Sparkles className="size-5 text-brand-gold" />
              AI Study — Generation Provider
            </CardTitle>
            {admin && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => admin.setSection("aiStudy")}
                className="gap-1.5 text-xs font-semibold text-brand-navy border-brand-navy/30 hover:bg-brand-navy hover:text-white"
              >
                Open Full AI Console
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
          <CardDescription>
            Configure generation engine, models, and endpoints. To enter API keys directly with real-time connection verification and prompt tuning, visit the dedicated{" "}
            <button
              type="button"
              onClick={() => admin?.setSection("aiStudy")}
              className="text-brand-gold font-bold underline hover:text-amber-700 inline"
            >
              AI Study section
            </button>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Overall status */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 p-3 text-xs">
            {aiStatus === null ? (
              <span className="text-muted-foreground">Checking status…</span>
            ) : activeConfigured ? (
              <span className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="size-4 shrink-0" />
                Ready — generating with <strong>{activeProvider.name}</strong>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-amber-700">
                <XCircle className="size-4 shrink-0" />
                Not ready — AI Study is running on its built-in sample question bank
              </span>
            )}
          </div>

          {/* Provider picker */}
          <div className="grid gap-3 sm:grid-cols-3">
            {AI_PROVIDERS.map((provider) => {
              const selected = config.aiStudy.provider === provider.id;
              const configured = aiStatus?.[provider.id] ?? null;
              const Icon = provider.icon;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => selectProvider(provider.id)}
                  className={cn(
                    "relative flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all",
                    selected
                      ? "border-brand-navy bg-brand-navy/5 shadow-sm"
                      : "border-slate-100 hover:border-slate-200",
                  )}
                >
                  {selected && (
                    <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-brand-navy">
                      <CheckCircle2 className="size-3.5 text-white" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      selected ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{provider.name}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {provider.blurb}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "w-fit text-[10px]",
                      configured ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {configured === null ? "…" : configured ? "Configured" : "Not set"}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Per-provider settings */}
          {config.aiStudy.provider === "anthropic" && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-xs text-muted-foreground">
                Uses{" "}
                <code className="rounded bg-white px-1.5 py-0.5 font-mono">claude-opus-4-8</code>.
                Set{" "}
                <code className="rounded bg-white px-1.5 py-0.5 font-mono">ANTHROPIC_API_KEY</code>{" "}
                in your deployment's environment variables and redeploy to activate.
              </p>
            </div>
          )}

          {config.aiStudy.provider === "deepseek" && (
            <div className="space-y-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="grid gap-2">
                <Label htmlFor="deepseek-model">Model</Label>
                <Select
                  value={config.aiStudy.deepseekModel}
                  onValueChange={(model) => setAiStudy({ deepseekModel: model })}
                >
                  <SelectTrigger id="deepseek-model" className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek-chat">
                      deepseek-chat — fast, cheap, general
                    </SelectItem>
                    <SelectItem value="deepseek-reasoner">
                      deepseek-reasoner — slower, deeper reasoning
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Set{" "}
                <code className="rounded bg-white px-1.5 py-0.5 font-mono">DEEPSEEK_API_KEY</code>{" "}
                in your deployment's environment variables and redeploy to activate.
              </p>
            </div>
          )}

          {config.aiStudy.provider === "custom" && (
            <div className="space-y-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="custom-label">Label</Label>
                  <Input
                    id="custom-label"
                    placeholder="e.g. Groq"
                    value={customLabelDraft}
                    onChange={(e) => setCustomLabelDraft(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="custom-model">Model</Label>
                  <Input
                    id="custom-model"
                    placeholder="e.g. llama-3.3-70b-versatile"
                    value={customModelDraft}
                    onChange={(e) => setCustomModelDraft(e.target.value)}
                    className="bg-white font-mono"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="custom-base-url">Base URL</Label>
                <Input
                  id="custom-base-url"
                  placeholder="https://api.groq.com/openai/v1"
                  value={customBaseUrlDraft}
                  onChange={(e) => setCustomBaseUrlDraft(e.target.value)}
                  className="bg-white font-mono"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Must implement the OpenAI Chat Completions format. Set{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono">
                    CUSTOM_AI_API_KEY
                  </code>{" "}
                  in your environment and redeploy to activate.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={saveCustomConnection}
                >
                  Save
                </Button>
              </div>
            </div>
          )}

          {/* Master kill switch */}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
            <div>
              <p className="text-sm font-semibold text-brand-navy">
                Use {activeProvider.name} for AI Study
              </p>
              <p className="text-xs text-muted-foreground">
                Turn off to force the sample question bank even when a provider is configured
              </p>
            </div>
            <Switch
              checked={config.aiStudy.enabled}
              disabled={!activeConfigured}
              onCheckedChange={(enabled) => {
                setAiStudy({ enabled });
                toast.success(
                  enabled
                    ? `AI Study will use ${activeProvider.name}`
                    : "AI Study switched to sample questions",
                );
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-brand-navy flex items-center gap-2">
            <Key className="size-5 text-brand-gold" />
            Custom API keys
          </CardTitle>
          <CardDescription>
            A flexible place to store any other third-party key or config value (Analytics,
            Firebase, payment gateway, etc.) without needing new code for each one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.customKeys.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No custom keys yet.</p>
          ) : (
            <div className="space-y-2">
              {config.customKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 p-3"
                >
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <Input
                      value={key.label}
                      onChange={(e) => updateCustomKey(key.id, { label: e.target.value })}
                      placeholder="Label"
                    />
                    <Input
                      value={key.value}
                      onChange={(e) => updateCustomKey(key.id, { value: e.target.value })}
                      placeholder="Value"
                      className="font-mono"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      removeCustomKey(key.id);
                      toast.success(`"${key.label}" removed`);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
            <Badge variant="secondary" className="shrink-0">
              New
            </Badge>
            <Input
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder="e.g. Google Analytics ID"
              className="flex-1"
            />
            <Input
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
              placeholder="G-XXXXXXX"
              className="flex-1 font-mono"
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
