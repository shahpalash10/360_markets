"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldCheck, Star, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { MagneticButton } from "@/motion/components/MagneticButton";
import { Pressable } from "@/motion/components/Pressable";
import { useLanguage } from "@/lib/language-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { supabase } from "@/lib/supabase";

export default function TraderProfilePage() {
  const { t, currency } = useLanguage();
  const params = useParams();
  const traderUserId = params.id as string;

  const [traderProfile, setTraderProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd}`;
  };

  useEffect(() => {
    async function loadTraderData() {
      if (!traderUserId) return;
      setIsLoading(true);

      try {
        // 1. Fetch trader profile by user_id
        const { data: tp, error: tpErr } = await supabase
          .from("trader_profiles")
          .select("*, profiles(*)")
          .eq("user_id", traderUserId)
          .single();

        if (tpErr) {
          console.error("Trader profile lookup error:", tpErr);
          setIsLoading(false);
          return;
        }

        if (tp) {
          setTraderProfile(tp);

          // 2. Fetch published courses created by this trader profile
          const { data: coursesData } = await supabase
            .from("courses")
            .select("*")
            .eq("trader_id", tp.id)
            .eq("published", true);

          if (coursesData) {
            setCourses(coursesData);
          }
        }
      } catch (err) {
        console.error("Trader data loading error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTraderData();
  }, [traderUserId]);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#FFFFFF] text-black flex items-center justify-center font-mono">
          <div className="animate-pulse">Loading trader profile...</div>
        </div>
      </AuthGuard>
    );
  }

  if (!traderProfile) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#FFFFFF] text-black flex flex-col items-center justify-center font-mono space-y-4">
          <h1 className="text-xl font-bold uppercase">TRADER NOT FOUND</h1>
          <p className="text-xs text-neutral-500">The requested certified stock educator profile does not exist.</p>
          <Link href="/traders" className="btn-black text-xs px-6 py-3 font-bold">
            Back to Directory
          </Link>
        </div>
      </AuthGuard>
    );
  }

  const profile = traderProfile.profiles;
  const traderName = profile
    ? profile.display_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
    : "Verified Educator";
  const titleText = traderProfile.professional_title || "Certified Stock Educator";
  const bioText = traderProfile.bio || "Quantitative Stock Trading & Execution Expert.";
  const certId = traderProfile.certification_id || "TRD-VERIFIED";
  const avatarUrl =
    profile?.avatar_url ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FFFFFF] text-[#0B0B0B] py-16 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header Profile Banner */}
          <div className="border border-[#D9D9D9] bg-[#FAFAFA] p-8 sm:p-12 flex flex-col md:flex-row items-center md:items-start gap-8">
            <img
              src={avatarUrl}
              alt={traderName}
              className="w-32 h-32 object-cover border border-[#D9D9D9]"
            />
            <div className="space-y-4 text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-4xl font-display font-bold text-[#0B0B0B]">{traderName}</h1>
                <span className="bg-[#8BE000] text-black font-bold text-xs px-2.5 py-0.5 inline-block">
                  ✓ VERIFIED ON-CHAIN • {certId}
                </span>
              </div>
              <p className="text-sm font-bold text-neutral-600">{titleText}</p>
              <p className="text-xs text-neutral-600 max-w-2xl font-sans leading-relaxed">
                {bioText}
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4 max-w-md border-t border-[#D9D9D9]">
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">ACTIVE LEARNERS</span>
                  <span className="text-xl font-bold">{traderProfile.total_subscribers || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">COURSES</span>
                  <span className="text-xl font-bold">{courses.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">RATING</span>
                  <span className="text-xl font-bold text-amber-600">★ {(traderProfile.rating || 5.0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Published Courses Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-[#0B0B0B] uppercase">COURSES BY {traderName}</h2>
            {courses.length === 0 ? (
              <div className="p-12 border border-[#D9D9D9] bg-[#FAFAFA] text-center text-xs text-neutral-500">
                This educator has not published any courses yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {courses.map((c, i) => (
                  <div key={c.id} className="border border-[#D9D9D9] bg-[#FAFAFA] p-8 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <span className="bg-[#0B0B0B] text-white text-[10px] px-2 py-0.5 font-bold">{c.category || "Stock Trading"}</span>
                      <h3 className="text-2xl font-display font-bold text-[#0B0B0B]">{c.title}</h3>
                      <p className="text-xs text-neutral-600 line-clamp-3 font-sans">{c.description}</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-[#D9D9D9] mt-4">
                      <span className="text-xl font-bold font-display">{formatPrice(c.price || 49)}</span>
                      <Link href={`/courses/${c.slug || c.id}`}>
                        <MagneticButton className="btn-black text-xs px-6 py-2.5 font-bold">
                          View Course Details →
                        </MagneticButton>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
