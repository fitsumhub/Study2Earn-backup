import { chromium } from "playwright";

const BASE = "http://localhost:3001";
const OUT = "C:\\Users\\APLUS\\AppData\\Local\\Temp\\claude\\c--Users-APLUS-Downloads-study2earn-source\\c3ca04fb-3792-4449-9aaf-dc243232ac39\\scratchpad\\shots";
const PPTX_PATH = "C:\\Users\\APLUS\\Downloads\\biology-lab-methods.pptx";
const DOCX_PATH = "C:\\Users\\APLUS\\Downloads\\Full_Assignment.docx";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1300 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

async function waitForExcerptOrTimeout(maxSeconds) {
  for (let i = 0; i < maxSeconds; i++) {
    await page.waitForTimeout(1000);
    const body = await page.locator("body").innerText().catch(() => "");
    if (body.includes("What we read from your file") || body.includes("Your Study Pack")) return body;
  }
  return await page.locator("body").innerText().catch(() => "(failed to read body)");
}

await page.goto(BASE + "/ai-study", { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForSelector("text=Drag & drop your file here", { timeout: 15000 });
await page.waitForTimeout(8000);

// ── PPTX ──
console.log("=== Uploading PPTX (biology-lab-methods.pptx) ===");
await page.setInputFiles('input[type="file"]', PPTX_PATH);
let body = await waitForExcerptOrTimeout(30);
console.log("onResults:", body.includes("Your Study Pack"));
console.log("detectionSource content:", body.includes("Subject detected from file content"));
console.log("detectionSource filename:", body.includes("Subject guessed from filename"));
let idx = body.indexOf("What we read from your file");
console.log("excerpt:", idx >= 0 ? body.slice(idx, idx + 300).replace(/\n/g, " ") : "(none)");
await page.screenshot({ path: `${OUT}\\80-pptx-result.png`, fullPage: true });

// ── DOCX ──
console.log("\n=== Uploading DOCX (Full_Assignment.docx) ===");
await page.getByText("Upload new file").click();
await page.waitForTimeout(500);
await page.setInputFiles('input[type="file"]', DOCX_PATH);
body = await waitForExcerptOrTimeout(30);
console.log("onResults:", body.includes("Your Study Pack"));
console.log("detectionSource content:", body.includes("Subject detected from file content"));
console.log("detectionSource filename:", body.includes("Subject guessed from filename"));
idx = body.indexOf("What we read from your file");
console.log("excerpt:", idx >= 0 ? body.slice(idx, idx + 300).replace(/\n/g, " ") : "(none)");
await page.screenshot({ path: `${OUT}\\81-docx-result.png`, fullPage: true });

// ── synthetic legacy .doc (fake binary with embedded UTF-16LE text) ──
console.log("\n=== Uploading synthetic legacy .doc ===");
await page.getByText("Upload new file").click();
await page.waitForTimeout(500);
const utf16Text = "Chapter One: Cell Biology and Genetics DNA RNA mitochondria photosynthesis enzyme";
const utf16Bytes = Buffer.alloc(utf16Text.length * 2);
for (let i = 0; i < utf16Text.length; i++) utf16Bytes.writeUInt16LE(utf16Text.charCodeAt(i), i * 2);
const fakeDocBuffer = Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0]), utf16Bytes, Buffer.alloc(50)]);
await page.setInputFiles('input[type="file"]', { name: "old-notes.doc", mimeType: "application/msword", buffer: fakeDocBuffer });
body = await waitForExcerptOrTimeout(20);
console.log("onResults:", body.includes("Your Study Pack"));
console.log("detectionSource content:", body.includes("Subject detected from file content"));
console.log("detectionSource filename:", body.includes("Subject guessed from filename"));
idx = body.indexOf("What we read from your file");
console.log("excerpt:", idx >= 0 ? body.slice(idx, idx + 300).replace(/\n/g, " ") : "(none)");

console.log("\ndone");
await browser.close();
