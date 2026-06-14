import { useCallback, useSyncExternalStore } from "react";

import { DEMO_USER, type AuthUser } from "@/lib/auth-data";
import {
  readAuth,
  signIn as storeSignIn,
  signOut as storeSignOut,
  subscribeAuth,
} from "@/lib/auth-store";

function getSnapshot() {
  return readAuth();
}

export function useAuth() {
  const session = useSyncExternalStore(subscribeAuth, getSnapshot, getSnapshot);

  const signIn = useCallback((user?: AuthUser) => {
    storeSignIn(user ?? DEMO_USER);
  }, []);

  const signUp = useCallback((data: { name: string; email: string; university: string }) => {
    storeSignIn({
      id: `STU-${Date.now().toString().slice(-4)}`,
      name: data.name.trim() || DEMO_USER.name,
      email: data.email.trim() || DEMO_USER.email,
      university: data.university.trim() || DEMO_USER.university,
      xp: 50,
    });
  }, []);

  const signOut = useCallback(() => {
    storeSignOut();
  }, []);

  return {
    ...session,
    signIn,
    signUp,
    signOut,
  };
}
