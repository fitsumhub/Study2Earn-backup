import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  runAiConnectionTest,
  runCompleteStudySetGeneration,
} from "../src/lib/ai-study-generation.server.ts";
import {
  getStudySets,
  getStudySetById,
} from "../src/lib/study-set-store.ts";
import {
  DEFAULT_INTEGRATIONS,
  DEFAULT_PROVIDER_SETTINGS,
} from "../src/lib/integrations-store.ts";
import { ACCEPT_TYPES } from "../src/components/ai-study/text-extraction.ts";

console.log("=========================================================");
console.log("🚀 COMPREHENSIVE AI STUDY SECTION TEST: DEV & USER PERSPECTIVES");
console.log("=========================================================\n");

let passedCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}:`, err.message);
  }
}

async function asyncTest(name, fn) {
  totalCount++;
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}:`, err.message);
  }
}

// ---------------------------------------------------------
// SECTION A: DEVELOPER TESTS (CODE INTEGRITY, API, PERSISTENCE)
// ---------------------------------------------------------
console.log("--- 1. DEVELOPER AUDIT: CONFIGURATION, STORE & API ---");

// Test 1: .env file presence and key integrity
test(".env file contains valid GEMINI_API_KEY", () => {
  const envPath = resolve(process.cwd(), ".env");
  assert.ok(existsSync(envPath), ".env file must exist");
  const envContent = readFileSync(envPath, "utf-8");
  assert.ok(envContent.includes("GEMINI_API_KEY="), ".env must contain GEMINI_API_KEY");
});

// Test 2: Integrations store defaults
test("Integrations store defaults to Google Gemini with gemini-flash-lite-latest", () => {
  assert.equal(DEFAULT_INTEGRATIONS.aiStudy.provider, "gemini", "Default provider is gemini");
  assert.equal(DEFAULT_PROVIDER_SETTINGS.gemini.model, "gemini-flash-lite-latest", "Default model is gemini-flash-lite-latest");
  assert.ok(DEFAULT_PROVIDER_SETTINGS.gemini.apiKey.length > 20, "API key is present in default provider settings");
});

// Test 3: Study set store seed data
test("Study set store contains 'Network Design Requirements' (set-net-3021)", () => {
  const seedSet = getStudySetById("set-net-3021") || getStudySets().find(s => s.id === "set-net-3021");
  assert.ok(seedSet, "Seed set set-net-3021 exists");
  assert.equal(seedSet.title, "Network Design Requirements");
  assert.equal(seedSet.flashcards.length, 52, "Has exactly 52 flashcards");
  assert.ok(seedSet.notes.keyConcepts.length >= 2, "Has core concepts in notes");
  assert.ok(seedSet.notes.formulasAndRules.length > 0, "Has formulas");
  assert.ok(seedSet.notes.definitions.length > 0, "Has definitions");
});

// Test 4: Workspace tabs structure (Audio Brief, AI Tutor, Sources removed)
test("StudySetDetailWorkspace tabs config excludes Audio Brief, AI Tutor, Sources", () => {
  const fileContent = readFileSync(
    resolve(process.cwd(), "src/components/ai-study/StudySetDetailWorkspace.tsx"),
    "utf-8"
  );
  // Verify tabsConfig does NOT contain podcast, tutor, or sources
  assert.ok(!fileContent.includes('key: "podcast"'), "No podcast tab");
  assert.ok(!fileContent.includes('key: "tutor"'), "No tutor tab");
  assert.ok(!fileContent.includes('key: "sources"'), "No sources tab");
  assert.ok(fileContent.includes('label: "Summarize Notes"'), "Has Summarize Notes tab label");
});

// Test 5: ResultsStep tabs config
test("ResultsStep tabs config excludes Tutor & Podcast and renames Notes to Summarize Notes", () => {
  const fileContent = readFileSync(
    resolve(process.cwd(), "src/components/ai-study/ResultsStep.tsx"),
    "utf-8"
  );
  assert.ok(!fileContent.includes('id: "tutor"'), "No tutor tab in ResultsStep");
  assert.ok(!fileContent.includes('id: "podcast"'), "No podcast tab in ResultsStep");
  assert.ok(fileContent.includes('label: "Summarize Notes"'), "Has Summarize Notes in ResultsStep");
});

// Test 6: Text Extraction file types
test("Text extraction accepts expected media and document formats", () => {
  assert.ok(ACCEPT_TYPES.includes(".pdf"), "Accepts PDF");
  assert.ok(ACCEPT_TYPES.includes(".docx"), "Accepts DOCX");
  assert.ok(ACCEPT_TYPES.includes(".pptx"), "Accepts PPTX");
  assert.ok(ACCEPT_TYPES.includes(".png"), "Accepts Images");
  assert.ok(ACCEPT_TYPES.includes(".mp3"), "Accepts Audio");
  assert.ok(ACCEPT_TYPES.includes(".mp4"), "Accepts Video");
});

// Test 7: Live Gemini Connection via Server Function
await asyncTest("Live Gemini connection test pings Google AI endpoint", async () => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const res = await runAiConnectionTest({
    provider: "gemini",
    apiKey,
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-flash-lite-latest",
  });
  assert.equal(res.ok, true, `Connection must succeed. Message: ${res.message}`);
  assert.ok(res.latencyMs > 0, `Latency valid: ${res.latencyMs}ms`);
  console.log(`    ↳ Latency: ${res.latencyMs}ms`);
});

// Test 8: Live AI Chat Completion via Gemini
await asyncTest("Live Gemini chat tutor responds with high-yield academic guidance", async () => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const { runAiChatCompletion } = await import("../src/lib/ai-study-generation.server.ts");
  const res = await runAiChatCompletion({
    provider: "gemini",
    apiKey,
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-flash-lite-latest",
    messages: [{ role: "user", content: "Explain Ohm's Law in 1 sentence." }],
  });
  assert.equal(res.ok, true, "Chat succeeds");
  assert.ok(res.content && res.content.length > 5, "Generated chat response");
  console.log(`    ↳ Response preview: "${res.content.slice(0, 50).replace(/\n/g, ' ')}..."`);
});

// ---------------------------------------------------------
// SECTION B: USER EXPERIENCE TESTS (DOM, FLOW & INTERACTIONS)
// ---------------------------------------------------------
console.log("\n--- 2. USER EXPERIENCE AUDIT: UI, WORKSPACE & INTERACTIONS ---");

// Test 9: HTTP Dev Server availability
await asyncTest("Dev Server responds with 200 OK at http://localhost:3002/ai-study", async () => {
  const res = await fetch("http://localhost:3002/ai-study");
  assert.equal(res.status, 200, "Dev server status 200");
  const html = await res.text();
  assert.ok(html.includes("<!DOCTYPE html>"), "Serves HTML document");
});

// Test 10: AIStudyHeader Hero & Direct Upload (No Popup)
test("AIStudyHeader provides direct file input on Upload card with NO popup trigger", () => {
  const fileContent = readFileSync(
    resolve(process.cwd(), "src/components/ai-study/AIStudyHeader.tsx"),
    "utf-8"
  );
  // Must have ref={fileInputRef} and type="file"
  assert.ok(fileContent.includes("ref={fileInputRef}"), "Has fileInputRef");
  assert.ok(fileContent.includes('type="file"'), "Has type=file input");
  assert.ok(fileContent.includes("fileInputRef.current?.click()"), "Clicking Upload triggers fileInputRef.current?.click()");
  // Must NOT open create modal on files tab
  assert.ok(!fileContent.includes('onOpenCreateWithTab?.("files")'), "Upload card does NOT call onOpenCreateWithTab('files')");
});

// Test 11: Direct Upload Progress Flow in ai-study.tsx
test("ai-study.tsx handles direct upload and displays Gemini processing overlay", () => {
  const fileContent = readFileSync(
    resolve(process.cwd(), "src/routes/ai-study.tsx"),
    "utf-8"
  );
  assert.ok(fileContent.includes("handleDirectUpload"), "Contains handleDirectUpload handler");
  assert.ok(fileContent.includes("directProgress"), "Contains directProgress state");
  assert.ok(fileContent.includes("Google Gemini Engine"), "Overlay mentions Google Gemini Engine");
  assert.ok(fileContent.includes("onDirectUpload={handleDirectUpload}"), "Passes onDirectUpload to AIStudyHeader");
});

// Test 12: StudySetNotesTab Executive University Lecture Redesign
test("StudySetNotesTab implements scholarly treatise layout, Markdown renderer & export tools", () => {
  const fileContent = readFileSync(
    resolve(process.cwd(), "src/components/ai-study/StudySetNotesTab.tsx"),
    "utf-8"
  );
  assert.ok(
    fileContent.includes("Academic Syllabus Treatise") || fileContent.includes("Summarize Notes"),
    "Header badge displays academic treatise or Summarize Notes"
  );
  assert.ok(fileContent.includes("MarkdownRenderer"), "Uses MarkdownRenderer for LaTeX & math typography");
  assert.ok(fileContent.includes("estimatedReadMinutes"), "Has estimated read time calculation");
  assert.ok(fileContent.includes("wordCount"), "Has word count metric");
  assert.ok(fileContent.includes("handleCopy"), "Has copy notes action");
  assert.ok(fileContent.includes("handleDownload"), "Has markdown download action");
  assert.ok(fileContent.includes("handlePrint"), "Has print action");
  assert.ok(fileContent.includes("buildChatGPTStyleNotesMarkdown"), "Synthesizes ChatGPT-style comprehensive lecture notes");
});

// Test 13: StudySetOverviewTab Tab Links
test("StudySetOverviewTab links to 'Summarize Notes' and excludes removed features", () => {
  const fileContent = readFileSync(
    resolve(process.cwd(), "src/components/ai-study/StudySetOverviewTab.tsx"),
    "utf-8"
  );
  assert.ok(fileContent.includes("Summarize Notes"), "Overview displays 'Summarize Notes'");
  assert.ok(!fileContent.includes("AI Tutor"), "Does not display AI Tutor card");
  assert.ok(!fileContent.includes("AI Podcast"), "Does not display AI Podcast card");
});

// Test 14: Deep linking route logic (?set=...&tab=...)
test("Route handles URL deep linking parameters for direct set and tab navigation", () => {
  const fileContent = readFileSync(
    resolve(process.cwd(), "src/routes/ai-study.tsx"),
    "utf-8"
  );
  assert.ok(fileContent.includes('params.get("set")'), "Reads ?set param");
  assert.ok(fileContent.includes('params.get("tab")'), "Reads ?tab param");
});

console.log("\n=========================================================");
console.log(`📊 FINAL TEST REPORT: ${passedCount} / ${totalCount} TESTS PASSED (${Math.round((passedCount/totalCount)*100)}%)`);
console.log("=========================================================\n");

if (passedCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
