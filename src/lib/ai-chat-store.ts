export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  tool?: string;
  course?: string;
  feedback?: "helpful" | "unhelpful";
  isSaved?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  course: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface SavedAiResponse {
  id: string;
  title: string;
  course: string;
  tool?: string;
  content: string;
  createdAt: string;
  tags: string[];
}

export interface StudyProgressStats {
  questionsAnswered: number;
  cardsMastered: number;
  topicsExplored: number;
  studyStreakDays: number;
  lastActiveDate: string;
  activeHours: number;
}

const CONVERSATIONS_KEY = "study2earn-ai-chat-conversations";
const SAVED_RESPONSES_KEY = "study2earn-ai-saved-responses";
const PROGRESS_KEY = "study2earn-ai-study-progress";

const DEFAULT_CONVERSATION: Conversation = {
  id: "conv-welcome",
  title: "Welcome to AI Study",
  course: "General",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [
    {
      id: "msg-welcome-1",
      sender: "assistant",
      text: `### Welcome to your 2026/2030 AI Study Partner! 🎓

I'm **Studley AI**, calibrated specifically for **Ethiopian university students** (Freshman courses and Exit Exam preparation).

Here is how I can accelerate your learning:
* **📚 Explain Topics**: Break down complex concepts with intuitive real-world analogies and Ethiopian university context.
* **📝 Summarize Notes**: Distill lecture slides, PDF chapters, or handouts into high-yield exam takeaways.
* **🧠 Active Recall & Flashcards**: Generate question-and-answer decks with spaced repetition tracking.
* **❓ Practice Questions & Exit Exams**: Multiple-choice questions with full explanations of distractors.
* **📅 Personalized Study Plans**: Map out a timeline before midterms or national exit exams.
* **🌐 Bilingual Support**: You can ask me in **English** or **Amharic (በአማርኛ)**!

Choose a prompt below or type your question to start!`,
      timestamp: "Just now",
      tool: "general",
      course: "General",
    },
  ],
};

const DEFAULT_PROGRESS: StudyProgressStats = {
  questionsAnswered: 24,
  cardsMastered: 18,
  topicsExplored: 7,
  studyStreakDays: 3,
  lastActiveDate: new Date().toISOString().split("T")[0],
  activeHours: 4.5,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("ai-chat-store-change", { detail: { key } }));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

// Conversation Management
export function getStoredConversations(): Conversation[] {
  const list = readJson<Conversation[]>(CONVERSATIONS_KEY, [DEFAULT_CONVERSATION]);
  return list.length ? list : [DEFAULT_CONVERSATION];
}

export function saveConversation(conversation: Conversation): void {
  const current = getStoredConversations();
  const index = current.findIndex((c) => c.id === conversation.id);
  const updated = {
    ...conversation,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    current[index] = updated;
  } else {
    current.unshift(updated);
  }
  writeJson(CONVERSATIONS_KEY, current);
}

export function addChatMessage(conversationId: string, message: ChatMessage): void {
  const list = getStoredConversations();
  const conv = list.find((c) => c.id === conversationId);
  if (conv) {
    conv.messages.push(message);
    conv.updatedAt = new Date().toISOString();
    saveConversation(conv);
  }
}

export function createNewConversation(course = "General"): Conversation {
  const newConv: Conversation = {
    id: `conv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: "New Study Session",
    course,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: "assistant",
        text: `### Ready to study ${course}! 🚀\n\nWhat would you like to focus on today? You can paste lecture notes, ask me to explain a difficult concept, or generate practice questions for your upcoming exam.`,
        timestamp: "Just now",
        course,
      },
    ],
  };
  const list = getStoredConversations();
  list.unshift(newConv);
  writeJson(CONVERSATIONS_KEY, list);
  return newConv;
}

export function renameConversation(id: string, newTitle: string): void {
  const list = getStoredConversations();
  const conv = list.find((c) => c.id === id);
  if (conv) {
    conv.title = newTitle.trim() || conv.title;
    conv.updatedAt = new Date().toISOString();
    writeJson(CONVERSATIONS_KEY, list);
  }
}

export function deleteConversation(id: string): void {
  const list = getStoredConversations().filter((c) => c.id !== id);
  writeJson(CONVERSATIONS_KEY, list.length ? list : [DEFAULT_CONVERSATION]);
}

export function clearAllConversations(): void {
  writeJson(CONVERSATIONS_KEY, [DEFAULT_CONVERSATION]);
}

// Saved Responses
export function getSavedResponses(): SavedAiResponse[] {
  return readJson<SavedAiResponse[]>(SAVED_RESPONSES_KEY, []);
}

export function addSavedResponse(response: Omit<SavedAiResponse, "id" | "createdAt">): SavedAiResponse {
  const list = getSavedResponses();
  const newEntry: SavedAiResponse = {
    ...response,
    id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  list.unshift(newEntry);
  writeJson(SAVED_RESPONSES_KEY, list);
  return newEntry;
}

export function removeSavedResponse(id: string): void {
  const list = getSavedResponses().filter((r) => r.id !== id);
  writeJson(SAVED_RESPONSES_KEY, list);
}

// Progress Stats
export function getStudyProgressStats(): StudyProgressStats {
  const progress = readJson<StudyProgressStats>(PROGRESS_KEY, DEFAULT_PROGRESS);
  const today = new Date().toISOString().split("T")[0];
  if (progress.lastActiveDate !== today) {
    // Check if streak was maintained
    const lastDate = new Date(progress.lastActiveDate);
    const currDate = new Date(today);
    const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      progress.studyStreakDays += 1;
    } else if (diffDays > 1) {
      progress.studyStreakDays = 1;
    }
    progress.lastActiveDate = today;
    writeJson(PROGRESS_KEY, progress);
  }
  return progress;
}

export function incrementStudyStat(
  stat: "questionsAnswered" | "cardsMastered" | "topicsExplored",
  amount = 1,
): void {
  const current = getStudyProgressStats();
  current[stat] += amount;
  current.activeHours += Math.round((amount * 0.05) * 10) / 10;
  writeJson(PROGRESS_KEY, current);
}

// Event subscription for reactive updates
export function subscribeToAiChatStore(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("ai-chat-store-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("ai-chat-store-change", handler);
    window.removeEventListener("storage", handler);
  };
}
