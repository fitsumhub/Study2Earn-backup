import { getServerConfig } from "../src/lib/config.server.ts";
import {
  runMoreFlashcardsGeneration,
  runMoreQuizGeneration,
  runMoreWrittenTestsGeneration,
  runMoreFillBlanksGeneration,
  runOverviewGeneration,
  runSummarizeNotesGeneration,
  runCheatSheetGeneration,
} from "../src/lib/ai-study-generation.server.ts";

const config = getServerConfig();
console.log("Testing modular Gemini endpoints...");

const topic = "First Hop Redundancy Protocols (HSRP and VRRP)";
const context = "HSRP is Cisco proprietary with virtual MAC 0000.0c07.acXX. VRRP is open IEEE standard RFC 3768.";

const t0 = Date.now();

// 1. Flashcards
const fc = await runMoreFlashcardsGeneration({
  topic,
  contextText: context,
  count: 3,
  apiKey: config.geminiApiKey,
  provider: "gemini",
  model: "gemini-flash-lite-latest",
});
console.log(`[Flashcards] source: ${fc.source}, count: ${fc.flashcards?.length}, latency: ${Date.now() - t0}ms`);

// 2. Quiz
const qz = await runMoreQuizGeneration({
  topic,
  contextText: context,
  count: 2,
  apiKey: config.geminiApiKey,
  provider: "gemini",
  model: "gemini-flash-lite-latest",
});
console.log(`[Quiz] source: ${qz.source}, count: ${qz.quizzes?.length}`);

// 3. Written
const wt = await runMoreWrittenTestsGeneration({
  topic,
  contextText: context,
  count: 1,
  apiKey: config.geminiApiKey,
  provider: "gemini",
  model: "gemini-flash-lite-latest",
});
console.log(`[Written] source: ${wt.source}, count: ${wt.writtenTests?.length}`);

// 4. Fill Blanks
const fb = await runMoreFillBlanksGeneration({
  topic,
  contextText: context,
  count: 2,
  apiKey: config.geminiApiKey,
  provider: "gemini",
  model: "gemini-flash-lite-latest",
});
console.log(`[FillBlanks] source: ${fb.source}, count: ${fb.fillBlanks?.length}`);

// 5. Overview
const ov = await runOverviewGeneration({
  title: topic,
  subject: "Computer Science",
  courseCode: "CoSc 3021",
  contextText: context,
  apiKey: config.geminiApiKey,
  provider: "gemini",
  model: "gemini-flash-lite-latest",
});
console.log(`[Overview] source: ${ov.source}, context: ${ov.overview?.academicContext?.slice(0, 50)}...`);

console.log("All modular Gemini calls tested successfully!");
