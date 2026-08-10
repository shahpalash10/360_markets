"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, Sparkles, Award } from "lucide-react";

export function LimeGlass3D() {
  return (
    <div className="relative w-full h-[540px] lg:h-[620px] bg-[#0B0B0B] border border-[#262626] overflow-hidden flex items-center justify-center">
      {/* Subtle radial background glow */}
      <div className="absolute inset-0 bg-radial-gradient from-[#8BE000]/15 via-transparent to-transparent opacity-60 pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#D9D9D9 1px, transparent 1px), linear-gradient(90deg, #D9D9D9 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Stacked 3D Lime Glass Discs inspired directly by the reference image */}
      <div className="relative z-10 w-72 h-96 flex items-center justify-center perspective-1000">
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const rotation = index * 12 - 30;
          const translateY = index * -42 + 90;
          const scale = 1 - index * 0.05;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              whileHover={{ scale: scale * 1.08, rotate: rotation + 5 }}
              className="absolute w-56 h-28 rounded-[50%] border-2 border-[#8BE000]/80 shadow-[0_0_30px_rgba(139,224,0,0.3)] backdrop-blur-md cursor-pointer transition-all duration-300"
              style={{
                transform: `translateY(${translateY}px) rotateX(62deg) rotateZ(${rotation}deg) scale(${scale})`,
                background: `linear-gradient(135deg, rgba(139, 224, 0, ${0.45 - index * 0.06}) 0%, rgba(239, 255, 202, 0.2) 50%, rgba(11, 11, 11, 0.85) 100%)`,
                boxShadow: `0 20px 40px rgba(0,0,0,0.6), inset 0 2px 10px rgba(239, 255, 202, 0.6)`,
              }}
            >
              {/* Inner glass reflection highlight */}
              <div className="absolute top-2 left-6 w-32 h-6 rounded-[50%] bg-white/20 blur-[1px]" />
            </motion.div>
          );
        })}
      </div>

      {/* Floating Web3 / Fintech Terminal Data Badges */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-8 z-20 bg-[#161616]/90 border border-[#8BE000]/40 p-4 shadow-2xl backdrop-blur-md max-w-xs"
      >
        <div className="flex items-center gap-2 text-[#8BE000] text-xs font-mono mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>VERIFIED EDUCATOR</span>
        </div>
        <div className="text-white text-sm font-semibold">Alex Morgan</div>
        <div className="text-[#8A8A8A] text-xs">ID: TRD-928184 • 12.4K Investors</div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-12 right-8 z-20 bg-[#161616]/90 border border-[#D9D9D9]/30 p-4 shadow-2xl backdrop-blur-md font-mono"
      >
        <div className="text-xs text-neutral-400">MARKET DATA</div>
        <div className="text-3xl font-display font-light text-white tracking-tighter">
          2.<span className="text-[#8BE000] font-normal">500</span>
        </div>
        <div className="text-xs text-neutral-400">~$7,761.94 USD</div>
      </motion.div>

      <motion.div
        animate={{ x: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute bottom-36 left-10 z-20 bg-[#8BE000] text-black px-4 py-2 font-mono font-bold text-xs uppercase flex items-center gap-2 tracking-wider"
      >
        <TrendingUp className="w-4 h-4" />
        <span>REVENUE SHARE: 80% TRADER</span>
      </motion.div>
    </div>
  );
}
