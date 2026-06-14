export type ExamChapter = {
  id: string;
  title: string;
};

export type ExamCourse = {
  id: string;
  name: string;
  short: string;
  tint: string;
  category: "Natural Science" | "Social Science" | "Common";
  durationMinutes: number;
  questionsPerExam: number;
  chapters: ExamChapter[];
};

export type MCQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const examCourses: ExamCourse[] = [
  {
    id: "emerging-tech",
    name: "Introduction to Emerging Technologies",
    short: "Emerging Tech",
    tint: "from-cyan-100 to-cyan-50",
    category: "Common",
    durationMinutes: 20,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "Digital Transformation Basics" },
      { id: "ch-2", title: "Artificial Intelligence Fundamentals" },
      { id: "ch-3", title: "Internet of Things (IoT)" },
      { id: "ch-4", title: "Cloud Computing & Big Data" },
      { id: "ch-5", title: "Cybersecurity Essentials" },
      { id: "ch-6", title: "Ethics in Technology" },
    ],
  },
  {
    id: "general-physics",
    name: "General Physics",
    short: "Physics",
    tint: "from-blue-100 to-blue-50",
    category: "Natural Science",
    durationMinutes: 25,
    questionsPerExam: 10,
    chapters: [
      { id: "ch-1", title: "Units & Measurement" },
      { id: "ch-2", title: "Kinematics" },
      { id: "ch-3", title: "Dynamics & Newton's Laws" },
      { id: "ch-4", title: "Work, Energy & Power" },
      { id: "ch-5", title: "Rotational Motion" },
      { id: "ch-6", title: "Gravitation" },
      { id: "ch-7", title: "Waves & Oscillations" },
      { id: "ch-8", title: "Heat & Thermodynamics" },
      { id: "ch-9", title: "Electrostatics" },
      { id: "ch-10", title: "Current Electricity" },
    ],
  },
  {
    id: "inclusiveness",
    name: "Inclusiveness",
    short: "Inclusiveness",
    tint: "from-orange-100 to-orange-50",
    category: "Common",
    durationMinutes: 15,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "Understanding Diversity" },
      { id: "ch-2", title: "Inclusive Classrooms" },
      { id: "ch-3", title: "Disability & Access" },
      { id: "ch-4", title: "Community & Belonging" },
    ],
  },
  {
    id: "general-biology",
    name: "General Biology (Biol. 1012)",
    short: "Biology",
    tint: "from-lime-100 to-lime-50",
    category: "Natural Science",
    durationMinutes: 25,
    questionsPerExam: 10,
    chapters: [
      { id: "ch-1", title: "Introduction to Biology" },
      { id: "ch-2", title: "Cell Structure & Function" },
      { id: "ch-3", title: "Cell Metabolism" },
      { id: "ch-4", title: "Genetics & Heredity" },
      { id: "ch-5", title: "DNA, RNA & Protein Synthesis" },
      { id: "ch-6", title: "Evolution" },
      { id: "ch-7", title: "Ecology & Ecosystems" },
      { id: "ch-8", title: "Plant Biology" },
      { id: "ch-9", title: "Human Body Systems" },
      { id: "ch-10", title: "Microbiology" },
    ],
  },
  {
    id: "math-natural",
    name: "Mathematics for Natural Sciences",
    short: "Math (Nat.)",
    tint: "from-violet-100 to-violet-50",
    category: "Natural Science",
    durationMinutes: 30,
    questionsPerExam: 10,
    chapters: [
      { id: "ch-1", title: "Functions & Graphs" },
      { id: "ch-2", title: "Limits & Continuity" },
      { id: "ch-3", title: "Derivatives" },
      { id: "ch-4", title: "Applications of Derivatives" },
      { id: "ch-5", title: "Integration" },
      { id: "ch-6", title: "Trigonometry" },
      { id: "ch-7", title: "Sequences & Series" },
      { id: "ch-8", title: "Probability & Statistics" },
    ],
  },
  {
    id: "math-social",
    name: "Mathematics for Social Sciences",
    short: "Math (Soc.)",
    tint: "from-purple-100 to-purple-50",
    category: "Social Science",
    durationMinutes: 25,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "Algebra Review" },
      { id: "ch-2", title: "Linear Equations & Inequalities" },
      { id: "ch-3", title: "Functions in Social Context" },
      { id: "ch-4", title: "Descriptive Statistics" },
      { id: "ch-5", title: "Probability Basics" },
      { id: "ch-6", title: "Data Interpretation" },
    ],
  },
  {
    id: "english-i",
    name: "Communicative English Language Skills I",
    short: "English I",
    tint: "from-amber-100 to-amber-50",
    category: "Common",
    durationMinutes: 20,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "Academic Reading Strategies" },
      { id: "ch-2", title: "Paragraph & Essay Structure" },
      { id: "ch-3", title: "Grammar Essentials" },
      { id: "ch-4", title: "Listening & Note-taking" },
      { id: "ch-5", title: "Vocabulary Building" },
    ],
  },
  {
    id: "english-ii",
    name: "Communicative English Language Skills II",
    short: "English II",
    tint: "from-yellow-100 to-yellow-50",
    category: "Common",
    durationMinutes: 20,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "Advanced Reading Comprehension" },
      { id: "ch-2", title: "Academic Writing" },
      { id: "ch-3", title: "Presentation Skills" },
      { id: "ch-4", title: "Critical Analysis" },
      { id: "ch-5", title: "Exam Strategies" },
    ],
  },
  {
    id: "physical-fitness",
    name: "Physical Fitness",
    short: "Fitness",
    tint: "from-green-100 to-green-50",
    category: "Common",
    durationMinutes: 15,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "Health & Wellness Foundations" },
      { id: "ch-2", title: "Cardiovascular Fitness" },
      { id: "ch-3", title: "Strength & Flexibility" },
      { id: "ch-4", title: "Nutrition & Hydration" },
      { id: "ch-5", title: "Sports Safety & Injury Prevention" },
    ],
  },
  {
    id: "moral-citizenship",
    name: "Moral and Citizenship Education",
    short: "Moral & Civics",
    tint: "from-teal-100 to-teal-50",
    category: "Social Science",
    durationMinutes: 20,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "Citizenship & the State" },
      { id: "ch-2", title: "Constitutional Framework" },
      { id: "ch-3", title: "Human Rights & Duties" },
      { id: "ch-4", title: "Ethics & Morality" },
      { id: "ch-5", title: "Democratic Institutions" },
      { id: "ch-6", title: "Civic Participation" },
    ],
  },
  {
    id: "economics",
    name: "Introduction to Economics",
    short: "Economics",
    tint: "from-emerald-100 to-emerald-50",
    category: "Social Science",
    durationMinutes: 25,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "Scarcity & Choice" },
      { id: "ch-2", title: "Supply & Demand" },
      { id: "ch-3", title: "Market Structures" },
      { id: "ch-4", title: "Macroeconomic Indicators" },
      { id: "ch-5", title: "Fiscal & Monetary Policy" },
      { id: "ch-6", title: "Development Economics" },
    ],
  },
  {
    id: "global-affairs",
    name: "Global Affairs",
    short: "Global Affairs",
    tint: "from-sky-100 to-sky-50",
    category: "Social Science",
    durationMinutes: 20,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "Globalization" },
      { id: "ch-2", title: "International Relations" },
      { id: "ch-3", title: "Technology & Society" },
      { id: "ch-4", title: "Climate & Sustainability" },
      { id: "ch-5", title: "Africa in the World" },
    ],
  },
  {
    id: "geography-ethiopia",
    name: "Geography of Ethiopia and the Horn",
    short: "Geography",
    tint: "from-yellow-100 to-yellow-50",
    category: "Social Science",
    durationMinutes: 20,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "Landforms & Climate" },
      { id: "ch-2", title: "Hydrology & Natural Resources" },
      { id: "ch-3", title: "Population Dynamics" },
      { id: "ch-4", title: "Regional Studies" },
      { id: "ch-5", title: "Urbanization" },
      { id: "ch-6", title: "Environmental Challenges" },
    ],
  },
  {
    id: "general-psychology",
    name: "General Psychology",
    short: "Psychology",
    tint: "from-rose-100 to-rose-50",
    category: "Social Science",
    durationMinutes: 25,
    questionsPerExam: 10,
    chapters: [
      { id: "ch-1", title: "Introduction to Psychology" },
      { id: "ch-2", title: "Research Methods" },
      { id: "ch-3", title: "Biological Bases of Behavior" },
      { id: "ch-4", title: "Sensation & Perception" },
      { id: "ch-5", title: "Learning & Memory" },
      { id: "ch-6", title: "Motivation & Emotion" },
      { id: "ch-7", title: "Developmental Psychology" },
      { id: "ch-8", title: "Social Psychology" },
    ],
  },
  {
    id: "entrepreneurship",
    name: "Entrepreneurship",
    short: "Entrepreneurship",
    tint: "from-indigo-100 to-indigo-50",
    category: "Common",
    durationMinutes: 20,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "Entrepreneurial Mindset" },
      { id: "ch-2", title: "Opportunity Recognition" },
      { id: "ch-3", title: "Business Models" },
      { id: "ch-4", title: "Market Research" },
      { id: "ch-5", title: "Funding & Finance" },
      { id: "ch-6", title: "Marketing & Scaling" },
    ],
  },
  {
    id: "anthropology",
    name: "Anthropology",
    short: "Anthropology",
    tint: "from-pink-100 to-pink-50",
    category: "Social Science",
    durationMinutes: 20,
    questionsPerExam: 8,
    chapters: [
      { id: "ch-1", title: "What is Anthropology?" },
      { id: "ch-2", title: "Culture & Society" },
      { id: "ch-3", title: "Kinship & Family" },
      { id: "ch-4", title: "Ethiopian Ethnic Groups" },
      { id: "ch-5", title: "Ritual & Religion" },
      { id: "ch-6", title: "Modernization & Change" },
    ],
  },
];

const questionTemplates = [
  {
    stem: 'Which statement best describes the main focus of "{chapter}" in {course}?',
    options: [
      "Core concepts and principles covered in this module",
      "Unrelated historical events from a different discipline",
      "Advanced graduate-level research methods only",
      "Administrative procedures for university registration",
    ],
    correct: 0,
    explanation:
      "Each chapter module focuses on its core concepts and principles within the course curriculum.",
  },
  {
    stem: 'In {course}, "{chapter}" is most closely associated with which learning outcome?',
    options: [
      "Applying module concepts to exit exam-style problems",
      "Memorizing unrelated vocabulary from other courses",
      "Skipping foundational theory entirely",
      "Avoiding all practical examples",
    ],
    correct: 0,
    explanation:
      "Course modules are designed so students can apply concepts to exam-style problems.",
  },
  {
    stem: 'A student reviewing "{chapter}" in {course} should prioritize understanding:',
    options: [
      "Key definitions, relationships, and application scenarios",
      "Only the table of contents of unrelated textbooks",
      "Names of instructors from other departments",
      "Campus facility locations",
    ],
    correct: 0,
    explanation: "Effective study focuses on definitions, relationships, and how to apply them.",
  },
  {
    stem: 'Which study strategy is recommended after completing "{chapter}" in {course}?',
    options: [
      "Take a timed mock exam to test understanding",
      "Ignore the module until the final week",
      "Copy answers without reading questions",
      "Skip all practice questions",
    ],
    correct: 0,
    explanation:
      "Timed mock exams help reinforce learning and identify gaps before the real exit exam.",
  },
  {
    stem: 'The MoE freshman curriculum places "{chapter}" within {course} to help students:',
    options: [
      "Build progressive mastery toward the exit exam",
      "Reduce total credit hours arbitrarily",
      "Eliminate practical assessments",
      "Focus only on non-academic activities",
    ],
    correct: 0,
    explanation:
      "Modules are sequenced to build progressive mastery aligned with exit exam requirements.",
  },
  {
    stem: 'When answering MCQ questions on "{chapter}", you should:',
    options: [
      "Read all options carefully before selecting the best answer",
      "Always choose the first option without reading",
      "Leave every question blank",
      "Select answers at random to save time",
    ],
    correct: 0,
    explanation: "Careful reading of all options reduces errors on multiple-choice assessments.",
  },
  {
    stem: 'Which resource best supports mastery of "{chapter}" in {course}?',
    options: [
      "Course textbook, lecture notes, and practice quizzes",
      "Social media trends unrelated to the subject",
      "Fictional novels from a different genre",
      "Unverified anonymous forums only",
    ],
    correct: 0,
    explanation:
      "Official course materials and practice assessments are the primary study resources.",
  },
  {
    stem: '"{chapter}" in {course} typically appears on exit exams as:',
    options: [
      "Conceptual and applied multiple-choice questions",
      "Only open-ended essay prompts with no MCQ",
      "Questions from unrelated degree programs",
      "Physical laboratory equipment identification only",
    ],
    correct: 0,
    explanation:
      "Exit exams commonly use conceptual and applied MCQ formats across freshman courses.",
  },
  {
    stem: 'If you score below 60% on a "{chapter}" mock exam, the best next step is to:',
    options: [
      "Review incorrect answers and retake with new questions",
      "Abandon the course entirely",
      "Assume you will pass without further study",
      "Skip all remaining chapters",
    ],
    correct: 0,
    explanation:
      "Reviewing mistakes and retaking mocks strengthens understanding before moving on.",
  },
  {
    stem: 'Collaborative study for "{chapter}" in {course} is most effective when:',
    options: [
      "Group members quiz each other on key concepts",
      "One person does all work while others are absent",
      "The group avoids discussing course content",
      "Members share only final answers without explanation",
    ],
    correct: 0,
    explanation: "Peer quizzing and explaining concepts to others improves retention.",
  },
  {
    stem: 'The relationship between "{chapter}" and other modules in {course} is:',
    options: [
      "Sequential — later chapters often build on earlier ones",
      "Random — no connection between any modules",
      "Inverse — each chapter contradicts the previous",
      "Optional — no modules relate to each other",
    ],
    correct: 0,
    explanation: "Freshman courses are structured so later modules build on foundational chapters.",
  },
  {
    stem: 'Time management during a timed mock on "{chapter}" means you should:',
    options: [
      "Allocate roughly equal time per question and flag difficult ones",
      "Spend all time on the first question only",
      "Submit immediately without answering",
      "Ignore the timer completely",
    ],
    correct: 0,
    explanation: "Balanced pacing across questions maximizes your score within the time limit.",
  },
];

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleOptions(
  options: string[],
  correctIndex: number,
  seed: number,
): { options: string[]; correctIndex: number } {
  const indexed = options.map((text, i) => ({ text, isCorrect: i === correctIndex }));
  const shuffled = seededShuffle(indexed, seed);
  return {
    options: shuffled.map((o) => o.text),
    correctIndex: shuffled.findIndex((o) => o.isCorrect),
  };
}

export function getCourseById(courseId: string): ExamCourse | undefined {
  return examCourses.find((c) => c.id === courseId);
}

export function getChapter(courseId: string, chapterId: string): ExamChapter | undefined {
  return getCourseById(courseId)?.chapters.find((ch) => ch.id === chapterId);
}

/** Build a question bank for a chapter (12 questions). */
export function buildQuestionBank(course: ExamCourse, chapter: ExamChapter): MCQuestion[] {
  return questionTemplates.map((tpl, i) => {
    const stem = tpl.stem
      .replace(/\{course\}/g, course.name)
      .replace(/\{chapter\}/g, chapter.title);
    const seed = hashSeed(`${course.id}:${chapter.id}:opt:${i}`);
    const { options, correctIndex } = shuffleOptions(tpl.options, tpl.correct, seed);
    return {
      id: `${course.id}-${chapter.id}-q${i + 1}`,
      question: stem,
      options,
      correctIndex,
      explanation: tpl.explanation,
    };
  });
}

/** Return a randomized subset of questions for an exam attempt. */
export function getExamQuestions(
  course: ExamCourse,
  chapter: ExamChapter,
  attemptSeed?: number,
): MCQuestion[] {
  const bank = buildQuestionBank(course, chapter);
  const seed = attemptSeed ?? hashSeed(`${course.id}:${chapter.id}:${Date.now()}:${Math.random()}`);
  const shuffled = seededShuffle(bank, seed);
  const count = Math.min(course.questionsPerExam, shuffled.length);
  return shuffled.slice(0, count).map((q, i) => {
    const optSeed = seed + i * 997;
    const { options, correctIndex } = shuffleOptions(q.options, q.correctIndex, optSeed);
    return { ...q, options, correctIndex };
  });
}

export const PASSING_SCORE = 60;
