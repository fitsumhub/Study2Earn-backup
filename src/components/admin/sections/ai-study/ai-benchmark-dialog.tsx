import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Flame,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useIntegrations } from "@/hooks/use-integrations";
import { testAiConnection } from "@/lib/api/ai-study.functions";
import type { AiStudyProvider } from "@/lib/integrations-store";
import { cn } from "@/lib/utils";

interface BenchmarkResult {
  providerId: AiStudyProvider;
  name: string;
  ok: boolean;
  latencyMs?: number;
  message?: string;
  testedAt?: string;
}

const PROVIDER_INFO: { id: AiStudyProvider; name: string; model: string }[] = [
  { id: "gemini", name: "Google Gemini", model: "gemini-flash-lite-latest" },
  { id: "groq", name: "Groq LPU", model: "llama-3.3-70b-versatile" },
  { id: "deepseek", name: "DeepSeek", model: "deepseek-chat" },
  { id: "openai", name: "OpenAI", model: "gpt-4o-mini" },
  { id: "anthropic", name: "Anthropic Claude", model: "claude-3-5-sonnet" },
  { id: "custom", name: "Custom / Ollama", model: "Local / Endpoint" },
];

export function AiBenchmarkDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { config, setAiStudy } = useIntegrations();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<AiStudyProvider, BenchmarkResult | null>>({
    openai: null,
    anthropic: null,
    deepseek: null,
    groq: null,
    gemini: null,
    custom: null,
  });

  const runBenchmark = async () => {
    setIsRunning(true);
    toast.info("Pinging all 6 AI provider endpoints in parallel…");

    const promises = PROVIDER_INFO.map(async (info) => {
      const provSettings = config.aiStudy.providers?.[info.id];
      const apiKey = provSettings?.apiKey || (config.aiStudy.provider === info.id ? config.aiStudy.apiKey : undefined);
      const baseUrl = provSettings?.baseUrl;
      const model = provSettings?.model;

      try {
        const res = await testAiConnection({
          data: {
            provider: info.id,
            apiKey: apiKey || undefined,
            baseUrl: baseUrl || undefined,
            model: model || undefined,
          },
        });
        return {
          providerId: info.id,
          name: info.name,
          ok: res.ok,
          latencyMs: res.latencyMs,
          message: res.message,
          testedAt: new Date().toLocaleTimeString(),
        };
      } catch (err: unknown) {
        return {
          providerId: info.id,
          name: info.name,
          ok: false,
          message: err instanceof Error ? err.message : "Connection timed out",
          testedAt: new Date().toLocaleTimeString(),
        };
      }
    });

    const settled = await Promise.all(promises);
    const updatedMap: Record<AiStudyProvider, BenchmarkResult | null> = { ...results };
    for (const item of settled) {
      updatedMap[item.providerId] = item;
    }
    setResults(updatedMap);
    setIsRunning(false);

    const online = settled.filter((s) => s.ok);
    if (online.length > 0) {
      toast.success(`Benchmark complete! ${online.length} providers responding live.`);
    } else {
      toast.warning("Benchmark complete: No live AI responses received. Fallback mode is ready.");
    }
  };

  const successfulResults = Object.values(results)
    .filter((r): r is BenchmarkResult => r !== null && r.ok && r.latencyMs !== undefined)
    .sort((a, b) => (a.latencyMs || 0) - (b.latencyMs || 0));

  const fastest = successfulResults[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-serif text-lg font-bold text-brand-navy flex items-center gap-2">
              <Activity className="size-5 text-brand-gold" />
              Live Multi-Provider Speed & Latency Benchmark
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Ping all AI API endpoints simultaneously to verify health and compare real-world response latency.
          </DialogDescription>
        </DialogHeader>

        {/* Fastest Recommendation Banner */}
        {fastest && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Fastest Responding Engine: {fastest.name} ({fastest.latencyMs}ms)
                </p>
                <p className="text-[11px] text-emerald-700">
                  Sub-second response time ideal for real-time exam question synthesis.
                </p>
              </div>
            </div>
            {config.aiStudy.provider !== fastest.providerId && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setAiStudy({ provider: fastest.providerId });
                  toast.success(`Active engine switched to ${fastest.name}!`);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0"
              >
                Switch to {fastest.name.split(" ")[0]}
              </Button>
            )}
          </div>
        )}

        {/* Benchmark Results List */}
        <div className="space-y-2.5 py-2">
          {PROVIDER_INFO.map((info) => {
            const res = results[info.id];
            const isCurrentActive = config.aiStudy.provider === info.id;

            return (
              <div
                key={info.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 transition",
                  isCurrentActive ? "border-brand-navy/60 bg-blue-50/20" : "border-slate-200 bg-white",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-brand-navy font-bold text-xs">
                    {info.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-brand-navy">{info.name}</p>
                      {isCurrentActive && (
                        <Badge className="bg-brand-navy text-white text-[9px] py-0 px-1.5">
                          Active Engine
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">{info.model}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {res ? (
                    res.ok ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-mono text-[10px] font-bold">
                          {res.latencyMs} ms
                        </Badge>
                        <span className="text-[10px] text-emerald-600 font-semibold">Online</span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                          Failed
                        </Badge>
                        <p className="text-[9px] text-slate-400 max-w-[140px] truncate" title={res.message}>
                          {res.message || "No Key / Quota"}
                        </p>
                      </div>
                    )
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Not tested yet</span>
                  )}

                  {!isCurrentActive && res?.ok && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAiStudy({ provider: info.id });
                        toast.success(`Switched active engine to ${info.name}!`);
                      }}
                      className="h-7 text-xs text-brand-navy hover:bg-slate-100 font-semibold"
                    >
                      Use
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isRunning}
            onClick={runBenchmark}
            className="gap-1.5 bg-brand-navy text-white hover:bg-brand-navy/90 text-xs font-semibold"
          >
            {isRunning ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Pinging Endpoints…
              </>
            ) : (
              <>
                <Play className="size-3.5" />
                Start Full Benchmark
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
