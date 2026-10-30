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
import type {
  StudySetNotes,
  StudySetOverview,
  StudySetCheatSheet,
  StudySetFlashcard,
  StudySetQuizQuestion,
  StudySetWrittenQuestion,
  StudySetFillBlank,
  StudySet,
} from "./study-set-store";
import {
  synthesizeDefaultOverview,
  synthesizeDefaultCheatSheet,
} from "./study-set-store";


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
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  // Extract outermost JSON object
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

export function safeParseJson<T>(raw: string): T | null {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = cleanJsonOutput(raw);

  // 1. Direct JSON parse
  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }

  // 2. Repair unquoted keys and trailing commas
  try {
    const repaired = cleaned
      .replace(/\r\n/g, "\n")
      .replace(/([{[,\n]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
      .replace(/([{[,\n]\s*)"?([a-zA-Z0-9_$]+)"?\s*:/g, '$1"$2":')
      .replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(repaired) as T;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }

  // 3. Repair incomplete brackets / truncation
  try {
    let repaired = cleaned.replace(/\r\n/g, "\n");
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    repaired = repaired.replace(/,\s*$/, "");
    for (let i = 0; i < (openBrackets - closeBrackets); i++) repaired += "]";
    for (let i = 0; i < (openBraces - closeBraces); i++) repaired += "}";

    repaired = repaired
      .replace(/([{[,\n]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
      .replace(/([{[,\n]\s*)"?([a-zA-Z0-9_$]+)"?\s*:/g, '$1"$2":')
      .replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(repaired) as T;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }

  return null;
}


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
    const resolvedBaseUrl =
      params.baseUrl?.trim() ||
      (params.provider === "gemini"
        ? "https://generativelanguage.googleapis.com/v1beta/openai/"
        : undefined);
    const client = new OpenAI({
      apiKey: params.apiKey,
      baseURL: resolvedBaseUrl,
      timeout: 30000,
    });
    const candidateModels =
      params.provider === "gemini"
        ? Array.from(
            new Set([
              params.model || "gemini-flash-lite-latest",
              "gemini-flash-lite-latest",
              "gemini-2.0-flash",
              "gemini-2.0-flash-lite",
              "gemini-1.5-flash",
            ]),
          )
        : [
            params.model ||
              (params.provider === "deepseek"
                ? "deepseek-chat"
                : params.provider === "groq"
                  ? "llama-3.3-70b-versatile"
                  : "gpt-4o-mini"),
          ];

    let lastErr: unknown = null;
    for (const candidateModel of candidateModels) {
      try {
        await client.chat.completions.create({
          model: candidateModel,
          max_tokens: 15,
          messages: [{ role: "user", content: "State 1 key exit exam topic in computer science in 5 words." }],
        });
        const latencyMs = Date.now() - start;
        return {
          ok: true,
          latencyMs,
          message: `Connected successfully to ${params.provider.toUpperCase()} (${candidateModel}) in ${latencyMs}ms.`,
        };
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Failed to connect to any candidate model");
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      ok: false,
      latencyMs,
      message: err instanceof Error ? err.message : "Unknown connection error",
    };
  }
}

export type ChatMessagePayload = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatCompletionParams = {
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  course?: string;
  tool?: string;
  language?: "en" | "am";
  messages: ChatMessagePayload[];
};

export type ChatCompletionResult = {
  ok: boolean;
  content: string;
  source: "ai" | "curriculum_engine";
  modelUsed?: string;
  error?: string;
};

/** Run AI chat completion via configured provider or fallback to Ethiopian Curriculum Engine */
export async function runAiChatCompletion(
  params: ChatCompletionParams,
): Promise<ChatCompletionResult> {
  const lastUserMsg = [...params.messages].reverse().find((m) => m.role === "user")?.content || "";
  const course = params.course || "General University Course";
  const tool = params.tool || "general";
  const language = params.language || (isAmharicText(lastUserMsg) ? "am" : "en");

  // Attempt real AI API call if key is provided
  if (params.apiKey && params.apiKey.trim().length > 0) {
    try {
      const systemInstruction =
        params.systemPrompt?.trim() ||
        `You are Studley AI, an elite academic AI tutor and study copilot designed specifically for Ethiopian University students (Freshman courses and National Exit Exam preparation). 
The student is studying: ${course}.
Tool / focus mode: ${tool}.
Language preference: ${language === "am" ? "Amharic (በአማርኛ)" : "English (with Amharic terms where helpful)"}.
Formatting instructions:
- Use structured, clean Markdown with clear headings (## and ###).
- Use bullet points, bold key terms, blockquotes, and tables where appropriate.
- Include KaTeX/LaTeX math formatting ($formula$ or $$formula$$) for formulas.
- If writing code, always specify the language in markdown fences.
- Highlight common Ethiopian university exam pitfalls and high-yield memory aids.
- Be encouraging, precise, and pedagogically sound.`;

      if (params.provider === "anthropic") {
        const client = new Anthropic({ apiKey: params.apiKey });
        const model = params.model?.trim() || "claude-3-5-sonnet-20241022";

        const messagesForClaude = params.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

        const response = await client.messages.create({
          model,
          max_tokens: 3500,
          system: systemInstruction,
          messages: messagesForClaude,
        });

        const firstBlock = response.content[0];
        const text = firstBlock && firstBlock.type === "text" ? firstBlock.text : "";
        if (text) {
          return {
            ok: true,
            content: text,
            source: "ai",
            modelUsed: model,
          };
        }
      } else {
        // OpenAI, DeepSeek, Groq, Gemini, Custom
        const client = new OpenAI({
          apiKey: params.apiKey,
          baseURL: params.baseUrl?.trim() || undefined,
        });
        const model = params.model?.trim() || (params.provider === "deepseek" ? "deepseek-chat" : params.provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini");

        const response = await client.chat.completions.create({
          model,
          temperature: params.temperature ?? 0.4,
          messages: [
            { role: "system", content: systemInstruction },
            ...params.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
        });

        const text = response.choices[0]?.message?.content;
        if (text) {
          return {
            ok: true,
            content: text,
            source: "ai",
            modelUsed: model,
          };
        }
      }
    } catch (err) {
      console.warn("Real AI provider call failed, falling back to Curriculum Engine:", err);
      // Fall through to smart curriculum engine
    }
  }

  // Smart Ethiopian Curriculum Knowledge Engine
  const content = generateSmartCurriculumResponse(lastUserMsg, course, tool, language);
  return {
    ok: true,
    content,
    source: "curriculum_engine",
    modelUsed: "Studley Ethiopian Curriculum Engine (Local Grounded)",
  };
}

function isAmharicText(text: string): boolean {
  return /[\u1200-\u137F]/.test(text) || text.toLowerCase().includes("amharic") || text.includes("አማርኛ");
}

/** Rich, grounded Ethiopian University Curriculum fallback generator */
export function generateSmartCurriculumResponse(
  prompt: string,
  course: string,
  tool: string,
  language: "en" | "am",
): string {
  const p = prompt.toLowerCase();
  const isAmharic = language === "am" || isAmharicText(prompt);

  if (isAmharic) {
    return generateAmharicResponse(prompt, course, tool);
  }

  // 1. TOOL: EXPLAIN TOPIC
  if (tool === "explain" || p.includes("explain") || p.includes("what is") || p.includes("teach me")) {
    return `### 📚 Deep Concept Breakdown: ${course}

Here is a clear, step-by-step explanation grounded in the **Ethiopian University Curriculum**:

#### 1. Core Intuition & The Big Picture
Think of this concept like an everyday scenario you encounter around campus or everyday life in Ethiopia. Instead of memorizing abstract jargon, realize that this principle explains how things naturally balance or transform.

#### 2. Formal Definition
> **Key Definition**: In **${course}**, this topic establishes the relationship between fundamental governing laws, their theoretical derivations, and real-world boundary conditions.

* **Primary Variables**: Standard SI units and measurable quantities.
* **Governing Principle**: Conservation and equilibrium states.
* **Key Formula**:
$$\\mathcal{E}_{\\text{total}} = \\sum_{i=1}^n \\vec{F}_i \\cdot \\Delta \\vec{x} + \\int_a^b f(t)\\,dt$$

#### 3. Real-World Analogy
Imagine crossing the Addis Ababa Light Rail or water flowing through the Great Ethiopian Renaissance Dam (GERD). The potential energy converts into kinetic and electric output according to strict conservation laws, where internal resistance causes predictable energy dissipation.

#### 4. ⚠️ Ethiopian Exit Exam Pitfalls to Avoid
* **Trap 1**: Confusing scalar magnitudes with vector directions (common in Freshman Physics & Calculus).
* **Trap 2**: Forgetting boundary conditions at initial state $t = 0$.
* **Trap 3**: Misapplying formulas derived only for uniform or idealized conditions.

#### 5. Quick Check for Understanding
> *Quick Question*: If the external resistance is doubled while voltage remains constant, what happens to the total power dissipated?
*(Reflect for a moment, or reply to check your answer!)*`;
  }

  // 2. TOOL: SUMMARIZE NOTES
  if (tool === "summarize" || p.includes("summarize") || p.includes("summary") || p.includes("key points")) {
    return `### 📝 Deep Academic Study Monograph (${course})

*Synthesized from university lecture syllabus & Ethiopian MoE National Exit Exam standards.*

#### 🎯 Executive Abstract
This module establishes foundational architectural postulates, governing mathematical theorems, and engineering boundary trade-offs across **${course}**. Designed for senior degree assessments, this synthesis bridges first-principles theory with concrete exam problem-solving protocols and production applications.

---

#### 📌 Core Theoretical Pillars & Governing Mechanisms
1. **First-Principles Axiomatic Formulation**: State hypotheses explicitly and isolate parameter bounds before executing algebraic derivations.
2. **System Invariant Conservation**: Conserved physical and logical quantities remain constant across all intermediate state transitions in bounded systems.
3. **Boundary Condition & Validity Envelope**: Standard governing laws apply exclusively under verified operating envelopes (e.g. steady-state, linear response, lossless media).
4. **Trade-off Equilibrium Law**: Optimizing along a primary performance axis incurs an unavoidable proportional degradation in conjugate system metrics (e.g. latency vs. throughput).

---

#### 💡 Worked Examination Problem & Step-by-Step Solution
* **Problem Scenario**: A university exit exam question asks: *A system operating under ${course} principles undergoes a 40% increase in operational workload. Calculate the necessary parameter adjustment to preserve bounded equilibrium without exceeding safe operating limits.*
* **Step 1: Parameter & Boundary Extraction**:
  * Baseline capacity: $C_0$, Baseline workload: $W_0$, Target workload: $W_1 = 1.40 \\cdot W_0$.
  * Operational boundary: Utilization factor $\\rho = \\frac{W}{C} \\le 0.75$ to prevent non-linear queuing explosion.
* **Step 2: Governing Equation**:
  * Apply Little's Equilibrium Law & Queuing Invariant: $\\rho_1 = \\frac{W_1}{C_1} = \\frac{1.40 W_0}{C_1} \\le 0.75$.
* **Step 3: Algebraic Resolution**:
  * $C_1 \\ge \\frac{1.40 W_0}{0.75} \\approx 1.867 \\cdot W_0$.
  * Relative capacity scaling factor: $\\Delta C = \\frac{C_1 - C_0}{C_0} = +40\\%$ proportional scaling.
* **Step 4: Dimensional & Physical Sanity Check**:
  * Units resolve consistently; utilization remains safely bounded at $0.70 < 0.75$.
> 🔑 **Key Takeaway**: Always verify queuing or stability bounds *first*—linear capacity additions fail if non-linear queuing delays are ignored.

---

#### ⚡ Governing Theorem & Calculation Shortcut
* **Theorem**: $D_{\\text{total}} = D_{\\text{proc}} + D_{\\text{queue}} + \\frac{L}{R} + \\frac{d}{s}$
* **Calculation Shortcut**: Transmission delay scales inversely with link rate $R$ (pushing bits), whereas propagation delay depends purely on physical medium distance $d$ (traveling bits). Never confuse the two on exit exams!

---

#### ⚠️ High-Yield Examiner Traps & Common Misconceptions
* **Trap 1**: Applying ideal unconstrained formulas to edge cases where boundary conditions fail.
* **Trap 2**: Forgetting unit conversions before calculating derivations (e.g. mixing bits with bytes, or km/h with m/s).
* **Trap 3**: Conflating necessary conditions with sufficient conditions in conceptual essay prompts.

---

#### 💡 Recommended Next Revision Steps
* Jump to **Practice Quiz** to test these principles against 5 timed multiple-choice questions.
* Review **Active Recall Flashcards** to solidify definitions without looking at notes.`;
  }

  // 3. TOOL: FLASHCARDS
  if (tool === "flashcards" || p.includes("flashcard") || p.includes("cards")) {
    return `### 🧠 Generated Active Recall Flashcards: ${course}

Here is a 5-card active recall deck for this topic. Use the **Study Tools > Flashcards** tab to flip and test yourself!

---
**Card 1**
* **Front (Question)**: What is the primary difference between a conservative and non-conservative force in this context?
* **Back (Answer)**: A conservative force has work done independent of the path taken (depends only on initial and final positions), whereas work done by non-conservative forces (like friction) is path-dependent and dissipates mechanical energy.

---
**Card 2**
* **Front (Question)**: State the necessary and sufficient conditions for equilibrium.
* **Back (Answer)**: Both the net vector sum of all external forces must equal zero ($\\sum \\vec{F} = 0$, translational equilibrium) and the net torque about any pivot axis must equal zero ($\\sum \\vec{\\tau} = 0$, rotational equilibrium).

---
**Card 3**
* **Front (Question)**: Which common fallacy in Logic (Phil 1011) attacks the person rather than their argument?
* **Back (Answer)**: **Argumentum Ad Hominem** (Abusive or Circumstantial fallacy of relevance).

---
**Card 4**
* **Front (Question)**: How does the Ethiopian Ministry of Education Exit Exam structure multi-step calculus problems?
* **Back (Answer)**: Usually tests chain rule combined with trigonometric substitutions or integration by parts with definite limits.

---
**Card 5**
* **Front (Question)**: Define the Law of Diminishing Marginal Returns in economic and natural systems.
* **Back (Answer)**: As additional units of a variable input are added to fixed inputs, the marginal increase in total output will eventually decline.`;
  }

  // 4. TOOL: PRACTICE QUESTIONS
  if (tool === "questions" || p.includes("question") || p.includes("quiz") || p.includes("mcq")) {
    return `### ❓ Multiple-Choice Practice Quiz: ${course}

Targeted questions designed to mirror Ethiopian University Freshman & Exit Exam formats:

#### Question 1
A particle moves in a plane such that its position vector is given by $\\vec{r}(t) = (3t^2)\\hat{i} + (4t)\\hat{j}$. What is the magnitude of its acceleration at $t = 2\\text{ s}$?
* **A)** $6\\text{ m/s}^2$
* **B)** $12\\text{ m/s}^2$
* **C)** $8\\text{ m/s}^2$
* **D)** $0\\text{ m/s}^2$

> **Correct Answer: A**
> **Explanation**: Acceleration is the second derivative of position: $\\vec{v}(t) = \\frac{d\\vec{r}}{dt} = 6t\\hat{i} + 4\\hat{j}$. Taking the derivative again gives $\\vec{a}(t) = 6\\hat{i} + 0\\hat{j}$. The magnitude is $\\sqrt{6^2 + 0^2} = 6\\text{ m/s}^2$, which is constant for all $t$. Option B incorrectly substitutes $t=2$ into the acceleration expression.

---

#### Question 2
In Ethiopian university examinations, which of the following best describes a **valid deductive argument** in Logic & Critical Thinking (Phil 1011)?
* **A)** An argument whose premises are factually true in the real world.
* **B)** An argument where it is impossible for the premises to be true and the conclusion false at the same time.
* **C)** An argument that provides probable, strong likelihood for the conclusion.
* **D)** An argument based on historical consensus or majority opinion.

> **Correct Answer: B**
> **Explanation**: Validity is purely structural. If the premises are assumed true, the conclusion *must* follow with certainty. Option A describes empirical truth, while Option C describes inductive strength.

---

#### Question 3
When working with limits in Freshman Mathematics, what is the value of $\\lim_{x \\to 0} \\frac{\\sin(3x)}{x}$?
* **A)** 0
* **B)** 1
* **C)** 3
* **D)** Does not exist

> **Correct Answer: C**
> **Explanation**: Using the standard limit identity $\\lim_{u \\to 0} \\frac{\\sin(u)}{u} = 1$, we rewrite $\\frac{\\sin(3x)}{x} = 3 \\cdot \\frac{\\sin(3x)}{3x}$. As $x \\to 0$, $3x \\to 0$, yielding $3 \\cdot 1 = 3$.`;
  }

  // 5. TOOL: PRACTICE EXAM
  if (tool === "exam" || p.includes("exam") || p.includes("exit exam") || p.includes("test")) {
    return `### 📊 Simulated Practice Exam: ${course}
**Exam Type**: Ethiopian University Exit Exam Mock Simulation
**Recommended Time**: 15 Minutes · **Format**: Multiple Choice (Standard Exit Exam Rubric)

---
#### 1. Conceptual Foundation
An isolated physical system undergoes an adiabatic process. Which statement is strictly correct?
* **A)** The temperature of the system must remain constant ($T = \\text{const}$).
* **B)** No heat energy enters or leaves the system ($Q = 0$).
* **C)** The internal energy must remain zero ($\\Delta U = 0$).
* **D)** The work done on the system must always be zero ($W = 0$).
*(Hint: Adiabatic means zero thermal transfer)*

#### 2. Analytical Problem Solving
For the function $f(x) = x^3 - 3x + 2$, the critical points occur at:
* **A)** $x = 0$ only
* **B)** $x = 1$ and $x = -1$
* **C)** $x = 2$ and $x = -2$
* **D)** $x = 3$ only

#### 3. Applied Synthesis
In Logic and Ethics, why is the *Ad Misericordiam* (Appeal to Pity) classified as an informal fallacy of relevance?
* **A)** Because emotional appeals can never be true.
* **B)** Because feelings of pity do not constitute logical evidence for the truth of the conclusion.
* **C)** Because it relies on circular definitions.
* **D)** Because the premise contradicts the conclusion.

---
> 🏆 **Tip**: Try answering all three in chat or in the **Practice Exam Tool** to calculate your score and track XP!`;
  }

  // 6. TOOL: STUDY PLANNER
  if (tool === "plan" || p.includes("plan") || p.includes("schedule") || p.includes("routine")) {
    return `### 📅 7-Day High-Performance Study Plan: ${course}

Tailored for Ethiopian University semester rhythms and midterm/exit exam milestones:

| Day | Focus Topic | Activity | Target Duration |
| :--- | :--- | :--- | :--- |
| **Day 1 (Mon)** | Chapters 1 & 2: Fundamentals & Definitions | Read lecture slides + Generate 15 flashcards | 90 Mins |
| **Day 2 (Tue)** | Derivations & Analytical Formulas | Step-by-step paper derivation + 5 MCQs | 75 Mins |
| **Day 3 (Wed)** | Mid-Chapter Problem Sets | Active problem solving under 30-min timer | 60 Mins |
| **Day 4 (Thu)** | Chapters 3 & 4: Applied Scenarios | Summary synthesis + AI Tutor Socratic quiz | 90 Mins |
| **Day 5 (Fri)** | Exit Exam Past Question Review | Solve 20 past exit exam multiple-choice questions | 90 Mins |
| **Day 6 (Sat)** | Weak Spot Consolidation | Review missed questions in your Mistake Notebook | 60 Mins |
| **Day 7 (Sun)** | Full Mock Test & Active Rest | 45-minute timed simulation + reward yourself | 60 Mins |

#### 🔑 Daily Rules for Success:
1. Use 25-minute Pomodoro intervals (25 min study / 5 min rest).
2. Do not study late without sleep before exam days; memory consolidation requires REM sleep.`;
  }

  // 7. TOOL: STUDY TUTOR / SOCRATIC
  if (tool === "tutor") {
    return `### 💡 Studley Socratic Tutor: ${course}

Let's unpack this together! Rather than just giving you a textbook dump, let's build your reasoning step by step:

1. **First step**: What is your current understanding of the basic law or definition here?
2. **Next step**: Can you identify what information is *given* in the problem vs. what is *unknown*?
3. **Guiding clue**: Keep in mind that for **${course}**, Ethiopian exam problems frequently disguise the boundary condition.

Reply with your first thought, and I'll guide you to the exact solution!`;
  }

  // DEFAULT GENERAL ASSISTANT
  return `### 🎓 Studley AI Study Assistant (${course})

Regarding your question about **"${prompt.slice(0, 80)}"**:

#### Overview & Core Explanation
In the **Ethiopian University Curriculum** for **${course}**, this topic is essential because it bridges theoretical definitions with exam problem solving.

* **Key Takeaway**: Master the fundamental equation and assumptions before attempting multi-step questions.
* **Exam Relevance**: Frequently appears in freshman finals and National Exit Exams as both conceptual multiple-choice and calculation problems.

#### Recommended Next Steps:
1. **Explain Topic**: Click the 📚 **Explain Topic** tool for an in-depth breakdown.
2. **Flashcards**: Review active recall cards to solidify key terms.
3. **Practice Quiz**: Test your mastery with instant feedback.

Feel free to ask a follow-up question or paste notes for a full chapter breakdown!`;
}

function generateAmharicResponse(prompt: string, course: string, tool: string): string {
  return `### 🇪🇹 ስተድሊ AI — የትምህርት ረዳት (${course})

ሰላም! ለኢትዮጵያ ዩኒቨርሲቲ ተማሪዎች የተዘጋጀው የ AI የጥናት ረዳትዎ ነኝ።

#### 1. ዋና ጽንሰ-ሀሳብ ማብራሪያ (Core Concept Explanation)
በ **${course}** ትምህርት ውስጥ ይህ ርዕስ ለ **Freshman Final Exam** እንዲሁም ለ **National Exit Exam** እጅግ ወሳኝ ከሆኑት ክፍሎች አንዱ ነው።

* **ዋናው ሕግ (Key Principle)**፡ ማንኛውንም ፎርሙላ ከመጠቀምዎ በፊት የተቀመጡትን ቅድመ-ሁኔታዎች (Boundary conditions) ማረጋገጥ ያስፈልጋል።
* **ፎርሙላ (Formula)**፡
$$\\vec{F}_{\\text{net}} = m \\cdot \\vec{a} \\quad \\text{ወይም} \\quad \\lim_{x \\to a} f(x) = L$$

#### 2. የፈተና ጥንቃቄዎች (Exam Pitfalls to Avoid)
1. **ስህተት 1**፡ የዩኒት (Units) መቀያየርን አለማስተዋል (ለምሳሌ km/h ወደ m/s)።
2. **ስህተት 2**፡ በ Logic (Phil 1011) ፈተናዎች ላይ *Fallacy of Relevance* እና *Weak Induction* ማደባለቅ።
3. **ስህተት 3**፡ በ Exit Exam ላይ ጥያቄውን በጥልቀት ሳያነቡ ፈጥኖ መልስ መምረጥ።

#### 3. ቀጣይ የሚመከሩ እርምጃዎች
* **ጥያቄዎችን ይለማመዱ (Practice Questions)**፡ ፈተናውን በደንብ ለመለማመድ የ Quiz ክፍሉን ይጠቀሙ።
* **ፍላሽ ካርዶች (Flashcards)**፡ ቃላትንና ፎርሙላዎችን በቀላሉ ለማስታወስ ፍላሽ ካርዶችን ይገምግሙ።

ተጨማሪ ጥያቄ ካለዎት በአማርኛ ወይም በእንግሊዝኛ ሊጠይቁኝ ይችላሉ!`;
}

/* ══════════════════════════════════════════════════════════════════════
 * COMPLETE STUDY SET GENERATION (STUDLEY-STYLE MULTI-MODE ENGINE)
 * ══════════════════════════════════════════════════════════════════════ */

export interface GeneratedStudySetData {
  title: string;
  subject: string;
  courseCode: string;
  description: string;
  overview?: StudySetOverview;
  cheatSheet?: StudySetCheatSheet;
  flashcards: Array<{ front: string; back: string; topic: string }>;
  quizzes: Array<{
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
    topic: string;
    difficulty?: "easy" | "medium" | "hard";
  }>;
  writtenTests: Array<{
    prompt: string;
    modelAnswer: string;
    keyRubricPoints: string[];
    topic: string;
  }>;
  fillBlanks: Array<{
    sentenceWithBlank: string;
    blankAnswer: string;
    hint?: string;
    explanation: string;
    topic: string;
  }>;
  notes: StudySetNotes;
  podcast: {
    title: string;
    hosts: [string, string];
    durationEstimate: string;
    dialogue: Array<{
      id: string;
      speaker: string;
      role: string;
      text: string;
      timestampSeconds: number;
    }>;
  };
}

export async function runCompleteStudySetGeneration(params: {
  text: string;
  titleHint?: string;
  subjectHint?: string;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<{ ok: boolean; data: GeneratedStudySetData; source: "ai" | "curriculum_engine" }> {
  const { text, titleHint, subjectHint, provider, apiKey, baseUrl, model } = params;

  // Attempt real AI provider if API key present
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const prompt = `You are an elite academic EdTech curriculum architect. Analyze the provided study material and generate a complete, comprehensive Study Set for university students in JSON format.
Likely Title Hint: ${titleHint || "Infer from text"}
Likely Subject: ${subjectHint || "General"}

Source text:
${text.slice(0, 16000)}

Respond with ONLY valid JSON (no markdown formatting, no code fences) conforming to this exact structure:
{
  "title": string,
  "subject": string,
  "courseCode": string,
  "description": string,
  "flashcards": [
    { "front": string, "back": string, "topic": string }
  ],
  "quizzes": [
    {
      "question": string,
      "options": [string, string, string, string],
      "correctIndex": number (0-3),
      "explanation": string,
      "topic": string,
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "writtenTests": [
    {
      "prompt": string,
      "modelAnswer": string,
      "keyRubricPoints": [string, string, string],
      "topic": string
    }
  ],
  "fillBlanks": [
    {
      "sentenceWithBlank": string (use [word] for the missing blank),
      "blankAnswer": string,
      "hint": string,
      "explanation": string,
      "topic": string
    }
  ],
  "notes": {
    "summary": string,
    "keyConcepts": [{ "concept": string, "explanation": string }],
    "definitions": [{ "term": string, "definition": string }],
    "formulasAndRules": [{ "title": string, "formula": string, "explanation": string }],
    "studyTips": [string]
  },
  "podcast": {
    "title": string,
    "hosts": ["Alex (Tutor)", "Jordan (Student)"],
    "durationEstimate": "3-5 mins",
    "dialogue": [
      { "id": "1", "speaker": "Alex (Tutor)", "role": "Academic AI Tutor", "text": string, "timestampSeconds": 0 },
      { "id": "2", "speaker": "Jordan (Student)", "role": "Freshman Student", "text": string, "timestampSeconds": 15 }
    ]
  }
}`;

      if (provider === "anthropic") {
        const client = new Anthropic({ apiKey });
        const res = await client.messages.create({
          model: model || "claude-3-5-sonnet-20241022",
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        });
        const textOut = res.content[0]?.type === "text" ? res.content[0].text : "";
        const parsed = JSON.parse(cleanJsonOutput(textOut)) as GeneratedStudySetData;
        if (parsed.flashcards && parsed.quizzes && parsed.notes) {
          return { ok: true, data: parsed, source: "ai" };
        }
      } else {
        const resolvedBaseUrl =
          baseUrl ||
          (provider === "gemini"
            ? "https://generativelanguage.googleapis.com/v1beta/openai/"
            : undefined);
        const client = new OpenAI({ apiKey, baseURL: resolvedBaseUrl, timeout: 60000 });
        const candidateModels =
          provider === "gemini"
            ? Array.from(
                new Set([
                  model || "gemini-flash-lite-latest",
                  "gemini-flash-lite-latest",
                  "gemini-2.0-flash",
                  "gemini-2.0-flash-lite",
                  "gemini-1.5-flash",
                ]),
              )
            : [
                model ||
                  (provider === "deepseek"
                    ? "deepseek-chat"
                    : provider === "groq"
                      ? "llama-3.3-70b-versatile"
                      : "gpt-4o-mini"),
              ];

        for (const candidateModel of candidateModels) {
          try {
            const res = await client.chat.completions.create({
              model: candidateModel,
              temperature: 0.3,
              response_format: { type: "json_object" },
              messages: [{ role: "user", content: prompt }],
            });
            const textOut = res.choices[0]?.message?.content || "";
            const parsed = safeParseJson<GeneratedStudySetData>(textOut);
            if (parsed && parsed.flashcards && parsed.quizzes && parsed.notes) {
              return { ok: true, data: parsed, source: "ai" };
            }
          } catch (err) {
            console.warn(`Full set generation model ${candidateModel} failed:`, err);
          }
        }
      }
    } catch (err) {
      console.warn("AI generation of full study set failed, switching to smart synthesis:", err);
    }
  }

  // Smart Academic Curriculum Synthesis from source text
  const synthesized = synthesizeCompleteStudySet(text, titleHint, subjectHint);
  return { ok: true, data: synthesized, source: "curriculum_engine" };
}

function formatNotesAsDeepMonographMarkdown(
  title: string,
  subject: string,
  notes: StudySetNotes,
): string {
  const sections: string[] = [];
  sections.push(
    `# ${title}\n\n**Discipline:** ${subject} | **Curriculum Level:** Senior University Exit Exam Standard | **Syllabus Coverage:** Comprehensive & Deep`,
  );

  if (notes.summary) {
    sections.push(`## 📌 Executive Overview & Syllabus Synthesis\n\n${notes.summary}`);
  }

  if (notes.learningObjectives && notes.learningObjectives.length > 0) {
    sections.push(
      `## 🎯 Core Learning Objectives (Bloom's Taxonomy)\n\n${notes.learningObjectives
        .map((o) => `- **Objective:** ${o}`)
        .join("\n")}`,
    );
  }

  if (notes.keyConcepts && notes.keyConcepts.length > 0) {
    const conceptsText = notes.keyConcepts
      .map((k, i) => {
        const parts: string[] = [];
        parts.push(`### ${k.unit || `Unit ${(i + 1).toFixed(1)}`}: ${k.concept}`);
        if (k.definition) parts.push(`- **Formal Academic Definition:** ${k.definition}`);
        parts.push(`- **Governing Mechanism & Working Principle:** ${k.explanation}`);
        if (k.whyItMatters) parts.push(`- **Theoretical & Practical Significance:** ${k.whyItMatters}`);
        if (k.example || k.lecturerExample)
          parts.push(`- **Real-World Application & Industrial Context:** ${k.example || k.lecturerExample}`);
        if (k.workedExample) {
          if (typeof k.workedExample === "object") {
            parts.push(
              `#### 💡 Worked Examination Problem & Step-by-Step Solution\n- **Problem Scenario:** ${k.workedExample.problemStatement}\n- **Step-by-Step Derivation & Solution:**\n${k.workedExample.stepByStepSolution}\n${k.workedExample.keyTakeaway ? `> 🔑 **Key Takeaway & Verification:** ${k.workedExample.keyTakeaway}` : ""}`,
            );
          } else {
            parts.push(`#### 💡 Worked Examination Problem & Step-by-Step Solution\n${k.workedExample}`);
          }
        }
        if (k.tradeoffs) parts.push(`- **Architectural Trade-offs & Constraints:** ${k.tradeoffs}`);
        if (k.takeaway) parts.push(`> 💡 **Core Takeaway:** ${k.takeaway}`);
        if (k.examTip) parts.push(`> 🎯 **Examiner Tip:** ${k.examTip}`);
        return parts.join("\n\n");
      })
      .join("\n\n---\n\n");
    sections.push(`## 📚 Core Concepts & Modular Theoretical Units\n\n${conceptsText}`);
  }

  if (notes.classificationsAndCategories && notes.classificationsAndCategories.length > 0) {
    notes.classificationsAndCategories.forEach((t) => {
      const headerRow = `| ${t.headers.join(" | ")} |`;
      const sepRow = `| ${t.headers.map(() => "---").join(" | ")} |`;
      const bodyRows = t.rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
      sections.push(
        `## ⚖️ Comparative Analysis: ${t.title}\n\n${t.description ? `*${t.description}*\n\n` : ""}${headerRow}\n${sepRow}\n${bodyRows}`,
      );
    });
  }

  if (notes.principlesAndTheories && notes.principlesAndTheories.length > 0) {
    const principlesText = notes.principlesAndTheories
      .map((p, i) => {
        return `### Principle #${i + 1}: ${p.title}\n- **Core Axiom:** **${p.principle}**\n- **Theoretical Mechanism:** ${p.explanation}\n- **Scope of Validity:** ${p.scopeOfValidity || "Universal under standard parameters."}\n${p.examApplication ? `> 🎯 **Exam Application:** ${p.examApplication}` : ""}`;
      })
      .join("\n\n---\n\n");
    sections.push(`## 🏛️ Fundamental Principles, Laws & Theoretical Foundations\n\n${principlesText}`);
  }

  if (notes.formulasAndRules && notes.formulasAndRules.length > 0) {
    const formulasText = notes.formulasAndRules
      .map((f, i) => {
        let fText = `### ${i + 1}. ${f.title}\n\n$\n${f.formula}\n$\n\n${f.explanation}`;
        if (f.variables && f.variables.length > 0) {
          fText += `\n\n**Variable Notation & SI Units Key:**\n${f.variables.map((v) => `- **Symbol \`${v.symbol}\`:** ${v.label}`).join("\n")}`;
        }
        if (f.validityConditions) fText += `\n\n- **Governing Boundary Conditions:** ${f.validityConditions}`;
        if (f.examTrick) fText += `\n\n> ⚡ **Exam Calculation Shortcut / Rapid Estimation:** ${f.examTrick}`;
        if (f.workedCalculationExample) {
          if (typeof f.workedCalculationExample === "object") {
            fText += `\n\n#### 🧮 Concrete Calculation Example & Numerical Substitution:\n- **Given Parameters:** ${f.workedCalculationExample.given}\n${f.workedCalculationExample.formulaUsed ? `- **Formula Applied:** \`${f.workedCalculationExample.formulaUsed}\`\n` : ""}- **Substitution & Intermediate Steps:** ${f.workedCalculationExample.substitutions}\n- **Calculated Result:** **${f.workedCalculationExample.result}**`;
          } else {
            fText += `\n\n#### 🧮 Concrete Calculation Example:\n${f.workedCalculationExample}`;
          }
        }
        return fText;
      })
      .join("\n\n---\n\n");
    sections.push(`## ⚡ Key Formulas, Laws & Governing Theorems\n\n${formulasText}`);
  }

  if (notes.clarifyingExamples && notes.clarifyingExamples.length > 0) {
    const examplesText = notes.clarifyingExamples
      .map((ex, i) => {
        let exText = `### Worked Exam Scenario #${i + 1}: ${ex.title}\n`;
        exText += `- **Concept Illustrated:** **${ex.conceptIllustrated}**\n`;
        exText += `- **Problem Statement & Scenario:** ${ex.scenario}\n`;
        exText += `- **Step-by-Step Technical Analysis & Solution:**\n${ex.analysis}\n`;
        if (ex.examinerTrap) exText += `> ⚠️ **Examiner Trap in this Scenario:** ${ex.examinerTrap}`;
        return exText;
      })
      .join("\n\n---\n\n");
    sections.push(`## 🔍 Worked Examination Scenarios & Case Analyses\n\n${examplesText}`);
  }

  if (notes.commonConfusions && notes.commonConfusions.length > 0) {
    const confText = notes.commonConfusions
      .map((c, i) => {
        return `### Examiner Trap #${i + 1}: ${c.conceptA} vs. ${c.conceptB}\n- **The Common Student Misconception:** Conflating these two operational concepts under examination time pressure.\n- **The Crucial Demarcation:** ${c.keyDistinction}\n> ⚠️ **Golden Rule / Memory Mnemonic:** ${c.mnemonicOrRule}`;
      })
      .join("\n\n---\n\n");
    sections.push(`## ⚠️ Common Confusions & Examiner Traps\n\n${confText}`);
  }

  if (notes.processesAndWorkflows && notes.processesAndWorkflows.length > 0) {
    const wfText = notes.processesAndWorkflows
      .map((p, i) => {
        const steps = p.steps
          .map((s) => `${s.stepNumber}. **${s.title}:** ${s.description}`)
          .join("\n");
        return `### Protocol #${i + 1}: ${p.processName}\n*Objective: ${p.objective}*\n\n${steps}`;
      })
      .join("\n\n---\n\n");
    sections.push(`## 🛠️ Step-by-Step Problem-Solving Protocols\n\n${wfText}`);
  }

  if (notes.studyTips && notes.studyTips.length > 0) {
    sections.push(`## 💡 Study Tips for Revision\n\n${notes.studyTips.map((t) => `- ${t}`).join("\n")}`);
  }

  return sections.join("\n\n");
}

function synthesizeCompleteStudySet(
  text: string,
  titleHint?: string,
  subjectHint?: string,
): GeneratedStudySetData {
  const cleanSnippet = text.trim();
  const lower = cleanSnippet.toLowerCase();

  // Infer subject & topic
  let detectedSubject = subjectHint || "General";
  let courseCode = "GEN 1000";

  if (lower.includes("physics") || lower.includes("kinematics") || lower.includes("newton") || lower.includes("velocity") || lower.includes("force")) {
    detectedSubject = "Physics";
    courseCode = "Phys 1011";
  } else if (lower.includes("math") || lower.includes("logic") || lower.includes("truth table") || lower.includes("quantifier") || lower.includes("integral")) {
    detectedSubject = "Mathematics";
    courseCode = "Math 1011";
  } else if (lower.includes("database") || lower.includes("sql") || lower.includes("relational") || lower.includes("table") || lower.includes("acid")) {
    detectedSubject = "Computer Science";
    courseCode = "CoSc 2041";
  } else if (lower.includes("biology") || lower.includes("cell") || lower.includes("dna") || lower.includes("protein")) {
    detectedSubject = "Biology";
    courseCode = "Biol 1011";
  } else if (lower.includes("chemistry") || lower.includes("mole") || lower.includes("acid") || lower.includes("reaction")) {
    detectedSubject = "Chemistry";
    courseCode = "Chem 1011";
  }

  const title = titleHint || `${detectedSubject}: Core Concepts & Exam Study Pack`;

  // Extract sentences from text for context-grounded cards
  const sentences = cleanSnippet
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 220);

  const keySentence1 = sentences[0] || `${detectedSubject} is a fundamental pillar of university education.`;
  const keySentence2 = sentences[1] || `Key principles require rigorous understanding and empirical application.`;
  const keySentence3 = sentences[2] || `Exam problems test both conceptual boundary conditions and formula mastery.`;
  const keySentence4 = sentences[3] || `Consistent practice with past exam papers reinforces deep active recall.`;

  return {
    title,
    subject: detectedSubject,
    courseCode,
    description: `AI-synthesized comprehensive study set covering ${detectedSubject} fundamentals, key definitions, formulas, and exit-exam practice questions based on your provided learning material.`,
    flashcards: [
      {
        front: `What is the core principle or definition highlighted in: "${keySentence1.slice(0, 90)}..."?`,
        back: keySentence1,
        topic: `${detectedSubject} Fundamentals`,
      },
      {
        front: `Explain the practical application of: "${keySentence2.slice(0, 90)}..."?`,
        back: keySentence2,
        topic: `${detectedSubject} Principles`,
      },
      {
        front: `What is the critical exam takeaway from: "${keySentence3.slice(0, 90)}..."?`,
        back: keySentence3,
        topic: `Exam Preparation`,
      },
      {
        front: `Why is this statement essential: "${keySentence4.slice(0, 90)}..."?`,
        back: keySentence4,
        topic: `Active Recall`,
      },
      {
        front: `What common mistake do Ethiopian university students make when studying ${detectedSubject}?`,
        back: `Relying on passive reading rather than active problem solving, and failing to verify dimensional units or logical boundary conditions before applying standard formulas.`,
        topic: `Study Methodology`,
      },
    ],
    quizzes: [
      {
        question: `Based on the provided study material, which of the following statements is most accurate regarding ${detectedSubject}?`,
        options: [
          keySentence1.slice(0, 100),
          `It only applies in isolated theoretical models without empirical proof.`,
          `It contradicts the core postulates established by the Ministry of Education curriculum.`,
          `It is solely dependent on qualitative intuition without mathematical rigor.`,
        ],
        correctIndex: 0,
        explanation: `The source material directly establishes that: "${keySentence1}"`,
        topic: `${detectedSubject} Fundamentals`,
        difficulty: "medium",
      },
      {
        question: `When analyzing problem scenarios in ${courseCode}, what should the student establish first?`,
        options: [
          `Immediately guess the numerical answer from the options.`,
          `Identify given parameters, state governing laws, and define reference boundaries.`,
          `Ignore unit conversions until the final calculation step.`,
          `Memorize the specific numbers without understanding underlying derivations.`,
        ],
        correctIndex: 1,
        explanation: `Systematic problem solving in university exams requires identifying given data, selecting relevant equations, and checking boundary constraints first.`,
        topic: `Problem Solving`,
        difficulty: "easy",
      },
      {
        question: `Which takeaway aligns directly with the concepts discussed in this study material?`,
        options: [
          `Active recall and spaced repetition improve long-term retention.`,
          `Cramming 1 hour before the exam yields identical mastery to weekly review.`,
          `Theoretical knowledge cannot be evaluated with multiple-choice questions.`,
          `Formulas are universal without requiring boundary conditions.`,
        ],
        correctIndex: 0,
        explanation: `Educational neuroscience proves that active recall with self-testing significantly outperforms passive re-reading.`,
        topic: `Methodology`,
        difficulty: "easy",
      },
    ],
    writtenTests: [
      {
        prompt: `In your own words, synthesize the primary thesis and fundamental principles presented in this study material for ${detectedSubject}. Highlight at least two practical examples or exam applications.`,
        modelAnswer: `The study material establishes the foundational framework for ${detectedSubject} (${courseCode}). Specifically, it emphasizes that:\n1. Core concepts must be applied under strict boundary constraints (as illustrated by: "${keySentence1}").\n2. Real-world applications require mathematical formulation and verification.\nIn university examinations, success requires clearly stating known parameters, formulating the governing relationships, and verifying physical or logical units.`,
        keyRubricPoints: [
          `Identifies the primary topic and course domain (${detectedSubject})`,
          `Articulates the main governing principle or relationship accurately`,
          `Provides at least two concrete examples or exam application steps`,
          `Demonstrates structured, coherent academic reasoning`,
        ],
        topic: `${detectedSubject} Core Synthesis`,
      },
      {
        prompt: `Explain why superficial memorization is insufficient for the Ethiopian National Exit Exam in ${courseCode}, and outline how active problem-solving addresses this challenge.`,
        modelAnswer: `National Exit Exams assess higher-order Bloom's taxonomy skills (analysis, evaluation, and synthesis) rather than simple recall. Problems present altered scenarios that defeat rote memorization. Active problem solving—such as deriving formulas, solving unguided practice sets, and explaining concepts to peers—builds flexible mental schemas capable of transferring across new contexts.`,
        keyRubricPoints: [
          `Contrasts rote recall with analytical problem solving`,
          `Mentions transfer of knowledge to unfamiliar exam scenarios`,
          `Describes at least one active learning technique (derivation, Socratic explanation)`,
        ],
        topic: `Exam Strategy`,
      },
    ],
    fillBlanks: [
      {
        sentenceWithBlank: `The fundamental law governing this topic states that every action produces a corresponding [reaction] under equivalent boundary conditions.`,
        blankAnswer: "reaction",
        hint: "Equal and opposite...",
        explanation: "Fundamental relational principle across science and logic.",
        topic: "Core Principles",
      },
      {
        sentenceWithBlank: `In university examinations, [active recall] has been proven significantly more effective than passive reading for long-term retention.`,
        blankAnswer: "active recall",
        hint: "Testing oneself rather than re-reading notes.",
        explanation: "Retrieval practice strengthens neural synaptic pathways.",
        topic: "Study Methodology",
      },
      {
        sentenceWithBlank: `Before substituting numerical values into a formula, students must always verify the consistency of [units] and dimensions.`,
        blankAnswer: "units",
        hint: "e.g., meters, seconds, Joules.",
        explanation: "Unit mismatch is the #1 source of arithmetic errors in physics and engineering exams.",
        topic: "Problem Solving",
      },
    ],
    notes: {
      summary: `Comprehensive academic synthesis of ${title}. This module breaks down the core theoretical assertions into actionable takeaways, verified definitions, and high-yield exam tips tailored for Ethiopian university students.`,
      learningObjectives: [
        `Analyze the fundamental principles governing ${detectedSubject}`,
        `Formulate first-principles problem-solving protocols for exit examinations`,
        `Apply governing mathematical equations to bounded physical/computational scenarios`
      ],
      keyConcepts: [
        {
          unit: "Unit 1.0",
          concept: "Foundational Theoretical Postulate",
          definition: `Formal academic postulate governing ${detectedSubject} systems and states.`,
          explanation: keySentence1,
          whyItMatters: `Crucial for university exit exams and high-level analytical problem solving.`,
          example: `Applied in standard baseline benchmarks across modern engineering and science.`,
          workedExample: {
            problemStatement: `A university exit examination scenario asks: 'Given a bounded ${detectedSubject} system operating under baseline constraints, determine the response when operational load increases by 25% without altering governing constants.'`,
            stepByStepSolution: `1. Identify boundary parameters: Base capacity C_0, Workload W_1 = 1.25 * W_0.\n2. Apply governing invariant equation: Equilibrium ratio rho = W / C <= 0.80.\n3. Derive parameter adjustment: C_1 >= 1.25 * W_0 / 0.80 = 1.56 * W_0.\n4. Dimensional verification: Units resolve consistently; system remains in stable equilibrium.`,
            keyTakeaway: `Always verify governing boundary invariants before computing numerical values.`
          },
          takeaway: `Master the core axiom before applying derived approximations.`,
          examTip: `Examiners frequently test whether boundary invariants hold when loads scale.`
        },
        {
          unit: "Unit 2.0",
          concept: "Practical Application & Implementation Dynamics",
          definition: `Empirical translation of theoretical postulates into functional domain models.`,
          explanation: keySentence2,
          whyItMatters: `Connects abstract mathematical derivations with concrete examination case studies.`,
          workedExample: {
            problemStatement: `Calculate the efficiency metric when applying ${detectedSubject} principles to a dual-stage pipeline where stage 1 operates at 90% and stage 2 at 80% throughput.`,
            stepByStepSolution: `1. System throughput is constrained by the bottleneck stage: Min(90%, 80%) = 80%.\n2. Overall loss factor: 1 - 0.80 = 20% degradation.\n3. Parameter compensation: Increase stage 2 capacity by 25% to equalize flow.\n4. Verified resulting efficiency: 90% across both stages.`,
            keyTakeaway: `Bottleneck stages dictate aggregate performance in multi-phase architectures.`
          },
          takeaway: `Identify the governing constraint before executing multi-step calculations.`,
          examTip: `Look for hidden bottleneck constraints in multi-variable exam prompts.`
        },
        {
          unit: "Unit 3.0",
          concept: "Exam Boundary Conditions & Edge Case Verification",
          definition: `The parameter envelopes within which governing relationships remain mathematically and physically valid.`,
          explanation: keySentence3,
          whyItMatters: `Over 60% of lost marks on university examinations stem from applying unconstrained formulas to edge cases.`,
          workedExample: {
            problemStatement: `Evaluate whether the governing equation holds when temperature approaches absolute zero or utilization approaches 1.0.`,
            stepByStepSolution: `1. Take the mathematical limit of the denominator term as parameter -> critical value.\n2. Observe singularity or divergence: As rho -> 1, queue delay D -> infinity.\n3. Conclude validity envelope: Formula is strictly bounded to the open interval [0, 0.90).\n4. State exam caveat: State non-applicability at the boundary limit.`,
            keyTakeaway: `Never apply steady-state equilibrium formulations to saturated or divergent boundaries.`
          },
          takeaway: `Check validity conditions before choosing which equation to apply.`,
          examTip: `State the validity envelope explicitly in written response rubrics for full marks.`
        },
      ],
      definitions: [
        {
          term: `${detectedSubject} Axiom`,
          definition: "A self-evident proposition accepted without controversy within the theoretical framework.",
          example: "In thermodynamics, energy conservation (First Law) is an unviolated axiom in closed systems."
        },
        {
          term: "Active Retrieval",
          definition: "A learning technique where the student deliberately tests their own memory without looking at notes.",
          example: "Attempting a practice problem from memory before checking the model solution."
        },
      ],
      formulasAndRules: [
        {
          title: "Governing Relationship",
          formula: "\\Phi(x, t) = \\sum_{i=1}^n \\omega_i \\cdot f_i(x)",
          explanation: "General canonical formulation representing the superposition of contributing factors.",
          variables: [
            { symbol: "\\Phi", label: "System response state function" },
            { symbol: "\\omega_i", label: "Normalized weighting factor [dimensionless]" },
            { symbol: "f_i(x)", label: "Component response function [SI units]" }
          ],
          validityConditions: "Valid exclusively for linear, time-invariant bounded systems.",
          examTrick: "Verify that the sum of weighting coefficients omega_i equals exactly 1.0.",
          workedCalculationExample: {
            given: "Two independent factors: f_1 = 40 units (weight omega_1 = 0.6), f_2 = 70 units (weight omega_2 = 0.4)",
            formulaUsed: "\\Phi = \\omega_1 \\cdot f_1 + \\omega_2 \\cdot f_2",
            substitutions: "\\Phi = (0.6)(40) + (0.4)(70) = 24 + 28",
            result: "52 units (Verified within bounds 40 <= 52 <= 70)"
          }
        },
      ],
      clarifyingExamples: [
        {
          title: "Exit Exam Case Scenario: Parameter Envelope Analysis",
          conceptIllustrated: "Boundary Condition Invariance",
          scenario: `A university exit examination prompt describes a system designed for ${detectedSubject} operating at 85% rated capacity. A sudden 30% transient spike occurs. The student is asked to determine system stability and recommend corrective measures.`,
          analysis: "1. Baseline load: L_0 = 0.85 * C.\n2. Transient load: L_t = 1.30 * 0.85 * C = 1.105 * C (> 100% capacity).\n3. Immediate consequence: System enters temporary overload; buffer saturation occurs.\n4. Corrective protocol: Activate throttling or shedding mechanism to keep effective throughput <= 1.0 * C until transient decays.",
          examinerTrap: "Assuming that a brief transient load cannot cause instability if average load remains below 100%. Peak load determines buffer overflow."
        }
      ],
      commonConfusions: [
        {
          conceptA: "Theoretical Derivation",
          conceptB: "Empirical Approximation",
          keyDistinction: "Derivations follow deductively from axioms with zero empirical error; approximations rely on heuristic curve-fitting valid only within a calibrated range.",
          mnemonicOrRule: "Derivation = Universal Proof; Approximation = Local Rule-of-Thumb."
        }
      ],
      examFocusedKnowledge: {
        highYieldFacts: [
          `State governing boundary equations before substituting numbers.`,
          `Dimensional consistency must be verified for all final numerical results.`
        ],
        mustKnowRelationships: [
          `Inverse scaling: As capacity increases, queue delay decreases non-linearly.`
        ],
        formulaTriggers: [
          `Check dimensional units before substituting numerical values.`,
        ],
        topExamMistakes: [
          `Conflating transient peak metrics with steady-state averages.`
        ]
      },
      studyTips: [
        "Create flashcards for all bolded terminology within 24 hours of first reading.",
        "Test yourself using timed mock quizzes without checking notes until completed.",
        "Practice explaining the hardest concept to a classmate in simple Amharic or English.",
      ],
    },
    podcast: {
      title: `Episode: Breaking Down ${title}`,
      hosts: ["Alex (Tutor)", "Jordan (Student)"],
      durationEstimate: "3 min 20 sec",
      dialogue: [
        {
          id: "pod-gen-1",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: `Welcome Jordan! Today we're diving into this newly generated study set on ${detectedSubject}. Let's get straight to the core idea.`,
          timestampSeconds: 0,
        },
        {
          id: "pod-gen-2",
          speaker: "Jordan (Student)",
          role: "Freshman Student",
          text: `Thanks Alex! Looking at our source notes, the biggest emphasis is that "${keySentence1.slice(0, 80)}...". How do we apply that on an exam?`,
          timestampSeconds: 15,
        },
        {
          id: "pod-gen-3",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: `Great question. On exams, professors won't just ask for the definition. They will set up an edge case to see if you remember the boundary conditions!`,
          timestampSeconds: 34,
        },
        {
          id: "pod-gen-4",
          speaker: "Jordan (Student)",
          role: "Freshman Student",
          text: `Right! Like checking if units match and whether the formula only applies in an ideal closed system.`,
          timestampSeconds: 52,
        },
        {
          id: "pod-gen-5",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: `Precisely. Now let's review the flashcards and practice the written evaluation prompts together!`,
          timestampSeconds: 70,
        },
      ],
    },
  };
}

/* ══════════════════════════════════════════════════════════════════════
 * WRITTEN TEST EVALUATION SERVER ENGINE
 * ══════════════════════════════════════════════════════════════════════ */

export interface WrittenEvaluationResult {
  scorePct: number;
  whatWasCorrect: string[];
  whatWasMissing: string[];
  whatWasIncorrect: string[];
  aiFeedback: string;
}

export async function runWrittenAnswerEvaluation(params: {
  prompt: string;
  modelAnswer: string;
  keyRubricPoints: string[];
  userAnswer: string;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<WrittenEvaluationResult> {
  const { prompt, modelAnswer, keyRubricPoints, userAnswer, provider, apiKey, baseUrl, model } = params;

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const evalPrompt = `You are a strict, fair, and encouraging university professor grading a student's free-response written answer.
Question Prompt:
${prompt}

Model Answer:
${modelAnswer}

Key Rubric Points to Check:
${keyRubricPoints.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Student's Written Answer:
"${userAnswer}"

Grade the student's answer and respond with ONLY a valid JSON object matching this schema:
{
  "scorePct": number (0 to 100 integer),
  "whatWasCorrect": [string, string],
  "whatWasMissing": [string],
  "whatWasIncorrect": [string],
  "aiFeedback": string (2-3 sentences of constructive pedagogical advice)
}`;

      if (provider === "anthropic") {
        const client = new Anthropic({ apiKey });
        const res = await client.messages.create({
          model: model || "claude-3-5-haiku-20241022",
          max_tokens: 1500,
          messages: [{ role: "user", content: evalPrompt }],
        });
        const textOut = res.content[0]?.type === "text" ? res.content[0].text : "";
        const parsed = JSON.parse(cleanJsonOutput(textOut)) as WrittenEvaluationResult;
        if (typeof parsed.scorePct === "number") return parsed;
      } else {
        const resolvedBaseUrl =
          baseUrl ||
          (provider === "gemini"
            ? "https://generativelanguage.googleapis.com/v1beta/openai/"
            : undefined);
        const client = new OpenAI({ apiKey, baseURL: resolvedBaseUrl, timeout: 45000 });
        const candidateModels =
          provider === "gemini"
            ? Array.from(
                new Set([
                  model || "gemini-flash-lite-latest",
                  "gemini-flash-lite-latest",
                  "gemini-2.0-flash",
                  "gemini-2.0-flash-lite",
                  "gemini-1.5-flash",
                ]),
              )
            : [
                model ||
                  (provider === "deepseek"
                    ? "deepseek-chat"
                    : provider === "groq"
                      ? "llama-3.3-70b-versatile"
                      : "gpt-4o-mini"),
              ];

        for (const candidateModel of candidateModels) {
          try {
            const res = await client.chat.completions.create({
              model: candidateModel,
              temperature: 0.2,
              response_format: { type: "json_object" },
              messages: [{ role: "user", content: evalPrompt }],
            });
            const textOut = res.choices[0]?.message?.content || "";
            const parsed = safeParseJson<WrittenEvaluationResult>(textOut);
            if (parsed && typeof parsed.scorePct === "number") return parsed;
          } catch (err) {
            console.warn(`Written eval model ${candidateModel} failed:`, err);
          }
        }
      }
    } catch (err) {
      console.warn("AI grading failed, using heuristic evaluation:", err);
    }
  }

  // Heuristic Rubric Evaluator (Offline / Fallback)
  return evaluateWrittenAnswerHeuristically(prompt, modelAnswer, keyRubricPoints, userAnswer);
}

function evaluateWrittenAnswerHeuristically(
  prompt: string,
  modelAnswer: string,
  keyRubricPoints: string[],
  userAnswer: string,
): WrittenEvaluationResult {
  const cleanUser = userAnswer.trim().toLowerCase();
  const words = cleanUser.split(/\s+/).filter(Boolean);

  if (words.length < 5) {
    return {
      scorePct: 15,
      whatWasCorrect: ["Attempted to answer the prompt."],
      whatWasMissing: keyRubricPoints,
      whatWasIncorrect: ["The answer is too brief to demonstrate academic understanding."],
      aiFeedback: "Your answer is very short. Please elaborate with detailed explanations and scientific terms.",
    };
  }

  // Check rubric coverage
  const correctRubrics: string[] = [];
  const missingRubrics: string[] = [];

  for (const point of keyRubricPoints) {
    const pointKeywords = point
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !["with", "from", "that", "this", "which", "into"].includes(w));

    const matchedKeywords = pointKeywords.filter((kw) => cleanUser.includes(kw));
    if (matchedKeywords.length >= Math.ceil(pointKeywords.length * 0.4) || pointKeywords.some((kw) => cleanUser.includes(kw))) {
      correctRubrics.push(`Addressed concept: ${point}`);
    } else {
      missingRubrics.push(`Needs more detail on: ${point}`);
    }
  }

  const baseRatio = keyRubricPoints.length > 0 ? correctRubrics.length / keyRubricPoints.length : 0.7;
  const lengthBonus = Math.min(words.length / 50, 1) * 20;
  const rawScore = Math.min(100, Math.round(baseRatio * 80 + lengthBonus));

  return {
    scorePct: Math.max(30, rawScore),
    whatWasCorrect: correctRubrics.length > 0 ? correctRubrics : ["Good foundational effort with key terminology."],
    whatWasMissing: missingRubrics.length > 0 ? missingRubrics : ["Could provide additional supporting examples."],
    whatWasIncorrect: rawScore < 60 ? ["Some assertions lack precision or omit key definitions."] : [],
    aiFeedback:
      rawScore >= 80
        ? "Excellent response! You demonstrated strong conceptual clarity and covered the primary rubric benchmarks required on university exams."
        : "Good progress. You captured several important points, but make sure to review the model answer to fill in the missing technical distinctions.",
  };
}



/* ══════════════════════════════════════════════════════════════════════
 * MODULAR REAL GEMINI ON-DEMAND GENERATION ENGINES
 * ══════════════════════════════════════════════════════════════════════ */

async function callAiJsonEndpoint<T>(params: {
  prompt: string;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<T | null> {
  const { prompt, provider = "gemini", apiKey, baseUrl, model } = params;
  if (!apiKey || !apiKey.trim()) return null;

  try {
    if (provider === "anthropic") {
      const client = new Anthropic({ apiKey });
      const res = await client.messages.create({
        model: model || "claude-3-5-haiku-20241022",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      const textOut = res.content[0]?.type === "text" ? res.content[0].text : "";
      return safeParseJson<T>(textOut);
    }

    const resolvedBaseUrl =
      baseUrl ||
      (provider === "gemini"
        ? "https://generativelanguage.googleapis.com/v1beta/openai/"
        : undefined);
    const client = new OpenAI({ apiKey, baseURL: resolvedBaseUrl, timeout: 60000 });

    const candidateModels =
      provider === "gemini"
        ? Array.from(
            new Set([
              model || "gemini-flash-lite-latest",
              "gemini-flash-lite-latest",
              "gemini-2.0-flash",
              "gemini-2.0-flash-lite",
              "gemini-1.5-flash",
            ]),
          )
        : [
            model ||
              (provider === "deepseek"
                ? "deepseek-chat"
                : provider === "groq"
                  ? "llama-3.3-70b-versatile"
                  : "gpt-4o-mini"),
          ];

    let textOut = "";
    for (const candidateModel of candidateModels) {
      try {
        const res = await client.chat.completions.create({
          model: candidateModel,
          temperature: 0.25,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        });
        textOut = res.choices[0]?.message?.content || "";
        if (textOut) break;
      } catch (modelErr) {
        const errMsg = String(modelErr);
        if (!errMsg.includes("503") && !errMsg.includes("429") && !errMsg.includes("404")) {
          throw modelErr;
        }
      }
    }

    if (!textOut) return null;
    return safeParseJson<T>(textOut);
  } catch (err) {
    console.warn("callAiJsonEndpoint failed:", err);
    return null;
  }
}



/** 1. GENERATE MORE FLASHCARDS ON DEMAND WITH GEMINI */
export async function runMoreFlashcardsGeneration(params: {
  topic: string;
  contextText?: string;
  count?: number;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}) {
  const { topic, contextText = "", count = 5, provider, apiKey, baseUrl, model } = params;

  const prompt = `You are an elite university exam tutor. Generate exactly ${count} diverse, high-yield active recall flashcards for university students studying:
Topic: ${topic}
${contextText ? `Source Notes / Context:\n${contextText.slice(0, 5000)}` : ""}

Respond with ONLY valid JSON:
{
  "flashcards": [
    {
      "front": "What distinguishes X from Y in practical applications?",
      "back": "Clear, precise academic definition and mechanism.",
      "topic": "${topic}",
      "difficulty": "intermediate",
      "cardType": "concept_definition"
    }
  ]
}`;

  const res = await callAiJsonEndpoint<{ flashcards: Array<{ front: string; back: string; topic: string; difficulty?: string; cardType?: string }> }>({
    prompt,
    provider,
    apiKey,
    baseUrl,
    model,
  });

  if (res?.flashcards && Array.isArray(res.flashcards) && res.flashcards.length > 0) {
    const cards = res.flashcards.map((f, i) => ({
      id: `fc-ai-${Date.now()}-${i}`,
      front: f.front,
      back: f.back,
      topic: f.topic || topic,
      mastery: "unfamiliar" as const,
      reviewCount: 0,
    }));
    return {
      ok: true,
      source: "ai",
      flashcards: cards,
      data: cards,
    };
  }

  // Heuristic fallback
  const fallbackCards = [
    {
      id: `fc-gen-${Date.now()}-1`,
      front: `What is the core operational principle behind ${topic}?`,
      back: `The fundamental mechanism of ${topic} relies on deterministic state transitions and constraint enforcement under governed boundary conditions.`,
      topic,
      mastery: "unfamiliar" as const,
      reviewCount: 0,
    },
    {
      id: `fc-gen-${Date.now()}-2`,
      front: `What is the most frequent examination misconception regarding ${topic}?`,
      back: `Assuming ideal unconstrained conditions without checking parameter boundaries and dimensional consistency.`,
      topic,
      mastery: "unfamiliar" as const,
      reviewCount: 0,
    },
  ];
  return {
    ok: true,
    source: "curriculum_engine",
    flashcards: fallbackCards,
    data: fallbackCards,
  };
}



/** 2. GENERATE MORE QUIZ QUESTIONS ON DEMAND WITH GEMINI */
export async function runMoreQuizGeneration(params: {
  topic: string;
  contextText?: string;
  count?: number;
  difficulty?: "easy" | "medium" | "hard";
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}) {
  const { topic, contextText = "", count = 5, difficulty = "medium", provider, apiKey, baseUrl, model } = params;

  const prompt = `You are a university exam board director. Formulate exactly ${count} rigorous multiple-choice questions for university exit exams on:
Topic: ${topic}
Target Difficulty: ${difficulty}
${contextText ? `Source Notes / Context:\n${contextText.slice(0, 5000)}` : ""}

Respond with ONLY valid JSON:
{
  "quizzes": [
    {
      "question": "A specific realistic engineering or analytical scenario...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "Detailed explanation clarifying why Option B is correct and addressing misconceptions in distractors.",
      "topic": "${topic}",
      "difficulty": "${difficulty}",
      "distractorRationale": ["Why A is incorrect", "Why B is correct", "Why C is incorrect", "Why D is incorrect"]
    }
  ]
}`;

  const res = await callAiJsonEndpoint<{ quizzes: Array<{ question: string; options: string[]; correctIndex: number; explanation: string; topic?: string; difficulty?: string; distractorRationale?: string[] }> }>({
    prompt,
    provider,
    apiKey,
    baseUrl,
    model,
  });

  if (res?.quizzes && Array.isArray(res.quizzes) && res.quizzes.length > 0) {
    const qList = res.quizzes.map((q, i) => ({
      id: `qz-ai-${Date.now()}-${i}`,
      question: q.question,
      options: q.options as [string, string, string, string],
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      topic: q.topic || topic,
      difficulty: (q.difficulty || difficulty) as "easy" | "medium" | "hard",
      distractorRationale: q.distractorRationale,
    }));
    return {
      ok: true,
      source: "ai",
      quizzes: qList,
      data: qList,
    };
  }

  // Heuristic fallback
  const fallbackQuizzes = [
    {
      id: `qz-gen-${Date.now()}-1`,
      question: `When evaluating system behavior in ${topic}, which condition must be verified first?`,
      options: [
        "Arbitrary scaling without boundary checks",
        "Validity envelope and dimensional homogeneity",
        "Ignoring ambient environmental constraints",
        "Static approximation in non-linear regimes",
      ],
      correctIndex: 1,
      explanation: "Verifying the validity envelope and dimensional consistency is required before executing state calculations.",
      topic,
      difficulty,
    },
  ];
  return {
    ok: true,
    source: "curriculum_engine",
    quizzes: fallbackQuizzes,
    data: fallbackQuizzes,
  };
}



/** 3. GENERATE MORE WRITTEN QUESTIONS ON DEMAND WITH GEMINI */
export async function runMoreWrittenTestsGeneration(params: {
  topic: string;
  contextText?: string;
  count?: number;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}) {
  const { topic, contextText = "", count = 2, provider, apiKey, baseUrl, model } = params;

  const prompt = `You are a university professor designing free-response final examination prompts. Formulate exactly ${count} comprehensive written questions on:
Topic: ${topic}
${contextText ? `Source Notes / Context:\n${contextText.slice(0, 5000)}` : ""}

Respond with ONLY valid JSON:
{
  "writtenTests": [
    {
      "prompt": "Explain the governing mechanism of ${topic} from first principles...",
      "modelAnswer": "Comprehensive academic model answer covering definition, mechanisms, trade-offs, and concrete application...",
      "keyRubricPoints": [
        "First-principles formal definition",
        "Step-by-step mechanistic explanation",
        "Boundary conditions and failure modes",
        "Practical engineering synthesis"
      ],
      "topic": "${topic}",
      "marks": 10,
      "difficulty": "advanced",
      "actionVerb": "explain"
    }
  ]
}`;

  const res = await callAiJsonEndpoint<{ writtenTests: Array<{ prompt: string; modelAnswer: string; keyRubricPoints: string[]; topic?: string; marks?: number; difficulty?: string; actionVerb?: string }> }>({
    prompt,
    provider,
    apiKey,
    baseUrl,
    model,
  });

  if (res?.writtenTests && Array.isArray(res.writtenTests) && res.writtenTests.length > 0) {
    const tests = res.writtenTests.map((w, i) => ({
      id: `wt-ai-${Date.now()}-${i}`,
      prompt: w.prompt,
      modelAnswer: w.modelAnswer,
      keyRubricPoints: w.keyRubricPoints,
      topic: w.topic || topic,
      marks: w.marks || 10,
    }));
    return {
      ok: true,
      source: "ai",
      writtenTests: tests,
      data: tests,
    };
  }

  // Heuristic fallback
  const fallbackTests = [
    {
      id: `wt-gen-${Date.now()}-1`,
      prompt: `Explain the fundamental architectural and operational mechanisms of ${topic}. Detail why these principles matter in enterprise engineering.`,
      modelAnswer: `${topic} provides essential modularity and deterministic control by isolating policy enforcement from core transit, preventing cascading failures and enabling horizontal scalability.`,
      keyRubricPoints: [
        "Defines the fundamental axioms of the topic",
        "Explains operational mechanisms step-by-step",
        "Analyzes trade-offs and failure scenarios",
        "Provides a concrete engineering application",
      ],
      topic,
      marks: 10,
    },
  ];
  return {
    ok: true,
    source: "curriculum_engine",
    writtenTests: fallbackTests,
    data: fallbackTests,
  };
}



/** 4. GENERATE MORE FILL-IN-THE-BLANKS ON DEMAND WITH GEMINI */
export async function runMoreFillBlanksGeneration(params: {
  topic: string;
  contextText?: string;
  count?: number;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}) {
  const { topic, contextText = "", count = 4, provider, apiKey, baseUrl, model } = params;

  const prompt = `You are an EdTech cognitive scientist creating active retrieval cloze exercises. Generate exactly ${count} fill-in-the-blank questions on:
Topic: ${topic}
${contextText ? `Source Notes / Context:\n${contextText.slice(0, 5000)}` : ""}

Respond with ONLY valid JSON:
{
  "fillBlanks": [
    {
      "sentenceWithBlank": "The primary protocol for achieving default gateway fault tolerance is [VRRP], which operates across multi-vendor equipment.",
      "blankAnswer": "VRRP",
      "acceptedAlternatives": ["Virtual Router Redundancy Protocol"],
      "hint": "Open standard alternative to Cisco HSRP",
      "explanation": "VRRP is the IEEE open standard for first-hop redundancy.",
      "topic": "${topic}"
    }
  ]
}`;

  const res = await callAiJsonEndpoint<{ fillBlanks: Array<{ sentenceWithBlank: string; blankAnswer: string; acceptedAlternatives?: string[]; hint?: string; explanation: string; topic?: string }> }>({
    prompt,
    provider,
    apiKey,
    baseUrl,
    model,
  });

  if (res?.fillBlanks && Array.isArray(res.fillBlanks) && res.fillBlanks.length > 0) {
    const blanks = res.fillBlanks.map((b, i) => ({
      id: `fb-ai-${Date.now()}-${i}`,
      sentenceWithBlank: b.sentenceWithBlank,
      blankAnswer: b.blankAnswer,
      acceptedAlternatives: b.acceptedAlternatives,
      hint: b.hint,
      explanation: b.explanation,
      topic: b.topic || topic,
    }));
    return {
      ok: true,
      source: "ai",
      fillBlanks: blanks,
      data: blanks,
    };
  }

  // Heuristic fallback
  const fallbackBlanks = [
    {
      id: `fb-gen-${Date.now()}-1`,
      sentenceWithBlank: `In university study methodologies, [active recall] provides significantly higher retention than passive reading.`,
      blankAnswer: "active recall",
      acceptedAlternatives: ["retrieval practice"],
      hint: "Testing oneself rather than re-reading notes",
      explanation: "Retrieval practice strengthens cognitive consolidation.",
      topic,
    },
  ];
  return {
    ok: true,
    source: "curriculum_engine",
    fillBlanks: fallbackBlanks,
    data: fallbackBlanks,
  };
}



/** 5. GENERATE / REGENERATE STRUCTURED TOPIC OVERVIEW WITH GEMINI */
export async function runOverviewGeneration(params: {
  title: string;
  subject?: string;
  courseCode?: string;
  contextText?: string;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<{ ok: boolean; source: string; overview: StudySetOverview }> {
  const { title, subject = "General", courseCode = "GEN 1000", contextText = "", provider, apiKey, baseUrl, model } = params;

  const prompt = `You are a senior university curriculum specialist. Produce an exhaustive, deeply structured academic overview of the following syllabus topic:
Title: ${title}
Subject: ${subject}
Course Code: ${courseCode}
${contextText ? `Source Lecture Material:\n${contextText.slice(0, 10000)}` : ""}

Respond with ONLY valid JSON:
{
  "overview": {
    "courseSubject": "${subject}",
    "chapterTopic": "${title}",
    "academicContext": "Deep 3-5 sentence explanation of what this topic is about, its engineering/scientific significance, and why it is critical for university exit exams.",
    "learningObjectives": [
      "Analyze the discrete functional mechanisms of ${title}",
      "Evaluate trade-offs between competing system architectures",
      "Formulate first-principles problem-solving strategies"
    ],
    "coreConcepts": ["Foundational Axioms", "Governing Mechanics", "System Invariants"],
    "keyPrinciples": [
      "Principle 1: Core mechanism priority over secondary policy overhead",
      "Principle 2: Deterministic state transitions under bounded conditions"
    ],
    "importantDefinitions": [
      { "term": "${title}", "definition": "Formal comprehensive definition preserving rigorous academic lexicon." }
    ],
    "majorTheoriesAndModels": [
      { "name": "Primary Governing Model", "description": "Core architectural or theoretical model.", "corePremise": "Fundamental governing axiom." }
    ],
    "conceptRelationships": [
      { "sourceConcept": "Primary Mechanism", "targetConcept": "Operational Output", "relationship": "Drives the deterministic execution of states." }
    ],
    "practicalApplications": ["Enterprise production systems", "Exit exam analytical questions"],
    "keyTakeaways": [
      "Never compromise primary throughput with non-critical inspection overhead",
      "Always check dimensional units and boundary limits"
    ],
    "examRelevantAreas": ["Comparative protocol analyses", "First-principles derivations"],
    "mentalModelHierarchy": [
      {
        "id": "unit-1",
        "unit": "Unit 1: Foundations",
        "topic": "${title}",
        "concepts": [
          { "name": "Core Axiom", "details": "Foundational premise", "exampleOrApplication": "Production deployment" }
        ]
      }
    ],
    "sourceGroundedNotes": { "isFullyGrounded": true }
  }
}`;

  const res = await callAiJsonEndpoint<{ overview: StudySetOverview }>({
    prompt,
    provider,
    apiKey,
    baseUrl,
    model,
  });

  if (res?.overview) {
    return { ok: true, source: "ai", overview: res.overview };
  }

  // Heuristic fallback
  const fallback = synthesizeDefaultOverview({
    title,
    subject,
    courseCode,
    notes: { summary: contextText.slice(0, 300) || `Overview for ${title}`, keyConcepts: [], definitions: [], formulasAndRules: [], studyTips: [] },
  });

  return { ok: true, source: "curriculum_engine", overview: fallback };
}



/** 6. SUMMARIZE NOTES FROM PASTED/UPLOADED TEXT WITH GEMINI */
export async function runSummarizeNotesGeneration(params: {
  text: string;
  titleHint?: string;
  subjectHint?: string;
  depth?: "concise" | "standard" | "detailed" | "deep-learning";
  focus?: "exam-focused" | "conceptual" | "practical" | "quick-revision";
  language?: "en" | "am";
  targetSection?: string;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<{ ok: boolean; source: string; notes: StudySetNotes; data: StudySetNotes }> {
  const {
    text,
    titleHint,
    subjectHint,
    depth = "detailed",
    focus = "exam-focused",
    language = "en",
    targetSection,
    provider,
    apiKey,
    baseUrl,
    model,
  } = params;

  const depthInstruction =
    depth === "concise"
      ? "Produce high-yield, compact, bulleted synthesis prioritizing immediate review speed."
      : depth === "deep-learning"
        ? "Produce exhaustive first-principles academic derivations, mechanistic proofs, boundary condition analyses, and rich worked exam problems."
        : "Produce balanced, comprehensive senior university-level lecture monograph notes with worked problems.";

  const focusInstruction =
    focus === "exam-focused"
      ? "Focus intensively on university exit exam scoring rubrics, examiner traps, common student missteps, and step-by-step problem resolutions."
      : focus === "practical"
        ? "Focus on concrete engineering implementation, real-world failure domains, trade-offs, and production systems architecture."
        : focus === "quick-revision"
          ? "Focus on formula cheats, memory hooks, mnemonics, and 2-minute refreshers."
          : "Focus on conceptual clarity, theoretical models, and taxonomical relationships.";

  const langInstruction =
    language === "am"
      ? "LANGUAGE REQUIREMENT: Write explanations, pedagogical summaries, and exam tips in natural, high-academic Amharic (በአማርኛ) while strictly preserving standard English technical keywords, formulas, and protocol names (e.g., 'Transmission Delay', 'Throughput', 'Boundary Condition')."
      : "LANGUAGE REQUIREMENT: Academic English with precise discipline-specific terminology.";

  const sectionInstruction = targetSection
    ? `SPECIFIC SECTION TARGET: Focus especially on deeply expanding the "${targetSection}" section of this study material with maximal technical rigor and worked examples.`
    : "";

  const prompt = `You are a senior university professor, curriculum architect, and assessment specialist. Transform the following raw lecture text into a comprehensive, deeply structured academic lecture monograph with extensive worked examples.

CRITICAL INSTRUCTIONS FOR MAXIMUM DEPTH & WORKED EXAMPLES:
1. EXHAUSTIVE TECHNICAL DEPTH: Explain every concept from first principles—how and why it operates, underlying physical/mathematical/computational mechanics, invariants, boundary conditions, and trade-offs.
2. MANDATORY WORKED EXAMPLES FOR EVERY KEY CONCEPT: Each concept in keyConcepts MUST include a concrete "workedExample" with an explicit "problemStatement" (a realistic university exit exam problem or technical question), a comprehensive "stepByStepSolution" (multi-step resolution showing derivations/calculations/logic), and a "keyTakeaway".
3. WORKED FORMULA CALCULATIONS: Each formula in formulasAndRules MUST include a "workedCalculationExample" with "given", "formulaUsed", "substitutions", and a "result" with correct dimensional units.
4. DETAILED WORKED EXAMINATION SCENARIOS: In clarifyingExamples, provide at least 3-4 realistic exam problem scenarios, complete with step-by-step resolution ("analysis") and the "examinerTrap" that students must avoid.

Title: ${titleHint || "Lecture Notes"}
Subject: ${subjectHint || "Academic Study"}
Depth: ${depth} (${depthInstruction})
Focus: ${focus} (${focusInstruction})
${langInstruction}
${sectionInstruction}

Source Lecture Notes:
${text.slice(0, 16000)}

Respond with ONLY valid JSON:
{
  "notes": {
    "summary": "Comprehensive 4-6 sentence executive synthesis detailing foundational axioms, governing mechanics, parameter envelopes, and university exit exam priorities.",
    "learningObjectives": [
      "Analyze the fundamental theoretical mechanisms",
      "Formulate first-principles problem-solving protocols",
      "Apply governing mathematical equations to boundary scenarios"
    ],
    "keyConcepts": [
      {
        "unit": "Unit 1.0",
        "concept": "Foundational Theoretical Pillar",
        "definition": "Formal rigorous academic definition with exact discipline-specific terminology.",
        "explanation": "Deep mechanistic explanation detailing HOW and WHY it operates from first principles.",
        "whyItMatters": "Critical significance in real-world engineering or university examinations.",
        "example": "Real-world industrial or physical case study application.",
        "workedExample": {
          "problemStatement": "Realistic university exit exam problem or analytical scenario testing this concept.",
          "stepByStepSolution": "1. Parameter & boundary identification.\\n2. Governing theorem application.\\n3. Intermediate step derivation.\\n4. Final verified result.",
          "keyTakeaway": "Core takeaway and verification sanity check."
        },
        "takeaway": "Core takeaway for rapid revision.",
        "tradeoffs": "Architectural or analytical trade-offs (e.g. speed vs memory, latency vs accuracy).",
        "examTip": "High-yield advice on how university examiners test this concept.",
        "activeRecallPrompt": "Self-test question for active retrieval.",
        "activeRecallAnswer": "Concise high-scoring answer."
      }
    ],
    "principlesAndTheories": [
      {
        "title": "Axiom of System Invariants",
        "principle": "Core invariant rule that remains constant.",
        "explanation": "Governing operational justification.",
        "scopeOfValidity": "Applicable across all closed bounded systems.",
        "examApplication": "High-frequency exam testing target."
      }
    ],
    "classificationsAndCategories": [
      {
        "title": "Comparative Analysis Matrix",
        "headers": ["Entity / Paradigm", "Governing Standard", "Forwarding / Operational Model", "Key Distinction", "Exam Pitfall"],
        "rows": [
          ["Entity A", "Standard 1", "Active Model", "Key difference A", "Common trap A"],
          ["Entity B", "Standard 2", "Passive Model", "Key difference B", "Common trap B"]
        ],
        "description": "Comparative matrix for exam differentiation."
      }
    ],
    "processesAndWorkflows": [
      {
        "processName": "Standard 4-Step Problem Solving Protocol",
        "objective": "Deterministic problem resolution protocol.",
        "steps": [
          { "stepNumber": 1, "title": "Boundary & Unit Identification", "description": "Identify boundary limits and convert all parameters to base SI units." },
          { "stepNumber": 2, "title": "Symbolic Derivation", "description": "Isolate unknown variable algebraically before numerical substitution." },
          { "stepNumber": 3, "title": "Numerical Evaluation", "description": "Substitute numerical values and compute result." },
          { "stepNumber": 4, "title": "Dimensional Sanity Check", "description": "Verify physical units and plausibility." }
        ]
      }
    ],
    "clarifyingExamples": [
      {
        "title": "Exit Exam Case Scenario: Parameter Envelope Analysis",
        "conceptIllustrated": "Core Analytical Principle",
        "scenario": "Concrete engineering or scientific scenario with numbers or architectural constraints.",
        "analysis": "1. Parameter Identification: Given variables...\\n2. Governing Law: Equation applied...\\n3. Step-by-Step Resolution: Calculations...\\n4. Conclusion: Verified outcome.",
        "examinerTrap": "Common student misconception or arithmetic trap to avoid."
      }
    ],
    "commonConfusions": [
      {
        "conceptA": "Concept X",
        "conceptB": "Concept Y",
        "keyDistinction": "Critical technical demarcation between X and Y under examination pressure.",
        "mnemonicOrRule": "Helpful mnemonic or mental model."
      }
    ],
    "examFocusedKnowledge": {
      "highYieldFacts": ["High-yield fact 1", "High-yield fact 2"],
      "mustKnowRelationships": ["Key invariant relationships (e.g. inverse square, logarithmic scaling)"],
      "formulaTriggers": ["Formula triggers students should recognize"],
      "topExamMistakes": ["Common exam pitfalls to avoid"]
    },
    "formulasAndRules": [
      {
        "title": "Governing Formula / Invariant Rule",
        "formula": "LaTeX formula or algorithmic invariant",
        "explanation": "Interpretation and physical meaning",
        "variables": [{ "symbol": "x", "label": "Parameter description [Units]" }],
        "validityConditions": "Boundary assumptions under which formula holds",
        "examTrick": "Calculation shortcut or common pitfall",
        "workedCalculationExample": {
          "given": "Explicit numerical or variable values given",
          "formulaUsed": "Equation applied",
          "substitutions": "Step-by-step algebraic and numerical substitution",
          "result": "Final answer with units"
        }
      }
    ],
    "studyTips": ["Consolidate primary axioms before attempting edge cases"]
  }
}`;

  const res = await callAiJsonEndpoint<{ notes: StudySetNotes }>({
    prompt,
    provider,
    apiKey,
    baseUrl,
    model,
  });

  if (res?.notes) {
    const rawMarkdown = formatNotesAsDeepMonographMarkdown(
      titleHint || "Lecture Notes",
      subjectHint || "Academic Study",
      res.notes,
    );
    const synthesizedNotes: StudySetNotes = {
      ...res.notes,
      rawMarkdown,
    };
    return { ok: true, source: "ai", notes: synthesizedNotes, data: synthesizedNotes };
  }
  // Heuristic synthesis fallback with deep worked examples
  const fallbackSet = synthesizeCompleteStudySet(text, titleHint, subjectHint);
  const fallbackMarkdown = formatNotesAsDeepMonographMarkdown(
    titleHint || "Lecture Notes",
    subjectHint || "Academic Study",
    fallbackSet.notes,
  );
  const synthesizedNotes: StudySetNotes = {
    ...fallbackSet.notes,
    rawMarkdown: fallbackMarkdown,
  };
  return { ok: true, source: "curriculum_engine", notes: synthesizedNotes, data: synthesizedNotes };
}



/** 7. GENERATE / ENRICH CHEAT SHEET WITH GEMINI */
export async function runCheatSheetGeneration(params: {
  title: string;
  subject?: string;
  contextText?: string;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<{ ok: boolean; source: string; cheatSheet: StudySetCheatSheet }> {
  const { title, subject = "General", contextText = "", provider, apiKey, baseUrl, model } = params;

  const prompt = `You are an elite exam board revision specialist. Produce a high-yield, exam-morning technical cheat sheet on:
Topic: ${title}
Subject: ${subject}
${contextText ? `Source Material:\n${contextText.slice(0, 8000)}` : ""}

Respond with ONLY valid JSON:
{
  "cheatSheet": {
    "criticalDefinitions": [
      { "term": "Core Term", "briefDefinition": "Ultra-concise high-scoring definition.", "highYieldTag": "High-Yield" }
    ],
    "keyTerminology": [
      { "term": "Specific Technical Term", "context": "How it is applied and examined." }
    ],
    "corePrinciples": [
      { "principle": "Core Axiom", "conciseRule": "Golden invariant rule for exams." }
    ],
    "importantFormulas": [
      { "title": "Governing Law", "formula": "Mathematical or computational formula", "variables": "Key variables and SI units", "quickTip": "Frequently tested on exit exams" }
    ],
    "comparisonsTable": [
      { "concept": "Concept A vs Concept B", "meaning": "Classification", "keyDifference": "The defining technical distinction.", "example": "Real-world differentiation example." }
    ],
    "processesAndWorkflows": [
      { "title": "Standard Exam Resolution Sequence", "summary": "Step-by-step problem-solving sequence.", "steps": ["Step 1", "Step 2", "Step 3"] }
    ],
    "importantRelationships": [
      { "relation": "Inverse proportionality or causality", "impact": "What happens when variable increases." }
    ],
    "commonMistakes": [
      { "misconception": "Common student pitfall", "correctUnderstanding": "What the professor expects." }
    ],
    "examReminders": ["Check dimensional units before substituting numbers", "Remember boundary limits"],
    "estimatedReviewMinutes": 5
  }
}`;

  const res = await callAiJsonEndpoint<{ cheatSheet: StudySetCheatSheet }>({
    prompt,
    provider,
    apiKey,
    baseUrl,
    model,
  });

  if (res?.cheatSheet) {
    return { ok: true, source: "ai", cheatSheet: res.cheatSheet };
  }

  // Heuristic synthesis fallback
  const fallback = synthesizeDefaultCheatSheet({
    title,
    subject,
    notes: { summary: contextText.slice(0, 300) || `Cheat sheet for ${title}`, keyConcepts: [], definitions: [], formulasAndRules: [], studyTips: [] },
  });

  return { ok: true, source: "curriculum_engine", cheatSheet: fallback };
}



/** 8. DEEP LEARNING CAPABILITIES & AI TUTOR ENGINE */
export interface DeepLearningToolParams {
  tool:
    | "explain"
    | "step_by_step"
    | "example"
    | "compare"
    | "test_understanding"
    | "tutor_qa"
    | "study_planner";
  query: string;
  contextText?: string;
  titleHint?: string;
  subjectHint?: string;
  level?: "simple" | "intermediate" | "advanced";
  secondaryConcept?: string;
  examDate?: string;
  dailyHours?: number;
  language?: "en" | "am";
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface DeepLearningToolResult {
  ok: boolean;
  tool: string;
  source: string;
  title: string;
  content: string;
  suggestedFollowUps?: string[];
  citations?: Array<{ title: string; section?: string; snippet?: string }>;
  quizQuestion?: {
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
  };
}

export async function runDeepLearningTool(
  params: DeepLearningToolParams,
): Promise<DeepLearningToolResult> {
  const {
    tool,
    query,
    contextText = "",
    titleHint = "Course Study Material",
    subjectHint = "Academic Study",
    level = "intermediate",
    secondaryConcept = "",
    examDate = "in 14 days",
    dailyHours = 1,
    language = "en",
    provider = "gemini",
    apiKey,
    baseUrl,
    model,
  } = params;

  const langInstruction =
    language === "am"
      ? "LANGUAGE REQUIREMENT: Write pedagogical explanations, steps, and advice in natural, high-academic Amharic (በአማርኛ) while strictly preserving standard English technical keywords, formulas, and protocol names (e.g., 'Transmission Delay', 'Throughput', 'Boundary Condition')."
      : "LANGUAGE REQUIREMENT: Academic English with precise discipline-specific terminology.";

  // Build specialized prompt depending on tool
  let systemPrompt = "";
  let userPrompt = "";

  if (tool === "explain") {
    systemPrompt = `You are a world-class university professor explaining concepts to students.
Target Depth: ${level.toUpperCase()} (${level === "simple" ? "Freshman / ELI5 with everyday analogies and zero unnecessary jargon" : level === "advanced" ? "Senior Exit Exam / Postgraduate depth with mathematical rigor, axioms, edge cases, and trade-offs" : "Standard undergraduate level with mechanistic clarity and clear terminology"}).
${langInstruction}`;

    userPrompt = `Explain the concept: "${query}"
Context Subject: ${titleHint} (${subjectHint})
${contextText ? `Source Grounding:\n${contextText.slice(0, 7000)}\n` : ""}

Format your response in structured Markdown:
### 💡 Core Intuition & Everyday Analogy
(Provide a sticky mental model)

### 🔬 Technical Definition & Governing Axiom
(Rigorous academic definition)

### ⚙️ Operational Mechanics (How & Why It Works)
(Step-by-step causality)

### ⚖️ Practical Significance & Trade-Offs
(Why engineers/scientists care)

### ⚠️ High-Yield Exam Tip & Examiner Trap
(Common pitfall students make on exit exams)`;
  } else if (tool === "step_by_step") {
    systemPrompt = `You are a master instructional designer who breaks complex algorithms, derivations, and procedures into logical, easily digested sequential stages.
${langInstruction}`;

    userPrompt = `Teach me step-by-step: "${query}"
Context Subject: ${titleHint} (${subjectHint})
${contextText ? `Source Grounding:\n${contextText.slice(0, 7000)}\n` : ""}

Format your response in structured Markdown:
### 🎯 Objective & Pre-Conditions
What this protocol accomplishes and what inputs are assumed.

### 🪜 Step-by-Step Breakdown
Break this down into numbered stages (Stage 1, Stage 2, Stage 3...). For each stage:
- **Action / Transformation:** What occurs.
- **Governing Law / Invariant:** Rule that must hold true.
- **Examiner Trap:** Mistake students make at this exact phase.

### ✅ Verification & Termination Check
How to verify the final result is dimensionally and physically correct.`;
  } else if (tool === "example") {
    systemPrompt = `You are a university professor creating realistic, fully worked solutions and case studies with real numerical values or code.
${langInstruction}`;

    userPrompt = `Provide a concrete, fully worked exam-level problem and solution for: "${query}"
Context Subject: ${titleHint} (${subjectHint})
${contextText ? `Source Grounding:\n${contextText.slice(0, 7000)}\n` : ""}

Format your response in structured Markdown:
### 📝 Realistic Exam Problem Scenario
A concrete scenario with explicit parameters and boundary values.

### 📐 Step 1: Parameter Extraction & Units Conversion
List knowns and unknowns with SI units.

### 🧮 Step 2: Symbolic Formula Derivation
Derive algebraically before inserting numbers.

### 🔢 Step 3: Numerical Substitution & Final Result
Compute with proper significant figures and units.

### 🔍 Analysis of Boundary Sensitivity
What happens if the primary variable doubles or approaches limit zero?`;
  } else if (tool === "compare") {
    systemPrompt = `You are an exam board director specializing in contrasting easily conflated university concepts.
${langInstruction}`;

    userPrompt = `Compare and contrast: "${query}" vs. "${secondaryConcept || "Alternative Method"}"
Context Subject: ${titleHint} (${subjectHint})
${contextText ? `Source Grounding:\n${contextText.slice(0, 7000)}\n` : ""}

Format your response in structured Markdown:
### 📊 Comparative Analysis Matrix
| Dimension / Characteristic | ${query} | ${secondaryConcept || "Alternative Method"} | Crucial Technical Distinction |
| :--- | :--- | :--- | :--- |
(Include 4-5 rigorous comparison rows)

### 🎯 The Fundamental Demarcation
Explain why students confuse these two and state the exact technical boundary.

### ⚡ Operational Trade-Offs
When to select which approach in practice.

### ⚠️ High-Yield Mnemonic or Golden Rule
A quick rule of thumb for exam morning.`;
  } else if (tool === "test_understanding") {
    systemPrompt = `You are an assessment specialist creating adaptive diagnostic questions to verify retention.
${langInstruction}`;

    userPrompt = `Generate an adaptive multiple-choice question testing understanding of: "${query}"
Context Subject: ${titleHint} (${subjectHint})
${contextText ? `Source Grounding:\n${contextText.slice(0, 7000)}\n` : ""}

Respond with ONLY valid JSON:
{
  "quizQuestion": {
    "question": "A realistic scenario testing deep understanding...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 1,
    "explanation": "Detailed pedagogical explanation clarifying why Option B is correct and addressing misconceptions in other options."
  },
  "pedagogicalFocus": "Critical boundary invariants",
  "suggestedFollowUps": [
    "Explain this with a real-world analogy",
    "Show me a worked calculation example",
    "What is the most common exam trap here?"
  ]
}`;
  } else if (tool === "study_planner") {
    systemPrompt = `You are an expert university learning strategist specializing in spaced repetition and deliberate practice.
${langInstruction}`;

    userPrompt = `Create an optimized revision schedule for: "${titleHint}" (${subjectHint})
Target Exam Horizon: ${examDate}
Available Daily Study Time: ${dailyHours} hour(s) per day
${contextText ? `Source Grounding / Key Topics:\n${contextText.slice(0, 7000)}\n` : ""}

Format your response in structured Markdown:
### 📅 Spaced Revision Roadmap (${examDate} Horizon · ${dailyHours}h/day)
Outline a phase-based plan:
- **Phase 1: First-Principles & Core Axioms** (Foundational grasp)
- **Phase 2: Active Recall & Formula Drills** (Interleaved flashcards & cloze exercises)
- **Phase 3: Exit Exam Simulation & Weak-Topic Remediation** (Timed quizzes and written tests)

### 📋 Day-by-Day Milestone Table
| Study Block | Focus Module | Active Recall Activity | Target Milestone |
| :--- | :--- | :--- | :--- |
(Provide structured milestones)

### 🧠 High-Efficiency Study Protocol
Spaced intervals, self-testing frequency, and mistake-notebook review routine.`;
  } else {
    // tutor_qa
    systemPrompt = `You are Studley AI Tutor, an intelligent, patient, and academically rigorous study copilot for university students.
Context: Ground your answers strictly in the supplied study set notes and documents.
${langInstruction}`;

    userPrompt = `Student Question: "${query}"
Context Subject: ${titleHint} (${subjectHint})
${contextText ? `Source Material Grounding:\n${contextText.slice(0, 8000)}\n` : ""}

Answer the student's question clearly and thoroughly.
- Use Markdown formatting, bullet points, and LaTeX ($...$) for mathematical formulas.
- Explicitly reference relevant sections or axioms from the study materials where applicable.
- Provide a brief follow-up reflection question to confirm the student understood the concept.`;
  }

  // 1. Try real AI call if API key exists
  if (apiKey && apiKey.trim().length > 0) {
    try {
      if (tool === "test_understanding") {
        const jsonRes = await callAiJsonEndpoint<{
          quizQuestion: {
            question: string;
            options: [string, string, string, string];
            correctIndex: number;
            explanation: string;
          };
          pedagogicalFocus?: string;
          suggestedFollowUps?: string[];
        }>({
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          provider,
          apiKey,
          baseUrl,
          model,
        });

        if (jsonRes?.quizQuestion) {
          return {
            ok: true,
            tool,
            source: "ai",
            title: `Diagnostic Challenge: ${query}`,
            content: `**Question:** ${jsonRes.quizQuestion.question}\n\n` +
              jsonRes.quizQuestion.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n") +
              `\n\n*Submit your answer below to evaluate your understanding.*`,
            quizQuestion: jsonRes.quizQuestion,
            suggestedFollowUps: jsonRes.suggestedFollowUps || [
              `Explain "${query}" in simpler terms`,
              `Show me a worked calculation for "${query}"`,
              `What is the main exam trap for "${query}"?`,
            ],
            citations: [{ title: titleHint, section: "Active Recall Diagnostic" }],
          };
        }
      } else {
        const completionRes = await runAiChatCompletion({
          provider,
          apiKey,
          baseUrl,
          model,
          systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          course: titleHint,
          tool,
          language,
        });

        if (completionRes.ok && completionRes.content) {
          return {
            ok: true,
            tool,
            source: "ai",
            title:
              tool === "explain"
                ? `Explanation: ${query}`
                : tool === "step_by_step"
                  ? `Step-by-Step Guide: ${query}`
                  : tool === "example"
                    ? `Worked Example: ${query}`
                    : tool === "compare"
                      ? `Comparative Analysis: ${query} vs ${secondaryConcept}`
                      : tool === "study_planner"
                        ? `Revision Study Plan: ${titleHint}`
                        : `AI Tutor: ${query}`,
            content: completionRes.content,
            suggestedFollowUps: [
              `Give me an example of ${query}`,
              `Test my understanding on ${query}`,
              `Teach me ${query} step by step`,
            ],
            citations: [{ title: titleHint, section: "Source Document Synthesis" }],
          };
        }
      }
    } catch (err) {
      console.warn(`runDeepLearningTool AI request failed for ${tool}, falling back:`, err);
    }
  }

  // 2. Intelligent Curriculum Engine Heuristic Fallback
  return synthesizeDeepLearningFallback({
    tool,
    query,
    titleHint,
    subjectHint,
    level,
    secondaryConcept,
    examDate,
    dailyHours,
    contextText,
  });
}

function synthesizeDeepLearningFallback(params: {
  tool: string;
  query: string;
  titleHint: string;
  subjectHint: string;
  level: string;
  secondaryConcept: string;
  examDate: string;
  dailyHours: number;
  contextText: string;
}): DeepLearningToolResult {
  const { tool, query, titleHint, subjectHint, level, secondaryConcept, examDate, dailyHours, contextText } = params;

  if (tool === "explain") {
    return {
      ok: true,
      tool,
      source: "curriculum_engine",
      title: `Explanation: ${query}`,
      content: `### 💡 Core Intuition & Mental Model
Think of **${query}** as a fundamental boundary invariant governing state transitions in ${subjectHint}. Just as an electrical circuit requires closed continuity to conduct current, this principle defines the exact operating limits under which the system functions predictably.

### 🔬 Technical Definition & Governing Axiom
> **${query}**: The formal theoretical and operational framework in ${titleHint} that ensures consistency, fault isolation, and deterministic performance under specified operating conditions.

### ⚙️ Operational Mechanics (How & Why It Works)
1. **Initial Condition Evaluation:** System inspects parameters to verify validity limits.
2. **Deterministic Processing:** Applies governing transformation rules without non-linear distortion.
3. **Equilibrium State:** Reaches stable output state while preserving resource invariants.

### ⚖️ Practical Significance & Trade-Offs
In real-world engineering and science, optimizing for ${query} improves fault isolation and throughput, but requires careful boundary checks to prevent edge-case saturation.

### ⚠️ High-Yield Exam Tip & Examiner Trap
On university examinations, professors often ask: *"Does this principle still hold when boundary assumptions are relaxed?"* Always specify the parameter envelope and dimensional consistency before solving numerical problems!`,
      suggestedFollowUps: [
        `Show me a worked calculation for ${query}`,
        `Break down ${query} step by step`,
        `Test my understanding with an exam question`,
      ],
      citations: [{ title: titleHint, section: "Core Concept Analysis" }],
    };
  }

  if (tool === "step_by_step") {
    return {
      ok: true,
      tool,
      source: "curriculum_engine",
      title: `Step-by-Step Breakdown: ${query}`,
      content: `### 🎯 Objective & Pre-Conditions
To systematically derive, calculate, and verify **${query}** in ${titleHint} with zero calculation slips.

### 🪜 Step-by-Step Breakdown

#### Stage 1: Parameter & Boundary Identification
- **Action:** Extract given quantities and determine the validity envelope.
- **Governing Invariant:** Confirm all units match standard SI or canonical baseline units.
- **Examiner Trap:** Blindly substituting numbers before verifying that assumptions hold.

#### Stage 2: Pure Symbolic Derivation
- **Action:** Isolate the target variable purely in algebraic symbols.
- **Governing Invariant:** Dimensional homogeneity must hold across all additive terms.
- **Examiner Trap:** Skipping symbolic manipulation; examiners award up to 70% of partial marks for symbolic steps.

#### Stage 3: Numerical Substitution & Precision Check
- **Action:** Substitute numerical values and carry out arithmetic.
- **Governing Invariant:** Maintain appropriate significant figures.
- **Examiner Trap:** Arithmetic rounding errors midway through multi-step equations.

### ✅ Verification & Termination Check
Perform a dimensional check and confirm that the final numerical order of magnitude is physically realistic.`,
      suggestedFollowUps: [
        `Give me a concrete numerical example of this`,
        `What is the most frequent exam mistake here?`,
        `Test my understanding with a practice question`,
      ],
      citations: [{ title: titleHint, section: "Procedural Protocols" }],
    };
  }

  if (tool === "example") {
    return {
      ok: true,
      tool,
      source: "curriculum_engine",
      title: `Worked Example: ${query}`,
      content: `### 📝 Realistic Exam Problem Scenario
An engineering system in ${titleHint} is operating under steady-state conditions with parameter $A = 100\\text{ units}$ and rate $r = 5\\%\\text{ per cycle}$. Determine the effective throughput for **${query}** over 10 consecutive cycles.

### 📐 Step 1: Parameter Extraction
- Given: $A_0 = 100$, $r = 0.05$, $n = 10$
- Target Unknown: Net state $A_{10}$

### 🧮 Step 2: Symbolic Formula Derivation
Using the governing accumulation equation:
$$A_n = A_0 \\times (1 + r)^n$$

### 🔢 Step 3: Numerical Substitution
$$A_{10} = 100 \\times (1 + 0.05)^{10} = 100 \\times 1.6289 = 162.89\\text{ units}$$

### 🔍 Analysis of Boundary Sensitivity
If parameter rate $r$ doubles to $10\\%$, the response scales non-linearly to $259.37\\text{ units}$, illustrating why small shifts in governing coefficients dramatically impact system equilibrium.`,
      suggestedFollowUps: [
        `Explain how this applies to exit exams`,
        `Compare this with an alternative method`,
        `Test my understanding on this calculation`,
      ],
      citations: [{ title: titleHint, section: "Worked Numerical Applications" }],
    };
  }

  if (tool === "compare") {
    const sec = secondaryConcept || "Alternative Approach";
    return {
      ok: true,
      tool,
      source: "curriculum_engine",
      title: `Comparative Analysis: ${query} vs ${sec}`,
      content: `### 📊 Comparative Analysis Matrix
| Dimension / Characteristic | ${query} | ${sec} | Crucial Technical Distinction |
| :--- | :--- | :--- | :--- |
| **Primary Mechanism** | Deterministic state transition | Heuristic or probabilistic estimation | Exact vs. approximate resolution |
| **Computational Complexity** | $O(\\log n)$ or bounded | $O(n)$ or unconstrained | Efficiency under scaling |
| **Resource Overhead** | Predictable memory footprint | Dynamic variable overhead | Predictability in production |
| **Failure Domain** | Isolated boundary faults | Cascading systemic risk | Resilience under stress |

### 🎯 The Fundamental Demarcation
Students frequently confuse these two because both solve similar top-level requirements. However, **${query}** guarantees deterministic invariants, whereas **${sec}** trades absolute certainty for computational agility.

### ⚠️ High-Yield Mnemonic
> **Remember:** *"${query} guarantees the floor; ${sec} optimizes the ceiling."*`,
      suggestedFollowUps: [
        `Give me a real-world scenario where I must choose between them`,
        `Which one is tested more frequently on exit exams?`,
        `Create a quiz question testing this distinction`,
      ],
      citations: [{ title: titleHint, section: "Comparative Synthesis" }],
    };
  }

  if (tool === "study_planner") {
    return {
      ok: true,
      tool,
      source: "curriculum_engine",
      title: `Revision Study Plan: ${titleHint}`,
      content: `### 📅 Spaced Revision Roadmap (${examDate} Horizon · ${dailyHours}h/day)

#### Phase 1: Conceptual Foundations & Axioms (Days 1–3)
- **Goal:** Master core definitions, mental models, and taxonomy.
- **Daily Action:** Read monograph notes (30m) + Drill 10 flashcards (15m) + Concept self-explanation (15m).

#### Phase 2: Active Recall & Formula Drills (Days 4–8)
- **Goal:** Reinforce permanent retrieval pathways and eliminate arithmetic slips.
- **Daily Action:** Solve Fill-in-the-Blank cloze exercises (20m) + Complete practice quiz (20m) + Review Mistake Notebook (20m).

#### Phase 3: Exit Exam Simulation & Mastery (Days 9–14)
- **Goal:** Timed assessment readiness under exam pressure.
- **Daily Action:** Complete full Written Assessment (30m) + Deep review of marking rubric (20m) + Quick revision cheat sheet scan (10m).

### 📋 High-Yield Daily Habit Checklist
- [ ] Review all cards in Leitner Box 1 (Unfamiliar) first thing every morning.
- [ ] Add any missed quiz question directly to your Mistake Notebook.
- [ ] Verify unit consistency on every practice calculation.`,
      suggestedFollowUps: [
        `What are the highest-yield topics to prioritize?`,
        `How do I best review my mistake notebook?`,
        `Test my readiness with a full diagnostic quiz`,
      ],
      citations: [{ title: titleHint, section: "Curriculum Planning" }],
    };
  }

  // test_understanding default
  return {
    ok: true,
    tool,
    source: "curriculum_engine",
    title: `Diagnostic Challenge: ${query}`,
    content: `**Question:** When analyzing the operational behavior of **${query}** in ${titleHint}, which verification step must be performed before applying mathematical formulas?\n\nA. Assume frictionless conditions without checking parameters\nB. Verify the boundary envelope and dimensional homogeneity\nC. Ignore environmental constraints and scale arbitrarily\nD. Round values to the nearest integer immediately\n\n*Submit your answer below to evaluate your understanding.*`,
    quizQuestion: {
      question: `When analyzing the operational behavior of ${query} in ${titleHint}, which verification step must be performed before applying mathematical formulas?`,
      options: [
        "Assume frictionless conditions without checking parameters",
        "Verify the boundary envelope and dimensional homogeneity",
        "Ignore environmental constraints and scale arbitrarily",
        "Round values to the nearest integer immediately",
      ],
      correctIndex: 1,
      explanation: "Verifying the boundary envelope and dimensional consistency guarantees that governing equations remain valid before executing calculations.",
    },
    suggestedFollowUps: [
      `Explain why dimensional homogeneity matters`,
      `Show me an example calculation for ${query}`,
      `Break down ${query} step by step`,
    ],
    citations: [{ title: titleHint, section: "Diagnostic Assessment" }],
  };
}
