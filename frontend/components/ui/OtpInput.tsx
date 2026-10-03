"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

/**
 * 6-digit OTP input rendered as individual boxes.
 * Supports paste, backspace navigation, and auto-advance.
 */
export default function OtpInput({ value, onChange, disabled = false }: OtpInputProps) {
  const digits = value.padEnd(6, "").split("").slice(0, 6);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const next = [...digits];
    next[i] = char;
    onChange(next.join("").replace(/\s/g, ""));
    if (char && i < 5) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      focus(i - 1);
      const next = [...digits];
      next[i - 1] = "";
      onChange(next.join("").replace(/\s/g, ""));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    focus(Math.min(pasted.length, 5));
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]?.trim() ?? ""}
          onChange={(e) => handleChange(i, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`OTP digit ${i + 1}`}
          className="w-11 h-12 text-center text-[1.1rem] font-bold bg-[#F1F5F9] text-[#0F172A] border border-transparent focus:outline-none focus:bg-white focus:border-[#CBD5E1] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderRadius: "6px" }}
        />
      ))}
    </div>
  );
}
