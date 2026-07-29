import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerConfig } from "../config.server";

// Callers get a discriminated { ok } result and are expected to fall back to
// the local simulated question pools whenever ok is false, for any reason
// (not configured, malformed response, network/API error). The actual SDK
// usage lives in ai-study-generation.server.ts — a .server.ts module never
// included in the client bundle — imported dynamically below so those SDKs
// are only ever loaded on the server, even during dev pre-bundling.

const MAX_SOURCE_CHARS = 20000;

const AI_STUDY_PROVIDERS = ["anthropic", "deepseek", "custom"] as const;

export const getAiStudyStatus = createServerFn({ method: "POST" }).handler(async () => {
  const config = getServerConfig();
  return {
    anthropic: Boolean(config.anthropicApiKey),
    deepseek: Boolean(config.deepseekApiKey),
    custom: Boolean(config.customAiApiKey),
  };
});

export const generateStudyPack = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      text: z.string().min(1).max(MAX_SOURCE_CHARS),
      questionCount: z.number().int().min(1).max(20),
      subjectHint: z.string().optional(),
      provider: z.enum(AI_STUDY_PROVIDERS),
      deepseekModel: z.string().optional(),
      customBaseUrl: z.string().optional(),
      customModel: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const config = getServerConfig();
    const { runAnthropicGeneration, runOpenAiCompatibleGeneration } =
      await import("../ai-study-generation.server");

    if (data.provider === "anthropic") {
      if (!config.anthropicApiKey) {
        return { ok: false as const, reason: "not_configured" as const };
      }
      return runAnthropicGeneration(config.anthropicApiKey, data);
    }

    if (data.provider === "deepseek") {
      if (!config.deepseekApiKey) {
        return { ok: false as const, reason: "not_configured" as const };
      }
      return runOpenAiCompatibleGeneration(
        {
          apiKey: config.deepseekApiKey,
          baseUrl: "https://api.deepseek.com",
          model: data.deepseekModel || "deepseek-chat",
        },
        data,
      );
    }

    // Custom OpenAI-compatible endpoint
    if (!config.customAiApiKey || !data.customBaseUrl || !data.customModel) {
      return { ok: false as const, reason: "not_configured" as const };
    }
    return runOpenAiCompatibleGeneration(
      { apiKey: config.customAiApiKey, baseUrl: data.customBaseUrl, model: data.customModel },
      data,
    );
  });
