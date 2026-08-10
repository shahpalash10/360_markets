"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldCheck, CheckCircle2, QrCode, ArrowLeft, Download, Share2 } from "lucide-react";

export default function CertificationVerifyPage() {
  const params = useParams();
  const certId = (params?.id as string) || "TRD-928184";

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-xl bg-[#161616] border-2 border-[#8BE000] p-8 shadow-2xl space-y-8 text-center relative">
        {/* Top Status Seal */}
        <div className="inline-flex items-center gap-2 bg-[#8BE000] text-black font-mono font-bold text-xs px-4 py-1 uppercase tracking-widest mx-auto">
          <ShieldCheck className="w-4 h-4" />
          OFFICIAL PLATFORM CERTIFICATION
        </div>

        <div className="space-y-2">
          <span className="text-xs text-neutral-400 font-mono block">CERTIFICATION IDENTIFIER</span>
          <div className="text-4xl font-display font-bold text-white tracking-wider">{certId}</div>
          <div className="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-1 font-mono text-xs font-bold mt-2">
            ✓ VALID & ACTIVE
          </div>
        </div>

        <div className="border-y border-[#262626] py-6 grid grid-cols-2 gap-4 font-mono text-xs text-left">
          <div>
            <span className="text-neutral-500 block">CERTIFIED TRADER</span>
            <span className="text-white font-bold text-sm">Alex Morgan</span>
          </div>
          <div>
            <span className="text-neutral-500 block">ROLE / TITLE</span>
            <span className="text-neutral-300">Staff AI Engineer</span>
          </div>
          <div>
            <span className="text-neutral-500 block">ISSUE DATE</span>
            <span className="text-neutral-300">15 January 2025</span>
          </div>
          <div>
            <span className="text-neutral-500 block">EXPIRY DATE</span>
            <span className="text-[#8BE000]">NEVER (LIFETIME)</span>
          </div>
        </div>

        <div className="bg-[#0B0B0B] border border-[#262626] p-4 text-xs font-mono text-neutral-400 space-y-1 text-left">
          <div>HASH: 0x8a92b4912c904819d4e928184f092e</div>
          <div>STATUS: Cryptographically signed by Admin Master Key.</div>
        </div>

        <div className="pt-2">
          <Link href="/traders/alex-morgan" className="btn-lime w-full text-xs py-3">
            View Certified Trader Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
