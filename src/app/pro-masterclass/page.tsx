"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  Zap,
  Radio,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { MagneticButton } from "@/motion/components/MagneticButton";
import { NumberCounter } from "@/motion/components/NumberCounter";

export default function ProMasterclassLandingPage() {
  const { user } = useAuth();
  const { t, currency } = useLanguage();
  const [reserved, setReserved] = useState(false);

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd}`;
  };

  const handleReserve = () => {
    setReserved(true);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B0B0B] text-white pb-24 font-mono">
        {/* Top Pro Banner */}
        <div className="border-b border-[#262626] bg-[#161616] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <Reveal>
              <div className="inline-flex items-center gap-2 border border-[#8BE000] px-3 py-1 text-xs text-[#8BE000] font-bold uppercase tracking-wider bg-black">
                <Zap className="w-4 h-4 fill-[#8BE000]" />
                <span>{t.proSub}</span>
              </div>
            </Reveal>

            <SplitTextReveal
              lines={[t.proHeroTitle]}
              className="text-4xl sm:text-6xl font-display font-light text-white tracking-tight leading-none"
            />

            <Reveal delay={0.1}>
              <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
                {t.proHeroSub}
              </p>
            </Reveal>
          </div>
        </div>

        {/* Masterclass Overview */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
            <div className="border border-[#262626] bg-[#161616] p-8 space-y-6">
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
                {t.proIncludesTitle}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-300">
                <div className="flex items-center gap-3 p-4 bg-[#0B0B0B] border border-[#262626]">
                  <CheckCircle2 className="w-4 h-4 text-[#8BE000] shrink-0" />
                  <span>{t.proInc1}</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-[#0B0B0B] border border-[#262626]">
                  <CheckCircle2 className="w-4 h-4 text-[#8BE000] shrink-0" />
                  <span>{t.proInc2}</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-[#0B0B0B] border border-[#262626]">
                  <CheckCircle2 className="w-4 h-4 text-[#8BE000] shrink-0" />
                  <span>{t.proInc3}</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-[#0B0B0B] border border-[#262626]">
                  <CheckCircle2 className="w-4 h-4 text-[#8BE000] shrink-0" />
                  <span>{t.proInc4}</span>
                </div>
              </div>
            </div>

            <div className="border border-[#262626] bg-[#161616] p-8 space-y-4">
              <h3 className="text-lg font-bold text-white uppercase">UPCOMING SESSION SCHEDULE</h3>
              <div className="text-xs text-neutral-400 space-y-2">
                <div className="flex justify-between py-2 border-b border-[#262626]">
                  <span>DATE:</span>
                  <span className="text-white">FRIDAY, US MARKET OPEN (09:30 AM EST)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#262626]">
                  <span>INSTRUCTOR:</span>
                  <span className="text-white">ALEX MORGAN (EX-HEDGE FUND QUANT)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>SEATS REMAINING:</span>
                  <span className="text-[#8BE000] font-bold">4 / 25 SEATS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout / Reservation Card */}
          <div className="lg:col-span-4">
            <div className="border-2 border-[#8BE000] bg-[#161616] p-8 sticky top-28 space-y-6 shadow-2xl">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest">LIMITED COHORT ACCESS</span>
                <div className="text-4xl font-display font-bold text-white">
                  {formatPrice(995)}
                  <span className="text-xs text-neutral-400 font-mono"> / Seat</span>
                </div>
              </div>

              {reserved ? (
                <div className="p-4 bg-lime-950/80 border border-[#8BE000] text-lime-300 text-xs space-y-3">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#8BE000]" />
                    <span>SEAT RESERVED SUCCESSFULLY</span>
                  </div>
                  <p>Your calendar invite and private Zoom/WebRTC link have been dispatched to your email.</p>
                  <Link href="/webinars/pro-live-room/pro-live" className="btn-lime w-full py-3 block text-center font-bold text-xs mt-2">
                    {t.btnEnterProLiveRoom}
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleReserve}
                  className="btn-lime w-full py-4 text-xs font-bold text-black uppercase tracking-wider"
                >
                  {t.btnReserveProSeat}
                </button>
              )}

              <div className="text-[11px] text-neutral-500 space-y-2 pt-2 border-t border-[#262626]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8BE000]" />
                  <span>Verified FINRA Track Record Educator</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>256-bit Encrypted Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
