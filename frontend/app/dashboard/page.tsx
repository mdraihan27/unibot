"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Plus,
  Search,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Menu,
  X,
  LogOut,
  ArrowUp,
  Loader2,
} from "lucide-react";
import { TokenStorage } from "@/lib/api/tokenStorage";
import { ChatApi, type ChatMessage, type ConversationSummary, type SourceCitation } from "@/lib/api/chat";
import MarkdownMessage from "@/components/MarkdownMessage";

// ---------------------------------------------------------------------------
// Helpers & Date Grouping
// ---------------------------------------------------------------------------

function createLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getFormattedTime(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDateGroup(dateStr?: string): "Today" | "Yesterday" | "Previous 7 Days" {
  if (!dateStr) return "Today";
  const date = new Date(dateStr);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return "Previous 7 Days";
}

function formatMessageText(text: string, isUser = false) {
  if (!text || !text.includes("UNIBOT")) return text;
  const parts = text.split(/(UNIBOT)/g);
  return parts.map((part, i) =>
    part === "UNIBOT" ? (
      <span
        key={i}
        className={
          isUser
            ? "text-white font-extrabold underline decoration-white/40"
            : "text-[#E03E2D] font-bold"
        }
      >
        UNIBOT
      </span>
    ) : (
      part
    )
  );
}

interface DisplayMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  sources?: SourceCitation[];
}

interface DisplaySession {
  id: string;
  title: string;
  dateGroup: "Today" | "Yesterday" | "Previous 7 Days";
  updatedAt: string;
  messages: DisplayMessage[];
}

const DEFAULT_INTRO_MESSAGE: DisplayMessage = {
  id: "intro-msg",
  sender: "bot",
  text: "Hello! I am UNIBOT, your university AI assistant for Jashore University of Science and Technology (JUST). Ask me anything about academic ordinances, grading scales, exam dates, or campus faculty.",
  timestamp: "Just now",
};

const DEFAULT_INITIAL_SESSION: DisplaySession = {
  id: "session-init",
  title: "New Conversation",
  dateGroup: "Today",
  updatedAt: new Date().toISOString(),
  messages: [DEFAULT_INTRO_MESSAGE],
};

export default function DashboardPage() {
  const router = useRouter();

  // Sessions and active chat state
  const [sessions, setSessions] = useState<DisplaySession[]>([DEFAULT_INITIAL_SESSION]);
  const [activeSessionId, setActiveSessionId] = useState<string>("session-init");
  const [searchQuery, setSearchQuery] = useState("");

  // Input and UI state
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isTyping]);

  useEffect(() => {
    let ignore = false;

    async function fetchConversations() {
      const res = await ChatApi.listConversations();
      if (ignore) return;

      if (res.success && res.data && res.data.length > 0) {
        const summaries: ConversationSummary[] = res.data;
        const formattedSessions: DisplaySession[] = summaries.map((s) => ({
          id: s.id,
          title: s.title || "New Conversation",
          dateGroup: getDateGroup(s.updated_at),
          updatedAt: s.updated_at,
          messages: [],
        }));

        setSessions(formattedSessions);
        const firstId = formattedSessions[0].id;
        setActiveSessionId(firstId);

        const detailRes = await ChatApi.getConversation(firstId);
        if (ignore) return;

        if (detailRes.success && detailRes.data && detailRes.data.messages) {
          const msgs: DisplayMessage[] = detailRes.data.messages.map((m: ChatMessage) => ({
            id: m.id,
            sender: m.role === "user" ? "user" : "bot",
            text: m.content,
            timestamp: getFormattedTime(m.created_at),
            sources: m.sources,
          }));

          setSessions((prev) =>
            prev.map((item) =>
              item.id === firstId
                ? {
                    ...item,
                    messages: msgs.length > 0 ? msgs : [DEFAULT_INTRO_MESSAGE],
                  }
                : item
            )
          );
        }
      }
    }

    fetchConversations();

    return () => {
      ignore = true;
    };
  }, []);

  // Switch conversation and load its messages if needed
  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setSidebarOpen(false);

    const existing = sessions.find((s) => s.id === sessionId);
    if (!existing || existing.messages.length === 0) {
      const res = await ChatApi.getConversation(sessionId);
      if (res.success && res.data && res.data.messages) {
        const msgs: DisplayMessage[] = res.data.messages.map((m: ChatMessage) => ({
          id: m.id,
          sender: m.role === "user" ? "user" : "bot",
          text: m.content,
          timestamp: getFormattedTime(m.created_at),
          sources: m.sources,
        }));

        setSessions((prev) =>
          prev.map((item) =>
            item.id === sessionId
              ? {
                  ...item,
                  messages: msgs.length > 0 ? msgs : [DEFAULT_INTRO_MESSAGE],
                }
              : item
          )
        );
      }
    }
  };

  // Create new conversation via backend API
  const handleNewChat = async () => {
    const res = await ChatApi.createConversation("New Conversation");
    const newId = res.success && res.data?.id ? res.data.id : createLocalId("session");
    const newTitle = res.success && res.data?.title ? res.data.title : "New Conversation";

    const newSession: DisplaySession = {
      id: newId,
      title: newTitle,
      dateGroup: "Today",
      updatedAt: new Date().toISOString(),
      messages: [DEFAULT_INTRO_MESSAGE],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setSidebarOpen(false);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Delete conversation via backend API
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();

    // Call backend delete
    if (!sessionId.startsWith("session-")) {
      ChatApi.deleteConversation(sessionId);
    }

    const remaining = sessions.filter((s) => s.id !== sessionId);
    if (remaining.length === 0) {
      handleNewChat();
    } else {
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        handleSelectSession(remaining[0].id);
      }
    }
  };

  // Send message and execute RAG endpoint
  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMessage: DisplayMessage = {
      id: createLocalId("usr"),
      sender: "user",
      text,
      timestamp: getFormattedTime(),
    };

    // Optimistically update conversation with user message
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const isFirstUserMsg = s.messages.filter((m) => m.sender === "user").length === 0;
          return {
            ...s,
            title: isFirstUserMsg ? text.slice(0, 28) : s.title,
            messages: [...s.messages, userMessage],
          };
        }
        return s;
      })
    );

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsTyping(true);

    const isTemporarySession = activeSessionId.startsWith("session-");
    const res = isTemporarySession
      ? await ChatApi.quickChat(text)
      : await ChatApi.sendMessage(activeSessionId, text);

    if (res.success && res.data) {
      const serverData = res.data;
      const botMessage: DisplayMessage = {
        id: serverData.assistant_message.id,
        sender: "bot",
        text: serverData.assistant_message.content,
        timestamp: getFormattedTime(serverData.assistant_message.created_at),
        sources: serverData.assistant_message.sources,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              id: serverData.conversation_id || s.id,
              title: serverData.title || s.title,
              messages: [...s.messages, botMessage],
            };
          }
          return s;
        })
      );

      if (isTemporarySession && serverData.conversation_id) {
        setActiveSessionId(serverData.conversation_id);
      }
    } else {
      // Friendly fallback if backend had an issue
      const botFallback: DisplayMessage = {
        id: createLocalId("bot-err"),
        sender: "bot",
        text:
          res.message ||
          "I encountered an error retrieving documents from JUST university records. Please try again.",
        timestamp: getFormattedTime(),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: [...s.messages, botFallback],
            };
          }
          return s;
        })
      );
    }

    setIsTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 74; // Exactly three lines
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleClearChat = async () => {
    await handleNewChat();
  };

  const handleLogout = () => {
    TokenStorage.clear();
    router.push("/login");
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dateGroups: Array<"Today" | "Yesterday" | "Previous 7 Days"> = [
    "Today",
    "Yesterday",
    "Previous 7 Days",
  ];

  return (
    <div
      className="relative h-screen w-screen overflow-hidden text-gray-900 font-[var(--font-montserrat)] flex flex-row"
      style={{
        backgroundColor: "#E5E0D8",
      }}
    >
      {/* ── Mobile Backdrop ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR (Grey Theme) ─────────────────────────────────────────── */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-40 w-[270px] lg:w-[290px] h-full flex flex-col border-r border-black/10 select-none transition-transform duration-300 ease-in-out text-white shadow-xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{
          background: "linear-gradient(180deg, #24262B 0%, #1A1C1F 100%)",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center p-1 shadow-xs">
              <Image
                src="/logo.png"
                alt="UNIBOT"
                width={26}
                height={26}
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="font-extrabold text-[1.4rem] tracking-wide text-white">
              UNIBOT
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-lg"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3.5 pb-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[0.85rem] font-bold bg-white text-gray-900 hover:bg-gray-100 active:scale-[0.98] shadow-sm transition-all rounded-lg cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gray-900 stroke-[2.5]" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3.5 py-1.5">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-1.5 text-[0.78rem] bg-white/5 hover:bg-white/10 focus:bg-white/15 border border-white/10 focus:border-white/30 text-white placeholder-white/40 outline-none transition-all rounded-md"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {dateGroups.map((group) => {
            const groupSessions = filteredSessions.filter((s) => s.dateGroup === group);
            if (groupSessions.length === 0) return null;

            return (
              <div key={group} className="space-y-1">
                <p className="px-3 text-[0.68rem] font-semibold text-white/40 uppercase tracking-wider">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {groupSessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className={`group relative flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-150 text-left rounded-md ${
                          isActive
                            ? "bg-white/15 text-white font-medium shadow-xs border border-white/15"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="text-[0.82rem] truncate pr-2">{session.title}</span>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 text-white/50 hover:text-white transition-all shrink-0 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredSessions.length === 0 && (
            <div className="px-4 py-8 text-center text-white/40 text-[0.78rem]">
              No chats found
            </div>
          )}
        </div>

        {/* Footer: User & Sign Out */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-between px-2 py-1">
            <Link
              href="/dashboard/account"
              className="flex items-center gap-2 min-w-0 hover:bg-white/10 p-1 rounded-md transition-colors cursor-pointer flex-1 group"
              title="View Account Profile"
            >
              <div className="w-7 h-7 bg-white/15 border border-white/20 group-hover:border-white/40 flex items-center justify-center text-white text-[0.72rem] font-bold shrink-0 rounded-md transition-colors">
                U
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[0.8rem] text-white/80 group-hover:text-white font-medium truncate block transition-colors">
                  Student Account
                </span>
                <span className="text-[0.65rem] text-white/40 block truncate">
                  View Profile
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer rounded-lg shrink-0 ml-1"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── CHAT INTERFACE (White Mode on Darker Off-White BG) ───────────────── */}
      <main className="relative flex-1 h-full flex flex-col p-2 sm:p-4 lg:p-6 overflow-hidden z-10">
        <div
          className="w-full h-full flex flex-col overflow-hidden bg-[#ECE8DF] border border-[#D5CFBF] shadow-xl"
          style={{
            borderRadius: "8px",
          }}
        >
          {/* Header */}
          <header className="px-4 sm:px-6 py-3.5 border-b border-[#D5CFBF] bg-[#F2EFE9] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 bg-white hover:bg-gray-100 text-gray-700 transition-all cursor-pointer rounded-lg border border-gray-300 shadow-xs"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 min-w-0">
                <h1 className="font-bold text-[0.95rem] text-gray-900 truncate">
                  {activeSession?.title ? (
                    activeSession.title === "UNIBOT" ? (
                      <span className="text-[#E03E2D]">UNIBOT</span>
                    ) : (
                      activeSession.title
                    )
                  ) : (
                    <span className="text-[#E03E2D]">UNIBOT</span>
                  )}
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearChat}
              className="p-2 hover:bg-white text-gray-600 hover:text-gray-900 transition-all cursor-pointer rounded-lg border border-[#D5CFBF] shadow-xs"
              title="Start fresh conversation"
              aria-label="Start fresh conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </header>

          {/* Messages Thread (Darker Off-White Background) */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 select-text bg-[#E5E0D8]">
            <div className="space-y-4 max-w-3xl mx-auto">
              {activeSession?.messages.map((msg, idx) => {
                const isBot = msg.sender === "bot";
                const itemKey = msg.id ? `${msg.id}-${idx}` : `msg-${idx}`;
                return (
                  <motion.div
                    key={itemKey}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex flex-col ${
                      isBot ? "items-start" : "items-end"
                    }`}
                  >
                    {/* Message Bubble: Pure White for Bot Response, Lighter Red for User */}
                    <div
                      className={`max-w-[88%] sm:max-w-[80%] px-4 py-3 text-[0.875rem] leading-relaxed select-text cursor-text rounded-xl ${
                        isBot
                          ? "bg-white border border-[#D5CFBF] text-gray-900 shadow-sm"
                          : "bg-[#E03E2D] text-white border border-[#C72B1C] shadow-sm"
                      }`}
                      style={{
                        userSelect: "text",
                        WebkitUserSelect: "text",
                      }}
                    >
                      {isBot ? (
                        <MarkdownMessage content={msg.text} isBot={true} theme="light" />
                      ) : (
                        <div className="whitespace-pre-line text-white font-medium">
                          {formatMessageText(msg.text, true)}
                        </div>
                      )}
                    </div>

                    {isBot && (
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="p-1 hover:bg-black/5 text-gray-500 hover:text-gray-800 transition-all text-xs flex items-center gap-1 cursor-pointer rounded"
                          title="Copy"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <span className="text-[0.65rem] text-gray-500">{msg.timestamp}</span>
                      </div>
                    )}

                    {!isBot && (
                      <span className="text-[0.65rem] text-gray-500 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    )}
                  </motion.div>
                );
              })}

              {/* Thinking Indicator (No Logo, Pure White Card) */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start"
                >
                  <div className="px-4 py-2.5 flex items-center gap-2.5 border border-[#D5CFBF] bg-white text-[0.825rem] text-gray-800 rounded-xl shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E03E2D] shrink-0" />
                    <span className="font-semibold text-[#E03E2D] tracking-wide">
                      UNIBOT is thinking
                    </span>
                    <div className="flex items-center gap-1 pl-1">
                      <span className="w-1 h-2 bg-[#E03E2D]/40 rounded-full animate-pulse" />
                      <span className="w-1 h-3.5 bg-[#E03E2D] rounded-full animate-pulse [animation-delay:180ms]" />
                      <span className="w-1 h-2 bg-[#E03E2D]/40 rounded-full animate-pulse [animation-delay:360ms]" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Bar */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 shrink-0 bg-[#E5E0D8]">
            <div className="max-w-3xl mx-auto">
              <div
                className="border-moving-shine p-[1.5px] transition-all rounded-xl"
              >
                <div className="p-1.5 flex items-center gap-2 transition-all bg-white rounded-[10.5px]">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Ask UNIBOT about JUST ordinances, exams, holidays, or faculty..."
                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-[0.875rem] leading-[22px] outline-none resize-none px-3 py-1.5 min-h-[34px] max-h-[74px] overflow-y-auto"
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className={`w-8 h-8 flex items-center justify-center transition-all rounded-lg ${
                      inputValue.trim() && !isTyping
                        ? "bg-[#E03E2D] hover:bg-[#C72B1C] text-white shadow-sm active:scale-95 cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    aria-label="Send"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
