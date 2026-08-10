"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LimeGlass3D } from "@/components/ui/LimeGlass3D";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { MagneticButton } from "@/motion/components/MagneticButton";
import { NumberCounter } from "@/motion/components/NumberCounter";
import { Pressable } from "@/motion/components/Pressable";
import { useLanguage } from "@/lib/language-context";
import {
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  Clock,
  Star,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language, currency } = useLanguage();

  const getCurrencySymbol = () => {
    if (currency === "JPY") return "¥";
    if (currency === "CNY") return "¥";
    return "$";
  };

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd}`;
  };

  const handleProtectedClick = (e: React.MouseEvent, targetHref: string) => {
    if (!user) {
      e.preventDefault();
      router.push("/login");
    }
  };

  return (
    <div className="bg-[#FFFFFF] text-[#0B0B0B]">
      {/* 1. HERO SECTION — Split Screen Editorial Design */}
      <section className="border-b border-[#D9D9D9] bg-[#FFFFFF] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left side: Oversized Editorial Typography */}
            <div className="lg:col-span-7 space-y-8">


              <SplitTextReveal
                lines={[t.heroLine1, t.heroLine2, t.heroLine3, t.heroLine4]}
                className="text-mega font-display text-[#0B0B0B] font-light leading-[0.9] tracking-tighter"
                highlightLast
                delay={0.1}
              />

              <Reveal delay={0.25}>
                <p className="text-hero-sub max-w-xl font-light text-neutral-600">
                  {t.heroSub}
                </p>
              </Reveal>

              <Reveal delay={0.35} className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href={user ? "/courses" : "/login"}
                  onClick={(e) => handleProtectedClick(e, "/courses")}
                >
                  <MagneticButton className="btn-lime text-base px-8 py-4 font-bold">
                    {t.btnExploreCourses} <ArrowRight className="w-5 h-5" />
                  </MagneticButton>
                </Link>

                <Link
                  href={user ? "/pro-masterclass" : "/login"}
                  onClick={(e) => handleProtectedClick(e, "/pro-masterclass")}
                >
                  <MagneticButton className="btn-black text-base px-8 py-4 border border-[#0B0B0B] font-bold">
                    <Zap className="w-4 h-4 text-[#8BE000] fill-[#8BE000]" /> {t.btnEnterProMode}
                  </MagneticButton>
                </Link>
              </Reveal>

              {/* Trust Indicators */}
              <Reveal delay={0.45} className="pt-6 border-t border-[#D9D9D9] grid grid-cols-3 gap-6 text-xs font-mono text-neutral-500">
                <div>
                  <div className="text-xl font-display font-semibold text-[#0B0B0B]">
                    <NumberCounter value={1284} />
                  </div>
                  <div>{t.statVerifiedTraders}</div>
                </div>
                <div>
                  <div className="text-xl font-display font-semibold text-[#0B0B0B]">
                    {getCurrencySymbol()}<NumberCounter value={482.9} decimals={1} suffix="K" />
                  </div>
                  <div>{t.statPayoutsToEducators}</div>
                </div>
                <div>
                  <div className="text-xl font-display font-semibold text-[#8BE000] bg-black px-1.5 py-0.5 inline-block text-white">
                    <NumberCounter value={99.4} decimals={1} suffix="%" />
                  </div>
                  <div>{t.statVerificationRate}</div>
                </div>
              </Reveal>
            </div>

            {/* Right side: 3D Lime Glass Art Component */}
            <div className="lg:col-span-5">
              <LimeGlass3D />
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS BANNER */}
      <section className="bg-[#0B0B0B] text-white border-b border-[#262626] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Reveal delay={0.1} className="border-l-2 border-[#8BE000] pl-6 space-y-1">
              <div className="text-xs text-neutral-400 font-mono uppercase tracking-widest">{t.statActiveInvestors}</div>
              <div className="text-4xl lg:text-5xl font-display font-light text-white tracking-tight">
                <NumberCounter value={28492} />
              </div>
              <div className="text-xs text-neutral-500 font-mono">+18% this month</div>
            </Reveal>

            <Reveal delay={0.2} className="border-l-2 border-[#D9D9D9] pl-6 space-y-1">
              <div className="text-xs text-neutral-400 font-mono uppercase tracking-widest">{t.statVerifiedCourses}</div>
              <div className="text-4xl lg:text-5xl font-display font-light text-white tracking-tight">
                <NumberCounter value={4821} />
              </div>
              <div className="text-xs text-neutral-500 font-mono">Curated stock curriculum</div>
            </Reveal>

            <Reveal delay={0.3} className="border-l-2 border-[#8BE000] pl-6 space-y-1">
              <div className="text-xs text-neutral-400 font-mono uppercase tracking-widest">{t.statLiveWebinars}</div>
              <div className="text-4xl lg:text-5xl font-display font-light text-white tracking-tight">
                <NumberCounter value={128} suffix=".00" />
              </div>
              <div className="text-xs text-neutral-500 font-mono">Active streaming today</div>
            </Reveal>

            <Reveal delay={0.4} className="border-l-2 border-[#D9D9D9] pl-6 space-y-1">
              <div className="text-xs text-neutral-400 font-mono uppercase tracking-widest">{t.statPlatformSplit}</div>
              <div className="text-4xl lg:text-5xl font-display font-light text-white tracking-tight">
                70<span className="text-[#8BE000] font-normal">/30</span>
              </div>
              <div className="text-xs text-neutral-500 font-mono">Trader revenue focus</div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. FEATURED STOCK COURSES */}
      <section className="py-20 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-[#D9D9D9] pb-6">
            <div>
              <span className="text-xs font-mono text-[#8BE000] bg-black px-2 py-0.5 uppercase tracking-widest">
                {t.featuredCoursesSub}
              </span>
              <h2 className="text-4xl lg:text-5xl font-display font-light text-[#0B0B0B] mt-2 tracking-tight">
                {t.featuredCoursesTitle}
              </h2>
            </div>
            <Link
              href={user ? "/courses" : "/login"}
              onClick={(e) => handleProtectedClick(e, "/courses")}
              className="mt-4 md:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-[#0B0B0B] hover:text-[#8BE000] transition"
            >
              Browse All Courses (4,821) →
            </Link>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stock Course 1 */}
            <Reveal delay={0.1}>
              <Pressable className="border border-[#D9D9D9] bg-[#FAFAFA] hover:border-[#8BE000] transition-all duration-300 group flex flex-col justify-between h-full">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="bg-[#0B0B0B] text-white px-2.5 py-0.5 font-medium">COURSE</span>
                    <span className="text-neutral-500">STOCK TRADING</span>
                  </div>

                  <div className="relative h-48 w-full overflow-hidden border border-[#D9D9D9]">
                    <img
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
                      alt="Stock Trading Course"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-[#8BE000] text-black text-[10px] font-mono font-bold px-2 py-0.5">
                      ✓ CERTIFIED
                    </div>
                  </div>

                  <h3 className="text-2xl font-display font-semibold text-[#0B0B0B] group-hover:text-[#8BE000] transition">
                    {t.course1Title}
                  </h3>

                  <p className="text-xs text-neutral-600 line-clamp-2">
                    {t.course1Sub}
                  </p>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between border-t border-[#D9D9D9] mt-4 bg-white">
                  <div>
                    <span className="text-xs text-neutral-400 block font-mono">SUBSCRIPTION</span>
                    <span className="text-2xl font-display font-bold text-[#0B0B0B]">
                      {formatPrice(49)}
                      <span className="text-xs text-neutral-500 font-mono">/mo</span>
                    </span>
                  </div>
                  <Link
                    href={user ? "/courses/quantitative-stock-trading" : "/login"}
                    onClick={(e) => handleProtectedClick(e, "/courses/quantitative-stock-trading")}
                  >
                    <MagneticButton className="btn-black text-xs px-4 py-2">
                      {t.btnViewCourse}
                    </MagneticButton>
                  </Link>
                </div>
              </Pressable>
            </Reveal>

            {/* Stock Course 2 */}
            <Reveal delay={0.2}>
              <Pressable className="border border-[#D9D9D9] bg-[#FAFAFA] hover:border-[#8BE000] transition-all duration-300 group flex flex-col justify-between h-full">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="bg-[#0B0B0B] text-white px-2.5 py-0.5 font-medium">COURSE</span>
                    <span className="text-neutral-500">OPTIONS TRADING</span>
                  </div>

                  <div className="relative h-48 w-full overflow-hidden border border-[#D9D9D9]">
                    <img
                      src="https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80"
                      alt="Options Course"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-[#8BE000] text-black text-[10px] font-mono font-bold px-2 py-0.5">
                      ✓ CERTIFIED
                    </div>
                  </div>

                  <h3 className="text-2xl font-display font-semibold text-[#0B0B0B] group-hover:text-[#8BE000] transition">
                    {t.course2Title}
                  </h3>

                  <p className="text-xs text-neutral-600 line-clamp-2">
                    {t.course2Sub}
                  </p>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between border-t border-[#D9D9D9] mt-4 bg-white">
                  <div>
                    <span className="text-xs text-neutral-400 block font-mono">ONE-TIME</span>
                    <span className="text-2xl font-display font-bold text-[#0B0B0B]">
                      {formatPrice(79)}
                    </span>
                  </div>
                  <Link
                    href={user ? "/courses/options-strategies-volatility" : "/login"}
                    onClick={(e) => handleProtectedClick(e, "/courses/options-strategies-volatility")}
                  >
                    <MagneticButton className="btn-black text-xs px-4 py-2">
                      {t.btnViewCourse}
                    </MagneticButton>
                  </Link>
                </div>
              </Pressable>
            </Reveal>

            {/* Stock Course 3 */}
            <Reveal delay={0.3}>
              <Pressable className="border border-[#D9D9D9] bg-[#FAFAFA] hover:border-[#8BE000] transition-all duration-300 group flex flex-col justify-between h-full">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="bg-[#0B0B0B] text-white px-2.5 py-0.5 font-medium">COURSE</span>
                    <span className="text-neutral-500">EQUITY RESEARCH</span>
                  </div>

                  <div className="relative h-48 w-full overflow-hidden border border-[#D9D9D9]">
                    <img
                      src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80"
                      alt="Equity Research Course"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-[#8BE000] text-black text-[10px] font-mono font-bold px-2 py-0.5">
                      ✓ CERTIFIED
                    </div>
                  </div>

                  <h3 className="text-2xl font-display font-semibold text-[#0B0B0B] group-hover:text-[#8BE000] transition">
                    {t.course3Title}
                  </h3>

                  <p className="text-xs text-neutral-600 line-clamp-2">
                    {t.course3Sub}
                  </p>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between border-t border-[#D9D9D9] mt-4 bg-white">
                  <div>
                    <span className="text-xs text-neutral-400 block font-mono">ONE-TIME</span>
                    <span className="text-2xl font-display font-bold text-[#0B0B0B]">
                      {formatPrice(59)}
                    </span>
                  </div>
                  <Link
                    href={user ? "/courses/equity-research-valuation" : "/login"}
                    onClick={(e) => handleProtectedClick(e, "/courses/equity-research-valuation")}
                  >
                    <MagneticButton className="btn-black text-xs px-4 py-2">
                      {t.btnViewCourse}
                    </MagneticButton>
                  </Link>
                </div>
              </Pressable>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. STOCK VERIFICATION BADGE BANNER */}
      <section className="bg-[#0B0B0B] text-white border-t border-b border-[#262626] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Reveal>
            <span className="text-xs font-mono text-[#8BE000] uppercase tracking-widest bg-[#161616] px-3 py-1 border border-[#262626]">
              FINRA / AUDITED TRADING RECORDS
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl lg:text-5xl font-display font-light tracking-tight max-w-3xl mx-auto text-white">
              {t.stockVerificationTitle}
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-xs text-neutral-400 font-mono max-w-xl mx-auto">
              {t.stockVerificationSub}
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
