"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Button from "./ui/Button";
import MarkdownMessage from "./MarkdownMessage";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    sender: "bot",
    text: "Hello! I am UNIBOT, your university AI assistant. How can I help you today?",
    timestamp: "Just now",
  },
];

const mockResponses: Record<string, string> = {
  default:
    "I found multiple matching records in the campus directory:\n\n- **Student Portal:** Access course grades & clearance\n- **Administrative Desk:** Visit *Hall 3, Ground Floor*\n- **Support Email:** `support@just.edu.bd`",
  registration:
    "Course registration timeline for the upcoming semester:\n\n- **Portal Opens:** `October 15`\n- **Late Registration Deadline:** `November 5`\n\n> **Important:** Ensure all departmental prerequisite clearances are confirmed prior to submission.",
  schedule:
    "Here is your upcoming schedule:\n\n1. **Advanced Algorithms** — `10:00 AM` (Science Hall, Room 402)\n2. **Database Systems** — `02:00 PM` (CSE Lab 3)\n\n*Check your student dashboard for any last-minute classroom changes.*",
  housing:
    "Campus housing applications for the spring term are **currently open**.\n\n- **Eligibility:** Full-time JUST students\n- **Priority:** First-year & international students\n- **Submission:** Submit via the Residence Life portal",
  advisor:
    "Your assigned academic advisor is **Dr. Sarah Collins** in the Department of Computer Science.\n\n- **Office:** Academic Building 2, Room 314\n- **Office Hours:** Tuesday & Thursday (`2:00 PM – 4:00 PM`)",
};

interface InteractiveChatDemoProps {
  initialPrompt?: string;
}

export default function InteractiveChatDemo({}: InteractiveChatDemoProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const messageText = (textToSend || inputVal).trim();
    if (!messageText) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: messageText,
      timestamp: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = mockResponses.default;
      const lower = messageText.toLowerCase();

      if (lower.includes("registration") || lower.includes("deadline")) {
        reply = mockResponses.registration;
      } else if (lower.includes("schedule") || lower.includes("lecture") || lower.includes("class")) {
        reply = mockResponses.schedule;
      } else if (lower.includes("housing") || lower.includes("dorm") || lower.includes("room")) {
        reply = mockResponses.housing;
      } else if (lower.includes("advisor") || lower.includes("professor") || lower.includes("computer science")) {
        reply = mockResponses.advisor;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: reply,
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <section id="demo-chat" className="w-full py-16 px-6 sm:px-10 lg:px-16 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-white mb-2">
            Try Live University Assistant
          </h2>
          <p className="text-white/80 text-[1rem]">
            Ask questions about classes, deadlines, grades, or campus facilities
          </p>
        </div>

        {/* Chat window container */}
        <div
          className="w-full bg-white/10 backdrop-blur-md border border-white/25 overflow-hidden shadow-2xl flex flex-col"
          style={{ borderRadius: "6px" }}
        >
          {/* Top chat bar */}
          <div className="px-6 py-4 bg-white/10 border-b border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 bg-green-400"
                style={{ borderRadius: "3px" }}
              />
              <span className="font-bold text-white text-[1rem] tracking-wide">
                <span className="text-[#A82020]">UNIBOT</span> Interactive Hub
              </span>
            </div>
            <span
              className="text-[0.75rem] uppercase tracking-wider text-white/75 px-2.5 py-1 bg-white/10 border border-white/20"
              style={{ borderRadius: "3px" }}
            >
              Online
            </span>
          </div>

          {/* Messages list */}
          <div className="p-6 h-80 overflow-y-auto flex flex-col gap-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 text-[0.95rem] leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-white text-black font-medium"
                      : "bg-[#8E1C14] text-white border border-white/20"
                  }`}
                  style={{ borderRadius: "6px" }}
                >
                  {msg.sender === "bot" ? (
                    <MarkdownMessage content={msg.text} isBot={true} theme="dark" />
                  ) : (
                    <div className="whitespace-pre-line">{msg.text}</div>
                  )}
                </div>
                <span className="text-[0.75rem] text-white/60 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </motion.div>
            ))}

            {isTyping && (
              <div className="flex items-start">
                <div
                  className="bg-[#8E1C14] text-white border border-white/20 p-4 max-w-[70%]"
                  style={{ borderRadius: "6px" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/80">UNIBOT is thinking</span>
                    <span className="inline-block w-1.5 h-1.5 bg-white animate-ping" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat input box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-white/10 border-t border-white/15 flex gap-3"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask anything about campus life or courses"
              className="flex-1 bg-white/15 border border-white/25 px-4 py-2.5 text-white placeholder-white/60 focus:outline-none focus:border-white text-[0.95rem]"
              style={{ borderRadius: "8px" }}
            />
            <Button variant="regular" size="md" type="submit">
              Send
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
