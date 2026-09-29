import {
  ArrowUp,
  BookMarked,
  BookOpen,
  Bot,
  FileText,
  GraduationCap,
  Languages,
  Loader2,
  Menu,
  Paperclip,
  RotateCcw,
  Settings,
  Sparkles,
  Square,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useIntegrations } from "@/hooks/use-integrations";
import {
  createNewConversation,
  deleteConversation,
  getStoredConversations,
  renameConversation,
  saveConversation,
  subscribeToAiChatStore,
  type Conversation,
  type ChatMessage as ChatMessageType,
} from "@/lib/ai-chat-store";
import { chatWithAiStudy } from "@/lib/api/ai-study.functions";
import { libraryBooks, type LibraryBook } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { AiProviderSettingsModal } from "./AiProviderSettingsModal";
import { ChatMessage } from "./ChatMessage";
import { ConversationSidebar } from "./ConversationSidebar";
import { PromptSuggestions } from "./PromptSuggestions";
import { detectSubject, detectSubjectFromText } from "./subject";
import { ACCEPT_TYPES, extractFileText, validateFile } from "./text-extraction";

const ETHIOPIAN_COURSES = [
  "General Physics (Phys 1011)",
  "Freshman Mathematics (Math 1011)",
  "Logic & Critical Thinking (Phil 1011)",
  "General Biology (Biol 1011)",
  "General Chemistry (Chem 1011)",
  "Communicative English Skills (EnLa 1011)",
  "Intro to Psychology (Psyc 1011)",
  "Civics & Ethics (CESt 1023)",
  "Global Trends (GlTr 1012)",
  "Intro to Computer Programming (CoSc 1011)",
  "National Exit Exam General",
];

interface AIChatProps {
  initialPrompt?: string;
  initialCourse?: string;
  initialTool?: string;
  className?: string;
}

export function AIChat({ initialPrompt, initialCourse, initialTool, className }: AIChatProps) {
  const { user } = useAuth();
  const { config: integrations } = useIntegrations();

  const [conversations, setConversations] = useState<Conversation[]>(() => getStoredConversations());
  const [activeConvId, setActiveConvId] = useState<string>(() => {
    const list = getStoredConversations();
    return list[0]?.id || "conv-welcome";
  });

  const [input, setInput] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>(
    initialCourse || conversations[0]?.course || ETHIOPIAN_COURSES[0],
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<"en" | "am">("en");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // File & Book Attachment State
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: number;
    text: string;
  } | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Subscribe to store updates
  useEffect(() => {
    return subscribeToAiChatStore(() => {
      setConversations(getStoredConversations());
    });
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isGenerating]);

  // Handle external initial prompt if provided
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt, initialTool);
    }
  }, [initialPrompt]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsExtractingFile(true);
    toast.info(`Extracting text from ${file.name}...`);

    try {
      const text = await extractFileText(file);
      if (!text || text.trim().length < 20) {
        toast.error(`Could not extract readable text from ${file.name}. Ensure it contains selectable text.`);
        return;
      }

      setAttachedFile({
        name: file.name,
        size: file.size,
        text,
      });

      // Auto-detect subject if relevant
      const detected = detectSubjectFromText(text) || detectSubject(file.name);
      if (detected && detected !== "general") {
        const match = ETHIOPIAN_COURSES.find((c) => c.toLowerCase().includes(detected));
        if (match) setSelectedCourse(match);
      }

      toast.success(`Attached "${file.name}" (${(text.length / 1000).toFixed(1)}k characters extracted)`);
    } catch {
      toast.error(`Failed to process "${file.name}".`);
    } finally {
      setIsExtractingFile(false);
      e.target.value = "";
    }
  };

  const handleSend = async (textToSend?: string, tool?: string) => {
    const rawText = (textToSend ?? input).trim();
    if (!rawText || isGenerating) return;

    if (!textToSend) {
      setInput("");
    }

    const currentConv = activeConversation;
    if (!currentConv) return;

    // Build the user message for display
    let displayTitle = rawText;
    if (attachedFile) {
      displayTitle = `[Attached: ${attachedFile.name}] ${rawText}`;
    } else if (selectedBook) {
      displayTitle = `[Book: ${selectedBook.name}] ${rawText}`;
    }

    const userMessage: ChatMessageType = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: displayTitle,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      course: selectedCourse,
      tool,
    };

    // If it's the first message of a new conversation, title it from the prompt
    let title = currentConv.title;
    if (currentConv.messages.length <= 1) {
      title = rawText.slice(0, 32).trim() + (rawText.length > 32 ? "..." : "");
    }

    const updatedMessages = [...currentConv.messages, userMessage];
    const updatedConv: Conversation = {
      ...currentConv,
      title,
      course: selectedCourse,
      messages: updatedMessages,
    };

    saveConversation(updatedConv);
    setConversations(getStoredConversations());
    setIsGenerating(true);

    // Build rich context with attached material if present
    let apiPrompt = rawText;
    if (attachedFile) {
      apiPrompt = `[SOURCE MATERIAL FILE: "${attachedFile.name}"]\n${attachedFile.text.slice(0, 10000)}\n\nSTUDENT QUESTION / INSTRUCTION:\n${rawText}`;
    } else if (selectedBook) {
      apiPrompt = `[CURRICULUM TEXTBOOK: "${selectedBook.name}" (${selectedBook.category})]\nOverview: ${selectedBook.description}\nSyllabus Units:\n${selectedBook.chapterList.map((c) => `- ${c.title}`).join("\n")}\n\nSTUDENT QUESTION / INSTRUCTION:\n${rawText}`;
    }

    // Prepare API call
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const activeProvider = integrations.aiStudy.provider;
      const settings = integrations.aiStudy.providers?.[activeProvider];
      const apiKey = settings?.apiKey?.trim() || integrations.aiStudy.apiKey?.trim();

      const messagesForApi = updatedMessages.map((m, idx) => {
        // Feed full extracted material on the latest user message
        const isLatest = idx === updatedMessages.length - 1;
        return {
          role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: isLatest ? apiPrompt : m.text,
        };
      });

      const res = await chatWithAiStudy({
        data: {
          messages: messagesForApi,
          course: selectedCourse,
          tool: tool || "general",
          language: activeLanguage,
          provider: activeProvider,
          apiKey: apiKey || undefined,
          model: settings?.model || undefined,
          baseUrl: settings?.baseUrl || undefined,
          systemPrompt: integrations.aiStudy.systemPrompt,
          temperature: integrations.aiStudy.temperature,
        },
      });

      if (!controller.signal.aborted) {
        const assistantMessage: ChatMessageType = {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          text: res.content,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          course: selectedCourse,
          tool,
        };

        const finalConv: Conversation = {
          ...updatedConv,
          messages: [...updatedMessages, assistantMessage],
        };
        saveConversation(finalConv);
        setConversations(getStoredConversations());
      }
    } catch {
      if (!controller.signal.aborted) {
        toast.error("Failed to generate response. Please try again.");
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      toast.info("AI generation stopped.");
    }
  };

  const handleNewConversation = () => {
    const created = createNewConversation(selectedCourse);
    setActiveConvId(created.id);
    setAttachedFile(null);
    setSelectedBook(null);
  };

  const handleDeleteConversation = (id: string) => {
    deleteConversation(id);
    const remaining = getStoredConversations();
    if (activeConvId === id) {
      setActiveConvId(remaining[0]?.id || "conv-welcome");
    }
  };

  const handleClearConversation = () => {
    if (!activeConversation) return;
    const resetConv: Conversation = {
      ...activeConversation,
      messages: [
        {
          id: `msg-reset-${Date.now()}`,
          sender: "assistant",
          text: `### Conversation Cleared 🔄\n\nHow can I help you study **${selectedCourse}**? Ask a question, attach a PDF/PPT, or pick a suggested prompt below.`,
          timestamp: "Just now",
          course: selectedCourse,
        },
      ],
    };
    saveConversation(resetConv);
    setConversations(getStoredConversations());
    toast.success("Conversation history cleared");
  };

  const handleFeedback = (messageId: string, feedback: "helpful" | "unhelpful") => {
    if (!activeConversation) return;
    const updatedMessages = activeConversation.messages.map((m) =>
      m.id === messageId ? { ...m, feedback } : m,
    );
    saveConversation({ ...activeConversation, messages: updatedMessages });
    setConversations(getStoredConversations());
    toast.success(feedback === "helpful" ? "Thanks for your feedback!" : "Feedback recorded");
  };

  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length < 2) return;
    const lastUserMsg = [...activeConversation.messages]
      .reverse()
      .find((m) => m.sender === "user");
    if (lastUserMsg) {
      handleSend(lastUserMsg.text, lastUserMsg.tool);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasAIConfig = integrations.aiStudy.enabled && Boolean(integrations.aiStudy.apiKey);

  return (
    <div
      className={cn(
        "flex h-[750px] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 mx-auto",
        className,
      )}
    >
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={(id) => setActiveConvId(id)}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        onRename={(id, title) => {
          renameConversation(id, title);
          setConversations(getStoredConversations());
        }}
        onClearAll={() => {
          const list = getStoredConversations();
          list.forEach((c) => deleteConversation(c.id));
          handleNewConversation();
        }}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0 bg-slate-50/40 dark:bg-slate-950/40">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
              title="Open conversations"
            >
              <Menu className="size-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                <Bot className="size-4" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-serif text-sm font-bold text-brand-navy dark:text-white">
                  {activeConversation?.title || "Studley AI Tutor"}
                </h3>
                {/* Clickable AI status pill that opens AI Provider Settings */}
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-brand-navy dark:hover:text-brand-gold transition"
                  title="Configure AI API provider & key"
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      hasAIConfig ? "bg-emerald-500 animate-pulse" : "bg-brand-gold",
                    )}
                  />
                  <span>
                    {hasAIConfig
                      ? `${integrations.aiStudy.provider.toUpperCase()} Connected`
                      : "Curriculum Engine (Click to Connect AI)"}
                  </span>
                  <Settings className="size-3 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Toolbar: Course, Book, Language */}
          <div className="flex items-center gap-2">
            {/* Course Selector */}
            <div className="w-40 sm:w-52">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="h-8 rounded-xl text-xs font-semibold border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                  <GraduationCap className="mr-1.5 size-3.5 text-brand-gold shrink-0" />
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent className="max-h-64 text-xs font-medium">
                  {ETHIOPIAN_COURSES.map((course) => (
                    <SelectItem key={course} value={course} className="text-xs">
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Curriculum Book Selector Dropdown */}
            <div className="hidden lg:block w-36">
              <Select
                value={selectedBook?.id || "none"}
                onValueChange={(val) => {
                  if (val === "none") {
                    setSelectedBook(null);
                  } else {
                    const b = libraryBooks.find((item) => item.id === val);
                    setSelectedBook(b || null);
                    if (b) toast.success(`AI Tutor grounded on "${b.name}"!`);
                  }
                }}
              >
                <SelectTrigger className="h-8 rounded-xl text-xs font-semibold border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                  <BookOpen className="mr-1.5 size-3.5 text-blue-500 shrink-0" />
                  <SelectValue placeholder="Ground on Book" />
                </SelectTrigger>
                <SelectContent className="max-h-64 text-xs font-medium">
                  <SelectItem value="none" className="text-xs text-slate-400">
                    No specific book
                  </SelectItem>
                  {libraryBooks.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setActiveLanguage((l) => (l === "en" ? "am" : "en"))}
              className={cn(
                "flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-bold transition",
                activeLanguage === "am"
                  ? "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-200"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
              )}
              title="Toggle Amharic / English"
            >
              <Languages className="size-3.5" />
              <span>{activeLanguage === "am" ? "አማርኛ" : "EN"}</span>
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={handleClearConversation}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="Reset conversation"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeConversation?.messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              course={selectedCourse}
              onFeedback={handleFeedback}
              onRegenerate={handleRegenerate}
            />
          ))}

          {/* Typing State */}
          {isGenerating && (
            <div className="flex items-center gap-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-gold animate-pulse">
                <Sparkles className="size-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <span className="size-2 rounded-full bg-brand-gold animate-bounce" />
                <span className="size-2 rounded-full bg-brand-gold animate-bounce [animation-delay:0.2s]" />
                <span className="size-2 rounded-full bg-brand-gold animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs font-semibold ml-1 text-brand-navy dark:text-white">
                  Studley is analyzing Ethiopian exam materials...
                </span>
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="ml-3 flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  <Square className="size-3 fill-current" />
                  Stop
                </button>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Bottom Composer */}
        <div className="border-t border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
          {/* Active Attachments Bar */}
          {(attachedFile || selectedBook || isExtractingFile) && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-100/80 p-2 dark:bg-slate-800/80 text-xs">
              {isExtractingFile && (
                <div className="flex items-center gap-2 text-brand-navy dark:text-brand-gold font-semibold">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Extracting text from PDF/PPT...</span>
                </div>
              )}

              {attachedFile && (
                <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 font-medium text-slate-700 shadow-2xs dark:bg-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <FileText className="size-3.5 text-rose-500" />
                  <span className="max-w-[200px] truncate font-bold">{attachedFile.name}</span>
                  <span className="text-[10px] text-slate-400">
                    ({(attachedFile.text.length / 1000).toFixed(1)}k chars)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="rounded p-0.5 text-slate-400 hover:text-rose-600"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}

              {selectedBook && (
                <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 font-medium text-slate-700 shadow-2xs dark:bg-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <BookOpen className="size-3.5 text-blue-500" />
                  <span className="max-w-[200px] truncate font-bold">{selectedBook.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="rounded p-0.5 text-slate-400 hover:text-rose-600"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}

              {/* Quick file action chips */}
              {attachedFile && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleSend("Summarize the key concepts and formulas from this uploaded file.")}
                    className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-navy hover:bg-brand-navy hover:text-white transition shadow-2xs dark:bg-slate-900 dark:text-brand-gold"
                  >
                    Summarize File
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend("Generate 10 Exit Exam multiple-choice questions from this uploaded material.")}
                    className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-navy hover:bg-brand-navy hover:text-white transition shadow-2xs dark:bg-slate-900 dark:text-brand-gold"
                  >
                    Generate 10 MCQs
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Suggestions (if messages are few) */}
          {(!activeConversation || activeConversation.messages.length <= 2) && !attachedFile && (
            <PromptSuggestions
              course={selectedCourse}
              onSelectPrompt={(p, tool) => handleSend(p, tool)}
            />
          )}

          {/* Input Box with File Attachment trigger */}
          <div className="relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 shadow-xs transition focus-within:border-brand-navy focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-navy/10 dark:border-slate-800 dark:bg-slate-950 dark:focus-within:border-brand-gold">
            {/* Paperclip Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-400 hover:text-brand-navy dark:hover:text-brand-gold transition rounded-xl hover:bg-slate-200/50"
              title="Attach PDF, PPT, Word, or Notes file"
            >
              <Paperclip className="size-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_TYPES}
              onChange={handleFileChange}
              className="sr-only"
            />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                attachedFile
                  ? `Ask Studley anything about ${attachedFile.name}...`
                  : `Ask Studley anything about ${selectedCourse} (Press Enter to send)...`
              }
              rows={2}
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />

            <div className="flex items-center gap-1 pb-1 pr-1">
              {isGenerating ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStopGeneration}
                  className="size-8 rounded-xl bg-rose-600 p-0 text-white hover:bg-rose-700 shadow-xs"
                  title="Stop generation"
                >
                  <Square className="size-4 fill-current" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={!input.trim()}
                  onClick={() => handleSend()}
                  className="size-8 rounded-xl bg-brand-navy p-0 text-white hover:bg-brand-navy/90 disabled:opacity-30 shadow-xs dark:bg-brand-gold dark:text-slate-950"
                  title="Send message"
                >
                  <ArrowUp className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span>📎 Attach PDF, PPT, PPTX, or DOC to chat directly with lecture notes</span>
            </span>
            <span className="hidden sm:inline">Shift + Enter for new line</span>
          </div>
        </div>
      </div>

      {/* Real AI Provider Settings Modal */}
      <AiProviderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
