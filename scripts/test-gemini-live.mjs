import { getServerConfig } from "../src/lib/config.server.ts";
import OpenAI from "openai";

const config = getServerConfig();
console.log("Gemini API Key configured:", Boolean(config.geminiApiKey));

const client = new OpenAI({
  apiKey: config.geminiApiKey,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const res = await client.chat.completions.create({
  model: "gemini-flash-lite-latest",
  response_format: { type: "json_object" },
  messages: [
    {
      role: "user",
      content:
        'Respond with valid JSON: { "subject": "physics", "title": "Thermodynamics", "laws": ["Zeroth", "First", "Second", "Third"] }',
    },
  ],
});

console.log("Raw output:", res.choices[0].message.content);
const parsed = JSON.parse(res.choices[0].message.content);
console.log("Parsed object:", parsed);
