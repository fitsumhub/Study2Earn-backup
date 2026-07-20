import { chromium } from "playwright";

const BASE = "http://localhost:3001";
const OUT = "C:\\Users\\APLUS\\AppData\\Local\\Temp\\claude\\c--Users-APLUS-Downloads-study2earn-source\\c3ca04fb-3792-4449-9aaf-dc243232ac39\\scratchpad\\shots";
const PPTX_PATH = "C:\\Users\\APLUS\\Downloads\\biology-lab-methods.pptx";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1300 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

await page.goto(BASE + "/ai-study", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForSelector("text=Drag & drop your file here", { timeout: 15000 });
await page.waitForTimeout(10000);

console.log("uploading pptx...");
await page.setInputFiles('input[type="file"]', PPTX_PATH);

for (let i = 0; i < 45; i++) {
  await page.waitForTimeout(1000);
  const body = await page.locator("body").innerText().catch(() => "");
  if (body.includes("What we read from your file") || body.includes("Your Study Pack")) {
    console.log(`[${i + 1}s] reached results`);
    console.log("detectionSource content:", body.includes("Subject detected from file content"));
    console.log("detectionSource filename:", body.includes("Subject guessed from filename"));
    const idx = body.indexOf("What we read from your file");
    console.log("excerpt:", idx >= 0 ? body.slice(idx, idx + 350).replace(/\n/g, " ") : "(none)");
    break;
  }
  if (i === 44) console.log("gave up after 45s, last body sample:", body.slice(0, 500));
}
await page.screenshot({ path: `${OUT}\\90-pptx-patient.png`, fullPage: true });

await browser.close();
console.log("done");
