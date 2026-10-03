"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Loader2, ArrowUp } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";

interface ChatItem {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

interface ScriptItem {
  question: string;
  answer: string;
}

const UNIVERSITY_SCRIPTS: ScriptItem[] = [
  {
    question: "What are the thesis credit requirements for CSE at JUST?",
    answer:
      "**JUST Academic Ordinance Criteria:**\n\n1. **Credit Requirement:** Minimum 110 completed credit hours\n2. **CGPA Threshold:** Cumulative GPA of 2.75 or higher\n3. **Prerequisites:** Clearance in all 100 to 300 level core laboratory courses\n\nSubmit your topic proposal to the Department Academic Committee before the 7th semester add and drop deadline.",
  },
  {
    question: "When is the deadline for Fall semester course registration?",
    answer:
      "**Fall Academic Calendar:**\n\n1. Regular online course registration closes on **October 25**\n2. Late registration with penalty is permitted until **November 5**\n3. Departmental clearance slips can be downloaded via the student portal\n\nClear your semester tuition fees before submitting your course slip online.",
  },
  {
    question: "Where is the Office of the Controller of Examinations located?",
    answer:
      "**Controller of Examinations Office:**\n\n1. **Location:** Administrative Building, 2nd Floor, Room 204\n2. **Service Hours:** Sunday to Thursday, 9:00 AM to 5:00 PM\n3. **Services:** Grade transcript issuance, certificate verification, and clearance forms\n\nFor urgent transcript requests, visit Counter 2.",
  },
  {
    question: "How do I get my Central Library RFID student card?",
    answer:
      "**Central Library Registration Procedure:**\n\n1. Visit the Library Circulation Desk on the Ground Floor\n2. Present your original student ID and semester enrollment receipt\n3. Complete instant biometric photo verification\n\nYour automated RFID library card is issued within 24 hours.",
  },
  {
    question: "What is the procedure for semester tuition fee payment at JUST?",
    answer:
      "**Semester Tuition Payment Guidelines:**\n\n1. Generate your automated fee slip via the JUST student web portal\n2. Pay through the designated bank booth or official digital banking gateway\n3. Upload your payment transaction receipt to your departmental dashboard\n\nAccounts clearance is updated automatically within two hours.",
  },
];

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

export default function AnimatedChatHero() {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [typedInput, setTypedInput] = useState("");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isSendButtonPressed, setIsSendButtonPressed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customInputValue, setCustomInputValue] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    intervalsRef.current.forEach((i) => clearInterval(i));
    intervalsRef.current = [];
  }, []);

  const addTimeout = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timeoutsRef.current.push(t);
    return t;
  }, []);

  const addInterval = useCallback((fn: () => void, ms: number) => {
    const i = setInterval(fn, ms);
    intervalsRef.current.push(i);
    return i;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  }, []);

  // Endless loop runner across the 5 university messages with liquid smooth word streaming
  const runConversationLoop = useCallback(
    (scriptIndex: number) => {
      clearAllTimers();
      setIsBotThinking(false);
      setIsSendButtonPressed(false);

      const targetScript = UNIVERSITY_SCRIPTS[scriptIndex];
      const questionText = targetScript.question;
      const answerText = targetScript.answer;

      setTypedInput("");

      // 1. Smoothly type out question in bottom input bar
      const charDelay = 28;
      for (let i = 0; i <= questionText.length; i++) {
        addTimeout(() => {
          setTypedInput(questionText.slice(0, i));
        }, i * charDelay);
      }

      const typingDuration = questionText.length * charDelay;

      // 2. Pause after question typed so user can read it (500ms)
      const pressStartTime = typingDuration + 500;
      addTimeout(() => {
        setIsSendButtonPressed(true);
      }, pressStartTime);

      // 3. Keep Enter button pressed down slowly and visibly (750ms), then release it
      const releaseTime = pressStartTime + 750;
      addTimeout(() => {
        setIsSendButtonPressed(false);
      }, releaseTime);

      // 4. Submit message as button finishes releasing (160ms after release begins)
      const sendTime = releaseTime + 160;
      addTimeout(() => {
        setTypedInput("");

        const userMsg: ChatItem = {
          id: `user-${Date.now()}`,
          sender: "user",
          text: questionText,
          timestamp: "Just now",
        };

        // Prune older messages smoothly (keep up to 3 so previous dialogue softly exits)
        setMessages((prev) => {
          const next = [...prev, userMsg];
          return next.length > 3 ? next.slice(-3) : next;
        });
        scrollToBottom();
      }, sendTime);

      // 5. Reveal thinking state smoothly
      const thinkingTime = sendTime + 380;
      addTimeout(() => {
        setIsBotThinking(true);
        scrollToBottom();
      }, thinkingTime);

      // 6. Begin streaming bot response
      const streamStartTime = thinkingTime + 1100;
      addTimeout(() => {
        setIsBotThinking(false);

        const botId = `bot-${Date.now()}`;
        const words = answerText.split(" ");
        let wordIndex = 1;

        // Insert initial bot message with first word
        setMessages((prev) => {
          const next = [
            ...prev,
            {
              id: botId,
              sender: "bot" as const,
              text: words[0] || "",
              timestamp: "Just now",
            },
          ];
          return next.length > 3 ? next.slice(-3) : next;
        });
        scrollToBottom();

        // Stream remaining words with harmonic pacing
        const streamTimer = addInterval(() => {
          wordIndex++;
          if (wordIndex <= words.length) {
            const currentContent = words.slice(0, wordIndex).join(" ");
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botId ? { ...m, text: currentContent } : m
              )
            );
            scrollToBottom();
          } else {
            clearInterval(streamTimer);

            // 6. Reading pause before advancing to next message
            addTimeout(() => {
              const nextIndex = (scriptIndex + 1) % UNIVERSITY_SCRIPTS.length;
              runConversationLoop(nextIndex);
            }, 4200);
          }
        }, 38);
      }, streamStartTime);
    },
    [addTimeout, addInterval, clearAllTimers, scrollToBottom]
  );

  useEffect(() => {
    runConversationLoop(0);
    return () => {
      clearAllTimers();
    };
  }, [runConversationLoop, clearAllTimers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotThinking, scrollToBottom]);

  const handleCustomSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = customInputValue.trim();
    if (!query) return;

    clearAllTimers();
    setTypedInput("");
    setCustomInputValue("");

    const userMsg: ChatItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: "Just now",
    };

    setMessages((prev) => {
      const next = [...prev, userMsg];
      return next.length > 3 ? next.slice(-3) : next;
    });
    setIsBotThinking(true);
    scrollToBottom();

    setTimeout(() => {
      setIsBotThinking(false);
      let reply =
        "**JUST University Assistance:**\n\nFor departmental clearance, hall seats, academic syllabus updates, or fee vouchers, consult your department executive office or login to the JUST online student portal.";
      const lower = query.toLowerCase();

      if (lower.includes("thesis") || lower.includes("credit") || lower.includes("cgpa")) {
        reply = UNIVERSITY_SCRIPTS[0].answer;
      } else if (lower.includes("registration") || lower.includes("admission") || lower.includes("date")) {
        reply = UNIVERSITY_SCRIPTS[1].answer;
      } else if (lower.includes("exam") || lower.includes("controller") || lower.includes("transcript")) {
        reply = UNIVERSITY_SCRIPTS[2].answer;
      } else if (lower.includes("library") || lower.includes("card") || lower.includes("book")) {
        reply = UNIVERSITY_SCRIPTS[3].answer;
      } else if (lower.includes("fee") || lower.includes("tuition") || lower.includes("pay")) {
        reply = UNIVERSITY_SCRIPTS[4].answer;
      }

      const botId = `bot-${Date.now()}`;
      const words = reply.split(" ");
      let wordIndex = 1;

      setMessages((prev) => [
        ...prev,
        {
          id: botId,
          sender: "bot" as const,
          text: words[0] || "",
          timestamp: "Just now",
        },
      ]);
      scrollToBottom();

      const customInterval = setInterval(() => {
        wordIndex++;
        if (wordIndex <= words.length) {
          const currentContent = words.slice(0, wordIndex).join(" ");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId ? { ...m, text: currentContent } : m
            )
          );
          scrollToBottom();
        } else {
          clearInterval(customInterval);
          setTimeout(() => {
            runConversationLoop(0);
          }, 4500);
        }
      }, 38);
    }, 1000);
  };

  return (
    <section className="w-full flex flex-col items-center justify-center relative select-none">
      <div className="w-full max-w-4xl mx-auto flex flex-col relative">
        {/* Expansive ambient off-white aura that extends wide and dissolves little by little */}
        <div
          className="absolute -inset-x-12 sm:-inset-x-32 -inset-y-16 sm:-inset-y-24 pointer-events-none -z-10"
          aria-hidden="true"
        >
          <div
            className="w-full h-full"
            style={{
              background:
                "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(245, 240, 230, 0.7) 0%, rgba(238, 232, 222, 0.48) 32%, rgba(232, 225, 215, 0.22) 58%, rgba(228, 220, 208, 0.06) 78%, transparent 100%)",
              filter: "blur(45px)",
            }}
          />
        </div>

        {/* Main Chat Interface (Transparent container floating in the extended aura) */}
        <div className="relative w-full flex flex-col bg-transparent">
          {/* Messages Container (Silky smooth spring transitions, zero snappy jumps) */}
          <div
            ref={chatContainerRef}
            className="h-[310px] sm:h-[350px] overflow-hidden px-4 sm:px-6 py-3 select-text bg-transparent"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
            }}
          >
            <div className="min-h-full flex flex-col justify-end space-y-3.5 max-w-3xl mx-auto pt-2 pb-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {messages.map((msg) => {
                  const isBot = msg.sender === "bot";
                  return (
                    <motion.div
                      key={msg.id}
                      layout
                      initial={{ opacity: 0, y: 22, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{
                        opacity: 0,
                        y: -24,
                        scale: 0.96,
                        transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] },
                      }}
                      transition={{
                        type: "spring",
                        damping: 26,
                        stiffness: 160,
                        mass: 0.8,
                      }}
                      className={`flex flex-col ${
                        isBot ? "items-start" : "items-end"
                      }`}
                    >
                      {/* Message Bubble: Pure White for Bot Response, Crimson Red for User */}
                      <div
                        className={`max-w-[90%] sm:max-w-[82%] px-4 py-3 text-[0.875rem] leading-relaxed select-text cursor-text ${
                          isBot
                            ? "bg-white border border-[#D5CFBF] text-gray-900 shadow-sm"
                            : "bg-[#E03E2D] text-white border border-[#C72B1C] shadow-sm"
                        }`}
                        style={{
                          borderRadius: "6px",
                          userSelect: "text",
                          WebkitUserSelect: "text",
                        }}
                      >
                        {isBot ? (
                          <MarkdownMessage
                            content={msg.text}
                            isBot={true}
                            theme="light"
                          />
                        ) : (
                          <div className="whitespace-pre-line text-white font-medium">
                            {formatMessageText(msg.text, true)}
                          </div>
                        )}
                      </div>

                      {/* Bot actions: Copy & Timestamp */}
                      {isBot && (
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="p-1 hover:bg-white/20 text-white/90 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
                            style={{ borderRadius: "8px" }}
                            title="Copy message"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-white/90" />
                            )}
                            <span className="text-[0.65rem] text-white/90 font-medium">
                              {copiedId === msg.id ? "Copied" : "Copy"}
                            </span>
                          </button>
                          <span className="text-[0.65rem] text-white/80 font-medium">
                            {msg.timestamp}
                          </span>
                        </div>
                      )}

                      {!isBot && (
                        <span className="text-[0.65rem] text-white/80 font-medium mt-1 px-1">
                          {msg.timestamp}
                        </span>
                      )}
                    </motion.div>
                  );
                })}

                {/* Thinking Indicator with Smooth Spring Motion */}
                {isBotThinking && (
                  <motion.div
                    key="bot-thinking-indicator"
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      y: -14,
                      scale: 0.96,
                      transition: { duration: 0.35, ease: "easeInOut" },
                    }}
                    transition={{
                      type: "spring",
                      damping: 24,
                      stiffness: 170,
                    }}
                    className="flex items-start"
                  >
                    <div
                      className="px-4 py-2.5 flex items-center gap-2.5 border border-[#D5CFBF] bg-white text-[0.825rem] text-gray-800 shadow-sm"
                      style={{ borderRadius: "6px" }}
                    >
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
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Input Bar (Transparent to blend with diffused background) */}
          <div className="w-full px-4 sm:px-6 pb-1 pt-1 shrink-0 bg-transparent">
            <div className="max-w-3xl mx-auto">
              <form
                onSubmit={handleCustomSend}
                className="border-moving-shine p-[1.5px] transition-all"
                style={{ borderRadius: "8px" }}
              >
                <div
                  className="p-1.5 flex items-center gap-2 transition-all bg-white"
                  style={{ borderRadius: "7px" }}
                >
                  <input
                    type="text"
                    value={typedInput || customInputValue}
                    onChange={(e) => {
                      setCustomInputValue(e.target.value);
                      clearAllTimers();
                    }}
                    placeholder="Ask UNIBOT about JUST ordinances, exams, holidays, or faculty"
                    className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-[0.875rem] leading-[22px] outline-none px-3 py-1.5 min-h-[34px]"
                  />

                  <motion.button
                    type="submit"
                    disabled={isBotThinking}
                    animate={{
                      y: isSendButtonPressed ? 3 : 0,
                      scale: isSendButtonPressed ? 0.88 : 1,
                      backgroundColor: isSendButtonPressed ? "#9E2218" : "#E03E2D",
                      boxShadow: isSendButtonPressed
                        ? "inset 0 3px 6px rgba(0, 0, 0, 0.45)"
                        : "0 2px 6px rgba(0, 0, 0, 0.15)",
                    }}
                    transition={{
                      duration: 0.45,
                      ease: "easeInOut",
                    }}
                    className="w-8 h-8 flex items-center justify-center text-white shadow-sm cursor-pointer shrink-0"
                    style={{ borderRadius: "8px" }}
                    aria-label="Send query"
                  >
                    <motion.div
                      animate={{
                        y: isSendButtonPressed ? 1.5 : 0,
                        scale: isSendButtonPressed ? 0.9 : 1,
                      }}
                      transition={{
                        duration: 0.45,
                        ease: "easeInOut",
                      }}
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </motion.div>
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
