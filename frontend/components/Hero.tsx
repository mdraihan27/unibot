"use client";

import { motion } from "framer-motion";
import Button from "./ui/Button";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative w-full max-w-5xl mx-auto pt-1 pb-8 sm:pb-10 px-4 sm:px-8 flex flex-col items-center justify-center text-center overflow-visible"
    >

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-4xl mx-auto flex flex-col items-center z-10"
      >
        {/* Big plain heading */}
        <h1 className="text-[clamp(4.2rem,11.5vw,8rem)] font-black leading-none tracking-normal text-white mb-3 uppercase select-none">
          UNIBOT
        </h1>

        {/* Subtitle */}
        <p className="text-[clamp(1.15rem,2.6vw,1.75rem)] font-semibold text-white/95 max-w-2xl leading-snug mb-2 tracking-normal">
          Have a conversation with your university
        </p>

        {/* Description */}
        <p className="text-[0.95rem] text-white/85 max-w-xl mb-5 font-normal leading-relaxed">
          Instant answers to schedules, campus navigation, administrative tasks, and course schedules in one unified AI assistant
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-6">
          <Button href="/login" variant="regular" size="md">
            Start Conversation
          </Button>

          <Button href="/login" variant="glow" size="md">
            Explore Features
          </Button>
        </div>

        {/* Dummy Data Note */}
        <div className="px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 text-xs sm:text-sm text-white/70 font-medium flex items-center gap-2">
          Currently running on dummy data for Jashore University of Science and Technology
        </div>
      </motion.div>
    </section>
  );
}
