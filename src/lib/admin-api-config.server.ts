/**
 * Server-only admin API configuration persistence.
 * Writes admin-saved API keys and provider settings to `.admin-api-config.json`
 * in the project root, so they survive server restarts without .env edits.
 *
 * Priority chain for API key resolution (highest to lowest):
 *   1. Admin-saved config (this file, .admin-api-config.json)
 *   2. process.env (deployment env vars / .env file)
 *   3. Empty string (no key)
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// File lives next to package.json — never committed if added to .gitignore
const CONFIG_PATH = path.resolve(process.cwd(), ".admin-api-config.json");

export type AiProviderSettings = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  enabled?: boolean;
};

export type AdminApiConfig = {
  version: number;
  activeProvider: string;
  aiEnabled: boolean;
  providers: {
    gemini: AiProviderSettings;
    openai: AiProviderSettings;
    anthropic: AiProviderSettings;
    deepseek: AiProviderSettings;
    groq: AiProviderSettings;
    custom: AiProviderSettings;
  };
  updatedAt: string;
};

const DEFAULTS: AdminApiConfig = {
  version: 1,
  activeProvider: "gemini",
  aiEnabled: true,
  providers: {
    gemini: {
      apiKey: "",
      model: "gemini-flash-lite-latest",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
      enabled: true,
    },
    openai: {
      apiKey: "",
      model: "gpt-4o-mini",
      baseUrl: "https://api.openai.com/v1",
      enabled: false,
    },
    anthropic: {
      apiKey: "",
      model: "claude-3-5-haiku-20241022",
      baseUrl: "https://api.anthropic.com",
      enabled: false,
    },
    deepseek: {
      apiKey: "",
      model: "deepseek-chat",
      baseUrl: "https://api.deepseek.com",
      enabled: false,
    },
    groq: {
      apiKey: "",
      model: "llama-3.3-70b-versatile",
      baseUrl: "https://api.groq.com/openai/v1",
      enabled: false,
    },
    custom: {
      apiKey: "",
      model: "",
      baseUrl: "",
      enabled: false,
    },
  },
  updatedAt: new Date().toISOString(),
};

/** Read the persisted admin API config file. Returns defaults if not found or invalid. */
export function readAdminApiConfig(): AdminApiConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      const parsed = JSON.parse(raw) as Partial<AdminApiConfig>;
      // Deep merge with defaults to handle partial/old configs
      return {
        ...DEFAULTS,
        ...parsed,
        providers: {
          ...DEFAULTS.providers,
          ...(parsed.providers || {}),
          gemini: { ...DEFAULTS.providers.gemini, ...(parsed.providers?.gemini || {}) },
          openai: { ...DEFAULTS.providers.openai, ...(parsed.providers?.openai || {}) },
          anthropic: { ...DEFAULTS.providers.anthropic, ...(parsed.providers?.anthropic || {}) },
          deepseek: { ...DEFAULTS.providers.deepseek, ...(parsed.providers?.deepseek || {}) },
          groq: { ...DEFAULTS.providers.groq, ...(parsed.providers?.groq || {}) },
          custom: { ...DEFAULTS.providers.custom, ...(parsed.providers?.custom || {}) },
        },
      };
    }
  } catch {
    // Fall through to defaults
  }
  return { ...DEFAULTS };
}

/** Persist admin API config to the JSON file. */
export function writeAdminApiConfig(config: AdminApiConfig): void {
  const updated = { ...config, updatedAt: new Date().toISOString() };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
}

/** Get the resolved API key for a provider — admin config takes priority over env vars. */
export function resolveApiKey(provider: string): string {
  const adminConfig = readAdminApiConfig();

  const providerKey = provider as keyof typeof adminConfig.providers;
  const adminKey = adminConfig.providers[providerKey]?.apiKey?.trim();
  if (adminKey && adminKey.length > 0) return adminKey;

  // Fallback to environment variables
  const envMap: Record<string, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    groq: process.env.GROQ_API_KEY,
    custom: process.env.CUSTOM_AI_API_KEY,
  };

  return envMap[provider]?.trim() || "";
}

/** Get the resolved model for a provider. */
export function resolveModel(provider: string): string {
  const adminConfig = readAdminApiConfig();
  const providerKey = provider as keyof typeof adminConfig.providers;
  return adminConfig.providers[providerKey]?.model?.trim() || DEFAULTS.providers[providerKey]?.model || "gemini-flash-lite-latest";
}

/** Get the resolved base URL for a provider. */
export function resolveBaseUrl(provider: string): string | undefined {
  const adminConfig = readAdminApiConfig();
  const providerKey = provider as keyof typeof adminConfig.providers;
  return adminConfig.providers[providerKey]?.baseUrl?.trim() || DEFAULTS.providers[providerKey]?.baseUrl;
}

/** Get complete resolved settings for a provider. */
export function resolveProviderSettings(provider: string): { apiKey: string; model: string; baseUrl?: string } {
  return {
    apiKey: resolveApiKey(provider),
    model: resolveModel(provider),
    baseUrl: resolveBaseUrl(provider),
  };
}

/** Get the currently active provider from admin config. */
export function resolveActiveProvider(): { provider: string; apiKey: string; model: string; baseUrl?: string } {
  const config = readAdminApiConfig();
  const provider = config.activeProvider || "gemini";
  const settings = resolveProviderSettings(provider);
  // If active provider has no key, try gemini as fallback
  if (!settings.apiKey) {
    const gemini = resolveProviderSettings("gemini");
    if (gemini.apiKey) return { provider: "gemini", ...gemini };
  }
  return { provider, ...settings };
}
