"use client";

import React from "react";
import { motion } from "framer-motion";
import { EASINGS } from "../config";

interface PressableProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Pressable({ children, className = "", onClick }: PressableProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      transition={EASINGS.springSmooth}
      onClick={onClick}
      className={`cursor-pointer select-none ${className}`}
    >
      {children}
    </motion.div>
  );
}
