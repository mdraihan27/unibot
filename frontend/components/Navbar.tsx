"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "./ui/Button";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-transparent relative z-30">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-2.5 sm:py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="UNIBOT Logo"
            width={36}
            height={36}
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:opacity-90 transition-opacity"
            priority
          />
          <span className="text-white text-[1.5rem] font-extrabold tracking-wider transition-opacity group-hover:opacity-90">
            UNIBOT
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[0.95rem] font-medium text-white/90">
          <Link
            href="#home"
            className="hover:text-white transition-colors duration-150"
          >
            Home
          </Link>
          <Link
            href="#features"
            className="hover:text-white transition-colors duration-150"
          >
            Features
          </Link>
          <Link
            href="#terms"
            className="hover:text-white transition-colors duration-150"
          >
            Terms and Policy
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button href="/login" variant="glow" size="sm">
            Login / Signup
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col justify-center items-center gap-1.5 w-9 h-9 border border-white/30 bg-white/10 text-white cursor-pointer"
          style={{ borderRadius: "8px" }}
          aria-label="Toggle menu"
        >
          <span
            className={`h-0.5 w-5 bg-white transition-transform ${
              mobileMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`h-0.5 w-5 bg-white transition-opacity ${
              mobileMenuOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`h-0.5 w-5 bg-white transition-transform ${
              mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>

        {mobileMenuOpen && (
          <div
            className="absolute top-full left-4 right-4 mt-2 p-6 bg-[#C43D32] border border-white/20 shadow-xl flex flex-col gap-4 md:hidden z-40"
            style={{ borderRadius: "6px" }}
          >
            <Link
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white font-medium py-2 border-b border-white/10"
            >
              Home
            </Link>
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white font-medium py-2 border-b border-white/10"
            >
              Features
            </Link>
            <Link
              href="#terms"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white font-medium py-2 border-b border-white/10"
            >
              Terms and Policy
            </Link>
            <div className="pt-2">
              <Button
                href="/login"
                variant="glow"
                size="md"
                className="w-full rounded-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login / Signup
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
