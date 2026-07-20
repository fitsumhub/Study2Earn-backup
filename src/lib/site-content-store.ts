export type FaqEntry = { id: string; q: string; a: string };

export type SiteContent = {
  hero: {
    eyebrow: string;
    eyebrowFlash: string;
    headline: string;
    headlineAccent: string;
    amharic: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  trustStrip: [string, string, string];
  announcement: {
    enabled: boolean;
    message: string;
    linkLabel: string;
    linkUrl: string;
  };
  faqs: FaqEntry[];
};

// The exact copy that was hardcoded on the homepage before this store existed —
// kept as the default so nothing on the public site changes until an admin
// actually edits something here.
export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    eyebrow: "2026 Freshman Exit Prep",
    eyebrowFlash: "🔥 Exam season is here",
    headline: "Master your exams,",
    headlineAccent: "Earn your future.",
    amharic: "የፈተናዎን ያሸንፉ፣ የወደፊትዎን ይሰሩ።",
    description:
      "The first gamified preparation platform built specifically for Ethiopian freshman students. Access the full MoE curriculum, practice real exam scenarios, and earn rewards as you learn.",
    primaryCta: "Start Studying — It's Free",
    secondaryCta: "Browse Library",
  },
  trustStrip: ["12,470 students enrolled", "95% first-attempt pass rate", "100% free — always"],
  announcement: {
    enabled: false,
    message: "New: withdraw straight to USDT via Binance — no minimum wait.",
    linkLabel: "Learn more",
    linkUrl: "/rewards",
  },
  faqs: [
    {
      id: "faq-1",
      q: "What is the Ethiopian freshman Exit Exam?",
      a: "The Exit Exam (formerly Matric Exam) is a national standardized test that all first-year university students in Ethiopia must pass to continue their studies. It covers core subjects including Math, English, Physics, Biology, Chemistry, History, and more.",
    },
    {
      id: "faq-2",
      q: "How do I earn XP and ETB on Study2Earn?",
      a: "You earn XP in two ways: verified reading time (every 30 minutes of PDF reading earns XP) and mock exam performance (up to 200 XP per chapter, with bonus XP for first-time passes). 8 XP = 1 ETB, withdrawable to any major Ethiopian bank.",
    },
    {
      id: "faq-3",
      q: "Is the content from the official curriculum?",
      a: "Yes. All textbooks are sourced from the Ministry of Education's official freshman curriculum. We do not add external or unofficial materials. Chapter mock exams mirror the style and difficulty of the real Exit Exam.",
    },
    {
      id: "faq-4",
      q: "How do I withdraw my earnings?",
      a: "Once you reach the minimum withdrawal threshold (50 ETB), go to Rewards → Withdraw and enter your account details. We support CBE, Awash, Dashen, Abyssinia, and 11 other Ethiopian banks, plus USDT via Binance.",
    },
    {
      id: "faq-5",
      q: "Is Study2Earn free to use?",
      a: "Yes — reading the library and taking mock exams is completely free. You earn rewards on top of studying, not by paying. Premium features (AI study packs, extra mock banks) are being planned for a future season.",
    },
    {
      id: "faq-6",
      q: "How does the referral program work?",
      a: "Share your unique referral link with a classmate. When they register and complete their first exam, you both earn bonus XP. There's no limit on how many friends you can refer.",
    },
  ],
};

const STORAGE_KEY = "study2earn-site-content";

function isFaqEntry(x: unknown): x is FaqEntry {
  return (
    !!x &&
    typeof x === "object" &&
    typeof (x as FaqEntry).id === "string" &&
    typeof (x as FaqEntry).q === "string" &&
    typeof (x as FaqEntry).a === "string"
  );
}

/** Merges stored data over the defaults so a partially-old shape (after an app update) never crashes the page. */
function normalize(raw: Partial<SiteContent> | null | undefined): SiteContent {
  if (!raw) return DEFAULT_SITE_CONTENT;
  return {
    hero: { ...DEFAULT_SITE_CONTENT.hero, ...raw.hero },
    trustStrip:
      Array.isArray(raw.trustStrip) && raw.trustStrip.length === 3
        ? (raw.trustStrip as [string, string, string])
        : DEFAULT_SITE_CONTENT.trustStrip,
    announcement: { ...DEFAULT_SITE_CONTENT.announcement, ...raw.announcement },
    faqs:
      Array.isArray(raw.faqs) && raw.faqs.every(isFaqEntry) ? raw.faqs : DEFAULT_SITE_CONTENT.faqs,
  };
}

export function readSiteContent(): SiteContent {
  if (typeof window === "undefined") return DEFAULT_SITE_CONTENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw) as Partial<SiteContent>) : DEFAULT_SITE_CONTENT;
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export function writeSiteContent(content: SiteContent) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  window.dispatchEvent(new Event("site-content-change"));
}

export function subscribeSiteContent(cb: () => void) {
  window.addEventListener("site-content-change", cb);
  return () => window.removeEventListener("site-content-change", cb);
}
