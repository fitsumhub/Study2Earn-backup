import { useMemo } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useExamProgress } from "@/hooks/use-exam-progress";
import { useLibraryProgress } from "@/hooks/use-library-progress";
import { useRedemptions } from "@/hooks/use-redemptions";
import { useReferral } from "@/hooks/use-referral";
import { useWithdrawals } from "@/hooks/use-withdrawals";

export function useWallet() {
  const { loggedIn, user } = useAuth();
  const { getOverallStats } = useExamProgress();
  const { totalReferralXp } = useReferral();
  const { totalLibraryXp } = useLibraryProgress();
  const { pendingXp } = useWithdrawals();
  const { totalRedeemedXp, redemptionCount } = useRedemptions();

  const baseXp = loggedIn && user ? user.xp : 0;
  const referralXp = totalReferralXp;
  const libraryXp = totalLibraryXp;

  return useMemo(() => {
    const examStats = getOverallStats();
    const examXp = examStats.totalXp;
    const lifetimeEarned = baseXp + examXp + referralXp + libraryXp;
    const spentXp = totalRedeemedXp + pendingXp;
    const balance = Math.max(0, lifetimeEarned - spentXp);

    return {
      balance,
      lifetimeEarned,
      baseXp,
      examXp,
      referralXp,
      libraryXp,
      redeemedXp: totalRedeemedXp,
      pendingXp,
      redemptionCount,
      examStats,
    };
  }, [baseXp, referralXp, libraryXp, totalRedeemedXp, pendingXp, redemptionCount, getOverallStats]);
}
