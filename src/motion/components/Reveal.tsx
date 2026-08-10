"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { EASINGS, DURATION } from "../config";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}

export function Reveal({ children, delay = 0, direction = "up", className = "" }: RevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const getOffset = () => {
    switch (direction) {
      case "up":
        return { y: 28, x: 0 };
      case "down":
        return { y: -28, x: 0 };
      case "left":
        return { x: 28, y: 0 };
      case "right":
        return { x: -28, y: 0 };
    }
  };

  const offset = getOffset();

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y,
        filter: "blur(4px)",
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              x: 0,
              y: 0,
              filter: "blur(0px)",
            }
          : {
              opacity: 0,
              x: offset.x,
              y: offset.y,
              filter: "blur(4px)",
            }
      }
      transition={{
        duration: DURATION.MEDIUM,
        delay,
        ease: EASINGS.responsive,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
