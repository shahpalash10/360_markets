"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export function Footer() {
  const { t } = useLanguage();
  const pathname = usePathname();

  // Hide footer completely during dedicated full-screen onboarding & login
  if (pathname === "/register" || pathname === "/login") {
    return null;
  }

  return (
    <footer className="bg-[#0B0B0B] text-white border-t border-[#262626] py-16 text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#262626]">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#8BE000] text-black font-bold text-xs flex items-center justify-center">
                360°
              </div>
              <span className="font-display font-bold text-lg text-white">MARKETS STOCKS</span>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
              {t.footerTagline}
            </p>

          </div>

          {/* Col 2: Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">{t.footerQuickLinks}</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <Link href="/courses" className="hover:text-[#8BE000] transition">
                  {t.navCourses}
                </Link>
              </li>
              <li>
                <Link href="/pro-masterclass" className="hover:text-[#8BE000] transition">
                  {t.navProTrading}
                </Link>
              </li>
              <li>
                <Link href="/materials" className="hover:text-[#8BE000] transition">
                  {t.navMaterials}
                </Link>
              </li>
              <li>
                <Link href="/webinars" className="hover:text-[#8BE000] transition">
                  {t.navWebinars}
                </Link>
              </li>
              <li>
                <Link href="/traders" className="hover:text-[#8BE000] transition">
                  {t.navTraders}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Compliance & Legal */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">{t.footerLegal}</h4>
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              {t.footerSecNotice}
            </p>
            <div className="pt-2 flex items-center gap-4 text-neutral-400">
              <Link href="/privacy" className="hover:text-white transition">{t.footerPrivacy}</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-white transition">{t.footerTerms}</Link>
              <span>•</span>
              <Link href="/disclaimers" className="hover:text-white transition">{t.footerDisclaimers}</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-neutral-500 text-[11px]">
          <div>© 2026 MARKETS PLATFORM. {t.footerRights}</div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Globe className="w-3.5 h-3.5 text-[#8BE000]" />
            <span>GLOBAL STOCK TRADING NETWORK</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
