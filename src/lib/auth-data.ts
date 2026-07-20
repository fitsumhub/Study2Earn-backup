export type StudyTrack = "natural" | "social";

export const STUDY_TRACK_LABELS: Record<StudyTrack, string> = {
  natural: "Natural Science",
  social: "Social Science",
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  university: string;
  xp: number;
  studyTrack?: StudyTrack;
  role?: "admin" | "student";
  passwordHash?: string;
  /** Either a `local:<id>` pointer into the media store, or a direct URL. */
  avatarUrl?: string;
};

export type AuthSession = {
  loggedIn: boolean;
  user: AuthUser | null;
};

export const DEMO_USER: AuthUser = {
  id: "STU-8842",
  name: "Abebe Balcha",
  email: "aplusethiopia1@gmail.com",
  university: "Addis Ababa University",
  xp: 1240,
  studyTrack: "natural",
  role: "admin",
};

export function isAdminUser(user: AuthUser | null | undefined) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.id === DEMO_USER.id;
}

export const defaultSession: AuthSession = {
  loggedIn: false,
  user: null,
};

export const PROTECTED_ROUTES = ["/rewards", "/leaderboard"] as const;

export function isProtectedRoute(path: string) {
  return PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}
