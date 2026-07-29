import { subjectLabel } from "./subject";
import type { AIResult } from "./types";

/** Flattens a generated study pack into a plain-text file the student can download and keep offline. */
export function buildStudyPackText(result: AIResult): string {
  const lines: string[] = [];
  const title = `${subjectLabel(result.subject)} — Study Pack`;
  lines.push(title, "=".repeat(title.length), "");
  lines.push(`Source file: ${result.filename}`, `Generated: ${new Date().toLocaleString()}`, "");

  lines.push("KEY CONCEPTS", "------------");
  result.notes.keyConcepts.forEach((c, i) => lines.push(`${i + 1}. ${c}`));
  lines.push("");

  lines.push("KEY DEFINITIONS", "---------------");
  result.notes.definitions.forEach((d) => lines.push(`${d.term}: ${d.definition}`));
  lines.push("");

  lines.push("CHAPTER SUMMARY", "---------------", result.notes.summary, "");

  lines.push("EXAM TIPS", "---------");
  result.notes.studyTips.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
  lines.push("");

  lines.push("PRACTICE QUESTIONS", "------------------");
  result.questions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.question}`);
    q.options.forEach((opt, j) => lines.push(`   ${["A", "B", "C", "D"][j]}. ${opt}`));
    lines.push(`   Answer: ${["A", "B", "C", "D"][q.correctIndex]}`);
    lines.push(`   Explanation: ${q.explanation}`, "");
  });

  return lines.join("\n");
}

export function downloadStudyPack(result: AIResult) {
  const text = buildStudyPackText(result);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${subjectLabel(result.subject).replace(/\s+/g, "-").toLowerCase()}-study-pack.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
