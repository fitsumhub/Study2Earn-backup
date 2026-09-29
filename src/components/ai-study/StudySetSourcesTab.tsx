import {
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  HardDrive,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
  Youtube,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addSourceToStudySet,
  type StudySet,
  type StudySetSource,
} from "@/lib/study-set-store";
import { cn } from "@/lib/utils";
import { extractTextFromFile } from "./text-extraction";

interface StudySetSourcesTabProps {
  studySet: StudySet;
}

export function StudySetSourcesTab({ studySet }: StudySetSourcesTabProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<"file" | "paste">("file");
  const [pastedTitle, setPastedTitle] = useState("");
  const [pastedContent, setPastedContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sources = studySet.sources;
  const activeSource = sources.find((s) => s.id === selectedSourceId) || sources[0];

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await extractTextFromFile(file);
        let type: StudySetSource["type"] = "pdf";
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "pptx" || ext === "ppt") type = "pptx";
        else if (ext === "docx" || ext === "doc") type = "docx";
        else if (ext === "txt") type = "txt";

        addSourceToStudySet(studySet.id, {
          title: file.name,
          type,
          filename: file.name,
          sizeBytes: file.size,
          contentSnippet: (text || file.name).slice(0, 250),
          fullText: text || undefined,
        });
      } catch (err) {
        console.error("Failed to add source:", err);
      }
    }
    setIsUploading(false);
    setIsAddModalOpen(false);
  };

  const handleAddPasted = () => {
    if (!pastedContent.trim()) return;
    addSourceToStudySet(studySet.id, {
      title: pastedTitle.trim() || `Supplement Notes (${new Date().toLocaleDateString()})`,
      type: "notes",
      contentSnippet: pastedContent.slice(0, 250),
      fullText: pastedContent.trim(),
    });
    setPastedTitle("");
    setPastedContent("");
    setIsAddModalOpen(false);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-200">
      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="size-4 text-blue-500" />
            Ingested Sources ({sources.length})
          </h2>
          <p className="text-xs text-slate-500">
            All AI study modes are strictly grounded in these learning materials.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs"
        >
          <Plus className="size-3.5 mr-1" />
          Add Another Source
        </Button>
      </div>

      {/* ── Sources List & Preview Split ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Source Cards List */}
        <div className="md:col-span-5 space-y-2.5">
          {sources.map((src) => {
            const isSelected = (activeSource?.id === src.id);
            return (
              <div
                key={src.id}
                onClick={() => setSelectedSourceId(src.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition cursor-pointer",
                  isSelected
                    ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/80 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-blue-500 shrink-0" />
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {src.title}
                    </h4>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase">
                    {src.type}
                  </span>
                </div>

                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {src.contentSnippet || "Full document text ingested into study model."}
                </p>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{formatBytes(src.sizeBytes)}</span>
                  <span>{new Date(src.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Source Content Inspector */}
        <div className="md:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          {activeSource ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                    {activeSource.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span className="uppercase font-bold text-blue-600 dark:text-blue-400">
                      {activeSource.type}
                    </span>
                    <span>•</span>
                    <span>{formatBytes(activeSource.sizeBytes)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Extracted Content Preview:
                </h4>
                <div className="max-h-96 overflow-y-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
                  {activeSource.fullText || activeSource.contentSnippet || "Text extracted successfully."}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select a source on the left to inspect its contents.
            </div>
          )}
        </div>
      </div>

      {/* ── Add Source Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                Add Source Material
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setAddMode("file")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition",
                  addMode === "file" ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white" : "text-slate-500",
                )}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setAddMode("paste")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition",
                  addMode === "paste" ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white" : "text-slate-500",
                )}
              >
                Paste Text
              </button>
            </div>

            {addMode === "file" ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center cursor-pointer hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Upload className="size-8 text-blue-500 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isUploading ? "Extracting text..." : "Click to browse file"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">PDF, PPTX, DOCX, TXT</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Document Title"
                  value={pastedTitle}
                  onChange={(e) => setPastedTitle(e.target.value)}
                  className="text-xs"
                />
                <Textarea
                  placeholder="Paste text notes here..."
                  rows={5}
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  className="text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddPasted}
                  disabled={!pastedContent.trim()}
                  className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs"
                >
                  Add to Study Set
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

