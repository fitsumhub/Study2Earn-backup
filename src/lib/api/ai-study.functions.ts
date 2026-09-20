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

const AI_STUDY_PROVIDERS = [
  "openai",
  "anthropic",
  "deepseek",
  "groq",
  "gemini",
  "custom",
] as const;

export const getAiStudyStatus = createServerFn({ method: "POST" }).handler(async () => {
  const config = getServerConfig();
  return {
    openai: Boolean(config.openaiApiKey),
    anthropic: Boolean(config.anthropicApiKey),
    deepseek: Boolean(config.deepseekApiKey),
    groq: Boolean(config.groqApiKey),
    gemini: Boolean(config.geminiApiKey),
    custom: Boolean(config.customAiApiKey),
  };
});

export const testAiConnection = createServerFn({ method: "POST" })
  .validator(
    z.object({
      provider: z.string(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const config = getServerConfig();
    const { runAiConnectionTest } = await import("../ai-study-generation.server");

    // Resolve API key: client passed key takes precedence, fallback to server env
    let apiKey = data.apiKey?.trim();
    if (!apiKey) {
      if (data.provider === "openai") apiKey = config.openaiApiKey;
      else if (data.provider === "anthropic") apiKey = config.anthropicApiKey;
      else if (data.provider === "deepseek") apiKey = config.deepseekApiKey;
      else if (data.provider === "groq") apiKey = config.groqApiKey;
      else if (data.provider === "gemini") apiKey = config.geminiApiKey;
      else if (data.provider === "custom") apiKey = config.customAiApiKey;
    }

    if (!apiKey) {
      return {
        ok: false,
        latencyMs: 0,
        message: `No API key provided for ${data.provider}. Enter a key or set it in server env.`,
      };
    }

    let baseUrl = data.baseUrl?.trim();
    if (!baseUrl) {
      if (data.provider === "openai") baseUrl = "https://api.openai.com/v1";
      else if (data.provider === "deepseek") baseUrl = "https://api.deepseek.com";
      else if (data.provider === "groq") baseUrl = "https://api.groq.com/openai/v1";
      else if (data.provider === "gemini")
        baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
    }

    let model = data.model?.trim();
    if (!model) {
      if (data.provider === "openai") model = "gpt-4o-mini";
      else if (data.provider === "anthropic") model = "claude-3-5-haiku-20241022";
      else if (data.provider === "deepseek") model = "deepseek-chat";
      else if (data.provider === "groq") model = "llama-3.3-70b-versatile";
      else if (data.provider === "gemini") model = "gemini-1.5-flash";
      else model = "gpt-4o-mini";
    }

    return runAiConnectionTest({
      provider: data.provider,
      apiKey,
      baseUrl,
      model,
    });
  });

export const generateStudyPack = createServerFn({ method: "POST" })
  .validator(
    z.object({
      text: z.string().min(1).max(MAX_SOURCE_CHARS),
      questionCount: z.number().int().min(1).max(20),
      subjectHint: z.string().optional(),
      provider: z.string(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
      systemPrompt: z.string().optional(),
      temperature: z.number().min(0).max(1).optional(),
      deepseekModel: z.string().optional(),
      customBaseUrl: z.string().optional(),
      customModel: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const config = getServerConfig();
    const { runAnthropicGeneration, runOpenAiCompatibleGeneration } =
      await import("../ai-study-generation.server");

    // Resolve API key
    let apiKey = data.apiKey?.trim();
    if (!apiKey) {
      if (data.provider === "openai") apiKey = config.openaiApiKey;
      else if (data.provider === "anthropic") apiKey = config.anthropicApiKey;
      else if (data.provider === "deepseek") apiKey = config.deepseekApiKey;
      else if (data.provider === "groq") apiKey = config.groqApiKey;
      else if (data.provider === "gemini") apiKey = config.geminiApiKey;
      else if (data.provider === "custom") apiKey = config.customAiApiKey;
    }

    if (!apiKey) {
      return { ok: false as const, reason: "not_configured" as const };
    }

    if (data.provider === "anthropic") {
      return runAnthropicGeneration(apiKey, {
        text: data.text,
        questionCount: data.questionCount,
        subjectHint: data.subjectHint,
        systemPrompt: data.systemPrompt,
        model: data.model || "claude-3-5-sonnet-20241022",
      });
    }

    // OpenAI-compatible providers:
    let baseUrl = data.baseUrl?.trim() || data.customBaseUrl?.trim();
    if (!baseUrl) {
      if (data.provider === "openai") baseUrl = "https://api.openai.com/v1";
      else if (data.provider === "deepseek") baseUrl = "https://api.deepseek.com";
      else if (data.provider === "groq") baseUrl = "https://api.groq.com/openai/v1";
      else if (data.provider === "gemini")
        baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
      else baseUrl = "https://api.openai.com/v1";
    }

    let model = data.model?.trim() || data.deepseekModel?.trim() || data.customModel?.trim();
    if (!model) {
      if (data.provider === "openai") model = "gpt-4o-mini";
      else if (data.provider === "deepseek") model = "deepseek-chat";
      else if (data.provider === "groq") model = "llama-3.3-70b-versatile";
      else if (data.provider === "gemini") model = "gemini-1.5-flash";
      else model = "gpt-4o-mini";
    }

    return runOpenAiCompatibleGeneration(
      {
        apiKey,
        baseUrl,
        model,
      },
      {
        text: data.text,
        questionCount: data.questionCount,
        subjectHint: data.subjectHint,
        systemPrompt: data.systemPrompt,
        temperature: data.temperature,
      },
    );
  });
