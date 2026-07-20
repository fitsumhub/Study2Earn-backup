import fs from "node:fs";

const candidates = [
  "chapter 2.pptx",
  "Chapter 3.pptx",
  "Lesson 1_ Kotlin basics.pptx",
  "chemistry-lab-skills.pptx",
  "Presentation1.pptx",
];

for (const name of candidates) {
  const path = `C:\\Users\\APLUS\\Downloads\\${name}`;
  try {
    const buf = fs.readFileSync(path);
    const isZip = buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b; // "PK"
    console.log(`${name}: size=${buf.length} isZip=${isZip}`);
  } catch (e) {
    console.log(`${name}: ERROR ${e.message}`);
  }
}
