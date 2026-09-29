import {
  Bookmark,
  Check,
  Copy,
  Download,
  Eye,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getSavedResponses,
  removeSavedResponse,
  subscribeToAiChatStore,
  type SavedAiResponse,
} from "@/lib/ai-chat-store";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface SavedResponsesProps {
  className?: string;
}

export function SavedResponses({ className }: SavedResponsesProps) {
  const [savedList, setSavedList] = useState<SavedAiResponse[]>(() => getSavedResponses());
  const [search, setSearch] = useState("");
  const [viewingItem, setViewingItem] = useState<SavedAiResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToAiChatStore(() => {
      setSavedList(getSavedResponses());
    });
  }, []);

  const filtered = savedList.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.course.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCopy = (item: SavedAiResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (item: SavedAiResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const blob = new Blob([item.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as Markdown");
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    removeSavedResponse(id);
    setSavedList(getSavedResponses());
    if (viewingItem?.id === id) {
      setViewingItem(null);
    }
    toast.success("Removed from saved library");
  };

  if (savedList.length === 0) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-800",
          className,
        )}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-brand-gold">
          <Bookmark className="size-6" />
        </div>
        <h3 className="mt-3 font-serif text-base font-bold text-slate-700 dark:text-slate-300">
          No saved AI responses yet
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          When chatting with Studley AI or running Study Tools, click the "Save" bookmark icon to keep
          important notes and formulas here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white">
            Saved AI Responses & Notes ({savedList.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bookmarked study breakdowns, exam advice, and formulas for offline revision
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved notes..."
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand-navy dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setViewingItem(item)}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-brand-gold/60 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {item.course}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  className="rounded p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete note"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <h4 className="font-serif text-sm font-bold text-brand-navy dark:text-white line-clamp-2">
                {item.title}
              </h4>

              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3">
                {item.content.replace(/[#*`>]/g, "").slice(0, 140)}...
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400">
                {new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleCopy(item, e)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  title="Copy content"
                >
                  {copiedId === item.id ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDownload(item, e)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  title="Export Markdown"
                >
                  <Download className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal to read full note */}
      <Dialog open={Boolean(viewingItem)} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
          {viewingItem && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <div>
                    <span className="rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 dark:text-brand-gold">
                      {viewingItem.course}
                    </span>
                    <DialogTitle className="mt-2 font-serif text-xl font-bold text-brand-navy dark:text-white">
                      {viewingItem.title}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-4 max-h-[55vh] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <MarkdownRenderer content={viewingItem.content} />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(viewingItem.id)}
                  className="rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="mr-1.5 size-3.5" />
                  Delete Note
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(viewingItem)}
                    className="rounded-xl"
                  >
                    <Copy className="mr-1.5 size-3.5" />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleDownload(viewingItem)}
                    className="rounded-xl bg-brand-navy text-white hover:bg-brand-navy/90"
                  >
                    <Download className="mr-1.5 size-3.5" />
                    Download
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

