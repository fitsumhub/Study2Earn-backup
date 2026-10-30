import type { AuthUser } from "@/lib/auth-data";
import { STUDY_TRACK_LABELS } from "@/lib/auth-data";
import {
  leaderboard,
  leaderboardMonthly,
  leaderboardYearly,
  leaderboardByUniversity,
  universityStudents,
} from "@/lib/mock-data";

export type LeaderboardPeriod = "weekly" | "monthly" | "yearly" | "university";

export type LeaderboardStudent = {
  id: string;
  rank: number;
  name: string;
  uni: string;
  hours: string;
  xp: number;
  trend: string;
  avatarUrl?: string;
  department?: string;
  isYou?: boolean;
};

export type UniversityStudent = {
  id?: string;
  rank: number;
  name: string;
  department: string;
  hours: string;
  xp: number;
  trend: string;
  avatarUrl?: string;
  isYou?: boolean;
};

export type UniversityRanking = {
  rank: number;
  name: string;
  city: string;
  students: number;
  totalXp: number;
  avgXp: number;
  topStudent: string;
  trend: string;
  isMyUni?: boolean;
};

/**
 * Returns dynamic, profile-synchronized leaderboard entries for the requested period.
 * When the logged-in user updates their name, university, avatar, or department,
 * their entry immediately updates in real-time.
 */
export function getEffectiveLeaderboard(
  period: "weekly" | "monthly" | "yearly",
  user: AuthUser | null | undefined,
  currentXp?: number,
): LeaderboardStudent[] {
  const source =
    period === "weekly"
      ? leaderboard
      : period === "monthly"
        ? leaderboardMonthly
        : leaderboardYearly;

  const list: LeaderboardStudent[] = source.map((item) => ({
    ...item,
    isYou: user ? item.id === user.id || (user.id === "STU-8842" && item.id === "STU-8842") : false,
  }));

  if (user) {
    const effectiveXp = Math.max(currentXp ?? 0, user.xp ?? 0);
    const userDept =
      user.department ||
      (user.studyTrack ? STUDY_TRACK_LABELS[user.studyTrack] : undefined);

    // Look for existing user entry in this period
    const idx = list.findIndex(
      (s) =>
        s.id === user.id ||
        (user.id === "STU-8842" && s.id === "STU-8842") ||
        (period === "weekly" && s.id === "STU-8842"),
    );

    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        id: user.id,
        name: user.name,
        uni: user.university,
        avatarUrl: user.avatarUrl,
        department: userDept || list[idx].department,
        xp: Math.max(list[idx].xp, effectiveXp),
        isYou: true,
      };
    } else {
      // User is not in mock seed data (e.g. admin, dev, or new student) -> insert them
      list.push({
        id: user.id,
        rank: list.length + 1,
        name: user.name,
        uni: user.university,
        hours: "22h 14m",
        xp: effectiveXp > 0 ? effectiveXp : 1240,
        trend: "▲ Up 1",
        avatarUrl: user.avatarUrl,
        department: userDept || "Freshman",
        isYou: true,
      });
    }

    // Sort by XP descending so real rankings are accurate
    list.sort((a, b) => b.xp - a.xp);

    // Re-assign ranks 1..N
    list.forEach((item, index) => {
      item.rank = index + 1;
    });
  }

  return list;
}

/**
 * Returns dynamic students for a specific university, placing the user
 * under their chosen university with their updated profile attributes.
 */
export function getEffectiveUniversityStudents(
  universityName: string,
  user: AuthUser | null | undefined,
  currentXp?: number,
): UniversityStudent[] {
  const baseList: UniversityStudent[] = (universityStudents[universityName] ?? []).map((s) => ({
    ...s,
    isYou: false,
  }));

  if (!user) return baseList;

  const isUserUniversity =
    universityName.trim().toLowerCase() === user.university.trim().toLowerCase();

  if (isUserUniversity) {
    const effectiveXp = Math.max(currentXp ?? 0, user.xp ?? 0);
    const userDept =
      user.department ||
      (user.studyTrack ? STUDY_TRACK_LABELS[user.studyTrack] : undefined) ||
      "Natural Science";

    // Find if user already exists (by name, demo placeholder, or id)
    const idx = baseList.findIndex(
      (s) => s.id === user.id || s.name === user.name || (user.id === "STU-8842" && s.name === "Abebe Balcha"),
    );

    if (idx >= 0) {
      baseList[idx] = {
        ...baseList[idx],
        id: user.id,
        name: user.name,
        department: userDept,
        avatarUrl: user.avatarUrl,
        xp: Math.max(baseList[idx].xp, effectiveXp),
        isYou: true,
      };
    } else {
      baseList.push({
        id: user.id,
        rank: baseList.length + 1,
        name: user.name,
        department: userDept,
        hours: "22h 14m",
        xp: effectiveXp > 0 ? effectiveXp : 2640,
        trend: "▲ New",
        avatarUrl: user.avatarUrl,
        isYou: true,
      });
    }

    baseList.sort((a, b) => b.xp - a.xp);
    baseList.forEach((s, i) => {
      s.rank = i + 1;
    });
    return baseList;
  } else {
    // If the user previously had an entry in this university (e.g. default AAU Abebe Balcha)
    // but switched to another university in their profile, omit them from this university
    const filtered = baseList.filter(
      (s) =>
        s.id !== user.id &&
        s.name !== user.name &&
        !(user.id === "STU-8842" && s.name === "Abebe Balcha"),
    );
    filtered.forEach((s, i) => {
      s.rank = i + 1;
    });
    return filtered;
  }
}

/**
 * Returns university rankings with the user's university highlighted
 * and top student updated if the user holds #1 in their university.
 */
export function getEffectiveUniversityRankings(
  user: AuthUser | null | undefined,
  currentXp?: number,
): UniversityRanking[] {
  const effectiveXp = Math.max(currentXp ?? 0, user?.xp ?? 0);

  return leaderboardByUniversity.map((u) => {
    const isMyUni =
      !!user && u.name.trim().toLowerCase() === user.university.trim().toLowerCase();

    // If user belongs to this university and has higher XP than current top student, credit them
    const topStudent = isMyUni && effectiveXp > u.avgXp * 2 ? user.name : u.topStudent;

    return {
      ...u,
      topStudent,
      isMyUni,
    };
  });
}

/**
 * Helper to compute the user's current national rank across the platform.
 */
export function getUserNationalRank(
  user: AuthUser | null | undefined,
  currentXp?: number,
  period: "weekly" | "monthly" | "yearly" = "weekly",
): { rank: number; total: number; entry: LeaderboardStudent | null } {
  if (!user) return { rank: 0, total: 10, entry: null };
  const board = getEffectiveLeaderboard(period, user, currentXp);
  const entry = board.find((s) => s.isYou || s.id === user.id || s.name === user.name) ?? null;
  return {
    rank: entry?.rank ?? 10,
    total: board.length,
    entry,
  };
}
