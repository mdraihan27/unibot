"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="terms"
      className="w-full bg-[#BBD5DA] min-h-[100px] text-[#222222] px-6 sm:px-10 lg:px-16 flex items-center justify-between py-3 md:py-0 transition-colors relative z-10"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 h-full">
        {/* Left Side: Large site name in #E45043 taking almost whole height */}
        <div className="flex items-center select-none">
          <span className="text-[#E45043] font-black text-[clamp(4.5rem,4.5vw,4.5rem)] leading-none tracking-tighter">
            UNIBOT
          </span>
        </div>

        {/* Center: Page Links and Copyright */}
        <div className="flex flex-col items-center md:items-start justify-center gap-1 text-[0.825rem] text-[#333333]">
          <div className="flex flex-wrap items-center justify-center gap-4 font-semibold text-[#1a1a1a]">
            <Link
              href="#home"
              className="hover:text-[#E45043] transition-colors"
            >
              Home
            </Link>
            <Link
              href="#features"
              className="hover:text-[#E45043] transition-colors"
            >
              Features
            </Link>
            <Link
              href="#terms"
              className="hover:text-[#E45043] transition-colors"
            >
              Terms and Policy
            </Link>
          </div>
          <p className="text-[0.75rem] text-[#444444] tracking-wide">
            &copy; 2026 UNIBOT All rights reserved
          </p>
        </div>

        {/* Right Side: Developer LinkedIn and GitHub Links */}
        <div className="flex items-center gap-4 text-[0.85rem] font-semibold text-[#1a1a1a]">
          <a
            href="https://linkedin.com/in/mdraihanhossen"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#E45043] text-white hover:brightness-110 transition-all font-medium flex items-center gap-1.5 shadow-sm"
            style={{ borderRadius: "8px" }}
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/mdraihan27"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#222222] text-white hover:brightness-125 transition-all font-medium flex items-center gap-1.5 shadow-sm"
            style={{ borderRadius: "8px" }}
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
