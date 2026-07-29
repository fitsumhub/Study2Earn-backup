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

type GenerateInput = { text: string; questionCount: number; subjectHint?: string };

const SYSTEM_PROMPT =
  "You write exam-style multiple-choice study material for Ethiopian Ministry of Education freshman Exit Exam preparation. Base every question strictly on the provided source text — never invent facts outside it. Each question has exactly 4 options with exactly one correct answer and a short explanation.";

function buildUserPrompt(input: GenerateInput) {
  return `Generate exactly ${input.questionCount} multiple-choice questions and study notes from this source material${input.subjectHint ? ` (likely subject: ${input.subjectHint})` : ""}:\n\n${input.text}`;
}

/** Anthropic Claude — uses the Messages API's native structured-output
 * enforcement, so the response is guaranteed to match StudyPackSchema. */
export async function runAnthropicGeneration(
  apiKey: string,
  input: GenerateInput,
): Promise<GenerateResult> {
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
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

/** Any OpenAI-compatible Chat Completions endpoint (DeepSeek, Groq, Mistral,
 * a self-hosted gateway, ...). These don't offer Claude's guaranteed
 * structured-output contract, so the shape is prompted for explicitly and the
 * response is parsed + validated against the same StudyPackSchema before use. */
export async function runOpenAiCompatibleGeneration(
  connection: { apiKey: string; baseUrl: string; model: string },
  input: GenerateInput,
): Promise<GenerateResult> {
  try {
    const client = new OpenAI({ apiKey: connection.apiKey, baseURL: connection.baseUrl });
    const response = await client.chat.completions.create({
      model: connection.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n\n${JSON_SHAPE_INSTRUCTIONS}` },
        { role: "user", content: buildUserPrompt(input) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { ok: false, reason: "generation_failed" };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
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
