"use client";

import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 border border-[#8BE000]/40 bg-black px-3 py-1 text-xs text-[#8BE000] font-bold">
            <Scale className="w-3.5 h-3.5" />
            <span>TERMS OF ENGAGEMENT</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-light leading-none tracking-tight">
            TERMS OF<br />
            <span className="text-[#8BE000] font-normal">SERVICE.</span>
          </h1>
          <p className="text-xs text-neutral-400">
            Last Updated: August 11, 2026 • Version 1.0
          </p>
        </div>

        {/* Document Body */}
        <div className="space-y-8 text-neutral-300 text-xs leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-[#8BE000] font-bold uppercase tracking-wider text-sm">
              1.0 PLATFORM USE AND ELIGIBILITY
            </h2>
            <p>
              By accessing the 360° Markets platform, you warrant that you are of legal age to form binding contracts. Users agree to access trading courses, options models, and live sessions solely for educational and simulation use. Any malicious attempt to scrape data, disrupt WebRTC live feeds, or reverse-engineer algorithms is grounds for immediate termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[#8BE000] font-bold uppercase tracking-wider text-sm">
              2.0 EDUCATOR REVENUE SPLIT & PAYMENTS
            </h2>
            <p>
              Certified educators receive an 80/20 revenue split for all digital courses, Python scripts, and webinar cohort sales created through the platform. Payouts are reconciled monthly and issued to verified accounts. The platform reserves the right to hold payouts in the event of active refund disputes or compliance violations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[#8BE000] font-bold uppercase tracking-wider text-sm">
              3.0 USER INTELLECTUAL PROPERTY
            </h2>
            <p>
              Educators retain full intellectual property rights to the materials, code blocks, and video streams they produce. By uploading content, educators grant 360° Markets a non-exclusive license to host and distribute the content to enrolled students.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[#8BE000] font-bold uppercase tracking-wider text-sm">
              4.0 LIMITATION OF PLATFORM LIABILITY
            </h2>
            <p>
              The platform provides a decentralized knowledge exchange and is not liable for system outages, latency in WebRTC live feeds, database service disruptions, or any financial losses incurred from executing trade strategies discussed in webinars.
            </p>
          </section>
        </div>

        <div className="border-t border-[#262626] pt-8 text-[10px] text-neutral-500 flex justify-between">
          <span>360° MARKETS LEGAL PROTOCOL</span>
          <span>SYSTEM STATE: ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
