import fs from "fs";

const txt = fs.readFileSync("scripts/gemini-raw-out.json", "utf8");

// Use a parser that reports line and column
let line = 1;
let col = 1;
let inString = false;
let escape = false;

for (let i = 0; i < txt.length; i++) {
  const ch = txt[i];
  if (ch === "\n") {
    line++;
    col = 1;
  } else {
    col++;
  }

  // Attempt JSON parse prefix with closing brackets
  const prefix = txt.slice(0, i);
  try {
    JSON.parse(prefix);
  } catch (e) {
    if (e.message.includes("Property name must be a string literal")) {
      console.log(`Failed at line ${line}, col ${col} (idx ${i})`);
      console.log("Snippet:", txt.slice(Math.max(0, i - 80), Math.min(txt.length, i + 80)));
      break;
    }
  }
}
