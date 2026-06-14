import { Check, Copy, Gift, Link2, Share2, Trophy, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useReferral } from "@/hooks/use-referral";
import {
  REFERRAL_COMPLETE_XP,
  REFERRAL_FRIEND_BONUS,
  REFERRAL_SIGNUP_XP,
  referralTiers,
  type ReferralRecord,
} from "@/lib/referral-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<ReferralRecord["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  signed_up: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
};

const statusLabels: Record<ReferralRecord["status"], string> = {
  pending: "Invited",
  signed_up: "Signed up",
  completed: "Active learner",
};

export function ReferralPanel() {
  const {
    referrals,
    code,
    referralLink,
    completed,
    signedUp,
    pending,
    totalReferralXp,
    nextTier,
    progressToNext,
    copyToClipboard,
  } = useReferral();

  const copyCode = async () => {
    await copyToClipboard(code);
    toast.success("Referral code copied!");
  };

  const copyLink = async () => {
    await copyToClipboard(referralLink);
    toast.success("Referral link copied — share with classmates!");
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Study2Earn",
          text: `Use my referral code ${code} to get ${REFERRAL_FRIEND_BONUS} bonus XP when you sign up!`,
          url: referralLink,
        });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    await copyLink();
  };

  return (
    <section className="mb-12">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
            Refer & earn
          </p>
          <h2 className="font-serif text-2xl font-bold text-brand-navy">Referral program</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Invite classmates to Study2Earn. Earn XP when they sign up and complete their first
            chapter.
          </p>
        </div>
        <Badge className="w-fit bg-brand-gold/15 text-brand-gold">
          +{totalReferralXp.toLocaleString()} XP earned
        </Badge>
      </div>

      {/* Hero referral card */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-brand-gold/20 bg-gradient-to-br from-brand-navy via-brand-navy to-[#1a2f5c] p-6 text-white shadow-lg md:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-gold/20">
              <Share2 className="size-6 text-brand-gold" />
            </div>
            <h3 className="font-serif text-2xl font-bold">Your referral code</h3>
            <p className="mt-2 text-sm text-white/70">
              Friends get <strong className="text-brand-gold">{REFERRAL_FRIEND_BONUS} XP</strong> on
              signup. You earn <strong className="text-brand-gold">{REFERRAL_SIGNUP_XP} XP</strong>{" "}
              when they register and{" "}
              <strong className="text-brand-gold">{REFERRAL_COMPLETE_XP} XP</strong> when they
              complete their first chapter.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Input
                  readOnly
                  value={code}
                  className="border-white/20 bg-white/10 pr-12 font-mono text-lg font-bold tracking-widest text-white placeholder:text-white/40"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-white hover:bg-white/10"
                  onClick={copyCode}
                  aria-label="Copy referral code"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <Button
                type="button"
                className="gap-2 bg-brand-gold text-brand-navy hover:bg-brand-gold/90"
                onClick={shareNative}
              >
                <Share2 className="size-4" />
                Share link
              </Button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
              <Link2 className="size-3.5 shrink-0" />
              <span className="truncate">{referralLink}</span>
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 font-semibold text-brand-gold hover:underline"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Invited", value: referrals.length, icon: UserPlus },
              { label: "Signed up", value: signedUp, icon: Users },
              { label: "Completed", value: completed, icon: Check },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-center"
              >
                <stat.icon className="mx-auto size-5 text-brand-gold" />
                <p className="mt-2 font-serif text-2xl font-bold">{stat.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  {stat.label}
                </p>
              </div>
            ))}
            <div className="col-span-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">
                  {nextTier
                    ? `Next milestone: ${nextTier.count} referrals`
                    : "All milestones unlocked!"}
                </span>
                <span className="font-mono font-bold text-brand-gold">
                  {completed}/{nextTier?.count ?? completed}
                </span>
              </div>
              <Progress value={progressToNext} className="mt-3 h-2 bg-white/10" />
              {nextTier && (
                <p className="mt-2 text-xs text-white/50">
                  Unlock: {nextTier.reward}
                  {nextTier.xpBonus > 0 && ` · +${nextTier.xpBonus} XP bonus`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          {
            step: "01",
            title: "Share your code",
            desc: "Send your link or code to friends via Telegram, WhatsApp, or campus groups.",
            icon: Share2,
          },
          {
            step: "02",
            title: "They sign up",
            desc: `Your friend registers with your code and gets ${REFERRAL_FRIEND_BONUS} bonus XP instantly.`,
            icon: UserPlus,
          },
          {
            step: "03",
            title: "You both earn",
            desc: `You earn up to ${REFERRAL_SIGNUP_XP + REFERRAL_COMPLETE_XP} XP per friend who becomes an active learner.`,
            icon: Gift,
          },
        ].map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-brand-gold">{item.step}</span>
              <item.icon className="size-4 text-brand-navy" />
            </div>
            <h4 className="font-semibold text-brand-navy">{item.title}</h4>
            <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Referral history */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-brand-navy">Your referrals</h3>
          <p className="mt-1 text-sm text-slate-500">
            {pending > 0
              ? `${pending} invite${pending !== 1 ? "s" : ""} still pending signup`
              : "Track friends you've invited"}
          </p>
          <div className="mt-5 space-y-3">
            {referrals.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No referrals yet — share your code to get started!
              </p>
            ) : (
              referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-navy">{ref.name}</p>
                    <p className="truncate text-xs text-slate-500">{ref.university}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{ref.date}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge
                      variant="secondary"
                      className={cn("capitalize", statusStyles[ref.status])}
                    >
                      {statusLabels[ref.status]}
                    </Badge>
                    {ref.xpEarned > 0 && (
                      <p className="mt-2 font-mono text-sm font-bold text-brand-gold">
                        +{ref.xpEarned} XP
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Milestone tiers */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-brand-gold" />
            <h3 className="font-serif text-lg font-bold text-brand-navy">Referral milestones</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Hit referral targets to unlock bonus XP and badges
          </p>
          <div className="mt-5 space-y-4">
            {referralTiers.map((tier) => {
              const unlocked = completed >= tier.count;
              return (
                <div
                  key={tier.count}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 transition",
                    unlocked
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-slate-100 bg-slate-50/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full font-bold",
                      unlocked ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500",
                    )}
                  >
                    {unlocked ? <Check className="size-5" /> : tier.count}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-navy">
                      {tier.count} referral{tier.count !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-slate-500">{tier.reward}</p>
                  </div>
                  {tier.xpBonus > 0 && (
                    <span
                      className={cn(
                        "shrink-0 font-mono text-sm font-bold",
                        unlocked ? "text-emerald-700" : "text-slate-400",
                      )}
                    >
                      +{tier.xpBonus} XP
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
