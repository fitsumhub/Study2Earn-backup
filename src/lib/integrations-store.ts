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

export type AiStudyProvider = "anthropic" | "deepseek" | "custom";

export type IntegrationsConfig = {
  googleAdsense: {
    publisherId: string;
    enabled: boolean;
  };
  /** Which generation provider AI Study is currently pointed at, plus non-secret
   * per-provider settings (model, custom endpoint). No API key ever lives here —
   * each provider's key is server-side only (ANTHROPIC_API_KEY, DEEPSEEK_API_KEY,
   * CUSTOM_AI_API_KEY env vars). `enabled` is a kill switch that forces the
   * built-in simulated question bank regardless of provider configuration. */
  aiStudy: {
    enabled: boolean;
    provider: AiStudyProvider;
    deepseekModel: string;
    custom: {
      label: string;
      baseUrl: string;
      model: string;
    };
  };
  customKeys: CustomApiKey[];
};

export const DEFAULT_INTEGRATIONS: IntegrationsConfig = {
  googleAdsense: {
    publisherId: "",
    enabled: false,
  },
  aiStudy: {
    enabled: true,
    provider: "anthropic",
    deepseekModel: "deepseek-chat",
    custom: {
      label: "",
      baseUrl: "",
      model: "",
    },
  },
  customKeys: [],
};

const AI_STUDY_PROVIDERS: AiStudyProvider[] = ["anthropic", "deepseek", "custom"];

const STORAGE_KEY = "study2earn-integrations";
export const INTEGRATIONS_CHANGE_EVENT = "integrations-change";

function normalize(raw: unknown): IntegrationsConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_INTEGRATIONS;
  const value = raw as Partial<IntegrationsConfig>;
  const adsense = value.googleAdsense;
  const aiStudy = value.aiStudy;
  return {
    googleAdsense: {
      publisherId: typeof adsense?.publisherId === "string" ? adsense.publisherId : "",
      enabled: adsense?.enabled === true,
    },
    aiStudy: {
      enabled: aiStudy?.enabled !== false,
      provider: AI_STUDY_PROVIDERS.includes(aiStudy?.provider as AiStudyProvider)
        ? (aiStudy!.provider as AiStudyProvider)
        : "anthropic",
      deepseekModel:
        typeof aiStudy?.deepseekModel === "string" && aiStudy.deepseekModel.trim()
          ? aiStudy.deepseekModel
          : "deepseek-chat",
      custom: {
        label: typeof aiStudy?.custom?.label === "string" ? aiStudy.custom.label : "",
        baseUrl: typeof aiStudy?.custom?.baseUrl === "string" ? aiStudy.custom.baseUrl : "",
        model: typeof aiStudy?.custom?.model === "string" ? aiStudy.custom.model : "",
      },
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
