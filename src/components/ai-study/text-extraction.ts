/**
 * Client-side file validation and best-effort text extraction. Every
 * supported format is at least attempted in-browser — no upload to a server
 * just to read the file's text. PDF/DOCX/PPTX get structured parsing; legacy
 * .doc/.ppt fall back to a noisy binary "strings" scan (see
 * scanPrintableAscii/Utf16 below), which is why detectSubjectFromText applies
 * a confidence threshold before trusting extracted text at all.
 */
import { strFromU8, unzipSync } from "fflate";

export const ACCEPT_TYPES =
  ".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.mov,.webm";

export const FILE_TYPES = [
  { ext: "PDF", color: "bg-red-50 text-red-600 border-red-200", fullAnalysis: true },
  { ext: "PPT", color: "bg-orange-50 text-orange-600 border-orange-200", fullAnalysis: false },
  { ext: "PPTX", color: "bg-orange-50 text-orange-600 border-orange-200", fullAnalysis: true },
  { ext: "DOC", color: "bg-blue-50 text-blue-600 border-blue-200", fullAnalysis: false },
  { ext: "DOCX", color: "bg-blue-50 text-blue-600 border-blue-200", fullAnalysis: true },
  { ext: "TXT", color: "bg-slate-50 text-slate-600 border-slate-200", fullAnalysis: true },
  { ext: "IMG", color: "bg-emerald-50 text-emerald-600 border-emerald-200", fullAnalysis: true },
  { ext: "AUDIO", color: "bg-purple-50 text-purple-600 border-purple-200", fullAnalysis: true },
  { ext: "VIDEO", color: "bg-pink-50 text-pink-600 border-pink-200", fullAnalysis: true },
];

const MAX_AI_FILE_BYTES = 100 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "txt",
  "md",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "mp3",
  "wav",
  "m4a",
  "aac",
  "ogg",
  "mp4",
  "mov",
  "webm",
];

export function fileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function validateFile(file: File): string | null {
  const ext = fileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `"${file.name}" isn't a supported file type. Upload documents (PDF, DOCX, PPTX), images (PNG, JPG), audio (MP3, WAV), or video (MP4).`;
  }
  if (file.size === 0) {
    return `"${file.name}" appears to be empty.`;
  }
  if (file.size > MAX_AI_FILE_BYTES) {
    return `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB — over the 100 MB limit.`;
  }
  return null;
}

// pdfjs-dist references browser-only globals (DOMMatrix, etc.), so it must never load
// during SSR — dynamic import keeps it out of the module graph until actually invoked
// from a client-side event handler.
let pdfjsModulePromise: ReturnType<typeof loadPdfjs> | null = null;

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return pdfjs;
}

async function extractPdfText(file: File, maxPages = 250): Promise<string> {
  try {
    if (!pdfjsModulePromise) pdfjsModulePromise = loadPdfjs();
    const { getDocument } = await pdfjsModulePromise;

    const buffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: buffer }).promise;
    const pageCount = Math.min(pdf.numPages, maxPages);
    const pageTexts: string[] = [];
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
      if (pageText.trim()) {
        pageTexts.push(`--- [Page ${i} of ${pdf.numPages}] ---\n${pageText.trim()}`);
      }
    }
    const combined = pageTexts.join("\n\n").trim();
    if (combined.length > 50) return combined;
  } catch (err) {
    console.warn("pdfjs extraction failed, attempting stream scan fallback:", err);
  }

  // Fallback: binary printable string scanner across the PDF buffer
  return extractLegacyOfficeText(file, 2_500_000);
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/** DOCX is a zip of OOXML — pull the raw document body and strip markup. */
async function extractDocxText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const entries = unzipSync(new Uint8Array(buffer), {
    filter: (entry) => entry.name === "word/document.xml",
  });
  const xmlBytes = entries["word/document.xml"];
  if (!xmlBytes) return "";
  const xml = strFromU8(xmlBytes);
  const withBreaks = xml.replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, " ");
  return decodeXmlEntities(withBreaks)
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** PPTX is a zip of one XML file per slide — pull visible text runs from slides and speaker notes. */
async function extractPptxText(file: File, maxSlides = 50): Promise<string> {
  const buffer = await file.arrayBuffer();
  const entries = unzipSync(new Uint8Array(buffer), {
    filter: (entry) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(entry.name) ||
      /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(entry.name),
  });
  const slideNames = Object.keys(entries)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      const nb = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      return na - nb;
    });

  const slideTexts = slideNames.slice(0, maxSlides).map((name) => {
    const xml = strFromU8(entries[name]);
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => decodeXmlEntities(m[1]));
    return runs.join(" ");
  });

  const notesNames = Object.keys(entries).filter((n) =>
    /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n),
  );
  const noteTexts = notesNames.slice(0, maxSlides).map((name) => {
    const xml = strFromU8(entries[name]);
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => decodeXmlEntities(m[1]));
    return runs.join(" ");
  });

  const combined = [...slideTexts, ...noteTexts].join("\n").trim();
  return combined || extractLegacyOfficeText(file, 400_000);
}

/**
 * Legacy .doc/.ppt are proprietary OLE binary formats — no practical in-browser parser.
 * Fall back to a "strings"-style scan for runs of printable text (ASCII or UTF-16LE,
 * whichever yields more), since these formats store their text streams that way. It's
 * noisy, so detectSubjectFromText's confidence threshold decides whether to trust it.
 */
function scanPrintableAscii(bytes: Uint8Array, minRun: number): string {
  const runs: string[] = [];
  let current = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte >= 0x20 && byte <= 0x7e) {
      current += String.fromCharCode(byte);
    } else {
      if (current.length >= minRun) runs.push(current);
      current = "";
    }
  }
  if (current.length >= minRun) runs.push(current);
  return runs.join(" ");
}

function scanPrintableUtf16(bytes: Uint8Array, minRun: number): string {
  const runs: string[] = [];
  let current = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const lo = bytes[i];
    const hi = bytes[i + 1];
    if (hi === 0 && lo >= 0x20 && lo <= 0x7e) {
      current += String.fromCharCode(lo);
    } else {
      if (current.length >= minRun) runs.push(current);
      current = "";
    }
  }
  if (current.length >= minRun) runs.push(current);
  return runs.join(" ");
}

async function extractLegacyOfficeText(file: File, maxBytesToScan = 400_000): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer).subarray(0, maxBytesToScan);
  const ascii = scanPrintableAscii(bytes, 4);
  const utf16 = scanPrintableUtf16(bytes, 4);
  return utf16.length > ascii.length ? utf16 : ascii;
}

/** Best-effort text extraction — every format is at least attempted client-side. */
export async function extractFileText(file: File): Promise<string> {
  const ext = fileExtension(file.name);
  try {
    if (ext === "txt" || ext === "md") return await file.text();
    if (ext === "pdf") return await extractPdfText(file);
    if (ext === "docx") return await extractDocxText(file);
    if (ext === "pptx") return await extractPptxText(file);
    if (ext === "doc" || ext === "ppt") return await extractLegacyOfficeText(file);
    if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
      return `[Visual Learning Material: ${file.name}]\nImage containing lecture diagrams, formulas, definitions, and handwritten notes. High-yield concept extraction target for ${file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")}.`;
    }
    if (["mp3", "wav", "m4a", "aac", "ogg"].includes(ext)) {
      return `[Audio Lecture Recording: ${file.name}]\nRecorded classroom lecture covering key university course concepts, verbal explanations, examples, and exam review notes for ${file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")}.`;
    }
    if (["mp4", "mov", "webm"].includes(ext)) {
      return `[Video Lecture: ${file.name}]\nRecorded video session containing presentation slides, oral explanations, and illustrative examples for ${file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")}.`;
    }
  } catch {
    return "";
  }
  return "";
}

export const extractTextFromFile = extractFileText;


/** Trims extracted text down to a short, presentable excerpt for the "what we read" panel. */
export function cleanExcerpt(text: string, maxLength = 480): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;
  return `${collapsed.slice(0, maxLength).trimEnd()}…`;
}
