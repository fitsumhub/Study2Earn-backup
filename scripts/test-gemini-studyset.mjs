import { getServerConfig } from "../src/lib/config.server.ts";
import { runCompleteStudySetGeneration } from "../src/lib/ai-study-generation.server.ts";

const config = getServerConfig();
console.log("Starting test with Gemini API Key...");

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

const res = await runCompleteStudySetGeneration({
  text: sampleLecture,
  titleHint: "Network Design Requirements",
  subjectHint: "Computer Science",
  provider: "gemini",
  apiKey: config.geminiApiKey,
  model: "gemini-flash-lite-latest",
});

console.log("Generation Result Status:", res.ok);
console.log("Source:", res.source);
console.log("Title:", res.data.title);
console.log("Flashcards count:", res.data.flashcards?.length);
console.log("Quizzes count:", res.data.quizzes?.length);
console.log("Written tests count:", res.data.writtenTests?.length);
console.log("Fill blanks count:", res.data.fillBlanks?.length);
console.log("Has Overview:", Boolean(res.data.overview));
console.log("Has Cheat Sheet:", Boolean(res.data.cheatSheet));
console.log("Has Notes:", Boolean(res.data.notes));
