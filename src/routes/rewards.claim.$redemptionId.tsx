import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";

import { PageLoader } from "@/components/page-loader";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { getRedemptionById, type RedemptionRecord } from "@/lib/redemption-store";
import { kindMeta, kindOf } from "@/lib/reward-kind";

export const Route = createFileRoute("/rewards/claim/$redemptionId")({
  head: ({ params }) => ({
    meta: [{ title: `Reward claim ${params.redemptionId} — Study2Earn` }],
  }),
  component: RewardClaimPage,
});

function RewardClaimPage() {
  const { redemptionId } = Route.useParams();
  const [record, setRecord] = useState<RedemptionRecord | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecord(getRedemptionById(redemptionId));
    setReady(true);
  }, [redemptionId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 px-6">
        <div className="mx-auto max-w-lg">
          {!ready ? (
            <PageLoader label="Loading your voucher…" />
          ) : !record ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <h1 className="font-serif text-xl font-bold text-brand-navy">Voucher not found</h1>
              <p className="mt-2 text-sm text-slate-500">
                This reward may have expired or the link is invalid.
              </p>
              <Button asChild className="mt-6">
                <Link to="/rewards">Back to rewards</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-brand-gold/40 bg-white p-8 shadow-lg print:shadow-none print:border-brand-navy">
              <div className="mb-6 flex items-start justify-between gap-4 print:hidden">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
                    Study2Earn
                  </p>
                  <h1 className="font-serif text-2xl font-bold text-brand-navy">
                    Redemption receipt
                  </h1>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="size-4" />
                  Print
                </Button>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Reward
                  </p>
                  <p className="mt-1 font-serif text-xl font-bold text-brand-navy">
                    {record.title}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Category
                    </p>
                    <p className="mt-1 font-medium text-brand-navy">
                      {kindMeta[kindOf(record.tag, record.title)].label}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      XP spent
                    </p>
                    <p className="mt-1 font-medium text-brand-navy">
                      {record.xp.toLocaleString()} XP
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-brand-navy/5 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Receipt code
                  </p>
                  <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-brand-navy">
                    {record.voucherCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Redeemed
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{record.redeemedAt}</p>
                </div>
                <p className="text-xs text-slate-500">
                  This reward was applied to your account automatically the moment you redeemed it —
                  no further action needed. Keep this receipt code for your records; quote it if you
                  ever need to contact support about this redemption.
                </p>
              </div>

              <div className="mt-8 flex gap-3 print:hidden">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/rewards">Back to wallet</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
