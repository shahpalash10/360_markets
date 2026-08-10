"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp } from "lucide-react";

// Declare custom spline-viewer element to satisfy TypeScript compiler
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "spline-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { url?: string },
        HTMLElement
      >;
    }
  }
}

export function LimeGlass3D() {
  return (
    <div className="relative w-full h-[540px] lg:h-[620px] bg-[#0B0B0B] border border-[#262626] overflow-hidden flex items-center justify-center select-none">
      {/* Subtle radial background glow */}
      <div className="absolute inset-0 bg-radial-gradient from-[#8BE000]/10 via-transparent to-transparent opacity-50 pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none z-10"
        style={{
          backgroundImage: `linear-gradient(#D9D9D9 1px, transparent 1px), linear-gradient(90deg, #D9D9D9 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Spline 3D Scene Viewport using CDN-loaded Web Component */}
      <div className="absolute inset-0 w-full h-full z-0 flex items-center justify-center">
        <spline-viewer url="/scene.splinecode" style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Floating Web3 / Fintech Terminal Data Badges */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-8 z-20 bg-[#161616]/90 border border-[#8BE000]/40 p-4 shadow-2xl backdrop-blur-md max-w-xs font-mono"
      >
        <div className="flex items-center gap-2 text-[#8BE000] text-xs font-bold mb-1">
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
