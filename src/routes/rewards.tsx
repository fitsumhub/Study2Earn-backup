import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { ReferralPanel } from "@/components/referral-panel";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { WithdrawalPanel } from "@/components/withdrawal-panel";
import { Toaster } from "@/components/ui/sonner";
import { useExamProgress } from "@/hooks/use-exam-progress";
import { useReferral } from "@/hooks/use-referral";
import { useWithdrawals } from "@/hooks/use-withdrawals";
import { requireAuth } from "@/lib/require-auth";
import { rewards, badges } from "@/lib/mock-data";

export const Route = createFileRoute("/rewards")({
  beforeLoad: () => requireAuth("/rewards"),
  head: () => ({
    meta: [
      { title: "Rewards — Study2Earn" },
      {
        name: "description",
        content:
          "Convert your XP into airtime, vouchers, and unlock badges. Refer friends to earn bonus XP.",
      },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const { getOverallStats } = useExamProgress();
  const { totalReferralXp } = useReferral();
  const { pendingXp } = useWithdrawals();
  const examStats = getOverallStats();

  const baseXp = 1240;
  const currentXP = baseXp + examStats.totalXp + totalReferralXp - pendingXp;
  const lifetimeEarned = 4920 + examStats.totalXp + totalReferralXp;

  const handleRedeem = (title: string, xp: number) => {
    toast.success(`Redeemed: ${title}`, {
      description: `${xp.toLocaleString()} XP deducted from your wallet`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <header className="mb-10">
            <p className="text-sm font-medium text-brand-gold uppercase tracking-wider">Rewards</p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand-navy mt-1">
              Your wallet
            </h1>
            <p className="mt-2 text-slate-600">
              Redeem XP for real rewards, unlock badges, and earn more by referring classmates.
            </p>
          </header>

          {/* XP balance card */}
          <div className="rounded-2xl bg-brand-navy p-8 text-white mb-12 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 size-48 bg-brand-gold/20 rounded-full blur-3xl" />
            <div className="relative grid md:grid-cols-4 gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">Balance</p>
                <p className="font-serif text-5xl font-bold mt-2">
                  {currentXP.toLocaleString()} <span className="text-brand-gold text-2xl">XP</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                  Lifetime earned
                </p>
                <p className="font-serif text-3xl font-bold mt-2">
                  {lifetimeEarned.toLocaleString()} XP
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                  From referrals
                </p>
                <p className="font-serif text-3xl font-bold mt-2 text-brand-gold">
                  +{totalReferralXp.toLocaleString()} XP
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                  Rewards redeemed
                </p>
                <p className="font-serif text-3xl font-bold mt-2">3</p>
              </div>
            </div>
          </div>

          <ReferralPanel />

          <WithdrawalPanel availableXp={baseXp + examStats.totalXp + totalReferralXp} />

          {/* Badges */}
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-bold text-brand-navy mb-6">Badges</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {badges.map((b) => (
                <div
                  key={b.name}
                  className={`rounded-2xl p-4 text-center border ${
                    b.earned
                      ? "bg-white border-brand-gold/40 shadow-sm"
                      : "bg-slate-100/60 border-slate-200 opacity-60"
                  }`}
                >
                  <div
                    className={`size-14 mx-auto rounded-full grid place-items-center text-2xl mb-2 ${
                      b.earned ? "bg-brand-gold/10 text-brand-gold" : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {b.earned ? "★" : "○"}
                  </div>
                  <p className="text-xs font-bold">{b.name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Redemption catalog */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-navy mb-6">
              Redemption catalog
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((r) => {
                const canAfford = currentXP >= r.xp;
                return (
                  <div
                    key={r.title}
                    className="rounded-2xl bg-white p-6 border border-slate-100 flex flex-col"
                  >
                    <span className="self-start text-xs font-bold uppercase tracking-wider text-brand-gold">
                      {r.tag}
                    </span>
                    <h3 className="mt-3 font-serif text-lg font-bold text-brand-navy">{r.title}</h3>
                    <p className="mt-auto pt-6 text-2xl font-bold text-brand-navy">
                      {r.xp.toLocaleString()}{" "}
                      <span className="text-sm text-slate-500 font-medium">XP</span>
                    </p>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => canAfford && handleRedeem(r.title, r.xp)}
                      className={`mt-4 rounded-lg py-2.5 font-semibold text-sm transition ${
                        canAfford
                          ? "bg-brand-navy text-white hover:bg-brand-navy/90"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {canAfford ? "Redeem" : `Need ${(r.xp - currentXP).toLocaleString()} more XP`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
      <Toaster richColors position="top-right" />
    </div>
  );
}
