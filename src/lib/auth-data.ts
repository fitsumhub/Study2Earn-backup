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
  department?: string;
  bio?: string;
  xp: number;
  studyTrack?: StudyTrack;
  role?: "admin" | "developer" | "student";
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
  department: "Computer Science",
  xp: 1240,
  studyTrack: "natural",
  role: "admin",
};

export const DEMO_ADMIN_USER: AuthUser = {
  id: "ADM-001",
  name: "Abebe Balcha (Admin)",
  email: "admin@study2earn.et",
  university: "Addis Ababa University",
  department: "Information Systems",
  xp: 5000,
  studyTrack: "natural",
  role: "admin",
};

export const DEMO_DEV_USER: AuthUser = {
  id: "DEV-007",
  name: "Fitsum (Lead Developer)",
  email: "developer@study2earn.et",
  university: "AASTU (Software Engineering)",
  department: "Software Engineering",
  xp: 99999,
  studyTrack: "natural",
  role: "developer",
};

export function isAdminUser(user: AuthUser | null | undefined) {
  if (!user) return false;
  if (user.role === "admin" || user.role === "developer") return true;
  return (
    user.id === DEMO_USER.id ||
    user.id === DEMO_ADMIN_USER.id ||
    user.id === DEMO_DEV_USER.id
  );
}

export function isDeveloperUser(user: AuthUser | null | undefined) {
  if (!user) return false;
  return user.role === "developer" || user.id === DEMO_DEV_USER.id;
}

export const defaultSession: AuthSession = {
  loggedIn: false,
  user: null,
};

export const PROTECTED_ROUTES = ["/rewards", "/leaderboard"] as const;

export function isProtectedRoute(path: string) {
  return PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}
