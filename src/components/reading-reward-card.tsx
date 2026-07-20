import { CheckCircle2, Clock, Gift } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { useReadingTime } from "@/hooks/use-reading-time";
import { cn } from "@/lib/utils";

type ReadingTimeState = ReturnType<typeof useReadingTime>;

export function ReadingRewardCard({
  reading,
  className,
  compact,
}: {
  reading: ReadingTimeState;
  className?: string;
  compact?: boolean;
}) {
  const handleClaim = () => {
    const result = reading.claim();
    if (!result.ok) {
      toast.error("Cannot claim yet", { description: result.error });
      return;
    }
    toast.success(`${reading.rewardEtb} ETB reading bonus claimed!`, {
      description: `+${reading.rewardXp.toLocaleString()} XP added to your wallet`,
    });
  };

  if (!reading.loggedIn) {
    return (
      <div className={cn("rounded-xl border border-slate-200 bg-white p-5", className)}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Reading reward
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Sign in and read for {reading.targetFormatted} to earn{" "}
          <strong className="text-slate-900">{reading.rewardEtb} ETB</strong>.
        </p>
      </div>
    );
  }

  if (reading.rewardClaimed) {
    return (
      <div className={cn("rounded-xl border border-emerald-200 bg-emerald-50/50 p-5", className)}>
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="size-5 shrink-0" />
          <p className="text-sm font-semibold">{reading.rewardEtb} ETB reading bonus claimed</p>
        </div>
        {reading.claimedAt && (
          <p className="mt-2 text-xs text-emerald-600/80">Claimed {reading.claimedAt}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-brand-gold/40 bg-white p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
            {compact ? "10h reading bonus" : "Reading milestone"}
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {reading.rewardEtb} ETB cash reward
          </h3>
          {!compact && (
            <p className="mt-1 text-sm text-slate-500">
              Read verified course PDFs for {reading.targetFormatted} to unlock{" "}
              {reading.rewardXp.toLocaleString()} XP ({reading.rewardEtb} ETB).
            </p>
          )}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
          {reading.canClaim ? <Gift className="size-5" /> : <Clock className="size-5" />}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">
            {reading.formatted} / {reading.targetFormatted}
          </span>
          <span className="font-mono text-slate-500">{reading.progressPercent}%</span>
        </div>
        <div className="relative overflow-hidden rounded-full">
          <Progress value={reading.progressPercent} className="h-2 [&>div]:bg-brand-gold" />
          {reading.progressPercent > 0 && reading.progressPercent < 100 && (
            <div className="pointer-events-none absolute inset-0 shimmer opacity-40 rounded-full" />
          )}
        </div>
        {reading.canClaim ? (
          <Button
            className="mt-4 w-full bg-brand-gold hover:brightness-110 text-white"
            onClick={handleClaim}
          >
            Claim {reading.rewardEtb} ETB bonus
          </Button>
        ) : (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="size-3.5 shrink-0" />
            {reading.hoursRemaining > 0
              ? `~${reading.hoursRemaining}h remaining — keep reading in the Library`
              : "Almost there — a few more minutes of reading"}
          </p>
        )}
      </div>
    </div>
  );
}
