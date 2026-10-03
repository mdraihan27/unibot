"use client";

import Image from "next/image";
import PageLoader from "../../components/PageLoader";
import Navbar from "../../components/Navbar";
import AuthCard from "../../components/AuthCard";
import Footer from "../../components/Footer";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground relative selection:bg-white selection:text-[#E45043] overflow-hidden">
      <PageLoader />

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
        <Navbar />

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
          {/* Subtle inspiration background decorative arch circles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {/* Outer Ring */}
            <div
              className="w-[780px] h-[780px] border border-white/15 absolute"
              style={{ borderRadius: "6px" }}
            />
            {/* Middle Ring */}
            <div
              className="w-[600px] h-[600px] border border-white/10 absolute"
              style={{ borderRadius: "6px" }}
            />
            {/* Inner Ring Glow */}
            <div
              className="w-[450px] h-[450px] bg-white/10 blur-[90px] absolute"
              style={{ borderRadius: "6px" }}
            />
          </div>

          <AuthCard initialMode="login" />
        </main>
      </div>

      <Footer />
    </div>
  );
}
