/**
 * Server functions for admin API configuration management.
 * These run on the server and have access to the filesystem for persistence.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ProviderSettingsSchema = z.object({
  apiKey: z.string(),
  model: z.string(),
  baseUrl: z.string().optional(),
  enabled: z.boolean().optional(),
});

const SaveAdminApiConfigSchema = z.object({
  activeProvider: z.string(),
  aiEnabled: z.boolean(),
  providers: z.object({
    gemini: ProviderSettingsSchema,
    openai: ProviderSettingsSchema,
    anthropic: ProviderSettingsSchema,
    deepseek: ProviderSettingsSchema,
    groq: ProviderSettingsSchema,
    custom: ProviderSettingsSchema,
  }),
});

/** Save admin API configuration to server-side persistent storage */
export const saveAdminApiConfigFn = createServerFn({ method: "POST" })
  .validator(SaveAdminApiConfigSchema)
  .handler(async ({ data }) => {
    const { writeAdminApiConfig, readAdminApiConfig } = await import("../admin-api-config.server");
    const existing = readAdminApiConfig();
    writeAdminApiConfig({
      ...existing,
      activeProvider: data.activeProvider,
      aiEnabled: data.aiEnabled,
      providers: data.providers,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true, message: "API configuration saved successfully." };
  });

/** Load admin API configuration from server-side persistent storage */
export const loadAdminApiConfigFn = createServerFn({ method: "POST" }).handler(async () => {
  const { readAdminApiConfig } = await import("../admin-api-config.server");
  const config = readAdminApiConfig();
  // Mask API keys: only return the first 8 chars + asterisks for security
  const masked = {
    ...config,
    providers: Object.fromEntries(
      Object.entries(config.providers).map(([id, settings]) => [
        id,
        {
          ...settings,
          apiKey: settings.apiKey
            ? settings.apiKey.slice(0, 8) + "•".repeat(Math.max(0, settings.apiKey.length - 8))
            : "",
          // We never send the raw key to the client — only masked preview
          hasKey: settings.apiKey.length > 0,
        },
      ])
    ),
  };
  return masked;
});

/** Load admin API config with full keys (for internal server use only — never serialize to client) */
export const getAdminApiStatusFn = createServerFn({ method: "POST" }).handler(async () => {
  const { readAdminApiConfig } = await import("../admin-api-config.server");
  const config = readAdminApiConfig();
  return {
    activeProvider: config.activeProvider,
    aiEnabled: config.aiEnabled,
    updatedAt: config.updatedAt,
    providerStatus: Object.fromEntries(
      Object.entries(config.providers).map(([id, s]) => [
        id,
        {
          hasKey: s.apiKey.length > 0,
          model: s.model,
          baseUrl: s.baseUrl,
          enabled: s.enabled,
          keyPreview: s.apiKey ? s.apiKey.slice(0, 6) + "..." : "",
        },
      ])
    ),
  };
});
