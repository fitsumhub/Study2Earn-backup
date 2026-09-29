import assert from "node:assert/strict";
import {
  generateSmartCurriculumResponse,
  runAiChatCompletion,
} from "../src/lib/ai-study-generation.server.ts";

console.log("=== Testing AI Study Upgrade Logic & Curriculum Engine ===");

// 1. Test Explain Topic Tool
const explainOutput = generateSmartCurriculumResponse(
  "Explain projectile motion and kinematics formulas",
  "General Physics (Phys 1011)",
  "explain",
  "en",
);
assert.ok(explainOutput.includes("General Physics (Phys 1011)"), "Mentions course in explain");
assert.ok(explainOutput.includes("Core Intuition"), "Includes intuition section");
assert.ok(explainOutput.includes("Key Definition"), "Includes key definition");
assert.ok(explainOutput.includes("Ethiopian Exit Exam Pitfalls"), "Includes Ethiopian exam pitfalls");
console.log("✓ Explain topic generation verified");

// 2. Test Summarize Notes Tool
const summarizeOutput = generateSmartCurriculumResponse(
  "Chapter 2 note summary",
  "Freshman Mathematics (Math 1011)",
  "summarize",
  "en",
);
assert.ok(summarizeOutput.includes("High-Yield Study Summary"), "Includes summary heading");
assert.ok(summarizeOutput.includes("Top 5 High-Yield Concepts"), "Includes top concepts");
console.log("✓ Summarize notes generation verified");

// 3. Test Flashcards Tool
const flashcardsOutput = generateSmartCurriculumResponse(
  "Create flashcards for informal fallacies",
  "Logic & Critical Thinking (Phil 1011)",
  "flashcards",
  "en",
);
assert.ok(flashcardsOutput.includes("Card 1"), "Includes flashcard 1");
assert.ok(flashcardsOutput.includes("Card 2"), "Includes flashcard 2");
assert.ok(flashcardsOutput.includes("Front"), "Has front of card");
assert.ok(flashcardsOutput.includes("Back"), "Has back of card");
console.log("✓ Flashcards generation verified");

// 4. Test Practice Questions Tool
const questionsOutput = generateSmartCurriculumResponse(
  "Practice quiz questions",
  "General Physics (Phys 1011)",
  "questions",
  "en",
);
assert.ok(questionsOutput.includes("Question 1"), "Has question 1");
assert.ok(questionsOutput.includes("Correct Answer"), "Has answer key");
assert.ok(questionsOutput.includes("Explanation"), "Has distractor rationale");
console.log("✓ Practice questions generation verified");

// 5. Test Practice Exam Tool
const examOutput = generateSmartCurriculumResponse(
  "Simulate Exit Exam",
  "General Physics (Phys 1011)",
  "exam",
  "en",
);
assert.ok(examOutput.includes("Simulated Practice Exam"), "Has exam title");
assert.ok(examOutput.includes("Exit Exam"), "Mentions exit exam");
console.log("✓ Practice exam generation verified");

// 6. Test Study Planner Tool
const planOutput = generateSmartCurriculumResponse(
  "Make a study schedule",
  "Freshman Mathematics (Math 1011)",
  "plan",
  "en",
);
assert.ok(planOutput.includes("7-Day High-Performance Study Plan"), "Has 7-day schedule");
assert.ok(planOutput.includes("Day 1"), "Has day 1");
assert.ok(planOutput.includes("Pomodoro"), "Includes study tips");
console.log("✓ Study planner generation verified");

// 7. Test Amharic (በአማርኛ) generation
const amharicOutput = generateSmartCurriculumResponse(
  "በአማርኛ አስረዳኝ",
  "General Physics (Phys 1011)",
  "explain",
  "am",
);
assert.ok(amharicOutput.includes("ሰላም"), "Contains Amharic greeting");
assert.ok(amharicOutput.includes("የጥናት ረዳትዎ"), "Identifies as study assistant in Amharic");
assert.ok(amharicOutput.includes("የፈተና ጥንቃቄዎች"), "Contains exam tips in Amharic");
console.log("✓ Amharic localized generation verified");

// 8. Test runAiChatCompletion wrapper
const chatRes = await runAiChatCompletion({
  provider: "openai",
  course: "General Physics (Phys 1011)",
  tool: "explain",
  messages: [{ role: "user", content: "What is velocity?" }],
});
assert.equal(chatRes.ok, true, "Chat completion succeeds");
assert.ok(chatRes.content.length > 50, "Content generated");
assert.equal(chatRes.source, "curriculum_engine", "Falls back to curriculum engine when no api key");
console.log("✓ Chat completion wrapper verified");

console.log("\nAll AI Study tests PASSED! 🎉");

