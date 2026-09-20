import { subjectLabel } from "./subject";
import type {
  AIResult,
  Flashcard,
  PodcastEpisode,
  PodcastDialogueItem,
  WrittenQuestion,
} from "./types";

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
  downloadBlob(text, `${slugify(subjectLabel(result.subject))}-study-pack.txt`, "text/plain;charset=utf-8");
}

/** Generates rich flashcards with front/back pairs from definitions, questions, and key concepts. */
export function generateFlashcardsFromResult(result: AIResult): Flashcard[] {
  const cards: Flashcard[] = [];
  let idCounter = 1;

  // 1. From definitions
  result.notes.definitions.forEach((d) => {
    cards.push({
      id: `fc-def-${idCounter++}`,
      front: d.term,
      back: d.definition,
      topic: "Definition & Terminology",
      mastery: "unfamiliar",
    });
  });

  // 2. From key concepts (turn into concept recall cards)
  result.notes.keyConcepts.forEach((concept) => {
    const colonIdx = concept.indexOf(":");
    let front = "Core Concept";
    let back = concept;
    if (colonIdx > 0 && colonIdx < 50) {
      front = concept.substring(0, colonIdx).trim();
      back = concept.substring(colonIdx + 1).trim();
    } else {
      const words = concept.split(" ");
      if (words.length > 5) {
        front = `What are the principles behind: ${words.slice(0, 4).join(" ")}...?`;
      }
    }
    cards.push({
      id: `fc-conc-${idCounter++}`,
      front,
      back,
      topic: "Key Concept",
      mastery: "unfamiliar",
    });
  });

  // 3. From MCQs (turn question into prompt and correct answer + rationale into back)
  result.questions.forEach((q) => {
    const correctAns = q.options[q.correctIndex];
    cards.push({
      id: `fc-q-${idCounter++}`,
      front: q.question,
      back: `${correctAns}\n\nKey Takeaway: ${q.explanation}`,
      topic: "Practice Recall",
      mastery: "unfamiliar",
    });
  });

  return cards;
}

/** Generates fill-in-the-blank / written active recall questions from definitions and concepts. */
export function generateWrittenQuestionsFromResult(result: AIResult): WrittenQuestion[] {
  const questions: WrittenQuestion[] = [];
  let idCounter = 1;

  // From definitions: give the definition, student writes the term
  result.notes.definitions.forEach((d) => {
    const hint = d.term.length > 3 ? `Starts with "${d.term.charAt(0)}" (${d.term.length} letters)` : undefined;
    const keywords = d.term.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    questions.push({
      id: `wq-${idCounter++}`,
      prompt: `Identify the term: "${d.definition}"`,
      answer: d.term,
      hint,
      acceptableKeywords: [d.term.toLowerCase(), ...keywords],
    });
  });

  // From MCQs
  result.questions.forEach((q) => {
    const correct = q.options[q.correctIndex];
    questions.push({
      id: `wq-${idCounter++}`,
      prompt: q.question,
      answer: correct,
      hint: `Hint: Focus on ${q.explanation.slice(0, 40)}...`,
      acceptableKeywords: [correct.toLowerCase()],
    });
  });

  return questions;
}

/** Generates a conversational 2-host AI Podcast breakdown between Alex and Jordan. */
export function generatePodcastFromResult(result: AIResult): PodcastEpisode {
  const subject = subjectLabel(result.subject);
  const dialogue: PodcastDialogueItem[] = [];
  let id = 1;

  // Intro
  dialogue.push({
    id: `pod-${id++}`,
    speaker: "Alex",
    role: "Lead Instructor",
    text: `Welcome to the Study2Earn Deep Dive! Today we're breaking down your ${subject} study pack on "${result.filename.replace(/\.[^/.]+$/, "")}". I'm Alex, and with me is Jordan.`,
  });

  dialogue.push({
    id: `pod-${id++}`,
    speaker: "Jordan",
    role: "Study Co-Host",
    text: `Hey everyone! Super excited to unpack this. If you have an exam coming up on ${subject}, this conversation is designed to solidify the biggest takeaways in your memory.`,
  });

  // Summary
  if (result.notes.summary) {
    dialogue.push({
      id: `pod-${id++}`,
      speaker: "Alex",
      role: "Lead Instructor",
      text: `Let's start with the big picture. ${result.notes.summary}`,
    });

    dialogue.push({
      id: `pod-${id++}`,
      speaker: "Jordan",
      role: "Study Co-Host",
      text: `That ties right into the fundamental concepts students often find tricky on exam day. Alex, what's the first key concept we should spotlight?`,
    });
  }

  // Key concepts
  const topConcepts = result.notes.keyConcepts.slice(0, 3);
  topConcepts.forEach((c, idx) => {
    if (idx % 2 === 0) {
      dialogue.push({
        id: `pod-${id++}`,
        speaker: "Alex",
        role: "Lead Instructor",
        text: `Here is concept number ${idx + 1}: ${c}. Make sure you remember the underlying mechanism here.`,
      });
      dialogue.push({
        id: `pod-${id++}`,
        speaker: "Jordan",
        role: "Study Co-Host",
        text: `Exactly. When you see this on a test, pay close attention to the wording and don't rush into picking familiar-looking trap answers.`,
      });
    } else {
      dialogue.push({
        id: `pod-${id++}`,
        speaker: "Jordan",
        role: "Study Co-Host",
        text: `Another vital point here: ${c}. Notice how this connects directly with the earlier definitions.`,
      });
      dialogue.push({
        id: `pod-${id++}`,
        speaker: "Alex",
        role: "Lead Instructor",
        text: `Spot on! Connecting concepts to definitions is the secret to scoring in the top percentile.`,
      });
    }
  });

  // Top Definition
  if (result.notes.definitions.length > 0) {
    const firstDef = result.notes.definitions[0];
    dialogue.push({
      id: `pod-${id++}`,
      speaker: "Alex",
      role: "Lead Instructor",
      text: `Before we wrap up, let's test a crucial definition: "${firstDef.term}". It's defined as: ${firstDef.definition}.`,
    });
  }

  // Exam tips
  if (result.notes.studyTips.length > 0) {
    dialogue.push({
      id: `pod-${id++}`,
      speaker: "Jordan",
      role: "Study Co-Host",
      text: `And my top study tip for this module: ${result.notes.studyTips[0]}`,
    });
  }

  // Outro
  dialogue.push({
    id: `pod-${id++}`,
    speaker: "Alex",
    role: "Lead Instructor",
    text: `Practice with the flashcards and practice quiz in this study pack to master active recall. You've got this! See you in the next review session.`,
  });

  return {
    title: `${subject}: ${result.filename.replace(/\.[^/.]+$/, "")} Audio Overview`,
    hosts: ["Alex", "Jordan"],
    durationEstimate: `${Math.max(2, Math.round(dialogue.length * 0.4))} mins`,
    dialogue,
  };
}

/** Exports flashcards as an Anki Deck tab-separated text file. */
export function exportToAnki(result: AIResult, flashcards?: Flashcard[]) {
  const cards = flashcards && flashcards.length > 0 ? flashcards : generateFlashcardsFromResult(result);
  const lines: string[] = ["#separator:tab", "#html:true", "#tags column:3"];
  cards.forEach((c) => {
    const front = c.front.replace(/\t/g, " ").replace(/\n/g, "<br>");
    const back = c.back.replace(/\t/g, " ").replace(/\n/g, "<br>");
    const tags = `${subjectLabel(result.subject).replace(/\s+/g, "_")} Study2Earn`;
    lines.push(`${front}\t${back}\t${tags}`);
  });
  downloadBlob(lines.join("\n"), `${slugify(subjectLabel(result.subject))}-anki-deck.txt`, "text/plain;charset=utf-8");
}

/** Exports flashcards as a Quizlet-ready CSV file. */
export function exportToQuizlet(result: AIResult, flashcards?: Flashcard[]) {
  const cards = flashcards && flashcards.length > 0 ? flashcards : generateFlashcardsFromResult(result);
  const lines: string[] = [];
  cards.forEach((c) => {
    const front = `"${c.front.replace(/"/g, '""').replace(/\n/g, " ")}"`;
    const back = `"${c.back.replace(/"/g, '""').replace(/\n/g, " ")}"`;
    lines.push(`${front},${back}`);
  });
  downloadBlob(lines.join("\n"), `${slugify(subjectLabel(result.subject))}-quizlet.csv`, "text/csv;charset=utf-8");
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
