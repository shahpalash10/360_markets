"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Star, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { MagneticButton } from "@/motion/components/MagneticButton";
import { Pressable } from "@/motion/components/Pressable";
import { useLanguage } from "@/lib/language-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { supabase } from "@/lib/supabase";

export default function TradersDirectoryPage() {
  const { t } = useLanguage();
  const [traders, setTraders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCertifiedTraders() {
      try {
        // Fetch trader_profiles joining profiles where certified
        const { data, error } = await supabase
          .from("trader_profiles")
          .select("*, profiles(*)")
          .or("is_certified.eq.true,certification_status.eq.certified");

        if (error) {
          console.error("Error fetching traders:", error);
          return;
        }

        if (data) {
          setTraders(data);
        }
      } catch (err) {
        console.error("Traders fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCertifiedTraders();
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFFFFF] text-[#0B0B0B] py-16 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 border-b border-[#D9D9D9] pb-8 space-y-4">
            <span className="text-xs font-mono text-[#8BE000] bg-black px-3 py-1 uppercase tracking-wider">
              {t.tradersSub}
            </span>
            <SplitTextReveal
              lines={["CERTIFIED STOCK TRADERS", "& EDUCATORS."]}
              className="text-5xl lg:text-6xl font-display font-light tracking-tight text-[#0B0B0B]"
            />
            <p className="text-xs font-mono text-neutral-500 max-w-xl">
              Every educator has their brokerage trading records audited and verified on-chain. Explore trader performance track records, courses, and upcoming live streams.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="border border-[#D9D9D9] bg-[#FAFAFA] h-80 animate-pulse" />
              ))}
            </div>
          ) : traders.length === 0 ? (
            <div className="text-center py-16 border border-[#D9D9D9] bg-[#FAFAFA] text-neutral-500 text-xs">
              <p className="font-bold text-black uppercase mb-1">NO CERTIFIED TRADERS FOUND</p>
              <p>Certified educators will populate here once their certification applications are approved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {traders.map((tp, i) => {
                const profile = tp.profiles;
                const traderName = profile
                  ? profile.display_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                  : "Verified Educator";
                const traderTitle = tp.professional_title || "Certified Stock Educator";
                const rating = tp.rating || 5.0;
                const bioSummary = tp.bio || "Quantitative Stock Trading & Execution Expert.";
                const avatarUrl =
                  profile?.avatar_url ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80";

                return (
                  <Reveal key={tp.id} delay={i * 0.1}>
                    <Pressable className="border border-[#D9D9D9] bg-[#FAFAFA] hover:border-[#8BE000] transition-all duration-300 group flex flex-col justify-between h-full p-8 space-y-6">
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <img
                            src={avatarUrl}
                            alt={traderName}
                            className="w-16 h-16 object-cover border border-[#D9D9D9] group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <h3 className="text-2xl font-display font-bold text-[#0B0B0B] group-hover:text-[#8BE000] transition">
                              {traderName}
                            </h3>
                            <div className="text-[10px] text-[#8BE000] font-mono font-bold bg-black px-2 py-0.5 inline-block mt-1">
                              {t.traderCertifiedBadge}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-neutral-500 font-mono">
                          {traderTitle}
                        </div>

                        <p className="text-xs text-neutral-600 leading-relaxed font-sans line-clamp-3">
                          {bioSummary}
                        </p>

                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#E5E5E5] text-center">
                          <div className="bg-white p-2 border border-[#E5E5E5]">
                            <span className="text-[9px] text-neutral-400 block">{t.traderInvestorsLabel}</span>
                            <span className="font-bold text-xs">{tp.total_subscribers || 0}</span>
                          </div>
                          <div className="bg-white p-2 border border-[#E5E5E5]">
                            <span className="text-[9px] text-neutral-400 block">{t.traderCoursesLabel}</span>
                            <span className="font-bold text-xs">{tp.total_courses || 0}</span>
                          </div>
                          <div className="bg-white p-2 border border-[#E5E5E5]">
                            <span className="text-[9px] text-neutral-400 block">{t.traderRatingLabel}</span>
                            <span className="font-bold text-xs text-amber-600">★ {rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#D9D9D9]">
                        <Link href={`/traders/${tp.user_id}`}>
                          <MagneticButton className="btn-black w-full text-xs py-3 font-bold flex items-center justify-center gap-2">
                            <span>{t.btnViewProfile}</span>
                            <ArrowUpRight className="w-4 h-4" />
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
      </div>
    </AuthGuard>
  );
}
