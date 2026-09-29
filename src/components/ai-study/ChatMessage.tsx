import { Bot, Sparkles, User as UserIcon } from "lucide-react";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import type { ChatMessage as ChatMessageType } from "@/lib/ai-chat-store";
import { cn } from "@/lib/utils";
import { AIResponseActions } from "./AIResponseActions";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatMessageProps {
  message: ChatMessageType;
  course?: string;
  onFeedback?: (messageId: string, feedback: "helpful" | "unhelpful") => void;
  onRegenerate?: () => void;
}

export function ChatMessage({
  message,
  course,
  onFeedback,
  onRegenerate,
}: ChatMessageProps) {
  const { user } = useAuth();
  const isUser = message.sender === "user";

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  return (
    <div
      className={cn(
        "group flex w-full gap-3 py-3 text-sm animate-in fade-in-0 duration-300",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      {isUser ? (
        <Avatar className="size-8 shrink-0 border border-brand-navy/20 shadow-xs">
          {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
          <AvatarFallback className="bg-brand-navy text-[11px] font-bold text-white">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-navy to-indigo-900 text-brand-gold shadow-xs">
          <Bot className="size-4" />
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={cn(
          "flex max-w-[88%] sm:max-w-[80%] flex-col space-y-1.5",
          isUser ? "items-end" : "items-start",
        )}
      >
        {/* Header metadata */}
        <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {isUser ? user?.name || "Student" : "Studley AI"}
          </span>
          {!isUser && message.course && (
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
              {message.course}
            </span>
          )}
          <span>{message.timestamp}</span>
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-xs",
            isUser
              ? "bg-brand-navy text-white rounded-tr-xs"
              : "border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 rounded-tl-xs",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.text}</p>
          ) : (
            <MarkdownRenderer content={message.text} />
          )}

          {/* Action toolbar for AI responses */}
          {!isUser && (
            <AIResponseActions
              messageId={message.id}
              content={message.text}
              course={message.course || course}
              feedback={message.feedback}
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
              className="mt-2"
            />
          )}
        </div>
      </div>
    </div>
  );
}

