import { useCallback, useSyncExternalStore } from "react";

import { DEMO_USER, defaultSession, type AuthUser, type StudyTrack } from "@/lib/auth-data";
import { recordReferralSignup } from "@/lib/referral-store";
import {
  readAuth,
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
      const passwordHash = data.password ? btoa(data.password) : undefined;

      storeSignIn({
        id: newId,
        name: data.name.trim() || DEMO_USER.name,
        email: data.email.trim() || DEMO_USER.email,
        university: data.university.trim() || DEMO_USER.university,
        xp: startXp,
        studyTrack: data.studyTrack,
        passwordHash,
      });
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
    signUp,
    signOut,
    updateProfile,
  };
}
