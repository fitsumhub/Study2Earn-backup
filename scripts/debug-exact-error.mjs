
import { getServerConfig } from "../src/lib/config.server.ts";
import OpenAI from "openai";
import fs from "fs";

const config = getServerConfig();
const client = new OpenAI({
  apiKey: config.geminiApiKey,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  timeout: 60000,
});

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
fs.writeFileSync("scripts/gemini-raw-out.json", content);

try {
  JSON.parse(content);
  console.log("SUCCESSFULLY PARSED!");
} catch (e) {
  console.log("Error:", e.message);
  // Find invalid JSON line
  const lines = content.split('\n');
  let current = '';
  for (let i = 0; i < lines.length; i++) {
    current += lines[i] + '\n';
    try {
      // test with closing brackets
      JSON.parse(current + '}');
    } catch (err) {
      if (err.message.includes("Property name must be a string literal")) {
        console.log("Problem around line", i + 1, ":", lines[i]);
        console.log("Context:", lines.slice(Math.max(0, i - 3), i + 4).join('\n'));
        break;
      }
    }
  }
}
