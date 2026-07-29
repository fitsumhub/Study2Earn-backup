import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Guards against `javascript:`/`data:` URI injection in admin-authored links
 * (announcement banner, sponsor ad CTAs) that render for every visitor.
 * Only http(s), relative paths, anchors, and mailto are allowed through.
 */
export function safeHref(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  return undefined;
}
