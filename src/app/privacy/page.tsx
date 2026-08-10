"use client";

import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
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
            <Shield className="w-3.5 h-3.5" />
            <span>SEC COMPLIANT ENCRYPTION STANDARD</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-light leading-none tracking-tight">
            PRIVACY<br />
            <span className="text-[#8BE000] font-normal">POLICY.</span>
          </h1>
          <p className="text-xs text-neutral-400">
            Last Updated: August 11, 2026 • Version 1.2
          </p>
        </div>

        {/* Document Body */}
        <div className="space-y-8 text-neutral-300 text-xs leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-[#8BE000] font-bold uppercase tracking-wider text-sm">
              1.0 DATA TRANSMISSION & SECURE STORAGE
            </h2>
            <p>
              All personal and profile information gathered during the onboarding or registration process is transmitted securely using TLS 1.3 encryption. Real-time user database schemas are maintained in our high-availability Supabase PostgreSQL database clustered across global availability zones.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[#8BE000] font-bold uppercase tracking-wider text-sm">
              2.0 FINANCIAL AND CREDENTIAL INFORMATION
            </h2>
            <p>
              We do not directly store credit card details or bank account numbers on our servers. All subscription checkouts, masterclass reservations, and educator payouts are handled through verified, PCI-compliant third-party settlement providers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[#8BE000] font-bold uppercase tracking-wider text-sm">
              3.0 COOKIES AND STORAGE POLICIES
            </h2>
            <p>
              We utilize browser cookies and HTML5 local storage solely to retain active session authentications, interface language preferences (English, Japanese, Chinese), and user roles. We strictly reject cross-site tracking or third-party advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[#8BE000] font-bold uppercase tracking-wider text-sm">
              4.0 USER DATA DISPOSITION AND PORTABILITY
            </h2>
            <p>
              Pursuant to global privacy mandates, you retain the complete right to request a digital export of your education records, quantitative portfolio scripts, or to trigger a permanent deletion of your profile history. Direct inquiries can be escalated to our operations desk.
            </p>
          </section>
        </div>

        <div className="border-t border-[#262626] pt-8 text-[10px] text-neutral-500 flex justify-between">
          <span>360° MARKETS COMPLIANCE PROTOCOL</span>
          <span>SYSTEM STATE: SECURE</span>
        </div>
      </div>
    </div>
  );
}
