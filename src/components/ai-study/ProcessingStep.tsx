import { CheckCircle2, FileText, Loader2 } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { PROCESSING_STEPS } from "./demo-content";

export function ProcessingStep({
  step,
  pct,
  filename,
}: {
  step: number;
  pct: number;
  filename: string;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 animate-in fade-in-0 duration-500">
      {/* Concentric rings animation */}
      <div className="relative mb-10 flex items-center justify-center">
        <span className="absolute size-40 animate-ping rounded-full bg-brand-gold/10 [animation-duration:2s]" />
        <span className="absolute size-28 animate-ping rounded-full bg-brand-gold/15 [animation-duration:2s] [animation-delay:0.3s]" />
        <div className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-[#162042] shadow-2xl shadow-brand-navy/40">
          <Loader2 className="size-10 animate-spin text-brand-gold" />
        </div>
      </div>

      <h2 className="font-serif text-3xl font-bold text-brand-navy">Generating your study pack…</h2>

      {filename && (
        <div className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 shadow-sm">
          <FileText className="size-3.5 text-brand-gold" />
          <span className="max-w-[280px] truncate font-medium">{filename}</span>
        </div>
      )}

      <div className="mt-10 w-full max-w-sm">
        <div className="mb-2 flex justify-between text-xs text-slate-500">
          <span className="font-medium">Analysing…</span>
          <span className="font-mono font-bold text-brand-navy">{pct}%</span>
        </div>
        <Progress
          value={pct}
          className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-brand-gold [&>div]:to-amber-400 [&>div]:transition-all [&>div]:duration-700"
        />

        <ul className="mt-8 space-y-4">
          {PROCESSING_STEPS.map(({ label, icon: Icon }, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm transition-all duration-300",
                  done
                    ? "bg-emerald-50 text-emerald-700"
                    : active
                      ? "bg-brand-navy/5 text-brand-navy font-semibold shadow-sm"
                      : "text-slate-400",
                )}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg transition-all",
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-brand-navy text-brand-gold"
                        : "bg-slate-100 text-slate-300",
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="size-4" />
                  ) : active ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                {label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
