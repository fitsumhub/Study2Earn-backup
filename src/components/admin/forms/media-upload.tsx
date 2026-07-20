import { FileText, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteLocalFile,
  fileSizeLabel,
  isLocalFileUrl,
  localFileSize,
  processImageFile,
  processPdfFile,
  resolveMediaUrl,
  saveLocalFile,
} from "@/lib/media-store";
import { cn } from "@/lib/utils";

/**
 * Image picker that accepts either a pasted URL or an uploaded file. Uploads
 * are downscaled and persisted to the local media store; the field value
 * becomes a `local:<id>` pointer (or the raw URL when pasted).
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
  /** Longest edge after downscaling, in px. */
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
        {/* Preview / drop target */}
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

/**
 * PDF source picker: paste a hosted URL (recommended for big files) or upload
 * a small PDF that is persisted to browser storage via the local media store.
 */
export function PdfUploadField({
  label = "PDF file",
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isLocal = isLocalFileUrl(value);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await processPdfFile(file);
      const saved = saveLocalFile("pdf", dataUrl);
      if (!saved.ok) {
        toast.error(saved.error);
        return;
      }
      if (isLocalFileUrl(value)) deleteLocalFile(value);
      onChange(saved.pointer);
      toast.success(`"${file.name}" uploaded (${fileSizeLabel(file.size)})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read the PDF");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {isLocal ? (
        <div className="flex items-center gap-3 rounded-lg border bg-slate-50 px-3 py-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
            <FileText className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Uploaded PDF</p>
            <p className="text-[11px] text-muted-foreground">
              {fileSizeLabel(localFileSize(value))} — stored in this browser
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Replace"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-slate-400 hover:text-destructive"
            onClick={() => {
              deleteLocalFile(value);
              onChange("");
            }}
            title="Remove uploaded PDF"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/pdfs/sample-textbook.pdf or https://…"
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            Upload
          </Button>
        </div>
      )}
      {!isLocal && (
        <p className="text-[11px] text-muted-foreground">
          Small PDFs (≤2.5 MB) can be uploaded directly; host larger files and paste the URL.
        </p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
