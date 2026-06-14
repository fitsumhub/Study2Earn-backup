export type AuthUser = {
  id: string;
  name: string;
  email: string;
  university: string;
  xp: number;
};

export type AuthSession = {
  loggedIn: boolean;
  user: AuthUser | null;
};

export const DEMO_USER: AuthUser = {
  id: "STU-8842",
  name: "Abebe Balcha",
  email: "abebe.balcha@aau.edu.et",
  university: "Addis Ababa University",
  xp: 1240,
};

export const defaultSession: AuthSession = {
  loggedIn: false,
  user: null,
};

export const PROTECTED_ROUTES = ["/rewards", "/leaderboard"] as const;

export function isProtectedRoute(path: string) {
  return PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}
