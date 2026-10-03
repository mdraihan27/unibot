"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownMessageProps {
  content: string;
  className?: string;
  isBot?: boolean;
  theme?: "light" | "dark";
}

function renderTextWithHighlights(text: string, isLight: boolean) {
  if (!text || typeof text !== "string" || !text.includes("UNIBOT")) {
    return text;
  }
  const parts = text.split(/(UNIBOT)/g);
  return parts.map((part, i) =>
    part === "UNIBOT" ? (
      <span
        key={i}
        className={isLight ? "text-[#E03E2D] font-bold" : "text-[#FFAFA8] font-bold"}
      >
        UNIBOT
      </span>
    ) : (
      part
    )
  );
}

function processChildren(children: React.ReactNode, isLight: boolean): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return renderTextWithHighlights(child, isLight);
    }
    return child;
  });
}

export default function MarkdownMessage({
  content,
  className = "",
  isBot = false,
  theme = "light",
}: MarkdownMessageProps) {
  if (!content) return null;

  const isLight = theme === "light";

  return (
    <div
      className={`max-w-none text-[0.875rem] leading-relaxed break-words ${
        isLight ? "text-gray-800" : "prose prose-invert text-white"
      } ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p
              className={`mb-2.5 last:mb-0 leading-relaxed ${
                isLight ? "text-gray-800" : "text-white/95"
              }`}
            >
              {processChildren(children, isLight)}
            </p>
          ),
          h1: ({ children }) => (
            <h1
              className={`text-lg font-bold mt-3 mb-2 pb-1 border-b ${
                isLight
                  ? "border-gray-200 text-gray-900"
                  : "border-white/15 text-white"
              }`}
            >
              {processChildren(children, isLight)}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={`text-base font-bold mt-2.5 mb-1.5 ${
                isLight ? "text-gray-900" : "text-white"
              }`}
            >
              {processChildren(children, isLight)}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={`text-[0.95rem] font-semibold mt-2 mb-1 ${
                isLight ? "text-gray-900" : "text-white"
              }`}
            >
              {processChildren(children, isLight)}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className={`text-sm font-semibold mt-1.5 mb-0.5 ${
                isLight ? "text-gray-800" : "text-white/95"
              }`}
            >
              {processChildren(children, isLight)}
            </h4>
          ),
          ul: ({ children }) => (
            <ul
              className={`list-disc pl-5 my-2 space-y-1 ${
                isLight ? "text-gray-700" : "text-white/90"
              }`}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={`list-decimal pl-5 my-2 space-y-1 ${
                isLight ? "text-gray-700" : "text-white/90"
              }`}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li
              className={`my-0.5 leading-relaxed ${
                isLight ? "text-gray-800" : "text-white/90"
              }`}
            >
              {processChildren(children, isLight)}
            </li>
          ),
          strong: ({ children }) => (
            <strong
              className={`font-bold ${isLight ? "text-gray-900" : "text-white"}`}
            >
              {processChildren(children, isLight)}
            </strong>
          ),
          em: ({ children }) => (
            <em
              className={`italic ${isLight ? "text-gray-800" : "text-white/90"}`}
            >
              {processChildren(children, isLight)}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={`border-l-3 pl-3 py-1.5 my-2 rounded-r italic text-[0.85rem] ${
                isLight
                  ? "border-[#E03E2D] bg-red-50/70 text-gray-900 font-medium"
                  : "border-[#A82020] bg-white/5 text-white/85"
              }`}
            >
              {children}
            </blockquote>
          ),
          code({ className: codeClassName, children, ...props }) {
            const isBlock =
              Boolean(codeClassName) ||
              (typeof children === "string" && children.includes("\n"));
            if (isBlock) {
              return (
                <div
                  className={`my-2.5 overflow-x-auto rounded border p-3 ${
                    isLight
                      ? "border-gray-800 bg-[#1E222A]"
                      : "border-white/15 bg-black/40"
                  }`}
                >
                  <code
                    className="block font-mono text-xs text-gray-100 leading-tight"
                    {...props}
                  >
                    {children}
                  </code>
                </div>
              );
            }
            return (
              <code
                className={`px-1.5 py-0.5 rounded text-[0.82em] font-mono border ${
                  isLight
                    ? "bg-red-50 text-[#C72B1C] font-semibold border-red-200/80"
                    : "bg-white/15 text-amber-200 border-white/10"
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <div
              className={`my-3 overflow-x-auto rounded border ${
                isLight
                  ? "border-gray-200 bg-white"
                  : "border-white/20 bg-white/5"
              }`}
            >
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead
              className={`border-b ${
                isLight
                  ? "bg-gray-50 border-gray-200"
                  : "bg-white/10 border-white/20"
              }`}
            >
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody
              className={`divide-y ${
                isLight ? "divide-gray-100" : "divide-white/10"
              }`}
            >
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr
              className={`transition-colors ${
                isLight ? "hover:bg-gray-50/70" : "hover:bg-white/5"
              }`}
            >
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th
              className={`px-3 py-2 font-semibold tracking-wide ${
                isLight ? "text-gray-900" : "text-white"
              }`}
            >
              {processChildren(children, isLight)}
            </th>
          ),
          td: ({ children }) => (
            <td
              className={`px-3 py-2 leading-normal align-top ${
                isLight ? "text-gray-700" : "text-white/90"
              }`}
            >
              {processChildren(children, isLight)}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline underline-offset-2 transition-colors ${
                isLight
                  ? "text-[#8E1C14] hover:text-[#6F110B] font-medium"
                  : "text-[#BBD5DA] hover:text-white"
              }`}
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr
              className={`my-3 ${isLight ? "border-gray-200" : "border-white/15"}`}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
