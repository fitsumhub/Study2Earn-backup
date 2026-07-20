import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileSearch,
  FileText,
  Lightbulb,
  ListOrdered,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Upload,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { strFromU8, unzipSync } from "fflate";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai-study")({
  head: () => ({
    meta: [
      { title: "AI Study — Study2Earn" },
      {
        name: "description",
        content:
          "Upload your notes, PPT or PDF and instantly generate practice exam questions with answers and study summaries.",
      },
    ],
  }),
  component: AiStudyPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "upload" | "processing" | "results";

interface AIQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface AINote {
  keyConcepts: string[];
  definitions: Array<{ term: string; definition: string }>;
  summary: string;
  studyTips: string[];
}

interface AIResult {
  subject: string;
  filename: string;
  questions: AIQuestion[];
  notes: AINote;
  /** Short snippet of the text we actually extracted from the file, if any. */
  excerpt: string;
  /** Whether the subject was inferred from real file content or just the filename. */
  detectionSource: "content" | "filename";
}

// ─── Question pools by subject ────────────────────────────────────────────────

const questionPools: Record<string, AIQuestion[]> = {
  physics: [
    {
      id: "p1",
      question:
        "A ball is thrown upward with an initial velocity of 20 m/s. What is the maximum height reached? (g = 10 m/s²)",
      options: ["10 m", "20 m", "40 m", "80 m"],
      correctIndex: 1,
      explanation: "At maximum height, v = 0. Using v² = u² − 2gh: 0 = 400 − 20h → h = 20 m.",
    },
    {
      id: "p2",
      question: "Which of the following is a vector quantity?",
      options: ["Mass", "Temperature", "Speed", "Displacement"],
      correctIndex: 3,
      explanation:
        "Displacement has both magnitude and direction, making it a vector. Mass, temperature, and speed are scalars.",
    },
    {
      id: "p3",
      question:
        "The work done by a force of 50 N moving an object 4 m in the direction of the force is:",
      options: ["12.5 J", "54 J", "200 J", "400 J"],
      correctIndex: 2,
      explanation: "Work = Force × Distance = 50 N × 4 m = 200 J.",
    },
    {
      id: "p4",
      question: "According to Newton's third law, when you push a wall, the wall:",
      options: [
        "Does not react",
        "Pushes back with a smaller force",
        "Pushes back with an equal and opposite force",
        "Absorbs the force",
      ],
      correctIndex: 2,
      explanation:
        "Newton's third law states that every action has an equal and opposite reaction. The wall pushes back on you with the same magnitude of force.",
    },
    {
      id: "p5",
      question: "The SI unit of power is:",
      options: ["Joule", "Newton", "Watt", "Pascal"],
      correctIndex: 2,
      explanation: "Power is measured in Watts (W), where 1 W = 1 J/s (joule per second).",
    },
  ],

  biology: [
    {
      id: "b1",
      question: "Which organelle is known as the 'powerhouse of the cell'?",
      options: ["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"],
      correctIndex: 2,
      explanation:
        "Mitochondria produce ATP through cellular respiration, supplying energy to the cell. This is why they are called the powerhouse.",
    },
    {
      id: "b2",
      question: "DNA replication occurs during which phase of the cell cycle?",
      options: ["G1 phase", "S phase", "G2 phase", "M phase"],
      correctIndex: 1,
      explanation:
        "DNA synthesis (replication) takes place during the Synthesis (S) phase of interphase, before the cell enters mitosis.",
    },
    {
      id: "b3",
      question: "Which type of RNA carries amino acids to the ribosome during translation?",
      options: ["mRNA", "rRNA", "tRNA", "snRNA"],
      correctIndex: 2,
      explanation:
        "Transfer RNA (tRNA) carries specific amino acids to the ribosome, matching them to codons on mRNA via anticodons.",
    },
    {
      id: "b4",
      question: "Mendel's law of segregation states that:",
      options: [
        "Genes on different chromosomes assort independently",
        "Two alleles for a trait separate during gamete formation",
        "Dominant alleles always mask recessive ones",
        "Mutations are always inherited",
      ],
      correctIndex: 1,
      explanation:
        "The law of segregation says the two alleles of each gene separate during meiosis so that each gamete carries only one allele.",
    },
    {
      id: "b5",
      question: "Photosynthesis takes place primarily in which organelle?",
      options: ["Mitochondria", "Nucleus", "Chloroplast", "Vacuole"],
      correctIndex: 2,
      explanation:
        "Chloroplasts contain chlorophyll and the enzymes needed to convert light energy, CO₂, and water into glucose and oxygen.",
    },
  ],

  chemistry: [
    {
      id: "c1",
      question: "What is the atomic number of Carbon?",
      options: ["4", "6", "8", "12"],
      correctIndex: 1,
      explanation:
        "Carbon (C) has 6 protons in its nucleus, giving it an atomic number of 6. Its atomic mass is approximately 12 amu.",
    },
    {
      id: "c2",
      question: "Which type of bond involves the sharing of electron pairs between atoms?",
      options: ["Ionic bond", "Metallic bond", "Hydrogen bond", "Covalent bond"],
      correctIndex: 3,
      explanation:
        "Covalent bonds form when two atoms share one or more pairs of electrons, as in H₂O or CH₄.",
    },
    {
      id: "c3",
      question: "Avogadro's number (6.022 × 10²³) represents the number of:",
      options: [
        "Atoms in 1 gram of any element",
        "Particles in one mole of a substance",
        "Molecules in 1 litre of gas at STP",
        "Electrons in a neutral atom",
      ],
      correctIndex: 1,
      explanation:
        "One mole of any substance contains 6.022 × 10²³ particles (atoms, molecules, or ions), defined by Avogadro's number.",
    },
    {
      id: "c4",
      question: "In the reaction 2H₂ + O₂ → 2H₂O, which substance is the oxidizing agent?",
      options: ["H₂", "O₂", "H₂O", "None of the above"],
      correctIndex: 1,
      explanation:
        "Oxygen (O₂) accepts electrons from hydrogen, causing hydrogen to be oxidized. Therefore, O₂ is the oxidizing agent.",
    },
    {
      id: "c5",
      question: "The pH of a neutral solution at 25°C is:",
      options: ["0", "7", "10", "14"],
      correctIndex: 1,
      explanation:
        "At 25°C, pure water has [H⁺] = [OH⁻] = 10⁻⁷ M, giving pH = −log(10⁻⁷) = 7. A pH of 7 is neutral.",
    },
  ],

  math: [
    {
      id: "m1",
      question: "If f(x) = 3x² − 2x + 1, what is f′(x)?",
      options: ["3x − 2", "6x + 2", "6x − 2", "3x² − 2"],
      correctIndex: 2,
      explanation:
        "Using the power rule: d/dx(3x²) = 6x, d/dx(−2x) = −2, d/dx(1) = 0. So f′(x) = 6x − 2.",
    },
    {
      id: "m2",
      question: "What is the value of log₁₀(1000)?",
      options: ["2", "3", "4", "10"],
      correctIndex: 1,
      explanation: "log₁₀(1000) = log₁₀(10³) = 3. Logarithm base 10 of 10³ equals its exponent, 3.",
    },
    {
      id: "m3",
      question: "The roots of the equation x² − 5x + 6 = 0 are:",
      options: ["x = 1 and x = 6", "x = 2 and x = 3", "x = −2 and x = −3", "x = −1 and x = 6"],
      correctIndex: 1,
      explanation:
        "Factoring: (x − 2)(x − 3) = 0 → x = 2 or x = 3. Verify: 4 − 10 + 6 = 0 ✓ and 9 − 15 + 6 = 0 ✓.",
    },
    {
      id: "m4",
      question: "∫₀² 2x dx equals:",
      options: ["2", "4", "6", "8"],
      correctIndex: 1,
      explanation: "∫₀² 2x dx = [x²]₀² = 2² − 0² = 4.",
    },
    {
      id: "m5",
      question: "In a right triangle, if sin θ = 3/5, what is cos θ?",
      options: ["3/4", "4/5", "5/4", "4/3"],
      correctIndex: 1,
      explanation:
        "Using the Pythagorean identity: cos²θ = 1 − sin²θ = 1 − 9/25 = 16/25 → cos θ = 4/5.",
    },
  ],

  history: [
    {
      id: "h1",
      question: "The Battle of Adwa (1896) was significant because:",
      options: [
        "Italy colonised Ethiopia",
        "Ethiopia became part of the British Empire",
        "Ethiopia defeated Italian forces, preserving its independence",
        "The Ethiopian Emperor signed a peace treaty with France",
      ],
      correctIndex: 2,
      explanation:
        "At Adwa, Emperor Menelik II's forces decisively defeated the Italian army, making Ethiopia one of the only African nations to resist European colonisation.",
    },
    {
      id: "h2",
      question: "Which organisation was established in 1963 in Addis Ababa?",
      options: [
        "United Nations",
        "African Union",
        "Organisation of African Unity (OAU)",
        "Non-Aligned Movement",
      ],
      correctIndex: 2,
      explanation:
        "The OAU (Organisation of African Unity) was founded on 25 May 1963 in Addis Ababa with 32 member states. It was later replaced by the African Union in 2002.",
    },
    {
      id: "h3",
      question: "The Axumite Empire is best known for:",
      options: [
        "Inventing the wheel",
        "Its advanced writing system, trade, and monolithic stelae",
        "Building the first pyramids in Africa",
        "Discovering the route to India",
      ],
      correctIndex: 1,
      explanation:
        "Axum (c. 1st–7th centuries) was a major trading power with its own script (Ge'ez), currency, and towering granite obelisks called stelae.",
    },
    {
      id: "h4",
      question: "Ethiopia's 1994 Constitution established the country as a:",
      options: [
        "Unitary republic",
        "Constitutional monarchy",
        "Federal Democratic Republic",
        "Parliamentary democracy with a king",
      ],
      correctIndex: 2,
      explanation:
        "The 1994 Constitution established the Federal Democratic Republic of Ethiopia, dividing the country into ethnically-based regional states.",
    },
    {
      id: "h5",
      question:
        "Which Ethiopian emperor is credited with modernising the country in the early 20th century?",
      options: ["Tewodros II", "Yohannes IV", "Menelik II", "Haile Selassie I"],
      correctIndex: 3,
      explanation:
        "Haile Selassie I (reigned 1930–1974) modernised Ethiopia's government, established schools, joined the League of Nations, and made Addis Ababa the headquarters of the OAU.",
    },
  ],

  english: [
    {
      id: "e1",
      question: "Which sentence uses the passive voice correctly?",
      options: [
        "The students completed the assignment.",
        "The assignment was completed by the students.",
        "The students were completing the assignment.",
        "The students have completed the assignment.",
      ],
      correctIndex: 1,
      explanation:
        "Passive voice puts the object of the action as the subject. 'The assignment was completed by the students' follows the pattern: object + to-be + past participle + by + agent.",
    },
    {
      id: "e2",
      question: "The word 'benevolent' most nearly means:",
      options: ["Hostile", "Indifferent", "Kind and generous", "Cunning"],
      correctIndex: 2,
      explanation:
        "Benevolent comes from Latin bene (well) + volens (wishing). It describes someone who is kind, charitable, and generous toward others.",
    },
    {
      id: "e3",
      question: "Choose the sentence with correct subject-verb agreement:",
      options: [
        "The team are playing well.",
        "Neither the students nor the teacher are late.",
        "Each of the books was returned.",
        "The committee have made their decision.",
      ],
      correctIndex: 2,
      explanation:
        "'Each' is always singular, so it takes a singular verb: 'Each of the books was returned.' The others involve collective nouns or 'neither…nor' constructions that require different handling.",
    },
    {
      id: "e4",
      question: "A 'metaphor' is a figure of speech that:",
      options: [
        "Uses 'like' or 'as' to compare two things",
        "Directly states that one thing is another",
        "Gives human traits to non-human things",
        "Exaggerates for emphasis",
      ],
      correctIndex: 1,
      explanation:
        "A metaphor makes a direct comparison without using 'like' or 'as' (e.g., 'Life is a journey'). A simile uses 'like/as'; personification gives human traits; hyperbole exaggerates.",
    },
    {
      id: "e5",
      question:
        "Which punctuation mark introduces a list or a clause that explains the preceding statement?",
      options: ["Semicolon (;)", "Colon (:)", "Comma (,)", "Dash (—)"],
      correctIndex: 1,
      explanation:
        "A colon (:) introduces lists (e.g., 'I need three things: water, food, shelter') or clauses that amplify the main statement.",
    },
  ],

  general: [
    {
      id: "g1",
      question: "Critical thinking primarily involves:",
      options: [
        "Accepting information at face value",
        "Memorising facts quickly",
        "Analysing, evaluating, and reasoning about information",
        "Repeating what an authority figure says",
      ],
      correctIndex: 2,
      explanation:
        "Critical thinking is the ability to analyse information objectively, evaluate evidence, and form well-reasoned judgements rather than accepting claims uncritically.",
    },
    {
      id: "g2",
      question: "In academic writing, a 'thesis statement' is:",
      options: [
        "The title of your essay",
        "A question you plan to answer",
        "The main argument or central claim of your paper",
        "A summary written at the end",
      ],
      correctIndex: 2,
      explanation:
        "A thesis statement presents the central argument of an essay, typically appearing at the end of the introduction. It guides the entire paper.",
    },
    {
      id: "g3",
      question: "The scientific method begins with:",
      options: [
        "Forming a hypothesis",
        "Observing a phenomenon",
        "Conducting an experiment",
        "Drawing conclusions",
      ],
      correctIndex: 1,
      explanation:
        "The scientific method starts with observation of a phenomenon, which then leads to a question, a hypothesis, experimentation, data analysis, and conclusions.",
    },
    {
      id: "g4",
      question: "Time management is important for students primarily because:",
      options: [
        "It allows students to sleep more",
        "It reduces the need to study",
        "It helps balance study, rest, and personal activities effectively",
        "It ensures students always finish before deadlines",
      ],
      correctIndex: 2,
      explanation:
        "Good time management allows students to allocate appropriate time for study, rest, socialising, and co-curricular activities, reducing stress and improving academic performance.",
    },
    {
      id: "g5",
      question: "Plagiarism is:",
      options: [
        "Citing someone else's work with attribution",
        "Summarising a source in your own words",
        "Presenting another person's ideas as your own without attribution",
        "Writing a paraphrase in quotation marks",
      ],
      correctIndex: 2,
      explanation:
        "Plagiarism is using another person's words, ideas, or work without proper acknowledgement. It is a serious academic offence in all educational institutions.",
    },
  ],
};

const notePools: Record<string, AINote> = {
  physics: {
    keyConcepts: [
      "Newton's three laws of motion govern all mechanical interactions",
      "Energy is conserved in all isolated systems (cannot be created or destroyed)",
      "Velocity is a vector quantity; speed is its scalar equivalent",
      "Work = Force × Distance × cos θ (only the component along motion counts)",
      "Power = Work / Time, measured in Watts (W)",
    ],
    definitions: [
      {
        term: "Inertia",
        definition: "The resistance of an object to changes in its state of motion or rest",
      },
      {
        term: "Momentum",
        definition: "The product of an object's mass and velocity (p = mv); a vector quantity",
      },
      {
        term: "Kinetic Energy",
        definition: "Energy possessed by an object due to its motion: KE = ½mv²",
      },
      {
        term: "Potential Energy",
        definition: "Stored energy due to an object's position or state: PE = mgh (gravitational)",
      },
      { term: "Acceleration", definition: "The rate of change of velocity with time: a = Δv/Δt" },
    ],
    summary:
      "Physics studies matter, energy, and their interactions. The foundational principles — Newton's laws, conservation of energy, and kinematics — explain everything from a falling apple to planetary orbits. Mastering the distinction between scalars and vectors, and applying formulae (v² = u² + 2as, KE = ½mv²) consistently is key to solving exam problems.",
    studyTips: [
      "Always define variables with units before substituting into formulae",
      "Draw free-body diagrams for all forces problems",
      "Memorise the five kinematic equations and know when each applies",
    ],
  },

  biology: {
    keyConcepts: [
      "The cell is the fundamental unit of all living organisms",
      "DNA carries genetic information; RNA translates it into proteins",
      "Photosynthesis converts light energy into chemical energy (glucose)",
      "Cellular respiration releases ATP from glucose: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP",
      "Mendel's laws (segregation and independent assortment) govern inheritance",
    ],
    definitions: [
      {
        term: "Mitosis",
        definition:
          "Cell division producing two genetically identical daughter cells; used for growth and repair",
      },
      {
        term: "Meiosis",
        definition:
          "Reduction division producing four haploid gametes; introduces genetic variation",
      },
      {
        term: "Enzyme",
        definition:
          "A biological catalyst (protein) that speeds up chemical reactions without being consumed",
      },
      {
        term: "Allele",
        definition:
          "One of two or more alternative forms of a gene occupying the same locus on a chromosome",
      },
      {
        term: "Osmosis",
        definition:
          "The diffusion of water molecules across a semi-permeable membrane from high to low concentration",
      },
    ],
    summary:
      "Biology explores life at every scale — from the molecular machinery inside cells (DNA, proteins, enzymes) to ecosystems. The central dogma (DNA → RNA → Protein) underpins all of molecular biology. For the Exit Exam, focus on cell organelles, the cell cycle, genetics (Punnett squares, Mendel), photosynthesis vs. respiration equations, and human body systems.",
    studyTips: [
      "Draw and label all diagrams (cell, chloroplast, mitochondrion) from memory",
      "Practice Punnett squares for monohybrid and dihybrid crosses",
      "Compare and contrast mitosis vs meiosis in a table",
    ],
  },

  chemistry: {
    keyConcepts: [
      "Elements are arranged in the periodic table by increasing atomic number",
      "Ionic bonds form by electron transfer; covalent bonds form by electron sharing",
      "The mole concept links microscopic particles to measurable masses",
      "Acids donate H⁺ ions; bases accept H⁺ ions (Brønsted–Lowry definition)",
      "Le Chatelier's principle: a system at equilibrium shifts to oppose disturbances",
    ],
    definitions: [
      {
        term: "Valence Electron",
        definition: "Electrons in the outermost shell of an atom that participate in bonding",
      },
      {
        term: "Molarity",
        definition:
          "The concentration of a solution expressed as moles of solute per litre of solution (mol/L)",
      },
      {
        term: "Oxidation",
        definition: "Loss of electrons by a substance; opposite of reduction (OIL RIG mnemonic)",
      },
      {
        term: "Electronegativity",
        definition:
          "The ability of an atom to attract bonding electrons toward itself in a covalent bond",
      },
      {
        term: "Buffer",
        definition:
          "A solution that resists changes in pH upon the addition of small amounts of acid or base",
      },
    ],
    summary:
      "Chemistry connects atomic structure to macroscopic properties. Master the periodic trends (atomic radius, electronegativity, ionisation energy), types of chemical bonds, stoichiometry (mole calculations), and reaction types (synthesis, decomposition, redox). Understanding equilibrium and acids/bases is essential for the natural science Exit Exam.",
    studyTips: [
      "Memorise the first 20 elements of the periodic table with their symbols",
      "Use OIL RIG to remember oxidation (loses electrons) vs reduction (gains electrons)",
      "Practice balancing equations step by step — start with the most complex molecule",
    ],
  },

  math: {
    keyConcepts: [
      "Differentiation measures the rate of change; integration measures accumulated area",
      "The quadratic formula x = (−b ± √(b²−4ac)) / 2a solves any quadratic equation",
      "Trigonometric identities (sin²θ + cos²θ = 1) are foundational for solving equations",
      "Matrices and determinants are used to solve systems of linear equations",
      "Probability P(A) = favourable outcomes / total outcomes (for equally likely events)",
    ],
    definitions: [
      {
        term: "Derivative",
        definition:
          "The instantaneous rate of change of a function at a given point: f′(x) = lim(Δx→0) [f(x+Δx)−f(x)]/Δx",
      },
      {
        term: "Integral",
        definition: "The anti-derivative; geometrically represents the area under a curve",
      },
      {
        term: "Logarithm",
        definition:
          "The exponent to which a base must be raised to produce a given number: if bˣ = y, then log_b(y) = x",
      },
      {
        term: "Vector",
        definition:
          "A quantity with both magnitude and direction, represented as an arrow or ordered tuple",
      },
      {
        term: "Asymptote",
        definition:
          "A line that a curve approaches but never reaches as the variable tends to infinity",
      },
    ],
    summary:
      "Mathematics for the Ethiopian Exit Exam covers algebra, trigonometry, calculus, statistics, and probability. Build strong foundations in algebraic manipulation and factoring before moving to calculus. The differentiation and integration rules (power rule, chain rule, product rule) should be automatic. Statistics questions often focus on mean, median, mode, and standard deviation.",
    studyTips: [
      "Practice 10 integration and differentiation problems daily to build muscle memory",
      "Always verify your answer to quadratic equations by substituting back",
      "Sketch graphs whenever possible — visual reasoning catches many errors",
    ],
  },

  history: {
    keyConcepts: [
      "Ethiopia is one of the oldest civilizations in the world, with continuous statehood for over 3,000 years",
      "The Battle of Adwa (1896) is Africa's most celebrated victory against colonial invasion",
      "The Axumite Empire was a major Red Sea trading power and one of the first to adopt Christianity",
      "The 1994 Ethiopian Constitution introduced ethnic federalism, dividing the country into regional states",
      "The African Union (AU), successor to the OAU, is headquartered in Addis Ababa",
    ],
    definitions: [
      {
        term: "Ethnic Federalism",
        definition:
          "A political arrangement that divides a country into sub-national units based on ethnic identity",
      },
      {
        term: "Colonialism",
        definition:
          "The policy of acquiring political control over another country and exploiting it economically",
      },
      {
        term: "Sovereignty",
        definition:
          "The supreme authority of a state to govern itself without external interference",
      },
      {
        term: "Stelae",
        definition:
          "Tall monolithic stone monuments erected in ancient Axum, some reaching 24 metres in height",
      },
      {
        term: "Ge'ez",
        definition:
          "The ancient Ethiopic script and liturgical language used by the Ethiopian Orthodox Church, still in religious use today",
      },
    ],
    summary:
      "Ethiopian history spans ancient Axum, medieval Christian kingdoms, the Gondarine period, the Era of Princes, the modernising 19th-century emperors, Italian occupation (1936–1941), the imperial era under Haile Selassie, the Derg military regime (1974–1991), and the current federal period. For the Exit Exam, prioritise timelines, key figures, constitutional milestones, and Ethiopia's role in African affairs.",
    studyTips: [
      "Create a timeline from Axum (1st century CE) to the present day with 15 key events",
      "Memorise Ethiopian emperors in order: Tewodros II → Yohannes IV → Menelik II → Haile Selassie I",
      "Understand the structural difference between the 1955 and 1994 Constitutions",
    ],
  },

  english: {
    keyConcepts: [
      "Active voice places the subject as the doer; passive voice places the recipient as the subject",
      "A thesis statement is the central argument of an essay, usually in the introduction",
      "Figurative language (metaphor, simile, personification, hyperbole) enriches writing",
      "Subject-verb agreement requires singular subjects to take singular verbs",
      "Punctuation (commas, semicolons, colons, apostrophes) controls sentence rhythm and clarity",
    ],
    definitions: [
      {
        term: "Metaphor",
        definition:
          "A direct comparison stating one thing is another (e.g., 'Time is money') without using 'like' or 'as'",
      },
      {
        term: "Inference",
        definition:
          "A conclusion drawn from evidence and reasoning, not stated explicitly in the text",
      },
      {
        term: "Tone",
        definition:
          "The author's attitude toward the subject or audience, conveyed through word choice and style",
      },
      {
        term: "Coherence",
        definition: "The logical flow and connection between ideas in a paragraph or essay",
      },
      {
        term: "Clause",
        definition:
          "A group of words containing a subject and a verb; an independent clause can stand alone as a sentence",
      },
    ],
    summary:
      "English at the Exit Exam level tests reading comprehension, grammar, vocabulary, and writing skills. Focus on identifying main ideas and supporting details in passages, recognising figurative language, applying grammar rules (tenses, agreement, punctuation), and understanding the structure of academic essays (introduction, body paragraphs, conclusion).",
    studyTips: [
      "Read one English newspaper article daily and summarise it in 3 sentences",
      "Practice writing 5-paragraph essays on Ethiopian social issues",
      "Create vocabulary flashcards: learn 10 new academic words per week",
    ],
  },

  general: {
    keyConcepts: [
      "Critical thinking involves analysing, evaluating, and synthesising information before drawing conclusions",
      "Effective study strategies include spaced repetition, active recall, and interleaved practice",
      "Academic integrity means presenting your own work and properly crediting sources",
      "Time management: allocate time proportionally to the difficulty and weight of each subject",
      "Communication skills (reading, writing, speaking, listening) underpin all academic success",
    ],
    definitions: [
      {
        term: "Critical Thinking",
        definition:
          "The disciplined process of actively analysing and evaluating information to guide belief and action",
      },
      {
        term: "Plagiarism",
        definition:
          "Using another person's words, ideas, or work without proper attribution, presented as one's own",
      },
      {
        term: "Synthesis",
        definition:
          "Combining information from multiple sources to form a new, unified understanding",
      },
      {
        term: "Abstract Reasoning",
        definition:
          "The ability to analyse patterns, relationships, and ideas that are not concrete or physical",
      },
      {
        term: "Metacognition",
        definition:
          "Thinking about your own thinking; awareness and regulation of one's learning process",
      },
    ],
    summary:
      "Study skills and general knowledge form the foundation of academic success. Learning how to learn — through active recall, spaced repetition, and self-testing — produces better results than passive re-reading. Managing your time, maintaining academic integrity, and developing strong communication skills will serve you far beyond the Exit Exam.",
    studyTips: [
      "Use the Pomodoro technique: 25-minute focused study sessions with 5-minute breaks",
      "Test yourself with past papers — retrieval practice beats re-reading every time",
      "Sleep 7–8 hours during exam season; consolidation happens during sleep",
    ],
  },
};

// ─── Extra questions extending each pool to 10 ───────────────────────────────

const extraQuestions: Record<string, AIQuestion[]> = {
  physics: [
    {
      id: "p6",
      question: "A wave has a period of 0.02 s. What is its frequency?",
      options: ["5 Hz", "20 Hz", "50 Hz", "500 Hz"],
      correctIndex: 2,
      explanation:
        "Frequency = 1 / Period = 1 / 0.02 = 50 Hz. Frequency and period are reciprocals.",
    },
    {
      id: "p7",
      question: "Ohm's Law states that voltage (V) equals:",
      options: [
        "Current ÷ Resistance",
        "Current × Resistance",
        "Resistance ÷ Current",
        "Current + Resistance",
      ],
      correctIndex: 1,
      explanation:
        "Ohm's Law: V = I × R. Voltage equals current (amperes) multiplied by resistance (ohms).",
    },
    {
      id: "p8",
      question: "Gravitational acceleration on Earth's surface is approximately:",
      options: ["5.8 m/s²", "9.8 m/s²", "12 m/s²", "15 m/s²"],
      correctIndex: 1,
      explanation:
        "g ≈ 9.8 m/s² (often rounded to 10 m/s² in calculations). It acts downward toward Earth's centre.",
    },
    {
      id: "p9",
      question: "In uniform circular motion, the centripetal acceleration points:",
      options: [
        "Tangentially along velocity",
        "Outward from the centre",
        "Toward the centre",
        "Downward always",
      ],
      correctIndex: 2,
      explanation:
        "Centripetal acceleration always points toward the centre of the circle, causing the change in direction of the velocity vector.",
    },
    {
      id: "p10",
      question: "Heat transfer through direct contact between substances is called:",
      options: ["Convection", "Radiation", "Induction", "Conduction"],
      correctIndex: 3,
      explanation:
        "Conduction transfers heat through physical contact — e.g. a metal spoon heating up in hot soup.",
    },
  ],
  biology: [
    {
      id: "b6",
      question: "Which blood cells are primarily responsible for carrying oxygen?",
      options: ["White blood cells", "Platelets", "Plasma proteins", "Red blood cells"],
      correctIndex: 3,
      explanation:
        "Red blood cells (erythrocytes) contain haemoglobin, which binds oxygen in the lungs and releases it to body tissues.",
    },
    {
      id: "b7",
      question: "Insulin is produced by which organ?",
      options: ["Liver", "Pancreas", "Kidney", "Adrenal gland"],
      correctIndex: 1,
      explanation:
        "The beta cells of the pancreatic islets of Langerhans produce insulin, which lowers blood glucose by promoting cellular uptake.",
    },
    {
      id: "b8",
      question: "Which part of the brain controls balance and coordination?",
      options: ["Cerebrum", "Medulla oblongata", "Cerebellum", "Thalamus"],
      correctIndex: 2,
      explanation:
        "The cerebellum coordinates voluntary movements, balance, and fine motor control. Damage causes ataxia (unsteady movements).",
    },
    {
      id: "b9",
      question: "Which vitamin is essential for blood clotting?",
      options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"],
      correctIndex: 3,
      explanation:
        "Vitamin K is required for the synthesis of clotting factors (II, VII, IX, X). Deficiency leads to prolonged bleeding.",
    },
    {
      id: "b10",
      question: "The process of converting glucose to ATP without oxygen is called:",
      options: ["Aerobic respiration", "Photosynthesis", "Anaerobic fermentation", "Transpiration"],
      correctIndex: 2,
      explanation:
        "Anaerobic fermentation (glycolysis without O₂) produces ATP and lactic acid (in animals) or ethanol+CO₂ (in yeast), yielding only 2 ATP per glucose.",
    },
  ],
  chemistry: [
    {
      id: "c6",
      question:
        "The number of electrons in the outermost shell of a noble gas (other than helium) is:",
      options: ["2", "4", "6", "8"],
      correctIndex: 3,
      explanation:
        "Noble gases (Ne, Ar, Kr, Xe) have 8 valence electrons — a full outer shell — making them chemically inert.",
    },
    {
      id: "c7",
      question: "Which of the following is a physical change?",
      options: ["Burning wood", "Rusting iron", "Melting ice", "Baking a cake"],
      correctIndex: 2,
      explanation:
        "Melting ice is a physical change — only the state changes (solid → liquid); the chemical composition (H₂O) remains the same.",
    },
    {
      id: "c8",
      question: "The chemical formula for sulfuric acid is:",
      options: ["HCl", "H₂SO₄", "H₂SO₃", "H₃PO₄"],
      correctIndex: 1,
      explanation:
        "Sulfuric acid is H₂SO₄ (2 hydrogen, 1 sulfur, 4 oxygen). It is a strong diprotic acid widely used in industry.",
    },
    {
      id: "c9",
      question: "An exothermic reaction:",
      options: [
        "Absorbs heat from surroundings",
        "Releases heat to surroundings",
        "Has no energy change",
        "Only occurs with UV light",
      ],
      correctIndex: 1,
      explanation:
        "Exothermic reactions release energy (heat) to the surroundings, so the products have lower energy than the reactants. Examples include combustion and neutralisation.",
    },
    {
      id: "c10",
      question: "The pH of a solution with [H⁺] = 10⁻³ mol/L is:",
      options: ["3", "7", "11", "13"],
      correctIndex: 0,
      explanation: "pH = −log[H⁺] = −log(10⁻³) = 3. This is an acidic solution (pH < 7).",
    },
  ],
  math: [
    {
      id: "m6",
      question: "The sum of interior angles in a triangle is:",
      options: ["90°", "180°", "270°", "360°"],
      correctIndex: 1,
      explanation:
        "The interior angles of any triangle always sum to 180°. This is a fundamental theorem of Euclidean geometry.",
    },
    {
      id: "m7",
      question: "Which of the following numbers is irrational?",
      options: ["√9", "√16", "√2", "0.5"],
      correctIndex: 2,
      explanation:
        "√2 ≈ 1.41421… is non-terminating and non-repeating, so it is irrational. √9 = 3 and √16 = 4 are integers; 0.5 = 1/2 is rational.",
    },
    {
      id: "m8",
      question: "If a set has 4 elements, how many subsets does it have?",
      options: ["8", "12", "16", "32"],
      correctIndex: 2,
      explanation:
        "A set with n elements has 2ⁿ subsets. For n = 4: 2⁴ = 16 subsets (including the empty set and the set itself).",
    },
    {
      id: "m9",
      question: "The gradient (slope) of a horizontal line is:",
      options: ["Undefined", "1", "0", "−1"],
      correctIndex: 2,
      explanation:
        "A horizontal line has no vertical change (rise = 0), so gradient = rise/run = 0/run = 0.",
    },
    {
      id: "m10",
      question: "What is 5! (5 factorial)?",
      options: ["25", "60", "120", "720"],
      correctIndex: 2,
      explanation:
        "5! = 5 × 4 × 3 × 2 × 1 = 120. Factorials count permutations — the number of ways to arrange n distinct objects.",
    },
  ],
  history: [
    {
      id: "h6",
      question:
        "Emperor Tewodros II unified Ethiopia after defeating rival lords in approximately:",
      options: ["The 1830s", "The 1850s", "The 1870s", "The 1890s"],
      correctIndex: 1,
      explanation:
        "Tewodros II came to power in 1855, unifying a fragmented Ethiopia after the Era of the Princes (Zemene Mesafint), beginning the modern Ethiopian state.",
    },
    {
      id: "h7",
      question: "The Derg military regime came to power in Ethiopia in:",
      options: ["1960", "1967", "1974", "1980"],
      correctIndex: 2,
      explanation:
        "The Derg (Coordinating Committee of the Armed Forces) deposed Emperor Haile Selassie in September 1974, ending the imperial era and establishing a Marxist military government.",
    },
    {
      id: "h8",
      question: "Which country occupied Ethiopia from 1936 to 1941?",
      options: ["Britain", "France", "Italy", "Germany"],
      correctIndex: 2,
      explanation:
        "Italy invaded and occupied Ethiopia from May 1936 to April 1941, when British and Ethiopian forces liberated the country and restored Haile Selassie.",
    },
    {
      id: "h9",
      question: "The Organisation of African Unity (OAU) was replaced by the African Union in:",
      options: ["1999", "2002", "2005", "2010"],
      correctIndex: 1,
      explanation:
        "The AU was officially launched on 9 July 2002 in Durban, South Africa, replacing the OAU with a stronger mandate including economic integration and conflict resolution.",
    },
    {
      id: "h10",
      question: "Haile Selassie's pre-coronation name was:",
      options: ["Ras Teferi Mekonnen", "Ras Mikael Ali", "Ras Gobena Dachi", "Ras Woldemariam"],
      correctIndex: 0,
      explanation:
        "Before his coronation as Emperor in 1930, Haile Selassie was known as Ras Teferi Mekonnen, son of Ras Mekonnen Wolde Mikael.",
    },
  ],
  english: [
    {
      id: "e6",
      question: "A simile compares two things using:",
      options: ["Direct identification", "'Like' or 'as'", "Contrast", "Alliteration"],
      correctIndex: 1,
      explanation:
        "Similes use 'like' or 'as' to draw comparisons (e.g. 'He runs like the wind'). Without these words, the comparison becomes a metaphor.",
    },
    {
      id: "e7",
      question: "The correct plural of 'criterion' is:",
      options: ["criterions", "criteria", "criterias", "criterion"],
      correctIndex: 1,
      explanation:
        "'Criterion' is a Greek-origin word whose plural is 'criteria'. Using 'criterias' is a common error.",
    },
    {
      id: "e8",
      question: "Which sentence uses the future perfect tense?",
      options: ["She will go.", "She went.", "She will have finished.", "She has finished."],
      correctIndex: 2,
      explanation:
        "Future perfect = will have + past participle. 'She will have finished' describes an action that will be completed before a future point.",
    },
    {
      id: "e9",
      question: "The antonym of 'benevolent' is:",
      options: ["Generous", "Kind", "Malevolent", "Charitable"],
      correctIndex: 2,
      explanation:
        "Malevolent means wishing ill toward others — the direct opposite of benevolent (wishing well). Both share the Latin 'volens' (wishing).",
    },
    {
      id: "e10",
      question: "Which is an example of a compound sentence?",
      options: [
        "She ran fast.",
        "Because she was tired, she sat down.",
        "She ran and he walked.",
        "Running quickly.",
      ],
      correctIndex: 2,
      explanation:
        "A compound sentence joins two independent clauses with a conjunction. 'She ran and he walked' has two clauses (each with subject + verb) joined by 'and'.",
    },
  ],
  general: [
    {
      id: "g6",
      question: "Which study strategy involves spreading study sessions over time?",
      options: ["Massed practice", "Spaced repetition", "Rote memorisation", "Passive reading"],
      correctIndex: 1,
      explanation:
        "Spaced repetition (distributed practice) leverages the 'spacing effect' — revisiting material at increasing intervals dramatically improves long-term retention.",
    },
    {
      id: "g7",
      question: "In a normal distribution, the mean, median, and mode are:",
      options: [
        "Always different",
        "All equal",
        "In ascending order left to right",
        "Never calculable",
      ],
      correctIndex: 1,
      explanation:
        "In a perfect normal (bell-shaped) distribution, the mean = median = mode, all located at the centre of the symmetric curve.",
    },
    {
      id: "g8",
      question: "Conducting a face-to-face interview for a research project is an example of:",
      options: ["Secondary research", "Desk research", "Primary research", "Meta-analysis"],
      correctIndex: 2,
      explanation:
        "Primary research involves collecting original data first-hand (surveys, interviews, experiments). Secondary research uses existing sources.",
    },
    {
      id: "g9",
      question: "A 'peer-reviewed' article has been evaluated by:",
      options: ["Editors only", "Government officials", "Experts in the same field", "Students"],
      correctIndex: 2,
      explanation:
        "Peer review is a quality-control process in academic publishing: other experts (peers) in the field assess the methodology, results, and conclusions before publication.",
    },
    {
      id: "g10",
      question: "Which of the following best describes a 'logical fallacy'?",
      options: [
        "A proven scientific fact",
        "An error in reasoning that makes an argument invalid",
        "A well-supported hypothesis",
        "A peer-reviewed finding",
      ],
      correctIndex: 1,
      explanation:
        "A logical fallacy is a flaw in reasoning that undermines an argument's validity. Examples include ad hominem, straw man, and false dichotomy.",
    },
  ],
};

// Merge pools to 10 questions each
for (const key of Object.keys(extraQuestions)) {
  if (questionPools[key]) {
    questionPools[key] = [...questionPools[key], ...extraQuestions[key]];
  }
}

function shuffleAndTake(arr: AIQuestion[], n: number): AIQuestion[] {
  const result: AIQuestion[] = [];
  while (result.length < n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    result.push(...shuffled);
  }
  return result.slice(0, n);
}

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;

// ─── Subject detection ────────────────────────────────────────────────────────

function detectSubject(filename: string): string {
  const f = filename.toLowerCase();
  if (f.includes("phys") || f.includes("motion") || f.includes("force") || f.includes("wave"))
    return "physics";
  if (
    f.includes("bio") ||
    f.includes("cell") ||
    f.includes("gene") ||
    f.includes("dna") ||
    f.includes("organ")
  )
    return "biology";
  if (
    f.includes("chem") ||
    f.includes("react") ||
    f.includes("acid") ||
    f.includes("mole") ||
    f.includes("atom")
  )
    return "chemistry";
  if (
    f.includes("math") ||
    f.includes("calc") ||
    f.includes("alg") ||
    f.includes("trig") ||
    f.includes("stat")
  )
    return "math";
  if (
    f.includes("hist") ||
    f.includes("civic") ||
    f.includes("social") ||
    f.includes("ethio") ||
    f.includes("axum")
  )
    return "history";
  if (
    f.includes("eng") ||
    f.includes("liter") ||
    f.includes("grammar") ||
    f.includes("essay") ||
    f.includes("write")
  )
    return "english";
  return "general";
}

function subjectLabel(subject: string): string {
  const labels: Record<string, string> = {
    physics: "General Physics",
    biology: "General Biology",
    chemistry: "General Chemistry",
    math: "Mathematics",
    history: "History & Civics",
    english: "English Language",
    general: "General Studies",
  };
  return labels[subject] ?? "General Studies";
}

// ─── Real file reading (client-side only — no backend to send files to) ──────

const MAX_AI_FILE_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "txt"];
/** Extensions with reliable, structured text extraction in the browser. */
const CONTENT_READABLE_EXTENSIONS = ["pdf", "txt", "docx", "pptx"];

function fileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function validateFile(file: File): string | null {
  const ext = fileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `"${file.name}" isn't a supported file type. Upload a PDF, DOC, DOCX, PPT, PPTX or TXT file.`;
  }
  if (file.size === 0) {
    return `"${file.name}" appears to be empty.`;
  }
  if (file.size > MAX_AI_FILE_BYTES) {
    return `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB — over the 50 MB limit.`;
  }
  return null;
}

// pdfjs-dist references browser-only globals (DOMMatrix, etc.), so it must never load
// during SSR — dynamic import keeps it out of the module graph until actually invoked
// from a client-side event handler.
let pdfjsModulePromise: ReturnType<typeof loadPdfjs> | null = null;

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return pdfjs;
}

async function extractPdfText(file: File, maxPages = 8): Promise<string> {
  if (!pdfjsModulePromise) pdfjsModulePromise = loadPdfjs();
  const { getDocument } = await pdfjsModulePromise;

  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const pageTexts: string[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pageTexts.push(pageText);
  }
  return pageTexts.join("\n");
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/** DOCX is a zip of OOXML — pull the raw document body and strip markup. */
async function extractDocxText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const entries = unzipSync(new Uint8Array(buffer), {
    filter: (entry) => entry.name === "word/document.xml",
  });
  const xmlBytes = entries["word/document.xml"];
  if (!xmlBytes) return "";
  const xml = strFromU8(xmlBytes);
  const withBreaks = xml.replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, " ");
  return decodeXmlEntities(withBreaks)
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** PPTX is a zip of one XML file per slide — pull the visible text runs from each. */
async function extractPptxText(file: File, maxSlides = 40): Promise<string> {
  const buffer = await file.arrayBuffer();
  const entries = unzipSync(new Uint8Array(buffer), {
    filter: (entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.name),
  });
  const slideNames = Object.keys(entries).sort((a, b) => {
    const na = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
    const nb = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
    return na - nb;
  });

  const slideTexts = slideNames.slice(0, maxSlides).map((name) => {
    const xml = strFromU8(entries[name]);
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => decodeXmlEntities(m[1]));
    return runs.join(" ");
  });
  return slideTexts.join("\n").trim();
}

/**
 * Legacy .doc/.ppt are proprietary OLE binary formats — no practical in-browser parser.
 * Fall back to a "strings"-style scan for runs of printable text (ASCII or UTF-16LE,
 * whichever yields more), since these formats store their text streams that way. It's
 * noisy, so detectSubjectFromText's confidence threshold decides whether to trust it.
 */
function scanPrintableAscii(bytes: Uint8Array, minRun: number): string {
  const runs: string[] = [];
  let current = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte >= 0x20 && byte <= 0x7e) {
      current += String.fromCharCode(byte);
    } else {
      if (current.length >= minRun) runs.push(current);
      current = "";
    }
  }
  if (current.length >= minRun) runs.push(current);
  return runs.join(" ");
}

function scanPrintableUtf16(bytes: Uint8Array, minRun: number): string {
  const runs: string[] = [];
  let current = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const lo = bytes[i];
    const hi = bytes[i + 1];
    if (hi === 0 && lo >= 0x20 && lo <= 0x7e) {
      current += String.fromCharCode(lo);
    } else {
      if (current.length >= minRun) runs.push(current);
      current = "";
    }
  }
  if (current.length >= minRun) runs.push(current);
  return runs.join(" ");
}

async function extractLegacyOfficeText(file: File, maxBytesToScan = 400_000): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer).subarray(0, maxBytesToScan);
  const ascii = scanPrintableAscii(bytes, 4);
  const utf16 = scanPrintableUtf16(bytes, 4);
  return utf16.length > ascii.length ? utf16 : ascii;
}

/** Best-effort text extraction — every format is at least attempted client-side. */
async function extractFileText(file: File): Promise<string> {
  const ext = fileExtension(file.name);
  try {
    if (ext === "txt") return await file.text();
    if (ext === "pdf") return await extractPdfText(file);
    if (ext === "docx") return await extractDocxText(file);
    if (ext === "pptx") return await extractPptxText(file);
    if (ext === "doc" || ext === "ppt") return await extractLegacyOfficeText(file);
  } catch {
    return "";
  }
  return "";
}

// Lightweight keyword-frequency classifier — no external API, runs entirely offline.
const subjectKeywords: Record<string, string[]> = {
  physics: [
    "force",
    "velocity",
    "acceleration",
    "newton",
    "energy",
    "momentum",
    "gravity",
    "motion",
    "wave",
    "electric",
    "voltage",
    "current",
    "kinematics",
    "friction",
    "torque",
    "thermodynamics",
    "kinetic",
    "potential energy",
  ],
  biology: [
    "cell",
    "dna",
    "rna",
    "gene",
    "organism",
    "photosynthesis",
    "mitosis",
    "meiosis",
    "enzyme",
    "protein",
    "chromosome",
    "ecosystem",
    "evolution",
    "organelle",
    "membrane",
    "tissue",
    "species",
    "mitochondria",
  ],
  chemistry: [
    "atom",
    "molecule",
    "mole ",
    "reaction",
    "acid",
    "base",
    "bond",
    "electron",
    "compound",
    "solution",
    "oxidation",
    "reduction",
    "equilibrium",
    "periodic table",
    "element",
    "ion",
    "ph ",
  ],
  math: [
    "function",
    "derivative",
    "integral",
    "equation",
    "matrix",
    "probability",
    "theorem",
    "variable",
    "algebra",
    "calculus",
    "trigonometry",
    "statistics",
    "logarithm",
    "coefficient",
    "geometry",
  ],
  history: [
    "ethiopia",
    "emperor",
    "empire",
    "constitution",
    "colonial",
    "axum",
    "adwa",
    "independence",
    "government",
    "revolution",
    "monarchy",
    "century",
    "treaty",
    "war",
    "federation",
  ],
  english: [
    "sentence",
    "grammar",
    "paragraph",
    "essay",
    "vocabulary",
    "tense",
    "clause",
    "metaphor",
    "comprehension",
    "punctuation",
    "noun",
    "verb",
    "syntax",
  ],
};

const SUBJECT_MATCH_MIN_SCORE = 3;
const MIN_TEXT_LENGTH_FOR_DETECTION = 60;

function detectSubjectFromText(text: string): string | null {
  if (text.trim().length < MIN_TEXT_LENGTH_FOR_DETECTION) return null;
  const lower = text.toLowerCase();
  let best: { subject: string; score: number } | null = null;
  for (const [subject, keywords] of Object.entries(subjectKeywords)) {
    let score = 0;
    for (const word of keywords) {
      score += lower.split(word).length - 1;
    }
    if (!best || score > best.score) best = { subject, score };
  }
  return best && best.score >= SUBJECT_MATCH_MIN_SCORE ? best.subject : null;
}

function cleanExcerpt(text: string, maxLength = 480): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;
  return `${collapsed.slice(0, maxLength).trimEnd()}…`;
}

// subject → { banner gradient, badge text colour, accent colour for borders/highlights }
const subjectTheme: Record<string, { banner: string; badge: string; accent: string; dot: string }> =
  {
    physics: {
      banner: "from-blue-700 via-blue-600 to-indigo-700",
      badge: "bg-blue-100 text-blue-800",
      accent: "border-blue-400",
      dot: "bg-blue-400",
    },
    biology: {
      banner: "from-emerald-700 via-green-600 to-teal-700",
      badge: "bg-emerald-100 text-emerald-800",
      accent: "border-emerald-400",
      dot: "bg-emerald-400",
    },
    chemistry: {
      banner: "from-purple-700 via-violet-600 to-purple-800",
      badge: "bg-purple-100 text-purple-800",
      accent: "border-purple-400",
      dot: "bg-purple-400",
    },
    math: {
      banner: "from-orange-600 via-amber-600 to-yellow-600",
      badge: "bg-orange-100 text-orange-800",
      accent: "border-orange-400",
      dot: "bg-orange-400",
    },
    history: {
      banner: "from-amber-700 via-yellow-700 to-orange-700",
      badge: "bg-amber-100 text-amber-800",
      accent: "border-amber-400",
      dot: "bg-amber-400",
    },
    english: {
      banner: "from-pink-700 via-rose-600 to-red-700",
      badge: "bg-pink-100 text-pink-800",
      accent: "border-pink-400",
      dot: "bg-pink-400",
    },
    general: {
      banner: "from-slate-700 via-slate-600 to-brand-navy",
      badge: "bg-slate-100 text-slate-700",
      accent: "border-slate-400",
      dot: "bg-slate-400",
    },
  };

const ACCEPT_TYPES = ".pdf,.doc,.docx,.ppt,.pptx,.txt";

const FILE_TYPES = [
  { ext: "PDF", color: "bg-red-50 text-red-600 border-red-200", fullAnalysis: true },
  { ext: "PPT", color: "bg-orange-50 text-orange-600 border-orange-200", fullAnalysis: false },
  { ext: "PPTX", color: "bg-orange-50 text-orange-600 border-orange-200", fullAnalysis: true },
  { ext: "DOC", color: "bg-blue-50 text-blue-600 border-blue-200", fullAnalysis: false },
  { ext: "DOCX", color: "bg-blue-50 text-blue-600 border-blue-200", fullAnalysis: true },
  { ext: "TXT", color: "bg-slate-50 text-slate-600 border-slate-200", fullAnalysis: true },
];

const PROCESSING_STEPS = [
  { label: "Reading file and extracting content…", icon: FileSearch },
  { label: "Analysing structure and key concepts…", icon: Brain },
  { label: "Generating exam questions and answers…", icon: ListOrdered },
  { label: "Building your personalised study notes…", icon: BookOpen },
];

const DEMO_FILE_CONTENT = `Chapter 3: Newton's Laws of Motion and Kinematics

This chapter introduces the fundamental laws of motion formulated by Isaac Newton, which
describe the relationship between a body and the forces acting upon it. Newton's first law
states that an object at rest stays at rest, and an object in motion stays in motion at
constant velocity, unless acted upon by an external force. Newton's second law defines
force as the product of mass and acceleration. Newton's third law states that for every
action there is an equal and opposite reaction.

Kinematics is the branch of physics concerned with the motion of objects without reference
to the forces that cause the motion. Key kinematic equations relate displacement, initial
velocity, final velocity, acceleration, and time. Students should be comfortable calculating
velocity, acceleration, momentum, and kinetic energy, and applying the work-energy theorem
to mechanical systems.`;

// ─── Main page ────────────────────────────────────────────────────────────────

function AiStudyPage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [result, setResult] = useState<AIResult | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingPct, setProcessingPct] = useState(0);
  const [processingFilename, setProcessingFilename] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Guards against overlapping runs (double-click, drop while already processing, etc.) —
  // only the most recent invocation is allowed to keep writing state.
  const runIdRef = useRef(0);

  const processFile = useCallback((file: File, count: number) => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const runId = (runIdRef.current += 1);
    const isCurrent = () => runIdRef.current === runId;

    const filename = file.name;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    setPhase("processing");
    setProcessingStep(0);
    setProcessingPct(0);
    setProcessingFilename(filename);

    void (async () => {
      // Step 1 is gated on real extraction, not a fake timer — but keep a floor so
      // instant local reads (tiny .txt files) don't flash past too fast to read.
      const startedAt = Date.now();
      const extractedText = await extractFileText(file);
      if (!isCurrent()) return;
      const elapsed = Date.now() - startedAt;
      if (elapsed < 700) await wait(700 - elapsed);
      if (!isCurrent()) return;

      const contentSubject = detectSubjectFromText(extractedText);
      const subject = contentSubject ?? detectSubject(filename);

      setProcessingStep(1);
      setProcessingPct(Math.round((1 / PROCESSING_STEPS.length) * 100));

      for (let step = 2; step <= PROCESSING_STEPS.length; step += 1) {
        await wait(900);
        if (!isCurrent()) return;
        setProcessingStep(step);
        setProcessingPct(Math.round((step / PROCESSING_STEPS.length) * 100));
      }
      await wait(450);
      if (!isCurrent()) return;

      const pool = questionPools[subject] ?? questionPools.general;
      setResult({
        subject,
        filename,
        questions: shuffleAndTake(pool, count),
        notes: notePools[subject] ?? notePools.general,
        excerpt: extractedText ? cleanExcerpt(extractedText) : "",
        detectionSource: contentSubject ? "content" : "filename",
      });
      setPhase("results");
    })();
  }, []);

  const tryDemo = useCallback(() => {
    const demoFile = new File([DEMO_FILE_CONTENT], "General_Physics_Ch3.txt", {
      type: "text/plain",
    });
    processFile(demoFile, questionCount);
  }, [processFile, questionCount]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, questionCount);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file, questionCount);
  };

  const reset = () => {
    runIdRef.current += 1; // invalidate any in-flight processing run
    setPhase("upload");
    setResult(null);
    setProcessingStep(0);
    setProcessingPct(0);
    setProcessingFilename("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">
        {phase === "upload" && (
          <UploadPhase
            dragOver={dragOver}
            setDragOver={setDragOver}
            onDrop={handleDrop}
            onFileInput={handleFileInput}
            onDemo={tryDemo}
            fileInputRef={fileInputRef}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
          />
        )}
        {phase === "processing" && (
          <ProcessingPhase
            step={processingStep}
            pct={processingPct}
            filename={processingFilename}
          />
        )}
        {phase === "results" && result && <ResultsPhase result={result} onReset={reset} />}
      </main>
      {phase !== "results" && <SiteFooter />}
    </div>
  );
}

// ─── Upload phase ─────────────────────────────────────────────────────────────

function UploadPhase({
  dragOver,
  setDragOver,
  onDrop,
  onFileInput,
  onDemo,
  fileInputRef,
  questionCount,
  setQuestionCount,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDemo: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  questionCount: number;
  setQuestionCount: (n: number) => void;
}) {
  return (
    <div className="animate-in fade-in-0 duration-500">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-[#1e2d5a] to-[#0f1a38] px-6 py-16 text-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 size-64 rounded-full bg-brand-gold/5 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-gold backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            AI-Powered Study Tool
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight md:text-6xl">
            Upload. Analyse. <span className="text-brand-gold">Ace the exam.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 md:text-lg">
            Drop any lecture note, textbook chapter, or past paper — our AI generates exam-style
            MCQs with explanations plus a structured study summary instantly.
          </p>

          {/* Stat pills */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { icon: ClipboardList, label: `${questionCount} MCQs generated` },
              { icon: Lightbulb, label: "Full explanations" },
              { icon: BookOpen, label: "Structured notes" },
              { icon: Zap, label: "Results in seconds" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm"
              >
                <s.icon className="size-4 text-brand-gold" />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Upload area ── */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
          }}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed px-8 py-16 text-center transition-all duration-300",
            dragOver
              ? "border-brand-gold bg-brand-gold/5 scale-[1.01] shadow-xl shadow-brand-gold/10"
              : "border-slate-200 bg-white hover:border-brand-gold/60 hover:shadow-xl hover:shadow-brand-gold/5",
          )}
        >
          {/* Animated corner blobs */}
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand-gold/8 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-brand-gold/12" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-brand-navy/5 blur-2xl transition-all duration-500 group-hover:scale-150" />

          {/* Upload icon */}
          <div
            className={cn(
              "relative mb-6 flex size-24 items-center justify-center rounded-3xl transition-all duration-300",
              dragOver
                ? "bg-brand-gold text-white scale-110 shadow-lg shadow-brand-gold/40"
                : "bg-gradient-to-br from-brand-navy/8 to-brand-navy/4 text-brand-navy group-hover:from-brand-gold/15 group-hover:to-brand-gold/5 group-hover:text-brand-gold",
            )}
          >
            <Upload
              className={cn("size-11 transition-transform duration-300", dragOver && "scale-90")}
            />
            {/* Pulsing ring when dragging */}
            {dragOver && (
              <span className="absolute inset-0 animate-ping rounded-3xl bg-brand-gold/30" />
            )}
          </div>

          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            {dragOver ? "Release to analyse" : "Drag & drop your file here"}
          </h2>
          <p className="mt-2 text-slate-500">
            or{" "}
            <span className="font-semibold text-brand-navy underline decoration-brand-gold underline-offset-4">
              click to browse
            </span>{" "}
            from your device
          </p>

          {/* File type badges */}
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {FILE_TYPES.map((f) => (
              <span
                key={f.ext}
                title={
                  f.fullAnalysis
                    ? "We read the actual text inside this file"
                    : "We generate practice questions based on the filename for this format"
                }
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-3 py-1 text-[11px] font-bold tracking-wide",
                  f.color,
                )}
              >
                {f.ext}
                {f.fullAnalysis && <CheckCircle2 className="size-3" strokeWidth={2.5} />}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            <CheckCircle2 className="mr-1 inline size-3 -translate-y-px" strokeWidth={2.5} /> = we
            read the file's actual text · Maximum file size: 50 MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_TYPES}
            onChange={onFileInput}
            className="sr-only"
            aria-label="Upload study file (PDF, DOC, DOCX, PPT, PPTX, TXT)"
          />
        </div>

        {/* Demo link */}
        <div className="mt-5 text-center">
          <p className="text-sm text-slate-500">
            Don't have a file handy?{" "}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDemo();
              }}
              className="font-semibold text-brand-navy underline decoration-brand-gold underline-offset-4 hover:text-brand-gold transition-colors"
            >
              Try the Physics demo →
            </button>
          </p>
        </div>

        {/* ── Question count selector ── */}
        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-5">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-brand-navy">How many questions?</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Choose how many MCQs to generate from your file
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUESTION_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuestionCount(n)}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-150",
                    questionCount === n
                      ? "bg-brand-navy text-white shadow-md shadow-brand-navy/20"
                      : "border border-slate-200 text-slate-600 hover:border-brand-navy/30 hover:bg-slate-50 hover:text-brand-navy",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {/* Mini progress indicator */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-slate-400">Selected:</span>
            <Progress
              value={100}
              className="h-1.5 flex-1 [&>div]:bg-brand-navy [&>div]:transition-all [&>div]:duration-300"
            />
            <span className="shrink-0 rounded-full bg-brand-gold/10 px-2.5 py-0.5 text-xs font-bold text-brand-gold">
              {questionCount} MCQs
            </span>
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="mt-12">
          <p className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            How it works
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Upload,
                color: "bg-blue-50 text-blue-600",
                ring: "ring-blue-100",
                step: "01",
                title: "Upload your material",
                desc: "PDF, PPT, DOC, DOCX or plain text — any course file works.",
              },
              {
                icon: Brain,
                color: "bg-purple-50 text-purple-600",
                ring: "ring-purple-100",
                step: "02",
                title: "AI analyses content",
                desc: "Extracts key concepts, facts, and exam-worthy topics from your file.",
              },
              {
                icon: Trophy,
                color: "bg-amber-50 text-amber-600",
                ring: "ring-amber-100",
                step: "03",
                title: "Get your study pack",
                desc: `${questionCount} MCQs with full explanations + key concepts, definitions & summary.`,
              },
            ].map((s) => (
              <div
                key={s.step}
                className="card-lift rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl ring-4",
                      s.color,
                      s.ring,
                    )}
                  >
                    <s.icon className="size-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-300">{s.step}</span>
                </div>
                <p className="font-semibold text-brand-navy">{s.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Processing phase ─────────────────────────────────────────────────────────

function ProcessingPhase({ step, pct, filename }: { step: number; pct: number; filename: string }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 animate-in fade-in-0 duration-500">
      {/* Concentric rings animation */}
      <div className="relative mb-10 flex items-center justify-center">
        <span className="absolute size-40 animate-ping rounded-full bg-brand-gold/10 [animation-duration:2s]" />
        <span className="absolute size-28 animate-ping rounded-full bg-brand-gold/15 [animation-duration:2s] [animation-delay:0.3s]" />
        <div className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-[#162042] shadow-2xl shadow-brand-navy/40">
          <Loader2 className="size-10 animate-spin text-brand-gold" />
        </div>
      </div>

      <h2 className="font-serif text-3xl font-bold text-brand-navy">Generating your study pack…</h2>

      {filename && (
        <div className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 shadow-sm">
          <FileText className="size-3.5 text-brand-gold" />
          <span className="max-w-[280px] truncate font-medium">{filename}</span>
        </div>
      )}

      <div className="mt-10 w-full max-w-sm">
        <div className="mb-2 flex justify-between text-xs text-slate-500">
          <span className="font-medium">Analysing…</span>
          <span className="font-mono font-bold text-brand-navy">{pct}%</span>
        </div>
        <Progress
          value={pct}
          className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-brand-gold [&>div]:to-amber-400 [&>div]:transition-all [&>div]:duration-700"
        />

        <ul className="mt-8 space-y-4">
          {PROCESSING_STEPS.map(({ label, icon: Icon }, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm transition-all duration-300",
                  done
                    ? "bg-emerald-50 text-emerald-700"
                    : active
                      ? "bg-brand-navy/5 text-brand-navy font-semibold shadow-sm"
                      : "text-slate-300",
                )}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg transition-all",
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-brand-navy text-brand-gold"
                        : "bg-slate-100 text-slate-300",
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="size-4" />
                  ) : active ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                {label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─── Results phase ────────────────────────────────────────────────────────────

function ResultsPhase({ result, onReset }: { result: AIResult; onReset: () => void }) {
  const theme = subjectTheme[result.subject] ?? subjectTheme.general;
  const notesRef = useRef<HTMLDivElement>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const handleReveal = (isCorrect: boolean) => {
    setAnsweredCount((n) => n + 1);
    if (isCorrect) setCorrectCount((n) => n + 1);
  };

  const total = result.questions.length;
  const scorePct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <div className="animate-in fade-in-0 duration-500">
      {/* ── Subject gradient banner ── */}
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-br px-6 py-10 text-white",
          theme.banner,
        )}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 size-40 rounded-full bg-black/10 blur-2xl" />

        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold", theme.badge)}>
                  {subjectLabel(result.subject)}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  <FileText className="size-3" />
                  {result.filename}
                </span>
                <span
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                  title={
                    result.detectionSource === "content"
                      ? "We read the text inside your file to pick this subject"
                      : "We couldn't pull enough readable text from this file, so we guessed the subject from the filename instead"
                  }
                >
                  {result.detectionSource === "content" ? (
                    <>
                      <FileSearch className="size-3" />
                      Subject detected from file content
                    </>
                  ) : (
                    <>
                      <FileSearch className="size-3 opacity-60" />
                      Subject guessed from filename
                    </>
                  )}
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold md:text-4xl">Your Study Pack</h1>
              <p className="mt-1 text-sm text-white/70">AI-generated from your uploaded material</p>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/20"
            >
              <RotateCcw className="size-4" />
              New file
            </button>
          </div>

          {/* Quick stats */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: ClipboardList, value: `${total}`, label: "Questions" },
              { icon: Target, value: `${result.notes.keyConcepts.length}`, label: "Key concepts" },
              { icon: BookOpen, value: `${result.notes.definitions.length}`, label: "Definitions" },
              { icon: Lightbulb, value: "1", label: "Summary" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm"
              >
                <s.icon className="size-4 text-white/60" />
                <span className="font-bold text-white">{s.value}</span>
                <span className="text-white/60">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {/* ── Live score tracker ── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                <Trophy className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live score
                </p>
                <p className="font-serif text-xl font-bold text-brand-navy">
                  {answeredCount === 0
                    ? "Answer questions below to track your score"
                    : `${correctCount} / ${answeredCount} correct (${scorePct}%)`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                <CheckCircle2 className="size-4" /> {correctCount} correct
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-red-500">
                <XCircle className="size-4" /> {answeredCount - correctCount} wrong
              </span>
              <span className="text-slate-400">{total - answeredCount} remaining</span>
            </div>
          </div>
          {answeredCount > 0 && (
            <div className="mt-3">
              <Progress
                value={scorePct}
                className={cn(
                  "h-2 [&>div]:transition-all [&>div]:duration-500",
                  scorePct >= 80
                    ? "[&>div]:bg-emerald-500"
                    : scorePct >= 60
                      ? "[&>div]:bg-amber-400"
                      : "[&>div]:bg-red-400",
                )}
              />
            </div>
          )}
        </div>

        {/* ── What we actually read from the file (transparency) ── */}
        {result.excerpt && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <FileSearch className="size-4 text-brand-gold" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                What we read from your file
              </p>
            </div>
            <p className="text-sm italic leading-relaxed text-slate-600">"{result.excerpt}"</p>
          </div>
        )}

        {/* ── Session complete banner ── */}
        {answeredCount === total && total > 0 && (
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
              scorePct >= 80
                ? "border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
                : scorePct >= 60
                  ? "border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50"
                  : "border border-red-200 bg-gradient-to-br from-red-50 to-rose-50",
            )}
          >
            {/* Decorative background sparkle */}
            <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-current opacity-5 blur-3xl" />

            <div className="flex flex-wrap items-center gap-6">
              {/* Score ring */}
              <div
                className={cn(
                  "relative flex size-20 shrink-0 items-center justify-center rounded-full border-4",
                  scorePct >= 80
                    ? "border-emerald-300 bg-emerald-100"
                    : scorePct >= 60
                      ? "border-amber-300 bg-amber-100"
                      : "border-red-300 bg-red-100",
                )}
              >
                <div className="text-center">
                  <p
                    className={cn(
                      "font-serif text-2xl font-bold leading-none",
                      scorePct >= 80
                        ? "text-emerald-700"
                        : scorePct >= 60
                          ? "text-amber-700"
                          : "text-red-700",
                    )}
                  >
                    {scorePct}%
                  </p>
                </div>
                {/* Trophy overlay for high scores */}
                {scorePct >= 80 && (
                  <div className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-brand-gold shadow-md">
                    <Trophy className="size-3.5 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Sparkles
                    className={cn(
                      "size-4 shrink-0",
                      scorePct >= 80
                        ? "text-emerald-600"
                        : scorePct >= 60
                          ? "text-amber-600"
                          : "text-red-500",
                    )}
                  />
                  <p
                    className={cn(
                      "font-serif text-xl font-bold",
                      scorePct >= 80
                        ? "text-emerald-800"
                        : scorePct >= 60
                          ? "text-amber-800"
                          : "text-red-800",
                    )}
                  >
                    {scorePct >= 80
                      ? "Excellent work!"
                      : scorePct >= 60
                        ? "Good effort!"
                        : "Keep practising!"}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-sm",
                    scorePct >= 80
                      ? "text-emerald-700"
                      : scorePct >= 60
                        ? "text-amber-700"
                        : "text-red-700",
                  )}
                >
                  You answered all {total} questions — <strong>{correctCount} correct</strong>,{" "}
                  {total - correctCount} incorrect.
                  {scorePct >= 80
                    ? " Review the study notes below to reinforce your knowledge."
                    : scorePct >= 60
                      ? " Check the explanations above, then read the study notes to fill the gaps."
                      : " Read the study notes below and try uploading a new file to practise again."}
                </p>
              </div>

              {/* Grade chip */}
              <div
                className={cn(
                  "shrink-0 flex flex-col items-center gap-0.5 rounded-2xl px-5 py-3 text-center",
                  scorePct >= 80
                    ? "bg-emerald-200/60 text-emerald-800"
                    : scorePct >= 60
                      ? "bg-amber-200/60 text-amber-800"
                      : "bg-red-200/60 text-red-800",
                )}
              >
                <span className="font-serif text-3xl font-bold leading-none">
                  {scorePct >= 90
                    ? "A+"
                    : scorePct >= 80
                      ? "A"
                      : scorePct >= 70
                        ? "B"
                        : scorePct >= 60
                          ? "C"
                          : "F"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  Grade
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Practice questions ── */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className={cn("flex size-10 items-center justify-center rounded-xl", theme.badge)}>
              <ClipboardList className="size-5" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-navy">Practice Exam</h2>
              <p className="text-sm text-slate-500">
                Select your answer, then reveal the explanation
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {result.questions.map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} onReveal={handleReveal} />
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="flex items-center gap-2 bg-slate-50 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              <BookOpen className="size-3.5" />
              Study Notes
            </span>
          </div>
        </div>

        {/* ── Study notes ── */}
        <section ref={notesRef} className="scroll-mt-8 space-y-5">
          {/* Key concepts */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                <Zap className="size-4" />
              </div>
              <h3 className="font-semibold text-brand-navy">Key Concepts</h3>
              <span className="ml-auto rounded-full bg-brand-gold/10 px-2.5 py-0.5 text-xs font-bold text-brand-gold">
                {result.notes.keyConcepts.length}
              </span>
            </div>
            <ul className="divide-y divide-slate-50 px-6">
              {result.notes.keyConcepts.map((concept, i) => (
                <li key={i} className="flex items-start gap-4 py-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">{concept}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Definitions */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="size-4" />
              </div>
              <h3 className="font-semibold text-brand-navy">Key Definitions</h3>
              <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                {result.notes.definitions.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {result.notes.definitions.map((def, i) => (
                <div key={i} className="flex gap-0 sm:gap-6 flex-col sm:flex-row px-6 py-4 text-sm">
                  <span className="mb-1 sm:mb-0 w-full sm:w-40 shrink-0 rounded-lg bg-brand-navy/5 px-3 py-1.5 font-bold text-brand-navy sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0">
                    {def.term}
                  </span>
                  <span className="leading-relaxed text-slate-600">{def.definition}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter summary */}
          <div className="overflow-hidden rounded-2xl border border-brand-gold/25 bg-gradient-to-br from-brand-gold/8 to-amber-50/50 shadow-sm">
            <div className="flex items-center gap-3 border-b border-brand-gold/15 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-gold/20 text-brand-gold">
                <Lightbulb className="size-4" />
              </div>
              <h3 className="font-semibold text-brand-navy">Chapter Summary</h3>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-brand-gold/70">
                ~1 min read
              </span>
            </div>
            <p className="px-6 py-5 text-sm leading-7 text-slate-700">{result.notes.summary}</p>
          </div>

          {/* Study tips */}
          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-teal-50/30 shadow-sm">
            <div className="flex items-center gap-3 border-b border-emerald-100/80 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Target className="size-4" />
              </div>
              <h3 className="font-semibold text-brand-navy">Exam Tips</h3>
            </div>
            <ul className="space-y-0 divide-y divide-emerald-100/60 px-6">
              {result.notes.studyTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-4 py-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Upload another ── */}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-navy/5 text-brand-navy">
            <Upload className="size-7" />
          </div>
          <p className="font-serif text-xl font-bold text-brand-navy">Ready for another subject?</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload a new file to generate a fresh study pack
          </p>
          <Button
            onClick={onReset}
            className="mt-5 gap-2 bg-brand-navy px-8 hover:bg-brand-navy/90"
          >
            <Upload className="size-4" />
            Upload new file
          </Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  onReveal,
}: {
  question: AIQuestion;
  index: number;
  onReveal: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isCorrect = revealed && selected !== null && selected === question.correctIndex;
  const isWrong = revealed && selected !== null && selected !== question.correctIndex;

  const handleReveal = () => {
    if (revealed || selected === null) return;
    setRevealed(true);
    onReveal(selected === question.correctIndex);
  };

  const handleReset = () => {
    setSelected(null);
    setRevealed(false);
    setCollapsed(false);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300",
        isCorrect
          ? "border-emerald-200 shadow-emerald-100"
          : isWrong
            ? "border-red-200 shadow-red-50"
            : "border-slate-100 hover:border-slate-200 hover:shadow-md",
      )}
    >
      {/* Left status stripe */}
      <div
        className={cn(
          "h-1 w-full transition-all duration-300",
          isCorrect
            ? "bg-gradient-to-r from-emerald-400 to-teal-400"
            : isWrong
              ? "bg-gradient-to-r from-red-400 to-rose-400"
              : revealed
                ? "bg-brand-gold"
                : "bg-slate-100",
        )}
      />

      {/* Header row */}
      <button
        type="button"
        onClick={() => setCollapsed((p) => !p)}
        className="flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50/60"
      >
        {/* Number / status badge */}
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all",
            isCorrect
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
              : isWrong
                ? "bg-red-400 text-white shadow-md shadow-red-100"
                : "bg-brand-navy/8 text-brand-navy",
          )}
        >
          {isCorrect ? (
            <CheckCircle2 className="size-5" />
          ) : isWrong ? (
            <XCircle className="size-5" />
          ) : (
            <span className="font-mono text-sm">{index + 1}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Question {index + 1}
          </p>
          <p className="font-semibold leading-snug text-brand-navy">{question.question}</p>
        </div>

        <div className="ml-2 shrink-0 mt-0.5">
          {collapsed ? (
            <ChevronDown className="size-5 text-slate-300" />
          ) : (
            <ChevronUp className="size-5 text-slate-300" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-slate-100 px-6 pb-6 pt-5">
          {/* Option buttons */}
          <div className="mb-5 space-y-2.5">
            {question.options.map((opt, i) => {
              const optSelected = selected === i;
              const optCorrect = i === question.correctIndex;
              const showGreen = revealed && optCorrect;
              const showRed = revealed && optSelected && !optCorrect;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200",
                    showGreen
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                      : showRed
                        ? "border-red-300 bg-red-50 text-red-700"
                        : optSelected
                          ? "border-brand-navy/30 bg-brand-navy/5 text-brand-navy ring-2 ring-brand-navy/10 shadow-sm"
                          : revealed
                            ? "border-slate-100 bg-slate-50/40 text-slate-400 opacity-60"
                            : "border-slate-200 text-slate-700 hover:border-brand-navy/25 hover:bg-slate-50 hover:shadow-sm",
                  )}
                >
                  {/* Letter circle */}
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                      showGreen
                        ? "bg-emerald-500 text-white"
                        : showRed
                          ? "bg-red-400 text-white"
                          : optSelected
                            ? "bg-brand-navy text-white"
                            : "border border-slate-300 text-slate-400",
                    )}
                  >
                    {["A", "B", "C", "D"][i]}
                  </span>

                  <span className="flex-1">{opt}</span>

                  {showGreen && <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />}
                  {showRed && <XCircle className="size-4 shrink-0 text-red-400" />}
                </button>
              );
            })}
          </div>

          {/* Action row */}
          {!revealed ? (
            <button
              type="button"
              disabled={selected === null}
              onClick={handleReveal}
              className={cn(
                "w-full rounded-xl py-3 text-sm font-bold transition-all",
                selected !== null
                  ? "bg-brand-gold text-white hover:brightness-110 hover:shadow-lg hover:shadow-brand-gold/25 active:scale-[0.99]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400",
              )}
            >
              {selected === null ? "Select an answer to continue" : "Reveal Answer & Explanation"}
            </button>
          ) : (
            <div
              className={cn(
                "animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl p-5 duration-300",
                isCorrect
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200",
              )}
            >
              {/* Result headline */}
              <div className="mb-3 flex items-center justify-between">
                <p
                  className={cn(
                    "flex items-center gap-2 font-bold",
                    isCorrect ? "text-emerald-700" : "text-red-700",
                  )}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="size-4" /> Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4" /> Incorrect — correct answer:{" "}
                      <span className="rounded bg-white/80 px-1.5 py-0.5 font-mono">
                        {["A", "B", "C", "D"][question.correctIndex]}
                      </span>
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 rounded-lg border border-current/20 bg-white/60 px-2.5 py-1 text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity"
                >
                  <RotateCcw className="size-3" /> Try again
                </button>
              </div>

              {/* Explanation */}
              <div className="flex items-start gap-3 rounded-lg bg-white/70 px-4 py-3 text-sm text-slate-700">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand-gold" />
                <span className="leading-relaxed">{question.explanation}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
