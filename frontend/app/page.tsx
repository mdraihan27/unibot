"use client";

import Image from "next/image";
import PageLoader from "../components/PageLoader";
import Navbar from "../components/Navbar";
import AnimatedChatHero from "../components/AnimatedChatHero";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative selection:bg-white selection:text-[#E45043] overflow-x-hidden">
      <PageLoader />

      <div className="flex flex-col relative z-10 flex-1">
        <Navbar />

        <main className="flex-1 flex flex-col items-center justify-start relative z-10 w-full px-4 sm:px-8 lg:px-12 pt-0 pb-6 sm:pb-8">
          {/* Animated University Chat Interface at the Top */}
          <div className="w-full max-w-4xl mx-auto pt-0 pb-1">
            <AnimatedChatHero />
          </div>

          {/* Hero Component Down */}
          <div className="w-full max-w-5xl mx-auto mt-1 sm:mt-2">
            <Hero />
          </div>
        </main>

        {/* University Silhouette Background Image (Full natural unclipped height) */}
        <div className="absolute bottom-0 left-0 right-0 w-full pointer-events-none z-0 flex items-end justify-center opacity-20 select-none">
          <Image
            src="/assets/landing/uni_silhouette.png"
            alt="University Silhouette"
            width={1920}
            height={380}
            className="w-full h-auto max-h-[360px] sm:max-h-[380px] object-contain object-bottom pointer-events-none"
            priority
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
