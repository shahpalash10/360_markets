"use client";

import React, { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";
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
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    async function fetchRealCourses() {
      try {
        let loaded: any[] = [];
        try {
          const apiRes = await fetch("/api/courses");
          const apiData = await apiRes.json();
          if (apiData.success && apiData.courses && apiData.courses.length > 0) {
            loaded = apiData.courses.filter((c: any) => c.published !== false);
          }
        } catch (e) {}

        if (loaded.length === 0) {
          const { data } = await supabase
            .from("courses")
            .select(`
              *,
              trader_profiles (
                is_certified,
                certification_status,
                profiles (
                  display_name,
                  first_name,
                  last_name
                )
              )
            `)
            .eq("published", true)
            .order("created_at", { ascending: false });

          if (data && data.length > 0) loaded = data;
        }

        setCourses(loaded);
      } catch (err) {
        console.error("Featured courses error:", err);
      } finally {
        setIsLoadingCourses(false);
      }
    }

    fetchRealCourses();
  }, []);

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
                <Link href="/courses">
                  <MagneticButton className="btn-lime text-base px-8 py-4 font-bold">
                    {t.btnExploreCourses} <ArrowRight className="w-5 h-5" />
                  </MagneticButton>
                </Link>

                <Link href="/pro-masterclass">
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
              <div className="text-xs text-neutral-500 font-mono">{t.statFootnote1}</div>
            </Reveal>

            <Reveal delay={0.2} className="border-l-2 border-[#D9D9D9] pl-6 space-y-1">
              <div className="text-xs text-neutral-400 font-mono uppercase tracking-widest">{t.statVerifiedCourses}</div>
              <div className="text-4xl lg:text-5xl font-display font-light text-white tracking-tight">
                <NumberCounter value={4821} />
              </div>
              <div className="text-xs text-neutral-500 font-mono">{t.statFootnote2}</div>
            </Reveal>

            <Reveal delay={0.3} className="border-l-2 border-[#8BE000] pl-6 space-y-1">
              <div className="text-xs text-neutral-400 font-mono uppercase tracking-widest">{t.statLiveWebinars}</div>
              <div className="text-4xl lg:text-5xl font-display font-light text-white tracking-tight">
                <NumberCounter value={128} suffix=".00" />
              </div>
              <div className="text-xs text-neutral-500 font-mono">{t.statFootnote3}</div>
            </Reveal>

            <Reveal delay={0.4} className="border-l-2 border-[#D9D9D9] pl-6 space-y-1">
              <div className="text-xs text-neutral-400 font-mono uppercase tracking-widest">{t.statPlatformSplit}</div>
              <div className="text-4xl lg:text-5xl font-display font-light text-white tracking-tight">
                70<span className="text-[#8BE000] font-normal">/30</span>
              </div>
              <div className="text-xs text-neutral-500 font-mono">{t.statFootnote4}</div>
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
              href="/courses"
              className="mt-4 md:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-[#0B0B0B] hover:text-[#8BE000] transition"
            >
              {t.commonBrowseAllCourses}
            </Link>
          </Reveal>

          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1].map((n) => (
                <div key={n} className="border border-[#D9D9D9] bg-[#FAFAFA] p-6 space-y-4 animate-pulse">
                  <div className="h-4 bg-neutral-200 w-1/3" />
                  <div className="h-48 bg-neutral-200 w-full" />
                  <div className="h-6 bg-neutral-200 w-2/3" />
                  <div className="h-12 bg-neutral-200 w-full" />
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="border border-[#D9D9D9] bg-[#FAFAFA] p-12 text-center text-xs font-mono text-neutral-500 space-y-2">
              <div className="text-neutral-900 font-bold uppercase">{t.coursesEmptyTitle}</div>
              <p>{t.coursesEmptyDesc}</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${courses.length === 1 ? "max-w-xl mx-auto" : courses.length === 2 ? "md:grid-cols-2 max-w-4xl mx-auto" : "md:grid-cols-3"} gap-8`}>
              {courses.map((crs, idx) => {
                const profile = crs.trader_profiles?.profiles || crs.trader?.user;
                const traderName = profile
                  ? (profile.display_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim())
                  : (crs.trader?.user?.name || "Verified Educator");
                const isCertified = crs.trader?.isCertified ?? (crs.trader_profiles?.is_certified || crs.trader_profiles?.certification_status === "certified" || true);
                const thumbnail = crs.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";

                return (
                  <Reveal key={crs.id} delay={0.1 * (idx + 1)}>
                    <Pressable className="border border-[#D9D9D9] bg-[#FAFAFA] hover:border-[#8BE000] transition-all duration-300 group flex flex-col justify-between h-full">
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="bg-[#0B0B0B] text-white px-2.5 py-0.5 font-medium">{t.commonCourse}</span>
                          <span className="text-neutral-500">{crs.category || t.commonStockTrading}</span>
                        </div>

                        <div className="relative h-48 w-full overflow-hidden border border-[#D9D9D9]">
                          <img
                            src={thumbnail}
                            alt={crs.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {isCertified && (
                            <div className="absolute top-2 left-2 bg-[#8BE000] text-black text-[10px] font-mono font-bold px-2 py-0.5">
                              ✓ {t.commonCertified}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-2xl font-display font-semibold text-[#0B0B0B] group-hover:text-[#8BE000] transition">
                            {crs.title}
                          </h3>
                          {traderName && (
                            <p className="text-[11px] text-neutral-500 font-mono">
                              {t.commonInstructor} {traderName}
                            </p>
                          )}
                        </div>

                        <p className="text-xs text-neutral-600 line-clamp-2">
                          {crs.description}
                        </p>
                      </div>

                      <div className="p-6 pt-0 flex items-center justify-between border-t border-[#D9D9D9] mt-4 bg-white">
                        <div>
                          <span className="text-xs text-neutral-400 block font-mono">
                            {crs.is_subscription ? t.commonSubscription : t.commonOneTime}
                          </span>
                          <span className="text-2xl font-display font-bold text-[#0B0B0B]">
                            {formatPrice(crs.price || 0)}
                            {crs.is_subscription && (
                              <span className="text-xs text-neutral-500 font-mono">/{t.commonMonth}</span>
                            )}
                          </span>
                        </div>
                        <Link href={`/courses/${crs.slug || crs.id}`}>
                          <MagneticButton className="btn-black text-xs px-4 py-2">
                            {t.btnViewCourse}
                          </MagneticButton>
                        </Link>
                      </div>
                    </Pressable>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. STOCK VERIFICATION BADGE BANNER */}
      <section className="bg-[#0B0B0B] text-white border-t border-b border-[#262626] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Reveal>
            <span className="text-xs font-mono text-[#8BE000] uppercase tracking-widest bg-[#161616] px-3 py-1 border border-[#262626]">
              {t.commonAuditedRecords}
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
