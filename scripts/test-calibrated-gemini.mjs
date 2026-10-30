import { getServerConfig } from "../src/lib/config.server.ts";
import OpenAI from "openai";

const config = getServerConfig();
console.log("Testing calibrated Gemini generation...");

const client = new OpenAI({
  apiKey: config.geminiApiKey,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  timeout: 60000,
});

const sampleLecture = `
Course: CoSc 3021 - Network Design Requirements
Lecture: Enterprise Network Hierarchical Architecture and Redundancy Protocols

Enterprise networks require structured hierarchical design to maintain scalability, security, and fault tolerance.
The standard 3-layer Cisco hierarchical model consists of:
1. Core Layer (Network Backbone): High-speed packet switching without packet filtering or routing policy delays.
2. Distribution Layer: Boundary between access and core. Implements routing policies, access control lists (ACLs), QoS policies, and VLAN aggregation.
3. Access Layer: Connects end-user workgroup devices (PCs, IP phones, access points) to switches. Implements Port Security, 802.1X, and PoE.

Redundancy & High Availability:
- Spanning Tree Protocol (STP, IEEE 802.1D) and Rapid Spanning Tree Protocol (RSTP, 802.1w) prevent layer 2 switching loops.
- First Hop Redundancy Protocols (FHRP):
  * HSRP (Hot Standby Router Protocol - Cisco proprietary) uses virtual IP and virtual MAC (0000.0c07.acXX).
  * VRRP (Virtual Router Redundancy Protocol - IEEE open standard) uses virtual MAC (00-00-5E-00-01-XX).
  * GLBP (Gateway Load Balancing Protocol) provides active-active gateway load balancing across multiple routers.
`;

const prompt = `You are an elite university curriculum specialist and AI study copilot.
Transform the following university lecture into a comprehensive, university-grade study set.

Source text:
${sampleLecture}

Respond with ONLY valid JSON (no markdown formatting, no code fences) conforming to this exact structure:
{
  "title": "Network Design Requirements",
  "subject": "Computer Science",
  "courseCode": "CoSc 3021",
  "description": "Enterprise network architecture, hierarchical layers, and first hop redundancy protocols.",
  "overview": {
    "courseSubject": "Computer Science",
    "chapterTopic": "Hierarchical Design & Redundancy",
    "academicContext": "Detailed explanation of why hierarchical network topology and first hop redundancy protocols matter for enterprise reliability.",
    "learningObjectives": [
      "Analyze the discrete functional roles of Core, Distribution, and Access layers",
      "Evaluate First Hop Redundancy Protocols (HSRP, VRRP, GLBP)",
      "Formulate layer 2 loop mitigation strategies using STP/RSTP"
    ],
    "coreConcepts": ["Hierarchical Model", "First Hop Redundancy", "Loop Prevention"],
    "keyPrinciples": [
      "Core layer must prioritize low latency switching over policy enforcement",
      "Distribution layer handles routing boundaries and ACL policy enforcement"
    ],
    "importantDefinitions": [
      { "term": "Core Layer", "definition": "High-speed network backbone engineered for maximum packet throughput." },
      { "term": "HSRP", "definition": "Hot Standby Router Protocol providing default gateway redundancy." }
    ],
    "majorTheoriesAndModels": [
      { "name": "Cisco 3-Layer Hierarchical Model", "description": "Core, distribution, and access separation.", "corePremise": "Modular scalability and deterministic troubleshooting." }
    ],
    "conceptRelationships": [
      { "sourceConcept": "Distribution Layer", "targetConcept": "Core Layer", "relationship": "Aggregates access traffic and hands off to high-speed core backbone." }
    ],
    "practicalApplications": ["Enterprise data center routing", "Campus network segmentation"],
    "keyTakeaways": [
      "Never run packet filtering ACLs on the core layer backbone",
      "VRRP is an open standard alternative to Cisco proprietary HSRP"
    ],
    "examRelevantAreas": ["HSRP vs VRRP vs GLBP comparison", "Layer functions in 3-tier model"],
    "mentalModelHierarchy": [
      {
        "id": "unit-1",
        "unit": "Unit 1: Hierarchical Design",
        "topic": "Layer Segregation",
        "concepts": [
          { "name": "Core Layer", "details": "Fast switching backbone", "exampleOrApplication": "Carrier routing" }
        ]
      }
    ],
    "sourceGroundedNotes": { "isFullyGrounded": true }
  },
  "cheatSheet": {
    "criticalDefinitions": [
      { "term": "FHRP", "briefDefinition": "First Hop Redundancy Protocol for gateway survivability.", "highYieldTag": "High-Yield" }
    ],
    "keyTerminology": [
      { "term": "Virtual MAC", "context": "HSRP uses 0000.0c07.acXX, VRRP uses 00-00-5E-00-01-XX." }
    ],
    "corePrinciples": [
      { "principle": "Core Simplicity", "conciseRule": "Keep core routers free of CPU-intensive ACL inspection." }
    ],
    "importantFormulas": [
      { "title": "HSRP Virtual MAC Format", "formula": "0000.0c07.ac[Group_Hex]", "variables": "Group_Hex = group number in hex", "quickTip": "Frequently tested on exit exams" }
    ],
    "comparisonsTable": [
      { "concept": "HSRP vs VRRP", "meaning": "Gateway Redundancy", "keyDifference": "HSRP is Cisco proprietary; VRRP is IEEE standard.", "example": "Multi-vendor networks require VRRP." }
    ],
    "processesAndWorkflows": [
      { "title": "Gateway Failover Sequence", "summary": "Active router election and standby promotion.", "steps": ["Active router misses Hello packets", "Standby router times out", "Standby assumes virtual IP and MAC"] }
    ],
    "importantRelationships": [
      { "relation": "GLBP vs HSRP", "impact": "GLBP provides active-active load balancing, whereas HSRP is active-standby." }
    ],
    "commonMistakes": [
      { "misconception": "Applying ACLs on the Core Layer", "correctUnderstanding": "ACLs must be placed on Distribution or Access to avoid core latency spikes." }
    ],
    "examReminders": ["Memorize VRRP and HSRP virtual MAC prefixes"],
    "estimatedReviewMinutes": 5
  },
  "flashcards": [
    {
      "front": "What is the primary function of the Core Layer in the 3-layer hierarchical model?",
      "back": "To provide high-speed, low-latency transport of traffic across the backbone without packet filtering.",
      "topic": "Hierarchical Architecture",
      "cardType": "concept_definition",
      "difficulty": "foundational"
    },
    {
      "front": "Which layer of the hierarchical network model enforces security ACLs and QoS policies?",
      "back": "The Distribution Layer.",
      "topic": "Hierarchical Architecture",
      "cardType": "principle_application",
      "difficulty": "intermediate"
    },
    {
      "front": "What is the virtual MAC address pattern used by Cisco HSRP version 1?",
      "back": "0000.0c07.acXX (where XX represents the HSRP group number in hexadecimal).",
      "topic": "Redundancy Protocols",
      "cardType": "terminology",
      "difficulty": "advanced"
    },
    {
      "front": "How does GLBP differ fundamentally from standard HSRP and VRRP?",
      "back": "GLBP supports active-active load balancing across multiple routers simultaneously, rather than active-standby.",
      "topic": "Redundancy Protocols",
      "cardType": "comparison",
      "difficulty": "intermediate"
    },
    {
      "front": "Which standard protocol prevents layer 2 switching loops in campus redundant topology?",
      "back": "Spanning Tree Protocol (STP / IEEE 802.1D and RSTP / IEEE 802.1w).",
      "topic": "Layer 2 Redundancy",
      "cardType": "concept_definition",
      "difficulty": "foundational"
    },
    {
      "front": "Where should Port Security and PoE be implemented in the hierarchical network model?",
      "back": "At the Access Layer, where end-user devices connect to the switch infrastructure.",
      "topic": "Hierarchical Architecture",
      "cardType": "principle_application",
      "difficulty": "foundational"
    }
  ],
  "quizzes": [
    {
      "question": "An enterprise engineer needs to implement default gateway redundancy in a multi-vendor network with Juniper and Cisco routers. Which protocol should be chosen?",
      "options": ["HSRP", "VRRP", "GLBP", "STP"],
      "correctIndex": 1,
      "explanation": "VRRP is the open IEEE standard protocol supported across all network vendors, whereas HSRP is Cisco proprietary.",
      "topic": "Redundancy Protocols",
      "difficulty": "medium",
      "questionType": "application",
      "conceptTested": "Vendor Interoperability in FHRP",
      "recommendedSection": "Distribution Layer Protocols",
      "distractorRationale": ["HSRP is Cisco proprietary and unsupported on multi-vendor switches", "VRRP is open standard (correct)", "GLBP is Cisco proprietary", "STP is a layer 2 protocol, not a gateway redundancy protocol"]
    },
    {
      "question": "Why is packet filtering and access control strictly discouraged on Core Layer switches?",
      "options": ["Core switches lack ASIC hardware", "Packet inspection introduces CPU latency and degrades high-speed backbone throughput", "Core switches operate only at Layer 1", "Core switches do not support VLAN encapsulation"],
      "correctIndex": 1,
      "explanation": "The core layer is engineered exclusively for maximum switching speed; CPU-intensive packet filtering must be handled at the distribution layer.",
      "topic": "Hierarchical Architecture",
      "difficulty": "medium",
      "questionType": "conceptual-reasoning",
      "conceptTested": "Core Layer Design Constraints",
      "recommendedSection": "Enterprise Core Design",
      "distractorRationale": ["Core switches have advanced ASICs", "Correct rationale regarding throughput and latency", "Core switches are L2/L3", "Core switches fully support VLANs"]
    },
    {
      "question": "What is the key advantage of GLBP over traditional HSRP?",
      "options": ["Zero convergence time", "Simultaneous active-active gateway traffic forwarding", "Runs without IP addresses", "Operates at Layer 7"],
      "correctIndex": 1,
      "explanation": "GLBP (Gateway Load Balancing Protocol) allows all group members to forward traffic simultaneously using multiple virtual MAC addresses.",
      "topic": "Redundancy Protocols",
      "difficulty": "hard",
      "questionType": "comparison",
      "conceptTested": "Load Sharing Mechanisms",
      "recommendedSection": "FHRP Load Balancing",
      "distractorRationale": ["Convergence is not zero", "Active-active forwarding (correct)", "GLBP requires IP addresses", "GLBP operates at Layer 3/FHRP"]
    }
  ],
  "writtenTests": [
    {
      "prompt": "Compare and contrast HSRP, VRRP, and GLBP. In your answer, analyze their standards status, virtual MAC addressing conventions, and operational forwarding models.",
      "modelAnswer": "HSRP (Cisco proprietary) and VRRP (IEEE open standard) both implement an active-standby gateway architecture where one router actively forwards packets while standby routers remain idle until failover. HSRP uses virtual MAC prefix 0000.0c07.acXX, whereas VRRP uses 00-00-5E-00-01-XX. In contrast, GLBP provides active-active forwarding, utilizing an Active Virtual Gateway (AVG) to assign different virtual MAC addresses to Active Virtual Forwarders (AVFs), allowing simultaneous utilization of all redundant uplink bandwidth.",
      "keyRubricPoints": [
        "Standards differentiation (HSRP/GLBP Cisco proprietary vs VRRP open standard)",
        "Addressing conventions (HSRP vs VRRP virtual MAC prefixes)",
        "Forwarding architecture (Active-standby in HSRP/VRRP vs Active-active in GLBP)",
        "AVG and AVF mechanism in GLBP"
      ],
      "topic": "FHRP Architecture",
      "marks": 10,
      "difficulty": "advanced",
      "actionVerb": "compare",
      "expectedAnswerPoints": [
        "Identifies vendor constraints",
        "States virtual MAC formats accurately",
        "Contrasts standby vs load-balanced forwarding",
        "Summarizes election and failover mechanisms"
      ],
      "gradingRubric": [
        { "criterion": "Protocol Classification", "maxMarks": 2, "description": "Correct identification of proprietary vs open standards" },
        { "criterion": "Addressing Details", "maxMarks": 3, "description": "Accurate virtual IP and virtual MAC prefix knowledge" },
        { "criterion": "Forwarding Dynamics", "maxMarks": 3, "description": "Deep comparison of active-standby vs active-active models" },
        { "criterion": "Engineering Synthesis", "maxMarks": 2, "description": "Practical application recommendation for enterprise networks" }
      ]
    },
    {
      "prompt": "Explain the architectural rationale behind separating an enterprise network into Core, Distribution, and Access layers rather than deploying a flat network topology.",
      "modelAnswer": "A flat network topology suffers from unbounded broadcast domains, single points of failure, unmanageable routing tables, and unpredictable latency. The 3-layer hierarchical architecture isolates fault domains, enables modular growth without redesign, and distributes policy enforcement efficiently. The Core provides deterministic high-speed transport, the Distribution layer aggregates VLANs and enforces security/QoS policies, and the Access layer provides secure edge connectivity with Port Security and 802.1X.",
      "keyRubricPoints": [
        "Drawbacks of flat topologies (broadcast domains, scalability limits)",
        "Functional isolation of Core, Distribution, and Access layers",
        "Deterministic latency and fault domain containment",
        "Policy placement rationale at the Distribution layer"
      ],
      "topic": "Hierarchical Design",
      "marks": 10,
      "difficulty": "intermediate",
      "actionVerb": "explain",
      "expectedAnswerPoints": [
        "Broadcast domain containment",
        "Layer role definitions",
        "Policy offloading from core",
        "Scalability and maintainability"
      ],
      "gradingRubric": [
        { "criterion": "Problem Context", "maxMarks": 2, "description": "Accurate analysis of flat topology failures" },
        { "criterion": "Layer Mechanics", "maxMarks": 4, "description": "Clear functional demarcation of all three layers" },
        { "criterion": "Engineering Rationale", "maxMarks": 4, "description": "Fault domain isolation and performance justification" }
      ]
    }
  ],
  "fillBlanks": [
    {
      "sentenceWithBlank": "The standard IEEE protocol for First Hop Redundancy is [VRRP], which allows multi-vendor router interoperability.",
      "blankAnswer": "VRRP",
      "acceptedAlternatives": ["Virtual Router Redundancy Protocol"],
      "hint": "Open standard counterpart to Cisco HSRP",
      "explanation": "VRRP (Virtual Router Redundancy Protocol) is an open IEEE standard protocol providing default gateway survivability across heterogeneous vendor equipment.",
      "topic": "Redundancy Protocols",
      "blankType": "terminology"
    },
    {
      "sentenceWithBlank": "In the Cisco hierarchical model, [Distribution] switches are responsible for routing policy enforcement, access control lists (ACLs), and VLAN routing.",
      "blankAnswer": "Distribution",
      "acceptedAlternatives": ["distribution layer"],
      "hint": "The middle layer between Core and Access",
      "explanation": "The Distribution Layer serves as the boundary and policy enforcer, preventing policy processing overhead from slowing the Core Layer.",
      "topic": "Hierarchical Architecture",
      "blankType": "classification"
    },
    {
      "sentenceWithBlank": "Unlike HSRP and VRRP which operate in active-standby mode, [GLBP] allows multiple routers to simultaneously forward traffic.",
      "blankAnswer": "GLBP",
      "acceptedAlternatives": ["Gateway Load Balancing Protocol"],
      "hint": "Gateway Load Balancing Protocol",
      "explanation": "GLBP achieves active-active gateway utilization by assigning unique virtual MAC addresses to each active forwarder router.",
      "topic": "Redundancy Protocols",
      "blankType": "principle"
    }
  ],
  "notes": {
    "summary": "This lecture monograph synthesizes the structural axioms of enterprise network engineering. Students explore the 3-layer hierarchical topology (Core, Distribution, Access), examining why policy demarcation is separated from backbone transit. The session details First Hop Redundancy Protocols (HSRP, VRRP, GLBP), establishing their packet mechanics, virtual MAC schemas, and load-sharing capabilities.",
    "learningObjectives": [
      "Analyze Core, Distribution, and Access architectural responsibilities",
      "Differentiate HSRP, VRRP, and GLBP operational mechanisms",
      "Formulate layer 2 and layer 3 high availability design patterns"
    ],
    "keyConcepts": [
      {
        "unit": "Unit 1.0",
        "concept": "Three-Layer Hierarchical Network Design",
        "definition": "A modular architecture dividing network functions into Core, Distribution, and Access layers.",
        "explanation": "By decoupling packet forwarding speed from policy processing, the hierarchical architecture eliminates broadcast explosion and bottlenecks. The Core switches raw packets at wire speed; the Distribution aggregates VLANs, applies ACLs, and shapes QoS; and the Access enforces 802.1X and port security.",
        "whyItMatters": "Prevents catastrophic network-wide broadcast storms and allows seamless horizontal scalability.",
        "example": "A university campus network with 10 buildings connected via high-speed fiber core.",
        "lecturerExample": "A central campus core router forwarding 40Gbps between engineering and medical faculties without ACL processing delays.",
        "assumptions": "High-density fiber uplinks and redundant power supplies on core switches.",
        "relatedConcepts": ["Core Layer", "Distribution Layer", "Access Layer"],
        "takeaway": "Never compromise Core layer speed with software packet inspection.",
        "tradeoffs": "Requires dedicated hardware investment compared to flat unmanaged topologies.",
        "examTip": "Always identify the Distribution layer as the correct placement for ACL policies.",
        "activeRecallPrompt": "Where should routing policies and security ACLs be placed in a 3-tier model?",
        "activeRecallAnswer": "At the Distribution Layer."
      },
      {
        "unit": "Unit 2.0",
        "concept": "First Hop Redundancy Protocols (FHRP)",
        "definition": "Protocols that provide transparent default gateway failover by assigning a shared virtual IP and MAC address.",
        "explanation": "End-user hosts typically configure a single static default gateway IP. When the active router fails, FHRP ensures standby routers immediately assume the virtual IP and MAC address, transparently preserving end-user sessions without client reconfiguration.",
        "whyItMatters": "Guarantees 99.999% uptime for mission-critical campus and enterprise applications.",
        "example": "HSRP failover taking over in under 3 seconds when a primary router PSU fails.",
        "lecturerExample": "Hospital ICU telemetry systems continuing continuous server communication during a core switch reboot.",
        "assumptions": "All redundant routers share the same broadcast domain on the client side.",
        "relatedConcepts": ["HSRP", "VRRP", "GLBP"],
        "takeaway": "Choose VRRP for multi-vendor networks; choose GLBP when active-active load sharing is required.",
        "tradeoffs": "HSRP and VRRP leave standby uplink bandwidth idle; GLBP increases control plane memory overhead.",
        "examTip": "Memorize the HSRP virtual MAC address prefix: 0000.0c07.acXX.",
        "activeRecallPrompt": "What virtual MAC prefix identifies HSRP version 1 traffic?",
        "activeRecallAnswer": "0000.0c07.acXX"
      }
    ],
    "principlesAndTheories": [
      {
        "title": "Axiom of Core Simplicity",
        "principle": "The network core must perform deterministic packet switching without policy inspection.",
        "explanation": "Adding packet inspection or access control lists to core routers creates CPU packet queuing, degrading backbone throughput across the entire organization.",
        "scopeOfValidity": "All enterprise, service provider, and university campus backbones.",
        "examApplication": "High-frequency question in Exit Exams testing layer responsibilities."
      }
    ],
    "classificationsAndCategories": [
      {
        "title": "Comparison of First Hop Redundancy Protocols",
        "headers": ["Protocol", "Standard", "Forwarding Model", "Virtual MAC Prefix"],
        "rows": [
          ["HSRP", "Cisco Proprietary", "Active / Standby", "0000.0c07.acXX"],
          ["VRRP", "IEEE Open Standard", "Master / Backup", "00-00-5E-00-01-XX"],
          ["GLBP", "Cisco Proprietary", "Active / Active Load Balanced", "0007.b400.XXYY"]
        ],
        "description": "Comprehensive comparative matrix for network gateway survivability protocols."
      }
    ],
    "processesAndWorkflows": [
      {
        "processName": "FHRP Failover and Preemption Workflow",
        "objective": "Transparent default gateway recovery upon primary hardware failure.",
        "steps": [
          { "stepNumber": 1, "title": "Heartbeat Failure", "description": "Standby router detects loss of consecutive Hello timer packets from Active router." },
          { "stepNumber": 2, "title": "Promotion Transition", "description": "Standby transitions through Speak state and assumes Active status." },
          { "stepNumber": 3, "title": "Gratuitous ARP Broadcast", "description": "New Active router sends Gratuitous ARP to update switch MAC address CAM tables." },
          { "stepNumber": 4, "title": "Traffic Resumption", "description": "Host packets immediately flow to new Active router without client IP change." }
        ]
      }
    ],
    "clarifyingExamples": [
      {
        "title": "Multi-Vendor Campus Gateway Deployment",
        "conceptIllustrated": "VRRP Standard Interoperability",
        "scenario": "A campus distribution layer has one Cisco Catalyst 9500 and one Aruba CX 6400 switch.",
        "analysis": "HSRP cannot be utilized because Aruba switches cannot run Cisco proprietary protocols. VRRP must be deployed.",
        "examinerTrap": "Selecting HSRP on exam questions where non-Cisco equipment is present."
      }
    ],
    "commonConfusions": [
      {
        "conceptA": "HSRP / VRRP",
        "conceptB": "GLBP",
        "keyDistinction": "HSRP and VRRP forward traffic through ONLY one active router at a time; GLBP forwards through all routers concurrently.",
        "mnemonicOrRule": "GLBP has 'LB' for Load Balancing; HSRP has 'S' for Standby."
      }
    ],
    "examFocusedKnowledge": {
      "highYieldFacts": [
        "Core layer switches should NEVER filter packets using ACLs.",
        "VRRP is defined under RFC 3768 as an open standard.",
        "GLBP uses an Active Virtual Gateway (AVG) to respond to host ARP requests with different AVF MACs."
      ],
      "mustKnowRelationships": [
        "Higher priority value wins the HSRP/VRRP Active router election (default priority is 100)."
      ],
      "formulaTriggers": [
        "HSRP Group 10 in hex is 0A -> MAC is 0000.0c07.ac0a"
      ],
      "topExamMistakes": [
        "Confusing Spanning Tree Protocol (Layer 2) with FHRP (Layer 3 gateway)."
      ]
    },
    "finalTakeaways": [
      "Hierarchical design isolates failures and enables unbounded scale.",
      "Distribution layer is the workhorse of policy, routing, and access control.",
      "FHRP provides fault tolerance at the client access edge."
    ],
    "definitions": [
      { "term": "FHRP", "definition": "First Hop Redundancy Protocol.", "academicContext": "Default gateway survivability technology.", "highYield": true },
      { "term": "Core Layer", "definition": "High speed packet switching backbone of enterprise network.", "academicContext": "Hierarchical network architecture.", "highYield": true }
    ],
    "formulasAndRules": [
      {
        "title": "HSRP Priority Formula",
        "formula": "Priority = Base + Priority_Increment",
        "derivationSummary": "Standard configuration where highest priority router becomes Active.",
        "explanation": "Default priority is 100. Priority can be incremented up to 255.",
        "variables": [{ "symbol": "Base", "label": "Default router priority (100)" }],
        "implication": "Allows deterministic primary path control.",
        "validityConditions": "Preemption must be enabled on the primary router.",
        "examTrick": "Without 'preempt' enabled, a higher-priority router will NOT take over an existing active router."
      }
    ],
    "studyTips": [
      "Always memorize the virtual MAC address formats for HSRP and VRRP.",
      "Remember that Core = Speed, Distribution = Policy, Access = Endpoints."
    ]
  },
  "podcast": {
    "title": "Enterprise Network Architecture Brief",
    "hosts": ["Alex (Tutor)", "Jordan (Student)"],
    "durationEstimate": "3-5 mins",
    "dialogue": [
      { "id": "1", "speaker": "Alex (Tutor)", "role": "Academic AI Tutor", "text": "Welcome Jordan! Today we're breaking down enterprise network hierarchy.", "timestampSeconds": 0 },
      { "id": "2", "speaker": "Jordan (Student)", "role": "Freshman Student", "text": "Awesome! Why can't we just connect all switches together in one big flat network?", "timestampSeconds": 10 }
    ]
  }
}`;

const res = await client.chat.completions.create({
  model: "gemini-flash-lite-latest",
  response_format: { type: "json_object" },
  max_tokens: 8192,
  temperature: 0.2,
  messages: [{ role: "user", content: prompt }],
});

const content = res.choices[0]?.message?.content;
console.log("Response length characters:", content?.length);
const parsed = JSON.parse(content);
console.log("SUCCESS! Parsed title:", parsed.title);
console.log("Flashcards generated:", parsed.flashcards?.length);
console.log("Quizzes generated:", parsed.quizzes?.length);
console.log("Written tests generated:", parsed.writtenTests?.length);
console.log("Fill blanks generated:", parsed.fillBlanks?.length);
console.log("Overview context:", parsed.overview?.academicContext?.slice(0, 80));
console.log("Cheat sheet principles:", parsed.cheatSheet?.corePrinciples?.length);
console.log("Notes summary:", parsed.notes?.summary?.slice(0, 80));
