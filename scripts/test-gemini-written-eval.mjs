import { getServerConfig } from "../src/lib/config.server.ts";
import { runWrittenAnswerEvaluation } from "../src/lib/ai-study-generation.server.ts";

const config = getServerConfig();
console.log("Testing real Gemini written answer evaluation...");

const res = await runWrittenAnswerEvaluation({
  prompt: "Explain the purpose of First Hop Redundancy Protocols (FHRP) and contrast HSRP with VRRP.",
  modelAnswer: "FHRP provides high availability for default gateways so that client devices experience uninterrupted network connectivity. HSRP is Cisco proprietary while VRRP is an open standard IEEE protocol.",
  keyRubricPoints: [
    "Identifies default gateway redundancy role",
    "Notes that HSRP is Cisco proprietary",
    "Notes that VRRP is an open IEEE standard",
    "Explains virtual IP / virtual MAC mechanism"
  ],
  userAnswer: "FHRP is used so that computers have a backup default gateway if the router fails. HSRP was made by Cisco whereas VRRP is an open standard that works across any router brand.",
  provider: "gemini",
  apiKey: config.geminiApiKey,
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
  model: "gemini-flash-lite-latest",
});

console.log("Evaluation Result:", res);
console.log("Score percentage:", res.scorePct);
console.log("AI Feedback:", res.aiFeedback);
