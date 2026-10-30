/**
 * Automatic & Custom Thumbnail Generator for Courseware Materials
 * Automatically extracts the 1st page of PDF textbooks as a cover thumbnail,
 * or synthesizes a university-grade academic book cover onto a 600x900 Canvas
 * for PPT slides, Word DOCs, and lecture notes.
 * Also supports custom user/admin image thumbnail uploads.
 */

import { getDocumentFormat, processImageFile, type DocumentFormat } from "@/lib/media-store";

const THEME_PALETTES: Record<
  string,
  { bgGrad: [string, string, string]; accent: string; badgeBg: string; badgeText: string }
> = {
  "Natural Science": {
    bgGrad: ["#091e42", "#1e3a8a", "#0f172a"],
    accent: "#38bdf8",
    badgeBg: "#0284c7",
    badgeText: "#ffffff",
  },
  "Social Science": {
    bgGrad: ["#4c0519", "#881337", "#1c1917"],
    accent: "#fb7185",
    badgeBg: "#e11d48",
    badgeText: "#ffffff",
  },
  "Computer Science": {
    bgGrad: ["#022c22", "#065f46", "#042f2e"],
    accent: "#34d399",
    badgeBg: "#059669",
    badgeText: "#ffffff",
  },
  Law: {
    bgGrad: ["#3b0764", "#581c87", "#18181b"],
    accent: "#c084fc",
    badgeBg: "#9333ea",
    badgeText: "#ffffff",
  },
  "Health & Medicine": {
    bgGrad: ["#14532d", "#166534", "#052e16"],
    accent: "#4ade80",
    badgeBg: "#16a34a",
    badgeText: "#ffffff",
  },
  Common: {
    bgGrad: ["#451a03", "#78350f", "#1c1917"],
    accent: "#fbbf24",
    badgeBg: "#d97706",
    badgeText: "#ffffff",
  },
};

/**
 * Synthesizes a high-resolution, university-grade academic cover on an offscreen Canvas (600x900).
 */
export function renderAcademicCoverCanvas(
  title: string,
  category: string = "Common",
  format: DocumentFormat = "pdf",
): string {
  if (typeof window === "undefined") return "";

  const canvas = document.createElement("canvas");
  const width = 600;
  const height = 900;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const palette =
    THEME_PALETTES[category] ||
    (format === "ppt"
      ? {
          bgGrad: ["#3b1803", "#78350f", "#1c1917"] as [string, string, string],
          accent: "#f59e0b",
          badgeBg: "#d97706",
          badgeText: "#ffffff",
        }
      : format === "doc"
      ? {
          bgGrad: ["#0c1e3f", "#1d4ed8", "#0f172a"] as [string, string, string],
          accent: "#60a5fa",
          badgeBg: "#2563eb",
          badgeText: "#ffffff",
        }
      : THEME_PALETTES["Common"]);

  // 1. Background Gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, palette.bgGrad[0]);
  grad.addColorStop(0.5, palette.bgGrad[1]);
  grad.addColorStop(1, palette.bgGrad[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle Geometric Grid Pattern
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Book Spine Shading & Inner Border
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillRect(0, 0, 42, height); // Left spine hinge

  const spineHighlight = ctx.createLinearGradient(42, 0, 52, 0);
  spineHighlight.addColorStop(0, "rgba(255, 255, 255, 0.15)");
  spineHighlight.addColorStop(1, "transparent");
  ctx.fillStyle = spineHighlight;
  ctx.fillRect(42, 0, 10, height);

  // Elegant golden outer border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 30, width - 85, height - 60);

  // 4. Header Track Pill
  const formatBadgeText =
    format === "ppt"
      ? "📊 PPT LECTURE SLIDES"
      : format === "doc"
      ? "📝 WORD DOC MONOGRAPH"
      : format === "epub"
      ? "📚 EPUB PUBLICATION"
      : "📕 ACADEMIC TEXTBOOK";

  ctx.fillStyle = palette.badgeBg;
  const badgeX = 75;
  const badgeY = 60;
  const badgeW = width - 150;
  const badgeH = 34;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
  ctx.fill();

  ctx.fillStyle = palette.badgeText;
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(formatBadgeText, width / 2, badgeY + badgeH / 2);

  // Category Subtitle
  ctx.fillStyle = palette.accent;
  ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
  ctx.fillText(category.toUpperCase() + " CURRICULUM", width / 2, 130);

  // Divider
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(110, 150);
  ctx.lineTo(width - 80, 150);
  ctx.stroke();

  // 5. Title Text Wrapping
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const words = title.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  const maxLineWidth = width - 160;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxLineWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  let startY = 220;
  for (const line of lines.slice(0, 5)) {
    ctx.fillText(line, width / 2, startY);
    startY += 44;
  }

  // 6. Central Insignia / Seal
  const sealY = startY + 90;
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width / 2, sealY, 48, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(width / 2, sealY, 42, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.fillText("STUDY2EARN", width / 2, sealY - 8);
  ctx.fillStyle = palette.accent;
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.fillText("EXIT EXAM", width / 2, sealY + 10);

  // 7. Footer Stamp
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.fillText("Ministry of Education Syllabus Standard", width / 2, height - 85);

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "10px monospace";
  ctx.fillText("VERIFIED HIGHER EDUCATION COURSEWARE", width / 2, height - 62);

  return canvas.toDataURL("image/jpeg", 0.88);
}

/**
 * Extracts page 1 of a PDF file using pdfjs in the browser,
 * returning a data URL of the first page.
 */
async function extractPdfFirstPage(file: File): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const arrayBuffer = await file.arrayBuffer();

    // Dynamically load pdfjs from react-pdf or pdfjs-dist
    const pdfModule = await import("react-pdf");
    const pdfjs = pdfModule.pdfjs;

    if (!pdfjs) return null;

    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
    }

    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);

    const viewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min(600 / viewport.width, 900 / viewport.height, 1.2);
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    await (page.render as any)({
      canvasContext: ctx,
      viewport: scaledViewport,
      canvas,
    }).promise;

    return canvas.toDataURL("image/jpeg", 0.88);
  } catch (err) {
    console.warn("Could not extract PDF page 1 via pdfjs worker, falling back to canvas synthesis:", err);
    return null;
  }
}

/**
 * Main automatic thumbnail generator:
 * - If file is PDF: attempts first-page extraction, falls back to academic cover canvas.
 * - If file is image: scales image to thumbnail dimensions.
 * - If file is PPT/DOC/other: generates academic canvas cover.
 */
export async function generateThumbnailFromFile(
  file: File,
  options: { title?: string; category?: string } = {},
): Promise<string> {
  const format = getDocumentFormat(file.name);
  const cleanTitle = options.title || file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
  const category = options.category || "Common";

  // Case 1: Direct Image upload
  if (file.type.startsWith("image/")) {
    return processImageFile(file, { maxDim: 600 });
  }

  // Case 2: PDF file — try extracting Page 1
  if (format === "pdf") {
    const extracted = await extractPdfFirstPage(file);
    if (extracted) return extracted;
  }

  // Case 3: PPT, DOC, EPUB or PDF extraction fallback
  return renderAcademicCoverCanvas(cleanTitle, category, format);
}
