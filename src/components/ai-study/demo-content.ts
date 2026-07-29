import { BookOpen, Brain, FileSearch, ListOrdered } from "lucide-react";

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;

export const PROCESSING_STEPS = [
  { label: "Reading file and extracting content…", icon: FileSearch },
  { label: "Analysing structure and key concepts…", icon: Brain },
  { label: "Generating exam questions and answers…", icon: ListOrdered },
  { label: "Building your personalised study notes…", icon: BookOpen },
];

/** Seed content for the "Try the Physics demo" link — a real .txt File, processed through the same pipeline as an upload. */
export const DEMO_FILE_CONTENT = `Chapter 3: Newton's Laws of Motion and Kinematics

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
