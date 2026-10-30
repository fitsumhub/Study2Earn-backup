import {
  FileText,
  ImagePlus,
  Loader2,
  Presentation,
  Upload,
  X,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteLocalFile,
  fileSizeLabel,
  getDocumentFormat,
  isLocalFileUrl,
  localFileSize,
  processDocumentFile,
  processImageFile,
  resolveMediaUrl,
  saveLocalFile,
  type DocumentFormat,
} from "@/lib/media-store";
import { cn } from "@/lib/utils";

/**
 * Image picker that accepts either a pasted URL or an uploaded file.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  hint,
  maxDim = 1000,
  previewClassName,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  maxDim?: number;
  previewClassName?: string;
}) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const preview = resolveMediaUrl(value);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await processImageFile(file, { maxDim });
      const saved = saveLocalFile("img", dataUrl);
      if (!saved.ok) {
        toast.error(saved.error);
        return;
      }
      if (isLocalFileUrl(value)) deleteLocalFile(value);
      onChange(saved.pointer);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not process the image");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clear() {
    if (isLocalFileUrl(value)) deleteLocalFile(value);
    onChange("");
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            "group relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 transition hover:border-brand-navy/50",
            previewClassName,
          )}
          title="Upload image"
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin text-slate-400" />
          ) : preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="size-5 text-slate-400 transition group-hover:text-brand-navy" />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex gap-1.5">
            <Input
              id={id}
              value={isLocalFileUrl(value) ? "" : value}
              onChange={(e) => {
                if (isLocalFileUrl(value)) deleteLocalFile(value);
                onChange(e.target.value);
              }}
              placeholder={isLocalFileUrl(value) ? "Uploaded image" : "https://… or upload →"}
              disabled={isLocalFileUrl(value)}
              className="text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              title="Upload from your device"
            >
              <Upload className="size-3.5" />
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-slate-400 hover:text-destructive"
                onClick={clear}
                title="Remove image"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isLocalFileUrl(value)
              ? `Uploaded · ${fileSizeLabel(localFileSize(value))} — stored in this browser`
              : (hint ?? "Paste an image URL or upload a file (auto-resized)")}
          </p>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

function formatBadgeMeta(fmt: DocumentFormat) {
  switch (fmt) {
    case "pdf":
      return { label: "PDF", bg: "bg-red-50 text-red-700 border-red-200", icon: FileText };
    case "ppt":
      return { label: "PPT / Slides", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: Presentation };
    case "doc":
      return { label: "DOC / Notes", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: FileText };
    case "epub":
      return { label: "EPUB", bg: "bg-purple-50 text-purple-700 border-purple-200", icon: FileText };
    default:
      return { label: "Document", bg: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText };
  }
}

/**
 * Universal study material / document picker: supports PDF, PPT, PPTX, DOC, DOCX, EPUB, TXT.
 * Accepts a hosted URL or direct file upload.
 */
export function DocumentUploadField({
  label = "Study Material File (PDF, PPT, DOC)",
  value,
  onChange,
  onFileProcessed,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onFileProcessed?: (file: File, pointer: string) => void;
}) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isLocal = isLocalFileUrl(value);
  const currentFormat = getDocumentFormat(value);
  const badge = formatBadgeMeta(currentFormat);
  const Icon = badge.icon;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const { dataUrl, format, size } = await processDocumentFile(file);
      const kind = format === "ppt" ? "ppt" : format === "doc" ? "doc" : "pdf";
      const saved = saveLocalFile(kind, dataUrl);
      if (!saved.ok) {
        toast.error(saved.error);
        return;
      }
      if (isLocalFileUrl(value)) deleteLocalFile(value);
      onChange(saved.pointer);
      onFileProcessed?.(file, saved.pointer);
      toast.success(`"${file.name}" uploaded (${fileSizeLabel(size)})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload the file");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {value && (
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4.5 font-semibold", badge.bg)}>
            {badge.label}
          </Badge>
        )}
      </div>

      {isLocal ? (
        <div className="flex items-center gap-3 rounded-lg border bg-slate-50 px-3 py-2.5">
          <div className={cn("grid size-9 shrink-0 place-items-center rounded-lg border", badge.bg)}>
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-semibold text-slate-900">Uploaded {badge.label}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {fileSizeLabel(localFileSize(value))} — stored locally in browser
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Replace"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-slate-400 hover:text-destructive"
            onClick={() => {
              deleteLocalFile(value);
              onChange("");
            }}
            title="Remove document"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            <Input
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="/pdfs/book.pdf, /slides/lecture.pptx, or https://…"
              className="text-xs"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-1.5 text-xs h-9"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              Upload
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-slate-400 hover:text-destructive"
                onClick={() => onChange("")}
                title="Clear input"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Supports <strong>PDF</strong>, PowerPoint (<strong>PPT/PPTX</strong>), Word (<strong>DOC/DOCX</strong>), and EPUB. Upload small files or paste URLs.
          </p>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.ppt,.pptx,.doc,.docx,.epub,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

/** Backward compatible alias for existing imports */
export const PdfUploadField = DocumentUploadField;
