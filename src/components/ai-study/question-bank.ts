/**
 * Demo/fallback question bank — used only when real AI generation isn't
 * configured or fails. Never presented to students as if it came from their
 * uploaded file; see SourceBadge.tsx and use-ai-study-flow.ts's `source` field.
 */
import type { AIQuestion, AINote } from "./types";

export const questionPools: Record<string, AIQuestion[]> = {
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

export const notePools: Record<string, AINote> = {
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

export function shuffleAndTake(arr: AIQuestion[], n: number): AIQuestion[] {
  const result: AIQuestion[] = [];
  while (result.length < n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    result.push(...shuffled);
  }
  return result.slice(0, n);
}
