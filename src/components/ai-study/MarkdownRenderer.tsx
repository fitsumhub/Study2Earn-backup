import { Check, Copy, Terminal } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse lines into tokens
  const renderFormattedText = (text: string) => {
    // Process inline bold, italic, code, math
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Inline math $...$
      const mathMatch = remaining.match(/^\$([^$]+)\$/);
      if (mathMatch) {
        parts.push(
          <span
            key={`math-${key++}`}
            className="inline-block rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-amber-700 dark:text-amber-300"
          >
            {mathMatch[1]}
          </span>,
        );
        remaining = remaining.slice(mathMatch[0].length);
        continue;
      }

      // Inline code `...`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={`code-${key++}`}
            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-rose-600 dark:bg-slate-800 dark:text-rose-400"
          >
            {codeMatch[1]}
          </code>,
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold **...**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={`bold-${key++}`} className="font-bold text-slate-900 dark:text-white">
            {boldMatch[1]}
          </strong>,
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic *...*
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(
          <em key={`italic-${key++}`} className="italic text-slate-700 dark:text-slate-300">
            {italicMatch[1]}
          </em>,
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Plain character
      const nextSpecial = remaining.search(/[\$`\*]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  // Split content into blocks
  const blocks: React.ReactNode[] = [];
  const lines = content.split("\n");
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks ```
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim() || "code";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const fullCode = codeLines.join("\n");
      const currentIdx = blockKey++;

      blocks.push(
        <div
          key={`code-block-${currentIdx}`}
          className="my-3 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1117] text-slate-200 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono uppercase font-semibold text-[11px] text-brand-gold">
              <Terminal className="size-3.5" />
              {lang}
            </span>
            <button
              type="button"
              onClick={() => handleCopyCode(fullCode, currentIdx)}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              {copiedIndex === currentIdx ? (
                <>
                  <Check className="size-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-100">
            <code>{fullCode}</code>
          </pre>
        </div>,
      );
      continue;
    }

    // Math block $$
    if (line.trim().startsWith("$$") && line.trim().endsWith("$$") && line.trim().length > 4) {
      const mathContent = line.trim().slice(2, -2).trim();
      blocks.push(
        <div
          key={`math-block-${blockKey++}`}
          className="my-3 overflow-x-auto rounded-xl border border-amber-200/40 bg-amber-500/5 p-3 text-center font-mono text-sm font-semibold text-amber-800 dark:border-amber-500/20 dark:text-amber-300"
        >
          {mathContent}
        </div>,
      );
      i++;
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      blocks.push(
        <h3
          key={`h3-${blockKey++}`}
          className="mt-4 mb-2 font-serif text-lg font-bold text-brand-navy dark:text-white"
        >
          {renderFormattedText(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h2
          key={`h2-${blockKey++}`}
          className="mt-5 mb-2 font-serif text-xl font-bold text-brand-navy dark:text-white border-b border-slate-100 pb-1 dark:border-slate-800"
        >
          {renderFormattedText(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(
        <h1
          key={`h1-${blockKey++}`}
          className="mt-6 mb-3 font-serif text-2xl font-bold text-brand-navy dark:text-white"
        >
          {renderFormattedText(line.slice(2))}
        </h1>,
      );
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      blocks.push(
        <h4
          key={`h4-${blockKey++}`}
          className="mt-3 mb-1 text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
        >
          {renderFormattedText(line.slice(5))}
        </h4>,
      );
      i++;
      continue;
    }

    // Blockquote & Callouts
    if (line.startsWith("> ")) {
      const bText = line.slice(2);
      const isTip = bText.toLowerCase().includes("tip") || bText.includes("💡");
      const isWarn = bText.toLowerCase().includes("trap") || bText.toLowerCase().includes("warning") || bText.includes("⚠️");

      blocks.push(
        <blockquote
          key={`quote-${blockKey++}`}
          className={cn(
            "my-2.5 rounded-xl border-l-4 p-3 text-sm leading-relaxed",
            isTip
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
              : isWarn
              ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200"
              : "border-brand-navy bg-slate-50 text-slate-700 dark:border-brand-gold dark:bg-slate-800/60 dark:text-slate-200",
          )}
        >
          {renderFormattedText(bText)}
        </blockquote>,
      );
      i++;
      continue;
    }

    // Horizontal Rule
    if (line.trim() === "---" || line.trim() === "***") {
      blocks.push(
        <hr key={`hr-${blockKey++}`} className="my-4 border-slate-200 dark:border-slate-800" />,
      );
      i++;
      continue;
    }

    // Markdown Table
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const headerCols = tableLines[0]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        const bodyRows = tableLines.slice(2).map((r) =>
          r
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim()),
        );

        blocks.push(
          <div
            key={`table-${blockKey++}`}
            className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold">
                <tr>
                  {headerCols.map((h, hIdx) => (
                    <th key={hIdx} className="p-2.5 border-b border-slate-200 dark:border-slate-700">
                      {renderFormattedText(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2.5 text-slate-700 dark:text-slate-300">
                        {renderFormattedText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }
    }

    // List item (Unordered: * or -)
    if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
      blocks.push(
        <div key={`li-${blockKey++}`} className="flex items-start gap-2 my-1 text-sm text-slate-700 dark:text-slate-300">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-gold" />
          <div className="flex-1 leading-relaxed">
            {renderFormattedText(line.trim().slice(2))}
          </div>
        </div>,
      );
      i++;
      continue;
    }

    // List item (Ordered: 1. 2. etc.)
    const orderedMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      blocks.push(
        <div key={`oli-${blockKey++}`} className="flex items-start gap-2 my-1 text-sm text-slate-700 dark:text-slate-300">
          <span className="font-mono text-xs font-bold text-brand-navy dark:text-brand-gold shrink-0 mt-0.5">
            {orderedMatch[1]}.
          </span>
          <div className="flex-1 leading-relaxed">
            {renderFormattedText(orderedMatch[2])}
          </div>
        </div>,
      );
      i++;
      continue;
    }

    // Empty line
    if (!line.trim()) {
      blocks.push(<div key={`spacer-${blockKey++}`} className="h-2" />);
      i++;
      continue;
    }

    // Standard paragraph
    blocks.push(
      <p
        key={`p-${blockKey++}`}
        className="my-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
      >
        {renderFormattedText(line)}
      </p>,
    );
    i++;
  }

  return <div className={cn("space-y-1 text-sm", className)}>{blocks}</div>;
}

