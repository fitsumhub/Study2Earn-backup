import { useCallback, useSyncExternalStore } from "react";

import { DEMO_USER, defaultSession, type AuthUser, type StudyTrack } from "@/lib/auth-data";
import { recordReferralSignup } from "@/lib/referral-store";
import {
  authenticateUser,
  readAuth,
  saveRegisteredUser,
  signIn as storeSignIn,
  signOut as storeSignOut,
  subscribeAuth,
  updateUser as storeUpdateUser,
} from "@/lib/auth-store";
import type { AuthSession } from "@/lib/auth-data";

let cachedSession: AuthSession = defaultSession;

function refreshAuthCache() {
  cachedSession = readAuth();
}

function subscribe(callback: () => void) {
  refreshAuthCache();
  return subscribeAuth(() => {
    refreshAuthCache();
    callback();
  });
}

function getSnapshot() {
  return cachedSession;
}

function getServerSnapshot() {
  return defaultSession;
}

function toBase64(str: string): string {
  try {
    if (typeof btoa !== "undefined") return btoa(str);
  } catch {
    // fallback
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64");
  }
  return str;
}

// Enough entropy that a new signup can't accidentally land on DEMO_USER's id
// (and thus its admin role) — the old `Date.now().toString().slice(-4)`
// scheme cycled through only 10,000 values every 10 seconds.
function generateStudentId(): string {
  let id: string;
  do {
    id = `STU-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  } while (id === DEMO_USER.id);
  return id;
}

export function useAuth() {
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const signIn = useCallback((user?: AuthUser) => {
    storeSignIn(user ?? DEMO_USER);
  }, []);

  const authenticate = useCallback((email: string, password: string) => {
    const result = authenticateUser(email, password);
    if (result.success && result.user) {
      storeSignIn(result.user);
    }
    return result;
  }, []);

  const signUp = useCallback(
    (data: {
      name: string;
      email: string;
      university: string;
      studyTrack?: StudyTrack;
      referralCode?: string;
      password?: string;
    }) => {
      const newId = generateStudentId();
      let startXp = 50;
      if (data.referralCode?.trim()) {
        const bonus = recordReferralSignup(data.referralCode, data.name, data.university, newId);
        if (bonus) startXp += bonus;
      }

      // Simulate secure password hashing
      const passwordHash = data.password ? toBase64(data.password) : undefined;

      const newUser: AuthUser = {
        id: newId,
        name: data.name.trim() || DEMO_USER.name,
        email: data.email.trim() || DEMO_USER.email,
        university: data.university.trim() || DEMO_USER.university,
        xp: startXp,
        studyTrack: data.studyTrack,
        passwordHash,
      };

      saveRegisteredUser(newUser);
      storeSignIn(newUser);
      return newUser;
    },
    [],
  );

  const signOut = useCallback(() => {
    storeSignOut();
  }, []);

  const updateProfile = useCallback((patch: Partial<AuthUser>) => {
    storeUpdateUser(patch);
  }, []);

  return {
    ...session,
    signIn,
    authenticate,
    signUp,
    signOut,
    updateProfile,
  };
}
