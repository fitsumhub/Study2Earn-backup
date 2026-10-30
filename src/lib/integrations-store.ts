/**
 * Third-party integration settings — admin-managed API keys and embed config
 * that the public site reads to enable optional integrations (ad networks,
 * analytics, etc.). Client-side demo store: values live in this browser's
 * localStorage, same pattern as ad-store.ts.
 */

export type CustomApiKey = {
  id: string;
  label: string;
  value: string;
};

export type AiStudyProvider =
  | "openai"
  | "anthropic"
  | "deepseek"
  | "groq"
  | "gemini"
  | "custom";

export type ProviderConnectionSettings = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

export const DEFAULT_AI_SYSTEM_PROMPT =
  "You write exam-style multiple-choice study material for Ethiopian Ministry of Education freshman Exit Exam preparation. Base every question strictly on the provided source text — never invent facts outside it. Each question has exactly 4 options with exactly one correct answer and a short explanation.";

export const DEFAULT_PROVIDER_SETTINGS: Record<AiStudyProvider, ProviderConnectionSettings> = {
  openai: {
    apiKey: "",
    model: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
  },
  anthropic: {
    apiKey: "",
    model: "claude-3-5-sonnet-20241022",
    baseUrl: "https://api.anthropic.com",
  },
  deepseek: {
    apiKey: "",
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com",
  },
  groq: {
    apiKey: "",
    model: "llama-3.3-70b-versatile",
    baseUrl: "https://api.groq.com/openai/v1",
  },
  gemini: {
    apiKey: "",
    model: "gemini-flash-lite-latest",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
  },
  custom: {
    apiKey: "",
    model: "",
    baseUrl: "",
  },
};

export type IntegrationsConfig = {
  googleAdsense: {
    publisherId: string;
    enabled: boolean;
  };
  aiStudy: {
    enabled: boolean;
    provider: AiStudyProvider;
    deepseekModel: string;
    custom: {
      label: string;
      baseUrl: string;
      model: string;
    };
    apiKey?: string;
    systemPrompt?: string;
    temperature?: number;
    defaultQuestionCount?: number;
    maxQuestionLimit?: number;
    tutorPersona?: "socratic" | "strict_exam" | "friendly_tutor";
    tutorTone?: "academic" | "simplified" | "exam_prep";
    fallbackMode?: "question_bank" | "strict_error";
    enableAmharicSupport?: boolean;
    suggestedPrompts?: string[];
    providers?: Record<AiStudyProvider, ProviderConnectionSettings>;
  };
  customKeys: CustomApiKey[];
};

export const DEFAULT_SUGGESTED_PROMPTS = [
  "Explain with an Ethiopian real-world example",
  "Give me a 5-question pop quiz on this topic",
  "What are the most common exam traps for this concept?",
  "Summarize the key formulas and when they apply",
];

export const DEFAULT_INTEGRATIONS: IntegrationsConfig = {
  googleAdsense: {
    publisherId: "",
    enabled: false,
  },
  aiStudy: {
    enabled: true,
    provider: "gemini",
    deepseekModel: "deepseek-chat",
    custom: {
      label: "",
      baseUrl: "",
      model: "",
    },
    apiKey: "",
    systemPrompt: DEFAULT_AI_SYSTEM_PROMPT,
    temperature: 0.3,
    defaultQuestionCount: 5,
    maxQuestionLimit: 20,
    tutorPersona: "socratic",
    tutorTone: "academic",
    fallbackMode: "question_bank",
    enableAmharicSupport: true,
    suggestedPrompts: DEFAULT_SUGGESTED_PROMPTS,
    providers: DEFAULT_PROVIDER_SETTINGS,
  },
  customKeys: [],
};

const AI_STUDY_PROVIDERS: AiStudyProvider[] = [
  "openai",
  "anthropic",
  "deepseek",
  "groq",
  "gemini",
  "custom",
];

const STORAGE_KEY = "study2earn-integrations";
export const INTEGRATIONS_CHANGE_EVENT = "integrations-change";

function normalize(raw: unknown): IntegrationsConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_INTEGRATIONS;
  const value = raw as Partial<IntegrationsConfig>;
  const adsense = value.googleAdsense;
  const aiStudy = value.aiStudy;

  let currentProvider = AI_STUDY_PROVIDERS.includes(aiStudy?.provider as AiStudyProvider)
    ? (aiStudy!.provider as AiStudyProvider)
    : "gemini";

  const rawProviders = (aiStudy?.providers || {}) as Partial<
    Record<AiStudyProvider, ProviderConnectionSettings>
  >;

  // If user currently had anthropic selected without an API key, switch to gemini since a valid key is provided
  if (currentProvider === "anthropic" && !rawProviders.anthropic?.apiKey) {
    currentProvider = "gemini";
  }

  const mergedProviders: Record<AiStudyProvider, ProviderConnectionSettings> = {
    openai: {
      ...DEFAULT_PROVIDER_SETTINGS.openai,
      ...(rawProviders.openai || {}),
    },
    anthropic: {
      ...DEFAULT_PROVIDER_SETTINGS.anthropic,
      ...(rawProviders.anthropic || {}),
    },
    deepseek: {
      ...DEFAULT_PROVIDER_SETTINGS.deepseek,
      ...(rawProviders.deepseek || {}),
      model:
        typeof aiStudy?.deepseekModel === "string" && aiStudy.deepseekModel.trim()
          ? aiStudy.deepseekModel
          : rawProviders.deepseek?.model || DEFAULT_PROVIDER_SETTINGS.deepseek.model,
    },
    groq: {
      ...DEFAULT_PROVIDER_SETTINGS.groq,
      ...(rawProviders.groq || {}),
    },
    gemini: {
      ...DEFAULT_PROVIDER_SETTINGS.gemini,
      ...(rawProviders.gemini || {}),
      apiKey:
        rawProviders.gemini?.apiKey?.trim() &&
        (rawProviders.gemini.apiKey.startsWith("AQ.") || rawProviders.gemini.apiKey.startsWith("AIza"))
          ? rawProviders.gemini.apiKey.trim()
          : DEFAULT_PROVIDER_SETTINGS.gemini.apiKey,
      model:
        rawProviders.gemini?.model?.trim() &&
        !rawProviders.gemini.model.includes("1.5-flash") &&
        !rawProviders.gemini.model.includes("2.5-flash-lite") &&
        !rawProviders.gemini.model.includes("llama") &&
        !rawProviders.gemini.model.includes("gpt")
          ? rawProviders.gemini.model.trim()
          : DEFAULT_PROVIDER_SETTINGS.gemini.model,
    },
    custom: {
      ...DEFAULT_PROVIDER_SETTINGS.custom,
      ...(rawProviders.custom || {}),
      baseUrl:
        typeof aiStudy?.custom?.baseUrl === "string" && aiStudy.custom.baseUrl.trim()
          ? aiStudy.custom.baseUrl
          : rawProviders.custom?.baseUrl || "",
      model:
        typeof aiStudy?.custom?.model === "string" && aiStudy.custom.model.trim()
          ? aiStudy.custom.model
          : rawProviders.custom?.model || "",
    },
  };

  return {
    googleAdsense: {
      publisherId: typeof adsense?.publisherId === "string" ? adsense.publisherId : "",
      enabled: adsense?.enabled === true,
    },
    aiStudy: {
      enabled: aiStudy?.enabled !== false,
      provider: currentProvider,
      deepseekModel:
        typeof aiStudy?.deepseekModel === "string" && aiStudy.deepseekModel.trim()
          ? aiStudy.deepseekModel
          : mergedProviders.deepseek.model,
      custom: {
        label: typeof aiStudy?.custom?.label === "string" ? aiStudy.custom.label : "",
        baseUrl:
          typeof aiStudy?.custom?.baseUrl === "string"
            ? aiStudy.custom.baseUrl
            : mergedProviders.custom.baseUrl || "",
        model:
          typeof aiStudy?.custom?.model === "string"
            ? aiStudy.custom.model
            : mergedProviders.custom.model,
      },
      apiKey:
        typeof aiStudy?.apiKey === "string" && aiStudy.apiKey.trim().length > 0
          ? (currentProvider === "gemini" &&
             !aiStudy.apiKey.startsWith("AQ.") &&
             !aiStudy.apiKey.startsWith("AIza")
              ? DEFAULT_PROVIDER_SETTINGS.gemini.apiKey
              : aiStudy.apiKey.trim())
          : mergedProviders[currentProvider]?.apiKey || DEFAULT_PROVIDER_SETTINGS.gemini.apiKey,
      systemPrompt:
        typeof aiStudy?.systemPrompt === "string" && aiStudy.systemPrompt.trim()
          ? aiStudy.systemPrompt
          : DEFAULT_AI_SYSTEM_PROMPT,
      temperature:
        typeof aiStudy?.temperature === "number" && !Number.isNaN(aiStudy.temperature)
          ? Math.max(0, Math.min(1, aiStudy.temperature))
          : 0.3,
      defaultQuestionCount:
        typeof aiStudy?.defaultQuestionCount === "number" && !Number.isNaN(aiStudy.defaultQuestionCount)
          ? Math.max(1, Math.min(20, aiStudy.defaultQuestionCount))
          : 5,
      maxQuestionLimit:
        typeof aiStudy?.maxQuestionLimit === "number" && !Number.isNaN(aiStudy.maxQuestionLimit)
          ? Math.max(3, Math.min(50, aiStudy.maxQuestionLimit))
          : 20,
      tutorPersona:
        aiStudy?.tutorPersona && ["socratic", "strict_exam", "friendly_tutor"].includes(aiStudy.tutorPersona)
          ? aiStudy.tutorPersona
          : "socratic",
      tutorTone:
        aiStudy?.tutorTone && ["academic", "simplified", "exam_prep"].includes(aiStudy.tutorTone)
          ? aiStudy.tutorTone
          : "academic",
      fallbackMode: aiStudy?.fallbackMode === "strict_error" ? "strict_error" : "question_bank",
      enableAmharicSupport: aiStudy?.enableAmharicSupport !== false,
      suggestedPrompts:
        Array.isArray(aiStudy?.suggestedPrompts) && aiStudy.suggestedPrompts.length > 0
          ? aiStudy.suggestedPrompts
          : DEFAULT_SUGGESTED_PROMPTS,
      providers: mergedProviders,
    },
    customKeys: Array.isArray(value.customKeys)
      ? value.customKeys.filter(
          (k): k is CustomApiKey =>
            !!k &&
            typeof k === "object" &&
            typeof (k as CustomApiKey).id === "string" &&
            typeof (k as CustomApiKey).label === "string" &&
            typeof (k as CustomApiKey).value === "string",
        )
      : [],
  };
}

export function readIntegrations(): IntegrationsConfig {
  if (typeof window === "undefined") return DEFAULT_INTEGRATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INTEGRATIONS;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_INTEGRATIONS;
  }
}

export function writeIntegrations(config: IntegrationsConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(INTEGRATIONS_CHANGE_EVENT));
}

export function subscribeIntegrations(cb: () => void) {
  window.addEventListener(INTEGRATIONS_CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(INTEGRATIONS_CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Basic shape check for a Google AdSense publisher id, e.g. "ca-pub-1234567890123456". */
export function isValidAdsensePublisherId(value: string): boolean {
  return /^ca-pub-\d{10,20}$/.test(value.trim());
}
