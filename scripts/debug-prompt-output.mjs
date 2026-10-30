import { getServerConfig } from "../src/lib/config.server.ts";
import OpenAI from "openai";

const config = getServerConfig();
const client = new OpenAI({
  apiKey: config.geminiApiKey,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  timeout: 60000,
});

// Let's test with the prompt from ai-study-generation.server.ts
import fs from "fs";
const file = fs.readFileSync("src/lib/ai-study-generation.server.ts", "utf8");
const promptStart = file.indexOf("const prompt = `");
const promptEnd = file.indexOf("`;\n\n      let parsed: GeneratedStudySetData", promptStart);
let rawPrompt = file.slice(promptStart + 16, promptEnd);
rawPrompt = rawPrompt.replace("${titleHint || \"Infer from text\"}", "Network Design Requirements");
rawPrompt = rawPrompt.replace("${subjectHint || \"General\"}", "Computer Science");
rawPrompt = rawPrompt.replace("${text.slice(0, 18000)}", "Core layer: fast switching backbone. Distribution layer: ACLs and routing policy. Access layer: port security and desktop connections.");

const res = await client.chat.completions.create({
  model: "gemini-flash-lite-latest",
  response_format: { type: "json_object" },
  max_tokens: 8192,
  temperature: 0.2,
  messages: [{ role: "user", content: rawPrompt }],
});

const content = res.choices[0]?.message?.content || "";
console.log("Returned content length:", content.length);
try {
  JSON.parse(content);
  console.log("Parsed cleanly!");
} catch (e) {
  console.log("Parse error:", e.message);
  // find around error position
  console.log("End of content:", content.slice(-500));
}
