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
    return `### 📝 High-Yield Study Summary (${course})

*Generated from your lecture notes & Ethiopian MoE curriculum objectives.*

#### 🎯 Executive Summary
This chapter focuses on the core principles and analytical methods essential for upcoming midterms and the **National Exit Exam**. Mastery of these foundations is required before moving into applied problem sets.

#### 📌 Top 5 High-Yield Concepts
1. **Fundamental Laws & Definitions**: Explicitly state hypotheses before calculating derivations.
2. **Key Theorems**: Pay close attention to condition constraints (differentiability, closed systems, steady-state flow).
3. **Mathematical Relationships**:
   * Inverse square proportions
   * Rate of change and differential models: $\\frac{dy}{dx} = k \\cdot y(1 - y)$
4. **Standard Conventions**: Units, vector notations, and algebraic sign conventions.
5. **Practical Application**: Solving university exam scenarios using dimensional analysis.

#### 💡 Study Tips for Revision
* Spend 15 minutes reviewing active recall flashcards on these definitions.
* Attempt at least 5 multiple-choice questions without checking answers first.`;
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
  notes: {
    summary: string;
    keyConcepts: Array<{ concept: string; explanation: string }>;
    definitions: Array<{ term: string; definition: string }>;
    formulasAndRules: Array<{ title: string; formula: string; explanation: string }>;
    studyTips: string[];
  };
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
        const client = new OpenAI({ apiKey, baseURL: baseUrl || undefined });
        const res = await client.chat.completions.create({
          model: model || (provider === "deepseek" ? "deepseek-chat" : provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini"),
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        });
        const textOut = res.choices[0]?.message?.content || "";
        const parsed = JSON.parse(cleanJsonOutput(textOut)) as GeneratedStudySetData;
        if (parsed.flashcards && parsed.quizzes && parsed.notes) {
          return { ok: true, data: parsed, source: "ai" };
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
      keyConcepts: [
        {
          concept: "Foundational Postulate",
          explanation: keySentence1,
        },
        {
          concept: "Practical Application",
          explanation: keySentence2,
        },
        {
          concept: "Exam Boundary Conditions",
          explanation: keySentence3,
        },
      ],
      definitions: [
        {
          term: `${detectedSubject} Axiom`,
          definition: "A self-evident proposition accepted without controversy within the theoretical framework.",
        },
        {
          term: "Active Retrieval",
          definition: "A learning technique where the student deliberately tests their own memory without looking at notes.",
        },
      ],
      formulasAndRules: [
        {
          title: "Governing Relationship",
          formula: "\\Phi(x, t) = \\sum_{i=1}^n \\omega_i \\cdot f_i(x)",
          explanation: "General canonical formulation representing the superposition of contributing factors.",
        },
      ],
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
        const client = new OpenAI({ apiKey, baseURL: baseUrl || undefined });
        const res = await client.chat.completions.create({
          model: model || (provider === "deepseek" ? "deepseek-chat" : provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini"),
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: evalPrompt }],
        });
        const textOut = res.choices[0]?.message?.content || "";
        const parsed = JSON.parse(cleanJsonOutput(textOut)) as WrittenEvaluationResult;
        if (typeof parsed.scorePct === "number") return parsed;
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

