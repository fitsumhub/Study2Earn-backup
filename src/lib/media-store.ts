/**
 * Local media store — persists admin-uploaded files (book PDFs, PPTs, DOCs, images)
 * in an in-memory cache backed by IndexedDB and localStorage, referenced by a stable
 * `local:<id>` pointer so large files are stored efficiently and can be retrieved instantly.
 */

const FILES_KEY = "study2earn-files";
const IDB_NAME = "study2earn_media_db";
const IDB_STORE = "media_files";
export const LOCAL_FILE_PREFIX = "local:";

/** Max size for an uploaded PDF (up to 50 MB for rich textbooks). */
export const MAX_PDF_BYTES = 50 * 1024 * 1024;
/** Max size for general document files (DOC, PPT, EPUB, etc. up to 50 MB). */
export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;
/** Max size for a raw image file we accept before downscaling (15 MB). */
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

type FileMap = Record<string, string>;

// Synchronous in-memory cache for instant access
const memoryCache: FileMap = {};
let idbInitialized = false;

// Initialize IndexedDB in browser environment
function openIdb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Pre-load from IndexedDB into memoryCache on boot
if (typeof window !== "undefined") {
  void (async () => {
    try {
      // First populate from localStorage for instant synchronous availability
      const raw = localStorage.getItem(FILES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          Object.assign(memoryCache, parsed);
        }
      }

      // Then supplement from IndexedDB
      const db = await openIdb();
      if (!db) return;
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          memoryCache[String(cursor.key)] = String(cursor.value);
          cursor.continue();
        } else {
          idbInitialized = true;
        }
      };
    } catch {
      // Fallback silently to memoryCache
    }
  })();
}

function persistToIdb(id: string, dataUrl: string) {
  if (typeof window === "undefined") return;
  void openIdb().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(dataUrl, id);
    } catch {
      // Ignore idb write errors
    }
  });
}

function deleteFromIdb(id: string) {
  if (typeof window === "undefined") return;
  void openIdb().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(id);
    } catch {
      // Ignore
    }
  });
}

function readFiles(): FileMap {
  if (typeof window === "undefined") return {};
  if (Object.keys(memoryCache).length > 0) return memoryCache;
  try {
    const raw = localStorage.getItem(FILES_KEY);
    if (!raw) return memoryCache;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      Object.assign(memoryCache, parsed);
    }
    return memoryCache;
  } catch {
    return memoryCache;
  }
}

function writeFiles(files: FileMap): { ok: true } | { ok: false; error: string } {
  if (typeof window === "undefined") return { ok: false, error: "Not available on the server" };
  Object.assign(memoryCache, files);
  try {
    // Attempt localStorage persistence for smaller files
    localStorage.setItem(FILES_KEY, JSON.stringify(files));
    return { ok: true };
  } catch {
    // If localStorage quota is reached, IndexedDB and memoryCache still retain the file!
    return { ok: true };
  }
}

export function isLocalFileUrl(url: string | undefined | null): boolean {
  return !!url && url.startsWith(LOCAL_FILE_PREFIX);
}

/** Store a data URL and return its `local:<id>` pointer. */
export function saveLocalFile(
  kind: "pdf" | "img" | "ppt" | "doc" | "file",
  dataUrl: string,
): { ok: true; pointer: string } | { ok: false; error: string } {
  const id = `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const files = readFiles();
  files[id] = dataUrl;
  memoryCache[id] = dataUrl;
  persistToIdb(id, dataUrl);
  writeFiles(files);
  return { ok: true, pointer: `${LOCAL_FILE_PREFIX}${id}` };
}

/** Duplicate a stored local file under a new id so the copies are independent. */
export function cloneLocalFile(
  pointer: string | undefined | null,
): { ok: true; pointer: string } | { ok: false; error: string } | null {
  if (!isLocalFileUrl(pointer)) return null;
  const dataUrl = resolveMediaUrl(pointer);
  if (!dataUrl) return null;
  const kind = pointer!.includes("local:img-")
    ? "img"
    : pointer!.includes("local:ppt-")
    ? "ppt"
    : pointer!.includes("local:doc-")
    ? "doc"
    : "pdf";
  return saveLocalFile(kind, dataUrl);
}

export function deleteLocalFile(pointer: string | undefined | null) {
  if (!isLocalFileUrl(pointer)) return;
  const id = pointer!.slice(LOCAL_FILE_PREFIX.length);
  const files = readFiles();
  if (id in files) {
    delete files[id];
    delete memoryCache[id];
    deleteFromIdb(id);
    writeFiles(files);
  }
}

/** Resolve a URL that may be a `local:<id>` pointer into a usable src. */
export function resolveMediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (!isLocalFileUrl(url)) return url;
  const id = url.slice(LOCAL_FILE_PREFIX.length);
  return memoryCache[id] || readFiles()[id];
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

  const MAX_PIXELS = 40_000_000;
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
    throw new Error(`PDF is too large (max ${fileSizeLabel(MAX_PDF_BYTES)}).`);
  return readAsDataUrl(file);
}

export type DocumentFormat = "pdf" | "ppt" | "doc" | "epub" | "other";

export function getDocumentFormat(filenameOrUrl: string = ""): DocumentFormat {
  const lower = filenameOrUrl.toLowerCase();
  if (lower.endsWith(".pdf") || lower.includes("application/pdf") || lower.includes("local:pdf-")) return "pdf";
  if (
    lower.endsWith(".ppt") ||
    lower.endsWith(".pptx") ||
    lower.includes("presentation") ||
    lower.includes("local:ppt-")
  )
    return "ppt";
  if (
    lower.endsWith(".doc") ||
    lower.endsWith(".docx") ||
    lower.includes("wordprocessing") ||
    lower.includes("local:doc-")
  )
    return "doc";
  if (lower.endsWith(".epub")) return "epub";
  return "other";
}

/** Validate + read any study material document (PDF, PPT, DOC, EPUB, TXT). */
export async function processDocumentFile(
  file: File,
): Promise<{ dataUrl: string; format: DocumentFormat; size: number }> {
  const format = getDocumentFormat(file.name);
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error(`File is too large (max ${fileSizeLabel(MAX_DOCUMENT_BYTES)}).`);
  }
  const dataUrl = await readAsDataUrl(file);
  return { dataUrl, format, size: file.size };
}

/** Universal download helper that handles local pointer, data URL, blob, or remote file. */
export function downloadMediaFile(urlOrPointer: string, defaultName: string = "document") {
  if (typeof window === "undefined") return;
  const resolved = resolveMediaUrl(urlOrPointer) ?? urlOrPointer;
  if (!resolved) return;

  if (resolved.startsWith("data:")) {
    void fetch(resolved)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = defaultName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
      });
  } else {
    const a = document.createElement("a");
    a.href = resolved;
    a.download = defaultName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
