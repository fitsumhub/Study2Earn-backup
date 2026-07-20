import { useCallback, useSyncExternalStore } from "react";

import { DEMO_USER, defaultSession, type AuthUser, type StudyTrack } from "@/lib/auth-data";
import { REFERRAL_FRIEND_BONUS } from "@/lib/referral-data";
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
      let startXp = 50;
      if (data.referralCode?.trim()) {
        recordReferralSignup(data.referralCode, data.name, data.university);
        startXp += REFERRAL_FRIEND_BONUS;
      }

      // Simulate secure password hashing
      const passwordHash = data.password ? btoa(data.password) : undefined;

      storeSignIn({
        id: `STU-${Date.now().toString().slice(-4)}`,
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
