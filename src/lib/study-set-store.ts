/**
 * Study Set Store — Comprehensive persistence and state management for
 * Studley-style AI Study Sets on Study2Earn.
 *
 * Architecture:
 * ONE SOURCE → ONE STUDY SET → MULTIPLE AI STUDY MODES
 *
 * Persistent via localStorage with custom event dispatching for instant multi-component reactivity.
 * Includes initial Ethiopian university freshman & exit exam seed study sets.
 */

export type FlashcardMastery = "unfamiliar" | "learning" | "familiar" | "mastered";

export interface StudySetSource {
  id: string;
  title: string;
  type:
    | "pdf"
    | "doc"
    | "docx"
    | "ppt"
    | "pptx"
    | "txt"
    | "image"
    | "audio"
    | "video"
    | "youtube"
    | "web"
    | "book"
    | "notes";
  filename?: string;
  sizeBytes?: number;
  url?: string;
  contentSnippet: string;
  fullText?: string;
  uploadedAt: string;
}

export interface StudySetFlashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  mastery: FlashcardMastery;
  starred?: boolean;
  reviewCount: number;
  lastReviewedAt?: string;
}

export interface StudySetQuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string] | string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  difficulty?: "easy" | "medium" | "hard";
  sourceReference?: string;
}

export interface WrittenEvaluation {
  scorePct: number;
  whatWasCorrect: string[];
  whatWasMissing: string[];
  whatWasIncorrect: string[];
  aiFeedback: string;
  evaluatedAt: string;
}

export interface StudySetWrittenQuestion {
  id: string;
  prompt: string;
  modelAnswer: string;
  keyRubricPoints: string[];
  topic: string;
  userAnswer?: string;
  evaluation?: WrittenEvaluation;
  history?: Array<{
    userAnswer: string;
    scorePct: number;
    feedback: string;
    timestamp: string;
  }>;
}

export interface StudySetFillBlank {
  id: string;
  sentenceWithBlank: string; // e.g. "Newton's second law states that F = m * a where F is [force], m is mass, and a is acceleration."
  blankAnswer: string;
  acceptedAlternatives?: string[];
  hint?: string;
  explanation: string;
  topic: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface StudySetNotes {
  summary: string;
  keyConcepts: Array<{ concept: string; explanation: string }>;
  definitions: Array<{ term: string; definition: string }>;
  formulasAndRules: Array<{ title: string; formula: string; explanation: string }>;
  studyTips: string[];
  rawMarkdown?: string;
}

export interface PodcastDialogueItem {
  id: string;
  speaker: "Alex (Tutor)" | "Jordan (Student)" | string;
  role: string;
  text: string;
  timestampSeconds?: number;
}

export interface StudySetPodcast {
  title: string;
  hosts: [string, string];
  durationEstimate: string;
  dialogue: PodcastDialogueItem[];
}

export interface StudySetFolder {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
}

export interface StudySetProgress {
  overallPct: number;
  flashcardsMastered: number;
  quizAccuracyPct: number;
  writtenTestsCompleted: number;
  fillBlanksCompleted: number;
  lastStudiedMode?:
    | "overview"
    | "tutor"
    | "flashcards"
    | "quiz"
    | "written"
    | "fillblanks"
    | "notes"
    | "podcast"
    | "sources";
}

export interface StudySet {
  id: string;
  title: string;
  subject: string;
  courseCode: string;
  description: string;
  folderId?: string;
  sources: StudySetSource[];
  flashcards: StudySetFlashcard[];
  quizzes: StudySetQuizQuestion[];
  writtenTests: StudySetWrittenQuestion[];
  fillBlanks: StudySetFillBlank[];
  notes: StudySetNotes;
  podcast: StudySetPodcast;
  weakTopics: string[];
  progress: StudySetProgress;
  isFavorite: boolean;
  isArchived: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  lastStudiedAt: string;
}

const STORAGE_KEY = "study2earn-ai-study-sets-v2";
const FOLDERS_STORAGE_KEY = "study2earn-ai-study-folders-v2";

/* ── Initial Seed Study Sets (Ethiopian MoE Common Courses) ── */
const SEED_STUDY_SETS: StudySet[] = [
  {
    id: "set-phys-1011",
    title: "General Physics: Mechanics, Vectors & Work-Energy",
    subject: "Physics",
    courseCode: "Phys 1011",
    description:
      "Comprehensive MoE Freshman Physics module covering kinematics, vector algebra, Newton's 3 laws, conservative forces, and work-kinetic energy theorem.",
    sources: [
      {
        id: "src-phys-1",
        title: "MoE_Freshman_Physics_Module_Unit2.pdf",
        type: "pdf",
        filename: "MoE_Freshman_Physics_Module_Unit2.pdf",
        sizeBytes: 2450000,
        contentSnippet:
          "Unit 2: Kinematics and Dynamics in 1D and 2D. Displacement, average velocity, instantaneous acceleration, projectile motion, Newton's laws of motion, friction, circular motion, and conservative vs non-conservative forces.",
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      },
      {
        id: "src-phys-2",
        title: "Lecture Notes on Vector Calculus and Newton's Laws",
        type: "notes",
        contentSnippet:
          "Dot product: A · B = |A||B| cos(θ). Cross product: |A × B| = |A||B| sin(θ) n. Newton's second law in component form: ΣFx = m*ax, ΣFy = m*ay. Static friction: fs <= μs*N, Kinetic friction: fk = μk*N.",
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      },
    ],
    flashcards: [
      {
        id: "fc-phys-1",
        front: "State Newton's First Law of Motion and its physical significance.",
        back: "An object remains at rest or in uniform straight-line motion unless acted upon by an external net force. Significance: It defines inertial reference frames and the concept of inertia (mass as a measure of inertia).",
        topic: "Newton's Laws",
        mastery: "mastered",
        starred: true,
        reviewCount: 4,
        lastReviewedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: "fc-phys-2",
        front: "What is the Work-Kinetic Energy Theorem in vector form?",
        back: "The net work done on a particle by all forces equals the change in its kinetic energy: W_net = ΔK = (1/2)m(v_f² - v_i²). Works for both constant and variable forces.",
        topic: "Work & Energy",
        mastery: "familiar",
        starred: false,
        reviewCount: 3,
        lastReviewedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: "fc-phys-3",
        front: "Differentiate between conservative and non-conservative forces with examples.",
        back: "Conservative force: Work done is path-independent and depends only on initial and final positions (e.g., Gravity, Spring force). Non-conservative force: Work done depends on the path taken and dissipates mechanical energy as heat (e.g., Friction, Air drag).",
        topic: "Conservative Forces",
        mastery: "learning",
        starred: true,
        reviewCount: 2,
        lastReviewedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: "fc-phys-4",
        front: "What is the condition for static friction vs kinetic friction on an inclined plane?",
        back: "Static friction matches applied force up to maximum: f_s_max = μ_s * N = μ_s * m*g*cos(θ). Once motion starts, kinetic friction applies: f_k = μ_k * N = μ_k * m*g*cos(θ), where usually μ_k < μ_s.",
        topic: "Friction & Dynamics",
        mastery: "learning",
        starred: false,
        reviewCount: 2,
        lastReviewedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
      {
        id: "fc-phys-5",
        front: "Define centripetal acceleration and write its mathematical formula.",
        back: "Acceleration directed towards the center of curvature in uniform circular motion, changing direction of velocity without changing speed: a_c = v² / r = ω² * r.",
        topic: "Circular Motion",
        mastery: "unfamiliar",
        starred: false,
        reviewCount: 1,
        lastReviewedAt: new Date(Date.now() - 3600000 * 26).toISOString(),
      },
      {
        id: "fc-phys-6",
        front: "Why does normal force do zero work when an object slides along a flat horizontal surface?",
        back: "Work is W = F · d = |F||d| cos(θ). Here normal force is perpendicular to displacement (θ = 90°), and cos(90°) = 0, so work done is zero.",
        topic: "Work & Energy",
        mastery: "mastered",
        starred: false,
        reviewCount: 3,
        lastReviewedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
      },
    ],
    quizzes: [
      {
        id: "qz-phys-1",
        question:
          "A 5 kg block slides down a frictionless incline of angle 30° from height h = 5 m. What is its speed at the bottom? (Take g = 9.8 m/s²)",
        options: ["7.0 m/s", "9.9 m/s", "14.0 m/s", "4.9 m/s"],
        correctIndex: 1,
        explanation:
          "By conservation of mechanical energy: m*g*h = (1/2)*m*v² => v = √(2*g*h) = √(2 * 9.8 * 5) = √98 ≈ 9.899 m/s ≈ 9.9 m/s. Mass and angle are independent of final speed.",
        topic: "Work & Energy",
        difficulty: "medium",
        sourceReference: "MoE Physics Module Unit 2.4",
      },
      {
        id: "qz-phys-2",
        question:
          "Which of the following forces is strictly non-conservative in freshman classical mechanics?",
        options: [
          "Electrostatic Coulomb force",
          "Ideal Hooke's Law spring restoring force",
          "Kinetic sliding friction",
          "Uniform gravitational force",
        ],
        correctIndex: 2,
        explanation:
          "Kinetic sliding friction dissipates mechanical energy into thermal energy and its work is path-dependent (∮ F_k · dr ≠ 0). The other three forces are conservative.",
        topic: "Conservative Forces",
        difficulty: "easy",
        sourceReference: "MoE Physics Module Unit 2.5",
      },
      {
        id: "qz-phys-3",
        question:
          "An object moves in a circular path of radius 4 m at a constant speed of 8 m/s. What is the magnitude of its centripetal acceleration?",
        options: ["2 m/s²", "16 m/s²", "32 m/s²", "64 m/s²"],
        correctIndex: 1,
        explanation:
          "Centripetal acceleration is a_c = v² / r = (8 m/s)² / 4 m = 64 / 4 = 16 m/s² directed radially inward.",
        topic: "Circular Motion",
        difficulty: "easy",
        sourceReference: "Lecture Notes Unit 2.2",
      },
      {
        id: "qz-phys-4",
        question:
          "Two vectors A and B have magnitudes |A|=3 and |B|=4. If their scalar dot product A · B = 0, what is the magnitude of their vector cross product |A × B|?",
        options: ["0", "7", "12", "1"],
        correctIndex: 2,
        explanation:
          "Since A · B = |A||B| cos(θ) = 0, the angle between them is θ = 90° (orthogonal). Therefore |A × B| = |A||B| sin(90°) = 3 * 4 * 1 = 12.",
        topic: "Vector Calculus",
        difficulty: "medium",
        sourceReference: "Freshman Physics Unit 1 Review",
      },
      {
        id: "qz-phys-5",
        question:
          "A passenger standing in an accelerating bus feels pushed backward. This apparent force is classified as a:",
        options: [
          "True gravitational force",
          "Action-reaction pair according to Newton's 3rd Law",
          "Fictitious (inertial) force observed in a non-inertial frame",
          "Centripetal force",
        ],
        correctIndex: 2,
        explanation:
          "In an accelerating (non-inertial) frame of reference, fictitious or pseudo-forces appear because the reference frame itself is accelerating, not because of a real physical interaction.",
        topic: "Newton's Laws",
        difficulty: "hard",
        sourceReference: "MoE Physics Module Section 2.3",
      },
    ],
    writtenTests: [
      {
        id: "wt-phys-1",
        prompt:
          "State Newton's Third Law of Motion. Explain why the action and reaction forces do NOT cancel each other out, giving a concrete physical example.",
        modelAnswer:
          "Newton's Third Law states that whenever one body exerts a force on a second body, the second body exerts an equal and opposite force on the first body (F_AB = -F_BA).\nAction and reaction forces never cancel each other because they act on TWO DIFFERENT bodies. For example, when a swimmer pushes back on the water, the water exerts an equal forward force on the swimmer. The force on the swimmer accelerates the swimmer forward, while the force on the water pushes the water backward.",
        keyRubricPoints: [
          "States equal magnitude and opposite direction",
          "Mentions forces act on two distinct objects/bodies",
          "Provides a valid physical example (e.g., swimmer, walking, rocket propulsion)",
          "Explains why cancellation requires forces acting on the same single free body",
        ],
        topic: "Newton's Laws",
      },
      {
        id: "wt-phys-2",
        prompt:
          "Explain the difference between a conservative force and a non-conservative force. State the mathematical condition for a force field to be conservative in closed path integration.",
        modelAnswer:
          "A conservative force is one where the work done moving a particle between two points is completely independent of the path taken, depending solely on the start and endpoints. For a conservative force, mechanical energy is conserved, and work along any closed loop is zero: ∮ F · dr = 0, or curl(F) = ∇ × F = 0.\nIn contrast, a non-conservative force (such as friction or air resistance) has path-dependent work that dissipates mechanical energy into thermal or acoustic forms, meaning ∮ F · dr ≠ 0.",
        keyRubricPoints: [
          "Path independence definition for conservative force",
          "Closed line integral equals zero: ∮ F · dr = 0",
          "Energy dissipation for non-conservative force",
          "Real examples for each (gravity/spring vs friction/drag)",
        ],
        topic: "Conservative Forces",
      },
    ],
    fillBlanks: [
      {
        id: "fb-phys-1",
        sentenceWithBlank:
          "The rate of change of momentum of a body is directly proportional to the applied [force] and takes place in the direction of that line of action.",
        blankAnswer: "force",
        acceptedAlternatives: ["net force", "external force"],
        hint: "Newton's second law formulation: dp/dt = ...",
        explanation:
          "Newton's second law in its fundamental form states that F_net = dp/dt.",
        topic: "Newton's Laws",
      },
      {
        id: "fb-phys-2",
        sentenceWithBlank:
          "The work done by a conservative force on an object is equal to the negative change in its [potential energy].",
        blankAnswer: "potential energy",
        acceptedAlternatives: ["potential", "gravitational potential energy"],
        hint: "Symbolized by U in W_c = -ΔU",
        explanation:
          "By definition of potential energy, W_conservative = -ΔU = -(U_final - U_initial).",
        topic: "Work & Energy",
      },
      {
        id: "fb-phys-3",
        sentenceWithBlank:
          "In uniform circular motion, the acceleration vector is always perpendicular to the [velocity] vector.",
        blankAnswer: "velocity",
        acceptedAlternatives: ["tangential velocity", "speed vector"],
        hint: "It points radially toward the center while this vector is tangential.",
        explanation:
          "Centripetal acceleration is purely normal (perpendicular) to the tangential velocity vector, altering direction without altering speed magnitude.",
        topic: "Circular Motion",
      },
      {
        id: "fb-phys-4",
        sentenceWithBlank:
          "The coefficient of static friction is almost always [greater] than the coefficient of kinetic friction for the same pair of materials.",
        blankAnswer: "greater",
        acceptedAlternatives: ["larger", "higher", ">"],
        hint: "Is μ_s larger or smaller than μ_k?",
        explanation:
          "Interlocking microscopic surface asperities have more time to form bonds when stationary, so μ_s > μ_k.",
        topic: "Friction & Dynamics",
      },
    ],
    notes: {
      summary:
        "This study module synthesizes classical Newtonian mechanics, kinematics in one and two dimensions, vector operations, and energy conservation. It is designed to prepare freshman students for university midterms and the national Exit Exam.",
      keyConcepts: [
        {
          concept: "Inertial Reference Frame",
          explanation:
            "A frame of reference in which Newton's first law holds true without fictitious forces. Any frame moving at constant velocity relative to an inertial frame is also inertial.",
        },
        {
          concept: "Work-Kinetic Energy Principle",
          explanation:
            "W_total = ΔK. Net work by all forces (conservative + non-conservative) equals the change in kinetic energy of the system.",
        },
        {
          concept: "Conservative Force Field",
          explanation:
            "A force field where work done along any closed contour is zero: ∮ F · dr = 0. Permits definition of a potential energy scalar field U such that F = -∇U.",
        },
      ],
      definitions: [
        {
          term: "Inertia",
          definition: "The inherent resistance of any physical object to any change in its velocity.",
        },
        {
          term: "Dot Product (Scalar Product)",
          definition: "A · B = |A||B| cos(θ). Yields a scalar representing directional projection.",
        },
        {
          term: "Cross Product (Vector Product)",
          definition:
            "A × B = |A||B| sin(θ) n̂. Yields a vector orthogonal to the plane of both operands.",
        },
        {
          term: "Power",
          definition: "The instantaneous time rate of doing work: P = dW/dt = F · v.",
        },
      ],
      formulasAndRules: [
        {
          title: "Newton's Second Law",
          formula: "\\vec{F}_{net} = m\\vec{a} = \\frac{d\\vec{p}}{dt}",
          explanation: "Fundamental equation connecting net force, inertial mass, and acceleration.",
        },
        {
          title: "Work Integral",
          formula: "W = \\int_{\\vec{r}_1}^{\\vec{r}_2} \\vec{F} \\cdot d\\vec{r}",
          explanation: "Work done by a force along a spatial trajectory.",
        },
        {
          title: "Centripetal Acceleration",
          formula: "a_c = \\frac{v^2}{r} = \\omega^2 r",
          explanation: "Inward acceleration maintaining circular path of radius r.",
        },
        {
          title: "Static vs Kinetic Friction",
          formula: "f_s \\le \\mu_s N, \\quad f_k = \\mu_k N",
          explanation: "Empirical Amontons-Coulomb friction laws.",
        },
      ],
      studyTips: [
        "Always draw a complete Free Body Diagram (FBD) before setting up ΣFx = m*ax and ΣFy = m*ay equations.",
        "Check units immediately: energy in Joules (kg·m²/s²), power in Watts (J/s), force in Newtons (kg·m/s²).",
        "When friction is present, mechanical energy is NOT conserved: E_mech_final = E_mech_initial + W_friction.",
      ],
    },
    podcast: {
      title: "Episode 1: Demystifying Newton's Laws and Energy Conservation",
      hosts: ["Alex (Tutor)", "Jordan (Student)"],
      durationEstimate: "4 min 30 sec",
      dialogue: [
        {
          id: "pod-1",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: "Welcome Jordan! Today we're breaking down Unit 2 of Freshman General Physics — Newton's laws and the work-energy theorem. What's the number one confusion students hit?",
          timestampSeconds: 0,
        },
        {
          id: "pod-2",
          speaker: "Jordan (Student)",
          role: "Freshman Engineering Student",
          text: "Honestly Alex, it's Newton's third law! Why don't action and reaction forces simply cancel out to zero if they're equal and opposite?",
          timestampSeconds: 15,
        },
        {
          id: "pod-3",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: "That is the classic trap! Remember: action and reaction forces act on TWO DIFFERENT objects. If you push the wall, the wall pushes you. The wall feels one force; you feel the other. They only cancel if they act on the same object!",
          timestampSeconds: 32,
        },
        {
          id: "pod-4",
          speaker: "Jordan (Student)",
          role: "Freshman Engineering Student",
          text: "Oh! So when drawing a Free Body Diagram for my body, I only include the force the wall exerts on ME, not the force I put on the wall.",
          timestampSeconds: 52,
        },
        {
          id: "pod-5",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: "Exactly right! Now let's tackle work. Why is normal force doing zero work when a crate slides across a flat floor?",
          timestampSeconds: 70,
        },
        {
          id: "pod-6",
          speaker: "Jordan (Student)",
          role: "Freshman Engineering Student",
          text: "Because work is dot product: force times distance times cosine of the angle. Normal force is straight up, motion is horizontal, angle is 90 degrees, and cosine 90 is zero!",
          timestampSeconds: 88,
        },
        {
          id: "pod-7",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: "Spot on! And lastly: remember that friction is non-conservative because it converts mechanical energy into heat. If you master that, your Exit Exam physics section will be a breeze.",
          timestampSeconds: 110,
        },
      ],
    },
    weakTopics: ["Friction & Dynamics", "Circular Motion"],
    progress: {
      overallPct: 68,
      flashcardsMastered: 2,
      quizAccuracyPct: 75,
      writtenTestsCompleted: 1,
      fillBlanksCompleted: 3,
      lastStudiedMode: "flashcards",
    },
    isFavorite: true,
    isArchived: false,
    isShared: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastStudiedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "set-math-1011",
    title: "Freshman Mathematics: Propositional Logic & Set Theory",
    subject: "Mathematics",
    courseCode: "Math 1011",
    description:
      "Core freshman module covering propositions, truth tables, logical equivalences (De Morgan), universal and existential quantifiers, and Cartesian products.",
    sources: [
      {
        id: "src-math-1",
        title: "MoE_Freshman_Mathematics_Chapter1_Logic.pdf",
        type: "pdf",
        filename: "MoE_Freshman_Mathematics_Chapter1_Logic.pdf",
        sizeBytes: 1800000,
        contentSnippet:
          "Chapter 1: Propositional Logic. Compound propositions, truth tables, tautologies, contradictions, De Morgan's laws, contrapositive, inverse, converse, and predicate quantifiers (∀, ∃).",
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      },
    ],
    flashcards: [
      {
        id: "fc-math-1",
        front: "What is the contrapositive of the implication P → Q, and is it logically equivalent?",
        back: "The contrapositive is ¬Q → ¬P. Yes, it is logically equivalent to P → Q (they have identical truth tables).",
        topic: "Implications",
        mastery: "mastered",
        starred: true,
        reviewCount: 5,
        lastReviewedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      },
      {
        id: "fc-math-2",
        front: "State De Morgan's Laws for propositional logic.",
        back: "1. ¬(P ∧ Q) ≡ ¬P ∨ ¬Q\n2. ¬(P ∨ Q) ≡ ¬P ∧ ¬Q\nNegating a conjunction turns it into a disjunction of negations, and vice versa.",
        topic: "Equivalences",
        mastery: "mastered",
        starred: false,
        reviewCount: 4,
        lastReviewedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
      },
      {
        id: "fc-math-3",
        front: "How do you negate a universally quantified statement ¬(∀x P(x))?",
        back: "¬(∀x P(x)) ≡ ∃x ¬P(x). 'It is not the case that all x satisfy P' is equivalent to 'There exists at least one x that does NOT satisfy P'.",
        topic: "Quantifiers",
        mastery: "learning",
        starred: true,
        reviewCount: 2,
        lastReviewedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        id: "fc-math-4",
        front: "What is the power set of a set S with n elements, and what is its cardinality?",
        back: "The power set P(S) is the set of all subsets of S, including the empty set ∅ and S itself. Its cardinality is |P(S)| = 2^n.",
        topic: "Set Theory",
        mastery: "familiar",
        starred: false,
        reviewCount: 3,
        lastReviewedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
      },
    ],
    quizzes: [
      {
        id: "qz-math-1",
        question: "If P is True and Q is False, what is the truth value of (P ∨ Q) → (P ∧ Q)?",
        options: ["True", "False", "Cannot be determined", "Tautology"],
        correctIndex: 1,
        explanation:
          "(P ∨ Q) = True ∨ False = True. (P ∧ Q) = True ∧ False = False. True → False is False.",
        topic: "Truth Tables",
        difficulty: "easy",
      },
      {
        id: "qz-math-2",
        question:
          "Which of the following is logically equivalent to the conditional statement 'If it rains, the grass is wet' (P → Q)?",
        options: [
          "If the grass is wet, it rains (Q → P)",
          "If it does not rain, the grass is not wet (¬P → ¬Q)",
          "If the grass is not wet, it does not rain (¬Q → ¬P)",
          "It rains and the grass is not wet (P ∧ ¬Q)",
        ],
        correctIndex: 2,
        explanation:
          "A conditional P → Q is logically equivalent ONLY to its contrapositive ¬Q → ¬P.",
        topic: "Implications",
        difficulty: "medium",
      },
    ],
    writtenTests: [
      {
        id: "wt-math-1",
        prompt:
          "Prove using a truth table or algebraic laws that P → Q is logically equivalent to ¬P ∨ Q.",
        modelAnswer:
          "The implication P → Q is false only when P is True and Q is False; in all other three cases (T→T, F→T, F→F) it is True.\nNow examine ¬P ∨ Q:\n- When P=T, Q=T: ¬T ∨ T = F ∨ T = T\n- When P=T, Q=F: ¬T ∨ F = F ∨ F = F\n- When P=F, Q=T: ¬F ∨ T = T ∨ T = T\n- When P=F, Q=F: ¬F ∨ F = T ∨ F = T\nBoth expressions yield identical truth columns [T, F, T, T], proving logical equivalence: P → Q ≡ ¬P ∨ Q.",
        keyRubricPoints: [
          "Evaluates all 4 truth combinations for P and Q",
          "Shows truth values match in every row: [T, F, T, T]",
          "Explicitly identifies that both are false only when P=T and Q=F",
          "Concludes with equivalence statement",
        ],
        topic: "Equivalences",
      },
    ],
    fillBlanks: [
      {
        id: "fb-math-1",
        sentenceWithBlank:
          "A compound proposition that is always true for all possible truth values of its constituent variables is called a [tautology].",
        blankAnswer: "tautology",
        acceptedAlternatives: ["valid proposition"],
        hint: "Opposite of contradiction",
        explanation:
          "A tautology evaluates to True under all truth assignments (e.g., P ∨ ¬P).",
        topic: "Truth Tables",
      },
      {
        id: "fb-math-2",
        sentenceWithBlank:
          "The negation of the statement 'Every student passed the exam' is 'There exists at least one student who [failed] the exam'.",
        blankAnswer: "failed",
        acceptedAlternatives: ["did not pass", "has not passed"],
        hint: "Negating ∀x P(x) yields ∃x ¬P(x).",
        explanation:
          "Negating universal quantification requires an existential quantifier with negated predicate.",
        topic: "Quantifiers",
      },
    ],
    notes: {
      summary:
        "Comprehensive foundations of mathematical logic and set operations required for all science and technology streams in Ethiopian universities.",
      keyConcepts: [
        {
          concept: "Logical Equivalence (≡)",
          explanation: "Two statements are equivalent if their biconditional P ↔ Q is a tautology.",
        },
        {
          concept: "Predicates and Quantifiers",
          explanation:
            "Universal quantifier (∀) asserts truth for all domain members; existential quantifier (∃) asserts existence of at least one.",
        },
      ],
      definitions: [
        {
          term: "Contradiction",
          definition: "A statement that is always false under all truth assignments (e.g., P ∧ ¬P).",
        },
        {
          term: "Converse",
          definition: "For P → Q, the converse is Q → P (not logically equivalent to P → Q).",
        },
      ],
      formulasAndRules: [
        {
          title: "De Morgan's Laws",
          formula: "\\neg(P \\land Q) \\equiv \\neg P \\lor \\neg Q, \\quad \\neg(P \\lor Q) \\equiv \\neg P \\land \\neg Q",
          explanation: "Distribution of negation across boolean conjunctions.",
        },
        {
          title: "Implication Law",
          formula: "P \\rightarrow Q \\equiv \\neg P \\lor Q",
          explanation: "Transforming conditionals into disjunctions.",
        },
      ],
      studyTips: [
        "Never confuse the converse (Q → P) with the contrapositive (¬Q → ¬P). Only the contrapositive is guaranteed equivalent.",
        "Check edge cases with empty sets ∅ in Cartesian products: A × ∅ = ∅.",
      ],
    },
    podcast: {
      title: "Episode 2: Navigating De Morgan and Quantifiers",
      hosts: ["Alex (Tutor)", "Jordan (Student)"],
      durationEstimate: "3 min 45 sec",
      dialogue: [
        {
          id: "pod-m-1",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: "Jordan, how do you negate 'All integers are even'?",
          timestampSeconds: 0,
        },
        {
          id: "pod-m-2",
          speaker: "Jordan (Student)",
          role: "Freshman Engineering Student",
          text: "Many people say 'No integers are even', but that's wrong! The correct negation is 'There exists at least one integer that is NOT even'.",
          timestampSeconds: 12,
        },
        {
          id: "pod-m-3",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: "Bravo! That's the golden rule of quantifiers: flipping ∀ to ∃ and negating the inner condition.",
          timestampSeconds: 28,
        },
      ],
    },
    weakTopics: ["Quantifiers"],
    progress: {
      overallPct: 82,
      flashcardsMastered: 2,
      quizAccuracyPct: 90,
      writtenTestsCompleted: 1,
      fillBlanksCompleted: 2,
      lastStudiedMode: "overview",
    },
    isFavorite: false,
    isArchived: false,
    isShared: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    lastStudiedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    id: "set-cosc-2041",
    title: "Database Systems: Relational Model & SQL Normalization",
    subject: "Computer Science",
    courseCode: "CoSc 2041",
    description:
      "Core CS module on 1NF, 2NF, 3NF, BCNF, functional dependencies, ACID transaction properties, and SQL inner vs outer joins for National Exit Exam preparation.",
    sources: [
      {
        id: "src-db-1",
        title: "Database_Management_Systems_Normalization.pdf",
        type: "pdf",
        filename: "Database_Management_Systems_Normalization.pdf",
        sizeBytes: 3100000,
        contentSnippet:
          "Normalization theory: anomalies (insertion, deletion, update), Armstrong's axioms, canonical cover, 1NF (atomic values), 2NF (no partial dependency), 3NF (no transitive dependency), BCNF (every determinant is a candidate key).",
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
      },
    ],
    flashcards: [
      {
        id: "fc-db-1",
        front: "What is the condition for a table to be in First Normal Form (1NF)?",
        back: "1. Each column contains only atomic (indivisible) values.\n2. No repeating groups or multivalued attributes.\n3. Each record must have a unique identifier (Primary Key).",
        topic: "Normalization",
        mastery: "mastered",
        starred: true,
        reviewCount: 6,
        lastReviewedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "fc-db-2",
        front: "Define Second Normal Form (2NF) and what dependency it eliminates.",
        back: "The relation must be in 1NF AND have no partial dependencies — every non-prime attribute must depend on the WHOLE candidate key, not a proper subset of it. Only applies when composite primary keys exist.",
        topic: "Normalization",
        mastery: "familiar",
        starred: true,
        reviewCount: 4,
        lastReviewedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: "fc-db-3",
        front: "What is Third Normal Form (3NF) and what dependency does it eliminate?",
        back: "The relation must be in 2NF AND have no transitive dependencies — non-prime attributes must not depend on other non-prime attributes (X → Y where X is not a superkey and Y is not prime).",
        topic: "Normalization",
        mastery: "learning",
        starred: false,
        reviewCount: 3,
        lastReviewedAt: new Date(Date.now() - 3600000 * 15).toISOString(),
      },
      {
        id: "fc-db-4",
        front: "What are the ACID properties in database transactions?",
        back: "Atomicity (all or nothing), Consistency (preserves database integrity rules), Isolation (concurrent transactions execute independently), Durability (committed changes persist even after system crash).",
        topic: "Transactions",
        mastery: "mastered",
        starred: false,
        reviewCount: 5,
        lastReviewedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
    quizzes: [
      {
        id: "qz-db-1",
        question:
          "Given relation R(A, B, C, D) with primary key (A, B) and functional dependency B → C. Which normal form is violated?",
        options: ["1NF", "2NF", "3NF", "BCNF"],
        correctIndex: 1,
        explanation:
          "Attribute C depends on B, which is a proper subset of the composite candidate key (A, B). This is a partial dependency, violating 2NF.",
        topic: "Normalization",
        difficulty: "medium",
      },
      {
        id: "qz-db-2",
        question:
          "Which SQL JOIN returns all rows from the left table and matched rows from the right table, filling nulls if no match?",
        options: ["INNER JOIN", "RIGHT OUTER JOIN", "LEFT OUTER JOIN", "CROSS JOIN"],
        correctIndex: 2,
        explanation:
          "LEFT OUTER JOIN returns every row from the left table regardless of whether there is a corresponding match in the right table.",
        topic: "SQL Joins",
        difficulty: "easy",
      },
    ],
    writtenTests: [
      {
        id: "wt-db-1",
        prompt:
          "Explain the difference between 3NF and Boyce-Codd Normal Form (BCNF). Give an example of a relation that is in 3NF but not in BCNF.",
        modelAnswer:
          "A relation is in 3NF if for every non-trivial functional dependency X → Y, either X is a superkey OR Y is a prime attribute (part of a candidate key).\nBCNF is strictly stronger: for EVERY non-trivial dependency X → Y, X MUST be a superkey (the second relaxation of 3NF is removed).\nExample: Relation R(Student, Subject, Teacher) where candidate keys are (Student, Subject) and (Student, Teacher). If Teacher → Subject, then Teacher is not a superkey, but Subject is a prime attribute. Thus R is in 3NF, but violates BCNF because Teacher is not a superkey.",
        keyRubricPoints: [
          "Defines 3NF condition (X superkey OR Y prime attribute)",
          "Defines BCNF condition (every determinant X must be superkey)",
          "Explains that BCNF eliminates anomalies remaining in 3NF",
          "Provides a valid overlapping candidate key example",
        ],
        topic: "Normalization",
      },
    ],
    fillBlanks: [
      {
        id: "fb-db-1",
        sentenceWithBlank:
          "In database transactions, the [Atomicity] property ensures that either all operations of the transaction are completed successfully, or none of them are.",
        blankAnswer: "Atomicity",
        acceptedAlternatives: ["atomic"],
        hint: "The 'A' in ACID.",
        explanation:
          "Atomicity ensures all-or-nothing execution via commit or rollback.",
        topic: "Transactions",
      },
      {
        id: "fb-db-2",
        sentenceWithBlank:
          "A non-prime attribute depending on another non-prime attribute represents a [transitive] dependency.",
        blankAnswer: "transitive",
        hint: "Eliminated by 3NF.",
        explanation:
          "If X → Y and Y → Z where X is key and Y, Z are non-prime, X → Z is transitive.",
        topic: "Normalization",
      },
    ],
    notes: {
      summary:
        "Comprehensive relational schema design, decomposition without information loss, and dependency preservation for computer science exit exams.",
      keyConcepts: [
        {
          concept: "Lossless Decomposition",
          explanation:
            "A decomposition of R into R1 and R2 is lossless if and only if R1 ∩ R2 forms a superkey for R1 or R2.",
        },
      ],
      definitions: [
        {
          term: "Candidate Key",
          definition: "A minimal superkey with no redundant attributes.",
        },
      ],
      formulasAndRules: [
        {
          title: "Armstrong's Axioms",
          formula: "\\text{Reflexivity, Augmentation, Transitivity}",
          explanation: "Sound and complete rules for deriving functional dependencies.",
        },
      ],
      studyTips: [
        "On Ethiopian Exit Exams, look out for composite keys. If a single column determines another column, check 2NF immediately!",
      ],
    },
    podcast: {
      title: "Episode 3: Mastering Normalization from 1NF to BCNF",
      hosts: ["Alex (Tutor)", "Jordan (Student)"],
      durationEstimate: "4 min 10 sec",
      dialogue: [
        {
          id: "pod-db-1",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: "Jordan, how do you remember the normal forms in order?",
          timestampSeconds: 0,
        },
        {
          id: "pod-db-2",
          speaker: "Jordan (Student)",
          role: "Freshman Engineering Student",
          text: "The key, the whole key, and nothing but the key, so help me Codd! 1NF is atomic, 2NF is whole key, 3NF is nothing but the key.",
          timestampSeconds: 15,
        },
      ],
    },
    weakTopics: ["Normalization"],
    progress: {
      overallPct: 75,
      flashcardsMastered: 2,
      quizAccuracyPct: 80,
      writtenTestsCompleted: 1,
      fillBlanksCompleted: 1,
      lastStudiedMode: "written",
    },
    isFavorite: false,
    isArchived: false,
    isShared: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    lastStudiedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

/* ── Initial Folders ── */
const SEED_FOLDERS: StudySetFolder[] = [
  { id: "folder-freshman", name: "Freshman MoE Common", color: "#3B82F6", createdAt: new Date().toISOString() },
  { id: "folder-exit-exam", name: "Exit Exam Prep", color: "#10B981", createdAt: new Date().toISOString() },
  { id: "folder-engineering", name: "Engineering Core", color: "#F59E0B", createdAt: new Date().toISOString() },
];

/* ── Store Helpers ── */
function readStudySets(): StudySet[] {
  if (typeof window === "undefined") return SEED_STUDY_SETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STUDY_SETS));
      return SEED_STUDY_SETS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STUDY_SETS));
      return SEED_STUDY_SETS;
    }
    return parsed as StudySet[];
  } catch {
    return SEED_STUDY_SETS;
  }
}

function writeStudySets(sets: StudySet[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  window.dispatchEvent(new Event("study-sets-change"));
}

export function subscribeStudySets(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("study-sets-change", cb);
  return () => window.removeEventListener("study-sets-change", cb);
}

export function getStudySets(): StudySet[] {
  return readStudySets();
}

export function getStudySetById(id: string): StudySet | undefined {
  const sets = readStudySets();
  return sets.find((s) => s.id === id);
}

export function saveStudySet(studySet: StudySet): void {
  const sets = readStudySets();
  const index = sets.findIndex((s) => s.id === studySet.id);
  if (index >= 0) {
    sets[index] = { ...studySet, updatedAt: new Date().toISOString() };
  } else {
    sets.unshift({
      ...studySet,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastStudiedAt: new Date().toISOString(),
    });
  }
  writeStudySets(sets);
}

export function createStudySet(params: {
  title: string;
  subject: string;
  courseCode?: string;
  description?: string;
  folderId?: string;
  sources: StudySetSource[];
  flashcards: StudySetFlashcard[];
  quizzes: StudySetQuizQuestion[];
  writtenTests: StudySetWrittenQuestion[];
  fillBlanks: StudySetFillBlank[];
  notes: StudySetNotes;
  podcast: StudySetPodcast;
}): StudySet {
  const newSet: StudySet = {
    id: `set-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: params.title.trim() || "Untitled Study Set",
    subject: params.subject || "General",
    courseCode: params.courseCode || "GEN 1000",
    description: params.description || `Study set created with ${params.sources.length} sources.`,
    folderId: params.folderId,
    sources: params.sources,
    flashcards: params.flashcards,
    quizzes: params.quizzes,
    writtenTests: params.writtenTests,
    fillBlanks: params.fillBlanks,
    notes: params.notes,
    podcast: params.podcast,
    weakTopics: [],
    progress: {
      overallPct: 0,
      flashcardsMastered: 0,
      quizAccuracyPct: 0,
      writtenTestsCompleted: 0,
      fillBlanksCompleted: 0,
      lastStudiedMode: "overview",
    },
    isFavorite: false,
    isArchived: false,
    isShared: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastStudiedAt: new Date().toISOString(),
  };

  saveStudySet(newSet);
  return newSet;
}

export function updateStudySet(id: string, updates: Partial<StudySet>): StudySet | undefined {
  const sets = readStudySets();
  const index = sets.findIndex((s) => s.id === id);
  if (index === -1) return undefined;

  const updated: StudySet = {
    ...sets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  sets[index] = updated;
  writeStudySets(sets);
  return updated;
}

export function deleteStudySet(id: string): void {
  const sets = readStudySets();
  const filtered = sets.filter((s) => s.id !== id);
  writeStudySets(filtered);
}

export function duplicateStudySet(id: string): StudySet | undefined {
  const source = getStudySetById(id);
  if (!source) return undefined;

  const duplicated: StudySet = {
    ...source,
    id: `set-${Date.now().toString(36)}-copy`,
    title: `${source.title} (Copy)`,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastStudiedAt: new Date().toISOString(),
  };

  saveStudySet(duplicated);
  return duplicated;
}

export function toggleFavoriteStudySet(id: string): boolean {
  const set = getStudySetById(id);
  if (!set) return false;
  const newFav = !set.isFavorite;
  updateStudySet(id, { isFavorite: newFav });
  return newFav;
}

export function toggleArchiveStudySet(id: string): boolean {
  const set = getStudySetById(id);
  if (!set) return false;
  const newArchived = !set.isArchived;
  updateStudySet(id, { isArchived: newArchived });
  return newArchived;
}

/* ── Flashcard Actions ── */
export function updateFlashcardMastery(
  setId: string,
  cardId: string,
  mastery: FlashcardMastery,
): void {
  const set = getStudySetById(setId);
  if (!set) return;

  const updatedCards = set.flashcards.map((c) => {
    if (c.id !== cardId) return c;
    return {
      ...c,
      mastery,
      reviewCount: (c.reviewCount || 0) + 1,
      lastReviewedAt: new Date().toISOString(),
    };
  });

  const masteredCount = updatedCards.filter((c) => c.mastery === "mastered").length;
  const total = updatedCards.length;
  const cardPct = total > 0 ? (masteredCount / total) * 100 : 0;

  updateStudySet(setId, {
    flashcards: updatedCards,
    lastStudiedAt: new Date().toISOString(),
    progress: {
      ...set.progress,
      flashcardsMastered: masteredCount,
      overallPct: Math.round(
        (cardPct * 0.4) +
          (set.progress.quizAccuracyPct * 0.4) +
          (set.progress.writtenTestsCompleted > 0 ? 10 : 0) +
          (set.progress.fillBlanksCompleted > 0 ? 10 : 0),
      ),
      lastStudiedMode: "flashcards",
    },
  });
}

export function toggleFlashcardStarred(setId: string, cardId: string): void {
  const set = getStudySetById(setId);
  if (!set) return;

  const updatedCards = set.flashcards.map((c) =>
    c.id === cardId ? { ...c, starred: !c.starred } : c,
  );
  updateStudySet(setId, { flashcards: updatedCards });
}

export function addFlashcardToSet(
  setId: string,
  card: { front: string; back: string; topic?: string },
): StudySetFlashcard | undefined {
  const set = getStudySetById(setId);
  if (!set) return undefined;

  const newCard: StudySetFlashcard = {
    id: `fc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    front: card.front.trim(),
    back: card.back.trim(),
    topic: card.topic?.trim() || "General",
    mastery: "unfamiliar",
    reviewCount: 0,
    starred: false,
  };

  updateStudySet(setId, {
    flashcards: [newCard, ...set.flashcards],
  });
  return newCard;
}

export function updateFlashcardInSet(
  setId: string,
  cardId: string,
  updates: Partial<StudySetFlashcard>,
): void {
  const set = getStudySetById(setId);
  if (!set) return;

  const updatedCards = set.flashcards.map((c) => (c.id === cardId ? { ...c, ...updates } : c));
  updateStudySet(setId, { flashcards: updatedCards });
}

export function deleteFlashcardFromSet(setId: string, cardId: string): void {
  const set = getStudySetById(setId);
  if (!set) return;

  const updatedCards = set.flashcards.filter((c) => c.id !== cardId);
  updateStudySet(setId, { flashcards: updatedCards });
}

/* ── Quiz Actions ── */
export function recordQuizAttempt(
  setId: string,
  params: { scorePct: number; weakTopics: string[] },
): void {
  const set = getStudySetById(setId);
  if (!set) return;

  // Merge weak topics without duplicates
  const allWeak = Array.from(new Set([...set.weakTopics, ...params.weakTopics])).slice(0, 8);

  const cardPct =
    set.flashcards.length > 0
      ? (set.flashcards.filter((c) => c.mastery === "mastered").length / set.flashcards.length) * 100
      : 0;

  updateStudySet(setId, {
    weakTopics: allWeak,
    lastStudiedAt: new Date().toISOString(),
    progress: {
      ...set.progress,
      quizAccuracyPct: params.scorePct,
      overallPct: Math.round(
        (cardPct * 0.4) +
          (params.scorePct * 0.4) +
          (set.progress.writtenTestsCompleted > 0 ? 10 : 0) +
          (set.progress.fillBlanksCompleted > 0 ? 10 : 0),
      ),
      lastStudiedMode: "quiz",
    },
  });
}

/* ── Written Test Actions ── */
export function recordWrittenTestEvaluation(
  setId: string,
  questionId: string,
  userAnswer: string,
  evaluation: WrittenEvaluation,
): void {
  const set = getStudySetById(setId);
  if (!set) return;

  const updatedTests = set.writtenTests.map((t) => {
    if (t.id !== questionId) return t;
    const history = t.history || [];
    return {
      ...t,
      userAnswer,
      evaluation,
      history: [
        {
          userAnswer,
          scorePct: evaluation.scorePct,
          feedback: evaluation.aiFeedback,
          timestamp: new Date().toISOString(),
        },
        ...history,
      ],
    };
  });

  const completedCount = updatedTests.filter((t) => t.evaluation !== undefined).length;

  updateStudySet(setId, {
    writtenTests: updatedTests,
    lastStudiedAt: new Date().toISOString(),
    progress: {
      ...set.progress,
      writtenTestsCompleted: completedCount,
      lastStudiedMode: "written",
    },
  });
}

/* ── Fill in Blanks Actions ── */
export function recordFillBlankAttempt(
  setId: string,
  questionId: string,
  userAnswer: string,
  isCorrect: boolean,
): void {
  const set = getStudySetById(setId);
  if (!set) return;

  const updatedBlanks = set.fillBlanks.map((b) => {
    if (b.id !== questionId) return b;
    return {
      ...b,
      userAnswer,
      isCorrect,
    };
  });

  const completedCount = updatedBlanks.filter((b) => b.isCorrect === true).length;

  updateStudySet(setId, {
    fillBlanks: updatedBlanks,
    lastStudiedAt: new Date().toISOString(),
    progress: {
      ...set.progress,
      fillBlanksCompleted: completedCount,
      lastStudiedMode: "fillblanks",
    },
  });
}

/* ── Source Actions ── */
export function addSourceToStudySet(setId: string, source: Omit<StudySetSource, "id" | "uploadedAt">): void {
  const set = getStudySetById(setId);
  if (!set) return;

  const newSource: StudySetSource = {
    ...source,
    id: `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    uploadedAt: new Date().toISOString(),
  };

  updateStudySet(setId, {
    sources: [...set.sources, newSource],
  });
}

/* ── Folder Management ── */
export function getStudySetFolders(): StudySetFolder[] {
  if (typeof window === "undefined") return SEED_FOLDERS;
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(SEED_FOLDERS));
      return SEED_FOLDERS;
    }
    return JSON.parse(raw) as StudySetFolder[];
  } catch {
    return SEED_FOLDERS;
  }
}

export function createStudySetFolder(name: string, color: string = "#3B82F6"): StudySetFolder {
  const folders = getStudySetFolders();
  const newFolder: StudySetFolder = {
    id: `folder-${Date.now().toString(36)}`,
    name: name.trim(),
    color,
    createdAt: new Date().toISOString(),
  };
  const updated = [...folders, newFolder];
  if (typeof window !== "undefined") {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("study-sets-change"));
  }
  return newFolder;
}

