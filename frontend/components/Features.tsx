"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface FeatureItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  metric: string;
}

const featureData: FeatureItem[] = [
  {
    id: "1",
    tag: "Academics",
    title: "Course and Syllabus Guidance",
    description: "Get immediate clarification on assignments, prerequisite pathways, exam routines, and lecture notes",
    metric: "Instant Answer",
  },
  {
    id: "2",
    tag: "Navigation",
    title: "Campus Map and Locations",
    description: "Find your way around laboratories, departments, libraries, cafeteria, and parking spaces effortlessly",
    metric: "Real Time Wayfinding",
  },
  {
    id: "3",
    tag: "Administration",
    title: "Fees and Financial Services",
    description: "Inquire about tuition payment deadlines, scholarship procedures, waivers, and official fee slips",
    metric: "Zero Queue",
  },
  {
    id: "4",
    tag: "Support",
    title: "24/7 University Helpdesk",
    description: "Submit administrative tickets, connect with faculty advisors, and access student welfare resources",
    metric: "Always Active",
  },
];

export default function Features() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="features"
      className="w-full py-20 px-6 sm:px-10 lg:px-16 flex flex-col items-center relative z-10"
    >
      <div className="max-w-6xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span
            className="text-[0.875rem] font-bold uppercase tracking-wider text-white/80 px-3 py-1 bg-white/10 border border-white/20 inline-block mb-3"
            style={{ borderRadius: "3px" }}
          >
            Capabilities
          </span>
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-extrabold text-white mb-4">
            Everything Your University Needs
          </h2>
          <p className="text-[1.05rem] text-white/85 max-w-2xl mx-auto font-normal">
            Designed specifically for modern campus ecosystems to boost student satisfaction and simplify administrative load
          </p>
        </motion.div>

        {loading ? (
          /* Skeleton loading state before data resolves */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="p-8 bg-white/10 border border-white/20 animate-pulse flex flex-col gap-4"
                style={{ borderRadius: "6px" }}
              >
                <div
                  className="w-20 h-5 bg-white/20"
                  style={{ borderRadius: "3px" }}
                />
                <div
                  className="w-3/4 h-8 bg-white/30"
                  style={{ borderRadius: "3px" }}
                />
                <div
                  className="w-full h-4 bg-white/20"
                  style={{ borderRadius: "3px" }}
                />
                <div
                  className="w-5/6 h-4 bg-white/20"
                  style={{ borderRadius: "3px" }}
                />
                <div
                  className="w-24 h-6 bg-white/25 mt-4"
                  style={{ borderRadius: "3px" }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featureData.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-8 bg-white/10 backdrop-blur-md border border-white/25 shadow-lg flex flex-col justify-between group transition-all"
                style={{ borderRadius: "6px" }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-[0.75rem] font-bold uppercase tracking-wider text-white/85 px-2.5 py-1 bg-white/15 border border-white/20"
                      style={{ borderRadius: "3px" }}
                    >
                      {item.tag}
                    </span>
                    <span
                      className="text-[0.75rem] font-medium text-white/75 px-2.5 py-1 bg-black/20"
                      style={{ borderRadius: "3px" }}
                    >
                      {item.metric}
                    </span>
                  </div>
                  <h3 className="text-[1.35rem] font-bold text-white mb-3 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[0.95rem] text-white/85 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/15 flex items-center justify-between">
                  <span className="text-[0.875rem] text-white/75 font-medium">
                    Integrated System
                  </span>
                  <span className="text-white text-[0.875rem] font-bold group-hover:translate-x-1 transition-transform">
                    Explore &rarr;
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
