"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, ShieldCheck } from "lucide-react";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { MagneticButton } from "@/motion/components/MagneticButton";
import { Pressable } from "@/motion/components/Pressable";
import { useLanguage } from "@/lib/language-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { supabase } from "@/lib/supabase";

export default function CoursesListPage() {
  const { t, currency } = useLanguage();
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd}`;
  };

  useEffect(() => {
    async function fetchCourses() {
      try {
        const { data } = await supabase
          .from("courses")
          .select(`
            *,
            trader_profiles (
              certification_status,
              profiles (
                display_name,
                first_name,
                last_name
              )
            )
          `)
          .eq("published", true);

        if (data) setDbCourses(data);
      } catch (e) {
        console.error("Courses fetch:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const mappedDbCourses = dbCourses.map((c) => {
    const profile = c.trader_profiles?.profiles;
    let traderName = "Verified Educator";
    if (profile) {
      traderName = profile.display_name || `${profile.first_name} ${profile.last_name}`.trim() || traderName;
    }

    const isCertified = c.trader_profiles?.certification_status === 'certified';

    return {
      id: c.id,
      title: c.title,
      sub: c.description || "",
      slug: c.slug || c.id,
      category: c.category || "Stock Trading",
      trader: traderName,
      isCertified: isCertified,
      rating: c.rating || 4.9,
      price: c.price || 0,
      isSubscription: c.is_subscription || false,
      thumbnail: c.thumbnail || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
      modules: 0,
      duration: "",
    };
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFFFFF] text-[#0B0B0B] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 border-b border-[#D9D9D9] pb-8 space-y-4">
            <span className="text-xs font-mono text-[#8BE000] bg-black px-3 py-1 uppercase tracking-wider">
              {t.featuredCoursesSub}
            </span>
            <SplitTextReveal
              lines={["VERIFIED STOCK COURSES", "CURRICULUM."]}
              className="text-5xl lg:text-6xl font-display font-light tracking-tight text-[#0B0B0B]"
            />
            <p className="text-xs font-mono text-neutral-500 max-w-xl">
              Learn institutional stock trading from verified quantitative educators. Every course comes with downloadable Python backtesting scripts and Excel models.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <span className="text-xs font-mono text-neutral-400 uppercase">Loading...</span>
            </div>
          ) : mappedDbCourses.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center border border-[#D9D9D9] bg-[#FAFAFA] text-center px-4">
              <span className="text-xs font-mono text-[#8BE000] bg-black px-3 py-1 uppercase tracking-wider mb-6">
                STATUS
              </span>
              <h3 className="text-4xl font-display font-semibold text-[#0B0B0B] mb-4 uppercase tracking-tight">
                No Courses Published Yet
              </h3>
              <p className="text-xs font-mono text-neutral-500 max-w-md mx-auto leading-relaxed">
                Check back later. Our verified educators are currently preparing new institutional-grade material.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {mappedDbCourses.map((c, i) => (
                <Reveal key={c.id} delay={i * 0.1}>
                  <Pressable className="border border-[#D9D9D9] bg-[#FAFAFA] hover:border-[#8BE000] transition-all duration-300 group flex flex-col justify-between h-full p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="bg-[#0B0B0B] text-white px-2.5 py-0.5 font-medium">{c.category}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{c.rating}</span>
                        </div>
                      </div>

                      <div className="relative h-56 w-full overflow-hidden border border-[#D9D9D9]">
                        <img
                          src={c.thumbnail}
                          alt={c.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {c.isCertified && (
                          <div className="absolute top-3 left-3 bg-[#8BE000] text-black text-[10px] font-mono font-bold px-2 py-0.5 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>CERTIFIED TRADER</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-3xl font-display font-semibold text-[#0B0B0B] group-hover:text-[#8BE000] transition leading-tight">
                        {c.title}
                      </h3>

                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {c.sub}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 pt-2 border-t border-[#E5E5E5]">
                        <span>Instructor: <strong className="text-black">{c.trader}</strong></span>
                        {c.modules > 0 && (
                          <>
                            <span>&bull;</span>
                            <span>{c.modules} Modules{c.duration ? ` (${c.duration})` : ""}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-[#D9D9D9] bg-white p-4 -mx-8 -mb-8">
                      <div>
                        <span className="text-[10px] text-neutral-400 block font-mono">PRICE</span>
                        <span className="text-2xl font-display font-bold text-[#0B0B0B]">
                          {formatPrice(c.price)}
                          {c.isSubscription && <span className="text-xs font-mono text-neutral-500">/mo</span>}
                        </span>
                      </div>
                      <Link href={`/courses/${c.slug}`}>
                        <MagneticButton className="btn-black text-xs px-6 py-3 font-bold">
                          View Course Details →
                        </MagneticButton>
                      </Link>
                    </div>
                  </Pressable>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
