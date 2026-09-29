import {
  Check,
  Edit2,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/lib/ai-chat-store";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onClearAll,
  isOpenMobile,
  onCloseMobile,
  className,
}: ConversationSidebarProps) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.course.toLowerCase().includes(search.toLowerCase()),
  );

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={cn(
          "flex flex-col border-r border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/70 transition-all duration-300",
          isOpenMobile
            ? "fixed inset-y-0 left-0 z-50 w-72 shadow-2xl bg-white dark:bg-slate-900"
            : "hidden md:flex md:w-64 lg:w-72 shrink-0",
          className,
        )}
      >
        {/* Top actions */}
        <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Chats & Sessions
            </span>
            {isOpenMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 md:hidden"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Button
            type="button"
            onClick={() => {
              onNew();
              onCloseMobile?.();
            }}
            className="w-full justify-start rounded-xl bg-brand-navy font-bold text-white shadow-xs hover:bg-brand-navy/90 dark:bg-brand-navy dark:hover:bg-brand-navy/80"
          >
            <Plus className="mr-2 size-4 text-brand-gold" />
            New Conversation
          </Button>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-xs outline-none transition focus:border-brand-navy dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No conversations found.
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === activeId;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelect(conv.id);
                      onCloseMobile?.();
                    }
                  }}
                  className={cn(
                    "group relative flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors",
                    isActive
                      ? "bg-white text-brand-navy font-bold shadow-xs border border-slate-200/90 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                      : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare
                      className={cn(
                        "size-3.5 shrink-0",
                        isActive ? "text-brand-gold" : "text-slate-400",
                      )}
                    />

                    {isEditing ? (
                      <form
                        onSubmit={(e) => saveRename(conv.id, e)}
                        className="flex items-center gap-1 flex-1 mr-1"
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          className="w-full rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-900 outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Check className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelRename}
                          className="rounded p-0.5 text-rose-500 hover:bg-rose-50"
                        >
                          <X className="size-3" />
                        </button>
                      </form>
                    ) : (
                      <div className="min-w-0 flex-1 truncate">
                        <span className="block truncate font-medium">{conv.title}</span>
                        <span className="text-[10px] text-slate-400">{conv.course}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions when hovered or active */}
                  {!isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => startRename(conv, e)}
                        className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Rename conversation"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      {conversations.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(conv.id);
                          }}
                          className="rounded p-1 text-slate-400 hover:text-rose-600"
                          title="Delete conversation"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer controls */}
        {conversations.length > 1 && (
          <div className="p-2 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={onClearAll}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition"
            >
              <Trash2 className="size-3" />
              Clear all history
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

