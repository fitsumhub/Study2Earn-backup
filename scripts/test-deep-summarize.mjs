import { getServerConfig } from "../src/lib/config.server.ts";
import { runSummarizeNotesGeneration } from "../src/lib/ai-study-generation.server.ts";

const config = getServerConfig();
console.log("Testing Deep Summarize Notes with Gemini AI...");

const text = `
Computer Networks - Chapter 4: Network Layer and Routing Protocols
In computer networking, routing is the process of selecting paths across one or more networks. 
Distance-Vector Routing Protocols: Based on the Bellman-Ford algorithm. Each router shares its routing table with directly connected neighbors. Metric is typically hop count (RIP limit is 15 hops; 16 represents infinity/unreachable).
Routing Loops and Count-to-Infinity Problem: Occurs when a link fails and routers slowly increment hop counts.
Solutions to Count-to-Infinity:
1. Split Horizon: Do not advertise a route back out the same interface from which it was learned.
2. Poison Reverse: Advertise unreachable routes with an infinite metric (hop count 16) back out the interface.
3. Holddown Timers: Prevent routers from reinstating a route for a period after it is declared down.
Link-State Routing Protocols: Based on Dijkstra's Shortest Path First (SPF) algorithm (e.g., OSPF). Each router maintains a complete topological map of the entire network. OSPF uses Cost as its metric, where Cost = Reference Bandwidth / Interface Bandwidth (Default reference bandwidth = 100 Mbps = 10^8 bps).
`;

const t0 = Date.now();
const res = await runSummarizeNotesGeneration({
  text,
  titleHint: "Network Layer Routing Protocols & Algorithms",
  subjectHint: "Computer Science",
  depth: "detailed",
  focus: "exam-focused",
  language: "en",
  apiKey: config.geminiApiKey,
  provider: "gemini",
});

console.log(`[Summarize] Result: ok=${res.ok}, source=${res.source}, duration=${Date.now() - t0}ms`);
if (!res.ok) {
  console.error("Failed to generate summarize notes:", res);
  process.exit(1);
}

const notes = res.notes || res.data;
console.log("\n--- Notes Summary ---");
console.log(notes.summary?.slice(0, 150) + "...");

console.log(`\n--- Key Concepts (${notes.keyConcepts?.length || 0}) ---`);
const firstConcept = notes.keyConcepts?.[0];
if (firstConcept) {
  console.log(`Concept: "${firstConcept.concept}"`);
  console.log(`Definition: "${firstConcept.definition}"`);
  console.log("Worked Example:", JSON.stringify(firstConcept.workedExample, null, 2));
}

console.log(`\n--- Formulas and Rules (${notes.formulasAndRules?.length || 0}) ---`);
const firstFormula = notes.formulasAndRules?.[0];
if (firstFormula) {
  console.log(`Formula: "${firstFormula.title}" (${firstFormula.formula})`);
  console.log("Worked Calculation Example:", JSON.stringify(firstFormula.workedCalculationExample, null, 2));
}

console.log(`\n--- Clarifying Examples (${notes.clarifyingExamples?.length || 0}) ---`);
const firstEx = notes.clarifyingExamples?.[0];
if (firstEx) {
  console.log(`Scenario: "${firstEx.title}"`);
  console.log(`Analysis: "${firstEx.analysis?.slice(0, 150)}..."`);
  console.log(`Examiner Trap: "${firstEx.examinerTrap}"`);
}

console.log(`\n--- Raw Markdown Monograph Length: ${notes.rawMarkdown?.length || 0} chars ---`);
console.log(notes.rawMarkdown?.slice(0, 300) + "...\n");

console.log("✓ All assertions for deep summarize note with worked examples PASSED!");
