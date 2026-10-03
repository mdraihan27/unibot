"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  GraduationCap,
  Building2,
  BookOpen,
  ArrowLeft,
  LogOut,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TokenStorage } from "@/lib/api/tokenStorage";
import { getMe } from "@/lib/api/auth";
import type { UserProfile } from "@/lib/api/types";

function getEmailFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.sub || null;
  } catch {
    return null;
  }
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = TokenStorage.getAccess();
        const tokenEmail = getEmailFromToken(token);

        const res = await getMe();
        if (res.success && res.data) {
          setProfile(res.data);
        } else if (tokenEmail) {
          // Token exists, display the student's actual logged in email
          setProfile({
            email: tokenEmail,
            name: "JUST Student",
            roll: "N/A",
            department: "Computer Science & Engineering",
            faculty: "Faculty of Engineering & Technology",
          });
        } else {
          router.push("/login");
          return;
        }
      } catch {
        const token = TokenStorage.getAccess();
        const tokenEmail = getEmailFromToken(token);
        if (tokenEmail) {
          setProfile({
            email: tokenEmail,
            name: "JUST Student",
            roll: "N/A",
            department: "Computer Science & Engineering",
            faculty: "Faculty of Engineering & Technology",
          });
        } else {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleLogout = () => {
    TokenStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground relative selection:bg-white selection:text-[#E45043] overflow-x-hidden">
      {/* University Silhouette Background Image */}
      <div className="absolute bottom-[100px] left-0 right-0 w-full pointer-events-none z-0 flex items-end justify-center opacity-15 select-none">
        <Image
          src="/assets/landing/uni_silhouette.png"
          alt="University Silhouette"
          width={1920}
          height={380}
          className="w-full h-auto max-h-[320px] object-cover object-bottom"
          priority
        />
      </div>

      <div className="flex-1 flex flex-col relative z-10">
        {/* Actual Site Navbar */}
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-14 relative z-10">
          {/* Subtle Decorative Arch Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div
              className="w-[720px] h-[720px] border border-white/10 absolute pointer-events-none"
              style={{ borderRadius: "8px" }}
            />
            <div
              className="w-[420px] h-[420px] bg-white/5 blur-[80px] absolute pointer-events-none"
              style={{ borderRadius: "8px" }}
            />
          </div>

          <div className="w-full max-w-xl relative z-10">
            {/* Top Back Action Bar */}
            <div className="mb-4 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white transition-colors bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-md"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                Back to Chat
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-red-300 transition-colors bg-white/5 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-white/15 backdrop-blur-md cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/95 backdrop-blur-xl text-[#1a1a1a] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 relative overflow-hidden"
              style={{ borderRadius: "10px" }}
            >
              {/* Student Information Fields */}
              <div className="p-6 sm:p-8">
                <div className="mb-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                  <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                    Student Information
                  </h1>
                </div>

                {loading ? (
                  <div className="py-10 flex items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#E03E2D]" />
                    <span className="text-sm font-medium">Loading student profile...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {/* 1. Name */}
                    <div className="py-3.5 flex items-center justify-between gap-4 first:pt-0">
                      <div className="flex items-center gap-2.5 text-gray-500 shrink-0">
                        <User className="w-4 h-4 text-[#E03E2D]" />
                        <span className="text-sm font-medium">Name</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 text-right">
                        {profile?.name || "—"}
                      </span>
                    </div>

                    {/* 2. Roll */}
                    <div className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 text-gray-500 shrink-0">
                        <GraduationCap className="w-4 h-4 text-[#E03E2D]" />
                        <span className="text-sm font-medium">Roll</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 text-right font-mono bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-md">
                        {profile?.roll || "—"}
                      </span>
                    </div>

                    {/* 3. Department */}
                    <div className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 text-gray-500 shrink-0">
                        <BookOpen className="w-4 h-4 text-[#E03E2D]" />
                        <span className="text-sm font-medium">Department</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 text-right">
                        {profile?.department || "—"}
                      </span>
                    </div>

                    {/* 4. Faculty */}
                    <div className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 text-gray-500 shrink-0">
                        <Building2 className="w-4 h-4 text-[#E03E2D]" />
                        <span className="text-sm font-medium">Faculty</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 text-right">
                        {profile?.faculty || "—"}
                      </span>
                    </div>

                    {/* 5. Email */}
                    <div className="py-3.5 flex items-center justify-between gap-4 last:pb-0">
                      <div className="flex items-center gap-2.5 text-gray-500 shrink-0">
                        <Mail className="w-4 h-4 text-[#E03E2D]" />
                        <span className="text-sm font-medium">Email</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 text-right select-all">
                        {profile?.email || "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Actual Site Footer */}
      <Footer />
    </div>
  );
}
