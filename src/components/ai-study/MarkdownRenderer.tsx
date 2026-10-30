import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  Compass,
  Copy,
  FileText,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Pin,
  Scale,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  highlightKeyPoints?: boolean;
}

export function MarkdownRenderer({
  content,
  className,
  highlightKeyPoints = false,
}: MarkdownRendererProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  /**
   * Evaluates bold text tokens and applies rich colorful main-point badge styling
   * or high-contrast scholarly emphasis.
   */
  const renderBoldBadgeOrText = (rawBoldText: string, keyId: number) => {
    const trimmed = rawBoldText.trim();
    const lower = trimmed.toLowerCase();

    // 1. Core Takeaways, Invariants & High-Value Distinctions (Emerald / Mint)
    if (
      lower.includes("takeaway") ||
      lower.includes("golden rule") ||
      lower.includes("core principle") ||
      lower.includes("solution") ||
      lower.includes("best practice")
    ) {
      return (
        <span
          key={`bold-${keyId}`}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30 my-0.5 shadow-2xs"
        >
          <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{trimmed}</span>
        </span>
      );
    }

    // 2. Exam Tips, High-Yield Scoring, Objectives (Indigo / Violet)
    if (
      lower.includes("exam tip") ||
      lower.includes("high-yield") ||
      lower.includes("exit exam") ||
      lower.includes("marking criteria") ||
      lower.includes("objective") ||
      lower.includes("bloom level")
    ) {
      return (
        <span
          key={`bold-${keyId}`}
          className="inline-flex items-center gap-1 rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-500/30 my-0.5 shadow-2xs"
        >
          <GraduationCap className="size-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{trimmed}</span>
        </span>
      );
    }

    // 3. Traps, Pitfalls, Common Errors & Warnings (Rose / Crimson)
    if (
      lower.includes("trap") ||
      lower.includes("warning") ||
      lower.includes("pitfall") ||
      lower.includes("mistake") ||
      lower.includes("misconception") ||
      lower.includes("common confusion") ||
      lower.includes("avoid")
    ) {
      return (
        <span
          key={`bold-${keyId}`}
          className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-500/30 my-0.5 shadow-2xs"
        >
          <AlertTriangle className="size-3 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{trimmed}</span>
        </span>
      );
    }

    // 4. Formulas, Theorems, Shortcuts & Laws (Amber / Gold)
    if (
      lower.includes("formula") ||
      lower.includes("theorem") ||
      lower.includes("shortcut") ||
      lower.includes("equation") ||
      lower.includes("governing law") ||
      lower.includes("mnemonic")
    ) {
      return (
        <span
          key={`bold-${keyId}`}
          className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-500/30 my-0.5 shadow-2xs"
        >
          <Zap className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{trimmed}</span>
        </span>
      );
    }

    // 5. Definitions, Mechanisms & Key Concepts (Sky / Cyan Blue)
    if (
      lower.includes("definition:") ||
      lower.includes("governing mechanism:") ||
      lower.includes("key distinction:") ||
      lower.includes("working principle:") ||
      lower.includes("assumptions:") ||
      lower.includes("trade-offs")
    ) {
      return (
        <span
          key={`bold-${keyId}`}
          className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-500/30 my-0.5 shadow-2xs"
        >
          <Pin className="size-3 text-sky-600 dark:text-sky-400 shrink-0" />
          <span>{trimmed}</span>
        </span>
      );
    }

    // 6. Sequential Problem Solving Steps (Teal)
    if (/^step\s+\d+/i.test(lower) || /^protocol\s*#/i.test(lower)) {
      return (
        <span
          key={`bold-${keyId}`}
          className="inline-flex items-center gap-1 rounded-md bg-teal-500/15 px-2 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-500/30 my-0.5 shadow-2xs"
        >
          <Compass className="size-3 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>{trimmed}</span>
        </span>
      );
    }

    // Default Bold with Highlight Mode or High-Contrast Emphasis
    if (highlightKeyPoints) {
      return (
        <mark
          key={`bold-${keyId}`}
          className="rounded px-1.5 py-0.5 font-bold tracking-tight bg-amber-200/90 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border-b-2 border-amber-400 dark:border-amber-500/60 shadow-2xs inline-block"
        >
          {trimmed}
        </mark>
      );
    }

    return (
      <strong
        key={`bold-${keyId}`}
        className="font-extrabold text-slate-950 dark:text-white tracking-tight drop-shadow-2xs"
      >
        {trimmed}
      </strong>
    );
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
            className="inline-flex items-center rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-400/30"
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
            className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60"
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
        parts.push(renderBoldBadgeOrText(boldMatch[1], key++));
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic *...*
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(
          <em
            key={`italic-${key++}`}
            className="italic text-slate-700 dark:text-slate-300 font-serif"
          >
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

  // Helper to render decorative thematic H2 banners
  const renderThematicH2 = (titleText: string, keyId: number) => {
    const lower = titleText.toLowerCase();

    let icon = <BookOpen className="size-5 text-indigo-600 dark:text-indigo-400" />;
    let borderAccent = "border-l-indigo-600 dark:border-l-indigo-400";
    let bgTint = "bg-indigo-50/50 dark:bg-indigo-950/20";
    let badgeText = "Foundational Knowledge";

    if (lower.includes("overview") || lower.includes("syllabus")) {
      icon = <FileText className="size-5 text-blue-600 dark:text-blue-400" />;
      borderAccent = "border-l-blue-600 dark:border-l-blue-400";
      bgTint = "bg-blue-50/50 dark:bg-blue-950/20";
      badgeText = "Executive Summary";
    } else if (lower.includes("objective")) {
      icon = <GraduationCap className="size-5 text-purple-600 dark:text-purple-400" />;
      borderAccent = "border-l-purple-600 dark:border-l-purple-400";
      bgTint = "bg-purple-50/50 dark:bg-purple-950/20";
      badgeText = "Targeted Outcomes";
    } else if (lower.includes("comparative") || lower.includes("matrix") || lower.includes("table")) {
      icon = <Scale className="size-5 text-sky-600 dark:text-sky-400" />;
      borderAccent = "border-l-sky-600 dark:border-l-sky-400";
      bgTint = "bg-sky-50/50 dark:bg-sky-950/20";
      badgeText = "Comparative Matrix";
    } else if (lower.includes("formula") || lower.includes("law") || lower.includes("theorem")) {
      icon = <Zap className="size-5 text-amber-600 dark:text-amber-400" />;
      borderAccent = "border-l-amber-600 dark:border-l-amber-400";
      bgTint = "bg-amber-50/50 dark:bg-amber-950/20";
      badgeText = "Governing Formulas";
    } else if (lower.includes("trap") || lower.includes("confusion") || lower.includes("pitfall")) {
      icon = <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400" />;
      borderAccent = "border-l-rose-600 dark:border-l-rose-400";
      bgTint = "bg-rose-50/50 dark:bg-rose-950/20";
      badgeText = "Examiner Traps";
    } else if (lower.includes("protocol") || lower.includes("problem-solving") || lower.includes("step-by-step")) {
      icon = <Compass className="size-5 text-teal-600 dark:text-teal-400" />;
      borderAccent = "border-l-teal-600 dark:border-l-teal-400";
      bgTint = "bg-teal-50/50 dark:bg-teal-950/20";
      badgeText = "Problem Solving Protocol";
    } else if (lower.includes("terminology") || lower.includes("definition") || lower.includes("glossary")) {
      icon = <Pin className="size-5 text-cyan-600 dark:text-cyan-400" />;
      borderAccent = "border-l-cyan-600 dark:border-l-cyan-400";
      bgTint = "bg-cyan-50/50 dark:bg-cyan-950/20";
      badgeText = "Academic Lexicon";
    } else if (lower.includes("rule") || lower.includes("strategy") || lower.includes("takeaway")) {
      icon = <Award className="size-5 text-yellow-600 dark:text-yellow-400" />;
      borderAccent = "border-l-yellow-600 dark:border-l-yellow-400";
      bgTint = "bg-yellow-50/50 dark:bg-yellow-950/20";
      badgeText = "High-Yield Exit Exam";
    }

    return (
      <div
        key={`h2-banner-${keyId}`}
        className={cn(
          "mt-8 mb-4 rounded-2xl border-l-4 p-4 sm:p-5 transition-colors border border-slate-200/60 dark:border-slate-800/80 shadow-xs",
          borderAccent,
          bgTint,
        )}
      >
        <div className="flex items-center gap-2 mb-1.5">
          {icon}
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {badgeText}
          </span>
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {renderFormattedText(titleText)}
        </h2>
      </div>
    );
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
          className="my-4 overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1117] text-slate-200 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono uppercase font-bold text-[11px] text-amber-400">
              <Terminal className="size-3.5" />
              {lang}
            </span>
            <button
              type="button"
              onClick={() => handleCopyCode(fullCode, currentIdx)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              {copiedIndex === currentIdx ? (
                <>
                  <Check className="size-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-100">
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
          className="my-4 overflow-x-auto rounded-2xl border-2 border-amber-300/60 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 p-5 text-center shadow-xs dark:border-amber-500/30 dark:bg-amber-950/20"
        >
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
            <Zap className="size-3.5" />
            <span>Mathematical Axiom / Derivation</span>
          </div>
          <div className="font-mono text-base sm:text-lg font-bold tracking-wide text-amber-950 dark:text-amber-200">
            {mathContent}
          </div>
        </div>,
      );
      i++;
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      blocks.push(
        <div key={`h1-${blockKey++}`} className="mt-8 mb-6 border-b-2 border-slate-200 dark:border-slate-800 pb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60 mb-2">
            <GraduationCap className="size-3.5" />
            <span>Oxford / Harvard Scholarly Monograph</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {renderFormattedText(line.slice(2))}
          </h1>
        </div>,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(renderThematicH2(line.slice(3), blockKey++));
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(
        <h3
          key={`h3-${blockKey++}`}
          className="mt-6 mb-2 font-serif text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2"
        >
          <span className="size-2 rounded-full bg-indigo-500 shrink-0" />
          <span>{renderFormattedText(line.slice(4))}</span>
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      blocks.push(
        <h4
          key={`h4-${blockKey++}`}
          className="mt-4 mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
        >
          {renderFormattedText(line.slice(5))}
        </h4>,
      );
      i++;
      continue;
    }

    // Blockquote & Vibrant Callouts
    if (line.startsWith("> ")) {
      const bText = line.slice(2);
      const lower = bText.toLowerCase();

      const isTip = lower.includes("exam tip") || lower.includes("high-yield") || bText.includes("🎯");
      const isWarn = lower.includes("trap") || lower.includes("warning") || lower.includes("pitfall") || bText.includes("⚠️");
      const isTakeaway = lower.includes("takeaway") || lower.includes("core takeaway") || bText.includes("💡");
      const isFormula = lower.includes("calculation") || lower.includes("shortcut") || bText.includes("⚡");

      let cardStyle = "border-l-4 border-indigo-500 bg-indigo-50/70 text-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-200 border border-indigo-200/60 dark:border-indigo-900/40";
      let headerIcon = <Lightbulb className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      let headerLabel = "Key Note";

      if (isTakeaway) {
        cardStyle = "border-l-4 border-emerald-500 bg-emerald-50/80 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-900/40";
        headerIcon = <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
        headerLabel = "Core Theoretical Takeaway";
      } else if (isTip) {
        cardStyle = "border-l-4 border-indigo-600 bg-indigo-50/80 text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-900/50";
        headerIcon = <GraduationCap className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
        headerLabel = "High-Yield University Exam Tip";
      } else if (isWarn) {
        cardStyle = "border-l-4 border-rose-500 bg-rose-50/80 text-rose-950 dark:bg-rose-950/30 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900/40";
        headerIcon = <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />;
        headerLabel = "Crucial Examiner Trap to Avoid";
      } else if (isFormula) {
        cardStyle = "border-l-4 border-amber-500 bg-amber-50/80 text-amber-950 dark:bg-amber-950/30 dark:text-amber-200 border border-amber-200/80 dark:border-amber-900/40";
        headerIcon = <Zap className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />;
        headerLabel = "Calculation Shortcut & Method";
      }

      blocks.push(
        <div
          key={`quote-${blockKey++}`}
          className={cn(
            "my-4 rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed shadow-xs transition",
            cardStyle,
          )}
        >
          <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wider">
            {headerIcon}
            <span>{headerLabel}</span>
          </div>
          <div>{renderFormattedText(bText)}</div>
        </div>,
      );
      i++;
      continue;
    }

    // Horizontal Rule
    if (line.trim() === "---" || line.trim() === "***") {
      blocks.push(
        <hr
          key={`hr-${blockKey++}`}
          className="my-8 border-slate-200/90 dark:border-slate-800"
        />,
      );
      i++;
      continue;
    }

    // Markdown Table with Executive Collegiate Styling
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
            className="my-5 overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white font-bold tracking-wide border-b-2 border-amber-400/40">
                    {headerCols.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-slate-100"
                      >
                        {renderFormattedText(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {bodyRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="odd:bg-white even:bg-slate-50/70 hover:bg-indigo-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-800/40 dark:hover:bg-slate-800 transition"
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-3 px-4 text-slate-800 dark:text-slate-200 leading-relaxed font-medium"
                        >
                          {renderFormattedText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>,
        );
        continue;
      }
    }

    // List item (Unordered: * or -) with Main Point Illuminated Dot
    if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
      const itemContent = line.trim().slice(2);
      const isBoldStart = itemContent.startsWith("**");

      blocks.push(
        <div
          key={`li-${blockKey++}`}
          className="flex items-start gap-2.5 my-2 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed"
        >
          <span
            className={cn(
              "mt-2 size-2 shrink-0 rounded-full",
              isBoldStart
                ? "bg-indigo-600 ring-2 ring-indigo-300 dark:bg-indigo-400 dark:ring-indigo-900"
                : "bg-slate-400 dark:bg-slate-600",
            )}
          />
          <div className="flex-1">
            {renderFormattedText(itemContent)}
          </div>
        </div>,
      );
      i++;
      continue;
    }

    // List item (Ordered: 1. 2. etc.) with Circular Number Badge
    const orderedMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      blocks.push(
        <div
          key={`oli-${blockKey++}`}
          className="flex items-start gap-3 my-2 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed"
        >
          <span className="size-5 rounded-full bg-indigo-100 dark:bg-indigo-950 font-bold text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
            {orderedMatch[1]}
          </span>
          <div className="flex-1">
            {renderFormattedText(orderedMatch[2])}
          </div>
        </div>,
      );
      i++;
      continue;
    }

    // Empty line
    if (!line.trim()) {
      blocks.push(<div key={`spacer-${blockKey++}`} className="h-3" />);
      i++;
      continue;
    }

    // Standard paragraph with enhanced typography
    blocks.push(
      <p
        key={`p-${blockKey++}`}
        className="my-2.5 text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 font-sans"
      >
        {renderFormattedText(line)}
      </p>,
    );
    i++;
  }

  return (
    <div
      className={cn(
        "space-y-1.5 text-slate-800 dark:text-slate-200 leading-relaxed font-sans selection:bg-amber-300 selection:text-amber-950",
        className,
      )}
    >
      {blocks}
    </div>
  );
}
