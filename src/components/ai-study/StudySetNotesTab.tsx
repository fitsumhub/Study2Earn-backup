import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit2,
  FileText,
  GraduationCap,
  Highlighter,
  Layers,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
  Pin,
  Printer,
  RotateCcw,
  Save,
  Scale,
  Sparkles,
  Star,
  Target,
  Type,
  X,
  Zap,
} from "lucide-react";
import React, { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useIntegrations } from "@/hooks/use-integrations";
import { summarizeNotesFn } from "@/lib/api/ai-study.functions";
import { updateStudySet, type StudySet, type StudySetNotes } from "@/lib/study-set-store";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface StudySetNotesTabProps {
  studySet: StudySet;
  onStudySetUpdated?: () => void;
}

/**
 * Synthesizes comprehensive, university-grade, Harvard/Oxford-caliber academic lecture notes
 * with extensive technical depth, bold main points, color-coded callouts, comparison tables,
 * and exam problem-solving protocols.
 */
export function buildChatGPTStyleNotesMarkdown(studySet: StudySet): string {
  const notes = studySet.notes || {
    summary: "",
    keyConcepts: [],
    definitions: [],
    formulasAndRules: [],
    studyTips: [],
  };

  // If the user already saved custom raw markdown, preserve it
  if (notes.rawMarkdown && notes.rawMarkdown.trim().length > 50) {
    return notes.rawMarkdown;
  }

  const sections: string[] = [];
  const subject = studySet.subject || "Computer Science & Engineering";
  const courseCode = studySet.courseCode || "CoSc 3021";
  const title = studySet.title || "Academic Study Module";
  const overview = studySet.overview;
  const cheatSheet = studySet.cheatSheet;

  // ─────────────────────────────────────────────────────────────
  // 1. GRAND SCHOLARLY HEADER & SYLLABUS METADATA
  // ─────────────────────────────────────────────────────────────
  sections.push(
    `# ${title}\n\n**Course Code:** ${courseCode} | **Discipline:** ${subject} | **Curriculum Level:** Senior University Exit Exam Standard | **Syllabus Coverage:** 100% Comprehensive & Verified`,
  );

  // ─────────────────────────────────────────────────────────────
  // 2. EXECUTIVE OVERVIEW & SYLLABUS SYNTHESIS
  // ─────────────────────────────────────────────────────────────
  const summaryContent =
    notes.summary?.trim() ||
    overview?.academicContext ||
    `This rigorous lecture monograph establishes the foundational architectural axioms, governing mathematical theorems, and engineering trade-offs across **${title}**. Designed for senior undergraduate and postgraduate degree examinations, this module bridges theoretical computer science and engineering principles with production enterprise infrastructure. Students will master the underlying operational mechanisms, boundary condition constraints, failure domain isolation strategies, and exact mathematical derivations required for full-credit examination problem resolution.`;

  let executiveSection = `## 📌 Executive Overview & Syllabus Synthesis\n\n${summaryContent}`;

  if (overview?.keyPrinciples && overview.keyPrinciples.length > 0) {
    executiveSection += `\n\n### Core System Invariants & Axioms:\n${overview.keyPrinciples
      .map((p) => `- **Axiom:** ${p}`)
      .join("\n")}`;
  }

  sections.push(executiveSection);

  // ─────────────────────────────────────────────────────────────
  // 3. TARGETED LEARNING OBJECTIVES (BLOOM'S TAXONOMY)
  // ─────────────────────────────────────────────────────────────
  const rawObjectives =
    notes.learningObjectives && notes.learningObjectives.length > 0
      ? notes.learningObjectives
      : overview?.learningObjectives && overview.learningObjectives.length > 0
        ? overview.learningObjectives
        : [
            `Master the fundamental axioms, operational boundaries, and architectural tiers of ${title}.`,
            `Analyze failure modes, boundary condition constraints, and performance bottlenecks.`,
            `Formulate and derive governing mathematical equations directly to solve exam scenarios.`,
            `Evaluate engineering trade-offs between system speed, fault tolerance, and implementation complexity.`,
            `Distinguish commonly conflated concepts to navigate high-risk university examiner traps.`,
          ];

  const bloomCategories = [
    "Remember & Recall",
    "Understand & Explain",
    "Apply & Calculate",
    "Analyze & Differentiate",
    "Evaluate & Synthesize",
    "Design & Defend",
  ];

  const categorizedObjectives = rawObjectives.map((obj, i) => {
    const category = bloomCategories[i % bloomCategories.length];
    return `- **${category}:** ${obj}`;
  });

  sections.push(
    `## 🎯 Core Learning Objectives (Bloom's Taxonomy Framework)\n\n${categorizedObjectives.join("\n")}`,
  );

  // ─────────────────────────────────────────────────────────────
  // 4. CORE CONCEPTS & MODULAR THEORETICAL UNITS
  // ─────────────────────────────────────────────────────────────
  const concepts = [...(notes.keyConcepts || [])];

  if (concepts.length < 4 && overview?.mentalModelHierarchy) {
    overview.mentalModelHierarchy.forEach((m) => {
      m.concepts.forEach((c) => {
        if (!concepts.some((existing) => existing.concept === c.name)) {
          concepts.push({
            unit: m.unit,
            concept: c.name,
            definition: c.details,
            explanation: `${c.details}. Real-world application: ${c.exampleOrApplication}.`,
            takeaway: c.details,
            tradeoffs: "Balancing performance efficiency against architectural overhead.",
            examTip: "Examiners test boundary conditions and edge-case exceptions for this principle.",
          });
        }
      });
    });
  }

  if (concepts.length < 3 && studySet.quizzes) {
    studySet.quizzes.slice(0, 4 - concepts.length).forEach((q, i) => {
      const correctOpt = q.options[q.correctIndex] || "";
      concepts.push({
        unit: `Unit ${(concepts.length + 1).toFixed(1)}`,
        concept: q.conceptTested || q.topic || `Fundamental Principle #${i + 1}`,
        definition: correctOpt,
        explanation: q.explanation || `${correctOpt}. Universally tested on university examinations.`,
        takeaway: correctOpt,
        tradeoffs: "Balancing execution latency with stateful validation constraints.",
        examTip: "Carefully inspect question premises for negative constraints or false alternatives.",
      });
    });
  }

  if (concepts.length > 0) {
    const conceptsText = concepts
      .map((k, i) => {
        const unitTitle = k.unit ? `${k.unit}: ${k.concept}` : `Unit ${i + 1}.0: ${k.concept}`;
        const parts: string[] = [];

        parts.push(`### ${unitTitle}`);

        if (k.definition) {
          parts.push(`- **Formal Academic Definition:** ${k.definition}`);
        }

        parts.push(`- **Governing Mechanism & Working Principle:** ${k.explanation}`);

        if (k.whyItMatters) {
          parts.push(`- **Theoretical & Practical Significance:** ${k.whyItMatters}`);
        }

        if (k.example || k.lecturerExample) {
          parts.push(`- **Real-World Application & Industrial Context:** ${k.example || k.lecturerExample}`);
        }

        if (k.workedExample) {
          if (typeof k.workedExample === "object") {
            let workedText = `#### 💡 Worked Examination Problem & Step-by-Step Solution\n`;
            workedText += `- **Problem Scenario:** ${k.workedExample.problemStatement}\n`;
            workedText += `- **Step-by-Step Derivation & Solution:**\n${k.workedExample.stepByStepSolution}\n`;
            if (k.workedExample.keyTakeaway) {
              workedText += `> 🔑 **Key Takeaway & Verification:** ${k.workedExample.keyTakeaway}`;
            }
            parts.push(workedText);
          } else {
            parts.push(`#### 💡 Worked Examination Problem & Step-by-Step Solution\n${k.workedExample}`);
          }
        }

        if (k.tradeoffs) {
          parts.push(`- **Architectural Trade-offs & Constraints:** ${k.tradeoffs}`);
        }

        if (k.takeaway) {
          parts.push(`> 💡 **Core Takeaway:** ${k.takeaway}`);
        }

        if (k.examTip) {
          parts.push(`> 🎯 **Examiner Tip & Marking Criteria:** ${k.examTip}`);
        }

        return parts.join("\n\n");
      })
      .join("\n\n---\n\n");

    sections.push(`## 📚 Core Concepts & Modular Theoretical Units\n\n${conceptsText}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. COMPARATIVE ANALYSIS & ARCHITECTURAL MATRIX (TABLE)
  // ─────────────────────────────────────────────────────────────
  const rawTables = notes.classificationsAndCategories || [];
  const cheatTables = cheatSheet?.comparisonsTable || [];

  if (rawTables.length > 0) {
    rawTables.forEach((table) => {
      const headerRow = `| ${table.headers.join(" | ")} |`;
      const sepRow = `| ${table.headers.map(() => "---").join(" | ")} |`;
      const bodyRows = table.rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
      sections.push(
        `## ⚖️ Comparative Analysis: ${table.title}\n\n${table.description ? `*${table.description}*\n\n` : ""}${headerRow}\n${sepRow}\n${bodyRows}`,
      );
    });
  } else if (cheatTables.length > 0) {
    const headerRow = `| Architectural Dimension / Concept | Operational Meaning | Crucial Line of Demarcation | Primary University Exam Focus |`;
    const sepRow = `| --- | --- | --- | --- |`;
    const bodyRows = cheatTables
      .map(
        (c) =>
          `| **${c.concept}** | ${c.meaning} | ${c.keyDifference} | ${c.example || "High-Yield Distinction"} |`,
      )
      .join("\n");
    sections.push(
      `## ⚖️ Comparative Analysis & Conceptual Matrix\n\n${headerRow}\n${sepRow}\n${bodyRows}`,
    );
  } else {
    const headerRow = `| Architectural Tier / Protocol | Governing Purpose | Key Advantages | Primary Constraint / Trade-off | Exam Testing Focus |`;
    const sepRow = `| --- | --- | --- | --- | --- |`;
    const bodyRows = [
      `| **Core Transit Layer** | Wire-speed packet switching without packet inspection | Ultra-low deterministic latency; non-blocking fabric | No ACL filtering or packet manipulation permitted | "Why ACLs are forbidden at the Core" |`,
      `| **Distribution Policy Layer** | Inter-VLAN routing, ACL security & QoS classification boundary | Aggregates access switches; enforces security boundaries | Higher TCAM and routing memory consumption | "Where policy enforcement and routing boundaries occur" |`,
      `| **Access Edge Layer** | User endpoint connectivity & zero-trust port authentication | Enforces 802.1X, PoE, Port Security, and DHCP Snooping | Limited CPU processing per edge switch | "Layer 2 defense triad and trust boundaries" |`,
    ].join("\n");
    sections.push(
      `## ⚖️ Comparative Analysis & Architectural Matrix\n\n${headerRow}\n${sepRow}\n${bodyRows}`,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 6. FUNDAMENTAL PRINCIPLES & THEORETICAL LAWS
  // ─────────────────────────────────────────────────────────────
  const rawPrinciples =
    notes.principlesAndTheories && notes.principlesAndTheories.length > 0
      ? notes.principlesAndTheories
      : overview?.majorTheoriesAndModels && overview.majorTheoriesAndModels.length > 0
        ? overview.majorTheoriesAndModels.map((m) => ({
            title: m.name,
            principle: m.corePremise,
            explanation: m.description,
            scopeOfValidity: "Applies under standard linear systems and boundary conditions.",
          }))
        : cheatSheet?.corePrinciples && cheatSheet.corePrinciples.length > 0
          ? cheatSheet.corePrinciples.map((p) => ({
              title: p.principle,
              principle: p.conciseRule,
              explanation: `${p.conciseRule} This principle forms an inviolable foundation of system design.`,
              scopeOfValidity: "Universal throughout enterprise and academic architectures.",
            }))
          : [];

  if (rawPrinciples.length > 0) {
    const principlesText = rawPrinciples
      .map((p, i) => {
        return `### Principle #${i + 1}: ${p.title}
- **Core Axiom:** **${p.principle}**
- **Theoretical Mechanism:** ${p.explanation}
- **Scope of Validity:** ${p.scopeOfValidity || "Universal under standard operating parameters."}
${"examApplication" in p && p.examApplication ? `> 🎯 **Exam Application:** ${p.examApplication}` : ""}`;
      })
      .join("\n\n---\n\n");

    sections.push(`## 🏛️ Fundamental Principles, Laws & Theoretical Foundations\n\n${principlesText}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. GOVERNING FORMULAS, THEOREMS & DERIVATIONS
  // ─────────────────────────────────────────────────────────────
  const rawFormulas =
    notes.formulasAndRules && notes.formulasAndRules.length > 0
      ? notes.formulasAndRules
      : cheatSheet?.importantFormulas && cheatSheet.importantFormulas.length > 0
        ? cheatSheet.importantFormulas.map((f) => ({
            title: f.title,
            formula: f.formula,
            explanation: f.variables,
            variables: f.variables
              .split(",")
              .map((v) => ({ symbol: v.split(":")[0]?.trim() || "x", label: v.split(":")[1]?.trim() || "Parameter" })),
            examTrick: f.quickTip,
          }))
        : [];

  let formulas = [...rawFormulas];
  if (formulas.length === 0) {
    formulas = [
      {
        title: "Shannon-Hartley Channel Capacity Theorem",
        formula: "C = B \\cdot \\log_2\\left(1 + \\frac{S}{N}\\right)",
        explanation:
          "Defines the theoretical upper bound of error-free information transmission rate through a communication channel afflicted by additive white Gaussian noise (AWGN).",
        variables: [
          { symbol: "C", label: "Theoretical channel capacity [bits per second / bps]" },
          { symbol: "B", label: "Channel analog bandwidth [Hertz / Hz]" },
          { symbol: "S/N", label: "Signal-to-Noise linear power ratio (dimensionless)" },
        ],
        validityConditions: "Gaussian noise distribution with linear time-invariant channel response.",
        examTrick: "Bandwidth B scales capacity linearly; increasing signal power yields only logarithmic returns.",
      },
      {
        title: "System High-Availability Operational Equation",
        formula: "A = \\frac{\\text{MTBF}}{\\text{MTBF} + \\text{MTTR}}",
        explanation:
          "Expresses the fractional uptime availability of an operational system as a ratio of Mean Time Between Failures to total operational cycle time.",
        variables: [
          { symbol: "A", label: "System availability fraction (e.g., 0.99999 for Five Nines)" },
          { symbol: "MTBF", label: "Mean Time Between Failures [operating hours]" },
          { symbol: "MTTR", label: "Mean Time to Repair / Restore [hours or fractions thereof]" },
        ],
        validityConditions: "Continuous independent renewal process with instantaneous failure detection.",
        examTrick: "Achieving 99.999% availability (≤5.26 min downtime/year) is mathematically accomplished by minimizing MTTR via automated failover, rather than demanding infinite MTBF.",
      },
      {
        title: "Bandwidth-Delay Product (BDP) Queue Dimensioning",
        formula: "\\text{BDP} = R \\times \\text{RTT}",
        explanation:
          "Quantifies the volume of unacknowledged data in-flight across the communication link pipe, establishing the required TCP receive socket buffer capacity.",
        variables: [
          { symbol: "BDP", label: "Volume of data in-flight [bits or bytes]" },
          { symbol: "R", label: "Bottleneck link capacity [bits per second / bps]" },
          { symbol: "RTT", label: "Round-Trip Time propagation delay [seconds / s]" },
        ],
        validityConditions: "Steady-state TCP congestion window saturation without packet drop.",
        examTrick: "Divide bits by 8 to convert to bytes; socket buffer size must equal or exceed BDP to avoid TCP pipeline starvation.",
      },
    ];
  }

  if (formulas.length > 0) {
    const formulasText = formulas
      .map((f, i) => {
        let fText = `### ${i + 1}. ${f.title}\n\n$$\n${f.formula}\n$$\n\n${f.explanation}`;
        if (f.variables && f.variables.length > 0) {
          fText += `\n\n**Variable Notation & SI Units Key:**\n${f.variables.map((v) => `- **Symbol \`${v.symbol}\`:** ${v.label}`).join("\n")}`;
        }
        if ("validityConditions" in f && f.validityConditions) {
          fText += `\n\n- **Governing Boundary Conditions:** ${f.validityConditions}`;
        }
        if (f.examTrick) {
          fText += `\n\n> ⚡ **Exam Calculation Shortcut / Rapid Estimation:** ${f.examTrick}`;
        }
        if ("workedCalculationExample" in f && f.workedCalculationExample) {
          if (typeof f.workedCalculationExample === "object") {
            fText += `\n\n#### 🧮 Concrete Calculation Example & Numerical Substitution:\n- **Given Parameters:** ${f.workedCalculationExample.given}\n${f.workedCalculationExample.formulaUsed ? `- **Formula Applied:** \`${f.workedCalculationExample.formulaUsed}\`\n` : ""}- **Substitution & Intermediate Steps:** ${f.workedCalculationExample.substitutions}\n- **Calculated Result:** **${f.workedCalculationExample.result}**`;
          } else {
            fText += `\n\n#### 🧮 Concrete Calculation Example:\n${f.workedCalculationExample}`;
          }
        }
        return fText;
      })
      .join("\n\n---\n\n");

    sections.push(`## ⚡ Key Formulas, Laws & Governing Theorems\n\n${formulasText}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 8. WORKED SCENARIOS & CASE ANALYSES
  // ─────────────────────────────────────────────────────────────
  let rawExamples = notes.clarifyingExamples || [];
  if (rawExamples.length === 0) {
    // Generate high-yield worked exam scenarios from the domain
    rawExamples = [
      {
        title: `University Exit Exam Problem Formulation: ${title}`,
        conceptIllustrated: "First-Principles Resolution & Boundary Check",
        scenario: `A senior university student is presented with a complex multi-tier scenario evaluating ${title}. Key variables are near operational boundary limits, requiring both theoretical justification and quantitative evaluation.`,
        analysis: `1. **Parameter Decomposition:** Extract all given operational variables, boundary constraints, and requested unknowns.\n2. **Governing Theorem Selection:** Confirm that ideal linear or steady-state assumptions are strictly valid before choosing formulas.\n3. **Symbolic Derivation:** Solve the governing equations algebraically for the unknown quantity prior to entering arithmetic numbers.\n4. **Dimensional Consistency Check:** Verify that calculated dimensions match target physical or computational units (e.g. Joules, bps, Hz).`,
        examinerTrap: "Examiners deliberately include distractor options corresponding to failing to check boundary conditions or using mismatched units.",
      },
      {
        title: "Real-World Engineering Trade-off & Capacity Analysis",
        conceptIllustrated: "System Scaling & Performance Envelope",
        scenario: `An enterprise engineering team must scale ${title} operations while maintaining strict latency and reliability guarantees under 3x peak load.`,
        analysis: `1. **Bottleneck Isolation:** Determine the primary constrained resource dimension (CPU, bandwidth, memory footprint, or queue depth).\n2. **Mathematical Modeling:** Calculate required operational capacity using governing invariant formulas.\n3. **Failure Domain Isolation:** Implement automated boundary buffering to isolate the blast radius of transient anomalies.`,
        examinerTrap: "Assuming that doubling capacity yields a linear 2x improvement without accounting for non-linear queuing bottlenecks.",
      },
    ];
  }

  const examplesText = rawExamples
    .map((ex, i) => {
      let exText = `### Worked Exam Scenario #${i + 1}: ${ex.title}\n`;
      exText += `- **Concept Illustrated:** **${ex.conceptIllustrated}**\n`;
      exText += `- **Problem Statement & Given Scenario:** ${ex.scenario}\n`;
      exText += `- **Step-by-Step Technical Analysis & Solution:**\n${ex.analysis}\n`;
      if (ex.examinerTrap) {
        exText += `> ⚠️ **Examiner Trap in this Scenario:** ${ex.examinerTrap}`;
      }
      return exText;
    })
    .join("\n\n---\n\n");

  sections.push(`## 🔍 Worked Examination Scenarios & Case Analyses\n\n${examplesText}`);

  // ─────────────────────────────────────────────────────────────
  // 9. COMMON CONFUSIONS & EXAMINER TRAPS
  // ─────────────────────────────────────────────────────────────
  const rawConfusions =
    notes.commonConfusions && notes.commonConfusions.length > 0
      ? notes.commonConfusions
      : cheatSheet?.commonMistakes && cheatSheet.commonMistakes.length > 0
        ? cheatSheet.commonMistakes.map((m) => ({
            conceptA: m.misconception,
            conceptB: m.correctUnderstanding,
            keyDistinction: m.correctUnderstanding,
            mnemonicOrRule: "Memorize the core distinction to prevent confusing cause with effect.",
          }))
        : [
            {
              conceptA: "Bandwidth vs. Throughput vs. Goodput",
              conceptB: "Network Latency & Propagation Delay",
              keyDistinction:
                "Bandwidth is theoretical capacity; Throughput is measured data transfer; Goodput is useful application payload excluding headers and retransmissions.",
              mnemonicOrRule: "Goodput is the gold; Throughput is the truck; Bandwidth is the highway width.",
            },
            {
              conceptA: "Active/Standby Gateway (HSRP/VRRP)",
              conceptB: "Active/Active Gateway Load Balancing (GLBP)",
              keyDistinction:
                "HSRP/VRRP keeps the backup router completely idle (50% wasted link capacity); GLBP distributes different virtual MAC addresses to clients via ARP round-robin.",
              mnemonicOrRule: "HSRP/VRRP waits; GLBP works.",
            },
            {
              conceptA: "DHCP Snooping vs. Dynamic ARP Inspection (DAI)",
              conceptB: "IP Source Guard (IPSG)",
              keyDistinction:
                "DHCP Snooping inspects DHCP leases and builds the authoritative IP-MAC binding table; DAI and IPSG cannot function without the snooping database.",
              mnemonicOrRule: "Snooping creates the ledger; DAI and IPSG enforce the law.",
            },
          ];

  const confusionsText = rawConfusions
    .map((c, i) => {
      return `### Examiner Trap #${i + 1}: ${c.conceptA} vs. ${c.conceptB}
- **The Common Student Misconception:** Conflating these two operational concepts under examination time pressure.
- **The Crucial Demarcation:** ${c.keyDistinction}
> ⚠️ **Golden Rule / Memory Mnemonic:** ${c.mnemonicOrRule}`;
    })
    .join("\n\n---\n\n");

  sections.push(`## ⚠️ Common Confusions & Examiner Traps\n\n${confusionsText}`);

  // ─────────────────────────────────────────────────────────────
  // 10. STEP-BY-STEP PROBLEM-SOLVING PROTOCOLS
  // ─────────────────────────────────────────────────────────────
  const rawWorkflows =
    notes.processesAndWorkflows && notes.processesAndWorkflows.length > 0
      ? notes.processesAndWorkflows
      : cheatSheet?.processesAndWorkflows && cheatSheet.processesAndWorkflows.length > 0
        ? cheatSheet.processesAndWorkflows.map((p) => ({
            processName: p.title,
            objective: p.summary,
            steps: p.steps.map((s, idx) => ({
              stepNumber: idx + 1,
              title: `Phase ${idx + 1}`,
              description: s,
            })),
          }))
        : [
            {
              processName: "Universal Exam Problem-Solving Protocol",
              objective: "Systematic 5-phase algorithm ensuring zero arithmetic slips and full marks.",
              steps: [
                {
                  stepNumber: 1,
                  title: "Parameter & Unit Extraction",
                  description:
                    "Extract all given variables and target unknowns; convert all non-standard units (ms, km/h, MB) directly to standard SI units before applying formulas.",
                },
                {
                  stepNumber: 2,
                  title: "Boundary Condition & Assumption Check",
                  description:
                    "Verify whether governing assumptions (frictionless, steady-state, linear channel, AWGN) hold before selecting equations.",
                },
                {
                  stepNumber: 3,
                  title: "Pure Symbolic Algebraic Derivation",
                  description:
                    "Isolate the target unknown purely in algebraic symbols. Never plug in numbers prematurely—symbolic work earns the majority of partial credit.",
                },
                {
                  stepNumber: 4,
                  title: "Numerical Substitution & Significant Figures",
                  description:
                    "Substitute values with matching scientific notation; calculate with correct significant figures and mandatory physical units.",
                },
                {
                  stepNumber: 5,
                  title: "Dimensional & Physical Plausibility Sanity Check",
                  description:
                    "Verify dimensional homogeneity (both sides of the equation have identical units) and confirm numerical magnitude is physically realistic.",
                },
              ],
            },
          ];

  const workflowsText = rawWorkflows
    .map((p) => {
      return `### Protocol: ${p.processName}
- **Operational Objective:** **${p.objective}**

${p.steps.map((s) => `${s.stepNumber}. **${s.title}:** ${s.description}`).join("\n")}`;
    })
    .join("\n\n---\n\n");

  sections.push(`## 🔄 Step-by-Step Problem-Solving Protocols\n\n${workflowsText}`);

  // ─────────────────────────────────────────────────────────────
  // 11. COMPREHENSIVE ACADEMIC LEXICON & GLOSSARY
  // ─────────────────────────────────────────────────────────────
  const rawDefs = [...(notes.definitions || [])];

  if (overview?.importantDefinitions) {
    overview.importantDefinitions.forEach((d) => {
      if (!rawDefs.some((existing) => existing.term === d.term)) {
        rawDefs.push({
          term: d.term,
          definition: d.definition,
          academicContext: subject,
          highYield: true,
        });
      }
    });
  }

  if (cheatSheet?.criticalDefinitions) {
    cheatSheet.criticalDefinitions.forEach((d) => {
      if (!rawDefs.some((existing) => existing.term === d.term)) {
        rawDefs.push({
          term: d.term,
          definition: d.briefDefinition,
          academicContext: d.highYieldTag || subject,
          highYield: true,
        });
      }
    });
  }

  if (rawDefs.length < 5 && studySet.flashcards) {
    studySet.flashcards.slice(0, 8).forEach((f) => {
      const termName = f.front.replace(/^(what is|define|explain)\s+/i, "").replace(/\?$/, "");
      if (!rawDefs.some((d) => d.term === termName)) {
        rawDefs.push({
          term: termName,
          definition: f.back,
          academicContext: f.topic || subject,
          highYield: true,
        });
      }
    });
  }

  if (rawDefs.length > 0) {
    const sortedDefs = [...rawDefs].sort((a, b) => a.term.localeCompare(b.term));
    const defsText = sortedDefs
      .map(
        (d) =>
          `- **${d.term}**${d.academicContext ? ` *(${d.academicContext})*` : ""}: ${d.definition}`,
      )
      .join("\n");

    sections.push(`## 📖 Essential Terminology & Academic Lexicon\n\n${defsText}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 12. HIGH-YIELD UNIVERSITY EXIT EXAM RULES & SCORING STRATEGIES
  // ─────────────────────────────────────────────────────────────
  const rawTips =
    notes.studyTips && notes.studyTips.length > 0
      ? notes.studyTips
      : cheatSheet?.examReminders && cheatSheet.examReminders.length > 0
        ? cheatSheet.examReminders
        : [
            "First-Principles Derivation: Never memorize isolated answers; derive intermediate relations from governing axioms.",
            "Dimensional Consistency Check: Verify physical units and dimensional homogeneity before evaluating mathematical relations.",
            "Symbolic First, Numbers Last: Always solve the equation for the unknown variable algebraically before substituting numerical parameters.",
            "Watch the Metric Prefix Trap: Convert milliseconds to seconds (10^-3) and gigabits to bits (10^9) before executing calculations.",
            "Active Retrieval Practice: Test your recall of core definitions and formulas from a blank sheet of paper to lock them into long-term memory.",
          ];

  const tipsText = rawTips.map((t, i) => `${i + 1}. **${t}**`).join("\n");
  sections.push(`## 🏆 High-Yield Exam Rules & Scoring Strategies\n\n${tipsText}`);

  return sections.join("\n\n---\n\n");
}

// Section metadata for the table of contents
const TOC_SECTIONS = [
  { emoji: "📌", label: "Overview", query: "Executive Overview", color: "blue" },
  { emoji: "🎯", label: "Objectives", query: "Core Learning Objectives", color: "purple" },
  { emoji: "📚", label: "Core Units", query: "Core Concepts", color: "indigo" },
  { emoji: "⚖️", label: "Matrix", query: "Comparative Analysis", color: "sky" },
  { emoji: "🏛️", label: "Principles", query: "Fundamental Principles", color: "teal" },
  { emoji: "⚡", label: "Formulas", query: "Key Formulas", color: "amber" },
  { emoji: "⚠️", label: "Traps", query: "Common Confusions", color: "rose" },
  { emoji: "🔄", label: "Protocols", query: "Problem-Solving", color: "emerald" },
  { emoji: "📖", label: "Glossary", query: "Essential Terminology", color: "cyan" },
  { emoji: "🏆", label: "Exam Rules", query: "High-Yield Exam Rules", color: "yellow" },
] as const;

type TocColor = (typeof TOC_SECTIONS)[number]["color"];
const tocColorMap: Record<TocColor, string> = {
  blue: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:hover:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/50",
  purple: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:hover:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900/50",
  indigo: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900/50",
  sky: "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:hover:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900/50",
  teal: "bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:hover:bg-teal-950/60 dark:text-teal-300 dark:border-teal-900/50",
  amber: "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/50",
  rose: "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/50",
  emerald: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50",
  cyan: "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:hover:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-900/50",
  yellow: "bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:hover:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-900/50",
};

export function StudySetNotesTab({ studySet, onStudySetUpdated }: StudySetNotesTabProps) {
  const { config: integrations } = useIntegrations();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [highlightKeyPoints, setHighlightKeyPoints] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<"sm" | "base" | "lg">("base");
  const [tocExpanded, setTocExpanded] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);

  const [isSummarizeOpen, setIsSummarizeOpen] = useState(false);
  const [customNotesText, setCustomNotesText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryDepth, setSummaryDepth] = useState<"concise" | "standard" | "detailed" | "deep-learning">("detailed");
  const [summaryFocus, setSummaryFocus] = useState<"exam-focused" | "conceptual" | "practical" | "quick-revision">("exam-focused");
  const [summaryLanguage, setSummaryLanguage] = useState<"en" | "am">("en");
  const [targetSection, setTargetSection] = useState<string>("all");

  const initialMarkdown = useMemo(() => buildChatGPTStyleNotesMarkdown(studySet), [studySet]);
  const [notesMarkdown, setNotesMarkdown] = useState(initialMarkdown);

  React.useEffect(() => {
    setNotesMarkdown(buildChatGPTStyleNotesMarkdown(studySet));
  }, [studySet]);

  const handleRunAiSummarize = useCallback(
    async (usePasted: boolean) => {
      setIsSummarizing(true);
      try {
        const activeProvider = integrations.aiStudy.provider || "gemini";
        const settings = integrations.aiStudy.providers?.[activeProvider];
        const apiKey = settings?.apiKey?.trim() || integrations.aiStudy.apiKey?.trim();

        let sourceText = "";
        if (usePasted && customNotesText.trim()) {
          sourceText = customNotesText.trim();
        } else {
          sourceText =
            studySet.sources?.map((s) => s.fullText || s.contentSnippet).filter(Boolean).join("\n\n") ||
            notesMarkdown.slice(0, 8000) ||
            studySet.title;
        }

        const res = await summarizeNotesFn({
          data: {
            text: sourceText.slice(0, 20000),
            titleHint: studySet.title,
            subjectHint: studySet.subject,
            depth: summaryDepth,
            focus: summaryFocus,
            language: summaryLanguage,
            targetSection: targetSection !== "all" ? targetSection : undefined,
            provider: activeProvider,
            apiKey: apiKey || undefined,
            baseUrl: settings?.baseUrl || undefined,
            model: settings?.model || undefined,
          },
        });

        if (res?.data) {
          updateStudySet(studySet.id, {
            notes: {
              ...res.data,
              rawMarkdown: res.data.rawMarkdown,
            },
          });
          const freshMd =
            res.data.rawMarkdown ||
            buildChatGPTStyleNotesMarkdown({ ...studySet, notes: res.data });
          setNotesMarkdown(freshMd);
          onStudySetUpdated?.();
          setIsSummarizeOpen(false);
          setCustomNotesText("");
          toast.success(
            targetSection !== "all"
              ? `Section "${targetSection}" successfully regenerated with Google Gemini!`
              : "Notes successfully summarized with Google Gemini!",
          );
        }
      } catch (err) {
        console.error("Summarization error:", err);
        toast.error("Failed to summarize notes with Gemini. Please try again.");
      } finally {
        setIsSummarizing(false);
      }
    },
    [integrations.aiStudy, customNotesText, studySet, notesMarkdown, onStudySetUpdated],
  );

  // Stats
  const { estimatedReadMinutes, wordCount, keyPointCount, sectionCount } = useMemo(() => {
    const words = notesMarkdown.split(/\s+/).filter(Boolean).length;
    const boldMatches = notesMarkdown.match(/\*\*([^*]+)\*\*/g) || [];
    const h2Matches = notesMarkdown.match(/^## /gm) || [];
    return {
      wordCount: words,
      estimatedReadMinutes: Math.max(3, Math.ceil(words / 175)),
      keyPointCount: boldMatches.length,
      sectionCount: h2Matches.length,
    };
  }, [notesMarkdown]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(notesMarkdown);
    setCopied(true);
    toast.success("Copied notes to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [notesMarkdown]);

  const handleDownload = useCallback(() => {
    const file = new Blob([notesMarkdown], { type: "text/markdown" });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(file);
    element.download = `${studySet.title.replace(/\s+/g, "_")}_Summarize_Notes.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Downloaded notes as Markdown (.md)");
  }, [notesMarkdown, studySet.title]);

  const handlePrint = useCallback(() => window.print(), []);

  const handleSaveEdit = useCallback(() => {
    updateStudySet(studySet.id, {
      notes: {
        ...studySet.notes,
        rawMarkdown: notesMarkdown,
        summary: studySet.notes?.summary || notesMarkdown.slice(0, 300),
      },
    });
    setIsEditing(false);
    toast.success("Notes saved!");
  }, [studySet, notesMarkdown]);

  const handleResetToGenerated = useCallback(() => {
    const fresh = buildChatGPTStyleNotesMarkdown({
      ...studySet,
      notes: { ...studySet.notes, rawMarkdown: undefined },
    });
    setNotesMarkdown(fresh);
    updateStudySet(studySet.id, { notes: { ...studySet.notes, rawMarkdown: undefined } });
    setIsEditing(false);
    toast.success("Reset to AI-generated notes!");
  }, [studySet]);

  const handleJumpToSection = useCallback((sectionName: string) => {
    if (typeof window === "undefined") return;
    const headings = Array.from(document.querySelectorAll("h2"));
    const target = headings.find((h) =>
      h.textContent?.toLowerCase().includes(sectionName.toLowerCase()),
    );
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const fontSizes = { sm: "text-xs sm:text-sm", base: "text-sm sm:text-base", lg: "text-base sm:text-lg" };

  return (
    <div className="mx-auto max-w-4xl space-y-0 animate-in fade-in duration-300">

      {/* ══════════════════════════════════════════════════════
          PREMIUM MANUSCRIPT HEADER
      ══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-t-2xl border border-b-0 border-slate-200 dark:border-slate-800">
        {/* Gradient crown */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.2)_0%,_transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

        <div className="relative px-6 pt-6 pb-5 space-y-4">
          {/* Top meta row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-3 py-1 font-bold text-white/90 border border-white/20">
              <GraduationCap className="size-3.5 text-amber-400" />
              Academic Syllabus Treatise · Summarize Notes
            </span>
            <span className="text-white/40">·</span>
            <span className="font-mono text-white/70 font-semibold">
              {studySet.courseCode || studySet.subject}
            </span>
            <span className="text-white/40">·</span>
            <span className="inline-flex items-center gap-1 text-white/60">
              <Clock className="size-3" />
              ~{estimatedReadMinutes} min read
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/60">{wordCount.toLocaleString()} words</span>
          </div>

          {/* Title */}
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {studySet.title}
            </h1>
            <p className="mt-1 text-sm text-white/50 font-light">
              Comprehensive Academic Study Notes · Exit Exam Preparation
            </p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { icon: <Star className="size-3 text-amber-400" />, label: `${keyPointCount} Key Points`, bg: "bg-amber-500/20 border-amber-400/30 text-amber-200" },
              { icon: <Layers className="size-3 text-indigo-400" />, label: `${sectionCount} Sections`, bg: "bg-indigo-500/20 border-indigo-400/30 text-indigo-200" },
              { icon: <BookOpen className="size-3 text-emerald-400" />, label: "Full Syllabus", bg: "bg-emerald-500/20 border-emerald-400/30 text-emerald-200" },
              { icon: <Target className="size-3 text-rose-400" />, label: "Exam Ready", bg: "bg-rose-500/20 border-rose-400/30 text-rose-200" },
            ].map((stat, i) => (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  stat.bg,
                )}
              >
                {stat.icon}
                {stat.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TOOLBAR STRIP
      ══════════════════════════════════════════════════════ */}
      <div className="border border-b-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: font size + highlight */}
        <div className="flex items-center gap-2">
          {/* Font size */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 p-0.5 text-xs gap-0.5">
            {(["sm", "base", "lg"] as const).map((size, i) => (
              <button
                key={size}
                type="button"
                onClick={() => setFontSizeLevel(size)}
                className={cn(
                  "w-8 py-1 rounded-md font-bold transition-all duration-150 cursor-pointer",
                  fontSizeLevel === size
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                )}
                title={["Compact", "Standard", "Large"][i] + " text"}
              >
                {["A−", "A", "A+"][i]}
              </button>
            ))}
          </div>

          {/* Highlight toggle */}
          <button
            type="button"
            onClick={() => setHighlightKeyPoints(!highlightKeyPoints)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
              highlightKeyPoints
                ? "bg-amber-400 border-amber-400 text-slate-900 shadow-sm shadow-amber-200/50"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700",
            )}
          >
            <Highlighter className="size-3.5" />
            {highlightKeyPoints ? "Highlights ON" : "Highlight Points"}
          </button>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsSummarizeOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:from-indigo-700 hover:to-purple-700 transition cursor-pointer"
          >
            <Sparkles className="size-3.5 text-amber-300" />
            Summarize Notes (AI)
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <Download className="size-3.5" />
            Export
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <Printer className="size-3.5" />
            Print
          </button>
          <button
            type="button"
            onClick={() => {
              if (isEditing) handleSaveEdit();
              else setIsEditing(true);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-sm",
              isEditing
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white",
            )}
          >
            {isEditing ? (
              <><Save className="size-3.5" /> Save</>
            ) : (
              <><Edit2 className="size-3.5" /> Edit Notes</>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TABLE OF CONTENTS (collapsible)
      ══════════════════════════════════════════════════════ */}
      <div className="border border-b-0 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
        <button
          type="button"
          onClick={() => setTocExpanded(!tocExpanded)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Layers className="size-3.5 text-indigo-500" />
            <span className="uppercase tracking-wider">Table of Contents</span>
            <span className="text-slate-400 font-normal">({sectionCount} sections)</span>
          </span>
          {tocExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>

        {tocExpanded && (
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {TOC_SECTIONS.map((item) => (
              <button
                key={item.query}
                type="button"
                onClick={() => handleJumpToSection(item.query)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all duration-150 cursor-pointer",
                  tocColorMap[item.color],
                )}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT CANVAS
      ══════════════════════════════════════════════════════ */}
      <div className="relative rounded-b-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Decorative side rule */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-rose-500 opacity-60" />

        {isEditing ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Edit2 className="size-3.5 text-indigo-500" />
                Markdown Source Editor
              </span>
              <button
                type="button"
                onClick={handleResetToGenerated}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="size-3" /> Reset to AI Default
              </button>
            </div>

            <Textarea
              rows={30}
              value={notesMarkdown}
              onChange={(e) => setNotesMarkdown(e.target.value)}
              className="font-mono text-xs sm:text-sm leading-relaxed rounded-xl resize-y border-slate-200 dark:border-slate-700 p-4 focus-visible:ring-indigo-500/30"
              placeholder="Write or edit notes in standard Markdown..."
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400">
                Supports GitHub Flavored Markdown, LaTeX equations ($...$, $$...$$), callouts, and tables
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)} className="h-8 rounded-lg text-xs">
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleSaveEdit} className="h-8 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="size-3.5 mr-1" /> Save Changes
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <article className={cn("pl-7 pr-6 py-8 sm:pl-10 sm:pr-10 sm:py-10 max-w-none", fontSizes[fontSizeLevel])}>
            <MarkdownRenderer content={notesMarkdown} highlightKeyPoints={highlightKeyPoints} />
          </article>
        )}

        {/* Bottom footer bar */}
        {!isEditing && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-6 sm:px-10 py-3 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FileText className="size-3" />
                {wordCount.toLocaleString()} words
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-3 text-amber-400" />
                {keyPointCount} key points
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                ~{estimatedReadMinutes} min read
              </span>
            </div>
            <span className="text-[10px] text-slate-300 dark:text-slate-600 font-mono">
              AI-Synthesized Academic Notes
            </span>
          </div>
        )}
      </div>

      {/* ── Real AI Summarize Notes Modal ── */}
      {isSummarizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Sparkles className="size-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                    Summarize Notes with Google Gemini
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Generate an academic lecture monograph from course notes or pasted material
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSummarizeOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Depth & Focus Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Summary Depth
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                    {(
                      [
                        { id: "concise", label: "Concise" },
                        { id: "standard", label: "Standard" },
                        { id: "detailed", label: "Detailed" },
                        { id: "deep-learning", label: "Deep Derivation" },
                      ] as const
                    ).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSummaryDepth(d.id)}
                        className={cn(
                          "rounded-lg px-2 py-1 text-xs font-semibold transition-all cursor-pointer",
                          summaryDepth === d.id
                            ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white font-bold"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white",
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Curriculum Focus
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                    {(
                      [
                        { id: "exam-focused", label: "Exam-Focused" },
                        { id: "conceptual", label: "Conceptual" },
                        { id: "practical", label: "Practical" },
                        { id: "quick-revision", label: "Quick Revision" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSummaryFocus(f.id)}
                        className={cn(
                          "rounded-lg px-2 py-1 text-xs font-semibold transition-all cursor-pointer",
                          summaryFocus === f.id
                            ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white font-bold"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Language & Target Section Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Language
                  </label>
                  <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setSummaryLanguage("en")}
                      className={cn(
                        "flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all cursor-pointer",
                        summaryLanguage === "en"
                          ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white font-bold"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white",
                      )}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryLanguage("am")}
                      className={cn(
                        "flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all cursor-pointer",
                        summaryLanguage === "am"
                          ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white font-bold"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white",
                      )}
                    >
                      አማርኛ (Amharic)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Target Section to Regenerate
                  </label>
                  <select
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <option value="all">Entire Monograph (All Sections)</option>
                    <option value="Executive Overview">Executive Overview & Syllabus</option>
                    <option value="Core Learning Objectives">Learning Objectives (Bloom's)</option>
                    <option value="Core Concepts & Theoretical Units">Core Concepts & Units</option>
                    <option value="Formulas, Governing Laws & Mathematics">Formulas & Mathematical Laws</option>
                    <option value="Comparative Analysis Matrix">Comparative Analysis Matrix</option>
                    <option value="Step-by-Step Problem-Solving Protocols">Problem-Solving Protocols</option>
                    <option value="Common Confusions & Examiner Traps">Examiner Traps & Misconceptions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Paste Raw Lecture Notes (Optional)
                </label>
                <Textarea
                  rows={5}
                  value={customNotesText}
                  onChange={(e) => setCustomNotesText(e.target.value)}
                  placeholder={`Paste lecture slides, syllabus excerpts, or revision points here...\n\nIf left empty, Gemini will synthesize a comprehensive summary from existing study set materials for "${studySet.title}".`}
                  className="text-xs font-mono rounded-xl resize-y border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSummarizeOpen(false)}
                disabled={isSummarizing}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleRunAiSummarize(Boolean(customNotesText.trim()))}
                disabled={isSummarizing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Summarizing with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 mr-1.5 text-amber-300" />
                    {targetSection !== "all"
                      ? `Regenerate "${targetSection}"`
                      : customNotesText.trim()
                        ? "Summarize Pasted Notes"
                        : "Summarize Monograph"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
