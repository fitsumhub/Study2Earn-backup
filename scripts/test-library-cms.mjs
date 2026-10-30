import assert from "node:assert/strict";

// Setup browser/localStorage polyfill for store tests
const storage = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};
globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};
globalThis.dispatchEvent = () => true;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};

import { readLibraryCatalog, writeLibraryCatalog } from "../src/lib/library-store.ts";
import { getDocumentFormat, processDocumentFile, saveLocalFile } from "../src/lib/media-store.ts";

console.log("=== Testing Library CMS Studio & File Format Engine ===");

// 1. Test Format Detector
assert.equal(getDocumentFormat("General_Physics.pdf"), "pdf", "Detects PDF");
assert.equal(getDocumentFormat("Kinematics_Lecture.pptx"), "ppt", "Detects PPTX");
assert.equal(getDocumentFormat("Computer_Networks.ppt"), "ppt", "Detects PPT");
assert.equal(getDocumentFormat("Calculus_Summary.docx"), "doc", "Detects DOCX");
assert.equal(getDocumentFormat("Logic_Notes.doc"), "doc", "Detects DOC");
assert.equal(getDocumentFormat("Organic_Chemistry.epub"), "epub", "Detects EPUB");
console.log("✓ Document format classification verified for PDF, PPT, DOC, EPUB");

// 2. Test Catalog Ingestion for PPT Material
const initialCatalog = readLibraryCatalog();
const pptBook = {
  id: "bk-test-ppt-101",
  name: "Computer Architecture Lecture Slides",
  short: "CompArch",
  chapters: 10,
  students: "1.2k",
  category: "Computer Science",
  description: "Official slide deck covering pipelining, cache hierarchies, and RISC-V instructions.",
  pages: 45,
  pdfUrl: "local:ppt-test-arch",
  coverUrl: "",
  published: true,
  progress: 0,
  xpEarned: 0,
  rating: 4.8,
  chapterList: Array.from({ length: 10 }, (_, i) => ({
    title: `Slide Deck ${i + 1}`,
    pages: 5,
    done: false,
  })),
};

const docBook = {
  id: "bk-test-doc-202",
  name: "Introduction to Law & Civics Monograph",
  short: "Law",
  chapters: 6,
  students: "850",
  category: "Law",
  description: "Comprehensive Word syllabus monograph for legal fundamentals.",
  pages: 90,
  pdfUrl: "local:doc-test-law",
  coverUrl: "",
  published: true,
  progress: 0,
  xpEarned: 0,
  rating: 4.6,
  chapterList: Array.from({ length: 6 }, (_, i) => ({
    title: `Section ${i + 1}`,
    pages: 15,
    done: false,
  })),
};

writeLibraryCatalog([pptBook, docBook, ...initialCatalog]);

const updatedCatalog = readLibraryCatalog();
const foundPpt = updatedCatalog.find((b) => b.id === "bk-test-ppt-101");
assert.ok(foundPpt, "PPT book exists in catalog");
assert.equal(getDocumentFormat(foundPpt.pdfUrl), "ppt", "PPT book recognized as PPT");

const foundDoc = updatedCatalog.find((b) => b.id === "bk-test-doc-202");
assert.ok(foundDoc, "DOC book exists in catalog");
assert.equal(getDocumentFormat(foundDoc.pdfUrl), "doc", "DOC book recognized as DOC");

console.log("✓ Catalog ingestion & persistence verified for PPT and DOC courseware");

// 3. Test HTTP /library endpoint availability
const res = await fetch("http://localhost:3002/library");
assert.equal(res.status, 200, "http://localhost:3002/library responds with 200 OK");
const html = await res.text();
assert.ok(html.includes("<!DOCTYPE html>"), "Library serves valid HTML");
console.log("✓ Live HTTP /library endpoint responds with 200 OK");

console.log("\nAll Library CMS tests PASSED! 🎉");
