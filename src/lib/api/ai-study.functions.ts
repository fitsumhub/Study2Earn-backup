import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerConfig } from "../config.server";
// Admin-persisted API config — keys saved via admin UI are read from here
// so they work server-side without requiring .env edits.
import { resolveApiKey as resolveAdminKey, resolveModel as resolveAdminModel, resolveBaseUrl as resolveAdminBaseUrl } from "../admin-api-config.server";


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
    openai: Boolean(config.openaiApiKey) || Boolean(resolveAdminKey("openai")),
    anthropic: Boolean(config.anthropicApiKey) || Boolean(resolveAdminKey("anthropic")),
    deepseek: Boolean(config.deepseekApiKey) || Boolean(resolveAdminKey("deepseek")),
    groq: Boolean(config.groqApiKey) || Boolean(resolveAdminKey("groq")),
    gemini: Boolean(config.geminiApiKey) || Boolean(resolveAdminKey("gemini")),
    custom: Boolean(config.customAiApiKey) || Boolean(resolveAdminKey("custom")),
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

    // Key resolution: client UI key > admin-persisted config > server env
    let apiKey = data.apiKey?.trim();
    if (!apiKey) {
      apiKey = resolveAdminKey(data.provider);
    }
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
        message: `No API key for ${data.provider}. Add one in Admin → Integrations.`,
      };
    }

    let baseUrl = data.baseUrl?.trim() || resolveAdminBaseUrl(data.provider);
    if (!baseUrl) {
      if (data.provider === "openai") baseUrl = "https://api.openai.com/v1";
      else if (data.provider === "deepseek") baseUrl = "https://api.deepseek.com";
      else if (data.provider === "groq") baseUrl = "https://api.groq.com/openai/v1";
      else if (data.provider === "gemini")
        baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
    }

    let model = data.model?.trim() || resolveAdminModel(data.provider);
    if (!model) {
      if (data.provider === "openai") model = "gpt-4o-mini";
      else if (data.provider === "anthropic") model = "claude-3-5-haiku-20241022";
      else if (data.provider === "deepseek") model = "deepseek-chat";
      else if (data.provider === "groq") model = "llama-3.3-70b-versatile";
      else if (data.provider === "gemini") model = "gemini-flash-lite-latest";
      else model = "gemini-flash-lite-latest";
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

    // Key resolution: client UI key > admin-persisted config > server env
    let apiKey = data.apiKey?.trim();
    if (!apiKey) {
      apiKey = resolveAdminKey(data.provider);
    }
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
    let baseUrl = data.baseUrl?.trim() || data.customBaseUrl?.trim() || resolveAdminBaseUrl(data.provider);
    if (!baseUrl) {
      if (data.provider === "openai") baseUrl = "https://api.openai.com/v1";
      else if (data.provider === "deepseek") baseUrl = "https://api.deepseek.com";
      else if (data.provider === "groq") baseUrl = "https://api.groq.com/openai/v1";
      else if (data.provider === "gemini")
        baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
      else baseUrl = "https://api.openai.com/v1";
    }

    let model = data.model?.trim() || data.deepseekModel?.trim() || data.customModel?.trim() || resolveAdminModel(data.provider);
    if (!model) {
      if (data.provider === "openai") model = "gpt-4o-mini";
      else if (data.provider === "deepseek") model = "deepseek-chat";
      else if (data.provider === "groq") model = "llama-3.3-70b-versatile";
      else if (data.provider === "gemini") model = "gemini-flash-lite-latest";
      else model = "gemini-flash-lite-latest";
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

export const chatWithAiStudy = createServerFn({ method: "POST" })
  .validator(
    z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string().max(8000),
        }),
      ),
      course: z.string().optional(),
      tool: z.string().optional(),
      language: z.enum(["en", "am"]).optional(),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
      systemPrompt: z.string().optional(),
      temperature: z.number().min(0).max(1).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const config = getServerConfig();
    const { runAiChatCompletion } = await import("../ai-study-generation.server");

    const provider = data.provider || "gemini";
    let apiKey = data.apiKey?.trim();
    if (!apiKey) {
      if (provider === "openai") apiKey = config.openaiApiKey;
      else if (provider === "anthropic") apiKey = config.anthropicApiKey;
      else if (provider === "deepseek") apiKey = config.deepseekApiKey;
      else if (provider === "groq") apiKey = config.groqApiKey;
      else if (provider === "gemini") apiKey = config.geminiApiKey;
      else if (provider === "custom") apiKey = config.customAiApiKey;
    }

    let baseUrl = data.baseUrl?.trim();
    if (!baseUrl) {
      if (provider === "openai") baseUrl = "https://api.openai.com/v1";
      else if (provider === "deepseek") baseUrl = "https://api.deepseek.com";
      else if (provider === "groq") baseUrl = "https://api.groq.com/openai/v1";
      else if (provider === "gemini")
        baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
    }

    let model = data.model?.trim();
    if (!model) {
      if (provider === "openai") model = "gpt-4o-mini";
      else if (provider === "anthropic") model = "claude-3-5-sonnet-20241022";
      else if (provider === "deepseek") model = "deepseek-chat";
      else if (provider === "groq") model = "llama-3.3-70b-versatile";
      else if (provider === "gemini") model = "gemini-flash-lite-latest";
      else model = "gemini-flash-lite-latest";
    }

    return runAiChatCompletion({
      provider,
      apiKey,
      baseUrl,
      model,
      systemPrompt: data.systemPrompt,
      temperature: data.temperature,
      course: data.course,
      tool: data.tool,
      language: data.language,
      messages: data.messages,
    });
  });

export const generateCompleteStudySetFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      text: z.string().min(1).max(30000),
      titleHint: z.string().optional(),
      subjectHint: z.string().optional(),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const config = getServerConfig();
    const { runCompleteStudySetGeneration } = await import("../ai-study-generation.server");

    const provider = data.provider || "gemini";
    let apiKey = data.apiKey?.trim();
    if (!apiKey) {
      if (provider === "openai") apiKey = config.openaiApiKey;
      else if (provider === "anthropic") apiKey = config.anthropicApiKey;
      else if (provider === "deepseek") apiKey = config.deepseekApiKey;
      else if (provider === "groq") apiKey = config.groqApiKey;
      else if (provider === "gemini") apiKey = config.geminiApiKey;
      else if (provider === "custom") apiKey = config.customAiApiKey;
    }

    let baseUrl = data.baseUrl?.trim();
    if (!baseUrl) {
      if (provider === "openai") baseUrl = "https://api.openai.com/v1";
      else if (provider === "deepseek") baseUrl = "https://api.deepseek.com";
      else if (provider === "groq") baseUrl = "https://api.groq.com/openai/v1";
      else if (provider === "gemini")
        baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
    }

    let model = data.model?.trim();
    if (!model) {
      if (provider === "openai") model = "gpt-4o-mini";
      else if (provider === "anthropic") model = "claude-3-5-sonnet-20241022";
      else if (provider === "deepseek") model = "deepseek-chat";
      else if (provider === "groq") model = "llama-3.3-70b-versatile";
      else if (provider === "gemini") model = "gemini-flash-lite-latest";
      else model = "gemini-flash-lite-latest";
    }

    return runCompleteStudySetGeneration({
      text: data.text,
      titleHint: data.titleHint,
      subjectHint: data.subjectHint,
      provider,
      apiKey,
      baseUrl,
      model,
    });
  });

export const evaluateWrittenAnswerFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      prompt: z.string().min(1),
      modelAnswer: z.string().min(1),
      keyRubricPoints: z.array(z.string()),
      userAnswer: z.string().min(1),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const config = getServerConfig();
    const { runWrittenAnswerEvaluation } = await import("../ai-study-generation.server");

    const provider = data.provider || "gemini";
    let apiKey = data.apiKey?.trim();
    if (!apiKey) {
      if (provider === "openai") apiKey = config.openaiApiKey;
      else if (provider === "anthropic") apiKey = config.anthropicApiKey;
      else if (provider === "deepseek") apiKey = config.deepseekApiKey;
      else if (provider === "groq") apiKey = config.groqApiKey;
      else if (provider === "gemini") apiKey = config.geminiApiKey;
      else if (provider === "custom") apiKey = config.customAiApiKey;
    }

    let baseUrl = data.baseUrl?.trim();
    if (!baseUrl) {
      if (provider === "openai") baseUrl = "https://api.openai.com/v1";
      else if (provider === "deepseek") baseUrl = "https://api.deepseek.com";
      else if (provider === "groq") baseUrl = "https://api.groq.com/openai/v1";
      else if (provider === "gemini")
        baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
    }

    let model = data.model?.trim();
    if (!model) {
      if (provider === "openai") model = "gpt-4o-mini";
      else if (provider === "anthropic") model = "claude-3-5-haiku-20241022";
      else if (provider === "deepseek") model = "deepseek-chat";
      else if (provider === "groq") model = "llama-3.3-70b-versatile";
      else if (provider === "gemini") model = "gemini-flash-lite-latest";
      else model = "gemini-flash-lite-latest";
    }

    return runWrittenAnswerEvaluation({
      prompt: data.prompt,
      modelAnswer: data.modelAnswer,
      keyRubricPoints: data.keyRubricPoints,
      userAnswer: data.userAnswer,
      provider,
      apiKey,
      baseUrl,
      model,
    });
  });

function resolveAiCallParams(input: {
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}) {
  const config = getServerConfig();
  const provider = input.provider || "gemini";
  let apiKey = input.apiKey?.trim() || resolveAdminKey(provider);
  if (!apiKey) {
    if (provider === "openai") apiKey = config.openaiApiKey || "";
    else if (provider === "anthropic") apiKey = config.anthropicApiKey || "";
    else if (provider === "deepseek") apiKey = config.deepseekApiKey || "";
    else if (provider === "groq") apiKey = config.groqApiKey || "";
    else if (provider === "gemini") apiKey = config.geminiApiKey || "";
    else if (provider === "custom") apiKey = config.customAiApiKey || "";
  }

  let baseUrl = input.baseUrl?.trim() || resolveAdminBaseUrl(provider);
  if (!baseUrl) {
    if (provider === "openai") baseUrl = "https://api.openai.com/v1";
    else if (provider === "deepseek") baseUrl = "https://api.deepseek.com";
    else if (provider === "groq") baseUrl = "https://api.groq.com/openai/v1";
    else if (provider === "gemini")
      baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
  }

  let model = input.model?.trim() || resolveAdminModel(provider);
  if (!model) {
    if (provider === "openai") model = "gpt-4o-mini";
    else if (provider === "anthropic") model = "claude-3-5-haiku-20241022";
    else if (provider === "deepseek") model = "deepseek-chat";
    else if (provider === "groq") model = "llama-3.3-70b-versatile";
    else if (provider === "gemini") model = "gemini-flash-lite-latest";
    else model = "gemini-flash-lite-latest";
  }

  return { provider, apiKey: apiKey || "", baseUrl: baseUrl || "", model };
}

export const generateMoreFlashcardsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      topic: z.string().min(1),
      contextText: z.string().optional(),
      count: z.number().int().min(1).max(15).optional(),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { runMoreFlashcardsGeneration } = await import("../ai-study-generation.server");
    const { provider, apiKey, baseUrl, model } = resolveAiCallParams(data);
    return runMoreFlashcardsGeneration({
      topic: data.topic,
      contextText: data.contextText,
      count: data.count,
      provider,
      apiKey,
      baseUrl,
      model,
    });
  });

export const generateMoreQuizQuestionsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      topic: z.string().min(1),
      contextText: z.string().optional(),
      count: z.number().int().min(1).max(10).optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { runMoreQuizGeneration } = await import("../ai-study-generation.server");
    const { provider, apiKey, baseUrl, model } = resolveAiCallParams(data);
    return runMoreQuizGeneration({
      topic: data.topic,
      contextText: data.contextText,
      count: data.count,
      difficulty: data.difficulty,
      provider,
      apiKey,
      baseUrl,
      model,
    });
  });

export const generateMoreWrittenTestsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      topic: z.string().min(1),
      contextText: z.string().optional(),
      count: z.number().int().min(1).max(5).optional(),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { runMoreWrittenTestsGeneration } = await import("../ai-study-generation.server");
    const { provider, apiKey, baseUrl, model } = resolveAiCallParams(data);
    return runMoreWrittenTestsGeneration({
      topic: data.topic,
      contextText: data.contextText,
      count: data.count,
      provider,
      apiKey,
      baseUrl,
      model,
    });
  });

export const generateMoreFillBlanksFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      topic: z.string().min(1),
      contextText: z.string().optional(),
      count: z.number().int().min(1).max(10).optional(),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { runMoreFillBlanksGeneration } = await import("../ai-study-generation.server");
    const { provider, apiKey, baseUrl, model } = resolveAiCallParams(data);
    return runMoreFillBlanksGeneration({
      topic: data.topic,
      contextText: data.contextText,
      count: data.count,
      provider,
      apiKey,
      baseUrl,
      model,
    });
  });

export const generateOverviewFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(1),
      subject: z.string().optional(),
      courseCode: z.string().optional(),
      contextText: z.string().optional(),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { runOverviewGeneration } = await import("../ai-study-generation.server");
    const { provider, apiKey, baseUrl, model } = resolveAiCallParams(data);
    return runOverviewGeneration({
      title: data.title,
      subject: data.subject,
      courseCode: data.courseCode,
      contextText: data.contextText,
      provider,
      apiKey,
      baseUrl,
      model,
    });
  });

export const summarizeNotesFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      text: z.string().min(1).max(30000),
      titleHint: z.string().optional(),
      subjectHint: z.string().optional(),
      depth: z.enum(["concise", "standard", "detailed", "deep-learning"]).optional(),
      focus: z.enum(["exam-focused", "conceptual", "practical", "quick-revision"]).optional(),
      language: z.enum(["en", "am"]).optional(),
      targetSection: z.string().optional(),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { runSummarizeNotesGeneration } = await import("../ai-study-generation.server");
    const { provider, apiKey, baseUrl, model } = resolveAiCallParams(data);
    return runSummarizeNotesGeneration({
      text: data.text,
      titleHint: data.titleHint,
      subjectHint: data.subjectHint,
      depth: data.depth,
      focus: data.focus,
      language: data.language,
      targetSection: data.targetSection,
      provider,
      apiKey,
      baseUrl,
      model,
    });
  });

export const generateCheatSheetFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(1),
      subject: z.string().optional(),
      contextText: z.string().optional(),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { runCheatSheetGeneration } = await import("../ai-study-generation.server");
    const { provider, apiKey, baseUrl, model } = resolveAiCallParams(data);
    return runCheatSheetGeneration({
      title: data.title,
      subject: data.subject,
      contextText: data.contextText,
      provider,
      apiKey,
      baseUrl,
      model,
    });
  });

export const deepLearningToolFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tool: z.enum([
        "explain",
        "step_by_step",
        "example",
        "compare",
        "test_understanding",
        "tutor_qa",
        "study_planner",
      ]),
      query: z.string().min(1),
      contextText: z.string().optional(),
      titleHint: z.string().optional(),
      subjectHint: z.string().optional(),
      level: z.enum(["simple", "intermediate", "advanced"]).optional(),
      secondaryConcept: z.string().optional(),
      examDate: z.string().optional(),
      dailyHours: z.number().min(0.5).max(12).optional(),
      language: z.enum(["en", "am"]).optional(),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { runDeepLearningTool } = await import("../ai-study-generation.server");
    const { provider, apiKey, baseUrl, model } = resolveAiCallParams(data);
    return runDeepLearningTool({
      tool: data.tool,
      query: data.query,
      contextText: data.contextText,
      titleHint: data.titleHint,
      subjectHint: data.subjectHint,
      level: data.level,
      secondaryConcept: data.secondaryConcept,
      examDate: data.examDate,
      dailyHours: data.dailyHours,
      language: data.language,
      provider,
      apiKey,
      baseUrl,
      model,
    });
  });

