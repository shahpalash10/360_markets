"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { EASINGS, DURATION } from "../config";

interface SplitTextRevealProps {
  lines: string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  highlightLast?: boolean;
}

export function SplitTextReveal({
  lines,
  className = "",
  lineClassName = "",
  delay = 0,
  highlightLast = false,
}: SplitTextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className={className}>
      {lines.map((line, index) => (
        <div key={index} className="overflow-hidden py-0.5">
          <motion.div
            initial={{ y: "110%", opacity: 0 }}
            animate={isInView ? { y: "0%", opacity: 1 } : { y: "110%", opacity: 0 }}
            transition={{
              duration: DURATION.CINEMATIC,
              delay: delay + index * 0.08,
              ease: EASINGS.responsive,
            }}
            className={`${lineClassName} ${
              highlightLast && index === lines.length - 1 ? "text-[#8BE000] border-b-8 border-[#8BE000]" : ""
            }`}
          >
            {line}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
