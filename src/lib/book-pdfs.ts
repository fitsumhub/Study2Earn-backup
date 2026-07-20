import { resolveMediaUrl } from "@/lib/media-store";
import type { LibraryBook } from "@/lib/mock-data";

/** Local sample MoE-style textbook PDF served from /public/pdfs */
export const DEFAULT_BOOK_PDF = "/pdfs/sample-textbook.pdf";

export function getBookPdfUrl(book: Pick<LibraryBook, "id" | "pdfUrl">): string {
  const raw = book.pdfUrl?.trim();
  if (!raw) return DEFAULT_BOOK_PDF;
  // Admin-uploaded PDFs are stored in the local media store behind a
  // `local:<id>` pointer; resolve it to the stored data URL.
  return resolveMediaUrl(raw) ?? DEFAULT_BOOK_PDF;
}

export function openBookPdfInBrowser(book: Pick<LibraryBook, "id" | "name" | "pdfUrl">) {
  if (typeof window === "undefined") return;
  const url = getBookPdfUrl(book);
  if (url.startsWith("data:")) {
    // Browsers block top-level navigation to data: URLs — open via a blob URL.
    void fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
