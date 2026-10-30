import { useMemo } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import {
  getEffectiveLeaderboard,
  getEffectiveUniversityRankings,
  getEffectiveUniversityStudents,
  getUserNationalRank,
  type LeaderboardPeriod,
  type LeaderboardStudent,
  type UniversityRanking,
  type UniversityStudent,
} from "@/lib/leaderboard-store";

export function useLeaderboard() {
  const { user } = useAuth();
  const wallet = useWallet();
  const currentXp = wallet.lifetimeEarned;

  const weeklyBoard = useMemo(
    () => getEffectiveLeaderboard("weekly", user, currentXp),
    [user, currentXp],
  );

  const monthlyBoard = useMemo(
    () => getEffectiveLeaderboard("monthly", user, currentXp),
    [user, currentXp],
  );

  const yearlyBoard = useMemo(
    () => getEffectiveLeaderboard("yearly", user, currentXp),
    [user, currentXp],
  );

  const uniRankings = useMemo(
    () => getEffectiveUniversityRankings(user, currentXp),
    [user, currentXp],
  );

  const nationalRankInfo = useMemo(
    () => getUserNationalRank(user, currentXp, "weekly"),
    [user, currentXp],
  );

  const getBoard = (period: "weekly" | "monthly" | "yearly"): LeaderboardStudent[] => {
    switch (period) {
      case "weekly":
        return weeklyBoard;
      case "monthly":
        return monthlyBoard;
      case "yearly":
        return yearlyBoard;
    }
  };

  const getUniStudents = (uniName: string): UniversityStudent[] => {
    return getEffectiveUniversityStudents(uniName, user, currentXp);
  };

  return {
    user,
    currentXp,
    weeklyBoard,
    monthlyBoard,
    yearlyBoard,
    uniRankings,
    nationalRank: nationalRankInfo.rank,
    myWeeklyEntry: nationalRankInfo.entry,
    getBoard,
    getUniStudents,
  };
}
