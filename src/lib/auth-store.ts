import { defaultSession, DEMO_USER, type AuthSession, type AuthUser } from "@/lib/auth-data";

const STORAGE_KEY = "study2earn-auth";

export function readAuth(): AuthSession {
  if (typeof window === "undefined") return defaultSession;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSession;
    const parsed = JSON.parse(raw) as AuthSession;
    return parsed.loggedIn && parsed.user ? parsed : defaultSession;
  } catch {
    return defaultSession;
  }
}

export function writeAuth(session: AuthSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("auth-change"));
}

export function isAuthenticated() {
  return readAuth().loggedIn;
}

export function signIn(user: AuthUser = DEMO_USER) {
  writeAuth({ loggedIn: true, user });
}

export function signOut() {
  writeAuth(defaultSession);
}

export function subscribeAuth(cb: () => void) {
  window.addEventListener("auth-change", cb);
  return () => window.removeEventListener("auth-change", cb);
}
