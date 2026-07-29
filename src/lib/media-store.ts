/**
 * Local media store — persists admin-uploaded files (book PDFs, images) in
 * localStorage as data URLs, referenced by a stable `local:<id>` pointer so the
 * (potentially large) file body is stored once instead of being duplicated in
 * every store that mentions it.
 *
 * localStorage has a ~5MB quota shared across the whole origin, so uploads are
 * size-capped and quota errors surface as a friendly failure instead of a
 * crash. For anything bigger the admin should host the file (e.g. drop it in
 * /public/pdfs) and paste the URL instead.
 */

const FILES_KEY = "study2earn-files";
export const LOCAL_FILE_PREFIX = "local:";

/** Max size for an uploaded PDF (before base64 inflation). */
export const MAX_PDF_BYTES = 2.5 * 1024 * 1024;
/** Max size for a raw image file we accept before downscaling. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type FileMap = Record<string, string>;

function readFiles(): FileMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FILES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as FileMap) : {};
  } catch {
    return {};
  }
}

function writeFiles(files: FileMap): { ok: true } | { ok: false; error: string } {
  if (typeof window === "undefined") return { ok: false, error: "Not available on the server" };
  try {
    localStorage.setItem(FILES_KEY, JSON.stringify(files));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Browser storage is full. Remove other uploads or host the file and paste its URL instead.",
    };
  }
}

export function isLocalFileUrl(url: string | undefined | null): boolean {
  return !!url && url.startsWith(LOCAL_FILE_PREFIX);
}

/** Store a data URL and return its `local:<id>` pointer. */
export function saveLocalFile(
  kind: "pdf" | "img",
  dataUrl: string,
): { ok: true; pointer: string } | { ok: false; error: string } {
  const id = `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const files = readFiles();
  files[id] = dataUrl;
  const res = writeFiles(files);
  if (!res.ok) return res;
  return { ok: true, pointer: `${LOCAL_FILE_PREFIX}${id}` };
}

/** Duplicate a stored local file under a new id so the copies are independent. */
export function cloneLocalFile(
  pointer: string | undefined | null,
): { ok: true; pointer: string } | { ok: false; error: string } | null {
  if (!isLocalFileUrl(pointer)) return null;
  const dataUrl = resolveMediaUrl(pointer);
  if (!dataUrl) return null;
  const kind = pointer!.includes("local:pdf-") ? "pdf" : "img";
  return saveLocalFile(kind, dataUrl);
}

export function deleteLocalFile(pointer: string | undefined | null) {
  if (!isLocalFileUrl(pointer)) return;
  const id = pointer!.slice(LOCAL_FILE_PREFIX.length);
  const files = readFiles();
  if (id in files) {
    delete files[id];
    writeFiles(files);
  }
}

/** Resolve a URL that may be a `local:<id>` pointer into a usable src. */
export function resolveMediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (!isLocalFileUrl(url)) return url;
  const id = url.slice(LOCAL_FILE_PREFIX.length);
  return readFiles()[id];
}

/** Approximate stored size of a local file, for display. */
export function localFileSize(pointer: string | undefined | null): number {
  const dataUrl = isLocalFileUrl(pointer) ? resolveMediaUrl(pointer) : undefined;
  if (!dataUrl) return 0;
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.round((base64.length * 3) / 4);
}

export function fileSizeLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** Read a File as a data URL. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Read an image file and downscale it on a canvas so stored covers/creatives
 * stay small. PNGs that fit under `keepOriginalUnder` are kept as-is to
 * preserve transparency (logos).
 */
export async function processImageFile(
  file: File,
  { maxDim = 1000, quality = 0.82, keepOriginalUnder = 150 * 1024 } = {},
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > MAX_IMAGE_BYTES)
    throw new Error(`Image is too large (max ${fileSizeLabel(MAX_IMAGE_BYTES)})`);

  const dataUrl = await readAsDataUrl(file);
  const keepsAlpha = file.type === "image/png" || file.type === "image/svg+xml";
  if (keepsAlpha && file.size <= keepOriginalUnder) return dataUrl;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not decode the image"));
    el.src = dataUrl;
  });

  // Guard against decompression-bomb-style images (tiny file, huge pixel
  // dimensions) hanging the browser tab on the canvas resize below.
  const MAX_PIXELS = 40_000_000; // e.g. ~8000x5000
  if (img.width * img.height > MAX_PIXELS) {
    throw new Error("Image dimensions are too large to process");
  }

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  // White backing so transparent PNGs don't turn black when re-encoded as JPEG.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Validate + read a PDF file, enforcing the storage size cap. */
export async function processPdfFile(file: File): Promise<string> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) throw new Error("Please choose a PDF file");
  if (file.size > MAX_PDF_BYTES)
    throw new Error(
      `PDF is too large for browser storage (max ${fileSizeLabel(MAX_PDF_BYTES)}). Host it (e.g. in /public/pdfs) and paste the URL instead.`,
    );
  return readAsDataUrl(file);
}
