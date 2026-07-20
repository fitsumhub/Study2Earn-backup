import fs from "node:fs";
import { unzipSync, strFromU8 } from "fflate";

function extractPptxText(buf, maxSlides = 40) {
  const entries = unzipSync(new Uint8Array(buf), {
    filter: (entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.name),
  });
  const slideNames = Object.keys(entries).sort((a, b) => {
    const na = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
    const nb = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
    return na - nb;
  });
  const slideTexts = slideNames.slice(0, maxSlides).map((name) => {
    const xml = strFromU8(entries[name]);
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
    return runs.join(" ");
  });
  return { slideCount: slideNames.length, text: slideTexts.join("\n").trim() };
}

for (const name of ["chapter 2.pptx", "Chapter 3.pptx", "Presentation1.pptx"]) {
  const buf = fs.readFileSync(`C:\\Users\\APLUS\\Downloads\\${name}`);
  const { slideCount, text } = extractPptxText(buf);
  console.log(`=== ${name} ===`);
  console.log("slideCount:", slideCount, "textLength:", text.length);
  console.log("excerpt:", text.slice(0, 300));
  console.log();
}
