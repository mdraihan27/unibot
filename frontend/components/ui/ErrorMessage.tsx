"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string | null;
  className?: string;
}

/**
 * Inline error message - no border, uses the design token error colour.
 * Animates in/out with a subtle slide-down fade.
 */
export default function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={`flex items-start gap-2 text-[#A82020] text-[0.825rem] font-semibold leading-snug ${className}`}
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-3.5 h-3.5 mt-[1px] shrink-0" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
