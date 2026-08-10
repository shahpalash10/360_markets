"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Award, Download, Share2, ShieldCheck, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Reveal } from "@/motion/components/Reveal";
import { MagneticButton } from "@/motion/components/MagneticButton";
import { motion } from "framer-motion";

export default function StudentCertificatePage() {
  const params = useParams();
  const certId = (params?.id as string) || "CERT-928184";

  const triggerConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col justify-center items-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl bg-[#FFFFFF] text-[#0B0B0B] border-8 border-[#0B0B0B] p-12 shadow-2xl space-y-8 relative"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-[#0B0B0B] pb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#8BE000] text-black font-mono font-bold text-lg flex items-center justify-center">
              360°
            </div>
            <span className="font-display font-bold text-xl tracking-tight">MARKETS PLATFORM</span>
          </div>

          <div className="bg-[#0B0B0B] text-[#8BE000] font-mono text-xs px-3 py-1 font-bold">
            VERIFIED CERTIFICATE
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-4 py-4">
          <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest block">
            CERTIFICATE OF COMPLETION
          </span>

          <h1 className="text-3xl font-mono text-neutral-400 font-light">THIS CERTIFIES THAT</h1>

          <div className="text-5xl font-display font-bold text-[#0B0B0B] tracking-tight underline decoration-[#8BE000] decoration-4">
            PALASH SHAH
          </div>

          <p className="text-sm text-neutral-600 font-light max-w-lg mx-auto pt-2">
            has successfully completed all required modules, code assignments, and assessments for
          </p>

          <div className="text-3xl font-display font-bold text-[#0B0B0B] bg-[#FAFAFA] border border-[#D9D9D9] p-4 inline-block my-2">
            BUILDING AI AGENTS
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-8 border-t-2 border-[#0B0B0B] grid grid-cols-3 gap-6 font-mono text-xs text-left">
          <div>
            <span className="text-neutral-500 block">INSTRUCTOR</span>
            <span className="font-bold text-[#0B0B0B]">Alex Morgan ✓</span>
          </div>
          <div>
            <span className="text-neutral-500 block">ISSUED DATE</span>
            <span className="font-bold text-[#0B0B0B]">10 August 2026</span>
          </div>
          <div>
            <span className="text-neutral-500 block">CERTIFICATE ID</span>
            <span className="font-bold text-[#8BE000] bg-black px-1.5 py-0.5">{certId}</span>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="mt-8 flex items-center gap-4 font-mono text-xs">
        <MagneticButton onClick={triggerConfetti} className="btn-lime px-6 py-3 flex items-center gap-2 font-bold">
          <Award className="w-4 h-4" /> Celebrate Achievement 🎉
        </MagneticButton>
        <button onClick={() => window.print()} className="btn-black border border-[#262626] px-6 py-3 flex items-center gap-2">
          <Download className="w-4 h-4" /> Download Printable PDF
        </button>
      </div>
    </div>
  );
}
