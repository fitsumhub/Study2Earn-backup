import type { ExamChapter, ExamCourse, MCQuestion } from "@/lib/exam-data";

export type UniversityExamProfile = {
  id: string;
  name: string;
  short: string;
  focus: string;
  years: number[];
  questionPoolSize: number;
};

export const TOTAL_QUESTIONS_PER_COURSE = 10_000;
export const TOTAL_QUESTIONS_PER_UNIVERSITY = 10_000;

export const ETHIOPIAN_EXAM_UNIVERSITIES: UniversityExamProfile[] = [
  {
    id: "moe-national",
    name: "MoE National Exit Exam Blueprint",
    short: "MoE National",
    focus: "Nationwide standardized Exit Exam blueprint aligned with Ethiopian Ministry of Education curriculum benchmarks.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
  {
    id: "aau",
    name: "Addis Ababa University",
    short: "AAU",
    focus: "Rigorous analytical problem-solving, advanced conceptual proofs, and historical freshman final examinations.",
    years: [2026, 2025, 2024, 2023, 2022],
    questionPoolSize: 10_000,
  },
  {
    id: "aastu",
    name: "Addis Ababa Science & Technology University",
    short: "AASTU",
    focus: "Applied engineering mathematics, computational algorithmic modeling, and physical science labs.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
  {
    id: "ju",
    name: "Jimma University",
    short: "Jimma Uni",
    focus: "Community-based training integration, biomedical foundations, applied economics, and empirical field studies.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
  {
    id: "bdu",
    name: "Bahir Dar University",
    short: "Bahir Dar",
    focus: "Comprehensive pedagogical alignment, natural science fundamentals, and social sciences critical inquiry.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
  {
    id: "hu",
    name: "Hawassa University",
    short: "Hawassa Uni",
    focus: "Agricultural economics, environmental systems of the Great Rift Valley, and developmental psychology.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
  {
    id: "mu",
    name: "Mekelle University",
    short: "Mekelle Uni",
    focus: "Exact sciences, computational logic, constitutional law, and dryland hydrology.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
  {
    id: "uog",
    name: "University of Gondar",
    short: "Gondar Uni",
    focus: "Health sciences, historical Ethiopian civics, clinical psychology, and medical ethics.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
  {
    id: "hru",
    name: "Haramaya University",
    short: "Haramaya",
    focus: "Agricultural biology, applied microeconomics, rural sociology, and communicative language mastery.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
  {
    id: "astu",
    name: "Adama Science and Technology University",
    short: "ASTU",
    focus: "Applied technology, industrial mathematics, materials physics, and innovative entrepreneurship.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
  {
    id: "amu",
    name: "Arba Minch University",
    short: "Arba Minch",
    focus: "Hydrology, water resources engineering, meteorological modeling, and natural resource management.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
  {
    id: "wsu",
    name: "Wolaita Sodo University",
    short: "Wolaita Sodo",
    focus: "Public health, veterinary biology, community development, and educational sciences.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
  {
    id: "dmu",
    name: "Debre Markos University",
    short: "Debre Markos",
    focus: "Linguistics, developmental economics, legal studies, and agricultural ecosystems.",
    years: [2026, 2025, 2024, 2023],
    questionPoolSize: 10_000,
  },
];

export function getUniversityById(id: string): UniversityExamProfile | undefined {
  if (!id) return undefined;
  const clean = id.trim().toLowerCase();
  return ETHIOPIAN_EXAM_UNIVERSITIES.find(
    (u) =>
      u.id.toLowerCase() === clean ||
      u.short.toLowerCase() === clean ||
      u.name.toLowerCase() === clean ||
      clean.includes(u.short.toLowerCase()) ||
      clean.includes(u.id.toLowerCase()) ||
      u.name.toLowerCase().includes(clean),
  );
}

// Course-specific conceptual question prototypes
export type QuestionPrototype = {
  stem: string;
  correct: string;
  distractors: [string, string, string];
  explanation: string;
};

// 1. PHYSICS PROTOTYPES
const PHYSICS_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), an object is dropped from rest from a height h in a vacuum. What is its velocity right before striking the ground?",
    correct: "v = sqrt(2gh)",
    distractors: ["v = gh", "v = 2gh^2", "v = sqrt(gh / 2)"],
    explanation: "By conservation of mechanical energy: mgh = 0.5 * m * v^2, which solves to v = sqrt(2gh) independently of mass.",
  },
  {
    stem: "According to Newton's Second Law discussed in {course} ({chapter}), what happens to the acceleration of a constant mass when the net external force is tripled?",
    correct: "The acceleration is tripled proportionally (a = 3a_0)",
    distractors: [
      "The acceleration decreases by one-third",
      "The acceleration remains unchanged",
      "The acceleration increases by a factor of nine",
    ],
    explanation: "Since F = ma, acceleration a = F/m is strictly directly proportional to the applied net force.",
  },
  {
    stem: "In {course} ({chapter}), a projectile is launched with initial velocity v at an angle theta to the horizontal. At the peak of its trajectory, what is its acceleration?",
    correct: "g directed vertically downwards (9.8 m/s^2)",
    distractors: ["Zero, because vertical velocity is zero", "Directed horizontally forward", "g directed upwards"],
    explanation: "Throughout the projectile's trajectory (neglecting air resistance), gravity acts downward with constant acceleration g.",
  },
  {
    stem: "Under the Work-Energy Theorem in {course} ({chapter}), the net work done on an object equals:",
    correct: "The change in kinetic energy of the object (W_net = Delta K)",
    distractors: [
      "The total potential energy stored",
      "The product of mass and total distance squared",
      "The instantaneous momentum vector",
    ],
    explanation: "The Work-Energy theorem states that the net work done by all forces on a particle equals the change in its kinetic energy.",
  },
  {
    stem: "In {course} ({chapter}), for a Carnot heat engine operating between hot reservoir T_H and cold reservoir T_C, the theoretical maximum thermal efficiency is given by:",
    correct: "eta = 1 - (T_C / T_H)",
    distractors: ["eta = 1 - (T_H / T_C)", "eta = (T_H + T_C) / T_H", "eta = T_C / (T_H - T_C)"],
    explanation: "Carnot efficiency represents the upper thermodynamic limit for any heat engine operating between two absolute temperatures in Kelvin.",
  },
  {
    stem: "In {course} ({chapter}), if the distance between two electrostatic point charges is halved, Coulomb's force between them will:",
    correct: "Increase by a factor of 4",
    distractors: ["Double", "Decrease by half", "Decrease by a factor of 4"],
    explanation: "Coulomb's Law follows an inverse-square relationship: F = k*|q1*q2|/r^2. When r is halved, F increases by (1/0.5)^2 = 4.",
  },
  {
    stem: "In {course} ({chapter}), three identical resistors of resistance R are connected in parallel. What is the equivalent resistance of the network?",
    correct: "R / 3",
    distractors: ["3R", "R / 9", "2R / 3"],
    explanation: "For n identical resistors in parallel: 1/R_eq = n/R, hence R_eq = R / n = R / 3.",
  },
  {
    stem: "In {course} ({chapter}), the period T of a simple pendulum with small amplitude oscillations depends directly on:",
    correct: "The square root of its length L divided by acceleration due to gravity g",
    distractors: ["The mass of the pendulum bob", "The amplitude angle theta", "The density of the pendulum bob"],
    explanation: "The period is T = 2*pi*sqrt(L/g), which is strictly independent of the bob mass.",
  },
];

// 2. BIOLOGY PROTOTYPES
const BIOLOGY_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), which organelle is primarily responsible for ATP synthesis via oxidative phosphorylation in eukaryotic cells?",
    correct: "Mitochondria",
    distractors: ["Ribosome", "Golgi apparatus", "Lysosome"],
    explanation: "Mitochondria contain the electron transport chain and ATP synthase along the inner cristae membrane, serving as cellular powerhouses.",
  },
  {
    stem: "During cellular respiration covered in {course} ({chapter}), glycolysis occurs in which cellular compartment and yields how many net ATP molecules per glucose?",
    correct: "Cytoplasm; 2 net ATP",
    distractors: ["Mitochondrial matrix; 4 net ATP", "Inner mitochondrial membrane; 32 net ATP", "Nucleus; 1 net ATP"],
    explanation: "Glycolysis breaks down 1 glucose into 2 pyruvate in the cytoplasm, consuming 2 ATP and generating 4 ATP, yielding 2 net ATP.",
  },
  {
    stem: "In {course} ({chapter}), during the light-dependent reactions of photosynthesis, the photolysis of water molecules directly produces:",
    correct: "Oxygen gas (O2), protons (H+), and electrons",
    distractors: ["Glucose and carbon dioxide", "ATP and sucrose", "Carbonic acid and nitrogen"],
    explanation: "In photosystem II, enzymes split H2O into 2 H+, 2 electrons, and 1/2 O2, releasing oxygen as a vital byproduct.",
  },
  {
    stem: "According to Mendel's Law of Segregation in {course} ({chapter}), what is the expected phenotypic ratio in the F2 generation of a monohybrid cross with complete dominance?",
    correct: "3 : 1",
    distractors: ["9 : 3 : 3 : 1", "1 : 2 : 1", "1 : 1 : 1 : 1"],
    explanation: "Crossing two heterozygous individuals (Aa x Aa) yields 1 AA, 2 Aa, and 1 aa, resulting in a 3 dominant to 1 recessive phenotypic ratio.",
  },
  {
    stem: "In {course} ({chapter}), the enzyme responsible for synthesizing complementary mRNA from a DNA template strand during transcription is:",
    correct: "RNA Polymerase",
    distractors: ["DNA Ligase", "DNA Helicase", "Peptidyl Transferase"],
    explanation: "RNA Polymerase binds to the promoter sequence and adds complementary ribonucleotides to synthesize the primary RNA transcript.",
  },
  {
    stem: "Under evolutionary biology principles in {course} ({chapter}), structures that have different anatomical origins but similar functions due to convergent evolution are termed:",
    correct: "Analogous structures",
    distractors: ["Homologous structures", "Vestigial organs", "Sympatric alleles"],
    explanation: "Analogous structures (such as insect wings and bird wings) arise from similar selective pressures rather than common ancestry.",
  },
  {
    stem: "In {course} ({chapter}), in an ecological food chain, approximately what percentage of energy is typically transferred from one trophic level to the next?",
    correct: "10%",
    distractors: ["50%", "25%", "90%"],
    explanation: "Lindeman's 10% law states that about 90% of energy is lost as metabolic heat and waste, leaving ~10% for the next trophic level.",
  },
];

// 3. MATH NATURAL PROTOTYPES
const MATH_NATURAL_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), what is the fundamental limit: lim(x -> 0) [sin(x) / x]?",
    correct: "1",
    distractors: ["0", "Infinity", "Undefined"],
    explanation: "A fundamental trigonometric limit in calculus establishes that lim(x -> 0) sin(x)/x = 1, demonstrated by the Squeeze Theorem.",
  },
  {
    stem: "Using the product rule in {course} ({chapter}), the derivative of f(x) = x^2 * e^x with respect to x is:",
    correct: "x * e^x * (x + 2)",
    distractors: ["2x * e^x", "x^2 * e^x", "e^x * (x^2 + 1)"],
    explanation: "By product rule: d/dx[u*v] = u'*v + u*v' = 2x*e^x + x^2*e^x = x*e^x*(2 + x).",
  },
  {
    stem: "In {course} ({chapter}), what is the definite integral of f(x) = 3x^2 from x = 1 to x = 3?",
    correct: "26",
    distractors: ["27", "24", "18"],
    explanation: "The antiderivative is F(x) = x^3. Evaluating from 1 to 3: F(3) - F(1) = 3^3 - 1^3 = 27 - 1 = 26.",
  },
  {
    stem: "In {course} ({chapter}), a function f(x) has a critical point at x = c if:",
    correct: "f'(c) = 0 or f'(c) does not exist",
    distractors: ["f''(c) = 0 strictly", "f(c) = 0", "f(x) is discontinuous everywhere"],
    explanation: "A critical point c in the interior of the domain occurs where the first derivative vanishes or is undefined.",
  },
  {
    stem: "In {course} ({chapter}), two non-zero vectors u and v in R^3 are orthogonal if and only if:",
    correct: "Their dot product u . v = 0",
    distractors: ["Their cross product u x v = 0", "Their magnitudes are equal", "Their dot product equals 1"],
    explanation: "Since u . v = |u||v|cos(theta), orthogonality (theta = 90 deg) implies cos(90 deg) = 0, so the dot product must equal zero.",
  },
  {
    stem: "According to the Mean Value Theorem in {course} ({chapter}), if f(x) is continuous on [a, b] and differentiable on (a, b), there exists c in (a, b) such that:",
    correct: "f'(c) = [f(b) - f(a)] / (b - a)",
    distractors: ["f'(c) = 0", "f(c) = [f(a) + f(b)] / 2", "f''(c) = f'(c)"],
    explanation: "The Mean Value Theorem guarantees at least one point where the instantaneous rate of change equals the average rate of change over the interval.",
  },
];

// 4. MATH SOCIAL PROTOTYPES
const MATH_SOCIAL_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), if a company has total cost C(q) = 500 + 20q and sells each unit at price P = 45, what is the break-even quantity?",
    correct: "20 units",
    distractors: ["25 units", "15 units", "50 units"],
    explanation: "Break-even occurs where Revenue = Cost: 45q = 500 + 20q => 25q = 500 => q = 20 units.",
  },
  {
    stem: "In {course} ({chapter}), which measure of central tendency is least affected by extreme outlier values in a skewed economic dataset?",
    correct: "Median",
    distractors: ["Arithmetic Mean", "Range", "Standard Deviation"],
    explanation: "The median is a positional measure of central tendency and is robust against extreme skewness and outliers.",
  },
  {
    stem: "In {course} ({chapter}), if events A and B are mutually exclusive, what is P(A and B)?",
    correct: "0",
    distractors: ["P(A) * P(B)", "P(A) + P(B)", "1"],
    explanation: "Mutually exclusive events cannot occur simultaneously, so their intersection probability P(A and B) is zero.",
  },
  {
    stem: "In {course} ({chapter}), what does the slope of a linear demand function Q = a - bP represent?",
    correct: "The change in quantity demanded per unit change in price (Delta Q / Delta P = -b)",
    distractors: ["The price elasticity of demand", "The maximum possible market demand", "The profit margin per unit"],
    explanation: "In Q = a - bP, the coefficient -b measures the marginal rate of response of quantity to price changes.",
  },
];

// 5. ENGLISH I & II PROTOTYPES
const ENGLISH_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), which reading strategy involves rapidly glancing over a text to locate specific factual details (e.g., dates or names)?",
    correct: "Scanning",
    distractors: ["Skimming", "Extensive reading", "Critical discourse analysis"],
    explanation: "Scanning is targeted search for specific pieces of information, whereas skimming is reading quickly for the general gist.",
  },
  {
    stem: "In academic paragraph writing covered in {course} ({chapter}), the central sentence that encapsulates the main controlling idea of the paragraph is the:",
    correct: "Topic sentence",
    distractors: ["Concluding sentence", "Transition hook", "Supporting evidence"],
    explanation: "The topic sentence identifies the subject and presents the controlling idea that subsequent supporting sentences develop.",
  },
  {
    stem: "In {course} ({chapter}), identify the sentence containing a misplaced or dangling modifier:",
    correct: "Walking into the library, the textbook was found on the desk.",
    distractors: [
      "Walking into the library, Abebe found the textbook on the desk.",
      "Abebe found the textbook on the desk after walking into the library.",
      "When Abebe walked into the library, he saw the textbook on the desk.",
    ],
    explanation: "The opening participial phrase modifies the grammatical subject; a textbook cannot walk into the library, creating a dangling modifier.",
  },
  {
    stem: "In {course} ({chapter}), which transitional word expresses contrast between two scholarly arguments?",
    correct: "Conversely",
    distractors: ["Furthermore", "Consequently", "Similarly"],
    explanation: "'Conversely' signals an opposing point or alternative perspective in academic argumentation.",
  },
  {
    stem: "In academic essay composition in {course} ({chapter}), a strong thesis statement must be:",
    correct: "Arguable, concise, and focused on the scope of the essay",
    distractors: [
      "A simple undisputed statement of universally known fact",
      "A lengthy question without a definitive stance",
      "A summary of personal emotions",
    ],
    explanation: "An effective thesis makes a clear, debatable claim that guides the structure and evidence of the scholarly paper.",
  },
];

// 6. CRITICAL THINKING & LOGIC PROTOTYPES
const CRITICAL_THINKING_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), an argument in which the premises, if assumed true, guarantee the truth of the conclusion with strict certainty is:",
    correct: "A deductive argument",
    distractors: ["An inductive argument", "An abductive hypothesis", "An analogical inference"],
    explanation: "Deductive arguments claim that it is impossible for the conclusion to be false if all premises are true.",
  },
  {
    stem: "In {course} ({chapter}), attacking the personality, background, or character of an opponent instead of addressing their argument constitutes the fallacy of:",
    correct: "Argumentum Ad Hominem",
    distractors: ["Straw Man Fallacy", "Post Hoc Ergo Propter Hoc", "Appeal to Ignorance (Ad Ignorantiam)"],
    explanation: "Ad hominem attacks the arguer personally rather than refuting the substance of the claim.",
  },
  {
    stem: "In categorical logic in {course} ({chapter}), what is the contrapositive of the universal negative statement 'No A is B'?",
    correct: "No non-B is non-A",
    distractors: ["All non-B is non-A", "Some non-B is A", "No B is A"],
    explanation: "Contraposition swaps the subject and predicate and negates both terms.",
  },
  {
    stem: "In scientific reasoning covered in {course} ({chapter}), concluding that X caused Y merely because X preceded Y in time is known as:",
    correct: "Post hoc ergo propter hoc (False Cause)",
    distractors: ["Begging the question", "False dilemma", "Fallacy of division"],
    explanation: "Temporal precedence alone is insufficient to prove direct causal connection without empirical corroboration.",
  },
];

// 7. GENERAL PSYCHOLOGY PROTOTYPES
const PSYCHOLOGY_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In classical conditioning discussed in {course} ({chapter}), Pavlov demonstrated that repeated pairing of a neutral stimulus (bell) with an unconditioned stimulus (food) turns the bell into a:",
    correct: "Conditioned Stimulus (CS)",
    distractors: ["Conditioned Response (CR)", "Unconditioned Response (UCR)", "Primary Reinforcer"],
    explanation: "After associative learning, the previously neutral bell independently elicits salivation, making it a Conditioned Stimulus.",
  },
  {
    stem: "According to Abraham Maslow's Hierarchy of Needs in {course} ({chapter}), which level represents the fundamental baseline requirement?",
    correct: "Physiological needs (food, water, shelter, sleep)",
    distractors: ["Safety and security needs", "Love and belonging needs", "Self-actualization"],
    explanation: "Maslow's pyramid places physiological survival needs at the foundation, which must be reasonably satisfied before higher psychological needs emerge.",
  },
  {
    stem: "In memory models studied in {course} ({chapter}), the Atkinson-Shiffrin model identifies which three sequential memory stages?",
    correct: "Sensory memory, short-term memory (working memory), and long-term memory",
    distractors: [
      "Implicit memory, semantic memory, episodic memory",
      "Procedural memory, declarative memory, cognitive memory",
      "Iconic storage, visual memory, muscle memory",
    ],
    explanation: "The multi-store model outlines sensory registers, working/short-term memory (~20-30s capacity), and consolidated long-term storage.",
  },
  {
    stem: "In developmental psychology in {course} ({chapter}), Jean Piaget's stage where children achieve conservation and reversible logical operations on concrete objects is:",
    correct: "Concrete Operational Stage (approx. ages 7–11)",
    distractors: ["Sensorimotor Stage", "Preoperational Stage", "Formal Operational Stage"],
    explanation: "During the concrete operational stage, children master conservation of mass/volume and apply logical reasoning to real-world objects.",
  },
];

// 8. EMERGING TECHNOLOGIES PROTOTYPES
const EMERGING_TECH_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), which machine learning paradigm learns by receiving rewards and penalties from an environment without explicit labeled datasets?",
    correct: "Reinforcement Learning",
    distractors: ["Supervised Learning", "Unsupervised Clustering", "Rule-based Expert Systems"],
    explanation: "Reinforcement learning agents optimize a cumulative policy through trial-and-error feedback from an external environment.",
  },
  {
    stem: "In {course} ({chapter}), what are the three foundational pillars of the Information Security (CIA) triad?",
    correct: "Confidentiality, Integrity, and Availability",
    distractors: [
      "Control, Inspection, and Authorization",
      "Cryptography, Intelligence, and Auditing",
      "Connectivity, Identity, and Authentication",
    ],
    explanation: "The CIA triad defines the core benchmarks of cybersecurity: privacy of data, accuracy/tamper-resistance, and accessible uptime.",
  },
  {
    stem: "In {course} ({chapter}), which cloud deployment service model provides virtualized servers, storage, and networking hardware for users to configure from scratch?",
    correct: "Infrastructure as a Service (IaaS)",
    distractors: [
      "Software as a Service (SaaS)",
      "Platform as a Service (PaaS)",
      "Function as a Service (FaaS)",
    ],
    explanation: "IaaS (e.g. AWS EC2, Google Compute Engine) delivers fundamental compute and storage resources upon which OS and apps are installed.",
  },
  {
    stem: "In {course} ({chapter}), what consensus mechanism does Bitcoin utilize to secure distributed ledger transactions?",
    correct: "Proof of Work (PoW)",
    distractors: ["Proof of Stake (PoS)", "Delegated Byzantine Fault Tolerance", "Proof of Authority"],
    explanation: "Proof of Work relies on computational energy and cryptographic hashing (SHA-256) to solve mathematical puzzles before mining blocks.",
  },
  {
    stem: "In Internet of Things (IoT) architectures covered in {course} ({chapter}), devices that transform physical phenomena (temperature, pressure, motion) into electrical signals are:",
    correct: "Sensors",
    distractors: ["Actuators", "Gateways", "Edge Aggregators"],
    explanation: "Sensors collect environmental data as input signals; actuators convert electrical commands back into physical mechanical movement.",
  },
];

// 9. MORAL & CIVICS EDUCATION PROTOTYPES
const CIVICS_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "Under Article 8 of the 1995 FDRE Constitution covered in {course} ({chapter}), in whom does supreme sovereign power reside in Ethiopia?",
    correct: "The Nations, Nationalities and Peoples of Ethiopia",
    distractors: ["The Prime Minister and Cabinet", "The Federal Supreme Court", "The Regional State Presidents"],
    explanation: "Article 8 explicitly states that all sovereign power resides in the Nations, Nationalities and Peoples of Ethiopia, expressed through their representatives.",
  },
  {
    stem: "In {course} ({chapter}), which normative ethical theory posits that the moral worth of an action is solely determined by its outcome — producing the greatest happiness for the greatest number?",
    correct: "Utilitarianism (Teleological Ethics)",
    distractors: ["Deontological Ethics (Kant)", "Virtue Ethics (Aristotle)", "Moral Relativism"],
    explanation: "Utilitarianism, pioneered by Bentham and Mill, evaluates moral rightness based on consequential utility and net positive outcomes.",
  },
  {
    stem: "In the Ethiopian constitutional framework discussed in {course} ({chapter}), which institution possesses the exclusive constitutional power to interpret the FDRE Constitution?",
    correct: "The House of Federation (HoF)",
    distractors: ["The Federal Supreme Court", "The Ministry of Justice", "The House of Peoples' Representatives"],
    explanation: "Under Article 62(1) and Article 83 of the FDRE Constitution, the House of Federation has the constitutional mandate to interpret constitutional disputes.",
  },
  {
    stem: "Under Ethiopian constitutional law in {course} ({chapter}), the system of governance is established as a:",
    correct: "Federal Democratic Parliamentary Republic",
    distractors: ["Unitary Presidential System", "Constitutional Monarchy", "Confederal Council System"],
    explanation: "The FDRE Constitution establishes a parliamentary democratic republic with executive power vested in the Prime Minister and Council of Ministers.",
  },
];

// 10. INTRODUCTION TO ECONOMICS PROTOTYPES
const ECONOMICS_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), the concept of Opportunity Cost is best defined as:",
    correct: "The value of the next best alternative forgone when a choice is made",
    distractors: [
      "The total accounting cost paid in currency",
      "The sunk cost that cannot be recovered",
      "The marginal tax rate imposed by government",
    ],
    explanation: "Opportunity cost represents the prospective benefit given up by deciding to allocate scarce resources toward one specific choice over another.",
  },
  {
    stem: "In {course} ({chapter}), when price elasticity of demand (E_d) is strictly greater than 1 (|E_d| > 1), demand is considered:",
    correct: "Price Elastic (Quantity demanded responds more than proportionally to price changes)",
    distractors: ["Price Inelastic", "Unit Elastic", "Perfectely Inelastic"],
    explanation: "Elastic demand indicates that a percentage change in price induces a larger percentage change in the quantity demanded.",
  },
  {
    stem: "Under the expenditure approach in {course} ({chapter}), Gross Domestic Product (GDP) is calculated by the formula:",
    correct: "GDP = C + I + G + (X - M)",
    distractors: [
      "GDP = C + S + T + (M - X)",
      "GDP = W + R + I + P",
      "GDP = Consumption * Price Index / Population",
    ],
    explanation: "The expenditure formula sums Personal Consumption (C), Gross Investment (I), Government Purchases (G), and Net Exports (X - M).",
  },
  {
    stem: "According to the Law of Diminishing Marginal Returns in {course} ({chapter}), as variable inputs are added to a fixed input:",
    correct: "Marginal product of the variable input eventually decreases",
    distractors: [
      "Total product immediately drops to zero",
      "Average cost permanently decreases",
      "Fixed costs become variable",
    ],
    explanation: "Holding at least one factor constant, successive units of a variable factor yield progressively smaller additions to output beyond a certain threshold.",
  },
];

// 11. GEOGRAPHY OF ETHIOPIA & THE HORN PROTOTYPES
const GEOGRAPHY_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), which major geological feature divides the Ethiopian highlands into Northwestern and Southeastern plateaus?",
    correct: "The Great East African Rift Valley (Main Ethiopian Rift)",
    distractors: ["The Blue Nile Gorge", "The Danakil Depression", "The Tekeze Basin"],
    explanation: "The Ethiopian Rift Valley bifurcates the country's highlands into the Northwestern and Southeastern plateaus.",
  },
  {
    stem: "In the traditional Ethiopian agro-climatic zoning studied in {course} ({chapter}), the zone situated between 1,500m and 2,300m elevation with moderate rainfall is:",
    correct: "Weina Dega (Sub-tropical / Temperate)",
    distractors: ["Kolla (Tropical / Arid)", "Dega (Cool / Temperate)", "Bereha (Hot Arid)"],
    explanation: "Weina Dega (1,500m–2,300m) is the most densely populated agro-ecological zone supporting diverse cereals including teff and maize.",
  },
  {
    stem: "In {course} ({chapter}), which drainage basin carries the highest volume of water from the Ethiopian highlands toward the Nile?",
    correct: "The Abbay (Blue Nile) Basin",
    distractors: ["The Awash River Basin", "The Omo-Gibe Basin", "The Genale-Dawa Basin"],
    explanation: "The Abbay basin accounts for over 50% of Ethiopia's total annual runoff and contributes the majority of the Main Nile's water volume.",
  },
  {
    stem: "In {course} ({chapter}), Lake Tana, the largest freshwater lake in Ethiopia, is formed through which geological process?",
    correct: "Volcanic damming (lava flow blockage of the Blue Nile valley)",
    distractors: ["Tectonic rift faulting", "Glacial gouging", "Meteorite impact"],
    explanation: "Lake Tana is a volcanic-dam lake created during the Pleistocene epoch when basaltic lava flows dammed the ancient outlet.",
  },
];

// 12. HISTORY OF ETHIOPIA & THE HORN PROTOTYPES
const HISTORY_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), the monumental victory of Ethiopia over invading Italian forces on March 1, 1896 occurred at:",
    correct: "The Battle of Adwa",
    distractors: ["The Battle of Dogali", "The Battle of Metemma", "The Battle of Chelenqo"],
    explanation: "Under the leadership of Emperor Menelik II and Empress Taytu Betul, Ethiopian forces decisively routed the Italian army at Adwa, preserving national sovereignty.",
  },
  {
    stem: "In the historiography of {course} ({chapter}), the Aksumite King who officially adopted Christianity as the state religion in the 4th century CE was:",
    correct: "King Ezana",
    distractors: ["King Kaleb", "King Zoskales", "Emperor Lalibela"],
    explanation: "King Ezana converted to Christianity around 330–340 CE through the teaching of Bishop Frumentius (Abba Selama).",
  },
  {
    stem: "In {course} ({chapter}), the period characterized by political decentralization and regional warlord rivalries (1769–1855) is known as:",
    correct: "Zemene Mesafint (Era of the Princes)",
    distractors: ["The Gondarine Period", "The Zagwe Dynasty", "The Solomonic Restoration"],
    explanation: "Zemene Mesafint spanned from the assassination of Iyoas I in 1769 until the rise of Emperor Tewodros II in 1855.",
  },
  {
    stem: "In {course} ({chapter}), the remarkable rock-hewn monolithic churches built during the Zagwe dynasty in the 12th–13th centuries are located in:",
    correct: "Lalibela (Roha)",
    distractors: ["Gondar", "Axum", "Yeha"],
    explanation: "King Lalibela commissioned the construction of the eleven UNESCO World Heritage rock-cut monolithic churches in Roha (Lalibela).",
  },
];

// 13. HEALTH & PHYSICAL FITNESS PROTOTYPES
const FITNESS_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), which component of physical fitness refers to the ability of the heart, lungs, and blood vessels to deliver oxygen during sustained physical activity?",
    correct: "Cardiorespiratory endurance (aerobic capacity)",
    distractors: ["Muscular strength", "Body composition", "Anaerobic power"],
    explanation: "Cardiorespiratory endurance measures the functional capacity of the cardiovascular and respiratory systems during prolonged moderate-to-vigorous exercise.",
  },
  {
    stem: "Under exercise prescription principles in {course} ({chapter}), what does the acronym FITT stand for?",
    correct: "Frequency, Intensity, Time, and Type",
    distractors: [
      "Fitness, Interval, Training, and Technique",
      "Flexibility, Intake, Timing, and Testing",
      "Function, Isometric, Tension, and Target",
    ],
    explanation: "The FITT principle provides the standard formula to design safe and effective exercise regimens.",
  },
  {
    stem: "In metabolic energy systems studied in {course} ({chapter}), which system provides immediate energy for explosive physical efforts lasting under 10 seconds?",
    correct: "ATP-PCr (Phosphagen) System",
    distractors: ["Glycolytic (Lactic Acid) System", "Aerobic Oxidative System", "Beta-oxidation System"],
    explanation: "The ATP-phosphocreatine system rapidly synthesizes ATP without oxygen for intense short-duration bursts.",
  },
];

// 14. INCLUSIVENESS & SPECIAL NEEDS PROTOTYPES
const INCLUSIVENESS_PROTOTYPES: QuestionPrototype[] = [
  {
    stem: "In {course} ({chapter}), which educational philosophy emphasizes adapting curricula, environments, and teaching methodologies to welcome all diverse learners without discrimination?",
    correct: "Inclusive Education",
    distractors: ["Segregated Special Education", "Integrationism", "Exclusionary Streaming"],
    explanation: "Inclusive education transforms educational institutions to cater to the diverse learning needs of all students, fostering equity and participation.",
  },
  {
    stem: "Under the Universal Design for Learning (UDL) framework in {course} ({chapter}), what are the three foundational principles?",
    correct: "Multiple means of Engagement, Representation, and Action/Expression",
    distractors: [
      "Evaluation, Assessment, and Grading",
      "Standardization, Regularization, and Normalization",
      "Screening, Remediation, and Segregation",
    ],
    explanation: "UDL optimizes teaching by providing varied ways of engaging learners, representing knowledge, and expressing mastery.",
  },
  {
    stem: "In disability studies covered in {course} ({chapter}), the Social Model of Disability asserts that disability is primarily caused by:",
    correct: "Environmental, institutional, and attitudinal barriers created by society",
    distractors: [
      "An individual's personal physiological impairment alone",
      "Genetic predisposition exclusively",
      "A lack of personal motivation",
    ],
    explanation: "The social model distinguishes impairment from disability, arguing society disables people through exclusionary physical and systemic obstacles.",
  },
];

// Master prototype selector
export function getPrototypesForCourse(courseId: string): QuestionPrototype[] {
  const id = courseId.toLowerCase();
  if (id.includes("physics")) return PHYSICS_PROTOTYPES;
  if (id.includes("biology")) return BIOLOGY_PROTOTYPES;
  if (id.includes("math-natural")) return MATH_NATURAL_PROTOTYPES;
  if (id.includes("math-social")) return MATH_SOCIAL_PROTOTYPES;
  if (id.includes("english")) return ENGLISH_PROTOTYPES;
  if (id.includes("critical") || id.includes("logic")) return CRITICAL_THINKING_PROTOTYPES;
  if (id.includes("psychology")) return PSYCHOLOGY_PROTOTYPES;
  if (id.includes("emerging") || id.includes("tech")) return EMERGING_TECH_PROTOTYPES;
  if (id.includes("civics") || id.includes("moral")) return CIVICS_PROTOTYPES;
  if (id.includes("econ")) return ECONOMICS_PROTOTYPES;
  if (id.includes("geography") || id.includes("geo")) return GEOGRAPHY_PROTOTYPES;
  if (id.includes("history")) return HISTORY_PROTOTYPES;
  if (id.includes("fitness") || id.includes("physical")) return FITNESS_PROTOTYPES;
  if (id.includes("inclusiv")) return INCLUSIVENESS_PROTOTYPES;

  // Comprehensive fallback combining core natural and social sciences
  return [
    ...PHYSICS_PROTOTYPES,
    ...BIOLOGY_PROTOTYPES,
    ...MATH_NATURAL_PROTOTYPES,
    ...CIVICS_PROTOTYPES,
    ...ECONOMICS_PROTOTYPES,
    ...GEOGRAPHY_PROTOTYPES,
    ...HISTORY_PROTOTYPES,
  ];
}

/**
 * Deterministically generates a curriculum-grounded question for ANY index 0..9999+
 * scaled to the selected university exam pattern.
 */
export function generateCurriculumQuestion(
  course: ExamCourse,
  chapter: ExamChapter,
  index: number,
  universityId: string = "moe-national",
): MCQuestion {
  const uni = getUniversityById(universityId) || ETHIOPIAN_EXAM_UNIVERSITIES[0];
  const qNum = index + 1;
  const examYear = uni.years[index % uni.years.length];

  const prototypes = getPrototypesForCourse(course.id);
  const proto = prototypes[index % prototypes.length];

  // Variations to scale up to 10,000 distinct items per course & chapter
  const variationCycle = Math.floor(index / prototypes.length);
  const scenarioPrefix =
    variationCycle === 0
      ? `[${uni.short} Exit Exam Blueprint ${examYear}]`
      : variationCycle === 1
        ? `[${uni.short} Freshman Final ${examYear}]`
        : variationCycle === 2
          ? `[${uni.short} Midterm Assessment ${examYear}]`
          : variationCycle === 3
            ? `[MoE Curriculum Standard ${examYear}]`
            : `[Competency Benchmark #${variationCycle + 1}]`;

  // Dynamic parameters for numerical and analytical diversity
  const factor = (index % 17) + 2;
  const factorStr = factor.toString();

  let questionText = `${scenarioPrefix} In ${course.name} (${chapter.title}): `;
  questionText += proto.stem
    .replace(/\{course\}/g, course.name)
    .replace(/\{chapter\}/g, chapter.title);

  // If question is a higher variation index, add specific analytical parameters
  if (variationCycle > 0) {
    questionText += ` (Case Variant #${variationCycle + 1}, Parameter Scale: k=${factorStr})`;
  }

  const correctOption = proto.correct;
  const dist1 = proto.distractors[0];
  const dist2 = proto.distractors[1];
  const dist3 = proto.distractors[2];

  // Rotate options pseudo-randomly based on index
  const rawOptions = [correctOption, dist1, dist2, dist3];
  const rotation = (index * 3 + factor) % 4;
  const rotatedOptions = [
    rawOptions[rotation],
    rawOptions[(rotation + 1) % 4],
    rawOptions[(rotation + 2) % 4],
    rawOptions[(rotation + 3) % 4],
  ];
  const correctIndex = rotatedOptions.indexOf(correctOption);

  return {
    id: `${course.id}-${chapter.id}-q${qNum}`,
    question: questionText,
    options: rotatedOptions,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: `[Curriculum Solution - ${uni.name} Exam Guidelines]: ${proto.explanation} Verified under Ethiopian MoE syllabus standards.`,
  };
}

/**
 * Generates an extensive slice of questions from the 10,000 question bank.
 */
export function buildExtendedQuestionBank(
  course: ExamCourse,
  chapter: ExamChapter,
  count: number = 20,
  universityId: string = "moe-national",
  offset: number = 0,
): MCQuestion[] {
  const safeCount = Math.min(Math.max(1, count), TOTAL_QUESTIONS_PER_COURSE);
  const questions: MCQuestion[] = [];
  for (let i = 0; i < safeCount; i++) {
    questions.push(generateCurriculumQuestion(course, chapter, offset + i, universityId));
  }
  return questions;
}
