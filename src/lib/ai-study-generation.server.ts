// The .server.ts suffix guarantees this module — and everything it imports,
// including the Anthropic and OpenAI SDKs — is excluded from the client
// bundle. Do not import this file from anything other than a createServerFn
// handler.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import OpenAI from "openai";
// The Anthropic structured-output helper is built against Zod's v4 schema
// shape — a separate import specifier from the classic v3 API used elsewhere
// in the app. Both resolve against the single installed `zod` package (3.25+
// ships the v4-compatible core under this subpath). The same schema is reused
// for manual validation on the OpenAI-compatible path below.
import { z } from "zod/v4";

export const AI_STUDY_SUBJECTS = [
  "physics",
  "biology",
  "chemistry",
  "math",
  "history",
  "english",
  "general",
] as const;

const StudyPackSchema = z.object({
  subject: z.enum(AI_STUDY_SUBJECTS),
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: z.string(),
      }),
    )
    .min(1),
  notes: z.object({
    keyConcepts: z.array(z.string()),
    definitions: z.array(z.object({ term: z.string(), definition: z.string() })),
    summary: z.string(),
    studyTips: z.array(z.string()),
  }),
});

export type StudyPack = z.infer<typeof StudyPackSchema>;

export type GenerateResult =
  | { ok: true; data: StudyPack }
  | { ok: false; reason: "generation_failed" | "api_error"; message?: string };

type GenerateInput = {
  text: string;
  questionCount: number;
  subjectHint?: string;
  systemPrompt?: string;
  temperature?: number;
  model?: string;
};

const DEFAULT_SYSTEM_PROMPT =
  "You write exam-style multiple-choice study material for Ethiopian Ministry of Education freshman Exit Exam preparation. Base every question strictly on the provided source text — never invent facts outside it. Each question has exactly 4 options with exactly one correct answer and a short explanation.";

function buildUserPrompt(input: GenerateInput) {
  return `Generate exactly ${input.questionCount} multiple-choice questions and study notes from this source material${input.subjectHint ? ` (likely subject: ${input.subjectHint})` : ""}:\n\n${input.text}`;
}

function cleanJsonOutput(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```json")) {
    text = text.slice(7);
  } else if (text.startsWith("```")) {
    text = text.slice(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }
  return text.trim();
}

/** Anthropic Claude — uses the Messages API's native structured-output
 * enforcement, so the response is guaranteed to match StudyPackSchema. */
export async function runAnthropicGeneration(
  apiKey: string,
  input: GenerateInput,
): Promise<GenerateResult> {
  try {
    const client = new Anthropic({ apiKey });
    const model = input.model?.trim() || "claude-3-5-sonnet-20241022";
    const system = input.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;

    const response = await client.messages.parse({
      model,
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
      output_config: { format: zodOutputFormat(StudyPackSchema) },
    });

    if (!response.parsed_output) {
      return { ok: false, reason: "generation_failed" };
    }

    return {
      ok: true,
      data: {
        ...response.parsed_output,
        questions: response.parsed_output.questions.slice(0, input.questionCount),
      },
    };
  } catch (err) {
    return {
      ok: false,
      reason: "api_error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

const JSON_SHAPE_INSTRUCTIONS = `Respond with ONLY a single JSON object — no markdown code fences, no commentary before or after — matching exactly this shape:
{
  "subject": one of "physics" | "biology" | "chemistry" | "math" | "history" | "english" | "general",
  "questions": [ { "question": string, "options": [string, string, string, string], "correctIndex": 0-3, "explanation": string } ],
  "notes": {
    "keyConcepts": string[],
    "definitions": [ { "term": string, "definition": string } ],
    "summary": string,
    "studyTips": string[]
  }
}`;

/** Any OpenAI-compatible Chat Completions endpoint (OpenAI, DeepSeek, Groq, Gemini,
 * Mistral, self-hosted gateway, etc.). */
export async function runOpenAiCompatibleGeneration(
  connection: { apiKey: string; baseUrl?: string; model: string },
  input: GenerateInput,
): Promise<GenerateResult> {
  try {
    const client = new OpenAI({
      apiKey: connection.apiKey,
      baseURL: connection.baseUrl?.trim() || undefined,
    });
    const system = input.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;

    const response = await client.chat.completions.create({
      model: connection.model,
      temperature: input.temperature ?? 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${system}\n\n${JSON_SHAPE_INSTRUCTIONS}` },
        { role: "user", content: buildUserPrompt(input) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { ok: false, reason: "generation_failed" };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleanJsonOutput(content));
    } catch {
      return { ok: false, reason: "generation_failed" };
    }

    const result = StudyPackSchema.safeParse(parsedJson);
    if (!result.success) {
      return { ok: false, reason: "generation_failed" };
    }

    return {
      ok: true,
      data: { ...result.data, questions: result.data.questions.slice(0, input.questionCount) },
    };
  } catch (err) {
    return {
      ok: false,
      reason: "api_error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Test an AI API key and connection with a minimal probe request */
export async function runAiConnectionTest(params: {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  const start = Date.now();
  try {
    if (params.provider === "anthropic") {
      const client = new Anthropic({ apiKey: params.apiKey });
      const model = params.model?.trim() || "claude-3-5-haiku-20241022";
      await client.messages.create({
        model,
        max_tokens: 5,
        messages: [{ role: "user", content: "Ping" }],
      });
      const latencyMs = Date.now() - start;
      return {
        ok: true,
        latencyMs,
        message: `Connected successfully to Anthropic (${model}) in ${latencyMs}ms.`,
      };
    }

    // OpenAI, DeepSeek, Groq, Gemini, Custom
    const client = new OpenAI({
      apiKey: params.apiKey,
      baseURL: params.baseUrl?.trim() || undefined,
    });
    const model = params.model?.trim() || "gpt-4o-mini";
    await client.chat.completions.create({
      model,
      max_tokens: 5,
      messages: [{ role: "user", content: "Ping" }],
    });
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      latencyMs,
      message: `Connected successfully to ${params.provider.toUpperCase()} (${model}) in ${latencyMs}ms.`,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      ok: false,
      latencyMs,
      message: err instanceof Error ? err.message : "Unknown connection error",
    };
  }
}
