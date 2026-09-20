import {
  Check,
  ClipboardCopy,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Share2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { exportToAnki, exportToQuizlet, downloadStudyPack, buildStudyPackText } from "./study-pack";
import type { AIResult, Flashcard } from "./types";

export function ExportModal({
  isOpen,
  onClose,
  result,
  flashcards,
}: {
  isOpen: boolean;
  onClose: () => void;
  result: AIResult;
  flashcards?: Flashcard[];
}) {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyNotes = () => {
    const text = buildStudyPackText(result);
    navigator.clipboard.writeText(text);
    setCopiedType("notes");
    toast.success("Study notes copied to clipboard!");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyFlashcards = () => {
    const cards = flashcards || [];
    const text = cards.map((c, i) => `${i + 1}. [FRONT] ${c.front}\n   [BACK] ${c.back}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopiedType("cards");
    toast.success("Flashcards copied to clipboard!");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
              <Share2 className="size-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-navy">Export Study Pack</h3>
              <p className="text-xs text-slate-500">Take your study set into any platform</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {/* Anki Export */}
          <button
            type="button"
            onClick={() => {
              exportToAnki(result, flashcards);
              toast.success("Anki deck file downloaded!");
            }}
            className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-navy/40 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <FileText className="size-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-brand-navy group-hover:text-blue-700">
                  Export to Anki (.txt)
                </p>
                <p className="text-xs text-slate-500">
                  Tab-separated deck importable into Anki desktop and mobile
                </p>
              </div>
            </div>
            <Download className="size-4 text-slate-400 group-hover:text-brand-navy" />
          </button>

          {/* Quizlet Export */}
          <button
            type="button"
            onClick={() => {
              exportToQuizlet(result, flashcards);
              toast.success("Quizlet CSV downloaded!");
            }}
            className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-navy/40 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-brand-navy group-hover:text-teal-700">
                  Export to Quizlet (.csv)
                </p>
                <p className="text-xs text-slate-500">
                  Directly paste or upload into Quizlet's create set page
                </p>
              </div>
            </div>
            <Download className="size-4 text-slate-400 group-hover:text-brand-navy" />
          </button>

          {/* Download Text Pack */}
          <button
            type="button"
            onClick={() => {
              downloadStudyPack(result);
              toast.success("Full study pack downloaded!");
            }}
            className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-navy/40 hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Download className="size-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-brand-navy group-hover:text-amber-700">
                  Download Full Study Pack (.txt)
                </p>
                <p className="text-xs text-slate-500">
                  All summary notes, key definitions, and exam questions
                </p>
              </div>
            </div>
            <Download className="size-4 text-slate-400 group-hover:text-brand-navy" />
          </button>

          {/* Quick Copy buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyNotes}
              className="rounded-xl border-slate-200 font-semibold text-slate-700"
            >
              {copiedType === "notes" ? (
                <Check className="mr-1.5 size-4 text-emerald-600" />
              ) : (
                <ClipboardCopy className="mr-1.5 size-4" />
              )}
              Copy All Notes
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyFlashcards}
              className="rounded-xl border-slate-200 font-semibold text-slate-700"
            >
              {copiedType === "cards" ? (
                <Check className="mr-1.5 size-4 text-emerald-600" />
              ) : (
                <ClipboardCopy className="mr-1.5 size-4" />
              )}
              Copy Flashcards
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={handlePrint}
            className="w-full rounded-xl text-slate-500 hover:text-brand-navy"
          >
            <Printer className="mr-1.5 size-4" />
            Print or Save as PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

