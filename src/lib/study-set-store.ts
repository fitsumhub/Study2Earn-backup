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
    | "notes"
    | "recorded-lecture";
  filename?: string;
  sizeBytes?: number;
  url?: string;
  contentSnippet: string;
  fullText?: string;
  uploadedAt: string;
}

export type FlashcardType =
  | "definition-to-concept"
  | "concept-to-definition"
  | "concept-to-explanation"
  | "comparison"
  | "cause-to-effect"
  | "principle-to-application"
  | "process-to-step"
  | "example-to-concept"
  | "classification"
  | "terminology"
  | "relationship"
  | "formula"
  | "concept"
  | "definition"
  | "procedure"
  | "concept_definition"
  | "cause_effect"
  | "principle_application"
  | "process_step";

export type AcademicDifficulty =
  | "foundational"
  | "intermediate"
  | "advanced"
  | "easy"
  | "medium"
  | "hard";

export interface StudySetFlashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  mastery: FlashcardMastery;
  cardType?: FlashcardType;
  difficulty?: AcademicDifficulty;
  sourceGrounding?: "source" | "additional_context";
  starred?: boolean;
  reviewCount: number;
  lastReviewedAt?: string;
}

export type QuizQuestionType =
  | "multiple-choice"
  | "multiple-select"
  | "true-false"
  | "conceptual-reasoning"
  | "scenario-based"
  | "application"
  | "definition-to-concept";

export interface StudySetQuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string] | string[];
  correctIndex: number;
  correctIndices?: number[];
  explanation: string;
  topic: string;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: QuizQuestionType;
  conceptTested?: string;
  recommendedSection?: string;
  distractorRationale?: string[];
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

export interface WrittenRubricCriterion {
  criterion: string;
  maxMarks: number;
  description: string;
}

export interface StudySetWrittenQuestion {
  id: string;
  prompt: string;
  modelAnswer: string;
  keyRubricPoints: string[];
  topic: string;
  marks?: number;
  difficulty?: AcademicDifficulty;
  actionVerb?:
    | "explain"
    | "define"
    | "compare"
    | "analyze"
    | "discuss"
    | "evaluate"
    | "apply"
    | "describe"
    | "detail"
    | "formulate"
    | "differentiate"
    | "synthesize";
  expectedAnswerPoints?: string[];
  gradingRubric?: WrittenRubricCriterion[];
  userAnswer?: string;
  evaluation?: WrittenEvaluation;
  history?: Array<{
    userAnswer: string;
    scorePct: number;
    feedback: string;
    timestamp: string;
  }>;
}

export type FillBlankType =
  | "definition"
  | "terminology"
  | "principle"
  | "process"
  | "classification"
  | "formula"
  | "relationship";

export interface StudySetFillBlank {
  id: string;
  sentenceWithBlank: string;
  blankAnswer: string;
  acceptedAlternatives?: string[];
  hint?: string;
  explanation: string;
  topic: string;
  blankType?: FillBlankType;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface NoteClassificationTable {
  title: string;
  headers: string[];
  rows: string[][];
  description?: string;
}

export interface NoteProcessWorkflow {
  processName: string;
  objective: string;
  steps: Array<{ stepNumber: number; title: string; description: string }>;
}

export interface NoteCommonConfusion {
  conceptA: string;
  conceptB: string;
  keyDistinction: string;
  mnemonicOrRule: string;
}

export interface StudySetNotes {
  // 1. Executive Summary
  summary: string;
  // 2. Learning Objectives (Bloom's taxonomy)
  learningObjectives?: string[];
  // 3. Core Concepts with comprehensive fields & worked examples
  keyConcepts: Array<{
    concept: string;
    definition?: string;
    explanation: string;
    whyItMatters?: string;
    example?: string;
    lecturerExample?: string;
    workedExample?:
      | {
          problemStatement: string;
          stepByStepSolution: string;
          keyTakeaway?: string;
        }
      | string;
    assumptions?: string;
    relatedConcepts?: string[];
    unit?: string;
    takeaway?: string;
    tradeoffs?: string;
    examTip?: string;
    activeRecallPrompt?: string;
    activeRecallAnswer?: string;
  }>;
  // 4. Important Principles / Theories
  principlesAndTheories?: Array<{
    title: string;
    principle: string;
    explanation: string;
    scopeOfValidity?: string;
    examApplication?: string;
    example?: string;
  }>;
  // 5. Classifications & Comparison Tables
  classificationsAndCategories?: NoteClassificationTable[];
  // 6. Sequential Processes & Workflows
  processesAndWorkflows?: NoteProcessWorkflow[];
  // 7. Clarifying Concrete Examples & Worked Exam Problems
  clarifyingExamples?: Array<{
    title: string;
    conceptIllustrated: string;
    scenario: string;
    analysis: string;
    examinerTrap?: string;
    numericalExample?: string;
    stepByStepResolution?: string[];
    workedProblem?: {
      question: string;
      solutionSteps: string[];
      finalAnswer: string;
      keyInsight?: string;
    };
  }>;
  // 8. Common Student Confusions
  commonConfusions?: NoteCommonConfusion[];
  // 9. Exam-Focused High-Yield Knowledge
  examFocusedKnowledge?: {
    highYieldFacts: string[];
    mustKnowRelationships: string[];
    formulaTriggers: string[];
    topExamMistakes?: string[];
  };
  // 10. Final Takeaways
  finalTakeaways?: string[];

  // Mathematical foundations & definitions
  definitions: Array<{
    term: string;
    definition: string;
    academicContext?: string;
    highYield?: boolean;
    example?: string;
  }>;
  formulasAndRules: Array<{
    title: string;
    formula: string;
    explanation: string;
    derivationSummary?: string;
    variables?: Array<{ symbol: string; label: string }>;
    implication?: string;
    validityConditions?: string;
    examTrick?: string;
    workedCalculationExample?:
      | {
          given: string;
          formulaUsed?: string;
          substitutions: string;
          result: string;
        }
      | string;
  }>;
  studyTips: string[];
  rawMarkdown?: string;
}

export interface OverviewHierarchyItem {
  id: string;
  unit: string;
  topic: string;
  concepts: Array<{
    name: string;
    details: string;
    exampleOrApplication: string;
  }>;
}

export interface StudySetOverview {
  courseSubject: string;
  chapterTopic: string;
  academicContext: string;
  learningObjectives: string[];
  coreConcepts: string[];
  keyPrinciples: string[];
  importantDefinitions: Array<{ term: string; definition: string }>;
  majorTheoriesAndModels: Array<{ name: string; description: string; corePremise: string }>;
  conceptRelationships: Array<{ sourceConcept: string; targetConcept: string; relationship: string }>;
  practicalApplications: string[];
  keyTakeaways: string[];
  examRelevantAreas: string[];
  mentalModelHierarchy: OverviewHierarchyItem[];
  sourceGroundedNotes?: {
    isFullyGrounded: boolean;
    insufficientDataNotice?: string;
  };
}

export interface CheatSheetComparisonRow {
  concept: string;
  meaning: string;
  keyDifference: string;
  example: string;
}

export interface CheatSheetProcessFlow {
  title: string;
  steps: string[];
  summary: string;
}

export interface StudySetCheatSheet {
  criticalDefinitions: Array<{ term: string; briefDefinition: string; highYieldTag?: string }>;
  keyTerminology: Array<{ term: string; context: string }>;
  corePrinciples: Array<{ principle: string; conciseRule: string }>;
  importantFormulas: Array<{
    title: string;
    formula: string;
    variables: string;
    quickTip: string;
  }>;
  comparisonsTable: CheatSheetComparisonRow[];
  processesAndWorkflows: CheatSheetProcessFlow[];
  importantRelationships: Array<{ relation: string; impact: string }>;
  commonMistakes: Array<{ misconception: string; correctUnderstanding: string }>;
  examReminders: string[];
  estimatedReviewMinutes: number;
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
    | "summary"
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
  overview?: StudySetOverview;
  cheatSheet?: StudySetCheatSheet;
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

const STORAGE_KEY = "study2earn-ai-study-sets-v3";
const PREV_STORAGE_KEY = "study2earn-ai-study-sets-v2";
const FOLDERS_STORAGE_KEY = "study2earn-ai-study-folders-v3";

/* ── Initial Seed Study Sets (Ethiopian MoE Common Courses) ── */
const SEED_STUDY_SETS: StudySet[] = [
  {
    id: "set-net-3021",
    title: "Network Design Requirements",
    subject: "Computer Science",
    courseCode: "CoSc 3021",
    description:
      "Enterprise and campus network design principles, hierarchical model (Core, Distribution, Access), redundancy protocols, bandwidth and throughput planning, QoS parameters, and security requirements.",
    sources: [
      {
        id: "src-net-1",
        title: "Campus_Network_Design_Requirements_Spec.pdf",
        type: "pdf",
        filename: "Campus_Network_Design_Requirements_Spec.pdf",
        sizeBytes: 3120000,
        contentSnippet:
          "Enterprise campus network requirements analysis: functional vs non-functional constraints, core/distribution/access dimensioning, link aggregation, VLAN segmentation, and QoS requirements.",
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      },
    ],
    flashcards: [
      { id: "fc-net-1", front: "What is the difference between Functional and Non-Functional Requirements in network design?", back: "Functional requirements define specific behaviors or features the network must perform (e.g., VLAN routing, VoIP support, DHCP services). Non-functional requirements define system qualities and constraints such as availability (99.999%), maximum latency (<150ms for voice), throughput, and security compliance.", topic: "Requirements Analysis", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-2", front: "What does 'Five Nines' (99.999%) availability equate to in terms of annual downtime?", back: "99.999% availability equates to approximately 5.26 minutes of downtime per year across 24/7/365 operations.", topic: "Availability", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-3", front: "Define MTBF and MTTR and explain their relationship to network availability.", back: "MTBF (Mean Time Between Failures) measures expected operating duration between hardware/software failures. MTTR (Mean Time to Repair) measures the average time taken to diagnose, replace, and restore service. Availability A = MTBF / (MTBF + MTTR).", topic: "Availability", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-4", front: "What are the primary design responsibilities of the Core Layer in a three-tier hierarchical network?", back: "The Core Layer serves as the high-speed backbone of the campus. Its sole purpose is to switch packets as fast as possible between distribution blocks without CPU-intensive tasks such as packet filtering, ACLs, or address translation.", topic: "Hierarchical Design", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-5", front: "What functions belong exclusively to the Distribution Layer?", back: "Policy-based routing, packet filtering with Access Control Lists (ACLs), inter-VLAN routing, QoS marking/classification boundaries, route summarization, and redundant uplinks to the core.", topic: "Hierarchical Design", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-6", front: "What capabilities must be supported at the Access Layer?", back: "End-user station connectivity, Layer 2 VLAN assignment, 802.1X port authentication, PoE (Power over Ethernet for APs and IP phones), Port Security (MAC limiting), and QoS trust boundaries.", topic: "Hierarchical Design", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-7", front: "When is a Collapsed Core design preferred over a Three-Tier Campus design?", back: "A Collapsed Core (where core and distribution layers merge into a single layer of switches) is ideal for small to medium-sized campuses (fewer than ~500-1000 users) to minimize hardware cost, power consumption, and management overhead while still maintaining redundancy.", topic: "Hierarchical Design", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-8", front: "Differentiate between Bandwidth, Throughput, and Goodput.", back: "Bandwidth: Theoretical maximum capacity of a communication link (e.g., 10 Gbps). Throughput: Actual rate of data transfer achieved across the link after overhead and contention. Goodput: The rate of useful application payload delivered to the receiver (excluding all protocol headers and retransmitted frames).", topic: "Performance", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-9", front: "What are the standard latency, jitter, and packet loss tolerances for VoIP in enterprise networks?", back: "One-way latency: <= 150 ms (ITU G.114 standard). Jitter: <= 30 ms. Packet loss: <= 1%. Exceeding these metrics leads to noticeable call degradation and echo.", topic: "Quality of Service", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-10", front: "How does HSRP (Hot Standby Router Protocol) provide default gateway redundancy?", back: "HSRP groups two or more physical routers into a virtual router sharing a virtual IP and virtual MAC address (0000.0c07.acXX). The Active router forwards traffic; if its hellos cease, the Standby router assumes the virtual IP without client reconfiguration.", topic: "Redundancy", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-11", front: "What are the key technical differences between HSRP and VRRP?", back: "HSRP is a Cisco proprietary protocol using virtual MAC 0000.0c07.acXX and multicast 224.0.0.2. VRRP (RFC 5798) is an open industry standard using virtual MAC 00-00-5E-00-01-XX, multicast 224.0.0.18, and allows the virtual IP to be an actual physical interface IP (Master).", topic: "Redundancy", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-12", front: "What advantage does GLBP offer over HSRP and VRRP?", back: "GLBP (Gateway Load Balancing Protocol) provides active load balancing across up to four routers simultaneously. While an Active Virtual Gateway (AVG) answers ARP requests, it distributes different virtual MAC addresses to clients so multiple Active Virtual Forwarders (AVFs) handle traffic simultaneously.", topic: "Redundancy", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-13", front: "Why is classical Spanning Tree Protocol (802.1D) inadequate for modern enterprise campus requirements?", back: "802.1D STP takes 30 to 50 seconds to converge upon a link failure due to rigid Listening (15s) and Learning (15s) timer transitions, causing severe dropouts for real-time traffic like VoIP and video conferencing.", topic: "Spanning Tree", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-14", front: "How does Rapid Spanning Tree Protocol (RSTP 802.1w) achieve sub-second convergence?", back: "RSTP uses an explicit proposal-agreement handshake on point-to-point links and introduces alternate and backup port roles, enabling immediate transition to forwarding without waiting for timers.", topic: "Spanning Tree", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-15", front: "What is the primary benefit of Multiple Spanning Tree Protocol (MSTP 802.1s)?", back: "MSTP groups multiple VLANs into a small number of spanning tree instances (e.g., 500 VLANs mapped to 2 MST instances), dramatically reducing switch CPU utilization compared to Cisco PVST+ which runs an independent STP instance per VLAN.", topic: "Spanning Tree", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-16", front: "What is the purpose of BPDU Guard on access switch ports?", back: "BPDU Guard immediately error-disables an access port configured with PortFast if it receives any STP Bridge Protocol Data Unit (BPDU), preventing rogue switches or loops caused by unauthorized hubs.", topic: "Spanning Tree", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-17", front: "What problem does Root Guard solve in STP topology design?", back: "Root Guard prevents an untrusted downstream switch from becoming the STP Root Bridge by placing any port that receives superior BPDUs into an STP root-inconsistent state.", topic: "Spanning Tree", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-18", front: "What is IEEE 802.3ad LACP (Link Aggregation Control Protocol)?", back: "An open standard protocol that dynamically bundles up to 8 active physical Ethernet links into a single logical channel (EtherChannel), multiplying bandwidth and providing link redundancy without STP blocking.", topic: "Link Aggregation", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-19", front: "How does EtherChannel distribute packets across member links?", back: "EtherChannel uses a mathematical hash function on packet headers (source IP, destination IP, source MAC, destination MAC, or TCP/UDP port numbers). Packets with identical flow hashes always traverse the same physical link to prevent out-of-order delivery.", topic: "Link Aggregation", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-20", front: "What is the function of IEEE 802.1Q frame tagging?", back: "802.1Q inserts a 4-byte VLAN tag into standard Ethernet frames between the Source MAC and EtherType fields. The 12-bit VLAN ID (VID) field supports up to 4,094 distinct VLANs across trunk links.", topic: "VLANs", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-21", front: "Explain the three port roles in Private VLANs (PVLANs).", back: "1. Promiscuous: Communicates with all ports (connected to router/gateway). 2. Isolated: Completely segregated; can only communicate with promiscuous ports. 3. Community: Can communicate with other ports in the same community and with promiscuous ports.", topic: "VLANs", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-22", front: "Compare Router-on-a-Stick with Layer 3 Switch SVI (Switched Virtual Interface) routing.", back: "Router-on-a-Stick routes VLAN traffic over a single physical subinterface trunk link to an external router (limited by link bandwidth). Layer 3 switch SVIs perform inter-VLAN routing internally at wire-speed in hardware using ASICs (Application-Specific Integrated Circuits).", topic: "Routing Architecture", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-23", front: "What is VLSM (Variable Length Subnet Masking) and why is it essential?", back: "VLSM allows different subnets of the same classful network to use different prefix lengths (e.g., /24 for user LANs, /30 for point-to-point router links), preventing IPv4 address exhaustion.", topic: "IP Addressing", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-24", front: "What is the primary role of a DHCP Relay Agent (ip helper-address)?", back: "A DHCP Relay Agent intercepts Layer 2 broadcast DHCP Discover messages on a local subnet, encapsulates them into unicast UDP packets, and forwards them across routed boundaries to centralized DHCP servers.", topic: "IP Addressing", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-25", front: "What are the three main IPv6 address scopes?", back: "1. Global Unicast (2000::/3): Globally routable on the public Internet. 2. Unique Local (fc00::/7): Private routable within an enterprise (analogous to RFC 1918). 3. Link-Local (fe80::/10): Automatically assigned for communication on a single Layer 2 segment.", topic: "IP Addressing", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-26", front: "Why is Area 0 (Backbone Area) mandatory in multi-area OSPF design?", back: "All non-backbone areas must directly connect to Area 0. All inter-area routing traffic must traverse Area 0 to prevent inter-area routing loops in link-state topology databases.", topic: "OSPF", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-27", front: "How are OSPF Designated Routers (DR) and Backup Designated Routers (BDR) elected?", back: "Elected on broadcast multi-access segments (e.g., Ethernet) based on highest OSPF interface priority (0-255). In case of a tie, the router with the highest Router ID (RID) wins.", topic: "OSPF", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-28", front: "What is the difference between an OSPF ABR and ASBR?", back: "ABR (Area Border Router) connects one or more non-backbone areas to Area 0. ASBR (Autonomous System Boundary Router) connects the OSPF domain to an external routing domain (e.g., BGP, EIGRP, or static routes).", topic: "OSPF", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-29", front: "What is EIGRP's Feasibility Condition for loop-free backup routes?", back: "A neighbor is a Feasible Successor if its Reported Distance (RD) is strictly less than the current Feasible Distance (FD) of the Successor route (RD < FD).", topic: "Routing Architecture", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-30", front: "What is Administrative Distance (AD) and how does a router use it?", back: "AD is an integer from 0 to 255 representing the believability or trustworthiness of a routing source. When multiple protocols discover a route to the identical destination prefix, the protocol with the lowest AD is installed in the routing table (e.g., Connected=0, Static=1, eBGP=20, EIGRP=90, OSPF=110, iBGP=200).", topic: "Routing Architecture", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-31", front: "Contrast DiffServ (Differentiated Services) with IntServ (Integrated Services) QoS models.", back: "IntServ uses RSVP (Resource Reservation Protocol) to dynamically reserve end-to-end bandwidth per flow, which fails to scale in large enterprises. DiffServ classifies and marks packets at the ingress edge (DSCP values) and applies per-hop behaviors (PHB) without stateful signaling, scaling effortlessly.", topic: "Quality of Service", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-32", front: "Explain DSCP Expedited Forwarding (EF) and its standard binary value.", back: "DSCP EF (decimal 46, binary 101110) guarantees low delay, low jitter, and guaranteed bandwidth. It is designated for VoIP audio streams and mapped to strict priority queues.", topic: "Quality of Service", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-33", front: "How does Traffic Policing differ from Traffic Shaping?", back: "Traffic Policing drops or re-marks packets that exceed a committed information rate (CIR), causing TCP retransmissions. Traffic Shaping buffers excess packets in memory and transmits them smoothly over time, preventing packet drops at the expense of slight buffer delay.", topic: "Quality of Service", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-34", front: "Why is Low Latency Queuing (LLQ) required for voice packets?", back: "LLQ adds a strict priority queue (PQ) to Class-Based Weighted Fair Queuing (CBWFQ). Packets in the priority queue (voice) are always serviced before any other queues, eliminating queuing delay.", topic: "Quality of Service", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-35", front: "What is IEEE 802.1X and how does Network Access Control (NAC) function?", back: "802.1X is a port-based authentication framework consisting of three entities: Supplicant (user device), Authenticator (switch/WAP), and Authentication Server (RADIUS/TACACS+). Ports remain blocked in unauthorized state until credentials are validated.", topic: "Security", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-36", front: "Why are Stateful Firewalls superior to Stateless Packet-Filtering ACLs?", back: "Stateless ACLs examine each packet in isolation against static rules. Stateful firewalls track TCP connection states (SYN, ACK, FIN) and sequence numbers in a state table, automatically allowing return traffic only for legitimate established outbound connections.", topic: "Security", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-37", front: "What is the purpose of a DMZ (Demilitarized Zone) network segment?", back: "A DMZ is a neutral physical or logical subnet separating an untrusted external network (Internet) from the secured internal corporate LAN. Public-facing servers (web, mail, DNS) are placed in the DMZ so that if compromised, the internal LAN remains protected by inner firewall policies.", topic: "Security", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-38", front: "How does DHCP Snooping prevent rogue DHCP server attacks?", back: "DHCP Snooping designates switch ports as either 'trusted' (uplinks to real DHCP servers) or 'untrusted' (user ports). The switch drops any DHCP Offer or DHCP Ack messages originating from untrusted ports.", topic: "Security", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-39", front: "How does Dynamic ARP Inspection (DAI) stop ARP Poisoning / Man-in-the-Middle attacks?", back: "DAI validates ARP packets against the trusted DHCP Snooping binding database (IP-to-MAC mappings). Any ARP response containing an invalid or mismatched IP-to-MAC pair is dropped immediately.", topic: "Security", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-40", front: "What security vulnerability does IP Source Guard (IPSG) mitigate?", back: "IPSG prevents IP spoofing attacks by creating dynamic per-port ACLs based on DHCP Snooping bindings, dropping any traffic whose source IP address was not legitimately leased to that port.", topic: "Security", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-41", front: "What are the two negotiation phases in IPsec VPN establishment?", back: "Phase 1 (IKEv1/IKEv2): Authenticates peers and establishes a secure bidirectional management tunnel (ISAKMP SA) using Diffie-Hellman key exchange. Phase 2: Negotiates IPsec Security Associations (IPsec SAs) using ESP (Encapsulating Security Payload) to encrypt and integrity-protect user data.", topic: "VPN & Security", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-42", front: "What are the core tenets of a Zero Trust Architecture (ZTA)?", back: "Never trust, always verify. Every access request is fully authenticated, authorized, and encrypted before granting access, regardless of whether the device is inside the perimeter or remote. Least privilege access and micro-segmentation are strictly enforced.", topic: "Security", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-43", front: "What architectural benefits does SD-WAN provide over traditional MPLS?", back: "SD-WAN decouples the control plane from the data plane, enabling dynamic traffic steering across multiple transport links (broadband, 5G, MPLS) based on real-time latency, jitter, and packet loss measurements with centralized cloud orchestration.", topic: "WAN Architecture", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-44", front: "What is the function of CAPWAP (Control and Provisioning of Wireless Access Points)?", back: "CAPWAP is an encapsulation protocol that tunnels control and data plane traffic between Lightweight Access Points (LWAPs) and centralized Wireless LAN Controllers (WLCs) over UDP ports 5246 and 5247.", topic: "Wireless Design", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-45", front: "What key technological innovations did Wi-Fi 6 (802.11ax) introduce for high-density environments?", back: "OFDMA (Orthogonal Frequency-Division Multiple Access) splits wireless channels into resource units (RUs) allowing simultaneous transmissions to multiple clients; 1024-QAM increases throughput by 25%; and BSS Coloring mitigates co-channel interference.", topic: "Wireless Design", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-46", front: "What minimum RSSI (Received Signal Strength Indicator) is required for enterprise voice-over-WLAN?", back: "An RSSI of at least -65 dBm or better is recommended for voice and video over Wi-Fi, along with a Signal-to-Noise Ratio (SNR) of at least 25 dB.", topic: "Wireless Design", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-47", front: "Why is 2.4 GHz channel planning restricted to channels 1, 6, and 11?", back: "These are the only three non-overlapping channels in the 20 MHz 2.4 GHz spectrum band. Using adjacent channels (e.g., 2, 3, 4) causes severe co-channel and adjacent-channel interference (CCI/ACI).", topic: "Wireless Design", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-48", front: "What security features does SNMPv3 provide that SNMPv1 and SNMPv2c lack?", back: "SNMPv3 introduces the User-based Security Model (USM) providing authentication (MD5/SHA) and encryption (AES/DES - privacy), replacing cleartext community strings with robust cryptographic protection.", topic: "Management", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-49", front: "How does NetFlow / IPFIX data differ from SNMP monitoring?", back: "SNMP provides point-in-time counter metrics (interface utilization, CPU temperature, errors). NetFlow/IPFIX provides detailed session flow records (who talked to whom, protocol, port, bytes, duration), vital for capacity planning and threat detection.", topic: "Management", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-50", front: "Why is NTP (Network Time Protocol) synchronization critical across network infrastructure?", back: "Accurate, synchronized timestamps across all switches, routers, firewalls, and servers are essential for forensic correlation of Syslog messages, digital certificate validity, and Kerberos authentication.", topic: "Management", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-51", front: "What is Bandwidth-Delay Product (BDP) in high-throughput network design?", back: "BDP = Bandwidth (bps) * Round-Trip Time (seconds). It represents the maximum volume of unacknowledged data that can be in-flight in the network pipe at any given moment, defining necessary TCP socket window buffer sizes.", topic: "Performance", mastery: "unfamiliar", starred: false, reviewCount: 0 },
      { id: "fc-net-52", front: "What is Shannon's Capacity Theorem and what does it define?", back: "C = B * log2(1 + S/N), where C is theoretical maximum channel capacity in bps, B is bandwidth in Hz, and S/N is signal-to-noise power ratio. It defines the absolute upper bound of error-free information rate through any physical communication channel.", topic: "Performance", mastery: "unfamiliar", starred: false, reviewCount: 0 },
    ],
    quizzes: [
      {
        id: "qz-net-1",
        question: "In a campus network design requiring 99.999% availability, what is the maximum permissible unscheduled downtime per year?",
        options: ["~5.26 minutes", "~52.6 minutes", "~8.76 hours", "~24 hours"],
        correctIndex: 0,
        explanation: "Five Nines (99.999%) availability allows at most (1 - 0.99999) * 365.25 * 24 * 60 = 5.2596 minutes of downtime annually.",
        topic: "Availability",
        difficulty: "easy",
        questionType: "multiple-choice",
        conceptTested: "Five Nines Availability Limit",
        recommendedSection: "Availability via MTTR Minimization",
        distractorRationale: [
          "Correct answer: (1 - 0.99999) * 525,960 minutes = 5.26 minutes.",
          "Distractor: 52.6 minutes corresponds to 99.99% availability (Four Nines).",
          "Distractor: 8.76 hours corresponds to 99.9% availability (Three Nines).",
          "Distractor: 24 hours corresponds to ~99.7% availability.",
        ],
      },
      {
        id: "qz-net-2",
        question: "Which layer of the Cisco Three-Tier Hierarchical Model is specifically responsible for policy-based routing, inter-VLAN routing, and ACL packet filtering?",
        options: ["Core Layer", "Distribution Layer", "Access Layer", "Physical Layer"],
        correctIndex: 1,
        explanation: "The Distribution Layer serves as the boundary between the access layer and core layer, terminating VLANs, performing route summarization, and enforcing security policies.",
        topic: "Hierarchical Design",
        difficulty: "medium",
        questionType: "conceptual-reasoning",
        conceptTested: "Distribution Layer Functional Boundaries",
        recommendedSection: "Unit 1.0: Physical & Logical Topology Architecture",
        distractorRationale: [
          "Distractor: The Core layer strictly optimizes for fast packet switching without ACLs or packet filtering.",
          "Correct answer: Distribution aggregates access closets, enforces ACLs, and terminates VLAN routing.",
          "Distractor: Access layer provides endpoint port attachment, 802.1X, and PoE.",
          "Distractor: Physical layer refers to cabling and electrical signaling (Layer 1).",
        ],
      },
      {
        id: "qz-net-3",
        question: "What is the primary architectural differentiator of Gateway Load Balancing Protocol (GLBP) compared to HSRP and VRRP?",
        options: [
          "GLBP provides active-active default gateway forwarding across multiple routers simultaneously via virtual MAC rotation.",
          "GLBP eliminates the need for any IP addresses on the upstream router interfaces.",
          "GLBP operates strictly at Layer 4, replacing TCP flow control across WAN links.",
          "GLBP is an open IETF RFC standard supported natively across all third-party vendors.",
        ],
        correctIndex: 0,
        explanation: "While HSRP and VRRP elect one active forwarder while keeping backup routers idle, GLBP uses an Active Virtual Gateway (AVG) to assign different virtual MAC addresses to clients, enabling up to 4 Active Virtual Forwarders (AVFs) to forward traffic simultaneously.",
        topic: "Redundancy",
        difficulty: "hard",
        questionType: "conceptual-reasoning",
        conceptTested: "GLBP Active-Active Load Balancing",
        recommendedSection: "Unit 2.0: Default Gateway Virtualization & Redundancy",
        distractorRationale: [
          "Correct answer: GLBP utilizes AVG virtual MAC assignment to load balance traffic across up to 4 AVFs.",
          "Distractor: GLBP still requires physical interface IPs and a shared virtual IP.",
          "Distractor: GLBP is a Layer 3 default gateway protocol, not a Layer 4 flow control protocol.",
          "Distractor: GLBP is Cisco-proprietary; VRRP (RFC 5798) is the open IETF standard.",
        ],
      },
      {
        id: "qz-net-4",
        question: "Why does Rapid Spanning Tree Protocol (RSTP 802.1w) achieve sub-second convergence compared to legacy 802.1D STP (30-50 seconds)?",
        options: [
          "RSTP uses an explicit proposal-agreement handshake on point-to-point links and introduces alternate/backup port roles.",
          "RSTP completely disables loop detection and relies on Layer 3 TTL decrementing.",
          "RSTP increases the Forward Delay and Max Age timers by a factor of 10.",
          "RSTP sends BPDUs only once per hour to prevent switch CPU overload.",
        ],
        correctIndex: 0,
        explanation: "802.1w RSTP introduces an active proposal-agreement handshake on full-duplex point-to-point links, enabling immediate transition to Forwarding without waiting for conservative 15s Listening and 15s Learning timers.",
        topic: "Spanning Tree",
        difficulty: "medium",
        questionType: "application",
        conceptTested: "RSTP Sub-Second Convergence Handshake",
        recommendedSection: "Unit 3.0: Layer 2 Determinism & Spanning Tree Evolution",
        distractorRationale: [
          "Correct answer: Proposal-agreement handshake and alternate port roles eliminate timer waiting.",
          "Distractor: RSTP actively detects and prevents Layer 2 loops using BPDUs.",
          "Distractor: Increasing timers would make convergence slower, not faster.",
          "Distractor: RSTP sends BPDUs every hello interval (2 seconds) by default from every switch.",
        ],
      },
      {
        id: "qz-net-5",
        question: "According to the ITU G.114 standard, what are the maximum allowable one-way latency, jitter, and packet loss metrics for toll-quality enterprise VoIP?",
        options: [
          "One-way latency <= 150 ms, jitter <= 30 ms, packet loss <= 1%",
          "One-way latency <= 500 ms, jitter <= 100 ms, packet loss <= 5%",
          "One-way latency <= 20 ms, jitter <= 5 ms, packet loss <= 0.001%",
          "One-way latency <= 1000 ms, jitter <= 250 ms, packet loss <= 10%",
        ],
        correctIndex: 0,
        explanation: "ITU-T Recommendation G.114 dictates that one-way mouth-to-ear delay must not exceed 150 ms, packet jitter must remain under 30 ms, and packet loss must not exceed 1% for conversational voice clarity.",
        topic: "Quality of Service",
        difficulty: "medium",
        questionType: "application",
        conceptTested: "VoIP SLA & Performance Parameters",
        recommendedSection: "Unit 4.0: Quality of Service & Traffic Conditioning",
        distractorRationale: [
          "Correct answer: 150 ms delay, 30 ms jitter, and 1% loss.",
          "Distractor: 500 ms delay causes awkward conversational collision and severe echo.",
          "Distractor: 20 ms is overly restrictive for wide area networks; 150 ms is the standard.",
          "Distractor: 1000 ms (1 second) delay renders real-time telephone conversation unusable.",
        ],
      },
      {
        id: "qz-net-6",
        question: "Which Differentiated Services Code Point (DSCP) marking is strictly designated for real-time voice media (VoIP RTP) and mapped to Strict Priority Queuing?",
        options: ["Expedited Forwarding (EF / decimal 46)", "Assured Forwarding (AF41 / decimal 34)", "Best Effort (BE / decimal 0)", "Class Selector 1 (CS1 / decimal 8)"],
        correctIndex: 0,
        explanation: "DSCP Expedited Forwarding (EF), binary value 101110 (decimal 46), is universally designated for VoIP audio streams to guarantee bounded latency and jitter via Low Latency Queuing (LLQ).",
        topic: "Quality of Service",
        difficulty: "medium",
        questionType: "conceptual-reasoning",
        conceptTested: "DSCP Expedited Forwarding Marking",
        recommendedSection: "Unit 4.0: Quality of Service & Traffic Conditioning",
        distractorRationale: [
          "Correct answer: EF (decimal 46) is the standard for voice RTP.",
          "Distractor: AF41 is typically reserved for interactive video streams.",
          "Distractor: Best Effort (0) is standard unprioritized background traffic.",
          "Distractor: CS1 (8) represents scavenger or bulk non-critical traffic.",
        ],
      },
      {
        id: "qz-net-7",
        question: "Dynamic ARP Inspection (DAI) prevents Man-in-the-Middle (MITM) and ARP poisoning attacks by validating ARP packets against which authoritative data source?",
        options: [
          "The DHCP Snooping binding database",
          "The switch's local MAC address table (CAM table)",
          "The upstream BGP routing table",
          "The DNS reverse pointer lookup cache",
        ],
        correctIndex: 0,
        explanation: "DAI intercepts all ARP requests and replies on untrusted ports and validates the sender IP-to-MAC mapping against the trusted DHCP Snooping binding database. Mismatched or forged packets are dropped immediately.",
        topic: "Security",
        difficulty: "hard",
        questionType: "scenario-based",
        conceptTested: "Layer 2 Triad: DAI & DHCP Snooping Synergy",
        recommendedSection: "Zero-Trust Port Access Control",
        distractorRationale: [
          "Correct answer: DAI relies directly on DHCP Snooping IP-to-MAC bindings.",
          "Distractor: CAM tables map MAC to port, but do not validate IP ownership.",
          "Distractor: BGP is a Layer 3 WAN routing protocol with no campus host IP-to-MAC bindings.",
          "Distractor: DNS lookups do not validate Layer 2 MAC addresses.",
        ],
      },
      {
        id: "qz-net-8",
        question: "A high-performance research network has a link capacity of 10 Gbps and an end-to-end Round-Trip Time (RTT) of 40 ms. What is the Bandwidth-Delay Product (BDP) in bytes?",
        options: ["50 Megabytes (50 MB)", "400 Megabytes (400 MB)", "5 Megabytes (5 MB)", "4 Gigabytes (4 GB)"],
        correctIndex: 0,
        explanation: "BDP = Bandwidth (bps) * RTT (s) = 10 * 10^9 bps * 0.040 s = 400,000,000 bits. Converting to bytes: 400,000,000 / 8 = 50,000,000 bytes = 50 MB.",
        topic: "Performance",
        difficulty: "hard",
        questionType: "application",
        conceptTested: "Bandwidth-Delay Product Calculation",
        recommendedSection: "Physical Transmission Bounds",
        distractorRationale: [
          "Correct answer: 400 Mbits / 8 = 50 Megabytes.",
          "Distractor: 400 Megabits (did not divide by 8 to convert bits to bytes).",
          "Distractor: Off by a factor of 10 arithmetic error.",
          "Distractor: Multiplied by byte size instead of dividing.",
        ],
      },
      {
        id: "qz-net-9",
        question: "In Private VLAN (PVLAN) architecture, which port type is completely isolated from all other ports in the same VLAN and can only communicate with Promiscuous ports?",
        options: ["Isolated Port", "Community Port", "Promiscuous Port", "Trunk Port"],
        correctIndex: 0,
        explanation: "Isolated ports are completely segregated at Layer 2; all traffic received on an isolated port can only be forwarded to promiscuous ports (such as the default router gateway), preventing peer-to-peer compromise.",
        topic: "VLANs",
        difficulty: "medium",
        questionType: "conceptual-reasoning",
        conceptTested: "Private VLAN Port Isolation Roles",
        recommendedSection: "Unit 1.0: Physical & Logical Topology Architecture",
        distractorRationale: [
          "Correct answer: Isolated ports communicate strictly with promiscuous ports.",
          "Distractor: Community ports can communicate with each other within the same community and with promiscuous ports.",
          "Distractor: Promiscuous ports communicate with all ports (connected to gateway routers).",
          "Distractor: Trunk ports carry multiple 802.1Q VLANs between switches.",
        ],
      },
      {
        id: "qz-net-10",
        question: "Why does Multi-Area OSPF design strictly enforce that all non-backbone areas must directly connect to Area 0 (the Backbone Area)?",
        options: [
          "To enforce a loop-free star topology for inter-area routing and prevent Link-State routing loops.",
          "Because non-backbone areas are not capable of running Dijkstra's Shortest Path First algorithm.",
          "To force all intra-area packets within Area 1 to traverse the core router backplanes.",
          "Because non-backbone routers cannot have IP addresses configured on their interfaces.",
        ],
        correctIndex: 0,
        explanation: "OSPF requires a two-level hierarchy where Area 0 acts as the loop-free hub. Type 3 Summary LSAs must traverse Area 0; non-backbone areas cannot exchange inter-area routes directly to prevent routing loops.",
        topic: "OSPF",
        difficulty: "hard",
        questionType: "conceptual-reasoning",
        conceptTested: "OSPF Area 0 Hub-and-Spoke Invariant",
        recommendedSection: "Routing Architecture",
        distractorRationale: [
          "Correct answer: The star topology of Area 0 prevents inter-area routing loops.",
          "Distractor: Every OSPF area runs Dijkstra SPF locally within its area.",
          "Distractor: Intra-area packets remain strictly inside their local area without touching Area 0.",
          "Distractor: Interface IP addressing is fundamental across all OSPF areas.",
        ],
      },
      {
        id: "qz-net-11",
        question: "How does IEEE 802.3ad Link Aggregation (EtherChannel) ensure that frames belonging to the same TCP conversation do not arrive out-of-order at the receiver?",
        options: [
          "It uses a deterministic hash algorithm on packet headers (source/dest IP, port, or MAC) so every frame of a specific flow maps to the same physical link.",
          "It buffers packets at the receiver and re-sequences them using hardware sorting chips.",
          "It sends packets round-robin across member links and delays transmission by 100 ms.",
          "It forces all TCP packets to use only the first physical link, reserving other links exclusively for UDP.",
        ],
        correctIndex: 0,
        explanation: "EtherChannel avoids out-of-order frame delivery by hashing header fields (such as Source and Destination IP or Port). Packets with identical flow characteristics yield identical hash keys and always traverse the exact same physical link.",
        topic: "Link Aggregation",
        difficulty: "medium",
        questionType: "application",
        conceptTested: "EtherChannel Flow Hashing & Frame Ordering",
        recommendedSection: "Unit 3.0: Layer 2 Determinism & Spanning Tree Evolution",
        distractorRationale: [
          "Correct answer: Deterministic hash on flow parameters ensures frames stay on one link.",
          "Distractor: Ethernet switches do not buffer and re-order frames across Layer 2 links.",
          "Distractor: Pure round-robin causes severe packet reordering, destroying TCP performance.",
          "Distractor: EtherChannel distributes both TCP and UDP across all bundled member links.",
        ],
      },
      {
        id: "qz-net-12",
        question: "Shannon's Channel Capacity Theorem states C = B * log2(1 + S/N). In a communication channel with fixed bandwidth B = 20 MHz, what happens to capacity C if the Signal-to-Noise Ratio (S/N) is doubled?",
        options: [
          "Capacity increases logarithmically (by an additive amount B * log2(2) ≈ 20 Mbps for high SNR), not linearly.",
          "Capacity doubles linearly to 2 * C.",
          "Capacity drops to zero due to non-linear harmonic distortion.",
          "Capacity quadruples because of exponential spectral expansion.",
        ],
        correctIndex: 0,
        explanation: "Because S/N is inside the logarithm: C_new = B * log2(1 + 2*(S/N)) ≈ B * [log2(S/N) + 1] = C_old + B. Thus doubling signal power yields only an additive logarithmic improvement, whereas doubling bandwidth B doubles capacity linearly.",
        topic: "Performance",
        difficulty: "hard",
        questionType: "conceptual-reasoning",
        conceptTested: "Shannon-Hartley Logarithmic vs Linear Scaling",
        recommendedSection: "Physical Transmission Bounds",
        distractorRationale: [
          "Correct answer: S/N is logarithmic; capacity increases additively, not exponentially.",
          "Distractor: Doubling power does NOT double channel capacity.",
          "Distractor: Capacity increases with higher SNR, never drops.",
          "Distractor: Exponential expansion does not occur in linear Gaussian channels.",
        ],
      },
    ],
    writtenTests: [
      {
        id: "wt-net-1",
        prompt: "Describe the three tiers of the Cisco hierarchical network model (Core, Distribution, Access). Explain the key requirements, functional duties, and architectural constraints for each tier.",
        modelAnswer: "Core Layer: High-speed switching backbone designed for ultra-low latency, maximum throughput, and deterministic path selection. Constraints: Zero packet manipulation, no CPU-intensive ACLs, no packet filtering, and no inter-VLAN routing.\nDistribution Layer: Aggregation and routing boundary responsible for terminating VLANs, policy-based routing, inter-VLAN routing, QoS classification/marking, Access Control Lists (ACLs), and route summarization.\nAccess Layer: User-facing edge providing endpoint connectivity, Layer 2 VLAN assignment, IEEE 802.1X port authentication, Power over Ethernet (PoE), Port Security (MAC limiting), and QoS trust boundaries.",
        keyRubricPoints: [
          "Correctly defines functional roles of Core, Distribution, and Access tiers",
          "Explains why the Core layer avoids packet filtering and ACLs",
          "Lists policy enforcement, inter-VLAN routing, and summarization duties of Distribution",
          "Identifies Access layer edge security features (802.1X, Port Security, PoE)",
        ],
        topic: "Hierarchical Design",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "describe",
        expectedAnswerPoints: [
          "Core tier: Wire-speed transit without CPU packet filtering",
          "Distribution tier: Inter-VLAN routing, ACL security boundary, QoS classification",
          "Access tier: User device attachment, Port Security, 802.1X, PoE",
          "Failure domain isolation and modular scalability benefits",
        ],
        gradingRubric: [
          { criterion: "Core Layer Analysis", maxMarks: 3, description: "Identifies Core purpose, wire-speed switching, and absence of ACLs" },
          { criterion: "Distribution Layer Duties", maxMarks: 3, description: "Explains routing boundary, inter-VLAN routing, and policy enforcement" },
          { criterion: "Access Layer Security & Edge", maxMarks: 2, description: "Describes endpoint connectivity, 802.1X, and port security" },
          { criterion: "Architectural Synthesis", maxMarks: 2, description: "Evaluates modular scalability and failure domain containment" },
        ],
      },
      {
        id: "wt-net-2",
        prompt: "Compare First-Hop Redundancy Protocols (HSRP, VRRP, GLBP) in terms of standards compliance, virtual MAC address formatting, master election, and active-active traffic forwarding capabilities.",
        modelAnswer: "HSRP (Hot Standby Router Protocol): Cisco proprietary protocol where one Active router forwards traffic and one Standby router monitors hellos. Virtual MAC is 0000.0c07.acXX (HSRPv1) or 0000.0c9f.fXXX (HSRPv2). Multicast address: 224.0.0.2 / 224.0.0.102.\nVRRP (Virtual Router Redundancy Protocol): Open IETF industry standard (RFC 5798). Master router forwards traffic while Backup routers monitor advertisement timer. Virtual MAC is 00-00-5E-00-01-XX. Allows virtual IP to match the physical interface IP of the Master.\nGLBP (Gateway Load Balancing Protocol): Cisco proprietary active-active protocol. An Active Virtual Gateway (AVG) answers ARP queries with distinct virtual MAC addresses (0007.b400.XXYY) for up to 4 Active Virtual Forwarders (AVFs), providing simultaneous load balancing across all routers without client reconfiguration.",
        keyRubricPoints: [
          "Differentiates HSRP (Cisco) vs VRRP (IETF standard RFC 5798)",
          "States virtual MAC formats for HSRP and VRRP",
          "Explains GLBP active-active load balancing mechanism (AVG & AVFs)",
          "Contrasts active-standby vs active-active forwarding models",
        ],
        topic: "Redundancy",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "compare",
        expectedAnswerPoints: [
          "Standards: HSRP (Cisco proprietary), VRRP (open IETF RFC), GLBP (Cisco proprietary)",
          "Virtual MAC formats: 0000.0c07.acXX vs 00-00-5E-00-01-XX vs 0007.b400.XXYY",
          "Forwarding architecture: HSRP/VRRP active-standby vs GLBP active-active",
          "AVG role in distributing ARP responses to multiple AVFs",
        ],
        gradingRubric: [
          { criterion: "Protocol Standards & Ownership", maxMarks: 2, description: "Identifies open standard VRRP vs proprietary HSRP/GLBP" },
          { criterion: "Virtual MAC & Election", maxMarks: 3, description: "Specifies exact virtual MAC structures and master election criteria" },
          { criterion: "GLBP Load Balancing Mechanism", maxMarks: 3, description: "Details AVG ARP distribution to up to 4 AVF forwarders" },
          { criterion: "Engineering Recommendation", maxMarks: 2, description: "Justifies protocol selection based on multi-vendor vs load balancing needs" },
        ],
      },
      {
        id: "wt-net-3",
        prompt: "Analyze the evolution of Spanning Tree Protocols from IEEE 802.1D to 802.1w (RSTP) and 802.1s (MSTP). Detail the algorithmic mechanisms that reduced convergence times from 50 seconds to sub-second levels.",
        modelAnswer: "Legacy 802.1D STP used rigid, conservative timers (Listening 15s, Learning 15s, Max Age 20s) requiring 30 to 50 seconds to converge upon a link failure, which disconnects real-time applications like VoIP.\nIEEE 802.1w (RSTP) eliminated timer dependency on point-to-point links by introducing the explicit Proposal-Agreement handshake and immediate role assignments (Alternate port provides instant backup to Root port; Backup port backs up Designated port). Ports transition to Forwarding in milliseconds.\nIEEE 802.1s (MSTP) solved the CPU scalability problem of Cisco PVST+ (which runs a separate STP instance per VLAN). MSTP maps hundreds of VLANs into a small number of Multiple Spanning Tree Instances (MSTIs), slashing switch CPU overhead and BPDU bandwidth while preserving per-VLAN load balancing.",
        keyRubricPoints: [
          "Identifies 802.1D timer delays (Listening 15s, Learning 15s)",
          "Explains RSTP Proposal-Agreement handshake and Alternate/Backup port roles",
          "Explains MSTP VLAN-to-instance mapping and CPU scaling benefits",
          "Evaluates impact on real-time traffic like VoIP and video",
        ],
        topic: "Spanning Tree",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "analyze",
        expectedAnswerPoints: [
          "802.1D: Listening + Learning = 30-50s convergence delay",
          "802.1w RSTP: Proposal-Agreement handshake on point-to-point full duplex links",
          "Alternate and Backup port roles providing instantaneous sub-second failover",
          "802.1s MSTP: Aggregating VLANs into logical MSTI instances to preserve switch CPU",
        ],
        gradingRubric: [
          { criterion: "Legacy 802.1D Limitations", maxMarks: 2, description: "Explains timer-based transitions and downtime costs" },
          { criterion: "RSTP Convergence Mechanics", maxMarks: 3, description: "Details Proposal-Agreement handshake and new port roles" },
          { criterion: "MSTP CPU & VLAN Mapping", maxMarks: 3, description: "Explains MSTI instance aggregation vs PVST+ overhead" },
          { criterion: "Technical Precision", maxMarks: 2, description: "Correct IEEE standard nomenclature and clear technical terminology" },
        ],
      },
      {
        id: "wt-net-4",
        prompt: "Explain the Differentiated Services (DiffServ) Quality of Service architecture. Describe the roles of the ingress trust boundary, DSCP classification, Queuing (LLQ vs CBWFQ), and Traffic Policing versus Traffic Shaping.",
        modelAnswer: "DiffServ (RFC 2474) is a scalable, class-based QoS model that classifies and marks packets at the ingress edge using the 6-bit DSCP field in the IP header, eliminating per-flow state in the core.\n1. Ingress Trust Boundary: Access switch verifies or rewrites untrusted endpoint markings. Voice phones are trusted (DSCP EF), but PC data ports are re-marked to Best Effort (DSCP 0).\n2. Queuing: Low Latency Queuing (LLQ) adds a strict priority queue to Class-Based Weighted Fair Queuing (CBWFQ). Voice packets (DSCP EF) are serviced immediately before all other queues to guarantee <150ms delay and <30ms jitter.\n3. Policing vs Shaping: Policing drops or demotes packets exceeding Committed Information Rate (CIR), introducing TCP packet drops. Shaping buffers excess packets in RAM and meters transmission smoothly over time, avoiding drops at the cost of buffer delay.",
        keyRubricPoints: [
          "Defines DiffServ class-based scalability vs stateful IntServ/RSVP",
          "Explains ingress trust boundary and rewriting untrusted client markings",
          "Contrasts LLQ strict priority queuing with CBWFQ weighted fair queuing",
          "Differentiates Policing (packet dropping/demoting) vs Shaping (packet buffering)",
        ],
        topic: "Quality of Service",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "explain",
        expectedAnswerPoints: [
          "DiffServ 6-bit DSCP field and per-hop behavior (PHB)",
          "Trust boundary placement at the access switch layer",
          "LLQ priority queue servicing voice before CBWFQ queues",
          "Policing drops excess traffic; Shaping buffers and transmits smoothly",
        ],
        gradingRubric: [
          { criterion: "DiffServ Architecture & DSCP", maxMarks: 2, description: "Explains class-based marking and header fields" },
          { criterion: "Trust Boundary & Ingress", maxMarks: 2, description: "Details edge marking and untrusted client rewriting" },
          { criterion: "LLQ vs CBWFQ Queuing", maxMarks: 3, description: "Explains strict priority queueing for latency-sensitive traffic" },
          { criterion: "Policing vs Shaping Comparison", maxMarks: 3, description: "Contrasts dropping vs buffering mechanics" },
        ],
      },
      {
        id: "wt-net-5",
        prompt: "Detail the Layer 2 Campus Defense Triad: DHCP Snooping, Dynamic ARP Inspection (DAI), and IP Source Guard (IPSG). Explain the specific attack vector each feature mitigates and how they interlock.",
        modelAnswer: "The Layer 2 Defense Triad forms an interlocking chain that prevents unauthorized Layer 2 attacks:\n1. DHCP Snooping: Mitigates Rogue DHCP Server and DHCP Starvation attacks. Switch ports are categorized as trusted (uplinks to real DHCP servers) or untrusted (client ports). DHCP offers from untrusted ports are dropped. The switch builds the dynamic DHCP Snooping Binding Database: [MAC, IP, Lease Time, VLAN, Port].\n2. Dynamic ARP Inspection (DAI): Mitigates ARP Poisoning and Man-in-the-Middle (MITM) attacks. DAI inspects all ARP replies on untrusted ports, validating them against the DHCP Snooping database. Forged ARP replies are dropped.\n3. IP Source Guard (IPSG): Mitigates IP Spoofing and DoS attacks. IPSG installs dynamic per-port ACLs based on the snooping table, ensuring that packets sent from a port match both the assigned MAC and IP address leased to that port.",
        keyRubricPoints: [
          "Explains DHCP Snooping trusted/untrusted ports and binding database creation",
          "Explains DAI validation against the snooping database to prevent ARP poisoning",
          "Explains IPSG dynamic port ACLs to prevent IP spoofing attacks",
          "Articulates the dependency chain: IPSG and DAI require DHCP Snooping",
        ],
        topic: "Security",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "detail",
        expectedAnswerPoints: [
          "DHCP Snooping: Rogue DHCP server defense and binding table generation",
          "DAI: ARP poisoning defense by cross-checking ARP packets against binding table",
          "IPSG: IP address spoofing mitigation via dynamic port ACLs",
          "Sequential dependency: Snooping must be configured first",
        ],
        gradingRubric: [
          { criterion: "DHCP Snooping Mechanics", maxMarks: 3, description: "Explains trusted/untrusted port logic and binding database creation" },
          { criterion: "DAI MITM Defense", maxMarks: 3, description: "Details ARP verification against binding database" },
          { criterion: "IPSG Anti-Spoofing", maxMarks: 2, description: "Explains dynamic per-port ACL enforcement" },
          { criterion: "Tripartite Synergy", maxMarks: 2, description: "Highlights sequential dependency and mutual reinforcement" },
        ],
      },
      {
        id: "wt-net-6",
        prompt: "Formulate the Bandwidth-Delay Product (BDP) equation. Explain its significance in sizing TCP socket buffer windows, and analyze the operational consequences of buffer under-sizing versus bufferbloat.",
        modelAnswer: "BDP Equation: BDP = Bandwidth (bps) * RTT (seconds). It represents the maximum volume of unacknowledged data in-flight that can exist in the network pipe at any given moment.\nSignificance: For a TCP connection to achieve 100% link utilization, the TCP receive socket buffer (Window Size) must be at least equal to the BDP (Buffer >= BDP).\nBuffer Under-sizing: If the TCP buffer is smaller than BDP, the sender is forced to stop and wait for ACKs before transmitting more packets, severely throttling throughput (Throughput = Window / RTT < Link Bandwidth).\nBufferbloat: Excessively large router buffers cause packets to queue up under congestion rather than dropping promptly to signal TCP congestion control (via TCP Reno/Cubic). This creates catastrophic queuing latency (seconds of delay) for interactive VoIP and DNS traffic.",
        keyRubricPoints: [
          "States mathematical equation BDP = R * RTT",
          "Explains TCP receive buffer sizing requirement (Buffer >= BDP)",
          "Analyzes throughput degradation caused by buffer under-sizing",
          "Explains Bufferbloat mechanism and its impact on real-time latency",
        ],
        topic: "Performance",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "formulate",
        expectedAnswerPoints: [
          "BDP = R * RTT equation and data in-flight concept",
          "Optimal TCP window size equal to or greater than BDP",
          "Under-sized buffers: pipeline starvation and sub-line-rate throughput",
          "Bufferbloat: excessive queuing delay and destruction of real-time responsiveness",
        ],
        gradingRubric: [
          { criterion: "BDP Mathematical Formulation", maxMarks: 2, description: "Defines formula and physical interpretation of in-flight data" },
          { criterion: "TCP Window Dimensioning", maxMarks: 3, description: "Connects socket buffers to line-rate transmission saturation" },
          { criterion: "Buffer Under-sizing Analysis", maxMarks: 2, description: "Explains ACK starvation and throughput collapse" },
          { criterion: "Bufferbloat & Queuing Latency", maxMarks: 3, description: "Explains unmanaged queue growth and destruction of latency SLA" },
        ],
      },
      {
        id: "wt-net-7",
        prompt: "Compare Router-on-a-Stick with Layer 3 Switch SVI (Switched Virtual Interface) routing for enterprise campus VLANs. Evaluate performance, hardware bottlenecks, and routing throughput.",
        modelAnswer: "Router-on-a-Stick: Employs a single physical 802.1Q trunk link connecting a Layer 2 switch to an external router interface divided into logical subinterfaces. Every packet moving between VLANs must traverse this single physical link twice ('hairpinning'). Performance is constrained by external link bandwidth and CPU software routing bottlenecks (limited to tens of thousands of packets per second).\nLayer 3 Switch SVI Routing: Routes traffic internally between VLANs using Switched Virtual Interfaces (SVIs) configured on multi-layer switches. Inter-VLAN packet forwarding occurs directly in hardware at wire speed using Application-Specific Integrated Circuits (ASICs) and Ternary Content Addressable Memory (TCAM). Throughput reaches hundreds of millions of packets per second with sub-microsecond latency, eliminating link bottlenecks.",
        keyRubricPoints: [
          "Describes Router-on-a-Stick subinterface trunk and hairpinning penalty",
          "Describes Layer 3 switch SVI configuration and internal routing",
          "Contrasts router CPU software routing with switch ASIC/TCAM hardware wire-speed forwarding",
          "Compares throughput metrics and scalability constraints",
        ],
        topic: "Routing Architecture",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "compare",
        expectedAnswerPoints: [
          "Router-on-a-Stick: physical trunk link, subinterfaces, double-traversal bottleneck",
          "Layer 3 switch: internal SVI interfaces, zero external physical link dependency",
          "Hardware architecture: ASICs and TCAM wire-speed packet switching",
          "Throughput difference: Mpps wire-speed vs software CPU routing",
        ],
        gradingRubric: [
          { criterion: "Router-on-a-Stick Architecture", maxMarks: 3, description: "Details subinterfaces, 802.1Q encapsulation, and bandwidth limits" },
          { criterion: "Layer 3 Switch SVI Mechanics", maxMarks: 3, description: "Explains SVI creation and internal backplane forwarding" },
          { criterion: "Hardware ASICs vs Software CPU", maxMarks: 2, description: "Contrasts TCAM hardware lookups with router CPU forwarding" },
          { criterion: "Campus Scalability Conclusion", maxMarks: 2, description: "Draws clear architectural boundary for modern enterprise campus" },
        ],
      },
      {
        id: "wt-net-8",
        prompt: "Analyze the operational behavior of IEEE 802.3ad Link Aggregation Control Protocol (LACP). Explain how EtherChannel member links are bundled, how active and passive negotiation occurs, and why hash-based load distribution is mandatory.",
        modelAnswer: "IEEE 802.3ad LACP provides dynamic bundling of up to 16 physical Ethernet links (up to 8 active links and 8 standby links) into a unified logical EtherChannel interface.\n1. Negotiation Modes: Active mode actively initiates LACP negotiation by sending LACP packets; Passive mode listens and responds to incoming LACP packets without initiating. A channel forms if at least one side is Active (Active-Active or Active-Passive; Passive-Passive fails).\n2. Spanning Tree Benefit: STP treats the entire EtherChannel as a single logical link, preventing individual physical links from being placed into blocking state while multiplying aggregate bandwidth.\n3. Hash Distribution: Member link selection uses a mathematical hash function on packet headers (Source/Destination IP, MAC, or Port). Flow-based hashing is mandatory because round-robin distribution causes frames to arrive out-of-order, triggering TCP duplicate ACKs and artificial congestion window collapses.",
        keyRubricPoints: [
          "Defines LACP bundle limits (8 active, 8 standby)",
          "Explains Active vs Passive negotiation states and channel formation conditions",
          "Explains STP integration (single logical port preventing loop blocks)",
          "Explains why hash-based flow distribution prevents TCP out-of-order delivery",
        ],
        topic: "Link Aggregation",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "analyze",
        expectedAnswerPoints: [
          "LACP protocol basics and 8 active link channel limit",
          "Active vs Passive negotiation handshake logic",
          "Single logical port representation in Spanning Tree",
          "Flow hashing algorithm and mitigation of out-of-order TCP packet delivery",
        ],
        gradingRubric: [
          { criterion: "LACP Protocol Specifications", maxMarks: 2, description: "Details IEEE 802.3ad active/standby link bundling limits" },
          { criterion: "Negotiation Modes & Rules", maxMarks: 3, description: "Explains Active/Passive interaction matrix" },
          { criterion: "STP Logical Integration", maxMarks: 2, description: "Details loop prevention and bundle forwarding state" },
          { criterion: "Hash-Based Flow Distribution", maxMarks: 3, description: "Explains prevention of TCP out-of-order packet arrival" },
        ],
      },
      {
        id: "wt-net-9",
        prompt: "State the mathematical formula for network system availability in terms of MTBF and MTTR. Explain why enterprise campus designs achieve 'Five Nines' (99.999%) availability by minimizing MTTR rather than by maximizing MTBF.",
        modelAnswer: "Availability Formula: A = MTBF / (MTBF + MTTR), where MTBF is Mean Time Between Failures and MTTR is Mean Time to Repair.\nFive Nines Requirement: 99.999% availability permits at most 5.26 minutes of unscheduled downtime annually.\nWhy Minimize MTTR: Maximizing MTBF requires manufacturing hardware that never fails over years of continuous operation, which is physically and economically impossible in enterprise environments with power fluctuations, component degradation, and fiber cuts.\nIn contrast, minimizing MTTR to sub-second durations via redundant dual-homed hardware, automated First-Hop Redundancy Protocols (HSRP/VRRP failover in <1s), Rapid Spanning Tree (RSTP sub-second convergence), and redundant power supplies allows a device to fail without disrupting service. If failover is automated in milliseconds, effective MTTR approaches zero, mathematically delivering 99.999% availability.",
        keyRubricPoints: [
          "States mathematical formula A = MTBF / (MTBF + MTTR)",
          "Calculates annual downtime threshold for 99.999% (~5.26 minutes)",
          "Explains physical and economic impossibility of infinite MTBF",
          "Demonstrates how automated sub-second failover minimizes MTTR to achieve Five Nines",
        ],
        topic: "Availability",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "explain",
        expectedAnswerPoints: [
          "Formula A = MTBF / (MTBF + MTTR)",
          "Five Nines equates to 5.26 minutes annual downtime",
          "Economic/physical limits of single-component MTBF",
          "Architectural failover mechanisms (FHRP, RSTP, LACP) that reduce MTTR to milliseconds",
        ],
        gradingRubric: [
          { criterion: "Mathematical Formulation", maxMarks: 3, description: "Accurately defines availability equation and annual downtime limit" },
          { criterion: "MTBF Economic & Physical Limits", maxMarks: 2, description: "Analyzes hardware reliability constraints" },
          { criterion: "MTTR Minimization Strategy", maxMarks: 3, description: "Explains sub-second failover and redundancy protocols" },
          { criterion: "High Availability Synthesis", maxMarks: 2, description: "Synthesizes dual-homed design into Five Nines compliance" },
        ],
      },
      {
        id: "wt-net-10",
        prompt: "Evaluate the principles of Zero Trust Architecture (ZTA) in modern enterprise campus networks. Describe how traditional perimeter security fails and how micro-segmentation, 802.1X authentication, and continuous posture assessment are implemented.",
        modelAnswer: "Traditional Perimeter Security: Relies on the 'castle-and-moat' model where everything outside the firewall is untrusted and everything inside the corporate LAN is implicitly trusted. Once an attacker breaches the perimeter (via phishing or infected student laptop), they can move laterally unrestricted across flat internal subnets.\nZero Trust Principles: Core tenet is 'Never trust, always verify'. Every transaction, user, and device must be explicitly authenticated and authorized regardless of physical location.\nImplementation in Campus Design:\n1. IEEE 802.1X NAC: Every switch port blocks traffic in an unauthorized state until credentials/certificates are verified by RADIUS/TACACS+ servers (Cisco ISE / Aruba ClearPass).\n2. Micro-segmentation: Virtual networks (VXLAN/EVPN or Private VLANs) isolate users and IoT endpoints into micro-perimeters so compromised endpoints cannot reach corporate databases.\n3. Continuous Posture Assessment: Device health (patch level, antivirus state, behavioral anomalies) is continuously monitored; access is dynamically revoked if telemetry detects threats.",
        keyRubricPoints: [
          "Contrasts perimeter 'castle-and-moat' model with Zero Trust 'never trust, always verify'",
          "Explains risk of lateral movement on flat internal corporate networks",
          "Details 802.1X port-based access control and RADIUS authentication",
          "Describes micro-segmentation (VXLAN/PVLAN) and continuous device health verification",
        ],
        topic: "Security",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "evaluate",
        expectedAnswerPoints: [
          "Failure of traditional castle-and-moat perimeter models",
          "Zero Trust core philosophy: explicit verification and least privilege",
          "802.1X port authentication framework (Supplicant, Authenticator, Authentication Server)",
          "Micro-segmentation to restrict lateral movement and continuous telemetry posture checks",
        ],
        gradingRubric: [
          { criterion: "Perimeter Model Critique", maxMarks: 2, description: "Identifies lateral movement risks in traditional LAN designs" },
          { criterion: "Zero Trust Core Tenets", maxMarks: 2, description: "Explains explicit verification and least privilege access" },
          { criterion: "802.1X Port Authentication", maxMarks: 3, description: "Details Supplicant, Authenticator, and RADIUS authentication workflow" },
          { criterion: "Micro-Segmentation & Posture", maxMarks: 3, description: "Explains isolation techniques and continuous security telemetry" },
        ],
      },
    ],
    fillBlanks: [
      {
        id: "fb-net-1",
        sentenceWithBlank: "In a campus LAN design, the open-standard protocol used to bundle multiple physical links into one logical channel is [LACP].",
        blankAnswer: "LACP",
        acceptedAlternatives: ["Link Aggregation Control Protocol", "802.3ad"],
        hint: "IEEE standard 802.3ad",
        explanation: "LACP dynamically negotiates link aggregation bundles.",
        topic: "Link Aggregation",
        blankType: "terminology",
      },
      {
        id: "fb-net-2",
        sentenceWithBlank: "A high availability specification of 'Five Nines' (99.999%) permits at most [5.26] minutes of unscheduled downtime per calendar year.",
        blankAnswer: "5.26",
        acceptedAlternatives: ["5.25", "5.3", "~5.26"],
        hint: "Calculate (1 - 0.99999) * 365.25 * 24 * 60 minutes.",
        explanation: "Five Nines availability permits exactly 5.2596 minutes of annual downtime across 24/7/365 operations.",
        topic: "Availability",
        blankType: "formula",
      },
      {
        id: "fb-net-3",
        sentenceWithBlank: "In the Cisco Three-Tier Hierarchical model, the layer whose sole purpose is high-speed packet switching with zero ACL filtering is the [Core] layer.",
        blankAnswer: "Core",
        acceptedAlternatives: ["core layer", "Backbone"],
        hint: "High-speed backbone layer...",
        explanation: "The Core layer optimizes for maximum wire-speed switching without CPU-intensive packet filtering.",
        topic: "Hierarchical Design",
        blankType: "classification",
      },
      {
        id: "fb-net-4",
        sentenceWithBlank: "According to ITU G.114, toll-quality enterprise voice (VoIP) requires that one-way network latency must not exceed [150] milliseconds.",
        blankAnswer: "150",
        acceptedAlternatives: ["150ms", "150 ms"],
        hint: "Standard recommended maximum delay for interactive voice...",
        explanation: "One-way delay exceeding 150 ms causes noticeable audio echo and conversational overlap.",
        topic: "Quality of Service",
        blankType: "principle",
      },
      {
        id: "fb-net-5",
        sentenceWithBlank: "In Differentiated Services (DiffServ), the DSCP marking reserved for low-delay voice traffic is Expedited Forwarding, which has a decimal value of [46].",
        blankAnswer: "46",
        acceptedAlternatives: ["EF", "101110"],
        hint: "Binary 101110 in decimal...",
        explanation: "DSCP EF (decimal 46) is universally mapped to the strict priority queue for real-time voice packets.",
        topic: "Quality of Service",
        blankType: "terminology",
      },
      {
        id: "fb-net-6",
        sentenceWithBlank: "Dynamic ARP Inspection (DAI) prevents ARP spoofing by validating incoming ARP packets against the [DHCP Snooping] binding database.",
        blankAnswer: "DHCP Snooping",
        acceptedAlternatives: ["dhcp snooping", "DHCP-snooping"],
        hint: "Feature that snoops DHCP leases on untrusted ports...",
        explanation: "DAI relies directly on the IP-to-MAC bindings stored in the DHCP Snooping database.",
        topic: "Security",
        blankType: "relationship",
      },
      {
        id: "fb-net-7",
        sentenceWithBlank: "Network system availability is calculated using Mean Time Between Failures and Mean Time to Repair as A = MTBF / (MTBF + [MTTR]).",
        blankAnswer: "MTTR",
        acceptedAlternatives: ["Mean Time to Repair", "mttr"],
        hint: "Mean Time to Repair acronym...",
        explanation: "Availability A = MTBF / (MTBF + MTTR); minimizing MTTR mathematically yields 99.999% uptime.",
        topic: "Availability",
        blankType: "formula",
      },
      {
        id: "fb-net-8",
        sentenceWithBlank: "In Rapid Spanning Tree Protocol (IEEE 802.1w), sub-second convergence is achieved on point-to-point links using the [proposal-agreement] handshake.",
        blankAnswer: "proposal-agreement",
        acceptedAlternatives: ["proposal agreement", "proposal/agreement"],
        hint: "Two-step handshake exchanging sync bits...",
        explanation: "The proposal-agreement handshake bypasses legacy 15s Listening and Learning timer delays.",
        topic: "Spanning Tree",
        blankType: "process",
      },
      {
        id: "fb-net-9",
        sentenceWithBlank: "In Private VLANs, a switch port that can communicate only with Promiscuous ports and is completely blocked from all other ports is an [isolated] port.",
        blankAnswer: "isolated",
        acceptedAlternatives: ["Isolated", "isolated port"],
        hint: "Opposite of community port...",
        explanation: "Isolated ports provide total Layer 2 segregation from other user ports on the same VLAN.",
        topic: "VLANs",
        blankType: "classification",
      },
      {
        id: "fb-net-10",
        sentenceWithBlank: "In Multi-Area OSPF design, all non-backbone areas must connect directly to the backbone area, designated as Area [0].",
        blankAnswer: "0",
        acceptedAlternatives: ["Area 0", "backbone", "zero"],
        hint: "The backbone area number...",
        explanation: "Area 0 is the mandatory central hub of the OSPF star topology to prevent routing loops.",
        topic: "OSPF",
        blankType: "principle",
      },
    ],
    overview: {
      courseSubject: "Computer Science & Engineering",
      chapterTopic: "Campus & Enterprise Network Design Requirements",
      academicContext:
        "Senior undergraduate curriculum in Data Communications and Computer Networks (CoSc 3021). Bridges theoretical telecommunication limits with production enterprise infrastructure architecture.",
      learningObjectives: [
        "Explain the functional roles, boundary conditions, and design constraints of the three-tier hierarchical campus topology.",
        "Compare First-Hop Redundancy Protocols (HSRP, VRRP, GLBP) in terms of convergence metrics, vendor interoperability, and load-balancing efficiency.",
        "Analyze Link Aggregation (IEEE 802.3ad LACP) and Spanning Tree evolution (802.1D vs 802.1w/s) to eliminate Layer 2 loops while maximizing link throughput.",
        "Apply DiffServ Quality of Service (QoS) classification, DSCP markings, and Strict Priority Queuing to guarantee real-time VoIP and video tolerances.",
        "Formulate a zero-trust port access defense utilizing the Layer 2 triad: DHCP Snooping, Dynamic ARP Inspection (DAI), and IP Source Guard (IPSG).",
        "Calculate theoretical communication bounds and system metrics using Shannon's Capacity theorem, Availability equations (MTBF/MTTR), and Bandwidth-Delay Product (BDP)."
      ],
      coreConcepts: [
        "Three-Tier Hierarchical Model (Core, Distribution, Access)",
        "First-Hop Default Gateway Virtualization (FHRP)",
        "Deterministic Layer 2 Link Aggregation & STP Evolution",
        "Differentiated Services Quality of Service (DiffServ QoS)",
        "Zero-Trust Port Access Control & Layer 2 Defensive Triad",
        "Physical Transmission Bounds (Shannon's Law & BDP)"
      ],
      keyPrinciples: [
        "Core Simplicity Principle: The Core must remain stateless and optimize purely for wire-speed packet switching; never burden it with ACLs or deep packet inspection.",
        "Failure Domain Containment: Isolate Layer 2 broadcast domains to individual wiring closets using Layer 3 routed access.",
        "Availability via MTTR Minimization: Achieving 99.999% uptime requires sub-second automated failover rather than infinite hardware reliability.",
        "Access Trust Boundary: Never trust client endpoint QoS markings; rewrite or police untrusted traffic at ingress access ports."
      ],
      importantDefinitions: [
        { term: "Goodput", definition: "Actual application payload delivered successfully excluding all lower-layer headers, retransmissions, and framing overhead." },
        { term: "Bandwidth-Delay Product (BDP)", definition: "The volume of data in-flight on a transmission link, defining the minimum TCP buffer window required for line-rate saturation." },
        { term: "Five Nines (99.999%)", definition: "High availability standard allowing no more than 5.26 minutes of unscheduled downtime annually." },
        { term: "DSCP Expedited Forwarding (EF)", definition: "Binary 101110 (decimal 46) QoS marking reserved for low-latency, low-jitter real-time voice traffic." }
      ],
      majorTheoriesAndModels: [
        { name: "Cisco Three-Tier Hierarchical Model", description: "Modular network design separating network functions into Access, Distribution, and Core tiers to achieve predictable performance and scalability.", corePremise: "Functional separation guarantees scalability and isolates broadcast failure domains." },
        { name: "Shannon-Hartley Theorem", description: "Establishes the maximum theoretical channel capacity in the presence of Gaussian noise: C = B * log2(1 + S/N).", corePremise: "Spectral bandwidth scales capacity linearly, whereas transmission power yields logarithmic returns." },
        { name: "Differentiated Services (DiffServ) Architecture", description: "Coarse-grained class-based QoS model replacing stateful per-flow reservations with edge classification and per-hop behaviors (PHB).", corePremise: "Edge tagging enables stateless core scalability." }
      ],
      conceptRelationships: [
        { sourceConcept: "Access Layer", targetConcept: "Distribution Layer", relationship: "Dual-homed redundant uplinks aggregated via LACP to eliminate single point of failure." },
        { sourceConcept: "DHCP Snooping", targetConcept: "Dynamic ARP Inspection (DAI)", relationship: "DAI relies directly on the snooping binding database to validate ARP reply legitimacy." },
        { sourceConcept: "DHCP Snooping", targetConcept: "IP Source Guard (IPSG)", relationship: "IPSG dynamically builds port ACLs from snooping bindings to prevent IP address spoofing." },
        { sourceConcept: "DiffServ Ingress Boundary", targetConcept: "Strict Priority Queuing", relationship: "Ingress DSCP EF classification dictates egress queue dispatch to preserve bounded voice jitter." }
      ],
      practicalApplications: [
        "Designing resilient multi-building university campus backbones with redundant 40G/100G fiber rings.",
        "Dimensioning enterprise VoIP networks to sustain <150ms delay, <30ms jitter, and <1% loss during peak traffic.",
        "Preventing rogue device interception and ARP poisoning attacks in high-density student dormitories.",
        "Configuring data center top-of-rack leaf-spine fabrics with active-active link aggregation (MLAG)."
      ],
      keyTakeaways: [
        "Modern campus networks favor routed access to eliminate Spanning Tree blocked links and accelerate convergence to <200ms.",
        "First-Hop gateway protocols ensure client host resilience; GLBP optimizes active-active bandwidth usage while HSRP/VRRP offer simple active-standby resilience.",
        "High availability is mathematically achieved by reducing Mean Time to Repair (MTTR) through automated detection and stateful failover.",
        "Security is non-negotiable at Layer 2; failing to deploy DHCP Snooping renders the local network vulnerable to simple MITM attacks."
      ],
      examRelevantAreas: [
        "Calculate annual downtime for availability tiers (99.9%, 99.99%, 99.999%).",
        "Identify specific functions belonging to Access vs Distribution vs Core layers in scenario-based questions.",
        "Distinguish between HSRP, VRRP, and GLBP operational behaviors, virtual MAC address formats, and multicast groups.",
        "Analyze STP port states and calculate convergence times for 802.1D vs 802.1w (RSTP).",
        "Given link speed and RTT, compute Bandwidth-Delay Product (BDP) and determine appropriate TCP window sizing."
      ],
      mentalModelHierarchy: [
        {
          id: "hier-unit-1",
          unit: "Unit 1.0",
          topic: "Physical & Logical Topology Architecture",
          concepts: [
            { name: "Hierarchical Three-Tier Model", details: "Core (high-speed transit), Distribution (routing & policy), Access (endpoint security & PoE).", exampleOrApplication: "Enterprise university campus with 5,000+ endpoints across 12 faculties." },
            { name: "Collapsed Core Architecture", details: "Core and Distribution combined into a single redundant pair for cost and energy savings.", exampleOrApplication: "Branch office or small campus with fewer than 1,000 active users." }
          ]
        },
        {
          id: "hier-unit-2",
          unit: "Unit 2.0",
          topic: "Default Gateway Virtualization & Redundancy",
          concepts: [
            { name: "First-Hop Redundancy Protocols (HSRP/VRRP)", details: "Virtual IP/MAC shared between routers; active forwards, standby monitors hellos.", exampleOrApplication: "Dual core switches acting as default gateways for corporate VLANs." },
            { name: "Gateway Load Balancing Protocol (GLBP)", details: "Active Virtual Gateway (AVG) answers ARP with distinct AVF virtual MACs for active-active forwarding.", exampleOrApplication: "High-utilization subnets where both uplink routers must carry client traffic." }
          ]
        },
        {
          id: "hier-unit-3",
          unit: "Unit 3.0",
          topic: "Layer 2 Determinism & Spanning Tree Evolution",
          concepts: [
            { name: "Rapid & Multiple STP (802.1w / 802.1s)", details: "Sub-second proposal-agreement handshake replaces 30-50s legacy timer transitions.", exampleOrApplication: "Real-time VoIP environments where 50s link failures terminate active calls." },
            { name: "Link Aggregation (IEEE 802.3ad LACP)", details: "Bundles up to 8 physical links into one logical channel; hash-based load distribution.", exampleOrApplication: "20 Gbps uplink created from two bundled 10 Gbps SFP+ trunk lines." }
          ]
        },
        {
          id: "hier-unit-4",
          unit: "Unit 4.0",
          topic: "Quality of Service & Traffic Conditioning",
          concepts: [
            { name: "DiffServ Architecture & DSCP Markings", details: "6-bit DSCP field in IP header classified at trust boundary; EF (46) for voice, AF for video, BE for web.", exampleOrApplication: "Campus boundary switch preventing streaming video from starving VoIP calls." },
            { name: "Traffic Shaping vs Traffic Policing", details: "Policing drops excess packets above CIR; Shaping buffers and delays excess for smooth output.", exampleOrApplication: "Shaping WAN interface to match contracted 100 Mbps CIR over a 1 Gbps physical port." }
          ]
        },
        {
          id: "hier-unit-5",
          unit: "Unit 5.0",
          topic: "Zero-Trust Edge & Layer 2 Defensive Triad",
          concepts: [
            { name: "DHCP Snooping & Binding Database", details: "Distinguishes trusted uplink ports from untrusted client ports, filtering rogue DHCP offers.", exampleOrApplication: "Blocking student rogue Wi-Fi routers from broadcasting default gateway IP." },
            { name: "Dynamic ARP Inspection & IP Source Guard", details: "Validates ARP frames and IP packets against snooping table, terminating MITM and spoofing.", exampleOrApplication: "Securing student lab computers against Ettercap/Cain ARP spoofing." }
          ]
        }
      ],
      sourceGroundedNotes: {
        isFullyGrounded: true
      }
    },
    cheatSheet: {
      estimatedReviewMinutes: 7,
      criticalDefinitions: [
        { term: "Goodput", briefDefinition: "Net application data successfully delivered, excluding all protocol headers and retransmitted frames.", highYieldTag: "Exam Favorite" },
        { term: "Five Nines (99.999%)", briefDefinition: "Availability benchmark allowing at most 5.26 minutes of unplanned outage per year.", highYieldTag: "Must Calculate" },
        { term: "Bandwidth-Delay Product (BDP)", briefDefinition: "Capacity × RTT; volume of unacknowledged data in flight across the network pipe.", highYieldTag: "Formula" },
        { term: "DSCP Expedited Forwarding (EF)", briefDefinition: "Value 46 (binary 101110) strictly mapped to low-latency priority queue for VoIP.", highYieldTag: "Voice QoS" },
        { term: "PortFast & BPDU Guard", briefDefinition: "PortFast transitions immediately to forwarding; BPDU Guard err-disables port if STP frame received.", highYieldTag: "Switch Security" },
        { term: "EtherChannel / LACP", briefDefinition: "IEEE 802.3ad standard bundling up to 8 active links with hash-based traffic distribution.", highYieldTag: "Layer 2" }
      ],
      keyTerminology: [
        { term: "MTBF", context: "Mean Time Between Failures: average operational time between failures." },
        { term: "MTTR", context: "Mean Time to Repair: average duration to diagnose, repair, and restore." },
        { term: "CIR", context: "Committed Information Rate: guaranteed bandwidth contracted from provider." },
        { term: "AVF", context: "Active Virtual Forwarder: router in GLBP that forwards for a specific virtual MAC." },
        { term: "TCAM", context: "Ternary Content-Addressable Memory: hardware ASIC memory for wire-speed ACLs." }
      ],
      corePrinciples: [
        { principle: "Core Simplicity Rule", conciseRule: "Core layer must switch packets at wire-speed; zero ACL filtering or packet manipulation." },
        { principle: "Availability Invariant", conciseRule: "A = MTBF / (MTBF + MTTR). Reducing MTTR via auto-failover is far more cost-effective than infinite MTBF." },
        { principle: "QoS Trust Boundary", conciseRule: "Enforce classification at ingress access switch; untrusted markings must be rewritten to DSCP 0." },
        { principle: "Layer 2 Security Triad", conciseRule: "DAI and IP Source Guard require DHCP Snooping; without snooping, they have no validation database." }
      ],
      importantFormulas: [
        { title: "Shannon Channel Capacity", formula: "C = B · log₂(1 + S/N)", variables: "C: capacity (bps), B: bandwidth (Hz), S/N: signal-to-noise ratio", quickTip: "Bandwidth scales capacity linearly; signal power scales capacity logarithmically." },
        { title: "System Availability", formula: "A = MTBF / (MTBF + MTTR)", variables: "A: availability fraction, MTBF: hours between failure, MTTR: hours to restore", quickTip: "99.999% equates to ~5.26 minutes of downtime per 365.25 days." },
        { title: "Bandwidth-Delay Product", formula: "BDP = Bandwidth (bps) × RTT (sec)", variables: "RTT: round-trip delay, Bandwidth: bottleneck link rate", quickTip: "Socket buffer must be ≥ BDP to saturate full link capacity." },
        { title: "Annual Outage Duration", formula: "Downtime = (1 - A) × 8,766 hours", variables: "A: availability fraction", quickTip: "Multiply by 60 to convert hours to minutes for exam calculations." }
      ],
      comparisonsTable: [
        { concept: "Core vs Distribution", meaning: "High-speed transit vs Policy boundary", keyDifference: "Core switches without ACLs; Distribution handles inter-VLAN routing, ACLs, and QoS boundaries.", example: "Core: Nexus 9500; Distribution: Catalyst 9400" },
        { concept: "HSRP vs VRRP", meaning: "Default gateway redundancy protocols", keyDifference: "HSRP is Cisco proprietary (MAC 0000.0c07.acXX); VRRP is RFC open standard (MAC 00-00-5E-00-01-XX).", example: "Multi-vendor campus uses VRRP (RFC 5798)" },
        { concept: "HSRP vs GLBP", meaning: "Failover vs Load-balancing gateway", keyDifference: "HSRP has 1 active + 1 idle standby (50% waste); GLBP balances across up to 4 active forwarders.", example: "GLBP round-robins ARP replies to clients" },
        { concept: "Traffic Policing vs Shaping", meaning: "Bandwidth rate limiting methods", keyDifference: "Policing drops/remarks excess packets immediately; Shaping buffers excess in RAM for smooth output.", example: "Policer on ingress; Shaper on egress WAN" },
        { concept: "802.1D vs 802.1w (RSTP)", meaning: "Spanning Tree convergence generations", keyDifference: "802.1D waits 30-50s timer transitions; 802.1w converges in <1s via proposal-agreement handshakes.", example: "RSTP prevents VoIP call drops during link failover" },
        { concept: "DHCP Snooping vs DAI", meaning: "Layer 2 defense functions", keyDifference: "Snooping blocks rogue DHCP servers & builds IP-MAC table; DAI checks ARP packets against that table.", example: "DAI drops poisoned ARP replies on untrusted ports" }
      ],
      processesAndWorkflows: [
        {
          title: "Layer 2 Defensive Triad Deployment Sequence",
          steps: [
            "Enable DHCP Snooping globally and on desired VLANs",
            "Configure upstream router/server ports as 'trusted'",
            "Verify dynamic IP-MAC bindings populate in snooping database",
            "Enable Dynamic ARP Inspection (DAI) on the VLAN",
            "Enable IP Source Guard (IPSG) on untrusted access ports"
          ],
          summary: "Must be enabled in this exact sequence; enabling DAI or IPSG without snooping blocks all client traffic."
        },
        {
          title: "HSRP Failover Execution Cycle",
          steps: [
            "Active and Standby routers exchange UDP hello packets every 3s",
            "Active router fails or uplink interface goes down",
            "Standby router misses 3 consecutive hellos (Hold time 10s expires)",
            "Standby transitions to Active state and sends Gratuitous ARP with virtual MAC",
            "Switch updates MAC address table; client packets seamlessly redirect"
          ],
          summary: "Sub-second failover achieved when configured with millisecond timers."
        }
      ],
      importantRelationships: [
        { relation: "Link Bandwidth & TCP Window", impact: "High-bandwidth links cannot be saturated if TCP window buffer is smaller than Bandwidth-Delay Product (BDP)." },
        { relation: "Jitter Buffer & Latency", impact: "Jitter buffers convert variable packet arrival into smooth playback, but directly add to end-to-end delay (budget ≤150ms)." },
        { relation: "Core ACL Placement & Throughput", impact: "Applying ACLs at the Core forces packet header inspection in software or complex TCAM lookups, inducing throughput collapse." }
      ],
      commonMistakes: [
        { misconception: "Thinking high bandwidth prevents network latency and VoIP jitter.", correctUnderstanding: "Bandwidth is link pipe width; latency is propagation delay. Saturation queues induce bufferbloat, requiring QoS Strict Priority Queuing." },
        { misconception: "Placing ACL packet inspection filters on Core layer switches.", correctUnderstanding: "Core switches must perform pure wire-speed forwarding without stateful inspection; policies belong at the Distribution layer." },
        { misconception: "Assuming HSRP provides active-active bandwidth load sharing.", correctUnderstanding: "HSRP operates in active-standby mode; standby links sit completely idle unless multiple HSRP groups are configured on separate VLANs." },
        { misconception: "Deploying Dynamic ARP Inspection (DAI) without first validating DHCP Snooping.", correctUnderstanding: "DAI relies exclusively on the DHCP Snooping binding table. Without valid bindings, DAI drops all legitimate host ARP packets." }
      ],
      examReminders: [
        "VoIP Tolerances: One-way delay ≤150ms (ITU G.114), Jitter ≤30ms, Packet loss ≤1%.",
        "OSPF Multi-Area Rule: Area 0 (Backbone) is mandatory; all non-zero areas must connect directly to Area 0.",
        "Wireless 2.4 GHz non-overlapping channels: Only 1, 6, and 11. Never use channels 2, 3, 4, 7, 8, etc.",
        "Administrative Distance: Connected=0, Static=1, eBGP=20, EIGRP=90, OSPF=110, iBGP=200.",
        "Five Nines calculation: (1 - 0.99999) × 365.25 × 24 × 60 = 5.2596 minutes per year."
      ]
    },
    notes: {
      summary:
        "This executive lecture synthesis establishes the foundational architectural principles, governing mathematical theorems, and engineering trade-offs of campus and enterprise networks. It formalizes three-tier hierarchical segmentation (Core, Distribution, Access), first-hop default gateway virtualization (HSRP, VRRP, GLBP), deterministic link aggregation (IEEE 802.3ad LACP), non-blocking switching fabrics, and zero-trust port authentication (IEEE 802.1X). Core theoretical constraints—including the Shannon-Hartley channel capacity theorem, operational availability formulations (A = MTBF / [MTBF + MTTR]), and Bandwidth-Delay Product (BDP) queue sizing—are analyzed to bridge rigorous computer science theory with production infrastructure engineering.",
      learningObjectives: [
        "Analyze enterprise network requirements across functional and non-functional dimensions.",
        "Design modular three-tier campus architectures ensuring deterministic failure domain isolation.",
        "Implement first-hop gateway virtualization protocols (HSRP, VRRP, GLBP) for high availability.",
        "Formulate Quality of Service (QoS) classification boundaries and queuing policies for real-time media.",
        "Enforce zero-trust Layer 2 security using DHCP Snooping, Dynamic ARP Inspection, and 802.1X.",
        "Calculate channel capacity bounds, system availability percentages, and queue buffer dimensions."
      ],
      keyConcepts: [
        {
          unit: "Unit 1.0",
          concept: "Three-Tier Hierarchical Topology & Failure Domain Segregation",
          definition: "An architectural framework dividing campus networks into Core, Distribution, and Access layers.",
          explanation:
            "Campus networks are structured into three deterministic tiers: Core, Distribution, and Access. The Core functions strictly as a high-speed packet transit backbone with zero packet filtering; the Distribution tier serves as the policy enforcement boundary, handling inter-VLAN routing, ACLs, and QoS classification; the Access tier enforces end-station connectivity, 802.1X authentication, and PoE. This modularity isolates Layer 2 broadcast domains and guarantees deterministic convergence.",
          whyItMatters: "Eliminates chaotic mesh cabling, localizes hardware faults, and permits modular capacity expansion without downtime.",
          example: "Aggregating 50 access wiring closet switches into a redundant pair of distribution switches in a campus library.",
          relatedConcepts: ["Collapsed Core", "VLAN Segmentation", "Spanning Tree Protocol"],
          takeaway:
            "Keep the Core layer simple and stateless; pushing complex ACLs or inspection into the Core creates head-of-line blocking and degrades wire-speed ASIC forwarding.",
          tradeoffs:
            "Three-tier architectures require greater initial hardware investment and structured fiber cabling than collapsed topologies, but provide linear scalability, deterministic troubleshooting, and rapid Mean Time to Repair (MTTR)."
        },
        {
          unit: "Unit 2.0",
          concept: "First-Hop Default Gateway Virtualization (FHRP Invariants)",
          definition: "A class of protocols that multiplex multiple physical routers behind a shared virtual IP and MAC address.",
          explanation:
            "To prevent the host default gateway from becoming a single point of failure (SPOF), First-Hop Redundancy Protocols present a single Virtual IP (VIP) and Virtual MAC to client endpoints across multiple physical routers. While HSRP (Cisco) and VRRP (RFC 5798 standard) operate in active-standby topologies where passive uplinks sit idle, GLBP (Gateway Load Balancing Protocol) achieves simultaneous active-active traffic forwarding across up to four routers via algorithmic round-robin ARP replies.",
          whyItMatters: "Client operating systems statically configure one default gateway IP; FHRP provides seamless transparent failover if the physical router fails.",
          example: "Configuring two Cisco Catalyst 9500 switches with HSRP VIP 10.1.1.1 for VLAN 10 engineering hosts.",
          relatedConcepts: ["HSRP", "VRRP", "GLBP", "Gratuitous ARP"],
          takeaway:
            "VRRP guarantees multi-vendor interoperability; GLBP eliminates idle standby links by distributing virtual MAC addresses dynamically across clients.",
          tradeoffs:
            "Active-standby configurations waste 50% of available gateway uplink bandwidth, whereas active-active GLBP introduces multicast state synchronization overhead."
        },
        {
          unit: "Unit 3.0",
          concept: "Layer 2 Determinism: STP Evolution & Link Aggregation (LACP)",
          definition: "Loop prevention and link bundling mechanisms providing non-blocking active-active transmission.",
          explanation:
            "Legacy 802.1D Spanning Tree introduces 30-50s convergence penalties that disrupt real-time sessions. Modern enterprise design couples Rapid STP (802.1w) proposal-agreement handshakes and Multiple STP (802.1s) VLAN-instance grouping with IEEE 802.3ad Link Aggregation Control Protocol (LACP). LACP bundles up to 8 physical links into a single logical channel, delivering active-active bandwidth multiplication while eliminating STP port-blocking states.",
          whyItMatters: "Provides high-bandwidth uplinks between switch closets while preventing devastating broadcast radiation loops.",
          example: "Bundling two 10G fiber links into a 20G port-channel between Core and Distribution.",
          relatedConcepts: ["RSTP 802.1w", "MSTP 802.1s", "EtherChannel", "BPDU Guard"],
          takeaway:
            "Modern architectures favor routed access (Layer 3 at the distribution/access boundary) to minimize Layer 2 broadcast domains to a single switch closet.",
          tradeoffs:
            "Multi-chassis link aggregation (MLAG/vPC) eliminates spanning tree blocking but tightly couples control-plane firmware across physical switches."
        },
        {
          unit: "Unit 4.0",
          concept: "Quality of Service (QoS) & Differentiated Traffic Engineering",
          definition: "A set of queuing, policing, and shaping mechanisms to allocate bandwidth deterministically.",
          explanation:
            "Under peak link saturation, FIFO scheduling drops delay-sensitive frames Users indiscriminately. The DiffServ architecture inspects and classifies packets at the access trust boundary, stamping a 6-bit DSCP mark into the IP header. Real-time voice media is stamped DSCP EF (Expedited Forwarding, decimal 46) and assigned to a Strict Priority Queue (PQ) within Class-Based Weighted Fair Queuing (CBWFQ), guaranteeing latency under 150ms and jitter under 30ms.",
          whyItMatters: "Real-time communication (VoIP, tele-surgery, video conferencing) degrades unacceptably if packet delay varies beyond human acoustic tolerance.",
          example: "Mapping Cisco IP Phone voice packets to DSCP EF while remarking student BitTorrent downloads to Best Effort (DSCP 0).",
          relatedConcepts: ["DSCP EF", "CBWFQ", "Low Latency Queuing", "Traffic Shaping"],
          takeaway:
            "Strict trust boundaries must be enforced at the ingress access port; untrusted endpoint markings must be rewritten to DSCP 0 (Best Effort) to prevent priority abuse.",
          tradeoffs:
            "Strict priority queuing guarantees bounded latency for voice/video, but will completely starve lower-priority data queues unless paired with strict rate policing."
        },
        {
          unit: "Unit 5.0",
          concept: "Zero-Trust Port Access Control & Layer 2 Defensive Triad",
          definition: "A defense-in-depth switch security framework validating identity, IP leases, and ARP frame legitimacy.",
          explanation:
            "Network perimeter defense enforces least privilege before granting data link transport. IEEE 802.1X coordinates the Supplicant (endpoint), Authenticator (switch), and RADIUS server. To prevent lateral insider spoofing, the access switch deploys a tripartite defense: DHCP Snooping (builds a trusted IP-MAC-Port binding database), Dynamic ARP Inspection (DAI, drops poisoned ARP packets), and IP Source Guard (IPSG, drops spoofed source IPs).",
          whyItMatters: "Prevents rogue students or attackers from executing Man-in-the-Middle (MITM) attacks and poisoning ARP caches across the subnet.",
          example: "Access switch port dropping an unauthorized ARP reply packet from a rogue laptop attempting to impersonate default gateway 10.1.1.1.",
          relatedConcepts: ["802.1X NAC", "DHCP Snooping", "DAI", "IP Source Guard"],
          takeaway:
            "Dynamic ARP Inspection and IP Source Guard are strictly dependent on the integrity of the DHCP Snooping database.",
          tradeoffs:
            "Rigorous port authentication requires fallback mechanisms (e.g., MAC Authentication Bypass) to accommodate legacy devices like industrial sensors and printers."
        }
      ],
      principlesAndTheories: [
        {
          title: "Core Layer Invariance Principle",
          principle: "The Core backbone must remain dedicated strictly to high-speed packet transit.",
          explanation: "In high-throughput campus networks, packets must traverse the Core at wire-speed with deterministic latency. Introducing packet filtering, access control lists, network address translation, or deep packet inspection forces switches to recirculate packets or punt to CPU, introducing head-of-line blocking and catastrophic throughput collapse.",
          scopeOfValidity: "Applies to enterprise three-tier campus networks; does not apply to collapsed core architectures where routing and policy coalesce by economic necessity."
        },
        {
          title: "Shannon-Hartley Capacity Invariance",
          principle: "Maximum error-free information capacity is bounded by channel bandwidth and signal-to-noise ratio: C = B · log₂(1 + S/N).",
          explanation: "Transmission capacity scales linearly with frequency bandwidth, but only logarithmically with signal power. In noise-limited communication channels, doubling transmission power yields diminishing capacity gains compared to acquiring wider frequency bands.",
          scopeOfValidity: "Governs all physical transmission channels afflicted by additive white Gaussian noise (AWGN)."
        },
        {
          title: "Service Availability & MTTR Dominance Principle",
          principle: "High operational availability (Five Nines) is achieved by minimizing Mean Time to Repair (MTTR) rather than pursuing infinite hardware reliability.",
          explanation: "Given A = MTBF / (MTBF + MTTR), hardware components will inevitably experience physical faults. Engineering automated stateful failover (reducing MTTR from 2 hours to 200 milliseconds) increases availability from 99.8% to 99.999% far more predictably and cost-effectively than purchasing custom fault-proof silicon.",
          scopeOfValidity: "Fundamental systems engineering invariant across distributed networks, cloud systems, and data center fabrics."
        }
      ],
      classificationsAndCategories: [
        {
          title: "First-Hop Redundancy Protocols (FHRP) Architectural Comparison",
          headers: ["Protocol", "Standard / Vendor", "Virtual MAC Format", "Forwarding Mode", "Key Operational Trade-off"],
          rows: [
            ["HSRP", "Cisco Proprietary", "0000.0c07.acXX", "Active / Standby", "Simple configuration, but standby uplink bandwidth sits 50% idle."],
            ["VRRP", "IETF Open (RFC 5798)", "00-00-5E-00-01-XX", "Master / Backup", "Full multi-vendor interoperability; allows physical IP reuse by Master."],
            ["GLBP", "Cisco Proprietary", "0007.b400.XXYY", "Active / Active (Up to 4)", "Dynamic ARP round-robin maximizes bandwidth; higher multicast synchronization state."]
          ],
          description: "Summary of default gateway resilience mechanisms deployed at the distribution boundary."
        },
        {
          title: "Campus Hierarchical Network Tiers Comparison",
          headers: ["Layer", "Primary Architectural Responsibility", "Forbidden Operations", "Target Latency", "Typical Hardware Class"],
          rows: [
            ["Core", "Ultra-high-speed packet switching and transport", "No packet filtering, No ACLs, No NAT, No QoS marking", "< 1 ms", "High-density modular chassis switches (ASIC based)"],
            ["Distribution", "Policy enforcement, Inter-VLAN routing, Route summarization, QoS trust boundary", "No direct end-user workstation termination", "2 - 5 ms", "Layer 3 enterprise aggregation switches with 40G/100G uplinks"],
            ["Access", "User station connectivity, 802.1X port authentication, PoE, Port Security", "No core transit switching, No inter-area routing", "1 - 3 ms", "Fixed-configuration Layer 2/3 PoE+ edge switches"]
          ],
          description: "Functional division of responsibilities across the Cisco three-tier campus hierarchy."
        }
      ],
      processesAndWorkflows: [
        {
          processName: "Layer 2 Zero-Trust Defense Implementation Workflow",
          objective: "Eliminate rogue DHCP servers, ARP poisoning Man-in-the-Middle attacks, and IP address spoofing.",
          steps: [
            { stepNumber: 1, title: "Enable DHCP Snooping Globally", description: "Activate snooping on access switches to begin intercepting all DHCP broadcast and unicast messages." },
            { stepNumber: 2, title: "Define Explicit Trust Boundaries", description: "Designate switch uplink ports connected to legitimate DHCP servers or distribution routers as 'trusted'. All user ports remain untrusted by default." },
            { stepNumber: 3, title: "Populate DHCP Binding Database", description: "The switch inspects DHCP ACK messages on trusted ports and dynamically compiles a secure database mapping Client MAC, Leased IP, Lease Time, and Physical Port." },
            { stepNumber: 4, title: "Activate Dynamic ARP Inspection (DAI)", description: "Switch intercepts all ARP requests and replies on untrusted ports, validating them against the DHCP binding database. Mismatched packets are dropped immediately." },
            { stepNumber: 5, title: "Enforce IP Source Guard (IPSG)", description: "Switch installs automatic per-port ingress packet filters, ensuring every IP frame originating from a port matches the leased IP address in the snooping table." }
          ]
        },
        {
          processName: "DiffServ QoS Classification & Scheduling Workflow",
          objective: "Guarantee voice latency ≤ 150ms and jitter ≤ 30ms during heavy link congestion.",
          steps: [
            { stepNumber: 1, title: "Ingress Classification at Trust Boundary", description: "Access switch identifies media traffic by UDP port ranges and protocol type (RTP for voice, SIP for signaling)." },
            { stepNumber: 2, title: "Header Marking (DSCP Stamping)", description: "Voice audio payload is stamped DSCP EF (46); call signaling is stamped DSCP CS3 (24); best-effort web is reset to DSCP 0." },
            { stepNumber: 3, title: "Policing Untrusted Markings", description: "Untrusted endpoint markings are scrubbed to prevent malicious priority queue starvation." },
            { stepNumber: 4, title: "Egress Priority Queuing (LLQ / CBWFQ)", description: "On egress interface, DSCP EF packets are directed to the Strict Priority Queue, serviced immediately ahead of all data queues." },
            { stepNumber: 5, title: "Traffic Shaping to CIR", description: "Egress buffer shapes outgoing bursts to match contractual WAN provider Committed Information Rate (CIR)." }
          ]
        }
      ],
      clarifyingExamples: [
        {
          title: "VoIP Degradation Scenario Under Unmanaged Congestion",
          conceptIllustrated: "Why Bandwidth Alone Does Not Guarantee Quality of Service (QoS)",
          scenario: "A university campus upgraded its WAN link from 100 Mbps to 1 Gbps, but students and staff immediately complained that Zoom calls and IP telephony suffered severe robotic audio distortion and dropouts whenever large CAD files were uploaded.",
          analysis: "A 1 Gbps link still experiences micro-burst congestion when multiple large file transfers execute simultaneously. Without DiffServ QoS, standard First-In-First-Out (FIFO) queue buffers fill completely. Voice packets are forced to wait behind 1,500-byte data packets in switch buffers (inducing bufferbloat and jitter > 80ms) or get dropped when buffers overflow. Implementing Low Latency Queuing (LLQ) with DSCP EF guarantees voice packets are serviced immediately, restoring clear audio regardless of background file transfers."
        },
        {
          title: "Rogue Router ARP Poisoning in Student Dormitory",
          conceptIllustrated: "Vulnerability of Unprotected Layer 2 Networks Without DHCP Snooping & DAI",
          scenario: "A student plugs a personal home Wi-Fi router into an Ethernet wall jack in the dormitory, intending to share wireless internet with roommates. Within 5 minutes, 80 students in the building lose internet access, and their credentials are intermittently harvested.",
          analysis: "The home router’s default DHCP server began responding to local DHCP Discover broadcasts with faster response times than the university’s centralized server, handing out itself as the default gateway (192.168.1.1). Furthermore, malicious ARP replies redirected traffic to the student device. Deploying DHCP Snooping stops the rogue router from answering on untrusted ports, while Dynamic ARP Inspection immediately drops spoofed ARP broadcasts, neutralizing the incident instantly."
        }
      ],
      commonConfusions: [
        {
          conceptA: "Bandwidth",
          conceptB: "Throughput (and Goodput)",
          keyDistinction: "Bandwidth is the theoretical maximum capacity of a transmission medium (e.g. 10 Gbps Ethernet). Throughput is the actual volume of data transferred per unit time factoring in contention, framing overhead, and TCP windowing. Goodput is the net application payload delivered excluding all headers and retransmissions.",
          mnemonicOrRule: "Bandwidth = Highway width; Throughput = Actual cars passing per minute; Goodput = Actual passengers reaching their destination."
        },
        {
          conceptA: "Traffic Policing",
          conceptB: "Traffic Shaping",
          keyDistinction: "Policing enforces a rate limit by immediately dropping (or remarking) packets exceeding the threshold, inducing TCP packet loss. Shaping buffers excess packets in RAM and delays them for smooth transmission, preserving packets at the expense of slight buffer latency.",
          mnemonicOrRule: "Policing = Strict security guard who locks the door when capacity is hit; Shaping = Polite receptionist who has visitors wait in the lobby."
        },
        {
          conceptA: "HSRP",
          conceptB: "GLBP",
          keyDistinction: "HSRP operates in active-standby mode where only one router forwards traffic while the other sits completely idle. GLBP operates in active-active mode where the AVG responds to ARP requests with different virtual MACs, allowing all routers to forward traffic simultaneously.",
          mnemonicOrRule: "HSRP = Spare tire sitting in the trunk; GLBP = All-wheel drive where all four wheels turn simultaneously."
        },
        {
          conceptA: "Stateless Packet Filters (ACL)",
          conceptB: "Stateful Packet Inspection (SPI)",
          keyDistinction: "Stateless ACLs examine each packet in complete isolation against static source/destination rules. Stateful firewalls track TCP 3-way handshakes and connection states in memory, automatically allowing return traffic only for legitimate established connections without opening vulnerable static ports.",
          mnemonicOrRule: "Stateless ACL = Checking ID against a static list; Stateful SPI = Checking if the person was already invited and currently inside the building."
        }
      ],
      examFocusedKnowledge: {
        highYieldFacts: [
          "Five Nines availability (99.999%) allows exactly 5.26 minutes of unplanned downtime per year across 24/7/365 operations.",
          "ITU G.114 standard dictates that one-way voice latency must not exceed 150 ms; jitter must remain below 30 ms; packet loss must not exceed 1%.",
          "OSPF Area 0 (Backbone Area) is mandatory in multi-area topologies; all inter-area traffic must cross Area 0 to prevent routing loops.",
          "In 2.4 GHz Wi-Fi spectrum, only channels 1, 6, and 11 are non-overlapping in standard 20 MHz channel planning."
        ],
        mustKnowRelationships: [
          "A = MTBF / (MTBF + MTTR): Availability is inverse to repair duration; cutting MTTR by 90% improves availability exponentially.",
          "BDP = R × RTT: If TCP window size < BDP, transmitter will stall waiting for acknowledgments, under-utilizing link capacity.",
          "C = B · log₂(1 + S/N): Bandwidth scales capacity linearly; transmission power scales capacity only logarithmically."
        ],
        formulaTriggers: [
          "When an exam question mentions 'downtime per year' or 'five nines', immediately apply Downtime = (1 - A) × 8,766 hours.",
          "When an exam question gives bottleneck link rate and round-trip ping time, immediately calculate BDP = R × RTT to find buffer size.",
          "When an exam question gives bandwidth in Hz and signal-to-noise ratio, immediately invoke Shannon's theorem C = B · log₂(1 + S/N)."
        ]
      },
      finalTakeaways: [
        "Hierarchical three-tier campus design achieves scalability and rapid troubleshooting by enforcing strict separation of duties: Core switches fast, Distribution enforces policy, Access controls the edge.",
        "Default gateway virtualization (HSRP, VRRP, GLBP) eliminates single points of failure at the host layer; modern architectures pair this with routed access for sub-second convergence.",
        "QoS is essential for multimedia convergence; strict priority queuing must be paired with ingress trust boundary classification to protect voice from packet starvation.",
        "Zero-trust Layer 2 security requires the tripartite synergy of DHCP Snooping, Dynamic ARP Inspection, and IP Source Guard to guarantee physical port integrity.",
        "Fundamental mathematical formulations (Shannon's Law, MTBF/MTTR Availability, Bandwidth-Delay Product) dictate physical constraints that no software configuration can bypass."
      ],
      definitions: [
        {
          term: "Goodput",
          definition:
            "The net rate of application-layer useful data successfully delivered to the destination process, strictly excluding lower-layer protocol headers, framing preambles, and retransmitted packets.",
          academicContext: "Transport & Application Layer Efficiency Metric",
        },
        {
          term: "Bandwidth-Delay Product (BDP)",
          definition:
            "The product of a transmission channel's capacity and its round-trip latency (BDP = R × RTT), representing the maximum volume of in-flight unacknowledged data in the network pipe.",
          academicContext: "TCP Flow Control & Buffer Dimensioning",
        },
        {
          term: "Differentiated Services Code Point (DSCP)",
          definition:
            "A 6-bit selector field located within the IPv4 Type of Service (ToS) or IPv6 Traffic Class header that defines per-hop queuing, scheduling, and drop precedence behaviors (RFC 2474).",
          academicContext: "Quality of Service (QoS) Classification",
        },
        {
          term: "Bridge Protocol Data Unit (BPDU)",
          definition:
            "Specialized Layer 2 control frames continuously exchanged between switches executing IEEE 802.1D/w/s spanning tree algorithms to elect the root bridge and maintain loop-free logical forwarding paths.",
          academicContext: "Data Link Layer Convergence Protocols",
        },
        {
          term: "Stateful Packet Inspection (SPI)",
          definition:
            "A security firewall architecture that tracks the state of active bidirectional sessions (TCP 3-way handshake, sequence numbers, ephemeral UDP flows) in a dynamic state table, permitting return traffic only for legitimate established connections.",
          academicContext: "Network Perimeter Defense Architecture",
        },
        {
          term: "Link Aggregation Control Protocol (LACP)",
          definition:
            "The IEEE 802.3ad open-standard protocol that dynamically negotiates and bundles multiple physical Ethernet links into a unified logical EtherChannel with deterministic hash-based load distribution.",
          academicContext: "IEEE 802.3 Physical & Data Link Aggregation",
        },
      ],
      formulasAndRules: [
        {
          title: "Shannon-Hartley Channel Capacity Theorem",
          formula: "C = B \\cdot \\log_2\\left(1 + \\frac{S}{N}\\right)",
          explanation:
            "Defines the fundamental theoretical upper bound on error-free information transmission rate through any physical communication channel afflicted by additive white Gaussian noise (AWGN).",
          variables: [
            { symbol: "C", label: "Theoretical channel capacity (maximum error-free data rate in bits per second, bps)" },
            { symbol: "B", label: "Channel bandwidth in Hertz (Hz)" },
            { symbol: "S", label: "Average received signal power (Watts)" },
            { symbol: "N", label: "Average Gaussian noise power within the specified bandwidth (Watts)" },
            { symbol: "S/N", label: "Signal-to-Noise Ratio (dimensionless linear power ratio)" },
          ],
          implication:
            "Information capacity scales linearly with bandwidth (B), but only logarithmically with signal power (S). In noise-limited channels, increasing transmission power yields diminishing returns compared to acquiring wider spectral bandwidth.",
        },
        {
          title: "System Availability & Mean-Time Mathematical Invariant",
          formula: "A = \\frac{\\text{MTBF}}{\\text{MTBF} + \\text{MTTR}}",
          explanation:
            "Quantifies operational service availability as the mathematical ratio of expected uptime to total operating duration, establishing the engineering benchmarks required to sustain 'Five Nines' (99.999%) enterprise uptime.",
          variables: [
            { symbol: "A", label: "Operational availability fraction (e.g. 0.99999 for 99.999% availability)" },
            { symbol: "MTBF", label: "Mean Time Between Failures (average operating hours between hardware/software faults)" },
            { symbol: "MTTR", label: "Mean Time to Repair (average duration to detect, isolate, replace, and restore service)" },
            { symbol: "Downtime", label: "Annual permissible outage = (1 - A) × 8,766 hours/yr (~5.26 minutes/yr for 99.999%)" },
          ],
          implication:
            "Achieving high availability is predominantly an exercise in minimizing MTTR rather than maximizing MTBF. Automating stateful failover (reducing MTTR from hours to milliseconds) achieves five-nines far more cost-effectively than purchasing custom ultra-reliable hardware.",
        },
        {
          title: "Bandwidth-Delay Product (BDP) & Queue Buffer Invariant",
          formula: "\\text{BDP} = R \\times \\text{RTT}",
          explanation:
            "Measures the exact volume of unacknowledged data in transit across the end-to-end network transmission path under maximum capacity saturation.",
          variables: [
            { symbol: "BDP", label: "Bandwidth-Delay Product (in bits or bytes of in-flight data)" },
            { symbol: "R", label: "Bottleneck link transmission capacity (bits per second, bps)" },
            { symbol: "RTT", label: "Round-Trip Time propagation and serialization delay (seconds)" },
          ],
          implication:
            "TCP sender and receiver socket window buffers must be dimensioned to at least equal BDP. If the TCP window is smaller than BDP, the transmitter will run out of window credits and stall while waiting for ACKs, starving high-capacity links.",
        },
      ],
      studyTips: [
        "Core Simplicity Principle: The campus Core switching backbone must never perform packet inspection, ACL filtering, or address translation. Pushing computational overhead to the Core creates head-of-line blocking and violates wire-speed switching invariants.",
        "Layer 3 Routed Access Architecture: Migrating the Layer 2/3 boundary down to the Access switch eliminates Spanning Tree loops entirely, enabling sub-second convergence (<200ms) with ECMP (Equal-Cost Multi-Pathing) and BFD (Bidirectional Forwarding Detection).",
        "Bufferbloat & Active Queue Management (AQM): Excessive switch packet buffers do not improve throughput; they induce destructive latency jitter. Employing Weighted Random Early Detection (WRED) or CoDel signals congestion before buffer saturation occurs.",
        "Hardware ASIC TCAM Limits: Layer 3 forwarding tables and ACLs are programmed into Ternary Content-Addressable Memory (TCAM). If table size limits are exceeded, packets are punted to the software CPU, inducing immediate throughput collapse.",
      ],
    },
    podcast: {
      title: "Mastering Enterprise Network Design & Requirements",
      hosts: ["Alex (Tutor)", "Jordan (Student)"],
      durationEstimate: "5 min 20 sec",
      dialogue: [
        { id: "pod-net-1", speaker: "Alex (Tutor)", role: "Academic AI Tutor", text: "Jordan, when designing an enterprise campus network, why shouldn't we place ACL filters on the Core switches?", timestampSeconds: 0 },
        { id: "pod-net-2", speaker: "Jordan (Student)", role: "Freshman Engineering Student", text: "Because the Core layer needs to switch packets at maximum wire-speed without CPU overhead. Filtering belongs at the Distribution layer!", timestampSeconds: 16 },
      ],
    },
    weakTopics: ["QoS", "Spanning Tree"],
    progress: {
      overallPct: 0,
      flashcardsMastered: 0,
      quizAccuracyPct: 0,
      writtenTestsCompleted: 0,
      fillBlanksCompleted: 0,
      lastStudiedMode: "overview",
    },
    isFavorite: true,
    isArchived: false,
    isShared: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    lastStudiedAt: new Date().toISOString(),
  },
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
        front: "State Newton's First Law of Motion and explain its physical significance in defining reference frames.",
        back: "An object remains at rest or in uniform straight-line motion unless acted upon by an external net force. Physical Significance: It serves as the operational definition of an inertial reference frame—a frame where Newton's laws hold without introducing fictitious pseudo-forces.",
        topic: "Newton's Laws",
        mastery: "mastered",
        starred: true,
        reviewCount: 4,
        cardType: "concept-to-definition",
        difficulty: "foundational",
      },
      {
        id: "fc-phys-2",
        front: "State the Work-Kinetic Energy Theorem in vector calculus form for a variable force.",
        back: "The net work done on a particle by the vector sum of all external forces along a path equals the exact change in its kinetic energy: W_net = ∫ F_net · dr = ΔK = (1/2)m(v_f² - v_i²). This fundamental theorem holds for both constant and position-dependent forces.",
        topic: "Work & Energy",
        mastery: "familiar",
        starred: false,
        reviewCount: 3,
        cardType: "principle-to-application",
        difficulty: "intermediate",
      },
      {
        id: "fc-phys-3",
        front: "Differentiate between conservative and non-conservative forces using path integrals and potential energy fields.",
        back: "A conservative force has path-independent work: ∮ F · dr = 0, allowing definition of a scalar potential energy field U where F = -∇U (e.g., gravity, ideal spring). A non-conservative force has path-dependent work (∮ F · dr ≠ 0) that dissipates mechanical energy into thermal energy (e.g., friction, air resistance).",
        topic: "Conservative Forces",
        mastery: "learning",
        starred: true,
        reviewCount: 2,
        cardType: "comparison",
        difficulty: "intermediate",
      },
      {
        id: "fc-phys-4",
        front: "What is the condition for static friction versus kinetic friction on an inclined plane?",
        back: "Static friction matches the applied parallel force up to its threshold: f_s <= μ_s * N = μ_s * m*g*cos(θ). Once the tangential component m*g*sin(θ) exceeds f_s_max, the block accelerates down the incline under kinetic friction: f_k = μ_k * N = μ_k * m*g*cos(θ), where μ_k < μ_s.",
        topic: "Friction & Dynamics",
        mastery: "learning",
        starred: false,
        reviewCount: 2,
        cardType: "principle-to-application",
        difficulty: "intermediate",
      },
      {
        id: "fc-phys-5",
        front: "Define centripetal acceleration and derive its magnitude from uniform circular motion vectors.",
        back: "In uniform circular motion with constant speed v and radius r, the acceleration vector is strictly perpendicular to the tangential velocity vector and points radially inward: a_c = v² / r = ω² * r. It continuously redirects the velocity vector without altering kinetic energy.",
        topic: "Circular Motion",
        mastery: "unfamiliar",
        starred: false,
        reviewCount: 1,
        cardType: "definition-to-concept",
        difficulty: "foundational",
      },
      {
        id: "fc-phys-6",
        front: "Why does the normal reaction force perform zero work when an object slides along a flat horizontal surface?",
        back: "Work is the scalar dot product W = ∫ F · dr = |F||dr| cos(θ). The normal force is directed vertically upward (90° relative to horizontal displacement), and cos(90°) = 0. Therefore, the normal force performs strictly zero work.",
        topic: "Work & Energy",
        mastery: "mastered",
        starred: false,
        reviewCount: 3,
        cardType: "cause-to-effect",
        difficulty: "foundational",
      },
      {
        id: "fc-phys-7",
        front: "What is the physical condition under which the total linear momentum of a multi-body system is strictly conserved?",
        back: "Linear momentum is conserved (dP_total/dt = 0 => P_total = constant) if and only if the vector sum of all external forces acting on the system is zero (Σ F_ext = 0). Internal interaction forces cancel out in pairs by Newton's Third Law.",
        topic: "Momentum",
        mastery: "familiar",
        starred: false,
        reviewCount: 2,
        cardType: "principle-to-application",
        difficulty: "intermediate",
      },
      {
        id: "fc-phys-8",
        front: "Contrast an elastic collision with a completely inelastic collision in terms of conserved quantities.",
        back: "In both collisions, total linear momentum is conserved (assuming no external net force). In an elastic collision, total mechanical kinetic energy is also conserved (e = 1). In a completely inelastic collision, the bodies stick together post-collision (e = 0), and maximum kinetic energy is dissipated into thermal and acoustic energy.",
        topic: "Collisions",
        mastery: "learning",
        starred: true,
        reviewCount: 2,
        cardType: "comparison",
        difficulty: "intermediate",
      },
      {
        id: "fc-phys-9",
        front: "Define torque and state its rotational relationship with angular momentum.",
        back: "Torque is the vector cross product of position vector r and applied force F: τ = r × F = |r||F| sin(θ) n̂. According to rotational dynamics, net external torque equals the time rate of change of angular momentum: Σ τ_ext = dL/dt = I * α.",
        topic: "Rotational Dynamics",
        mastery: "unfamiliar",
        starred: false,
        reviewCount: 1,
        cardType: "formula",
        difficulty: "advanced",
      },
      {
        id: "fc-phys-10",
        front: "State the equation of motion for a simple harmonic oscillator (mass on an ideal Hooke's Law spring) and give its period.",
        back: "From F = -kx = m(d²x/dt²), the differential equation is d²x/dt² + (k/m)x = 0 with angular frequency ω = √(k/m). The oscillation period is T = 2π / ω = 2π √(m/k), completely independent of oscillation amplitude.",
        topic: "Harmonic Motion",
        mastery: "learning",
        starred: false,
        reviewCount: 2,
        cardType: "process-to-step",
        difficulty: "intermediate",
      },
      {
        id: "fc-phys-11",
        front: "State the First Law of Thermodynamics and write its sign convention equation.",
        back: "The change in internal energy of a closed system equals the heat added to the system minus the work done by the system: ΔU = Q - W. (If W is defined as work done on the system, ΔU = Q + W). Internal energy U is a state function independent of path.",
        topic: "Thermodynamics",
        mastery: "familiar",
        starred: false,
        reviewCount: 2,
        cardType: "principle-to-application",
        difficulty: "intermediate",
      },
      {
        id: "fc-phys-12",
        front: "What is the maximum theoretical efficiency of any heat engine operating between hot reservoir T_H and cold reservoir T_C?",
        back: "Carnot Efficiency η_max = 1 - (T_C / T_H), where temperatures MUST be in Kelvin (absolute scale). No real heat engine operating between two thermal reservoirs can exceed this thermodynamic limit dictated by the Second Law.",
        topic: "Thermodynamics",
        mastery: "mastered",
        starred: true,
        reviewCount: 3,
        cardType: "formula",
        difficulty: "advanced",
      },
      {
        id: "fc-phys-13",
        front: "State Archimedes' Principle and the mathematical formula for buoyant force.",
        back: "Any body completely or partially submerged in a fluid experiences an upward buoyant force equal to the weight of the fluid displaced by the body: F_b = ρ_fluid * V_submerged * g. The force acts through the center of buoyancy.",
        topic: "Fluid Mechanics",
        mastery: "familiar",
        starred: false,
        reviewCount: 2,
        cardType: "definition-to-concept",
        difficulty: "foundational",
      },
      {
        id: "fc-phys-14",
        front: "Why does the vertical velocity of a projectile equal zero at maximum height, while its acceleration remains non-zero?",
        back: "At the peak of projectile flight, the vertical velocity component reverses sign from upward to downward, instantaneously crossing v_y = 0 m/s. However, gravity continuously exerts a downward force F_g = mg, so acceleration remains constant at a_y = -9.8 m/s² directed toward Earth's center.",
        topic: "Kinematics",
        mastery: "mastered",
        starred: false,
        reviewCount: 4,
        cardType: "cause-to-effect",
        difficulty: "foundational",
      },
      {
        id: "fc-phys-15",
        front: "Explain the difference between scalar dot product and vector cross product in physical work and torque calculations.",
        back: "Dot Product (A · B = |A||B| cos θ) yields a scalar and measures parallel alignment (used in Work W = F · dr). Cross Product (A × B = |A||B| sin θ n̂) yields a vector perpendicular to both operands and measures rotational leverage (used in Torque τ = r × F and Angular Momentum L = r × p).",
        topic: "Vector Calculus",
        mastery: "familiar",
        starred: false,
        reviewCount: 3,
        cardType: "comparison",
        difficulty: "intermediate",
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
        questionType: "application",
        conceptTested: "Conservation of Mechanical Energy",
        recommendedSection: "Unit 2.0: Work-Kinetic Energy Principle",
        distractorRationale: [
          "Distractor: 7.0 m/s arises from forgetting the factor of 2 in √(2gh).",
          "Correct answer: v = √(2 * 9.8 * 5) = 9.9 m/s.",
          "Distractor: 14.0 m/s arises from using h / sin(30) = 10 as height instead of vertical h.",
          "Distractor: 4.9 m/s is half of 9.8 m/s without square root calculation.",
        ],
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
          "Kinetic sliding friction dissipates mechanical energy into thermal energy and its work is path-dependent (∮ F_k · dr ≠ 0). The other three forces are conservative fields derivable from potential energy scalar fields.",
        topic: "Conservative Forces",
        difficulty: "easy",
        questionType: "conceptual-reasoning",
        conceptTested: "Conservative vs Dissipative Forces",
        recommendedSection: "Unit 2.0: Conservative Force Field",
        distractorRationale: [
          "Distractor: Electrostatic force is conservative (derivable from electric potential).",
          "Distractor: Spring restoring force is conservative (U = 1/2 k x²).",
          "Correct answer: Kinetic friction is dissipative and path-dependent.",
          "Distractor: Gravitational force is conservative (U = mgh).",
        ],
      },
      {
        id: "qz-phys-3",
        question:
          "An object moves in a circular path of radius 4 m at a constant speed of 8 m/s. What is the magnitude of its centripetal acceleration?",
        options: ["2 m/s²", "16 m/s²", "32 m/s²", "64 m/s²"],
        correctIndex: 1,
        explanation:
          "Centripetal acceleration is a_c = v² / r = (8 m/s)² / 4 m = 64 / 4 = 16 m/s² directed radially inward toward the center of curvature.",
        topic: "Circular Motion",
        difficulty: "easy",
        questionType: "application",
        conceptTested: "Centripetal Acceleration Formulation",
        recommendedSection: "Unit 2.0: Centripetal Acceleration",
        distractorRationale: [
          "Distractor: 2 m/s² is v / r instead of v² / r.",
          "Correct answer: a_c = 64 / 4 = 16 m/s².",
          "Distractor: 32 m/s² arises from multiplying 8 * 4.",
          "Distractor: 64 m/s² is v² without dividing by radius r.",
        ],
      },
      {
        id: "qz-phys-4",
        question:
          "Two vectors A and B have magnitudes |A|=3 and |B|=4. If their scalar dot product A · B = 0, what is the magnitude of their vector cross product |A × B|?",
        options: ["0", "7", "12", "1"],
        correctIndex: 2,
        explanation:
          "Since A · B = |A||B| cos(θ) = 0, the angle between them is θ = 90° (perpendicular). Therefore |A × B| = |A||B| sin(90°) = 3 * 4 * 1 = 12.",
        topic: "Vector Calculus",
        difficulty: "medium",
        questionType: "application",
        conceptTested: "Orthogonal Vector Products",
        recommendedSection: "Unit 1.0: Vector Operations",
        distractorRationale: [
          "Distractor: 0 assumes cross product is also zero (confusing sin 90 with cos 90).",
          "Distractor: 7 is vector addition |A| + |B|.",
          "Correct answer: |A × B| = 3 * 4 * sin(90°) = 12.",
          "Distractor: 1 is unit vector magnitude.",
        ],
      },
      {
        id: "qz-phys-5",
        question:
          "A passenger standing in an accelerating bus feels pushed backward. This apparent force is classified as a:",
        options: [
          "True gravitational force",
          "Action-reaction pair according to Newton's 3rd Law",
          "Fictitious (inertial) pseudo-force observed in a non-inertial frame",
          "Centripetal force",
        ],
        correctIndex: 2,
        explanation:
          "In an accelerating (non-inertial) frame of reference, fictitious or pseudo-forces appear because the reference frame itself is accelerating with a_frame, requiring F_pseudo = -m*a_frame to explain kinematics without a real physical agent.",
        topic: "Newton's Laws",
        difficulty: "hard",
        questionType: "conceptual-reasoning",
        conceptTested: "Inertial vs Non-Inertial Frames",
        recommendedSection: "Unit 2.0: Inertial Reference Frame",
        distractorRationale: [
          "Distractor: Gravity acts downward toward the center of the earth, not horizontally backward.",
          "Distractor: Newton's 3rd law applies only to real physical interaction pairs between two objects.",
          "Correct answer: It is an inertial pseudo-force resulting from coordinate frame acceleration.",
          "Distractor: Centripetal force acts towards the center in circular motion.",
        ],
      },
      {
        id: "qz-phys-6",
        question:
          "An ideal spring with spring constant k = 200 N/m is compressed by x = 0.1 m from equilibrium. What is the elastic potential energy stored in the spring?",
        options: ["1.0 J", "2.0 J", "10 J", "20 J"],
        correctIndex: 0,
        explanation:
          "Elastic potential energy is U_s = (1/2) * k * x² = 0.5 * 200 N/m * (0.1 m)² = 100 * 0.01 = 1.0 Joule.",
        topic: "Work & Energy",
        difficulty: "medium",
        questionType: "application",
        conceptTested: "Hooke's Law Elastic Potential Energy",
        recommendedSection: "Unit 2.0: Work-Kinetic Energy Principle",
        distractorRationale: [
          "Correct answer: U = 0.5 * 200 * 0.01 = 1.0 J.",
          "Distractor: 2.0 J forgot to divide by 2 (k * x²).",
          "Distractor: 10 J used (1/2) k x instead of x².",
          "Distractor: 20 J multiplied k * x.",
        ],
      },
      {
        id: "qz-phys-7",
        question:
          "A projectile is launched from ground level with speed v0 at an angle of 30° above the horizontal. At the highest point of its trajectory, what are its velocity and acceleration vectors?",
        options: [
          "Velocity is v0 cos(30°) horizontally; acceleration is g directed downward.",
          "Both velocity and acceleration are strictly zero.",
          "Velocity is zero; acceleration is g directed downward.",
          "Velocity is v0 sin(30°) vertically; acceleration is zero.",
        ],
        correctIndex: 0,
        explanation:
          "Throughout projectile motion (neglecting air drag), the horizontal velocity remains constant at v_x = v0 cos(30°). At the apex, v_y = 0 m/s, so net velocity is purely horizontal (v0 cos 30°). The gravitational acceleration vector remains constant at g downward.",
        topic: "Kinematics",
        difficulty: "medium",
        questionType: "conceptual-reasoning",
        conceptTested: "Projectile Apex Kinematics",
        recommendedSection: "Unit 1.0: 2D Kinematics",
        distractorRationale: [
          "Correct answer: Horizontal velocity is preserved; gravity remains g downward.",
          "Distractor: Velocity is not zero because horizontal component v0 cos 30° persists.",
          "Distractor: Classic exam trap assuming total velocity is zero at the peak.",
          "Distractor: Vertical velocity at the apex is 0, not v0 sin 30°.",
        ],
      },
      {
        id: "qz-phys-8",
        question:
          "Two identical gliders of mass m collide on a frictionless air track. Glider 1 moves at speed v toward stationary Glider 2. They stick together upon collision. What is their combined final speed, and what percentage of initial kinetic energy is lost?",
        options: [
          "Final speed is v/2; 50% of kinetic energy is lost.",
          "Final speed is v; 0% of kinetic energy is lost.",
          "Final speed is v/4; 75% of kinetic energy is lost.",
          "Final speed is v/2; 0% of kinetic energy is lost.",
        ],
        correctIndex: 0,
        explanation:
          "By momentum conservation: m*v + 0 = (2m)*v_f => v_f = v/2. Initial K_i = (1/2)m v². Final K_f = (1/2)(2m)(v/2)² = (1/4)m v² = (1/2) K_i. Exactly 50% of initial kinetic energy is converted into thermal/deformation energy.",
        topic: "Collisions",
        difficulty: "hard",
        questionType: "application",
        conceptTested: "Completely Inelastic Collision Energy Loss",
        recommendedSection: "Conservation of Linear Momentum",
        distractorRationale: [
          "Correct answer: Momentum dictates v_f = v/2, yielding 50% kinetic energy loss.",
          "Distractor: Assumes an elastic collision without sticking.",
          "Distractor: Arithmetic error in kinetic energy fraction.",
          "Distractor: Violates thermodynamics; completely inelastic collisions must dissipate kinetic energy.",
        ],
      },
      {
        id: "qz-phys-9",
        question:
          "A figure skater spins on frictionless ice with arms outstretched. When she pulls her arms inward close to her chest, her moment of inertia decreases by half (I_new = 0.5 * I_old). What happens to her angular velocity ω and rotational kinetic energy K_rot?",
        options: [
          "Angular velocity doubles (ω_new = 2 * ω_old); rotational kinetic energy doubles.",
          "Angular velocity remains constant; rotational kinetic energy halves.",
          "Angular velocity halves; rotational kinetic energy remains constant.",
          "Angular velocity quadruples; rotational kinetic energy quadruples.",
        ],
        correctIndex: 0,
        explanation:
          "With zero external torque, angular momentum is conserved: L = I * ω = constant. If I halves, ω must double: ω_new = 2 * ω_old. Rotational kinetic energy K = (1/2) I ω² = L² / (2I). When I is halved, K doubles (the extra energy comes from internal muscular work pulling the arms inward).",
        topic: "Rotational Dynamics",
        difficulty: "hard",
        questionType: "application",
        conceptTested: "Conservation of Angular Momentum & Work",
        recommendedSection: "Rotational Mechanics",
        distractorRationale: [
          "Correct answer: L is conserved so ω doubles; K = L²/(2I) doubles from internal muscular work.",
          "Distractor: Assumes angular velocity is independent of moment of inertia.",
          "Distractor: Inverts the conservation relationship.",
          "Distractor: Quadrupling ω would violate angular momentum conservation.",
        ],
      },
      {
        id: "qz-phys-10",
        question:
          "A reversible Carnot heat engine operates between a hot reservoir at 600 K and a cold reservoir at 300 K. If it absorbs 1200 J of heat from the hot reservoir per cycle, how much mechanical work does it deliver?",
        options: ["600 J", "300 J", "900 J", "1200 J"],
        correctIndex: 0,
        explanation:
          "Carnot efficiency η = 1 - (T_C / T_H) = 1 - (300 / 600) = 1 - 0.5 = 0.5 (50%). Work W = η * Q_H = 0.5 * 1200 J = 600 Joules.",
        topic: "Thermodynamics",
        difficulty: "medium",
        questionType: "application",
        conceptTested: "Carnot Engine Thermal Efficiency",
        recommendedSection: "Second Law of Thermodynamics",
        distractorRationale: [
          "Correct answer: η = 50%, W = 0.5 * 1200 J = 600 J.",
          "Distractor: 300 J corresponds to 25% efficiency.",
          "Distractor: 900 J corresponds to 75% efficiency.",
          "Distractor: 1200 J implies 100% efficiency, violating the Second Law of Thermodynamics.",
        ],
      },
      {
        id: "qz-phys-11",
        question:
          "During an adiabatic expansion of an ideal gas, no heat enters or leaves the system (Q = 0). According to the First Law of Thermodynamics, what happens to the internal energy and temperature of the gas?",
        options: [
          "Internal energy decreases (ΔU = -W < 0) and gas temperature drops.",
          "Internal energy increases and gas temperature rises.",
          "Internal energy remains constant because Q = 0.",
          "Temperature remains constant because an adiabatic process is isothermal.",
        ],
        correctIndex: 0,
        explanation:
          "First Law: ΔU = Q - W. Since Q = 0, ΔU = -W. During expansion, the gas does positive work on the surroundings (W > 0), so ΔU is negative. Because internal energy of an ideal gas is directly proportional to temperature (U = n C_v T), the temperature must drop.",
        topic: "Thermodynamics",
        difficulty: "hard",
        questionType: "conceptual-reasoning",
        conceptTested: "First Law of Thermodynamics in Adiabatic Processes",
        recommendedSection: "Unit 2.0: Work-Kinetic Energy Principle",
        distractorRationale: [
          "Correct answer: ΔU = -W, work done by gas consumes internal energy, lowering temperature.",
          "Distractor: Internal energy rises only during adiabatic compression, not expansion.",
          "Distractor: Confuses internal energy with heat; Q = 0 does not mean ΔU = 0.",
          "Distractor: Adiabatic (Q = 0) is distinct from isothermal (ΔT = 0).",
        ],
      },
      {
        id: "qz-phys-12",
        question:
          "A solid block of wood of density ρ_wood = 600 kg/m³ floats in water (ρ_water = 1000 kg/m³). What fraction of the block's total volume is submerged beneath the water surface?",
        options: ["60% (0.60)", "40% (0.40)", "100% (1.00)", "6% (0.06)"],
        correctIndex: 0,
        explanation:
          "In static floating equilibrium, buoyant force equals gravitational weight: F_b = F_g => ρ_water * V_sub * g = ρ_wood * V_total * g => V_sub / V_total = ρ_wood / ρ_water = 600 / 1000 = 0.60 (60%).",
        topic: "Fluid Mechanics",
        difficulty: "medium",
        questionType: "application",
        conceptTested: "Archimedes Floating Fraction Principle",
        recommendedSection: "Archimedes' Principle",
        distractorRationale: [
          "Correct answer: Fraction submerged = 600 / 1000 = 60%.",
          "Distractor: 40% is the fraction exposed above the water, not submerged.",
          "Distractor: 100% would occur if density equaled or exceeded water density.",
          "Distractor: Off by a factor of 10 decimal error.",
        ],
      },
    ],
    writtenTests: [
      {
        id: "wt-phys-1",
        prompt:
          "State Newton's Third Law of Motion. Explain why the action and reaction forces do NOT cancel each other out, giving a concrete physical example with a free-body diagram explanation.",
        modelAnswer:
          "Newton's Third Law states that whenever body A exerts a force on body B, body B simultaneously exerts an equal and opposite force on body A: F_AB = -F_BA.\nAction and reaction forces never cancel each other because they act on TWO DISTINCT physical bodies. In a Free-Body Diagram (FBD), you draw forces acting ON a single chosen system.\nConcrete Example: When a swimmer pushes back against the pool wall with force F_swimmer_on_wall, the wall simultaneously pushes forward on the swimmer with force F_wall_on_swimmer. In the swimmer's FBD, only F_wall_on_swimmer appears, producing an uncancelled net forward force that accelerates the swimmer through the water.",
        keyRubricPoints: [
          "States equal magnitude and opposite direction in vector form (F_AB = -F_BA)",
          "Explicitly emphasizes that forces act on two separate, distinct objects",
          "Explains why single-object Free-Body Diagrams do not contain both forces",
          "Provides a valid physical example (e.g. swimmer, walking, rocket propulsion)",
        ],
        topic: "Newton's Laws",
        marks: 10,
        difficulty: "foundational",
        actionVerb: "explain",
        expectedAnswerPoints: [
          "Formal definition of Newton's Third Law",
          "Clarification that action-reaction pairs act on different bodies",
          "FBD principle: only forces acting ON the object are summed",
          "Realistic physical scenario illustrating forward acceleration",
        ],
        gradingRubric: [
          { criterion: "Law Definition", maxMarks: 2, description: "Correct vector formulation and opposite direction statement" },
          { criterion: "Distinct Body Isolation", maxMarks: 3, description: "Clear explanation that forces act on separate entities" },
          { criterion: "FBD Analysis", maxMarks: 3, description: "Explains net force summation on a single body" },
          { criterion: "Concrete Example", maxMarks: 2, description: "Physical example with correct identification of force pairs" },
        ],
      },
      {
        id: "wt-phys-2",
        prompt:
          "Explain the difference between a conservative force and a non-conservative force. State the mathematical condition for a force field to be conservative in closed path integration, and explain why a potential energy scalar field cannot be defined for friction.",
        modelAnswer:
          "A conservative force is one where the work done moving a particle between two points is completely independent of the path taken, depending solely on the start and endpoints. For a conservative force, mechanical energy is conserved, and work along any closed loop is zero: ∮ F · dr = 0, or curl(F) = ∇ × F = 0. This path independence permits the definition of a scalar potential energy function U such that F = -∇U and W_c = -ΔU.\nIn contrast, a non-conservative force (such as friction or air resistance) has path-dependent work that dissipates mechanical energy into thermal energy. Because the work done along a closed loop is strictly non-zero (∮ F_k · dr = -f_k * TotalPathLength < 0), the change in energy depends on the history of the path. Consequently, no single-valued potential energy function U(r) can be mathematically defined for frictional forces.",
        keyRubricPoints: [
          "Defines path independence for conservative forces",
          "States closed contour integral condition ∮ F · dr = 0",
          "Explains potential energy relation F = -∇U",
          "Explains why path-dependent thermal dissipation prevents scalar potential definition for friction",
        ],
        topic: "Conservative Forces",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "explain",
        expectedAnswerPoints: [
          "Conservative force: path independence and energy conservation",
          "Closed contour integral ∮ F · dr = 0 and curl(F) = 0",
          "Potential energy definition W = -ΔU",
          "Non-conservative force: path-dependent thermal dissipation and breakdown of potential field",
        ],
        gradingRubric: [
          { criterion: "Conservative Force Definition", maxMarks: 3, description: "Defines path independence and energy conservation" },
          { criterion: "Mathematical Line Integral Condition", maxMarks: 3, description: "States ∮ F · dr = 0 and curl condition" },
          { criterion: "Potential Energy Field Derivation", maxMarks: 2, description: "Connects conservative force to F = -∇U" },
          { criterion: "Non-Conservative Dissipation Analysis", maxMarks: 2, description: "Explains why friction work cannot be represented as a state function" },
        ],
      },
      {
        id: "wt-phys-3",
        prompt:
          "Derive the Work-Kinetic Energy Theorem from Newton's Second Law for a one-dimensional variable force F(x). State the key calculus transformation used in the derivation.",
        modelAnswer:
          "Starting from Newton's Second Law: F_net = m * a = m * (dv/dt).\nWork done by a variable force moving a particle from position x1 to x2 is defined as: W_net = ∫[x1 to x2] F_net dx = ∫[x1 to x2] m (dv/dt) dx.\nUsing the chain rule transformation: dx/dt = v, so dx = v dt, or alternatively (dv/dt) dx = dv (dx/dt) = v dv.\nSubstituting into the work integral:\nW_net = ∫[v_i to v_f] m * v dv = m ∫[v_i to v_f] v dv = m [ (1/2) v² ]_{v_i}^{v_f} = (1/2) m v_f² - (1/2) m v_i² = K_f - K_i = ΔK.\nThus, the net work performed on the particle by all external forces is identically equal to the change in its kinetic energy: W_net = ΔK.",
        keyRubricPoints: [
          "Begins with Newton's second law F = m(dv/dt)",
          "Applies calculus chain rule substitution (dv/dt) dx = v dv",
          "Executes definite integration of v dv to obtain (1/2) v²",
          "Concludes with final relation W_net = ΔK",
        ],
        topic: "Work & Energy",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "apply",
        expectedAnswerPoints: [
          "F_net = m dv/dt definition",
          "Work integral definition W = ∫ F dx",
          "Differential chain rule substitution dx = v dt or a dx = v dv",
          "Definite integration yielding 1/2 m v_f² - 1/2 m v_i²",
        ],
        gradingRubric: [
          { criterion: "Starting Postulates", maxMarks: 2, description: "Sets up Newton's second law and work integral correctly" },
          { criterion: "Chain Rule Calculus Step", maxMarks: 3, description: "Accurately applies a dx = v dv transformation" },
          { criterion: "Integration Execution", maxMarks: 3, description: "Evaluates definite integral limits from v_i to v_f" },
          { criterion: "Final Theoretical Conclusion", maxMarks: 2, description: "Clearly states the physical implication W_net = ΔK" },
        ],
      },
      {
        id: "wt-phys-4",
        prompt:
          "Analyze 2D projectile motion launched at angle θ with initial velocity v0. Derive the mathematical expressions for: (a) Time of flight to ground, (b) Maximum height H, and (c) Horizontal Range R (assuming launch and landing at same elevation).",
        modelAnswer:
          "Decompose initial velocity into rectangular components: v_0x = v0 cos θ, v_0y = v0 sin θ.\nAcceleration: a_x = 0, a_y = -g.\n(a) Time of flight: Set vertical displacement y(t) = (v0 sin θ)t - (1/2)gt² = 0 => t [v0 sin θ - (1/2)gt] = 0. Total time of flight T = (2 v0 sin θ) / g.\n(b) Maximum height H: At apex, v_y = 0. Using v_y² = (v0 sin θ)² - 2gH = 0 => H = (v0² sin² θ) / (2g).\n(c) Horizontal Range R: Since a_x = 0, range is R = v_0x * T = (v0 cos θ) * (2 v0 sin θ / g) = (v0² / g) * (2 sin θ cos θ). Using the trigonometric identity 2 sin θ cos θ = sin(2θ), we obtain R = (v0² sin 2θ) / g. Range is maximized at θ = 45° where sin(2θ) = 1.",
        keyRubricPoints: [
          "Decomposes initial velocity into v0 cos θ and v0 sin θ",
          "Derives total time of flight T = 2 v0 sin θ / g",
          "Derives maximum height H = v0² sin² θ / (2g)",
          "Derives horizontal range R = (v0² sin 2θ) / g using trig identity",
        ],
        topic: "Kinematics",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "analyze",
        expectedAnswerPoints: [
          "Independent component equations: x(t) and y(t)",
          "Time of flight derivation from y(T) = 0",
          "Maximum height derivation from v_y = 0",
          "Range formula derivation using 2 sin θ cos θ = sin 2θ",
        ],
        gradingRubric: [
          { criterion: "Component Decomposition", maxMarks: 2, description: "Correct separation of horizontal and vertical motions" },
          { criterion: "Time of Flight Derivation", maxMarks: 2, description: "Calculates T = 2 v0 sin θ / g" },
          { criterion: "Maximum Height Derivation", maxMarks: 3, description: "Calculates H = v0² sin² θ / (2g)" },
          { criterion: "Range Derivation & Identity", maxMarks: 3, description: "Derives R = (v0² sin 2θ) / g and notes 45° optimum" },
        ],
      },
      {
        id: "wt-phys-5",
        prompt:
          "Formulate the principle of conservation of linear momentum for an isolated two-body system. Contrast the mechanical energy outcomes in an elastic collision versus a completely inelastic collision.",
        modelAnswer:
          "Conservation Principle: For an isolated two-body system where net external force Σ F_ext = 0, Newton's Third Law ensures internal forces cancel in pairs: F_12 = -F_21 => dp_1/dt + dp_2/dt = d(p_1 + p_2)/dt = 0. Therefore, total vector momentum is conserved: m1 v1_i + m2 v2_i = m1 v1_f + m2 v2_f.\nElastic Collision: Both total linear momentum and total mechanical kinetic energy are conserved: (1/2)m1 v1_i² + (1/2)m2 v2_i² = (1/2)m1 v1_f² + (1/2)m2 v2_f². Coefficient of restitution e = 1.\nCompletely Inelastic Collision: Total linear momentum is conserved, but the bodies stick together and move with a single common final velocity v_f = (m1 v1_i + m2 v2_i) / (m1 + m2). Mechanical kinetic energy is NOT conserved; the maximum possible fraction of initial kinetic energy is converted into non-recoverable internal thermal, acoustic, and plastic deformation energy (e = 0).",
        keyRubricPoints: [
          "Proves linear momentum conservation from Newton's Third Law (internal force cancellation)",
          "States mathematical momentum conservation equation",
          "Defines elastic collision with both momentum and kinetic energy conservation",
          "Defines completely inelastic collision where bodies stick and maximum kinetic energy is dissipated",
        ],
        topic: "Collisions",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "compare",
        expectedAnswerPoints: [
          "Derivation of momentum conservation from Newton's Third Law",
          "Vector momentum conservation equation",
          "Elastic collision: conservation of both momentum and kinetic energy",
          "Completely inelastic collision: common velocity and kinetic energy dissipation",
        ],
        gradingRubric: [
          { criterion: "Momentum Conservation Principle", maxMarks: 3, description: "Derives momentum conservation from Newton's Third Law" },
          { criterion: "Elastic Collision Mechanics", maxMarks: 3, description: "Explains simultaneous momentum and kinetic energy conservation" },
          { criterion: "Inelastic Collision Energy Loss", maxMarks: 3, description: "Analyzes common final velocity and thermal dissipation" },
          { criterion: "Clarity & Terminology", maxMarks: 1, description: "Formal physics terminology and units" },
        ],
      },
      {
        id: "wt-phys-6",
        prompt:
          "Differentiate between Uniform Circular Motion (UCM) and Non-Uniform Circular Motion. Define tangential acceleration and centripetal radial acceleration, and write the formula for total net acceleration.",
        modelAnswer:
          "Uniform Circular Motion (UCM): An object traverses a circular path of radius r at constant speed v. Because speed is constant, the rate of change of speed (tangential acceleration) is strictly zero: a_t = dv/dt = 0. However, the velocity direction changes continuously, producing a pure centripetal radial acceleration directed toward the center: a_r = a_c = v² / r = ω² * r.\nNon-Uniform Circular Motion: An object moves in a circular path where both speed and direction vary simultaneously (such as a roller coaster in a vertical loop).\nTangential Acceleration a_t: Acts tangent to the trajectory, changing the speed magnitude: a_t = dv/dt = r * α (where α is angular acceleration).\nRadial Acceleration a_r: Acts perpendicular to velocity toward the center, changing velocity direction: a_r = v(t)² / r.\nTotal Net Acceleration: Because a_t and a_r are orthogonal vectors, the total acceleration vector is a_net = a_t θ̂ + a_r (-r̂), with magnitude: |a_net| = √(a_t² + a_r²).",
        keyRubricPoints: [
          "Contrasts constant speed in UCM with variable speed in non-uniform circular motion",
          "Defines tangential acceleration a_t = dv/dt = r α",
          "Defines radial centripetal acceleration a_r = v² / r",
          "Derives total net acceleration vector magnitude |a_net| = √(a_t² + a_r²)",
        ],
        topic: "Circular Motion",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "differentiate",
        expectedAnswerPoints: [
          "UCM: a_t = 0, a_r = v²/r directed inward",
          "Non-uniform: both a_t and a_r are non-zero",
          "Tangential acceleration alters speed magnitude; radial alters direction",
          "Orthogonal vector Pythagorean summation: |a| = √(a_t² + a_r²)",
        ],
        gradingRubric: [
          { criterion: "UCM vs Non-Uniform Concepts", maxMarks: 2, description: "Defines constant speed vs changing speed kinematics" },
          { criterion: "Tangential Acceleration Analysis", maxMarks: 3, description: "Explains speed magnitude alteration: a_t = dv/dt = r α" },
          { criterion: "Radial Centripetal Acceleration", maxMarks: 3, description: "Explains direction redirection: a_r = v²/r" },
          { criterion: "Total Acceleration Synthesis", maxMarks: 2, description: "Calculates net acceleration vector |a| = √(a_t² + a_r²)" },
        ],
      },
      {
        id: "wt-phys-7",
        prompt:
          "Analyze Simple Harmonic Motion (SHM) for a block of mass m attached to an ideal horizontal spring of stiffness k. Derive the differential equation of motion, express its angular frequency ω, and describe the continuous energy exchange between kinetic and elastic potential energy.",
        modelAnswer:
          "1. Equation of Motion: By Hooke's Law, the restoring force is F = -kx. By Newton's Second Law, Σ F = m * a = m (d²x/dt²). Equating them gives: m (d²x/dt²) = -kx => d²x/dt² + (k/m)x = 0.\n2. Solution & Frequency: This is the canonical linear differential equation of SHM. Its general solution is x(t) = A cos(ωt + φ), where the angular frequency is ω = √(k/m). The period of oscillation is T = 2π √(m/k) and frequency f = (1 / 2π) √(k/m).\n3. Energy Conservation & Exchange: Mechanical energy is conserved (E = K + U_s = constant):\n- At maximum displacement (x = ±A): Velocity is zero (v = 0), so kinetic energy K = 0. Potential energy is at its peak: E = U_max = (1/2) k A².\n- At equilibrium position (x = 0): Potential energy is zero (U = 0). Kinetic energy is at its peak: E = K_max = (1/2) m v_max² = (1/2) m (ωA)² = (1/2) k A².\n- At any intermediate position x: E = (1/2) m v² + (1/2) k x² = (1/2) k A², showing smooth conservative energy transfer without dissipation.",
        keyRubricPoints: [
          "Sets up differential equation d²x/dt² + (k/m)x = 0 from Hooke's and Newton's laws",
          "Identifies angular frequency ω = √(k/m) and period T = 2π√(m/k)",
          "Describes energy at extrema (K = 0, U = 1/2 k A²)",
          "Describes energy at equilibrium (U = 0, K = 1/2 m v_max²)",
        ],
        topic: "Harmonic Motion",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "analyze",
        expectedAnswerPoints: [
          "Derivation of d²x/dt² + (k/m)x = 0",
          "Angular frequency ω = √(k/m)",
          "Kinetic vs potential energy states at extrema and equilibrium",
          "Total mechanical energy constancy: E = 1/2 k A²",
        ],
        gradingRubric: [
          { criterion: "Differential Equation Setup", maxMarks: 3, description: "Derives governing equation from Hooke's and Newton's laws" },
          { criterion: "Frequency & Period Formulation", maxMarks: 2, description: "Specifies ω = √(k/m) and T = 2π√(m/k)" },
          { criterion: "Energy Exchange Analysis", maxMarks: 3, description: "Explains alternating kinetic and potential states" },
          { criterion: "Conservation Expression", maxMarks: 2, description: "Demonstrates total energy E = (1/2) k A²" },
        ],
      },
      {
        id: "wt-phys-8",
        prompt:
          "Analyze the forces acting on a block of mass m resting on an incline of variable angle θ. Derive the theoretical condition for the 'Angle of Repose' (the maximum angle before the block begins to slip) in terms of the static coefficient of friction μ_s.",
        modelAnswer:
          "Consider a block of mass m on an inclined plane at angle θ with static friction coefficient μ_s.\n1. Set up axes: Choose x-axis parallel down the incline, y-axis perpendicular to the incline.\n2. Resolve gravity into components:\n- Perpendicular to incline: F_gy = m*g*cos θ\n- Parallel down the incline: F_gx = m*g*sin θ\n3. Equilibrium in the perpendicular y-direction (no vertical acceleration a_y = 0):\nΣ F_y = N - m*g*cos θ = 0 => Normal force N = m*g*cos θ.\n4. Static equilibrium in the parallel x-direction:\nStatic friction f_s acts up the incline, opposing gravity: Σ F_x = m*g*sin θ - f_s = 0 => f_s = m*g*sin θ.\n5. Threshold of Impending Motion (Angle of Repose θ_s):\nAt the critical slipping angle, static friction reaches its absolute maximum: f_s_max = μ_s * N = μ_s * m*g*cos θ_s.\nEquating gravitational pull to maximum static friction:\nm*g*sin θ_s = μ_s * m*g*cos θ_s.\nDividing both sides by m*g*cos θ_s:\nsin θ_s / cos θ_s = tan θ_s = μ_s.\nTherefore, the angle of repose is θ_s = arctan(μ_s), which is completely independent of the object's mass and gravitational acceleration g.",
        keyRubricPoints: [
          "Resolves gravity into m*g*sin θ and m*g*cos θ components",
          "Determines normal reaction force N = m*g*cos θ",
          "Sets up static friction limit f_s_max = μ_s * N",
          "Derives angle of repose condition tan θ_s = μ_s and notes mass independence",
        ],
        topic: "Friction & Dynamics",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "analyze",
        expectedAnswerPoints: [
          "Coordinate axis alignment along the incline",
          "Gravity component resolution: parallel and perpendicular",
          "Normal force calculation N = m g cos θ",
          "Equating m g sin θ = μ_s m g cos θ to yield tan θ = μ_s",
        ],
        gradingRubric: [
          { criterion: "Force Resolution", maxMarks: 3, description: "Correct components of gravity and normal force" },
          { criterion: "Equilibrium Equations", maxMarks: 2, description: "States Σ F_x = 0 and Σ F_y = 0" },
          { criterion: "Slipping Condition Derivation", maxMarks: 3, description: "Equates parallel force to μ_s N and simplifies to tan θ = μ_s" },
          { criterion: "Physical Insight", maxMarks: 2, description: "Explains independence from mass and surface area" },
        ],
      },
      {
        id: "wt-phys-9",
        prompt:
          "State the First Law of Thermodynamics. Compare the heat transfer Q, work done W, and internal energy change ΔU for the four canonical ideal gas processes: Isothermal, Isobaric, Isochoric, and Adiabatic.",
        modelAnswer:
          "First Law of Thermodynamics: The change in internal energy of a closed system equals net heat added to the system minus net work performed by the system: ΔU = Q - W. Internal energy of an ideal gas depends solely on temperature: ΔU = n C_v ΔT.\n1. Isothermal Process (Constant T, ΔT = 0):\nBecause temperature is constant, ΔU = 0. By the First Law, Q = W = n R T ln(V_f / V_i). All heat absorbed is completely converted into work output.\n2. Isobaric Process (Constant P):\nWork done is W = P ΔV = n R ΔT. Heat added is Q = n C_p ΔT. Internal energy change is ΔU = n C_v ΔT = Q - W.\n3. Isochoric Process (Constant Volume, ΔV = 0):\nBecause volume is constant, work done is zero: W = ∫ P dV = 0. Therefore, ΔU = Q = n C_v ΔT. All heat added directly increases the gas temperature.\n4. Adiabatic Process (Zero Heat Exchange, Q = 0):\nBecause the system is thermally insulated, Q = 0. Therefore, ΔU = -W. Work done during gas expansion directly decreases internal energy, cooling the gas.",
        keyRubricPoints: [
          "States First Law of Thermodynamics ΔU = Q - W and ideal gas relation ΔU = n C_v ΔT",
          "Isothermal: ΔU = 0, Q = W = nRT ln(V_f/V_i)",
          "Isobaric: W = P ΔV, Q = n C_p ΔT",
          "Isochoric: W = 0, ΔU = Q; Adiabatic: Q = 0, ΔU = -W",
        ],
        topic: "Thermodynamics",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "compare",
        expectedAnswerPoints: [
          "First law statement and sign convention",
          "Isothermal: ΔT = 0 => ΔU = 0 and Q = W",
          "Isobaric: W = P ΔV and Q = n C_p ΔT",
          "Isochoric: ΔV = 0 => W = 0 and ΔU = Q",
          "Adiabatic: Q = 0 => ΔU = -W",
        ],
        gradingRubric: [
          { criterion: "First Law Formulation", maxMarks: 2, description: "States ΔU = Q - W and internal energy property" },
          { criterion: "Isothermal & Isobaric Analysis", maxMarks: 3, description: "Correct formulations of work and heat for T and P constant" },
          { criterion: "Isochoric Analysis", maxMarks: 2, description: "Explains W = 0 and pure thermal storage" },
          { criterion: "Adiabatic Analysis", maxMarks: 3, description: "Explains Q = 0 and expansion cooling mechanism" },
        ],
      },
      {
        id: "wt-phys-10",
        prompt:
          "Formulate the Second Law of Thermodynamics in terms of entropy and heat engine efficiency. Explain the four reversible stages of the Carnot cycle and derive the Carnot efficiency formula η = 1 - (T_C / T_H).",
        modelAnswer:
          "Second Law of Thermodynamics: In any spontaneous cyclic process, the total entropy of an isolated system never decreases (ΔS_universe >= 0). It is impossible to construct a heat engine whose sole effect is to extract heat from a single reservoir and convert it completely into work (Kelvin-Planck statement).\nCarnot Cycle: An idealized reversible cycle operating between hot reservoir T_H and cold reservoir T_C consisting of four sequential processes:\n1. Reversible Isothermal Expansion (at T_H): Gas absorbs heat Q_H from hot reservoir, expanding at constant temperature T_H. Entropy change ΔS_1 = Q_H / T_H.\n2. Reversible Adiabatic Expansion: Gas expands with Q = 0 from T_H down to T_C, doing work while temperature drops. Reversible and adiabatic implies isentropic (ΔS_2 = 0).\n3. Reversible Isothermal Compression (at T_C): Gas is compressed at constant temperature T_C, expelling heat Q_C to cold reservoir. Entropy change ΔS_3 = -Q_C / T_C.\n4. Reversible Adiabatic Compression: Gas is compressed with Q = 0, restoring initial state at T_H (ΔS_4 = 0).\nDerivation of Efficiency:\nBecause the cycle is reversible and entropy is a state function, net cyclic entropy change is zero:\nΔS_cycle = (Q_H / T_H) - (Q_C / T_C) = 0 => Q_C / Q_H = T_C / T_H.\nThermal efficiency is defined as work output over heat input:\nη = W / Q_H = (Q_H - Q_C) / Q_H = 1 - (Q_C / Q_H).\nSubstituting the entropy relation: η_Carnot = 1 - (T_C / T_H).",
        keyRubricPoints: [
          "States Second Law (entropy non-decrease ΔS >= 0 and Kelvin-Planck statement)",
          "Lists the 4 Carnot stages: Isothermal expansion, Adiabatic expansion, Isothermal compression, Adiabatic compression",
          "Applies cyclic entropy state function condition (Q_H/T_H = Q_C/T_C)",
          "Derives Carnot efficiency formula η = 1 - T_C / T_H",
        ],
        topic: "Thermodynamics",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "formulate",
        expectedAnswerPoints: [
          "Second Law statement and Kelvin-Planck engine formulation",
          "Four stages of Carnot cycle: two isotherms and two adiabats",
          "Net entropy change ΔS = 0 in reversible closed cycle",
          "Derivation of η = 1 - T_C / T_H",
        ],
        gradingRubric: [
          { criterion: "Second Law Postulate", maxMarks: 2, description: "States entropy law and Kelvin-Planck limitation" },
          { criterion: "Four Carnot Stages", maxMarks: 3, description: "Accurately details isothermal and adiabatic expansion/compression" },
          { criterion: "Entropy Balance Step", maxMarks: 3, description: "Applies ΔS_cycle = 0 to establish Q_C / Q_H = T_C / T_H" },
          { criterion: "Efficiency Derivation", maxMarks: 2, description: "Concludes with η = 1 - T_C / T_H" },
        ],
      },
    ],
    fillBlanks: [
      {
        id: "fb-phys-1",
        sentenceWithBlank:
          "The rate of change of linear momentum of a body is directly proportional to the applied net [force] and acts in that direction.",
        blankAnswer: "force",
        acceptedAlternatives: ["net force", "external force"],
        hint: "Newton's second law formulation: dp/dt = ...",
        explanation:
          "Newton's second law in its fundamental form states that F_net = dp/dt.",
        topic: "Newton's Laws",
        blankType: "principle",
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
        blankType: "definition",
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
        blankType: "relationship",
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
        blankType: "comparison" as any,
      },
      {
        id: "fb-phys-5",
        sentenceWithBlank:
          "A frame of reference moving at constant linear velocity in which Newton's laws hold without pseudo-forces is called an [inertial] reference frame.",
        blankAnswer: "inertial",
        acceptedAlternatives: ["Inertial", "inertial frame"],
        hint: "Named after inertia...",
        explanation: "Inertial reference frames move at zero acceleration relative to each other.",
        topic: "Newton's Laws",
        blankType: "terminology",
      },
      {
        id: "fb-phys-6",
        sentenceWithBlank:
          "In an elastic collision between two bodies, both total linear momentum and total [kinetic energy] are strictly conserved.",
        blankAnswer: "kinetic energy",
        acceptedAlternatives: ["mechanical energy", "kinetic"],
        hint: "Conserved in elastic collisions but lost in inelastic ones...",
        explanation: "Elastic collisions conserve both linear momentum and mechanical kinetic energy.",
        topic: "Collisions",
        blankType: "principle",
      },
      {
        id: "fb-phys-7",
        sentenceWithBlank:
          "A thermodynamic process that occurs with strictly zero heat exchange between the system and its surroundings (Q = 0) is called an [adiabatic] process.",
        blankAnswer: "adiabatic",
        acceptedAlternatives: ["isentropic", "Adiabatic"],
        hint: "Greek for 'impassable'...",
        explanation: "In an adiabatic process Q = 0, so ΔU = -W.",
        topic: "Thermodynamics",
        blankType: "classification",
      },
      {
        id: "fb-phys-8",
        sentenceWithBlank:
          "The maximum theoretical efficiency of any heat engine operating between two thermal reservoirs is defined by the [Carnot] cycle.",
        blankAnswer: "Carnot",
        acceptedAlternatives: ["carnot", "Carnot engine"],
        hint: "Named after Sadi Carnot...",
        explanation: "The Carnot cycle establishes the upper efficiency bound η = 1 - T_C / T_H.",
        topic: "Thermodynamics",
        blankType: "principle",
      },
      {
        id: "fb-phys-9",
        sentenceWithBlank:
          "The rotational counterpart of force that causes an angular acceleration about an axis of rotation is called [torque].",
        blankAnswer: "torque",
        acceptedAlternatives: ["moment of force", "moment"],
        hint: "τ = r × F...",
        explanation: "Torque τ produces angular acceleration α = τ / I.",
        topic: "Rotational Dynamics",
        blankType: "terminology",
      },
      {
        id: "fb-phys-10",
        sentenceWithBlank:
          "According to Archimedes' principle, the upward buoyant force on a submerged object equals the weight of the displaced [fluid].",
        blankAnswer: "fluid",
        acceptedAlternatives: ["liquid", "water"],
        hint: "F_b = ρ * V * g...",
        explanation: "Buoyant force equals the weight of the displaced fluid.",
        topic: "Fluid Mechanics",
        blankType: "principle",
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
        back: "The contrapositive is ¬Q → ¬P. Yes, it is strictly logically equivalent to P → Q (they have identical truth table evaluations under all interpretations).",
        topic: "Implications",
        mastery: "mastered",
        starred: true,
        reviewCount: 5,
        cardType: "concept-to-definition",
        difficulty: "foundational",
      },
      {
        id: "fc-math-2",
        front: "State De Morgan's Laws for propositional logic in symbolic form.",
        back: "1. ¬(P ∧ Q) ≡ ¬P ∨ ¬Q\n2. ¬(P ∨ Q) ≡ ¬P ∧ ¬Q\nNegating a conjunction yields the disjunction of the negations; negating a disjunction yields the conjunction of the negations.",
        topic: "Equivalences",
        mastery: "mastered",
        starred: false,
        reviewCount: 4,
        cardType: "principle-to-application",
        difficulty: "foundational",
      },
      {
        id: "fc-math-3",
        front: "How do you negate a universally quantified predicate statement ¬(∀x P(x))?",
        back: "¬(∀x P(x)) ≡ ∃x ¬P(x). 'It is not the case that all elements x satisfy property P' is logically equivalent to 'There exists at least one element x that does NOT satisfy property P'.",
        topic: "Quantifiers",
        mastery: "learning",
        starred: true,
        reviewCount: 2,
        cardType: "process-to-step",
        difficulty: "intermediate",
      },
      {
        id: "fc-math-4",
        front: "What is the power set of a set S with n elements, and what is its exact cardinality?",
        back: "The power set P(S) is the set containing all possible subsets of S, including the empty set ∅ and S itself. Its cardinality is |P(S)| = 2^n, derived from the combinatorial binary choice of inclusion for each element.",
        topic: "Set Theory",
        mastery: "familiar",
        starred: false,
        reviewCount: 3,
        cardType: "formula",
        difficulty: "intermediate",
      },
      {
        id: "fc-math-5",
        front: "Distinguish between a Tautology, a Contradiction, and a Contingency.",
        back: "Tautology: A compound proposition that evaluates to True under every possible truth assignment (e.g. P ∨ ¬P). Contradiction: Evaluates to False under every truth assignment (e.g. P ∧ ¬P). Contingency: Evaluates to True for some truth assignments and False for others.",
        topic: "Truth Tables",
        mastery: "mastered",
        starred: false,
        reviewCount: 4,
        cardType: "classification",
        difficulty: "foundational",
      },
      {
        id: "fc-math-6",
        front: "What is the Conditional-to-Disjunction equivalence law for P → Q?",
        back: "P → Q ≡ ¬P ∨ Q. An implication is false only when the antecedent P is true and the consequent Q is false. Under all other conditions (including when P is false), the disjunction ¬P ∨ Q is true.",
        topic: "Equivalences",
        mastery: "familiar",
        starred: false,
        reviewCount: 3,
        cardType: "principle-to-application",
        difficulty: "intermediate",
      },
      {
        id: "fc-math-7",
        front: "For the implication P → Q, define its Converse and Inverse and evaluate their logical equivalence.",
        back: "Converse: Q → P. Inverse: ¬P → ¬Q. Neither is logically equivalent to the original conditional P → Q. However, the converse and inverse are logically equivalent to each other (since each is the contrapositive of the other).",
        topic: "Implications",
        mastery: "learning",
        starred: true,
        reviewCount: 2,
        cardType: "comparison",
        difficulty: "intermediate",
      },
      {
        id: "fc-math-8",
        front: "When does the biconditional proposition P ↔ Q evaluate to True?",
        back: "P ↔ Q evaluates to True if and only if both constituent propositions P and Q have identical truth values (both True or both False). It is logically equivalent to (P → Q) ∧ (Q → P).",
        topic: "Truth Tables",
        mastery: "mastered",
        starred: false,
        reviewCount: 3,
        cardType: "definition-to-concept",
        difficulty: "foundational",
      },
      {
        id: "fc-math-9",
        front: "Define the Cartesian Product A × B of two sets and state its cardinality.",
        back: "A × B = { (a, b) : a ∈ A and b ∈ B }. It is the set of all ordered pairs where the first element is from A and the second is from B. Cardinality is |A × B| = |A| * |B|.",
        topic: "Set Theory",
        mastery: "familiar",
        starred: false,
        reviewCount: 2,
        cardType: "definition-to-concept",
        difficulty: "foundational",
      },
      {
        id: "fc-math-10",
        front: "Define the set difference A \\ B (or A - B) and express it in terms of intersections and complements.",
        back: "A \\ B = { x : x ∈ A and x ∉ B }. It represents the relative complement of B in A. In terms of universal complement: A \\ B = A ∩ B'.",
        topic: "Set Theory",
        mastery: "learning",
        starred: false,
        reviewCount: 2,
        cardType: "relationship",
        difficulty: "intermediate",
      },
      {
        id: "fc-math-11",
        front: "State the Principle of Mathematical Induction and its two mandatory proof steps.",
        back: "To prove P(n) holds for all positive integers n ≥ 1: 1. Base Step: Prove P(1) is true. 2. Inductive Step: Assume P(k) is true for arbitrary integer k ≥ 1 (inductive hypothesis), and prove that P(k + 1) must necessarily be true.",
        topic: "Induction",
        mastery: "learning",
        starred: true,
        reviewCount: 3,
        cardType: "process-to-step",
        difficulty: "advanced",
      },
      {
        id: "fc-math-12",
        front: "What three properties must a binary relation R on set A satisfy to qualify as an Equivalence Relation?",
        back: "1. Reflexivity: ∀x ∈ A, (x, x) ∈ R.\n2. Symmetry: ∀x, y ∈ A, (x, y) ∈ R ⇒ (y, x) ∈ R.\n3. Transitivity: ∀x, y, z ∈ A, (x, y) ∈ R ∧ (y, z) ∈ R ⇒ (x, z) ∈ R.\nEquivalence relations partition set A into disjoint equivalence classes.",
        topic: "Relations",
        mastery: "familiar",
        starred: false,
        reviewCount: 2,
        cardType: "classification",
        difficulty: "advanced",
      },
      {
        id: "fc-math-13",
        front: "Differentiate between Injective (One-to-One), Surjective (Onto), and Bijective functions.",
        back: "Injective (One-to-One): f(a) = f(b) ⇒ a = b (distinct domain elements map to distinct codomain elements). Surjective (Onto): ∀y ∈ B, ∃x ∈ A such that f(x) = y (range equals codomain). Bijective: Both injective and surjective simultaneously (guarantees existence of two-sided inverse f⁻¹).",
        topic: "Functions",
        mastery: "familiar",
        starred: false,
        reviewCount: 3,
        cardType: "comparison",
        difficulty: "intermediate",
      },
      {
        id: "fc-math-14",
        front: "State the rules of inference Modus Ponens and Modus Tollens.",
        back: "Modus Ponens (Affirming the Antecedent): From premises [P → Q] and [P], conclude [Q].\nModus Tollens (Denying the Consequent): From premises [P → Q] and [¬Q], conclude [¬P].",
        topic: "Inference Rules",
        mastery: "mastered",
        starred: false,
        reviewCount: 4,
        cardType: "process-to-step",
        difficulty: "foundational",
      },
      {
        id: "fc-math-15",
        front: "What is Russell's Paradox and why did it dismantle naive set theory?",
        back: "Consider set R = { x : x ∉ x } (the set of all sets that do not contain themselves). If R ∈ R, then by definition R ∉ R. If R ∉ R, then by definition R ∈ R. This logical contradiction proved naive unrestricted set comprehension is inconsistent, necessitating axiomatic set theory (Zermelo-Fraenkel).",
        topic: "Set Theory",
        mastery: "unfamiliar",
        starred: true,
        reviewCount: 1,
        cardType: "concept-to-explanation",
        difficulty: "advanced",
      },
    ],
    quizzes: [
      {
        id: "qz-math-1",
        question: "If P is True and Q is False, what is the truth value of the compound proposition (P ∨ Q) → (P ∧ Q)?",
        options: ["False", "True", "Indeterminate", "Tautology"],
        correctIndex: 0,
        explanation:
          "(P ∨ Q) = True ∨ False = True. (P ∧ Q) = True ∧ False = False. True → False evaluates strictly to False.",
        topic: "Truth Tables",
        difficulty: "easy",
        questionType: "multiple-choice",
        conceptTested: "Truth Table Evaluation of Implications",
        recommendedSection: "Unit 1.0: Propositional Logic Foundations",
        distractorRationale: [
          "Correct answer: True → False is False.",
          "Distractor: Assumes disjunction evaluates to True.",
          "Distractor: Truth values in classical logic are strictly deterministic.",
          "Distractor: A single false truth assignment proves it is not a tautology.",
        ],
      },
      {
        id: "qz-math-2",
        question:
          "Which of the following propositions is logically equivalent to the conditional statement 'If it rains, the grass is wet' (P → Q)?",
        options: [
          "If the grass is not wet, it does not rain (¬Q → ¬P)",
          "If the grass is wet, it rains (Q → P)",
          "If it does not rain, the grass is not wet (¬P → ¬Q)",
          "It rains and the grass is not wet (P ∧ ¬Q)",
        ],
        correctIndex: 0,
        explanation:
          "A conditional implication P → Q is logically equivalent strictly to its contrapositive ¬Q → ¬P. The converse (Q → P) and inverse (¬P → ¬Q) are classical logical fallacies.",
        topic: "Implications",
        difficulty: "medium",
        questionType: "conceptual-reasoning",
        conceptTested: "Contrapositive Equivalence Law",
        recommendedSection: "Unit 1.0: Logical Equivalences",
        distractorRationale: [
          "Correct answer: The contrapositive ¬Q → ¬P is always logically equivalent.",
          "Distractor: The converse Q → P is not equivalent (affirming the consequent).",
          "Distractor: The inverse ¬P → ¬Q is not equivalent (denying the antecedent).",
          "Distractor: P ∧ ¬Q is the exact negation of P → Q, not equivalent to it.",
        ],
      },
      {
        id: "qz-math-3",
        question:
          "What is the exact logical negation of the quantified statement: 'Some students did not pass the examination' [∃x ¬P(x)]?",
        options: [
          "All students passed the examination [∀x P(x)]",
          "No students passed the examination [∀x ¬P(x)]",
          "Some students passed the examination [∃x P(x)]",
          "There is no examination",
        ],
        correctIndex: 0,
        explanation:
          "Negating ∃x ¬P(x) yields ¬(∃x ¬P(x)) ≡ ∀x ¬(¬P(x)) ≡ ∀x P(x). In English: 'All students passed the examination'.",
        topic: "Quantifiers",
        difficulty: "medium",
        questionType: "application",
        conceptTested: "De Morgan's Laws for Predicate Quantifiers",
        recommendedSection: "Unit 2.0: Predicate Calculus & Quantifiers",
        distractorRationale: [
          "Correct answer: Negating 'Some did not' gives 'All did'.",
          "Distractor: 'No students passed' is the universal negative, not the negation.",
          "Distractor: 'Some passed' can be true at the same time as 'Some did not pass' (not contradictory).",
          "Distractor: Nonsensical domain elimination.",
        ],
      },
      {
        id: "qz-math-4",
        question:
          "Let set S have cardinality |S| = 5. How many distinct proper subsets does the power set P(S) contain?",
        options: ["31", "32", "25", "10"],
        correctIndex: 0,
        explanation:
          "The total number of subsets in the power set is 2^n = 2^5 = 32. A proper subset is any subset strictly not equal to S itself. Therefore, the number of proper subsets is 2^5 - 1 = 32 - 1 = 31.",
        topic: "Set Theory",
        difficulty: "medium",
        questionType: "application",
        conceptTested: "Proper Subsets of Power Set",
        recommendedSection: "Unit 3.0: Set Theory & Cartesian Products",
        distractorRationale: [
          "Correct answer: 2^5 - 1 = 31 proper subsets.",
          "Distractor: 32 includes S itself (improper subset).",
          "Distractor: 25 is 5² arithmetic error.",
          "Distractor: 10 is 2 * 5 arithmetic error.",
        ],
      },
      {
        id: "qz-math-5",
        question:
          "In mathematical logic, what is the truth value of a conditional statement P → Q when the antecedent P is False (False → True or False → False)?",
        options: [
          "Always True (Vacuously True)",
          "Always False",
          "Indeterminate without knowing Q",
          "Contradiction",
        ],
        correctIndex: 0,
        explanation:
          "By the definition of material implication (P → Q ≡ ¬P ∨ Q), whenever P is False, ¬P is True, making the entire disjunction True regardless of Q. This is termed 'vacuous truth'.",
        topic: "Implications",
        difficulty: "easy",
        questionType: "conceptual-reasoning",
        conceptTested: "Vacuous Truth of Implications",
        recommendedSection: "Unit 1.0: Propositional Logic Foundations",
        distractorRationale: [
          "Correct answer: False antecedent guarantees a True implication.",
          "Distractor: A conditional is false ONLY when P=True and Q=False.",
          "Distractor: Q does not matter when P is false.",
          "Distractor: It is not a contradiction; it is true.",
        ],
      },
      {
        id: "qz-math-6",
        question:
          "Given finite sets A = {1, 2} and B = {x, y, z}. What is the cardinality of their Cartesian product |A × B|?",
        options: ["6", "5", "8", "9"],
        correctIndex: 0,
        explanation:
          "The cardinality of a Cartesian product is |A × B| = |A| * |B| = 2 * 3 = 6 ordered pairs.",
        topic: "Set Theory",
        difficulty: "easy",
        questionType: "application",
        conceptTested: "Cartesian Product Cardinality",
        recommendedSection: "Unit 3.0: Set Theory & Cartesian Products",
        distractorRationale: [
          "Correct answer: 2 * 3 = 6.",
          "Distractor: 5 is addition |A| + |B|.",
          "Distractor: 8 is 2³ power set.",
          "Distractor: 9 is 3².",
        ],
      },
      {
        id: "qz-math-7",
        question:
          "Which of the following compound propositions is a Tautology (always true for all truth values of P)?",
        options: [
          "P ∨ ¬P (Law of Excluded Middle)",
          "P ∧ ¬P (Law of Non-Contradiction)",
          "P → ¬P",
          "(P ∨ Q) ∧ ¬P",
        ],
        correctIndex: 0,
        explanation:
          "P ∨ ¬P is the Law of Excluded Middle. Since P is either True or False, either P or its negation ¬P is guaranteed to be True, evaluating to True in 100% of rows.",
        topic: "Truth Tables",
        difficulty: "easy",
        questionType: "conceptual-reasoning",
        conceptTested: "Tautology Identification",
        recommendedSection: "Unit 1.0: Propositional Logic Foundations",
        distractorRationale: [
          "Correct answer: P ∨ ¬P is always True (Tautology).",
          "Distractor: P ∧ ¬P is always False (Contradiction).",
          "Distractor: P → ¬P is False when P is True.",
          "Distractor: Contingent proposition depending on Q.",
        ],
      },
      {
        id: "qz-math-8",
        question:
          "From the premises: 'If a polygon is a square, it has 4 sides' (P → Q) and 'This polygon does NOT have 4 sides' (¬Q), which valid rule of inference allows you to deduce 'This polygon is NOT a square' (¬P)?",
        options: [
          "Modus Tollens",
          "Modus Ponens",
          "Hypothetical Syllogism",
          "Affirming the Consequent",
        ],
        correctIndex: 0,
        explanation:
          "Modus Tollens (denying the consequent) states: [(P → Q) ∧ ¬Q] ⇒ ¬P. It is a strictly valid deductive rule of inference.",
        topic: "Inference Rules",
        difficulty: "medium",
        questionType: "application",
        conceptTested: "Modus Tollens Rule of Inference",
        recommendedSection: "Unit 4.0: Rules of Inference & Proof Techniques",
        distractorRationale: [
          "Correct answer: Modus Tollens deduces ¬P from P → Q and ¬Q.",
          "Distractor: Modus Ponens deduces Q from P → Q and P.",
          "Distractor: Hypothetical Syllogism chains P → Q and Q → R to P → R.",
          "Distractor: Affirming the consequent is a formal fallacy, not a valid inference.",
        ],
      },
      {
        id: "qz-math-9",
        question:
          "Let A and B be sets such that A ⊆ B. Which of the following set equations is NOT always true?",
        options: [
          "A \\ B = A",
          "A ∩ B = A",
          "A ∪ B = B",
          "A \\ B = ∅",
        ],
        correctIndex: 0,
        explanation:
          "If A ⊆ B, every element of A is also in B. Therefore, removing all elements of B from A leaves nothing: A \\ B = ∅. Thus the statement 'A \\ B = A' is false (unless A is empty).",
        topic: "Set Theory",
        difficulty: "medium",
        questionType: "conceptual-reasoning",
        conceptTested: "Subset Properties and Relative Complements",
        recommendedSection: "Unit 3.0: Set Theory & Cartesian Products",
        distractorRationale: [
          "Correct answer: A \\ B = A is false; A \\ B must equal the empty set ∅.",
          "Distractor: A ∩ B = A is always true when A is a subset of B.",
          "Distractor: A ∪ B = B is always true when A is a subset of B.",
          "Distractor: A \\ B = ∅ is always true.",
        ],
      },
      {
        id: "qz-math-10",
        question:
          "The Symmetric Difference of two sets A and B, denoted A Δ B, is defined as:",
        options: [
          "(A \\ B) ∪ (B \\ A)",
          "(A ∩ B) \\ (A ∪ B)",
          "A ∪ B ∪ (A ∩ B)",
          "A ∩ B",
        ],
        correctIndex: 0,
        explanation:
          "The symmetric difference contains elements in either A or B, but NOT in both: A Δ B = (A \\ B) ∪ (B \\ A) = (A ∪ B) \\ (A ∩ B). It represents the set-theoretic XOR.",
        topic: "Set Theory",
        difficulty: "medium",
        questionType: "definition-to-concept",
        conceptTested: "Symmetric Difference Formulation",
        recommendedSection: "Unit 3.0: Set Theory & Cartesian Products",
        distractorRationale: [
          "Correct answer: (A \\ B) ∪ (B \\ A) is the exact definition of A Δ B.",
          "Distractor: (A ∩ B) \\ (A ∪ B) is always the empty set ∅.",
          "Distractor: Simply yields A ∪ B.",
          "Distractor: A ∩ B is the exact elements excluded from symmetric difference.",
        ],
      },
      {
        id: "qz-math-11",
        question:
          "A function f: A → B is Bijective if and only if it satisfies which of the following conditions?",
        options: [
          "f is both Injective (one-to-one) and Surjective (onto)",
          "f maps every element of A to the same constant element in B",
          "f is Injective but its range is a proper subset of B",
          "f has a domain with more elements than its codomain",
        ],
        correctIndex: 0,
        explanation:
          "By definition, a bijection is a one-to-one correspondence, meaning it is simultaneously injective (distinct inputs give distinct outputs) and surjective (every codomain element is mapped to). This guarantees an inverse f⁻¹ exists.",
        topic: "Functions",
        difficulty: "easy",
        questionType: "conceptual-reasoning",
        conceptTested: "Bijective Function Invertibility",
        recommendedSection: "Unit 4.0: Relations & Functions",
        distractorRationale: [
          "Correct answer: Bijective means both injective and surjective.",
          "Distractor: That defines a constant function.",
          "Distractor: That defines an injection that is not surjective.",
          "Distractor: Violates injectivity by the Pigeonhole Principle.",
        ],
      },
      {
        id: "qz-math-12",
        question:
          "Consider the argument: 'If it rains, the ground is wet (P → Q). The ground is wet (Q). Therefore, it rained (P).' Which formal fallacy does this argument commit?",
        options: [
          "Fallacy of Affirming the Consequent",
          "Fallacy of Denying the Antecedent",
          "Circular Reasoning (Begging the Question)",
          "Argumentum Ad Hominem",
        ],
        correctIndex: 0,
        explanation:
          "This is the Fallacy of Affirming the Consequent: inferring P from P → Q and Q. The ground could be wet for another reason (e.g. garden sprinklers), so the conclusion does not logically follow.",
        topic: "Inference Rules",
        difficulty: "medium",
        questionType: "conceptual-reasoning",
        conceptTested: "Formal Logical Fallacies",
        recommendedSection: "Unit 4.0: Rules of Inference & Proof Techniques",
        distractorRationale: [
          "Correct answer: Affirming the consequent Q does not prove P.",
          "Distractor: Denying the antecedent is inferring ¬Q from ¬P.",
          "Distractor: Begging the question assumes the premise in the conclusion.",
          "Distractor: Ad hominem attacks the speaker personally.",
        ],
      },
    ],
    writtenTests: [
      {
        id: "wt-math-1",
        prompt:
          "Prove using a truth table and logical equivalence laws that the implication P → Q is logically equivalent to ¬P ∨ Q. Explain the real-world significance of this equivalence in converting conditionals into boolean logic.",
        modelAnswer:
          "To prove P → Q ≡ ¬P ∨ Q, we construct a 4-row truth table comparing both expressions for all combinations of truth values of P and Q:\n\n| P | Q | P → Q | ¬P | ¬P ∨ Q |\n|---|---|-------|----|--------|\n| T | T |   T   | F  |   T    |\n| T | F |   F   | F  |   F    |\n| F | T |   T   | T  |   T    |\n| F | F |   T   | T  |   T    |\n\nAnalysis:\nIn Row 1 (T, T): T → T is T; ¬T ∨ T = F ∨ T = T.\nIn Row 2 (T, F): T → F is F; ¬T ∨ F = F ∨ F = F.\nIn Row 3 (F, T): F → T is T; ¬F ∨ T = T ∨ T = T.\nIn Row 4 (F, F): F → F is T; ¬F ∨ F = T ∨ F = T.\nBecause the truth values of the columns for P → Q and ¬P ∨ Q are identical [T, F, T, T] across all possible assignments, the biconditional (P → Q) ↔ (¬P ∨ Q) is a tautology, proving P → Q ≡ ¬P ∨ Q.\nSignificance: This allows computer scientists and circuit designers to implement conditional control flow (if-then statements) entirely using elementary boolean gates (NOT and OR).",
        keyRubricPoints: [
          "Constructs all 4 rows of the truth table for P and Q",
          "Evaluates P → Q correctly [T, F, T, T]",
          "Evaluates ¬P ∨ Q correctly [T, F, T, T]",
          "Identifies identical columns proving tautological equivalence",
        ],
        topic: "Equivalences",
        marks: 10,
        difficulty: "foundational",
        actionVerb: "explain",
        expectedAnswerPoints: [
          "Truth table with columns for P, Q, ¬P, P → Q, and ¬P ∨ Q",
          "Verification of all 4 rows: TT, TF, FT, FF",
          "Demonstration that both are false only in row 2 (T → F)",
          "Conclusion of logical equivalence and practical significance",
        ],
        gradingRubric: [
          { criterion: "Truth Table Construction", maxMarks: 4, description: "Correct evaluation of all 4 rows for both expressions" },
          { criterion: "Logical Comparison", maxMarks: 3, description: "Explicitly identifies that column entries match identically" },
          { criterion: "Equivalence Formulation", maxMarks: 2, description: "States formal biconditional tautology relation" },
          { criterion: "Application Insight", maxMarks: 1, description: "Mentions boolean circuit or programming logic simplification" },
        ],
      },
      {
        id: "wt-math-2",
        prompt:
          "Prove De Morgan's Law for sets: (A ∪ B)' = A' ∩ B' using an element-membership (double inclusion) proof. State each logical step with precision.",
        modelAnswer:
          "To prove (A ∪ B)' = A' ∩ B', we must prove two set inclusions: (1) (A ∪ B)' ⊆ A' ∩ B' and (2) A' ∩ B' ⊆ (A ∪ B)'.\n\nPart 1: Prove (A ∪ B)' ⊆ A' ∩ B'\nLet x be an arbitrary element such that x ∈ (A ∪ B)'.\nBy definition of set complement, this means x ∉ (A ∪ B).\nBy definition of union, x ∉ (A ∪ B) means it is NOT the case that (x ∈ A or x ∈ B): ¬(x ∈ A ∨ x ∈ B).\nApplying De Morgan's propositional logic law ¬(P ∨ Q) ≡ ¬P ∧ ¬Q:\nThis implies ¬(x ∈ A) ∧ ¬(x ∈ B), which means x ∉ A and x ∉ B.\nBy definition of complement, x ∈ A' and x ∈ B'.\nBy definition of intersection, x ∈ (A' ∩ B').\nSince x was arbitrary, (A ∪ B)' ⊆ A' ∩ B'.\n\nPart 2: Prove A' ∩ B' ⊆ (A ∪ B)'\nLet x ∈ A' ∩ B'.\nBy definition of intersection, x ∈ A' and x ∈ B'.\nThus x ∉ A and x ∉ B, which in logic is ¬(x ∈ A) ∧ ¬(x ∈ B).\nBy De Morgan's law, this is equivalent to ¬(x ∈ A ∨ x ∈ B).\nThis means x ∉ (A ∪ B), which by definition of complement implies x ∈ (A ∪ B)'.\nSince x was arbitrary, A' ∩ B' ⊆ (A ∪ B)'.\n\nConclusion:\nBecause (A ∪ B)' ⊆ A' ∩ B' and A' ∩ B' ⊆ (A ∪ B)', by the Axiom of Extensionality, (A ∪ B)' = A' ∩ B'.",
        keyRubricPoints: [
          "Uses double containment proof structure (X ⊆ Y and Y ⊆ X)",
          "Correctly transitions between set operations and propositional logic connectives (∪ to ∨, ∩ to ∧, ' to ¬)",
          "Applies propositional De Morgan's law ¬(P ∨ Q) ≡ ¬P ∧ ¬Q",
          "Concludes with set equality by mutual inclusion",
        ],
        topic: "Set Theory",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "apply",
        expectedAnswerPoints: [
          "Double inclusion framework: proving both directions",
          "Arbitrary element x ∈ (A ∪ B)' step-by-step to x ∈ A' ∩ B'",
          "Reverse direction: x ∈ A' ∩ B' step-by-step to x ∈ (A ∪ B)'",
          "Clear invocation of definitions of complement, union, and intersection",
        ],
        gradingRubric: [
          { criterion: "Proof Structure", maxMarks: 2, description: "Recognizes need for double containment or chained biconditionals" },
          { criterion: "Forward Inclusion (Part 1)", maxMarks: 4, description: "Rigorous step-by-step derivation from union complement to intersection" },
          { criterion: "Reverse Inclusion (Part 2)", maxMarks: 3, description: "Rigorous derivation from intersection to union complement" },
          { criterion: "Formal Conclusion", maxMarks: 1, description: "Concludes set equality by mutual subset containment" },
        ],
      },
      {
        id: "wt-math-3",
        prompt:
          "Differentiate between the Converse, Inverse, and Contrapositive of an implication P → Q. Using a concrete mathematical statement, formulate all three and prove which pairs are logically equivalent.",
        modelAnswer:
          "For a conditional implication P → Q:\n1. Converse: Q → P (swaps antecedent and consequent)\n2. Inverse: ¬P → ¬Q (negates both antecedent and consequent)\n3. Contrapositive: ¬Q → ¬P (swaps and negates both)\n\nConcrete Mathematical Example:\nStatement (P → Q): 'If integer n is divisible by 4, then n is an even integer.' (True)\n- Converse (Q → P): 'If integer n is an even integer, then n is divisible by 4.' (False, e.g. n = 6 is even but not divisible by 4)\n- Inverse (¬P → ¬Q): 'If integer n is not divisible by 4, then n is not an even integer.' (False, counterexample n = 6)\n- Contrapositive (¬Q → ¬P): 'If integer n is not an even integer, then n is not divisible by 4.' (True, an odd integer cannot be divisible by 4)\n\nEquivalence Analysis:\n- The conditional P → Q and its contrapositive ¬Q → ¬P are strictly logically equivalent (both share truth column [T, F, T, T]).\n- The converse Q → P and inverse ¬P → ¬Q are strictly logically equivalent to each other (both share truth column [T, T, F, T]).\n- However, the conditional is NOT equivalent to its converse or inverse.",
        keyRubricPoints: [
          "Correctly defines Converse (Q → P), Inverse (¬P → ¬Q), and Contrapositive (¬Q → ¬P)",
          "Provides a valid concrete mathematical example illustrating truth differences",
          "Proves P → Q ≡ ¬Q → ¬P",
          "Proves Converse ≡ Inverse, but neither is equivalent to the original implication",
        ],
        topic: "Implications",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "compare",
        expectedAnswerPoints: [
          "Definitions of Converse, Inverse, and Contrapositive",
          "Concrete example with counterexample showing truth value divergence",
          "Truth value comparison demonstrating that only contrapositive is equivalent to original",
          "Identification that converse and inverse form a separate equivalent pair",
        ],
        gradingRubric: [
          { criterion: "Definitions", maxMarks: 3, description: "Accurately defines all three transformations" },
          { criterion: "Mathematical Example", maxMarks: 3, description: "Presents clear proposition and tests truth of all forms" },
          { criterion: "Equivalence Proof", maxMarks: 3, description: "Demonstrates truth alignment between conditional and contrapositive" },
          { criterion: "Fallacy Warning", maxMarks: 1, description: "Warns against confusing converse/inverse with original statement" },
        ],
      },
      {
        id: "wt-math-4",
        prompt:
          "Prove by Mathematical Induction that the sum of the first n positive integers is given by S(n) = 1 + 2 + 3 + ... + n = n(n + 1) / 2 for all integers n ≥ 1.",
        modelAnswer:
          "Let P(n) be the proposition: 1 + 2 + 3 + ... + n = n(n + 1) / 2.\n\n1. Base Step (n = 1):\nLHS: 1.\nRHS: 1(1 + 1) / 2 = 1(2) / 2 = 1.\nSince LHS = RHS = 1, P(1) is true.\n\n2. Inductive Hypothesis:\nAssume that P(k) is true for an arbitrary positive integer k ≥ 1. That is, assume:\n1 + 2 + 3 + ... + k = k(k + 1) / 2.\n\n3. Inductive Step (Prove P(k + 1) is true):\nWe must show that:\n1 + 2 + 3 + ... + k + (k + 1) = (k + 1)((k + 1) + 1) / 2 = (k + 1)(k + 2) / 2.\nStarting with the LHS of P(k + 1):\nLHS = [1 + 2 + 3 + ... + k] + (k + 1).\nSubstituting the Inductive Hypothesis for the sum in brackets:\nLHS = [k(k + 1) / 2] + (k + 1).\nFactoring out common factor (k + 1):\nLHS = (k + 1) [ (k / 2) + 1 ] = (k + 1) [ (k + 2) / 2 ] = (k + 1)(k + 2) / 2.\nThis matches the RHS of P(k + 1) exactly.\n\nConclusion:\nBy the Principle of Mathematical Induction, since P(1) is true and P(k) ⇒ P(k + 1), P(n) is true for all positive integers n ≥ 1.",
        keyRubricPoints: [
          "Verifies base step for n = 1 showing LHS = RHS = 1",
          "States inductive hypothesis clearly for n = k",
          "Executes inductive step for n = k + 1 substituting the hypothesis",
          "Performs algebraic factoring to reach (k + 1)(k + 2) / 2 and concludes induction",
        ],
        topic: "Induction",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "apply",
        expectedAnswerPoints: [
          "Base step validation for n = 1",
          "Formal declaration of inductive hypothesis P(k)",
          "Algebraic manipulation of LHS of P(k + 1)",
          "Factoring common term (k + 1) to derive RHS of P(k + 1)",
        ],
        gradingRubric: [
          { criterion: "Base Step", maxMarks: 2, description: "Explicit verification of n = 1" },
          { criterion: "Inductive Hypothesis", maxMarks: 2, description: "Clear assumption statement for arbitrary k ≥ 1" },
          { criterion: "Inductive Step Derivation", maxMarks: 4, description: "Flawless algebraic deduction from k to k + 1" },
          { criterion: "Conclusion", maxMarks: 2, description: "Formal concluding sentence invoking Principle of Mathematical Induction" },
        ],
      },
      {
        id: "wt-math-5",
        prompt:
          "Define an Equivalence Relation. State and formally express its three defining properties (Reflexivity, Symmetry, Transitivity). Prove that congruence modulo m on the set of integers ℤ is an equivalence relation.",
        modelAnswer:
          "Definition: A binary relation R on a set A is an Equivalence Relation if and only if it satisfies:\n1. Reflexivity: ∀x ∈ A, x R x.\n2. Symmetry: ∀x, y ∈ A, x R y ⇒ y R x.\n3. Transitivity: ∀x, y, z ∈ A, (x R y ∧ y R z) ⇒ x R z.\n\nProof that Congruence Modulo m is an Equivalence Relation on ℤ:\nTwo integers a and b are congruent modulo m (written a ≡ b mod m) if m divides (a - b), meaning a - b = k * m for some integer k ∈ ℤ.\n\n1. Reflexivity:\nFor any a ∈ ℤ, a - a = 0 = 0 * m.\nSince 0 is an integer, m divides (a - a). Thus a ≡ a (mod m). Reflexivity holds.\n\n2. Symmetry:\nAssume a ≡ b (mod m). Then a - b = k * m for some k ∈ ℤ.\nMultiply both sides by -1: b - a = -(k * m) = (-k) * m.\nSince k is an integer, -k is also an integer. Thus m divides (b - a), which means b ≡ a (mod m). Symmetry holds.\n\n3. Transitivity:\nAssume a ≡ b (mod m) and b ≡ c (mod m).\nThen a - b = k1 * m and b - c = k2 * m for integers k1, k2 ∈ ℤ.\nAdd both equations:\n(a - b) + (b - c) = k1 * m + k2 * m => a - c = (k1 + k2) * m.\nSince integers are closed under addition, (k1 + k2) is an integer. Thus m divides (a - c), which means a ≡ c (mod m). Transitivity holds.\n\nConclusion:\nBecause congruence modulo m is reflexive, symmetric, and transitive, it is an equivalence relation on ℤ.",
        keyRubricPoints: [
          "Defines Reflexivity, Symmetry, and Transitivity in formal mathematical notation",
          "Proves Reflexivity: a - a = 0 = 0 * m",
          "Proves Symmetry: b - a = (-k) * m",
          "Proves Transitivity: a - c = (k1 + k2) * m",
        ],
        topic: "Relations",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "explain",
        expectedAnswerPoints: [
          "Formal definitions of reflexivity, symmetry, transitivity",
          "Definition of congruence modulo m (m divides a - b)",
          "Algebraic proofs for all three properties on ℤ",
          "Conclusion that congruence partitions integers into residue classes",
        ],
        gradingRubric: [
          { criterion: "Property Definitions", maxMarks: 3, description: "Accurately defines all three properties in quantifiers" },
          { criterion: "Reflexivity & Symmetry Proofs", maxMarks: 3, description: "Clear algebraic verification for zero and sign reversal" },
          { criterion: "Transitivity Proof", maxMarks: 3, description: "Adds linear equations to demonstrate divisibility of a - c" },
          { criterion: "Equivalence Synthesis", maxMarks: 1, description: "Concludes equivalence relation and residue partition" },
        ],
      },
      {
        id: "wt-math-6",
        prompt:
          "Analyze Predicate Calculus quantifiers. Formulate the rules for negating nested quantifiers (e.g. ¬(∀x ∃y P(x, y))). Provide a concrete mathematical example demonstrating why quantifier order matters (e.g. ∀x ∃y Q(x, y) versus ∃y ∀x Q(x, y)).",
        modelAnswer:
          "Rules for Negating Nested Quantifiers:\nTo negate a nested quantified statement, change every universal quantifier (∀) to an existential quantifier (∃), change every existential quantifier (∃) to a universal quantifier (∀), and negate the innermost predicate:\n¬(∀x ∃y P(x, y)) ≡ ∃x ¬(∃y P(x, y)) ≡ ∃x ∀y ¬P(x, y).\n\nWhy Quantifier Order Matters:\nLet the domain of discourse be all real numbers ℝ, and let predicate Q(x, y) be 'x + y = 0' (y is the additive inverse of x).\n\n1. Statement 1: ∀x ∃y (x + y = 0)\nMeaning: 'For every real number x, there exists a real number y such that x + y = 0.'\nEvaluation: TRUE. For any chosen x, we can select y = -x, and x + (-x) = 0.\n\n2. Statement 2: ∃y ∀x (x + y = 0)\nMeaning: 'There exists a single real number y such that for ALL real numbers x, x + y = 0.'\nEvaluation: FALSE. There is no single universal number y that can sum to zero with every possible real number simultaneously (if y = 0, 1 + 0 ≠ 0).\n\nConclusion:\nQuantifier order is non-commutative when mixing ∀ and ∃. Changing the order fundamentally alters the semantic truth value of the proposition.",
        keyRubricPoints: [
          "States De Morgan's quantifier negation rule: flip quantifiers and negate predicate",
          "Formulates ¬(∀x ∃y P(x, y)) ≡ ∃x ∀y ¬P(x, y)",
          "Provides a valid concrete example (such as x + y = 0 on ℝ)",
          "Contrasts ∀x ∃y (True) with ∃y ∀x (False) to prove non-commutativity",
        ],
        topic: "Quantifiers",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "analyze",
        expectedAnswerPoints: [
          "Step-by-step negation of nested quantifiers",
          "Demonstration of flipping ∀ to ∃ and vice-versa",
          "Concrete example with real numbers (e.g. additive inverse)",
          "Explanation of the semantic difference between local choice vs universal constant",
        ],
        gradingRubric: [
          { criterion: "Negation Algorithm", maxMarks: 3, description: "Correctly derives ∃x ∀y ¬P(x, y)" },
          { criterion: "Mathematical Example Selection", maxMarks: 3, description: "Presents clear domain and predicate" },
          { criterion: "Truth Value Divergence Analysis", maxMarks: 3, description: "Explains why one is True and the other is False" },
          { criterion: "Commutativity Warning", maxMarks: 1, description: "Highlights non-commutativity of mixed quantifiers" },
        ],
      },
      {
        id: "wt-math-7",
        prompt:
          "Define Injective, Surjective, and Bijective functions. Construct an explicit function f: ℤ → ℤ that is: (a) Injective but not surjective, and (b) Surjective but not injective. Justify both answers mathematically.",
        modelAnswer:
          "Definitions for function f: A → B:\n1. Injective (One-to-One): ∀x1, x2 ∈ A, f(x1) = f(x2) ⇒ x1 = x2.\n2. Surjective (Onto): ∀y ∈ B, ∃x ∈ A such that f(x) = y (Range(f) = B).\n3. Bijective: Both injective and surjective simultaneously.\n\n(a) Injective but NOT Surjective on ℤ:\nDefine f: ℤ → ℤ by f(n) = 2n.\n- Injective Proof: Assume f(n1) = f(n2) => 2n1 = 2n2 => n1 = n2. Thus f is injective.\n- Not Surjective: The range of f is the set of all even integers. For any odd integer (e.g. y = 3 ∈ ℤ), there is no integer n such that 2n = 3 (since n = 1.5 ∉ ℤ). Thus f is not surjective.\n\n(b) Surjective but NOT Injective on ℤ:\nDefine g: ℤ → ℤ by g(n) = ⌊n / 2⌋ (the floor function of n/2).\n- Surjective Proof: For any target integer y ∈ ℤ, choose n = 2y ∈ ℤ. Then g(2y) = ⌊2y / 2⌋ = ⌊y⌋ = y. Every integer in the codomain is mapped to, so g is surjective.\n- Not Injective: Consider n1 = 2 and n2 = 3. Then g(2) = ⌊2/2⌋ = 1, and g(3) = ⌊3/2⌋ = ⌊1.5⌋ = 1. We have g(2) = g(3) = 1, but 2 ≠ 3. Thus g is not injective.",
        keyRubricPoints: [
          "Defines Injective, Surjective, and Bijective functions formally",
          "Constructs valid function f(n) = 2n and proves injectivity and non-surjectivity on ℤ",
          "Constructs valid function g(n) = ⌊n/2⌋ and proves surjectivity and non-injectivity on ℤ",
          "Verifies domain and codomain constraints on integers ℤ",
        ],
        topic: "Functions",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "explain",
        expectedAnswerPoints: [
          "Formal definitions of injectivity and surjectivity",
          "Example (a): f(n) = 2n with algebraic proof and counterexample",
          "Example (b): g(n) = ⌊n/2⌋ with algebraic proof and counterexample",
          "Explanation of infinite set cardinality subtleties",
        ],
        gradingRubric: [
          { criterion: "Definitions", maxMarks: 2, description: "Formal definition of one-to-one and onto" },
          { criterion: "Part (a) Construction & Proof", maxMarks: 4, description: "Proves f(n) = 2n is injective and shows odd integers have no pre-image" },
          { criterion: "Part (b) Construction & Proof", maxMarks: 4, description: "Proves g(n) = ⌊n/2⌋ is surjective and shows multiple pre-images for same output" },
        ],
      },
      {
        id: "wt-math-8",
        prompt:
          "Explain the valid rules of inference Modus Ponens and Modus Tollens. Contrast them with the formal fallacies of Affirming the Consequent and Denying the Antecedent using truth table argument forms.",
        modelAnswer:
          "Rules of inference are tautological argument forms of the structure (Premises) ⇒ Conclusion.\n\n1. Valid Rule 1: Modus Ponens (Affirming the Antecedent)\nForm: Premise 1: P → Q, Premise 2: P. Conclusion: Q.\nTautology: [(P → Q) ∧ P] → Q. In a truth table, in the only row where both premises are true (P=T, Q=T), the conclusion Q is guaranteed to be True.\n\n2. Valid Rule 2: Modus Tollens (Denying the Consequent)\nForm: Premise 1: P → Q, Premise 2: ¬Q. Conclusion: ¬P.\nTautology: [(P → Q) ∧ ¬Q] → ¬P. In the only row where both premises are true (P=F, Q=F), the conclusion ¬P is guaranteed to be True.\n\n3. Formal Fallacy 1: Affirming the Consequent\nForm: Premise 1: P → Q, Premise 2: Q. Erroneous Conclusion: P.\nWhy it fails: When P=False and Q=True, Premise 1 (F → T = T) is true, Premise 2 (Q = T) is true, but the conclusion P is FALSE. Thus [(P → Q) ∧ Q] → P is NOT a tautology.\n\n4. Formal Fallacy 2: Denying the Antecedent\nForm: Premise 1: P → Q, Premise 2: ¬P. Erroneous Conclusion: ¬Q.\nWhy it fails: When P=False and Q=True, Premise 1 (F → T = T) is true, Premise 2 (¬P = T) is true, but the conclusion ¬Q is FALSE. Thus [(P → Q) ∧ ¬P] → ¬Q is an invalid argument.",
        keyRubricPoints: [
          "Defines Modus Ponens [(P → Q) ∧ P] → Q and Modus Tollens [(P → Q) ∧ ¬Q] → ¬P",
          "Explains why both valid rules are tautologies",
          "Defines Affirming the Consequent and shows counterexample row (P=F, Q=T)",
          "Defines Denying the Antecedent and shows counterexample row (P=F, Q=T)",
        ],
        topic: "Inference Rules",
        marks: 10,
        difficulty: "intermediate",
        actionVerb: "compare",
        expectedAnswerPoints: [
          "Modus Ponens form and validity",
          "Modus Tollens form and validity",
          "Affirming the Consequent argument structure and critical counterexample",
          "Denying the Antecedent argument structure and critical counterexample",
        ],
        gradingRubric: [
          { criterion: "Valid Rules Analysis", maxMarks: 4, description: "Explains Modus Ponens and Modus Tollens with premises and conclusions" },
          { criterion: "Affirming Consequent Fallacy", maxMarks: 3, description: "Details invalid structure and provides counterexample truth row" },
          { criterion: "Denying Antecedent Fallacy", maxMarks: 3, description: "Details invalid structure and provides counterexample truth row" },
        ],
      },
      {
        id: "wt-math-9",
        prompt:
          "Prove by direct proof that the square of any odd integer is of the form 8k + 1 for some integer k ∈ ℤ. State all algebraic lemmas and factoring steps clearly.",
        modelAnswer:
          "Theorem: If n is an odd integer, then n² = 8k + 1 for some integer k ∈ ℤ.\n\nDirect Proof:\n1. Representation of Odd Integer:\nBy definition of an odd integer, n can be expressed as n = 2m + 1 for some integer m ∈ ℤ.\n\n2. Squaring the Expression:\nn² = (2m + 1)² = 4m² + 4m + 1 = 4m(m + 1) + 1.\n\n3. Analyzing the Product m(m + 1):\nExamine the term m(m + 1). Here m and m + 1 are two consecutive integers.\nIn any pair of consecutive integers, exactly one of them must be even.\n- Case 1: If m is even, then m = 2j for some integer j ∈ ℤ.\nThen m(m + 1) = 2j(2j + 1) = 2 [ j(2j + 1) ], which is a multiple of 2.\n- Case 2: If m is odd, then m + 1 is even, so m + 1 = 2j for some integer j ∈ ℤ.\nThen m(m + 1) = m(2j) = 2 [ mj ], which is also a multiple of 2.\nIn both cases, m(m + 1) = 2k for some integer k = j(2j + 1) or mj ∈ ℤ.\n\n4. Substituting into n²:\nn² = 4 [ m(m + 1) ] + 1 = 4 [ 2k ] + 1 = 8k + 1.\n\nConclusion:\nSince k is an integer, n² is strictly of the form 8k + 1, completing the proof.",
        keyRubricPoints: [
          "Represents odd integer as n = 2m + 1",
          "Squares expression to obtain n² = 4m(m + 1) + 1",
          "Proves consecutive integers m(m + 1) is always even (equal to 2k)",
          "Substitutes 2k to yield n² = 8k + 1",
        ],
        topic: "Proof Techniques",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "apply",
        expectedAnswerPoints: [
          "Odd integer definition n = 2m + 1",
          "Algebraic expansion to 4m(m + 1) + 1",
          "Lemma: Product of consecutive integers is divisible by 2",
          "Final substitution yielding 8k + 1",
        ],
        gradingRubric: [
          { criterion: "Odd Integer Setup", maxMarks: 2, description: "Correct representation n = 2m + 1" },
          { criterion: "Algebraic Expansion", maxMarks: 3, description: "Correct expansion and factoring to 4m(m + 1) + 1" },
          { criterion: "Parity Lemma", maxMarks: 3, description: "Proves m(m + 1) is even via consecutive integer cases" },
          { criterion: "Final Form & Conclusion", maxMarks: 2, description: "Arrives at 8k + 1 and concludes theorem" },
        ],
      },
      {
        id: "wt-math-10",
        prompt:
          "Explain Russell's Paradox in naive set theory. Show how the unrestricted comprehension axiom leads to a contradiction, and explain how modern axiomatic set theory (Zermelo-Fraenkel) eliminates this paradox.",
        modelAnswer:
          "1. Naive Set Theory & Unrestricted Comprehension:\nIn Cantor's naive set theory, any predicate P(x) can define a valid set: S = { x : P(x) }. This is known as the Unrestricted Comprehension Axiom.\n\n2. Formulation of Russell's Paradox (1901):\nBertrand Russell considered the predicate P(x) = 'x ∉ x' (sets that do not contain themselves as members).\nDefine set R = { x : x ∉ x } (the set of all sets that are not members of themselves).\nNow ask the fundamental question: Is R a member of itself (R ∈ R)?\n- Case 1: Assume R ∈ R.\nBy the membership condition of R, any member x must satisfy x ∉ x. Therefore, if R ∈ R, then R ∉ R. This is an immediate contradiction.\n- Case 2: Assume R ∉ R.\nThen R satisfies the defining condition for membership in R (namely, not being a member of itself). Therefore, R must be an element of R: R ∈ R. This is also a contradiction.\nIn classical two-valued logic: (R ∈ R) ⇔ (R ∉ R), which is a catastrophic contradiction (P ↔ ¬P is always False).\n\n3. Resolution in Zermelo-Fraenkel Set Theory (ZFC):\nZFC resolves Russell's paradox by discarding Unrestricted Comprehension and replacing it with the Axiom Schema of Restricted Separation (or Specification):\nSubsets can only be formed by filtering elements from an EXISTING set: { x ∈ A : P(x) }.\nSince there is no universal set of all sets from which to filter, Russell's collection R is not a legitimate set (it is a proper class, not an element of the mathematical universe), thereby preserving logical consistency.",
        keyRubricPoints: [
          "Defines naive unrestricted comprehension axiom { x : P(x) }",
          "Constructs Russell's set R = { x : x ∉ x }",
          "Demonstrates contradiction: R ∈ R ⇒ R ∉ R, and R ∉ R ⇒ R ∈ R",
          "Explains ZFC Axiom of Specification { x ∈ A : P(x) } and elimination of the universal set",
        ],
        topic: "Set Theory",
        marks: 10,
        difficulty: "advanced",
        actionVerb: "explain",
        expectedAnswerPoints: [
          "Naive set theory and unrestricted comprehension",
          "Russell's set definition R = { x : x ∉ x }",
          "Mutual contradiction derivation (R ∈ R ↔ R ∉ R)",
          "Zermelo-Fraenkel restricted separation resolution",
        ],
        gradingRubric: [
          { criterion: "Naive Set Theory Context", maxMarks: 2, description: "Explains unrestricted comprehension postulate" },
          { criterion: "Paradox Formulation", maxMarks: 4, description: "Clearly traces both cases (R ∈ R and R ∉ R) to contradiction" },
          { criterion: "ZFC Axiomatic Resolution", maxMarks: 3, description: "Explains restricted separation axiom and proper classes" },
          { criterion: "Epistemological Synthesis", maxMarks: 1, description: "Notes significance for mathematical foundations" },
        ],
      },
    ],
    fillBlanks: [
      {
        id: "fb-math-1",
        sentenceWithBlank:
          "A compound proposition that is always true for all possible truth values of its constituent variables is called a [tautology].",
        blankAnswer: "tautology",
        acceptedAlternatives: ["valid proposition", "Tautology"],
        hint: "Opposite of contradiction...",
        explanation:
          "A tautology evaluates to True under all truth assignments (e.g., P ∨ ¬P).",
        topic: "Truth Tables",
        blankType: "terminology",
      },
      {
        id: "fb-math-2",
        sentenceWithBlank:
          "The negation of the universal statement ∀x P(x) is logically equivalent to ∃x [¬P(x)].",
        blankAnswer: "¬P(x)",
        acceptedAlternatives: ["not P(x)", "~P(x)", "!P(x)"],
        hint: "Negating the predicate...",
        explanation:
          "Negating universal quantification requires an existential quantifier with negated predicate.",
        topic: "Quantifiers",
        blankType: "formula",
      },
      {
        id: "fb-math-3",
        sentenceWithBlank:
          "A conditional proposition P → Q with a False antecedent is always considered [true] regardless of the consequent.",
        blankAnswer: "true",
        acceptedAlternatives: ["True", "vacuously true"],
        hint: "Vacuous truth condition...",
        explanation:
          "When P is False, ¬P ∨ Q is automatically True; thus False implies anything.",
        topic: "Implications",
        blankType: "principle",
      },
      {
        id: "fb-math-4",
        sentenceWithBlank:
          "If a finite set S contains n distinct elements, the cardinality of its power set P(S) is [2^n].",
        blankAnswer: "2^n",
        acceptedAlternatives: ["2**n", "2 to the power of n"],
        hint: "Exponential cardinality formula...",
        explanation:
          "Each element has 2 choices (included or excluded), giving 2^n total subsets.",
        topic: "Set Theory",
        blankType: "formula",
      },
      {
        id: "fb-math-5",
        sentenceWithBlank:
          "For the implication P → Q, the statement ¬Q → ¬P is called the [contrapositive].",
        blankAnswer: "contrapositive",
        acceptedAlternatives: ["Contrapositive"],
        hint: "The only equivalent conditional form...",
        explanation:
          "The contrapositive reverses and negates both propositions and is logically equivalent to P → Q.",
        topic: "Implications",
        blankType: "terminology",
      },
      {
        id: "fb-math-6",
        sentenceWithBlank:
          "A binary relation that is simultaneously reflexive, symmetric, and transitive is classified as an [equivalence] relation.",
        blankAnswer: "equivalence",
        acceptedAlternatives: ["Equivalence", "equivalence relation"],
        hint: "Partitions a set into equivalence classes...",
        explanation:
          "Equivalence relations satisfy all three core axioms and partition sets.",
        topic: "Relations",
        blankType: "classification",
      },
      {
        id: "fb-math-7",
        sentenceWithBlank:
          "The deductive rule of inference that infers Q from premises [P → Q] and [P] is called [Modus Ponens].",
        blankAnswer: "Modus Ponens",
        acceptedAlternatives: ["modus ponens", "MP"],
        hint: "Latin for 'method of affirming'...",
        explanation:
          "Modus Ponens affirms the antecedent to validly deduce the consequent.",
        topic: "Inference Rules",
        blankType: "terminology",
      },
      {
        id: "fb-math-8",
        sentenceWithBlank:
          "A mathematical function that is both injective (one-to-one) and surjective (onto) is called [bijective].",
        blankAnswer: "bijective",
        acceptedAlternatives: ["a bijection", "Bijective", "one-to-one correspondence"],
        hint: "Guarantees a two-sided inverse exists...",
        explanation:
          "Bijective functions possess an exact two-sided inverse f⁻¹.",
        topic: "Functions",
        blankType: "terminology",
      },
      {
        id: "fb-math-9",
        sentenceWithBlank:
          "De Morgan's law states that ¬(P ∧ Q) is logically equivalent to ¬P ∨ [¬Q].",
        blankAnswer: "¬Q",
        acceptedAlternatives: ["not Q", "~Q", "!Q"],
        hint: "Negate the second conjunct...",
        explanation:
          "Negating a conjunction turns it into a disjunction of negations.",
        topic: "Equivalences",
        blankType: "formula",
      },
      {
        id: "fb-math-10",
        sentenceWithBlank:
          "In mathematical induction, proving the statement for the initial boundary value n = 1 is called the [base] step.",
        blankAnswer: "base",
        acceptedAlternatives: ["basis", "Base", "basis step"],
        hint: "Starting anchor of the induction...",
        explanation:
          "The base step anchors the induction before the inductive step links k to k + 1.",
        topic: "Induction",
        blankType: "process",
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
        front: "What is the formal mathematical condition for a relation R to be in First Normal Form (1NF)?",
        back: "A relation R is in 1NF if and only if:\n1. The domain of all attributes consists of atomic (indivisible) values.\n2. There are no repeating groups, composite attributes, or multivalued attributes (nested relations).\n3. Every tuple is uniquely identifiable via a designated Primary Key.",
        topic: "Normalization",
        cardType: "definition",
        difficulty: "foundational",
        mastery: "mastered",
        starred: true,
        reviewCount: 6,
        lastReviewedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "fc-db-2",
        front: "Define Second Normal Form (2NF) and specify exactly which dependency type it eliminates.",
        back: "A relation R is in 2NF iff it is in 1NF and every non-prime attribute is fully functionally dependent on every candidate key.\nIt strictly eliminates Partial Dependencies, where an attribute A depends on a proper subset of a composite candidate key: X → A where X ⊂ CK.",
        topic: "Normalization",
        cardType: "concept",
        difficulty: "intermediate",
        mastery: "familiar",
        starred: true,
        reviewCount: 4,
        lastReviewedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: "fc-db-3",
        front: "State the formal definition of Third Normal Form (3NF) and the condition that relaxes it relative to BCNF.",
        back: "A relation R is in 3NF iff for every non-trivial functional dependency X → A:\n1. X is a superkey of R, OR\n2. A is a prime attribute (a member of some candidate key of R).\nThe second condition allows transitive dependencies as long as the dependent attribute is prime, which permits dependency preservation.",
        topic: "Normalization",
        cardType: "concept",
        difficulty: "intermediate",
        mastery: "learning",
        starred: false,
        reviewCount: 3,
        lastReviewedAt: new Date(Date.now() - 3600000 * 15).toISOString(),
      },
      {
        id: "fc-db-4",
        front: "What is Boyce-Codd Normal Form (BCNF) and why is it considered strictly stronger than 3NF?",
        back: "A relation R is in BCNF iff for every non-trivial functional dependency X → A, X is a superkey of R.\nIt is strictly stronger than 3NF because it removes the second relaxation clause ('A is prime'). Every determinant in BCNF must be a superkey, eliminating all update anomalies caused by functional dependencies.",
        topic: "Normalization",
        cardType: "concept",
        difficulty: "advanced",
        mastery: "learning",
        starred: true,
        reviewCount: 2,
        lastReviewedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: "fc-db-5",
        front: "State Armstrong's Axioms for functional dependencies and prove that they are sound and complete.",
        back: "1. Reflexivity: If Y ⊆ X, then X → Y.\n2. Augmentation: If X → Y, then XZ → YZ for any attribute set Z.\n3. Transitivity: If X → Y and Y → Z, then X → Z.\nSoundness means any dependency generated holds in every legal relation instance; completeness means any dependency that holds in all instances can be derived using these three rules.",
        topic: "Functional Dependencies",
        cardType: "formula",
        difficulty: "advanced",
        mastery: "familiar",
        starred: false,
        reviewCount: 4,
        lastReviewedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: "fc-db-6",
        front: "What is the Lossless-Join Decomposition Theorem for binary relation decompositions?",
        back: "A decomposition of relation R into R1 and R2 is lossless-join with respect to functional dependency set F if and only if:\n(R1 ∩ R2) → R1 ∈ F+  OR  (R1 ∩ R2) → R2 ∈ F+\nThat is, the common attribute set must form a superkey for at least one of the decomposed relations.",
        topic: "Decomposition Theory",
        cardType: "formula",
        difficulty: "advanced",
        mastery: "familiar",
        starred: true,
        reviewCount: 3,
        lastReviewedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        id: "fc-db-7",
        front: "Explain Dependency Preservation in relational decomposition and how it differs from Lossless Join.",
        back: "A decomposition D = {R1, R2, ..., Rn} preserves dependencies if (F1 ∪ F2 ∪ ... ∪ Fn)+ = F+, where Fi is the projection of F onto Ri.\nLossless join guarantees no spurious tuples are created upon rejoining; dependency preservation ensures integrity constraints can be validated locally in decomposed tables without executing costly joins across tables.",
        topic: "Decomposition Theory",
        cardType: "concept",
        difficulty: "advanced",
        mastery: "unfamiliar",
        starred: false,
        reviewCount: 1,
        lastReviewedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: "fc-db-8",
        front: "Define the ACID properties of database transactions and map each to its primary recovery/engine mechanism.",
        back: "1. Atomicity: All operations execute or none do (Undo Log / Rollback segment).\n2. Consistency: Database transitions from one valid state satisfying all invariants to another (Application constraints & foreign keys).\n3. Isolation: Concurrent execution produces the same result as serial execution (2PL / Locks / MVCC).\n4. Durability: Committed updates survive power loss and crashes (Write-Ahead Logging / Redo Log).",
        topic: "Transactions",
        cardType: "definition",
        difficulty: "foundational",
        mastery: "mastered",
        starred: false,
        reviewCount: 5,
        lastReviewedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "fc-db-9",
        front: "Explain the four ANSI SQL Transaction Isolation Levels in order of increasing isolation.",
        back: "1. Read Uncommitted: Transactions can read uncommitted dirty data; allows Dirty Reads, Non-repeatable Reads, and Phantoms.\n2. Read Committed: Reads only committed data; prevents Dirty Reads; allows Non-repeatable Reads and Phantoms.\n3. Repeatable Read: Re-reading the same row within a transaction yields identical data; prevents Dirty & Non-repeatable Reads; allows Phantoms.\n4. Serializable: Full serial execution equivalence; prevents all three phenomena via range locks or SSI.",
        topic: "Concurrency Control",
        cardType: "concept",
        difficulty: "intermediate",
        mastery: "familiar",
        starred: false,
        reviewCount: 3,
        lastReviewedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      },
      {
        id: "fc-db-10",
        front: "Differentiate between Dirty Read, Non-repeatable Read, and Phantom Read phenomena.",
        back: "• Dirty Read: T1 modifies a row without committing; T2 reads that uncommitted row; T1 then rolls back.\n• Non-repeatable Read: T1 reads a row; T2 modifies or deletes that row and commits; T1 re-reads the row and sees changed values.\n• Phantom Read: T1 reads a set of rows satisfying a WHERE condition; T2 inserts or deletes rows matching that condition and commits; T1 re-executes the query and sees a different count/set of rows.",
        topic: "Concurrency Control",
        cardType: "concept",
        difficulty: "intermediate",
        mastery: "familiar",
        starred: false,
        reviewCount: 4,
        lastReviewedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: "fc-db-11",
        front: "What is Two-Phase Locking (2PL) and what is the difference between Basic 2PL, Strict 2PL, and Rigorous 2PL?",
        back: "2PL enforces serializability by dividing transaction lock management into two phases: Growing Phase (acquires locks, releases none) and Shrinking Phase (releases locks, acquires none).\n• Basic 2PL: Releases locks during shrinking phase before transaction commits (vulnerable to cascading aborts).\n• Strict 2PL: Holds all exclusive (write) locks until COMMIT/ABORT (eliminates cascading aborts).\n• Rigorous 2PL: Holds ALL locks (shared and exclusive) until COMMIT/ABORT.",
        topic: "Concurrency Control",
        cardType: "concept",
        difficulty: "advanced",
        mastery: "learning",
        starred: true,
        reviewCount: 2,
        lastReviewedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
      },
      {
        id: "fc-db-12",
        front: "Describe the structural properties of a B+ Tree index in relational storage engines.",
        back: "• Balanced multi-way search tree where all leaf nodes reside at the exact same depth.\n• Internal nodes store search keys and child pointers purely for guiding navigation.\n• Leaf nodes store actual record pointers (or table rows in clustered index) and are connected via a doubly-linked list for sequential range scans.\n• Search, insertion, and deletion exhibit worst-case logarithmic time complexity O(log_B N).",
        topic: "Indexing & Physical Storage",
        cardType: "concept",
        difficulty: "intermediate",
        mastery: "mastered",
        starred: false,
        reviewCount: 5,
        lastReviewedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: "fc-db-13",
        front: "Contrast Clustered Index with Non-Clustered (Secondary) Index.",
        back: "• Clustered Index: Determines the actual physical sequential ordering of rows on disk. A table can possess only ONE clustered index (usually the Primary Key). The leaf pages contain the entire table row data.\n• Non-Clustered Index: A separate B+ tree structure containing the index key and a pointer (bookmark/clustering key value) to the actual physical row. A table can have multiple non-clustered indexes.",
        topic: "Indexing & Physical Storage",
        cardType: "concept",
        difficulty: "intermediate",
        mastery: "familiar",
        starred: false,
        reviewCount: 3,
        lastReviewedAt: new Date(Date.now() - 3600000 * 16).toISOString(),
      },
      {
        id: "fc-db-14",
        front: "What is the logical query processing order of an SQL SELECT statement?",
        back: "The logical processing sequence is:\n1. FROM (including JOINs and ON clauses)\n2. WHERE (row-level filtering)\n3. GROUP BY (aggregating rows into groups)\n4. HAVING (group-level filtering)\n5. SELECT (evaluating column expressions, window functions, and aliases)\n6. DISTINCT\n7. ORDER BY\n8. LIMIT / OFFSET",
        topic: "SQL Engine Execution",
        cardType: "concept",
        difficulty: "intermediate",
        mastery: "mastered",
        starred: false,
        reviewCount: 6,
        lastReviewedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: "fc-db-15",
        front: "Define a Canonical Cover (Fc) of a set of functional dependencies F and explain its construction.",
        back: "A canonical cover Fc for F is a minimal set of dependencies equivalent to F (Fc+ = F+) such that:\n1. Every dependency in Fc has a single attribute on its right-hand side (X → A).\n2. No dependency contains extraneous attributes on its left-hand side (no redundant attributes in determinant).\n3. No dependency in Fc is redundant (removing any dependency alters the closure Fc+).",
        topic: "Functional Dependencies",
        cardType: "procedure",
        difficulty: "advanced",
        mastery: "learning",
        starred: true,
        reviewCount: 2,
        lastReviewedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
      {
        id: "fc-db-16",
        front: "What is the Write-Ahead Logging (WAL) protocol and what guarantee does it enforce?",
        back: "The WAL protocol dictates that:\n1. Any log record describing an update (containing old before-image and new after-image) must be flushed to non-volatile disk BEFORE the corresponding dirty data page is written to disk.\n2. All transaction log records up to the COMMIT record must be forced to disk before the transaction commit is acknowledged.\nThis guarantees the durability of committed updates (Redo) and atomicity through rollback (Undo).",
        topic: "Transactions & Recovery",
        cardType: "concept",
        difficulty: "advanced",
        mastery: "unfamiliar",
        starred: false,
        reviewCount: 1,
        lastReviewedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
      },
    ],
    quizzes: [
      {
        id: "qz-db-1",
        question:
          "Given relation R(A, B, C, D) with candidate key (A, B) and functional dependencies F = { (A, B) → D, B → C }. Which normal form does relation R satisfy, and which normal form is violated?",
        options: [
          "Satisfies 1NF; violates 2NF due to partial dependency B → C.",
          "Satisfies 2NF; violates 3NF due to transitive dependency B → C.",
          "Satisfies 3NF; violates BCNF because B is not a superkey.",
          "Satisfies BCNF because (A, B) uniquely identifies all tuples in R.",
        ],
        correctIndex: 0,
        explanation:
          "The candidate key is (A, B). Attribute C is a non-prime attribute that depends on B, which is a proper subset of the composite candidate key. This constitutes a partial dependency, violating 2NF. Therefore, R is in 1NF only.",
        topic: "Normalization",
        difficulty: "medium",
        questionType: "conceptual-reasoning",
        conceptTested: "Second Normal Form (2NF) and Partial Dependency Identification",
        distractorRationale: [
          "Correct answer: partial dependency violates 2NF.",
          "Incorrect: R does not satisfy 2NF because of the partial dependency on part of the composite key.",
          "Incorrect: R fails at 2NF, so it cannot satisfy 3NF.",
          "Incorrect: B → C directly violates 2NF, 3NF, and BCNF.",
        ],
      },
      {
        id: "qz-db-2",
        question:
          "Which SQL JOIN statement returns all rows from the left table and matched rows from the right table, populating NULL values for all right-table columns when no matching row exists?",
        options: [
          "INNER JOIN",
          "RIGHT OUTER JOIN",
          "LEFT OUTER JOIN",
          "CROSS JOIN",
        ],
        correctIndex: 2,
        explanation:
          "LEFT OUTER JOIN guarantees that every tuple from the left relation appears in the result. If no matching row exists in the right relation meeting the ON predicate, NULLs are generated for the right relation's attributes.",
        topic: "SQL Joins",
        difficulty: "easy",
        questionType: "multiple-choice",
        conceptTested: "Relational Algebra Outer Joins",
        distractorRationale: [
          "INNER JOIN filters out any rows that do not have a match in both tables.",
          "RIGHT OUTER JOIN preserves all rows from the right table, not the left.",
          "Correct answer: LEFT OUTER JOIN preserves left-hand tuples.",
          "CROSS JOIN produces a Cartesian product (M * N tuples) without predicate matching.",
        ],
      },
      {
        id: "qz-db-3",
        question:
          "Consider relation R(A, B, C) with functional dependencies F = { A → B, B → C }. What is the highest normal form satisfied by relation R?",
        options: [
          "1NF",
          "2NF",
          "3NF",
          "BCNF",
        ],
        correctIndex: 1,
        explanation:
          "The candidate key is A (since A+ = {A, B, C}). Relation R has a single-attribute primary key, so no partial dependencies can exist, satisfying 2NF. However, B → C represents a transitive dependency where non-prime attribute C depends on non-prime attribute B (and B is not a superkey). This violates 3NF, making 2NF the highest normal form.",
        topic: "Normalization",
        difficulty: "medium",
        questionType: "conceptual-reasoning",
        conceptTested: "Transitive Dependencies and 3NF Verification",
        distractorRationale: [
          "Incorrect: R satisfies 2NF because the key is non-composite.",
          "Correct answer: R satisfies 2NF but violates 3NF due to B → C.",
          "Incorrect: B is not a superkey and C is not prime, violating 3NF.",
          "Incorrect: Since it violates 3NF, it cannot satisfy BCNF.",
        ],
      },
      {
        id: "qz-db-4",
        question:
          "Given relation R(A, B, C) with dependencies F = { AB → C, C → B }. What are the candidate keys of R, and what is its highest normal form?",
        options: [
          "Candidate keys: {AB, AC}; highest normal form is 3NF (violates BCNF).",
          "Candidate key: {AB}; highest normal form is 2NF.",
          "Candidate keys: {AB, AC}; highest normal form is BCNF.",
          "Candidate keys: {AB, C}; highest normal form is 3NF.",
        ],
        correctIndex: 0,
        explanation:
          "To find candidate keys: (AB)+ = {A, B, C}. From C → B, (AC)+ = {A, B, C}. Thus, the candidate keys are {AB} and {AC}, and the prime attributes are A, B, and C. In dependency C → B, C is not a superkey, but B is a prime attribute (part of key AB). By the prime-attribute relaxation clause of 3NF, R is in 3NF. However, because C is not a superkey, R violates BCNF.",
        topic: "Normalization",
        difficulty: "hard",
        questionType: "scenario-based",
        conceptTested: "3NF Prime Attribute Clause vs BCNF Determinant Rule",
        distractorRationale: [
          "Correct answer: candidate keys are AB and AC; 3NF holds due to prime attribute B.",
          "Incorrect: AC is also a candidate key since (AC)+ = ABC.",
          "Incorrect: C → B violates BCNF because determinant C is not a superkey.",
          "Incorrect: C alone is not a candidate key; C+ = {B, C}, which does not determine A.",
        ],
      },
      {
        id: "qz-db-5",
        question:
          "Under standard ANSI SQL-92 isolation levels, which concurrency phenomenon is permitted under REPEATABLE READ but prevented under SERIALIZABLE?",
        options: [
          "Dirty Read",
          "Non-repeatable Read",
          "Phantom Read",
          "Lost Update",
        ],
        correctIndex: 2,
        explanation:
          "Under standard ANSI SQL, REPEATABLE READ prevents Dirty Reads and Non-repeatable (Fuzzy) Reads by holding read locks on accessed rows, but does not prevent Phantom Reads (where a concurrent transaction inserts new rows matching a query predicate). Only SERIALIZABLE prevents Phantom Reads via predicate/range locks or snapshot serialization.",
        topic: "Concurrency Control",
        difficulty: "medium",
        questionType: "multiple-choice",
        conceptTested: "ANSI SQL Isolation Levels & Concurrency Anomalies",
        distractorRationale: [
          "Dirty Reads are prevented in Read Committed and higher.",
          "Non-repeatable Reads are prevented in Repeatable Read and higher.",
          "Correct answer: Phantom Reads are permitted in Repeatable Read and blocked in Serializable.",
          "Lost Updates are prevented by write locks in standard isolation levels.",
        ],
      },
      {
        id: "qz-db-6",
        question:
          "A relation R(A, B, C) is decomposed into R1(A, B) and R2(B, C). According to the Lossless-Join Decomposition Theorem, this decomposition is lossless with respect to dependency set F if and only if:",
        options: [
          "B → A ∈ F+ or B → C ∈ F+",
          "A → B ∈ F+ and B → C ∈ F+",
          "R1 ∩ R2 = ∅",
          "A → C ∈ F+",
        ],
        correctIndex: 0,
        explanation:
          "The intersection of R1 and R2 is R1 ∩ R2 = {B}. A binary decomposition is lossless-join iff R1 ∩ R2 → R1 or R1 ∩ R2 → R2. In this case, B must functionally determine either A (making B a superkey of R1) or C (making B a superkey of R2).",
        topic: "Decomposition Theory",
        difficulty: "medium",
        questionType: "conceptual-reasoning",
        conceptTested: "Lossless-Join Theorem for Binary Decompositions",
        distractorRationale: [
          "Correct answer: the common attribute B must determine all of R1 or all of R2.",
          "Incorrect: A → B does not make the intersection {B} a determinant.",
          "Incorrect: An empty intersection results in a Cartesian product (lossy join).",
          "Incorrect: A → C does not relate the intersection attribute B to the subschemas.",
        ],
      },
      {
        id: "qz-db-7",
        question:
          "What fundamental property of transaction schedules is guaranteed by the Two-Phase Locking (2PL) protocol?",
        options: [
          "Freedom from deadlocks",
          "Conflict Serializability",
          "Freedom from starvation",
          "Immediate consistency without aborts",
        ],
        correctIndex: 1,
        explanation:
          "The 2PL theorem guarantees that any schedule produced by a set of transactions following the Two-Phase Locking protocol is conflict serializable. However, Basic 2PL does NOT prevent deadlocks, nor does it prevent cascading rollbacks (which requires Strict 2PL).",
        topic: "Concurrency Control",
        difficulty: "medium",
        questionType: "multiple-choice",
        conceptTested: "Serializability Guarantees of Two-Phase Locking",
        distractorRationale: [
          "Incorrect: 2PL is susceptible to deadlocks, requiring graph wait-for detection or timeouts.",
          "Correct answer: 2PL mathematically guarantees conflict serializability.",
          "Incorrect: Starvation can still occur under standard lock acquisition queues.",
          "Incorrect: Transactions may be aborted to resolve deadlocks.",
        ],
      },
      {
        id: "qz-db-8",
        question:
          "During the execution of a SQL query containing WHERE, GROUP BY, HAVING, and SELECT clauses, what is the exact chronological order of evaluation?",
        options: [
          "SELECT → FROM → WHERE → GROUP BY → HAVING",
          "FROM → WHERE → GROUP BY → HAVING → SELECT",
          "FROM → GROUP BY → WHERE → HAVING → SELECT",
          "FROM → WHERE → SELECT → GROUP BY → HAVING",
        ],
        correctIndex: 1,
        explanation:
          "The relational engine first builds the base table set in FROM, then filters rows using WHERE before grouping. Next, rows are grouped via GROUP BY, grouped aggregations are filtered via HAVING, and finally column projections and expressions are evaluated in SELECT.",
        topic: "SQL Engine Execution",
        difficulty: "easy",
        questionType: "application",
        conceptTested: "SQL Logical Processing Order",
        distractorRationale: [
          "Incorrect: SELECT is evaluated near the end, which is why column aliases cannot be used in WHERE.",
          "Correct answer: FROM → WHERE → GROUP BY → HAVING → SELECT.",
          "Incorrect: WHERE filters rows BEFORE grouping, not after.",
          "Incorrect: SELECT cannot execute before aggregation and filtering.",
        ],
      },
      {
        id: "qz-db-9",
        question:
          "In modern relational database storage engines (e.g., InnoDB, PostgreSQL), why are the leaf nodes of a B+ Tree structured as a doubly linked list?",
        options: [
          "To allow constant-time O(1) random key lookups from any depth.",
          "To enable high-throughput sequential range scans without re-traversing the tree from the root.",
          "To eliminate the need for page splits during transaction inserts.",
          "To compress variable-length character columns into fixed-size blocks.",
        ],
        correctIndex: 1,
        explanation:
          "In a B+ Tree, all data records/pointers reside in the leaf nodes. Connecting leaf pages via a doubly-linked list allows range queries (e.g., WHERE age BETWEEN 20 AND 30) to perform a single logarithmic search to the starting leaf and then scan sequentially along the linked list without repeated tree traversals.",
        topic: "Indexing & Physical Storage",
        difficulty: "hard",
        questionType: "conceptual-reasoning",
        conceptTested: "B+ Tree Index Architecture and Range Query Mechanics",
        distractorRationale: [
          "Incorrect: Random lookups still require O(log N) tree navigation from the root.",
          "Correct answer: Linked leaves provide efficient sequential scans for range queries.",
          "Incorrect: B+ Trees still require page splits when a node exceeds maximum fanout.",
          "Incorrect: The linked list structure does not perform columnar data compression.",
        ],
      },
      {
        id: "qz-db-10",
        question:
          "When decomposing a relation into Boyce-Codd Normal Form (BCNF), which desirable relational design property is NOT guaranteed to be preserved?",
        options: [
          "Lossless-Join property",
          "Elimination of insertion anomalies",
          "Dependency Preservation",
          "Elimination of deletion anomalies",
        ],
        correctIndex: 2,
        explanation:
          "While 3NF guarantees BOTH a lossless-join decomposition and dependency preservation, BCNF decomposition always guarantees a lossless join but CANNOT always guarantee dependency preservation. Some functional dependencies may span across decomposed relations.",
        topic: "Decomposition Theory",
        difficulty: "hard",
        questionType: "conceptual-reasoning",
        conceptTested: "BCNF vs 3NF Decomposition Trade-offs",
        distractorRationale: [
          "Incorrect: Lossless join can always be achieved in BCNF decompositions.",
          "Incorrect: BCNF completely eliminates insertion anomalies caused by functional dependencies.",
          "Correct answer: BCNF decompositions may lose functional dependencies.",
          "Incorrect: BCNF eliminates deletion anomalies resulting from redundant determinants.",
        ],
      },
      {
        id: "qz-db-11",
        question:
          "In the ARIES (Algorithms for Recovery and Isolation Exploiting Semantics) crash recovery protocol, what is the precise sequential order of recovery phases after a system failure?",
        options: [
          "Undo Phase → Redo Phase → Analysis Phase",
          "Analysis Phase → Redo Phase → Undo Phase",
          "Redo Phase → Analysis Phase → Undo Phase",
          "Analysis Phase → Undo Phase → Redo Phase",
        ],
        correctIndex: 1,
        explanation:
          "ARIES executes in three distinct phases: 1) Analysis Phase: scans log forward from last checkpoint to determine active transactions and dirty pages at the time of crash; 2) Redo Phase: repeats history by replaying logged updates forward to restore database state; 3) Undo Phase: rolls back uncommitted transactions in reverse chronological order.",
        topic: "Transactions & Recovery",
        difficulty: "hard",
        questionType: "multiple-choice",
        conceptTested: "ARIES Crash Recovery Protocol Sequence",
        distractorRationale: [
          "Incorrect: Analysis must run first to identify which transactions must be undone.",
          "Correct answer: Analysis → Redo ('repeating history') → Undo (rolling back losers).",
          "Incorrect: Redo cannot start until Analysis determines the Dirty Page Table.",
          "Incorrect: Undo runs after Redo to ensure the physical state reflects all logged actions.",
        ],
      },
      {
        id: "qz-db-12",
        question:
          "Which secondary inference rule derived from Armstrong's Axioms states that: If X → Y and WY → Z, then WX → Z?",
        options: [
          "Union Rule",
          "Decomposition Rule",
          "Pseudotransitivity Rule",
          "Composition Rule",
        ],
        correctIndex: 2,
        explanation:
          "The Pseudotransitivity rule asserts that if X → Y holds and WY → Z holds, then augmenting X → Y with W gives WX → WY, and by transitivity with WY → Z, we obtain WX → Z.",
        topic: "Functional Dependencies",
        difficulty: "medium",
        questionType: "application",
        conceptTested: "Armstrong Axiom Derivations (Pseudotransitivity)",
        distractorRationale: [
          "The Union rule states: If X → Y and X → Z, then X → YZ.",
          "The Decomposition rule states: If X → YZ, then X → Y and X → Z.",
          "Correct answer: Pseudotransitivity states: X → Y and WY → Z implies WX → Z.",
          "The Composition rule states: If X → Y and A → B, then XA → YB.",
        ],
      },
    ],
    writtenTests: [
      {
        id: "wt-db-1",
        prompt:
          "Compare Third Normal Form (3NF) and Boyce-Codd Normal Form (BCNF). Formally state the mathematical conditions for both normal forms, explain why BCNF is strictly stronger, and construct an example of a relation schema that satisfies 3NF but violates BCNF, identifying candidate keys and the offending dependency.",
        modelAnswer:
          "1. Formal Definitions:\n• A relation R is in 3NF iff for every non-trivial functional dependency X → A in F+, either:\n   (a) X is a superkey of R, OR\n   (b) A is a prime attribute (A is a member of some candidate key of R).\n• A relation R is in BCNF iff for every non-trivial functional dependency X → A in F+, X is a superkey of R.\n\n2. Why BCNF is Strictly Stronger:\nBCNF eliminates the prime attribute relaxation clause. In 3NF, a dependency X → A where X is NOT a superkey is permitted if A is prime. This allows redundancy and update anomalies to persist in 3NF. BCNF guarantees that every determinant is a superkey, eliminating all functional dependency-induced anomalies.\n\n3. Canonical Example:\nConsider relation R(Student, Subject, Teacher) with business rules:\n- Each student has at most one teacher for each subject: (Student, Subject) → Teacher\n- Each teacher teaches only one subject: Teacher → Subject\nCandidate keys: (Student, Subject) and (Student, Teacher).\nPrime attributes: {Student, Subject, Teacher}.\nEvaluation:\n• (Student, Subject) → Teacher: determinant is candidate key (satisfies both 3NF and BCNF).\n• Teacher → Subject: Teacher is NOT a superkey (Teacher+ = {Teacher, Subject} does not determine Student). However, Subject IS a prime attribute. Thus, R satisfies 3NF.\n• But in BCNF, Teacher must be a superkey, which it is not. Hence, R violates BCNF.",
        marks: 10,
        actionVerb: "compare",
        difficulty: "hard",
        expectedAnswerPoints: [
          "Formal mathematical condition for 3NF with superkey OR prime attribute clause",
          "Formal mathematical condition for BCNF (determinant must be superkey)",
          "Clear explanation that BCNF removes the prime-attribute relaxation of 3NF",
          "Complete relation schema example with overlapping candidate keys showing 3NF satisfaction and BCNF violation",
        ],
        keyRubricPoints: [
          "Formal definition of 3NF and BCNF conditions (3 pts)",
          "Theoretical comparison and justification of why BCNF is strictly stronger (2 pts)",
          "Valid relation schema with functional dependencies and candidate keys calculated (3 pts)",
          "Demonstration of why the schema satisfies 3NF yet violates BCNF (2 pts)",
        ],
        gradingRubric: [
          { criterion: "Formal Definitions", maxMarks: 3, description: "Correct mathematical specification of 3NF and BCNF definitions." },
          { criterion: "Theoretical Rigor", maxMarks: 2, description: "Explains anomaly elimination and the prime-attribute relaxation trade-off." },
          { criterion: "Concrete Example Construction", maxMarks: 3, description: "Provides valid relation, dependencies, and derived candidate keys." },
          { criterion: "Proof of Normal Form Status", maxMarks: 2, description: "Demonstrates 3NF satisfaction and BCNF violation step-by-step." },
        ],
        topic: "Normalization",
      },
      {
        id: "wt-db-2",
        prompt:
          "Formally define the concepts of Lossless-Join Decomposition and Dependency Preservation. Given relation schema R(A, B, C, D, E) with functional dependencies F = { A → BC, CD → E, B → D, E → A }, determine candidate keys for R and evaluate whether decomposition into R1(A, B, C) and R2(A, D, E) is lossless-join and dependency-preserving.",
        modelAnswer:
          "1. Definitions:\n• Lossless-Join Decomposition: A decomposition D = {R1, R2} is lossless with respect to F iff for every legal instance r(R), π_R1(r) ⨝ π_R2(r) = r. For binary decompositions, this holds iff (R1 ∩ R2) → R1 ∈ F+ or (R1 ∩ R2) → R2 ∈ F+.\n• Dependency Preservation: Decomposition D = {R1, R2} preserves dependencies iff (F1 ∪ F2)+ = F+, where Fi is the projection of F onto Ri.\n\n2. Candidate Keys of R:\nCompute attribute closures:\n• A+ = {A, B, C, D, E} (since A → BC, B → D, and CD → E). Thus, A is a candidate key.\n• E → A, so E+ = {E, A, B, C, D}. Thus, E is a candidate key.\n• CD → E, and B → D, so BC+ = {B, C, D, E, A}. Thus, BC is a candidate key.\nCandidate keys: {A}, {E}, {BC}.\n\n3. Evaluation of Decomposition {R1(A, B, C), R2(A, D, E)}:\n• Lossless-Join: R1 ∩ R2 = {A}. In F+, A+ = {A, B, C, D, E}, which includes all attributes of R1 and R2. Since A → R1 and A → R2, the intersection is a superkey for both. Therefore, the decomposition IS LOSSLESS-JOIN.\n• Dependency Preservation: Project F onto R1 and R2:\n  - R1(A, B, C): F1 = {A → B, A → C, A → BC}.\n  - R2(A, D, E): F2 = {E → A, A → D, E → D}.\n  - Notice B → D cannot be enforced directly within R1 or R2 alone without computing a join. In (F1 ∪ F2)+, B+ = {B}, so B → D is lost. Therefore, the decomposition IS NOT DEPENDENCY-PRESERVING.",
        marks: 10,
        actionVerb: "evaluate",
        difficulty: "advanced",
        expectedAnswerPoints: [
          "Formal definitions of Lossless-Join and Dependency Preservation",
          "Closure computation and determination of candidate keys {A}, {E}, {BC}",
          "Lossless-join test verifying intersection {A} is a superkey of R1 and R2",
          "Dependency projection analysis showing B → D cannot be preserved without a join",
        ],
        keyRubricPoints: [
          "Accurate definitions of Lossless-Join and Dependency Preservation (2 pts)",
          "Correct computation of closures and candidate keys (3 pts)",
          "Rigorous proof of Lossless-Join condition using attribute intersection (3 pts)",
          "Verification of dependency preservation demonstrating loss of B → D (2 pts)",
        ],
        gradingRubric: [
          { criterion: "Theoretical Definitions", maxMarks: 2, description: "Mathematical definitions of lossless join and dependency preservation." },
          { criterion: "Candidate Key Derivation", maxMarks: 3, description: "Correct closures and derivation of candidate keys." },
          { criterion: "Lossless-Join Verification", maxMarks: 3, description: "Intersection testing and superkey proof." },
          { criterion: "Dependency Preservation Analysis", maxMarks: 2, description: "Projection of dependencies and proof of lost dependencies." },
        ],
        topic: "Decomposition Theory",
      },
      {
        id: "wt-db-3",
        prompt:
          "Explain how modern relational DBMS storage engines implement the ACID properties. Detail the architecture of Write-Ahead Logging (WAL), distinguishing between Steal/No-Steal and Force/No-Force buffer management policies, and explain how ARIES accomplishes recovery.",
        modelAnswer:
          "1. Implementation of ACID Properties:\n• Atomicity & Durability: Implemented via the recovery manager and Write-Ahead Logging (WAL) using undo and redo log records.\n• Consistency: Implemented via declarative integrity constraints (PRIMARY KEY, FOREIGN KEY, CHECK) and transaction commit validations.\n• Isolation: Implemented via concurrency control mechanisms (Two-Phase Locking, Multi-Version Concurrency Control (MVCC), or Snapshot Isolation).\n\n2. Buffer Pool Management Policies:\n• Steal vs No-Steal: A 'Steal' policy allows the buffer manager to flush dirty pages belonging to uncommitted transactions to disk to free memory frames. Requires UNDO logging to rollback aborted transactions.\n• Force vs No-Force: A 'No-Force' policy allows a transaction to commit without immediately forcing all its dirty pages to disk. Requires REDO logging to re-apply committed changes upon a crash.\n• Modern DBMSs (PostgreSQL, MySQL InnoDB, SQL Server) employ Steal / No-Force for maximum I/O performance.\n\n3. Write-Ahead Logging (WAL) Rules:\n(a) Write Rule: Any log record updating a data page must be flushed to disk before the dirty page itself is written to disk.\n(b) Commit Rule: All log records up to the transaction's COMMIT record must be forced to disk before the client receives commit acknowledgment.\n\n4. ARIES Crash Recovery Algorithm:\n• Phase 1 (Analysis): Scans forward from the last checkpoint to identify active ('loser') transactions and pages in the dirty page table (DPT).\n• Phase 2 (Redo): Replays history forward from the smallest recovery LSN in the DPT to restore the database to the exact state at the instant of crash (including uncommitted operations).\n• Phase 3 (Undo): Scans backward, undoing the operations of all active/loser transactions and generating Compensation Log Records (CLRs) to prevent repeat crashes during recovery.",
        marks: 10,
        actionVerb: "explain",
        difficulty: "hard",
        expectedAnswerPoints: [
          "Mapping of all 4 ACID properties to database subsystems",
          "Analysis of Steal/No-Steal and Force/No-Force buffer policies",
          "Two foundational rules of the Write-Ahead Logging protocol",
          "Detailed explanation of ARIES phases: Analysis, Redo (repeating history), and Undo",
        ],
        keyRubricPoints: [
          "ACID property engine mappings (2 pts)",
          "Buffer pool Steal/No-Force policy analysis (2 pts)",
          "WAL protocol rules (2 pts)",
          "ARIES recovery 3-phase execution and Compensation Log Records (4 pts)",
        ],
        gradingRubric: [
          { criterion: "ACID Architecture", maxMarks: 2, description: "Correct mapping to recovery and concurrency engines." },
          { criterion: "Buffer Pool Policies", maxMarks: 2, description: "Trade-offs of Steal/No-Steal and Force/No-Force." },
          { criterion: "WAL Mechanics", maxMarks: 2, description: "Write and commit log flush rules." },
          { criterion: "ARIES Recovery Phases", maxMarks: 4, description: "Analysis, Redo, Undo, and CLR operation." },
        ],
        topic: "Transactions & Recovery",
      },
      {
        id: "wt-db-4",
        prompt:
          "Detail the four ANSI SQL Transaction Isolation Levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable). Define the three classic read phenomena (Dirty Read, Non-repeatable Read, Phantom Read) and construct a concurrency schedule for each phenomenon showing how the anomaly manifests.",
        modelAnswer:
          "1. ANSI SQL Isolation Levels:\n• Read Uncommitted: Transactions can view uncommitted writes. Lowest isolation; highest throughput.\n• Read Committed: Reads only committed data. Prevents dirty reads; allows non-repeatable reads and phantom reads.\n• Repeatable Read: Ensures rows read by a transaction cannot be modified by other transactions until completion. Prevents dirty and non-repeatable reads; allows phantoms.\n• Serializable: Guarantees complete serial equivalence. Prevents all anomalies.\n\n2. Concurrency Anomalies & Schedules:\n• (A) Dirty Read:\n  - T1: UPDATE accounts SET balance = balance - 100 WHERE id = 1;\n  - T2: SELECT balance FROM accounts WHERE id = 1; (Reads reduced balance)\n  - T1: ROLLBACK;\n  - Consequence: T2 operated on dirty data that never officially existed in the database.\n\n• (B) Non-repeatable (Fuzzy) Read:\n  - T1: SELECT balance FROM accounts WHERE id = 1; (Reads 500)\n  - T2: UPDATE accounts SET balance = 800 WHERE id = 1; COMMIT;\n  - T1: SELECT balance FROM accounts WHERE id = 1; (Reads 800)\n  - Consequence: Re-reading the exact same row within a single transaction produces different data values.\n\n• (C) Phantom Read:\n  - T1: SELECT COUNT(*) FROM accounts WHERE balance > 1000; (Returns 5)\n  - T2: INSERT INTO accounts (id, balance) VALUES (99, 2000); COMMIT;\n  - T1: SELECT COUNT(*) FROM accounts WHERE balance > 1000; (Returns 6)\n  - Consequence: The predicate evaluation returns a new set of rows ('phantom' tuples) created by a concurrent transaction.",
        marks: 10,
        actionVerb: "describe",
        difficulty: "intermediate",
        expectedAnswerPoints: [
          "Accurate breakdown of the 4 ANSI SQL isolation levels",
          "Precise definitions of Dirty Read, Non-repeatable Read, and Phantom Read",
          "Interleaved SQL timeline/schedules demonstrating how each anomaly occurs",
          "Comparison of lock types (shared vs exclusive vs predicate/range locks) needed to prevent them",
        ],
        keyRubricPoints: [
          "Description of the 4 ANSI isolation levels (3 pts)",
          "Definitions and schedules for Dirty Read (2 pts)",
          "Definitions and schedules for Non-repeatable Read (2 pts)",
          "Definitions and schedules for Phantom Read and range locks (3 pts)",
        ],
        gradingRubric: [
          { criterion: "Isolation Level Definitions", maxMarks: 3, description: "Completeness and accuracy of isolation levels." },
          { criterion: "Dirty Read Analysis", maxMarks: 2, description: "Clear definition and concurrent execution timeline." },
          { criterion: "Non-repeatable Read Analysis", maxMarks: 2, description: "Clear definition and concurrent execution timeline." },
          { criterion: "Phantom Read Analysis", maxMarks: 3, description: "Clear definition, timeline, and predicate lock discussion." },
        ],
        topic: "Concurrency Control",
      },
      {
        id: "wt-db-5",
        prompt:
          "Analyze the Two-Phase Locking (2PL) protocol. Contrast Basic 2PL with Strict 2PL and Rigorous 2PL, explain why cascading rollbacks occur and how Strict 2PL eliminates them, and evaluate deadlock prevention strategies including Wait-Die and Wound-Wait schemes.",
        modelAnswer:
          "1. Two-Phase Locking (2PL) Mechanics:\nUnder 2PL, all lock operations are divided into two monotonic phases:\n• Growing (Expanding) Phase: Locks may be acquired; no locks may be released.\n• Shrinking (Contracting) Phase: Locks may be released; no new locks may be acquired.\nThe point at which the transaction acquires its final lock is the 'Lock Point'. 2PL guarantees Conflict Serializability.\n\n2. Variations of 2PL:\n• Basic 2PL: Locks are released gradually in the shrinking phase before transaction termination. Vulnerable to Cascading Aborts (if T1 releases an exclusive lock on X and T2 reads X, then T1 aborts, T2 must also abort).\n• Strict 2PL: All Exclusive (X) locks must be held until the transaction finishes (COMMIT or ABORT). Eliminates cascading aborts and guarantees strict schedules.\n• Rigorous 2PL: ALL locks (both Shared and Exclusive) are held until COMMIT/ABORT. Guarantees that transaction serialization order matches commit order.\n\n3. Deadlock Handling Schemes:\n2PL does not prevent deadlocks. Non-preemptive and preemptive timestamp-based schemes prevent deadlock using transaction timestamps TS(T):\n• Wait-Die (Non-preemptive): If Ti requests a resource held by Tj:\n  - If TS(Ti) < TS(Tj) (Ti is older), Ti is allowed to WAIT.\n  - If TS(Ti) > TS(Tj) (Ti is younger), Ti DIES (aborts and restarts with original timestamp).\n• Wound-Wait (Preemptive): If Ti requests a resource held by Tj:\n  - If TS(Ti) < TS(Tj) (Ti is older), Ti WOUNDS Tj (Tj is aborted and pre-empted).\n  - If TS(Ti) > TS(Tj) (Ti is younger), Ti is allowed to WAIT.\nWound-Wait minimizes aborts compared to Wait-Die because older transactions pre-empt younger ones only when necessary.",
        marks: 10,
        actionVerb: "analyze",
        difficulty: "advanced",
        expectedAnswerPoints: [
          "Definition of growing and shrinking phases and the lock point concept",
          "Distinction between Basic, Strict, and Rigorous 2PL",
          "Mechanics of cascading rollbacks and proof that Strict 2PL prevents them",
          "Algorithmic rules for Wait-Die and Wound-Wait deadlock prevention schemes",
        ],
        keyRubricPoints: [
          "2PL phases and serializability theorem (2 pts)",
          "Comparative breakdown of Basic, Strict, and Rigorous 2PL (3 pts)",
          "Cascading abort mechanics and Strict 2PL resolution (2 pts)",
          "Timestamp deadlock strategies (Wait-Die vs Wound-Wait) (3 pts)",
        ],
        gradingRubric: [
          { criterion: "2PL Principles", maxMarks: 2, description: "Correct explanation of phases and lock points." },
          { criterion: "2PL Variants", maxMarks: 3, description: "Differentiates Basic, Strict, and Rigorous locking." },
          { criterion: "Cascading Rollback", maxMarks: 2, description: "Explains anomaly and prevention via exclusive lock retention." },
          { criterion: "Deadlock Algorithms", maxMarks: 3, description: "Precise logic for Wait-Die and Wound-Wait schemes." },
        ],
        topic: "Concurrency Control",
      },
      {
        id: "wt-db-6",
        prompt:
          "Compare B+ Tree indexes with Hash indexes in relational database engines. Explain leaf and internal node structure, mathematical fanout, disk I/O cost O(log_B N), why B+ Trees are universally preferred for general-purpose relational engines, and when Hash indexes are superior.",
        modelAnswer:
          "1. Structural Comparison:\n• B+ Tree Index:\n  - Multi-level balanced search tree where all keys reside in leaf nodes at equal depth.\n  - Internal nodes store (key, child_pointer) pairs acting purely as an indexing directory.\n  - Leaf nodes contain actual row pointers or row data and are chained as a doubly-linked list.\n  - Search, insert, and delete complexity is O(log_B N), where B is the block fanout factor (often 100-500 keys per 8KB/16KB page).\n• Hash Index:\n  - Direct address array mapping search keys to bucket addresses via a deterministic hash function h(k).\n  - Point lookups execute in expected O(1) disk I/O.\n  - Buckets are unorganized; hash values randomize physical record placement.\n\n2. Query Capability Analysis:\n• Range Queries & Ordering: B+ Trees excel at range predicates (WHERE age BETWEEN 25 AND 40), ordering (ORDER BY), and prefix searches (LIKE 'Ethio%') because leaf pages preserve sorted order and allow sequential pointer traversal. Hash indexes CANNOT perform range queries or sort operations; an entire hash table scan is required.\n• Equality Lookups: Hash indexes achieve O(1) equality searches (WHERE user_id = 4520) vs O(log_B N) for B+ Trees.\n\n3. Engineering Preference in Relational Engines:\nRelational database workloads heavily depend on range filters, joins, pagination (LIMIT/OFFSET), and ORDER BY clauses. A B+ Tree with depth 3-4 can index billions of rows with only 3-4 page reads (most internal pages cached in RAM). Hence, B+ Trees provide universal versatility across both point lookups and range scans.",
        marks: 10,
        actionVerb: "compare",
        difficulty: "intermediate",
        expectedAnswerPoints: [
          "Node layout differences (internal vs leaf nodes, linked leaf chain)",
          "Asymptotic complexity analysis: O(log_B N) vs O(1)",
          "Detailed explanation of why Hash indexes fail at range queries and sorting",
          "Disk page fanout analysis and why B+ Trees dominate relational database workloads",
        ],
        keyRubricPoints: [
          "B+ Tree vs Hash structural anatomy and page layouts (3 pts)",
          "I/O complexity and fanout derivation (2 pts)",
          "Comparative evaluation of range queries and ordering (3 pts)",
          "Real-world storage engine trade-offs (2 pts)",
        ],
        gradingRubric: [
          { criterion: "Structure & Node Layout", maxMarks: 3, description: "Details B+ tree internal/leaf nodes and hash buckets." },
          { criterion: "Complexity Analysis", maxMarks: 2, description: "Correct logarithmic vs constant time bounds." },
          { criterion: "Workload Versatility", maxMarks: 3, description: "Explains range queries, joins, and sorting limitations." },
          { criterion: "Physical Engine Design", maxMarks: 2, description: "Explains cache hierarchy and disk page fanout." },
        ],
        topic: "Indexing & Physical Storage",
      },
      {
        id: "wt-db-7",
        prompt:
          "Detail the complete lifecycle of a SQL query through a relational query processing engine, from parsing to execution. Contrast the three primary physical join algorithms (Nested Loop Join, Hash Join, and Sort-Merge Join), analyzing their time complexity and memory requirements.",
        modelAnswer:
          "1. Query Processing Lifecycle:\n(a) Parsing & Syntax Validation: SQL query text is converted into an Abstract Syntax Tree (AST); verifies grammar and SQL syntax.\n(b) Semantic Analysis & Catalog Binding: Resolves table names, column names, user permissions, and data types against the system catalog.\n(c) Query Rewriting & Logical Optimization: Applies relational algebra equivalences: predicate pushdown (applying WHERE filters before joins), projection pushdown (pruning unused columns), and subquery flattening.\n(d) Cost-Based Physical Optimization (CBO): Estimates disk I/O and CPU costs for alternative execution plans using table statistics and histograms. Selects index scans vs table scans and join implementations.\n(e) Code Generation / Plan Execution: Generates an iterator tree (Volcano model) where parent nodes call Next() on child operators to stream tuples.\n\n2. Physical Join Algorithms:\n• Nested Loop Join (NLJ):\n  - For each outer tuple r ∈ R, scan inner relation S for matching tuples.\n  - I/O Cost: O(|R| * |S|) unindexed; O(|R| * log |S|) with index on S.\n  - Memory: O(1) buffer frames.\n  - Best for: Small outer table with indexed inner table.\n• Hash Join:\n  - Build Phase: Hashes smaller relation R into an in-memory hash table on join key.\n  - Probe Phase: Streams larger relation S, hashing join key to probe the hash table.\n  - I/O Cost: O(|R| + |S|) linear time.\n  - Memory: Requires sufficient RAM to hold hash table of smaller relation (falls back to Grace Hash Join if RAM exceeded).\n  - Best for: Large unsorted datasets with equijoins.\n• Sort-Merge Join (SMJ):\n  - Sorts both relations on join key (if not already indexed/sorted), then advances two pointers simultaneously in a single pass.\n  - Cost: O(|R| log |R| + |S| log |S|) for sorting + O(|R| + |S|) for merge.\n  - Best for: Very large tables already sorted on the join key or when output must be ordered.",
        marks: 10,
        actionVerb: "analyze",
        difficulty: "hard",
        expectedAnswerPoints: [
          "Step-by-step description of parsing, catalog binding, logical optimization, CBO, and Volcano iterator execution",
          "Nested Loop Join mechanics, complexity, and optimal use cases",
          "Hash Join build and probe phases and memory constraints",
          "Sort-Merge Join mechanics and sorting cost analysis",
        ],
        keyRubricPoints: [
          "End-to-end query processing stages explained (3 pts)",
          "Nested Loop Join complexity and conditions (2 pts)",
          "Hash Join build/probe mechanics and memory overhead (3 pts)",
          "Sort-Merge Join mechanics and complexity (2 pts)",
        ],
        gradingRubric: [
          { criterion: "Query Engine Pipeline", maxMarks: 3, description: "Detailed pipeline from AST parsing to Volcano execution." },
          { criterion: "Nested Loop Join", maxMarks: 2, description: "Algorithm, indexing benefits, and complexity." },
          { criterion: "Hash Join", maxMarks: 3, description: "Build and probe phases, memory limits, and complexity." },
          { criterion: "Sort-Merge Join", maxMarks: 2, description: "Sort phase, scan phase, and comparison." },
        ],
        topic: "SQL Engine Execution",
      },
      {
        id: "wt-db-8",
        prompt:
          "Formally define a Canonical Cover (Minimal Cover) Fc of a set of functional dependencies F. Outline the step-by-step algorithm to compute Fc, and find the canonical cover for relation R(A, B, C, D) with dependency set F = { A → BC, B → C, A → B, AB → C, AC → D }.",
        modelAnswer:
          "1. Formal Definition:\nA canonical cover Fc for a set of functional dependencies F is a set of dependencies such that:\n• Fc+ = F+ (Fc is logically equivalent to F).\n• Every dependency in Fc has a single attribute on its right-hand side: X → A.\n• No dependency contains extraneous attributes in its determinant (no A ∈ X such that (X - {A}) → Y can be inferred).\n• No dependency in Fc is redundant (no dependency can be removed without strictly diminishing the closure Fc+).\n\n2. Canonical Cover Computation Algorithm:\nStep 1: Decompose right-hand sides into singletons using the decomposition rule.\nStep 2: Eliminate extraneous left-hand side attributes using attribute closure.\nStep 3: Eliminate redundant functional dependencies by computing the closure of the determinant without the dependency.\n\n3. Application to F = { A → BC, B → C, A → B, AB → C, AC → D }:\n• Step 1: Singleton right-hand sides:\n  F1 = { A → B, A → C, B → C, A → B, AB → C, AC → D }.\n  Remove immediate duplicate A → B: F1 = { A → B, A → C, B → C, AB → C, AC → D }.\n\n• Step 2: Check for extraneous left-hand attributes:\n  - In AB → C: Check if B is extraneous. In F1, compute A+ without B: A+ = {A, B, C}. Since A determines C, B is extraneous! AB → C reduces to A → C.\n    Now F2 = { A → B, A → C, B → C, AC → D }.\n  - In AC → D: Check if C is extraneous. A+ in F2 = {A, B, C}. Since A+ contains C, A alone can derive AC! Can A determine D? Let's check closure of A: A+ = {A, B, C}. D is NOT in A+. Therefore, C is NOT extraneous on LHS. AC → D remains.\n\n• Step 3: Eliminate redundant dependencies:\n  - Check A → C: In F' = F2 - {A → C}, compute A+: A → B gives {A, B}; then B → C gives {A, B, C}. C is derived without A → C! Thus, A → C is redundant and removed.\n  - Check A → B: In F' - {A → B}, A+ = {A}. Cannot derive B. Kept.\n  - Check B → C: B+ without B → C is {B}. Cannot derive C. Kept.\n  - Check AC → D: AC+ without AC → D is {A, B, C}. Cannot derive D. Kept.\n\nFinal Canonical Cover: Fc = { A → B, B → C, AC → D }.",
        marks: 10,
        actionVerb: "evaluate",
        difficulty: "advanced",
        expectedAnswerPoints: [
          "Formal definition of canonical cover conditions (equivalence, single RHS, no extraneous LHS, no redundant FDs)",
          "Three-step algorithmic procedure",
          "Step-by-step singleton decomposition and extraneous attribute pruning",
          "Verification of redundancy and derivation of final canonical cover Fc = { A → B, B → C, AC → D }",
        ],
        keyRubricPoints: [
          "Formal definition of canonical cover (2 pts)",
          "Specification of algorithm steps (2 pts)",
          "Extraneous attribute elimination in AB → C (3 pts)",
          "Redundant dependency pruning yielding Fc = {A → B, B → C, AC → D} (3 pts)",
        ],
        gradingRubric: [
          { criterion: "Definition & Invariants", maxMarks: 2, description: "Formal definition of Fc equivalence and minimality." },
          { criterion: "Algorithm Methodology", maxMarks: 2, description: "Clear explanation of decomposition, extraneous check, and redundancy check." },
          { criterion: "Extraneous LHS Reduction", maxMarks: 3, description: "Step-by-step closure verification for AB → C and AC → D." },
          { criterion: "Redundant FD Removal", maxMarks: 3, description: "Closure tests proving redundancy of A → C and final Fc set." },
        ],
        topic: "Functional Dependencies",
      },
      {
        id: "wt-db-9",
        prompt:
          "Analyze the architecture and execution mechanics of Multi-Version Concurrency Control (MVCC) in modern databases (such as PostgreSQL and MySQL InnoDB). Explain how snapshot isolation avoids read locks, how tuple revision chains are maintained, and how write-write conflicts and serializability anomalies (write skew) are resolved.",
        modelAnswer:
          "1. MVCC Core Philosophy:\nMVCC decouples read operations from write operations under the mantra: 'Readers never block writers, and writers never block readers.' Instead of acquiring shared read locks on shared rows, the engine creates multiple physical versions (tuples) of each data item.\n\n2. Tuple Versioning Architecture:\nEach tuple header stores transaction visibility metadata:\n• xmin / DB_TRX_ID: The transaction ID that inserted this version of the row.\n• xmax / DB_ROLL_PTR: The transaction ID that deleted or replaced this version (or NULL/0 if active).\nWhen a row is updated:\n1. The old tuple's xmax is set to the current transaction ID.\n2. A new tuple is inserted with its xmin set to the current transaction ID.\n3. The versions form a singly linked revision chain (undo log history).\n\n3. Snapshot Isolation Mechanics:\nWhen a transaction begins under Snapshot Isolation, it captures a snapshot of the system state: [xmin_active, xmax_active, active_tx_list].\nA tuple version is visible to transaction T iff:\n• Tuple's xmin has committed before T's snapshot was taken.\n• Tuple's xmax is either not set, aborted, or belongs to a transaction that committed AFTER T's snapshot was taken.\n\n4. Write-Write Conflicts and Write Skew:\n• Write-Write Conflict: If T1 and T2 attempt to update the same row simultaneously, the second transaction is blocked until the first commits. If the first commits, the second transaction aborts under Serializable Snapshot Isolation (first-committer-wins rule).\n• Write Skew Anomaly: Occurs under Snapshot Isolation when two concurrent transactions read overlapping datasets, verify a constraint, and update disjoint rows that together violate a global invariant (e.g., two on-call doctors simultaneously withdrawing). Resolved by Serializable Snapshot Isolation (SSI), which detects cycles in the Serialization Dependency Graph (SIREAD locks) and aborts conflicting transactions.",
        marks: 10,
        actionVerb: "analyze",
        difficulty: "hard",
        expectedAnswerPoints: [
          "Core premise: readers never block writers and writers never block readers",
          "Tuple header structure (xmin, xmax, rollback pointers) and revision chain maintenance",
          "Snapshot visibility rules during query execution",
          "Write-write conflict handling and analysis of write skew anomaly with SSI resolution",
        ],
        keyRubricPoints: [
          "MVCC architecture and design philosophy (2 pts)",
          "Tuple header fields (xmin, xmax) and update mechanics (3 pts)",
          "Snapshot isolation visibility rules (2 pts)",
          "Write-write conflicts, write skew anomaly, and SSI detection (3 pts)",
        ],
        gradingRubric: [
          { criterion: "MVCC Principles", maxMarks: 2, description: "Explains non-blocking read architecture." },
          { criterion: "Version Metadata", maxMarks: 3, description: "Explains xmin/xmax headers and undo revision chain." },
          { criterion: "Visibility Criteria", maxMarks: 2, description: "Mathematical snapshot visibility rules." },
          { criterion: "Write Skew & SSI", maxMarks: 3, description: "Detailed explanation of write skew and serialization graph detection." },
        ],
        topic: "Concurrency Control",
      },
      {
        id: "wt-db-10",
        prompt:
          "Perform a comprehensive schema normalization case study. Given an unnormalized university registrar spreadsheet table UNF(StudentID, StudentName, Major, CourseCode, CourseTitle, Credits, InstructorID, InstructorName, InstructorOffice, Semester, Grade), systematically normalize the schema into 1NF, 2NF, and 3NF. State all functional dependencies, identify candidate keys at each stage, and explain how each normal form eliminates specific data anomalies.",
        modelAnswer:
          "1. Functional Dependency Analysis:\nFrom domain constraints:\n• StudentID → StudentName, Major\n• CourseCode → CourseTitle, Credits\n• InstructorID → InstructorName, InstructorOffice\n• CourseCode, Semester → InstructorID (a course section is taught by an instructor)\n• StudentID, CourseCode, Semester → Grade (a student receives a grade for a course taken in a semester)\n\n2. Step 1: Conversion to First Normal Form (1NF)\n• Problem in UNF: Repeating groups of courses and multivalued enrollment attributes per student.\n• Transformation: Flatten the repeating groups so each record contains atomic values with primary key (StudentID, CourseCode, Semester).\n• 1NF Schema: R_1NF(StudentID, StudentName, Major, CourseCode, CourseTitle, Credits, InstructorID, InstructorName, InstructorOffice, Semester, Grade).\n• Anomalies: High data redundancy; repeating StudentName and CourseTitle for every enrolled student.\n\n3. Step 2: Conversion to Second Normal Form (2NF)\n• Problem in 1NF: Partial dependencies on subsets of composite key (StudentID, CourseCode, Semester):\n  - StudentID → StudentName, Major (depends only on StudentID).\n  - CourseCode → CourseTitle, Credits (depends only on CourseCode).\n• Transformation: Decompose into separate tables based on full functional dependency:\n  - Students(StudentID, StudentName, Major) [PK: StudentID]\n  - Courses(CourseCode, CourseTitle, Credits) [PK: CourseCode]\n  - CourseOfferings(CourseCode, Semester, InstructorID, InstructorName, InstructorOffice) [PK: CourseCode, Semester]\n  - Enrollments(StudentID, CourseCode, Semester, Grade) [PK: (StudentID, CourseCode, Semester), FKs to Students and CourseOfferings]\n• Eliminates: Partial dependency anomalies (e.g., student name update requires editing only one tuple).\n\n4. Step 3: Conversion to Third Normal Form (3NF)\n• Problem in 2NF: In CourseOfferings, transitive dependency exists:\n  - (CourseCode, Semester) → InstructorID\n  - InstructorID → InstructorName, InstructorOffice\n  - (CourseCode, Semester) → InstructorName, InstructorOffice is transitive via non-prime InstructorID.\n• Transformation: Factor out instructor details into a dedicated table:\n  - Instructors(InstructorID, InstructorName, InstructorOffice) [PK: InstructorID]\n  - CourseOfferings(CourseCode, Semester, InstructorID) [PK: (CourseCode, Semester), FK to Instructors and Courses]\n\n5. Final 3NF Normalized Schema:\n1. Students(StudentID, StudentName, Major)\n2. Courses(CourseCode, CourseTitle, Credits)\n3. Instructors(InstructorID, InstructorName, InstructorOffice)\n4. Sections(CourseCode, Semester, InstructorID)\n5. Enrollments(StudentID, CourseCode, Semester, Grade)\nAll non-prime attributes are fully and directly dependent solely on the primary key, eliminating insertion, update, and deletion anomalies without losing any functional dependencies.",
        marks: 10,
        actionVerb: "apply",
        difficulty: "hard",
        expectedAnswerPoints: [
          "Identification of all business domain functional dependencies",
          "1NF transformation removing repeating groups and establishing composite key",
          "2NF transformation removing partial dependencies with decomposed sub-relations",
          "3NF transformation removing transitive dependency in CourseOfferings",
          "Complete list of final 3NF schemas with designated primary and foreign keys",
        ],
        keyRubricPoints: [
          "Identification of functional dependencies (2 pts)",
          "1NF schema and composite key design (2 pts)",
          "2NF decomposition eliminating partial dependencies (3 pts)",
          "3NF decomposition eliminating transitive dependencies with final clean schemas (3 pts)",
        ],
        gradingRubric: [
          { criterion: "Domain Dependency Formulation", maxMarks: 2, description: "Extracts all functional dependencies from domain description." },
          { criterion: "1NF Formulation", maxMarks: 2, description: "Atomicity and composite key establishment." },
          { criterion: "2NF Decomposition", maxMarks: 3, description: "Identifies partial dependencies and creates normalized student/course entities." },
          { criterion: "3NF Decomposition", maxMarks: 3, description: "Identifies transitive instructor dependency and produces clean 3NF relational model." },
        ],
        topic: "Normalization",
      },
    ],
    fillBlanks: [
      {
        id: "fb-db-1",
        sentenceWithBlank:
          "In database transactions, the [Atomicity] property guarantees that either all operations within a transaction are successfully committed, or the transaction is completely rolled back with no partial effects.",
        blankAnswer: "Atomicity",
        acceptedAlternatives: ["atomic", "Atomicity property"],
        hint: "The 'A' in ACID.",
        explanation:
          "Atomicity ensures all-or-nothing execution via write-ahead logging and rollback segments.",
        topic: "Transactions",
      },
      {
        id: "fb-db-2",
        sentenceWithBlank:
          "Third Normal Form (3NF) strictly eliminates [transitive] dependencies between non-prime attributes.",
        blankAnswer: "transitive",
        acceptedAlternatives: ["transitive dependency", "transitive dependencies"],
        hint: "Occurs when X → Y and Y → Z where X is candidate key and Y, Z are non-prime.",
        explanation:
          "3NF requires that no non-prime attribute depends on another non-prime attribute.",
        topic: "Normalization",
      },
      {
        id: "fb-db-3",
        sentenceWithBlank:
          "Second Normal Form (2NF) requires that every non-prime attribute is fully functionally dependent on every candidate key, eliminating [partial] dependencies.",
        blankAnswer: "partial",
        acceptedAlternatives: ["partial dependency", "partial dependencies"],
        hint: "Occurs when an attribute depends on a proper subset of a composite candidate key.",
        explanation:
          "Partial dependencies only occur when composite candidate keys exist and are removed in 2NF.",
        topic: "Normalization",
      },
      {
        id: "fb-db-4",
        sentenceWithBlank:
          "In Boyce-Codd Normal Form (BCNF), for every non-trivial functional dependency X → Y, the determinant X must be a [superkey].",
        blankAnswer: "superkey",
        acceptedAlternatives: ["super key", "candidate key"],
        hint: "A set of attributes that uniquely identifies tuples in a relation.",
        explanation:
          "BCNF eliminates all update anomalies by requiring every determinant to be a superkey.",
        topic: "Normalization",
      },
      {
        id: "fb-db-5",
        sentenceWithBlank:
          "The concurrency anomaly where a transaction executes a query returning a set of rows, and a concurrent transaction inserts new matching rows and commits, is known as a [phantom] read.",
        blankAnswer: "phantom",
        acceptedAlternatives: ["phantom read", "phantom reads"],
        hint: "Permitted under Repeatable Read but prevented under Serializable.",
        explanation:
          "Phantom reads involve row insertions/deletions that alter range query result sets.",
        topic: "Concurrency Control",
      },
      {
        id: "fb-db-6",
        sentenceWithBlank:
          "The [Write-Ahead Logging] protocol requires that log records describing changes to data pages must be flushed to stable storage before the modified pages themselves are written to disk.",
        blankAnswer: "Write-Ahead Logging",
        acceptedAlternatives: ["WAL", "write ahead logging", "write-ahead log"],
        hint: "Commonly abbreviated as WAL.",
        explanation:
          "WAL ensures atomicity and durability by persisting redo/undo records prior to buffer pool page eviction.",
        topic: "Transactions & Recovery",
      },
      {
        id: "fb-db-7",
        sentenceWithBlank:
          "A decomposition of relation R into R1 and R2 is [lossless] if and only if the intersection R1 ∩ R2 forms a superkey for R1 or R2.",
        blankAnswer: "lossless",
        acceptedAlternatives: ["lossless-join", "lossless join", "non-additive"],
        hint: "Guarantees no spurious tuples appear upon natural join.",
        explanation:
          "The Lossless-Join theorem proves that natural join reconstructs the exact original relation without extraneous tuples.",
        topic: "Decomposition Theory",
      },
      {
        id: "fb-db-8",
        sentenceWithBlank:
          "A minimal set of functional dependencies equivalent to F containing no extraneous attributes and no redundant dependencies is called a [canonical] cover.",
        blankAnswer: "canonical",
        acceptedAlternatives: ["minimal", "canonical cover", "minimal cover"],
        hint: "Represented as Fc.",
        explanation:
          "A canonical cover Fc provides an irreducible baseline for schema synthesis into 3NF.",
        topic: "Functional Dependencies",
      },
      {
        id: "fb-db-9",
        sentenceWithBlank:
          "The [Two-Phase Locking] protocol guarantees conflict serializability by preventing transactions from acquiring new locks once they begin releasing locks.",
        blankAnswer: "Two-Phase Locking",
        acceptedAlternatives: ["2PL", "two phase locking", "two-phase locking protocol"],
        hint: "Consists of an expanding phase followed by a shrinking phase.",
        explanation:
          "2PL mathematically guarantees serializable execution schedules.",
        topic: "Concurrency Control",
      },
      {
        id: "fb-db-10",
        sentenceWithBlank:
          "In a [B+ Tree] index, all data records or record pointers reside exclusively in the leaf nodes, which are linked together in a doubly linked list.",
        blankAnswer: "B+ Tree",
        acceptedAlternatives: ["B+ tree", "B-plus tree", "B plus tree", "B+Tree"],
        hint: "The predominant multi-way search tree structure used in relational storage engines.",
        explanation:
          "B+ Trees provide O(log N) searches and efficient sequential range scans via connected leaf nodes.",
        topic: "Indexing & Physical Storage",
      },
    ],
    notes: {
      summary:
        "Comprehensive university-grade study module on Relational Database Theory, Normalization (1NF to BCNF), Functional Dependencies, Transaction Management (ACID), Concurrency Control, and Physical Storage Engines for Computer Science Degree and Exit Exam Candidates.",
      keyConcepts: [
        {
          concept: "Relational Normalization Hierarchy",
          explanation:
            "Normalization is the formal process of decomposing relations to eliminate redundancy, insertion anomalies, update anomalies, and deletion anomalies. 1NF enforces atomic attribute domains. 2NF removes partial dependencies on composite keys. 3NF removes transitive dependencies between non-prime attributes. BCNF enforces that every determinant is a superkey.",
        },
        {
          concept: "Lossless-Join and Dependency Preservation",
          explanation:
            "A decomposition D = {R1, R2} is lossless if R1 ∩ R2 → R1 or R1 ∩ R2 → R2 in F+. Dependency preservation ensures that checking functional dependencies does not require expensive multi-table joins. 3NF synthesis can always achieve both lossless join and dependency preservation, whereas BCNF guarantees lossless join but may not preserve all functional dependencies.",
        },
        {
          concept: "Transaction ACID Properties and WAL",
          explanation:
            "Atomicity and Durability are guaranteed by the recovery subsystem using Write-Ahead Logging (WAL) and the ARIES algorithm. Isolation is maintained by concurrency control schemes like Two-Phase Locking (2PL) and Multi-Version Concurrency Control (MVCC). Consistency is preserved by declarative relational constraints.",
        },
        {
          concept: "B+ Tree Index Architecture",
          explanation:
            "The standard indexing structure in relational engines. High-fanout balanced search tree where all data rows or pointers reside in leaf nodes connected by a doubly linked list. Guarantees O(log_B N) search time while enabling efficient sequential range scans without re-traversing internal tree nodes.",
        },
        {
          concept: "Multi-Version Concurrency Control (MVCC)",
          explanation:
            "Provides non-blocking reads under snapshot isolation by storing row revisions with transaction IDs (xmin, xmax). Readers read historical snapshots without acquiring shared locks, completely decoupling read workloads from concurrent write operations.",
        },
      ],
      definitions: [
        {
          term: "Candidate Key",
          definition:
            "A minimal superkey—a set of attributes that uniquely identifies every tuple in a relation such that no proper subset can uniquely identify the tuples.",
        },
        {
          term: "Prime Attribute",
          definition:
            "An attribute that is a member of at least one candidate key of the relation schema.",
        },
        {
          term: "Functional Dependency (X → Y)",
          definition:
            "A constraint between two sets of attributes X and Y such that for any two valid tuples t1 and t2, if t1[X] = t2[X], then t1[Y] must equal t2[Y].",
        },
        {
          term: "Partial Dependency",
          definition:
            "A functional dependency X → A where A is a non-prime attribute and X is a proper subset of a composite candidate key.",
        },
        {
          term: "Transitive Dependency",
          definition:
            "A functional dependency X → Z where X is a candidate key, and there exists a non-prime attribute Y such that X → Y and Y → Z hold, and Y does not determine X.",
        },
        {
          term: "Dirty Read",
          definition:
            "A concurrency anomaly occurring when a transaction reads uncommitted modifications made by another concurrent transaction that subsequently rolls back.",
        },
      ],
      formulasAndRules: [
        {
          title: "Armstrong's Axioms",
          formula:
            "\\text{Reflexivity: } Y \\subseteq X \\implies X \\to Y; \\quad \\text{Augmentation: } X \\to Y \\implies XZ \\to YZ; \\quad \\text{Transitivity: } X \\to Y \\land Y \\to Z \\implies X \\to Z",
          explanation:
            "Sound and complete inference rules for deriving the closure of functional dependencies F+.",
        },
        {
          title: "Binary Lossless-Join Decomposition Condition",
          formula:
            "(R_1 \\cap R_2) \\to R_1 \\in F^+ \\quad \\lor \\quad (R_1 \\cap R_2) \\to R_2 \\in F^+",
          explanation:
            "Decomposing R into R1 and R2 produces no spurious tuples upon natural join iff the intersection is a superkey of R1 or R2.",
        },
        {
          title: "B+ Tree Fanout and Height Bound",
          formula:
            "\\text{Height } h \\le \\left\\lceil \\log_{\\lceil B/2 \\rceil} \\left( \\frac{N+1}{2} \\right) \\right\\rceil",
          explanation:
            "Calculates the maximum search depth in a B+ tree of order B with N total indexed leaf entries.",
        },
      ],
      studyTips: [
        "In National CS Exit Exams, immediately check if candidate keys are composite. If a single column determines another column, test 2NF first!",
        "When evaluating 3NF vs BCNF, remember: if the right-hand side attribute is prime (part of ANY candidate key), it passes 3NF even if the left-hand determinant is NOT a superkey.",
        "Always write out attribute closures (e.g., X+) step-by-step using Armstrong axioms before concluding whether an attribute set is a candidate key.",
      ],
    },
    podcast: {
      title: "Episode 3: Mastering Normalization from 1NF to BCNF and Concurrency Control",
      hosts: ["Alex (Tutor)", "Jordan (Student)"],
      durationEstimate: "5 min 20 sec",
      dialogue: [
        {
          id: "pod-db-1",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: "Jordan, how do you remember the normal forms in order during high-stakes computer science exams?",
          timestampSeconds: 0,
        },
        {
          id: "pod-db-2",
          speaker: "Jordan (Student)",
          role: "Senior CS Student",
          text: "The famous mnemonic: 'The key, the whole key, and nothing but the key, so help me Codd!' 1NF is atomic values, 2NF requires dependence on the WHOLE key, and 3NF requires dependence on NOTHING BUT the key.",
          timestampSeconds: 15,
        },
        {
          id: "pod-db-3",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: "Brilliant! But what about BCNF? How does BCNF tighten the definition beyond 3NF?",
          timestampSeconds: 35,
        },
        {
          id: "pod-db-4",
          speaker: "Jordan (Student)",
          role: "Senior CS Student",
          text: "3NF allows an exception: if the right-hand side is a prime attribute, the dependency is allowed even if the determinant isn't a superkey. BCNF removes that exception completely—every single determinant must be a superkey!",
          timestampSeconds: 52,
        },
        {
          id: "pod-db-5",
          speaker: "Alex (Tutor)",
          role: "Academic AI Tutor",
          text: "Exactly right. That eliminates all remaining update anomalies, though we may lose dependency preservation in the process.",
          timestampSeconds: 70,
        },
      ],
    },
    weakTopics: ["Normalization", "Concurrency Control", "Decomposition Theory"],
    progress: {
      overallPct: 75,
      flashcardsMastered: 8,
      quizAccuracyPct: 85,
      writtenTestsCompleted: 4,
      fillBlanksCompleted: 6,
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

/* ── Synthesizers for Overview and CheatSheet ── */
export function synthesizeDefaultOverview(params: {
  title: string;
  subject: string;
  courseCode?: string;
  notes: StudySetNotes;
}): StudySetOverview {
  const notes = params.notes;
  const units = notes.keyConcepts || [];
  return {
    courseSubject: params.subject || "Academic Course",
    chapterTopic: params.title || "Lecture Module",
    academicContext: `University-level instructional module for ${params.courseCode || params.subject}, establishing rigorous theoretical mechanisms, mathematical invariant laws, and applied system architectures.`,
    learningObjectives:
      notes.learningObjectives && notes.learningObjectives.length > 0
        ? notes.learningObjectives
        : [
            `Analyze the foundational axioms and governing parameters of ${params.title}.`,
            `Evaluate boundary conditions, performance trade-offs, and failure domains.`,
            `Formulate and apply governing formulas to complex exam and engineering problems.`,
            `Synthesize relationships between core concepts to construct complete mental models.`,
          ],
    coreConcepts: units.map((c) => c.concept),
    keyPrinciples:
      notes.principlesAndTheories && notes.principlesAndTheories.length > 0
        ? notes.principlesAndTheories.map((p) => `${p.title}: ${p.principle}`)
        : [
            "Rigorous dimensional and boundary constraint verification",
            "Hierarchical separation of concerns and modular invariants",
            "Trade-off equilibrium between performance and architectural complexity",
          ],
    importantDefinitions: (notes.definitions || []).map((d) => ({
      term: d.term,
      definition: d.definition,
    })),
    majorTheoriesAndModels:
      notes.principlesAndTheories && notes.principlesAndTheories.length > 0
        ? notes.principlesAndTheories.map((p) => ({
            name: p.title,
            description: p.explanation,
            corePremise: p.principle,
          }))
        : [
            {
              name: "Standard Academic Analytical Framework",
              description: `Canonical theoretical framework governing ${params.title}.`,
              corePremise: "All sub-components operate under conservation of invariants and boundary limits.",
            },
          ],
    conceptRelationships:
      units.length > 1
        ? units.slice(0, units.length - 1).map((u, i) => ({
            sourceConcept: u.concept,
            targetConcept: units[i + 1]?.concept || u.concept,
            relationship: `Forms the theoretical and operational dependency for ${units[i + 1]?.concept}.`,
          }))
        : [
            {
              sourceConcept: units[0]?.concept || "Core Principle",
              targetConcept: "Operational System Architecture",
              relationship: "Establishes baseline constraints and design parameters.",
            },
          ],
    practicalApplications: [
      `University midterm and exit examination scenario analysis in ${params.courseCode || params.subject}`,
      "Production-scale system engineering and formal architectural verification",
      "Empirical modeling and dimensional problem-solving under real-world constraints",
    ],
    keyTakeaways:
      notes.finalTakeaways && notes.finalTakeaways.length > 0
        ? notes.finalTakeaways
        : [
            "Master the definitions and boundary constraints before applying standard formulas.",
            "Understand the directional relationships between foundational and applied concepts.",
            "Active recall and derivation build durable mental models superior to passive memorization.",
          ],
    examRelevantAreas: [
      "Distinction between foundational definitions and common misconceptions",
      "Multi-step formula derivations and boundary-case evaluations",
      "Scenario-based problem solving with competing performance requirements",
    ],
    mentalModelHierarchy: [
      {
        id: "unit-1",
        unit: "Unit 1: Foundational Theoretical Framework",
        topic: "Core Axioms & Definitions",
        concepts: units.slice(0, 3).map((c) => ({
          name: c.concept,
          details: c.explanation,
          exampleOrApplication: c.example || c.takeaway || "Essential academic definition",
        })),
      },
      {
        id: "unit-2",
        unit: "Unit 2: Analytical Laws & Governing Formulations",
        topic: "Invariants, Models & Mechanisms",
        concepts: units.slice(3).map((c) => ({
          name: c.concept,
          details: c.explanation,
          exampleOrApplication: c.tradeoffs || c.takeaway || "Systemic boundary application",
        })),
      },
    ],
    sourceGroundedNotes: {
      isFullyGrounded: true,
    },
  };
}

export function synthesizeDefaultCheatSheet(params: {
  title: string;
  subject: string;
  notes: StudySetNotes;
}): StudySetCheatSheet {
  const notes = params.notes;
  return {
    criticalDefinitions: (notes.definitions || []).map((d) => ({
      term: d.term,
      briefDefinition: d.definition,
      highYieldTag: "High-Yield",
    })),
    keyTerminology: (notes.definitions || []).slice(0, 6).map((d) => ({
      term: d.term,
      context: d.academicContext || "Core Taxonomy",
    })),
    corePrinciples:
      notes.principlesAndTheories && notes.principlesAndTheories.length > 0
        ? notes.principlesAndTheories.map((p) => ({
            principle: p.title,
            conciseRule: p.principle,
          }))
        : [
            {
              principle: "Boundary Verification",
              conciseRule: "Check initial values and boundary conditions before formula substitution.",
            },
          ],
    importantFormulas: (notes.formulasAndRules || []).map((f) => ({
      title: f.title,
      formula: f.formula,
      variables:
        f.variables?.map((v) => `${v.symbol}: ${v.label}`).join(", ") || "Standard SI variables",
      quickTip: f.implication || f.explanation,
    })),
    comparisonsTable: notes.classificationsAndCategories?.[0]
      ? notes.classificationsAndCategories[0].rows.map((row) => ({
          concept: row[0] || "Concept",
          meaning: row[1] || "",
          keyDifference: row[2] || "",
          example: row[3] || row[4] || "",
        }))
      : (notes.commonConfusions || []).map((c) => ({
          concept: `${c.conceptA} vs ${c.conceptB}`,
          meaning: c.keyDistinction,
          keyDifference: c.mnemonicOrRule,
          example: "See lecture notes for full derivation",
        })),
    processesAndWorkflows:
      notes.processesAndWorkflows && notes.processesAndWorkflows.length > 0
        ? notes.processesAndWorkflows.map((w) => ({
            title: w.processName,
            summary: w.objective,
            steps: w.steps.map((s) => `${s.stepNumber}. ${s.title} — ${s.description}`),
          }))
        : [
            {
              title: "Systematic Academic Analysis Workflow",
              summary: "Step-by-step method to solve university exam problems",
              steps: [
                "1. Given Identification — Extract known parameters and convert to SI units.",
                "2. Governing Equation Selection — Choose formulas valid within boundary constraints.",
                "3. Algebraic Derivation — Solve for unknowns symbolically before numerical substitution.",
                "4. Dimensional Consistency Verification — Confirm final units match target physical quantity.",
              ],
            },
          ],
    importantRelationships:
      notes.examFocusedKnowledge?.mustKnowRelationships &&
      notes.examFocusedKnowledge.mustKnowRelationships.length > 0
        ? notes.examFocusedKnowledge.mustKnowRelationships.map((r) => ({
            relation: r,
            impact: "Critical exam dependency",
          }))
        : [
            {
              relation: "Theoretical Invariant vs Practical Constraint",
              impact: "Physical real-world implementations always trade theoretical speed for reliability.",
            },
          ],
    commonMistakes:
      notes.commonConfusions && notes.commonConfusions.length > 0
        ? notes.commonConfusions.map((c) => ({
            misconception: `Confusing ${c.conceptA} with ${c.conceptB}`,
            correctUnderstanding: `${c.keyDistinction}. Key mnemonic: ${c.mnemonicOrRule}`,
          }))
        : [
            {
              misconception: "Assuming formulas apply without checking boundary constraints",
              correctUnderstanding: "All models have defined validity domains that must be verified first.",
            },
          ],
    examReminders:
      notes.finalTakeaways && notes.finalTakeaways.length > 0
        ? notes.finalTakeaways
        : [
            "Verify dimensional units and boundary constraints first.",
            "Check whether assumptions of ideal conditions hold before applying short-cut formulas.",
            "State explicit premises clearly in all free-response written questions.",
          ],
    estimatedReviewMinutes: 7,
  };
}

/* ── Store Helpers ── */
function readStudySets(): StudySet[] {
  if (typeof window === "undefined") return SEED_STUDY_SETS;
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    // Backward compatibility: migrate from v2 if v3 not yet saved
    if (!raw) {
      const prevRaw = localStorage.getItem(PREV_STORAGE_KEY);
      if (prevRaw) {
        raw = prevRaw;
      }
    }
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STUDY_SETS));
      return SEED_STUDY_SETS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STUDY_SETS));
      return SEED_STUDY_SETS;
    }

    let modified = false;

    // Check if any seed set is missing or has outdated item counts (< 10 quizzes or < 10 written tests or < 10 fill blanks)
    for (const seed of SEED_STUDY_SETS) {
      const idx = parsed.findIndex((s: StudySet) => s.id === seed.id || s.title === seed.title);
      if (idx >= 0) {
        const stored = parsed[idx];
        const isOutdated =
          (stored.quizzes?.length ?? 0) < 10 ||
          (stored.writtenTests?.length ?? 0) < 10 ||
          (stored.fillBlanks?.length ?? 0) < 10 ||
          (stored.flashcards?.length ?? 0) < 10 ||
          !stored.notes?.keyConcepts ||
          stored.notes.keyConcepts.length < 5 ||
          !stored.cheatSheet ||
          !stored.overview;

        if (isOutdated) {
          parsed[idx] = {
            ...stored,
            title: seed.title,
            subject: seed.subject,
            courseCode: seed.courseCode,
            description: seed.description,
            sources: seed.sources,
            flashcards: seed.flashcards,
            quizzes: seed.quizzes,
            writtenTests: seed.writtenTests,
            fillBlanks: seed.fillBlanks,
            notes: seed.notes,
            overview: seed.overview,
            cheatSheet: seed.cheatSheet,
            podcast: seed.podcast,
            lastStudiedAt: stored.lastStudiedAt || new Date().toISOString(),
          };
          modified = true;
        }
      } else {
        parsed.unshift(seed);
        modified = true;
      }
    }

    // Ensure all sets in storage have overview and cheatSheet
    for (const set of parsed) {
      if (!set.overview && set.notes) {
        set.overview = synthesizeDefaultOverview({
          title: set.title,
          subject: set.subject,
          courseCode: set.courseCode,
          notes: set.notes,
        });
        modified = true;
      }
      if (!set.cheatSheet && set.notes) {
        set.cheatSheet = synthesizeDefaultCheatSheet({
          title: set.title,
          subject: set.subject,
          notes: set.notes,
        });
        modified = true;
      }
    }

    if (modified || !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
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
  overview?: StudySetOverview;
  cheatSheet?: StudySetCheatSheet;
  flashcards: StudySetFlashcard[];
  quizzes: StudySetQuizQuestion[];
  writtenTests: StudySetWrittenQuestion[];
  fillBlanks: StudySetFillBlank[];
  notes: StudySetNotes;
  podcast: StudySetPodcast;
}): StudySet {
  const finalOverview =
    params.overview ||
    synthesizeDefaultOverview({
      title: params.title,
      subject: params.subject,
      courseCode: params.courseCode,
      notes: params.notes,
    });

  const finalCheatSheet =
    params.cheatSheet ||
    synthesizeDefaultCheatSheet({
      title: params.title,
      subject: params.subject,
      notes: params.notes,
    });

  const newSet: StudySet = {
    id: `set-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: params.title.trim() || "Untitled Study Set",
    subject: params.subject || "General",
    courseCode: params.courseCode || "GEN 1000",
    description: params.description || `Study set created with ${params.sources.length} sources.`,
    folderId: params.folderId,
    sources: params.sources,
    overview: finalOverview,
    cheatSheet: finalCheatSheet,
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

/* ── Admin Management & Backup Helpers ── */
export function resetToDefaultSeedStudySets(): StudySet[] {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_STUDY_SETS));
    window.dispatchEvent(new Event("study-sets-change"));
  }
  return SEED_STUDY_SETS;
}

export function exportAllStudySetsJson(): string {
  const sets = readStudySets();
  return JSON.stringify(sets, null, 2);
}

export function importStudySetsJson(jsonStr: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: "Invalid JSON format: expected an array of study sets." };
    }
    const valid = parsed.filter(
      (s): s is StudySet => Boolean(s && typeof s === "object" && typeof s.id === "string" && typeof s.title === "string")
    );
    if (valid.length === 0) {
      return { success: false, count: 0, error: "No valid study sets found in the imported data." };
    }
    writeStudySets(valid);
    return { success: true, count: valid.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || "Failed to parse JSON." };
  }
}

