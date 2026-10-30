import { getServerConfig } from "../src/lib/config.server.ts";
import OpenAI from "openai";

const config = getServerConfig();
const client = new OpenAI({
  apiKey: config.geminiApiKey,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Let's test with the prompt from ai-study-generation.server.ts
const { runCompleteStudySetGeneration } = await import("../src/lib/ai-study-generation.server.ts");

const res = await runCompleteStudySetGeneration({
  text: "Core layer: fast switching backbone. Distribution layer: ACLs and routing policy. Access layer: port security and desktop connections.",
  titleHint: "Network Design Requirements",
  subjectHint: "Computer Science",
  provider: "gemini",
  apiKey: config.geminiApiKey,
  model: "gemini-flash-lite-latest",
});

console.log("Source:", res.source);
