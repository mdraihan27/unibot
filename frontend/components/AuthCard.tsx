"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn,
  // Mail,          // commented out — email login disabled
  // Lock,          // commented out — email login disabled
  // Eye,           // commented out — email login disabled
  // EyeOff,        // commented out — email login disabled
  // UserPlus,      // commented out — email registration disabled
  // ShieldCheck,   // commented out — OTP step disabled
  // RefreshCw,     // commented out — OTP step disabled
  // User,          // commented out — email registration disabled
  // GraduationCap, // commented out — email registration disabled
  // Building2,     // commented out — email registration disabled
  // BookOpen,      // commented out — email registration disabled
} from "lucide-react";

import { googleSignIn } from "@/lib/api/auth";
import { TokenStorage } from "@/lib/api/tokenStorage";
import ErrorMessage from "@/components/ui/ErrorMessage";

// import {
//   loginUser,
//   registerUser,
//   resendOtp,
//   verifyOtp,
// } from "@/lib/api/auth";  // commented out — email login disabled
// import OtpInput from "@/components/ui/OtpInput"; // commented out — OTP step disabled

// type Mode = "login" | "signup"; // commented out — only Google sign-in is active
// type Step = "form" | "otp";    // commented out — OTP step disabled

interface AuthCardProps {
  initialMode?: "login" | "signup";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuthCard({ initialMode = "login" }: AuthCardProps) {
  const router = useRouter();

  // ── Async state ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // ── Google Sign-In handler ────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    clearError();
    setLoading(true);

    try {
      // Load the Google Identity Services script dynamically
      await loadGoogleScript();

      // Prompt the Google One Tap / OAuth popup
      const idToken = await promptGoogleSignIn();

      if (!idToken) {
        setLoading(false);
        return; // User dismissed the popup
      }

      const res = await googleSignIn(idToken);
      setLoading(false);

      if (!res.success) {
        setError(res.message || "Google Sign-In failed. Please try again.");
        return;
      }

      if (res.data) {
        TokenStorage.setTokens(res.data.access_token, res.data.refresh_token);
      }
      router.push("/dashboard");
    } catch (err) {
      setLoading(false);
      setError("Google Sign-In failed. Please try again.");
      console.error("Google Sign-In error:", err);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const cardVariants = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  const transition = { duration: 0.3 };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-[440px] mx-auto relative z-10">
      <AnimatePresence mode="wait">
        <motion.div
          key="google-auth"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          className="bg-white/95 backdrop-blur-xl text-[#1a1a1a] px-8 py-9 sm:px-10 sm:py-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 relative overflow-hidden"
          style={{ borderRadius: "6px" }}
        >
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#E0F2FE]/50 to-transparent pointer-events-none" />

          {/* Icon */}
          <div className="flex justify-center mb-5 relative z-10">
            <div
              className="w-13 h-13 bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center"
              style={{ borderRadius: "6px" }}
            >
              <LogIn className="w-5 h-5 text-[#0F172A]" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-7 relative z-10">
            <h1 className="text-[1.45rem] sm:text-[1.55rem] font-bold text-[#0F172A] mb-2 tracking-tight">
              Welcome to Unibot
            </h1>
            <p className="text-[0.875rem] text-[#64748B] leading-relaxed max-w-[280px] mx-auto font-medium">
              Access your university courses, schedules, and tools in one unified place
            </p>
          </div>

          {/* Google Sign-In Button */}
          <div className="flex flex-col gap-4 relative z-10">
            <ErrorMessage message={error} />

            <button
              id="google-sign-in-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 bg-white border border-[#E2E8F0] text-[#1E293B] text-[0.925rem] font-semibold hover:bg-[#F8FAFC] hover:border-[#CBD5E1] hover:shadow-md active:scale-[0.99] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ borderRadius: "8px" }}
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin text-[#64748B]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  {/* Google "G" Logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <p className="text-center text-[0.775rem] text-[#94A3B8] mt-1">
              By continuing, you agree to Unibot&apos;s Terms of Service and Privacy Policy
            </p>
          </div>

          {/* ── Email/Password form — COMMENTED OUT ───────────────────────────
          <form
            onSubmit={mode === "login" ? handleLogin : handleRegister}
            className="flex flex-col gap-3.5 relative z-10"
          >
            {/* Email field * /}
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-[#94A3B8] pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                placeholder="Email"
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 bg-[#F1F5F9] border border-transparent text-[#0F172A] placeholder-[#94A3B8] text-[0.9rem] focus:outline-none focus:bg-white focus:border-[#CBD5E1] transition-all"
                style={{ borderRadius: "6px" }}
              />
            </div>

            {/* Password field * /}
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-[#94A3B8] pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                placeholder="Password"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 bg-[#F1F5F9] border border-transparent text-[#0F172A] placeholder-[#94A3B8] text-[0.9rem] focus:outline-none focus:bg-white focus:border-[#CBD5E1] transition-all"
                style={{ borderRadius: "6px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[#94A3B8] hover:text-[#475569] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button type="submit" disabled={loading} ...>
              {loading ? "Please wait..." : mode === "login" ? "Get Started" : "Create Account"}
            </button>
          </form>
          ─────────────────────────────────────────────────────────────────── */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Google Identity Services helpers
// ---------------------------------------------------------------------------

/** Dynamically inject the Google Identity Services script if not yet loaded. */
function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    if ((window as any).google?.accounts?.id) return resolve();

    const existing = document.getElementById("google-gsi-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Prompt the Google Sign-In popup and resolve with the ID token string.
 * Returns null if the user dismissed the flow.
 */
function promptGoogleSignIn(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return reject(new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set"));
    }

    const google = (window as any).google;
    if (!google?.accounts?.id) {
      return reject(new Error("Google Identity Services not loaded"));
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential?: string; error?: string }) => {
        if (response.credential) {
          resolve(response.credential);
        } else {
          resolve(null);
        }
      },
      cancel_on_tap_outside: true,
    });

    google.accounts.id.prompt((notification: any) => {
      // If the moment type indicates it was skipped / dismissed without a token
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fall back to the popup flow
        google.accounts.id.renderButton(
          document.getElementById("google-sign-in-btn"),
          { theme: "outline", size: "large", width: 360 }
        );
      }
    });
  });
}
