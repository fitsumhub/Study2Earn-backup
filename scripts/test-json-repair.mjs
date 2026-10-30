import fs from "fs";

let txt = fs.readFileSync("scripts/gemini-raw-out.json", "utf8");
txt = txt.replace(/\r\n/g, "\n");

// Repair unquoted property names like: explanation: or modelAnswer":
txt = txt.replace(/([{\[,\n]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
txt = txt.replace(/([{\[,\n]\s*)"?([a-zA-Z0-9_$]+)"?\s*:/g, '$1"$2":');
// Repair trailing commas
txt = txt.replace(/,\s*([}\]])/g, "$1");

const parsed = JSON.parse(txt);
console.log("FIXED! Parsed title:", parsed.title);
console.log("Keys count:", Object.keys(parsed).length);
console.log("Flashcards:", parsed.flashcards?.length);
console.log("Quizzes:", parsed.quizzes?.length);
console.log("Written tests:", parsed.writtenTests?.length);
