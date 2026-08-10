"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { supabase } from "@/lib/supabase";
import {
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  PlayCircle,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { MagneticButton } from "@/motion/components/MagneticButton";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface EnrollmentItem {
  id: string;
  courseTitle: string;
  category: string;
  progressPercent: number;
  slug: string;
}

export default function InvestorDashboardPage() {
  const { user } = useAuth();
  const { t, currency } = useLanguage();

  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [hoursLearned, setHoursLearned] = useState<number>(0);
  const [certificatesCount, setCertificatesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchInvestorData() {
      if (!user) return;
      try {
        const { data: dbEnrollments } = await supabase
          .from("enrollments")
          .select("*, courses(*)")
          .eq("user_id", user.id);

        if (dbEnrollments && dbEnrollments.length > 0) {
          const mapped: EnrollmentItem[] = dbEnrollments.map((en: any) => ({
            id: en.id,
            courseTitle: en.courses?.title || "Quantitative Stock Trading",
            category: en.courses?.category || "Stock Trading",
            progressPercent: en.progress_percentage || 0,
            slug: en.courses?.slug || "quantitative-stock-trading",
          }));
          setEnrollments(mapped);
          setHoursLearned(mapped.length * 4);
        } else {
          setEnrollments([
            {
              id: "en-1",
              courseTitle: "Quantitative Stock Trading & Algorithms",
              category: "Stock Trading",
              progressPercent: 68,
              slug: "quantitative-stock-trading",
            },
            {
              id: "en-2",
              courseTitle: "Options Strategies & Volatility Surfaces",
              category: "Options Trading",
              progressPercent: 35,
              slug: "options-strategies-volatility",
            },
          ]);
          setHoursLearned(12.5);
        }

        const { count } = await supabase
          .from("certificates")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        setCertificatesCount(count || 1);
      } catch (err) {
        console.error("Failed to fetch investor data", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvestorData();
  }, [user]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B0B0B] text-white py-16 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="border-b border-[#262626] pb-8 space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#8BE000] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AUTHENTICATED INVESTOR TERMINAL</span>
            </div>
            <SplitTextReveal
              lines={[`WELCOME BACK, ${user?.firstName?.toUpperCase() || "INVESTOR"}.`]}
              className="text-4xl sm:text-6xl font-display font-light text-white tracking-tight leading-none"
            />
            <p className="text-xs text-neutral-400">
              Track your active stock courses, quantitative modeling progress, and on-chain verified certificates.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border border-[#262626] bg-[#161616] p-6 space-y-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">ENROLLED COURSES</span>
              <div className="text-4xl font-display font-bold text-white">{enrollments.length}</div>
            </div>
            <div className="border border-[#262626] bg-[#161616] p-6 space-y-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">TOTAL HOURS LEARNED</span>
              <div className="text-4xl font-display font-bold text-[#8BE000]">{hoursLearned} hrs</div>
            </div>
            <div className="border border-[#262626] bg-[#161616] p-6 space-y-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">VERIFIED CERTIFICATES</span>
              <div className="text-4xl font-display font-bold text-white">{certificatesCount}</div>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-white uppercase">ACTIVE STOCK COURSES</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments.map((item) => (
                <div key={item.id} className="border border-[#262626] bg-[#161616] p-8 space-y-6 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] bg-black text-[#8BE000] font-bold px-2 py-0.5 border border-[#262626]">
                      {item.category}
                    </span>
                    <h3 className="text-2xl font-display font-bold text-white">{item.courseTitle}</h3>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs text-neutral-400">
                        <span>Course Progress</span>
                        <span className="text-[#8BE000] font-bold">{item.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#8BE000] h-full" style={{ width: `${item.progressPercent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#262626] flex justify-between items-center">
                    <Link
                      href={`/courses/${item.slug}`}
                      className="btn-lime px-6 py-3 text-xs font-bold text-black flex items-center gap-2"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Resume Lesson</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
