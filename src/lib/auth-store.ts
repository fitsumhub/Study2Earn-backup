import { readAdminData, writeAdminData } from "@/lib/admin-store";
import {
  defaultSession,
  DEMO_ADMIN_USER,
  DEMO_DEV_USER,
  DEMO_USER,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth-data";

const STORAGE_KEY = "study2earn-auth";
const REGISTERED_USERS_KEY = "study2earn-registered-users";
const REMEMBER_EMAIL_KEY = "study2earn-remember-email";

function toBase64(str: string): string {
  try {
    if (typeof btoa !== "undefined") return btoa(str);
  } catch {
    // fallback below
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64");
  }
  return str;
}

export const DEFAULT_REGISTERED_USERS: AuthUser[] = [
  {
    ...DEMO_USER,
    passwordHash: toBase64("demo123"),
  },
  {
    ...DEMO_ADMIN_USER,
    passwordHash: toBase64("admin123"),
  },
  {
    ...DEMO_DEV_USER,
    passwordHash: toBase64("dev123"),
  },
  {
    id: "STU-8841",
    name: "Selamawit Tadesse",
    email: "selamawit@aau.edu.et",
    university: "Addis Ababa University",
    department: "Civil Engineering",
    xp: 4820,
    studyTrack: "natural",
    passwordHash: toBase64("student123"),
  },
  {
    id: "STU-8840",
    name: "Yonas Bekele",
    email: "yonas@ju.edu.et",
    university: "Jimma University",
    department: "Medicine",
    xp: 4150,
    studyTrack: "natural",
    passwordHash: toBase64("student123"),
  },
];

export function readRegisteredUsers(): AuthUser[] {
  if (typeof window === "undefined") return DEFAULT_REGISTERED_USERS;
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(DEFAULT_REGISTERED_USERS));
      return DEFAULT_REGISTERED_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_REGISTERED_USERS;
  } catch {
    return DEFAULT_REGISTERED_USERS;
  }
}

export function saveRegisteredUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  try {
    const users = readRegisteredUsers();
    const index = users.findIndex(
      (u) =>
        u.id === user.id ||
        (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()),
    );
    let updated: AuthUser[];
    if (index >= 0) {
      updated = [...users];
      updated[index] = { ...users[index], ...user };
    } else {
      updated = [user, ...users];
    }
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updated));

    // Also register in admin student store if not present
    const adminData = readAdminData();
    if (!adminData.users.some((u) => u.id === user.id)) {
      writeAdminData({
        ...adminData,
        users: [
          {
            id: user.id,
            name: user.name,
            university: user.university || "Ethiopian Student",
            program:
              user.department ||
              (user.studyTrack === "natural" ? "Natural Science" : "Social Science"),
            status: "active",
            joined: "Today",
            xp: user.xp,
          },
          ...adminData.users,
        ],
      });
    }
  } catch {
    // Ignore storage errors
  }
}

export function findRegisteredUser(email: string): AuthUser | undefined {
  const clean = email.trim().toLowerCase();
  const users = readRegisteredUsers();
  return users.find((u) => u.email.toLowerCase() === clean);
}

export function authenticateUser(
  email: string,
  password: string,
): {
  success: boolean;
  user?: AuthUser;
  error?: string;
  isNewAccount?: boolean;
} {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "Please enter your email address." };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  const users = readRegisteredUsers();
  // Support demo alias
  const existing = users.find(
    (u) =>
      u.email.toLowerCase() === cleanEmail ||
      (cleanEmail === "demo@study2earn.et" && u.id === DEMO_USER.id),
  );

  if (existing) {
    if (existing.passwordHash) {
      const inputHash = toBase64(password);
      const isDemo =
        existing.id === DEMO_USER.id ||
        existing.email.toLowerCase() === DEMO_USER.email.toLowerCase() ||
        cleanEmail === "demo@study2earn.et";

      // If user has specific password, verify it. For default demo user allow any 6+ char password as convenience.
      if (inputHash !== existing.passwordHash && !isDemo) {
        return {
          success: false,
          error: "Incorrect password. Please verify your credentials or try 'Enter demo'.",
        };
      }
    }
    return { success: true, user: existing };
  }

  // If user doesn't exist yet, automatically provision an account with this email
  const nameFromEmail = cleanEmail
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const isEduEt = cleanEmail.endsWith(".edu.et");
  const guessedUni = isEduEt ? "Addis Ababa University" : "";
  const passwordHash = toBase64(password);

  const newUser: AuthUser = {
    id: `STU-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
    name: nameFromEmail || "Ethiopian Scholar",
    email: cleanEmail,
    university: guessedUni,
    xp: 50,
    studyTrack: "natural",
    passwordHash,
  };

  saveRegisteredUser(newUser);
  return { success: true, user: newUser, isNewAccount: true };
}

export function getRememberedEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(REMEMBER_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

export function setRememberedEmail(email: string) {
  if (typeof window === "undefined") return;
  try {
    if (email.trim()) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  } catch {
    // ignore
  }
}

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

/** Merges a partial patch into the signed-in user's profile and synchronizes across all platform stores. */
export function updateUser(patch: Partial<AuthUser>) {
  const session = readAuth();
  if (!session.loggedIn || !session.user) return;
  const updatedUser: AuthUser = { ...session.user, ...patch };
  writeAuth({ loggedIn: true, user: updatedUser });
  saveRegisteredUser(updatedUser);

  // Sync to admin student management store if user has a corresponding row
  if (typeof window !== "undefined") {
    try {
      const adminData = readAdminData();
      let changed = false;
      const updatedUsers = adminData.users.map((u) => {
        if (u.id === updatedUser.id) {
          changed = true;
          return {
            ...u,
            name: updatedUser.name,
            university: updatedUser.university,
            program: updatedUser.department || u.program,
          };
        }
        return u;
      });
      if (changed) {
        writeAdminData({ ...adminData, users: updatedUsers });
      }
    } catch {
      // Ignore if admin store is not initialized
    }
    window.dispatchEvent(new CustomEvent("profile-updated", { detail: updatedUser }));
  }
}

export function subscribeAuth(cb: () => void) {
  window.addEventListener("auth-change", cb);
  return () => window.removeEventListener("auth-change", cb);
}
