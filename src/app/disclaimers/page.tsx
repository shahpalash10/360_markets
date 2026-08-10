"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function DisclaimersPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white py-20 px-4 sm:px-6 lg:px-8 font-mono select-none">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Navigation Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-[#8BE000] transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>RETURN TO TERMINAL</span>
        </Link>

        {/* Header Title Section */}
        <div className="space-y-4 border-b border-[#262626] pb-8">
          <div className="inline-flex items-center gap-2 border border-red-500/40 bg-black px-3 py-1 text-xs text-red-400 font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>FINANCIAL REGULATION STANDARD NOTICE</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-light leading-none tracking-tight">
            RISK<br />
            <span className="text-red-500 font-normal">DISCLAIMERS.</span>
          </h1>
          <p className="text-xs text-neutral-400">
            Last Updated: August 11, 2026 • FINRA Rule 2210 & SEC Compliance
          </p>
        </div>

        {/* Document Body */}
        <div className="space-y-8 text-neutral-300 text-xs leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-red-400 font-bold uppercase tracking-wider text-sm">
              1.0 GENERAL STOCK TRADING RISK
            </h2>
            <p>
              Trading stocks, ETFs, mutual funds, and equities involves significant risk of loss. Past performance of any trader, strategy, or algorithm hosted on 360° Markets does not guarantee future results. Investors must be prepared to lose their entire initial capital investment.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-red-400 font-bold uppercase tracking-wider text-sm">
              2.0 OPTIONS AND VOLATILITY PRODUCTS
            </h2>
            <p>
              Options involve high leverage and rapid decay, making them unsuitable for many investors. Prior to buying or selling options, investors must read and understand the "Characteristics and Risks of Standardized Options" (ODD) disclosure published by the Options Clearing Corporation (OCC).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-red-400 font-bold uppercase tracking-wider text-sm">
              3.0 NO FINANCIAL ADVICE
            </h2>
            <p>
              360° Markets is an educational technology exchange platform. The courses, Python codes, spreadsheets, and live webinars shared by certified educators are for informational and educational purposes only. Nothing contained on this site constitutes investment, tax, or legal advice, nor an endorsement or solicitation to buy or sell securities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-red-400 font-bold uppercase tracking-wider text-sm">
              4.0 SIMULATED & HYPOTHETICAL PERFORMANCE
            </h2>
            <p>
              Any Python backtesting results, historical performance sheets, or chart mockups displayed on the landing page or within courses represent simulated or hypothetical results. Unlike an actual performance record, simulated results do not represent actual trading.
            </p>
          </section>
        </div>

        <div className="border-t border-red-500/20 pt-8 text-[10px] text-neutral-500 flex justify-between">
          <span>360° MARKETS COMPLIANCE PROTOCOL</span>
          <span className="text-red-400">STATUS: COMPLIANT</span>
        </div>
      </div>
    </div>
  );
}
