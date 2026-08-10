"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { supabase } from "@/lib/supabase";
import {
  ShieldCheck,
  DollarSign,
  Users,
  BookOpen,
  Video,
  Plus,
  AlertTriangle,
  Lock,
  ArrowUpRight,
  RefreshCw,
  Radio,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function TraderDashboardPage() {
  const { user } = useAuth();
  const { currency } = useLanguage();

  const [certificationStatus, setCertificationStatus] = useState<
    "loading" | "none" | "pending" | "approved" | "rejected"
  >("loading");
  const [certId, setCertId] = useState<string | null>(null);
  const [grossRevenue, setGrossRevenue] = useState<number>(0);
  const [totalSubscribers, setTotalSubscribers] = useState<number>(0);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [totalWebinars, setTotalWebinars] = useState<number>(0);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [webinarsList, setWebinarsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isCertified = certificationStatus === "approved";

  const fetchTraderData = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      // 1. Check certification from profiles table
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // 2. Check trader_profiles for certification data
      let tpData: any = null;
      try {
        const { data: tp } = await supabase
          .from("trader_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        tpData = tp;
      } catch (e) {
        // trader_profiles row may not exist yet
      }

      // 3. Check trader_applications for submission status
      let latestApp: any = null;
      try {
        const { data: apps } = await supabase
          .from("trader_applications")
          .select("*")
          .eq("user_id", user.id);

        if (apps && apps.length > 0) {
          // Sort client-side to find latest
          const sorted = [...apps].sort((a, b) => {
            const da = new Date(a.submitted_at || a.created_at || 0).getTime();
            const db = new Date(b.submitted_at || b.created_at || 0).getTime();
            return db - da;
          });
          latestApp = sorted[0];
        }
      } catch (e) {
        // table may not exist
      }

      // Determine certification status from all sources
      const profileCertified = prof?.is_certified === true;
      const tpCertified = tpData?.is_certified === true || tpData?.certification_status === "certified";
      const appApproved = latestApp?.status === "approved";

      if (profileCertified || tpCertified || appApproved) {
        setCertificationStatus("approved");
        setCertId(
          tpData?.certification_id ||
          latestApp?.certification_id ||
          prof?.certification_id ||
          null
        );
      } else if (latestApp?.status === "rejected") {
        setCertificationStatus("rejected");
      } else if (latestApp?.status === "pending" || latestApp?.status === "under_review") {
        setCertificationStatus("pending");
      } else {
        setCertificationStatus("none");
      }

      // 4. Fetch courses & webinars — trader_id in courses/webinars references trader_profiles.id, not profiles.id
      const traderProfileId = tpData?.id;
      if (traderProfileId) {
        // Courses
        const { data: userCourses, count: cCount } = await supabase
          .from("courses")
          .select("*", { count: "exact" })
          .eq("trader_id", traderProfileId);

        setTotalCourses(cCount || 0);
        setCoursesList(userCourses || []);

        // Webinars
        const { data: userWebinars, count: wCount } = await supabase
          .from("webinars")
          .select("*", { count: "exact" })
          .eq("trader_id", traderProfileId);

        setTotalWebinars(wCount || 0);
        setWebinarsList(userWebinars || []);

        // 6. Calculate enrollments & revenue
        if (userCourses && userCourses.length > 0) {
          const courseIds = userCourses.map((c) => c.id);
          const { data: enrollmentsData, count: eCount } = await supabase
            .from("enrollments")
            .select("*, courses(*)", { count: "exact" })
            .in("course_id", courseIds);

          setTotalSubscribers(eCount || 0);

          const realGross = (enrollmentsData || []).reduce((acc, en) => {
            return acc + (en.courses?.price || 0);
          }, 0);
          setGrossRevenue(realGross);
        } else {
          setTotalSubscribers(0);
          setGrossRevenue(0);
        }
      } else {
        setTotalCourses(0);
        setCoursesList([]);
        setTotalWebinars(0);
        setWebinarsList([]);
        setTotalSubscribers(0);
        setGrossRevenue(0);
      }
    } catch (e) {
      console.error("Trader Hub fetch error:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTraderData();
  }, [user]);

  const educatorShare = grossRevenue * 0.8;

  return (
    <AuthGuard allowedRoles={["TRADER"]}>
      <div className="min-h-screen bg-[#080808] text-white py-12 lg:py-16 font-mono selection:bg-[#8BE000] selection:text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#1E1E1E]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-[#8BE000] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 bg-[#8BE000] rounded-full inline-block animate-pulse" />
                <span>EDUCATOR PORTAL</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-light tracking-tight text-white">
                EDUCATOR HUB.
              </h1>
              <p className="text-xs text-neutral-400 font-sans max-w-xl leading-relaxed">
                Manage your courses, track enrollments, schedule live Pro Masterclasses, and view your 80/20 revenue settlement.
              </p>
            </div>

            <button
              onClick={fetchTraderData}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-[#121212] hover:bg-[#1A1A1A] border border-[#262626] px-3.5 py-2 text-xs text-neutral-300 transition focus:outline-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#8BE000]" : "text-neutral-400"}`} />
              <span>{isRefreshing ? "Syncing..." : "Sync Hub"}</span>
            </button>
          </div>

          {/* Certification Status Banner */}
          {certificationStatus === "loading" ? (
            <div className="border border-[#1E1E1E] bg-[#111111] p-6 animate-pulse">
              <div className="h-4 bg-[#1E1E1E] w-1/3 mb-2" />
              <div className="h-3 bg-[#1E1E1E] w-2/3" />
            </div>
          ) : certificationStatus === "approved" ? (
            <div className="border border-[#8BE000]/40 bg-[#0A1202] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#8BE000]" />
                <div className="space-y-0.5">
                  <span className="text-xs text-[#8BE000] font-bold uppercase tracking-wider">
                    CERTIFIED STOCK EDUCATOR {certId ? `\u2022 ${certId}` : ""}
                  </span>
                  <p className="text-xs text-neutral-400 font-sans">
                    Your verification certificate is active. You have full publishing and live streaming privileges.
                  </p>
                </div>
              </div>
              <Link
                href="/trader/certification"
                className="bg-[#121212] hover:bg-[#1C1C1C] border border-[#2E2E2E] text-white px-4 py-2 font-mono text-xs shrink-0 transition"
              >
                View Certificate
              </Link>
            </div>
          ) : certificationStatus === "pending" ? (
            <div className="border border-amber-600/40 bg-[#141005] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    CERTIFICATION UNDER ADMIN REVIEW
                  </span>
                  <p className="text-xs text-neutral-300 font-sans">
                    Your dossier has been submitted and is pending administrative approval. Course creation and webinars will be unlocked once certified.
                  </p>
                </div>
              </div>
              <Link
                href="/trader/certification"
                className="bg-[#1A1A1A] hover:bg-[#262626] text-white px-4 py-2 font-mono text-xs shrink-0 transition"
              >
                View Application Status
              </Link>
            </div>
          ) : certificationStatus === "rejected" ? (
            <div className="border border-red-600/40 bg-[#160606] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs text-red-400 font-bold uppercase tracking-wider">
                  CERTIFICATION APPLICATION DECLINED
                </span>
                <p className="text-xs text-neutral-300 font-sans">
                  Please update your credentials and re-submit your dossier for review.
                </p>
              </div>
              <Link href="/trader/certification" className="bg-red-950 border border-red-700 text-white px-4 py-2 text-xs font-bold">
                Re-submit Dossier
              </Link>
            </div>
          ) : (
            /* certificationStatus === "none" — never submitted */
            <div className="border border-[#1E1E1E] bg-[#111111] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    CERTIFICATION REQUIRED TO UNLOCK ACTIONS
                  </span>
                  <p className="text-xs text-neutral-400 font-sans">
                    Submit your trading credentials and brokerage track record for admin verification. Course publishing and webinar live rooms are locked until certification is granted.
                  </p>
                </div>
              </div>
              <Link
                href="/trader/certification"
                className="btn-lime text-black px-5 py-2.5 font-bold text-xs shrink-0"
              >
                Submit Certification Dossier
              </Link>
            </div>
          )}

          {/* Revenue & Growth Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">NET PAYOUT (80%)</span>
                <DollarSign className="w-4 h-4 text-[#8BE000]" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-[#8BE000]">
                {formatPrice(educatorShare)}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Gross: {formatPrice(grossRevenue)}
              </div>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">PAID ENROLLMENTS</span>
                <Users className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-white">
                {totalSubscribers}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Active students enrolled
              </div>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">MY COURSES</span>
                <BookOpen className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-white">
                {totalCourses}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Published curriculum
              </div>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">LIVE WEBINARS</span>
                <Video className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-white">
                {totalWebinars}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Scheduled sessions
              </div>
            </div>
          </div>

          {/* Published Courses */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#1E1E1E]">
              <div>
                <h3 className="text-xl font-display font-medium text-white tracking-tight">
                  MY CURRICULUM ({coursesList.length})
                </h3>
                <p className="text-xs text-neutral-400 font-sans">
                  Courses authored and published by your educator account
                </p>
              </div>

              {isCertified ? (
                <Link href="/trader/courses/new" className="btn-lime px-4 py-2 text-xs font-bold text-black flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Create New Course</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 bg-[#111111] border border-[#1E1E1E] px-4 py-2 text-xs text-neutral-500 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Certification Required</span>
                </div>
              )}
            </div>

            {coursesList.length === 0 ? (
              <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center text-xs text-neutral-500 font-mono space-y-2">
                <div className="text-neutral-300 font-bold">NO COURSES CREATED YET</div>
                {isCertified ? (
                  <p>Click "Create New Course" above to publish your first course.</p>
                ) : (
                  <p>Complete your certification to unlock course creation.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesList.map((crs) => (
                  <div key={crs.id} className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-4 hover:border-[#2E2E2E] transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] bg-black text-[#8BE000] font-bold px-1.5 py-0.5 border border-[#222]">
                        {crs.category || "Stock Trading"}
                      </span>
                      <span className="text-xs text-white font-bold">{formatPrice(crs.price || 0)}</span>
                    </div>

                    <h4 className="text-lg font-display font-bold text-white leading-snug">{crs.title}</h4>
                    <p className="text-xs text-neutral-400 line-clamp-2 font-sans">{crs.description}</p>

                    <div className="pt-3 border-t border-[#1E1E1E] flex justify-between items-center text-xs text-neutral-500">
                      <span>{crs.published ? "Published" : "Pending QA"}</span>
                      <Link href={`/courses/${crs.slug || crs.id}`} className="text-[#8BE000] hover:underline flex items-center gap-1">
                        <span>View</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MY LIVE STREAMS & WEBINARS */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#1E1E1E]">
              <div>
                <h3 className="text-xl font-display font-medium text-white tracking-tight">
                  MY LIVE WEBINARS ({webinarsList.length})
                </h3>
                <p className="text-xs text-neutral-400 font-sans">
                  Schedule live trading masterclasses, broadcast screen share streams, and capture paid user subscriptions.
                </p>
              </div>

              {isCertified ? (
                <Link href="/trader/webinars/new" className="btn-lime px-4 py-2 text-xs font-bold text-black flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-black" />
                  <span>Schedule Pro Session</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 bg-[#111111] border border-[#1E1E1E] px-4 py-2 text-xs text-neutral-500 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Certification Required</span>
                </div>
              )}
            </div>

            {webinarsList.length === 0 ? (
              <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center text-xs text-neutral-500 font-mono space-y-2">
                <div className="text-neutral-300 font-bold">NO STREAMS SCHEDULED YET</div>
                {isCertified ? (
                  <p>Click "Schedule Pro Session" above to launch your first live trading stream.</p>
                ) : (
                  <p>Complete your certification to unlock scheduling masterclasses.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {webinarsList.map((web) => (
                  <div key={web.id} className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-4 hover:border-[#2E2E2E] transition-colors flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] bg-red-950 text-red-400 font-bold px-1.5 py-0.5 border border-red-800">
                          {web.status || "UPCOMING"}
                        </span>
                        <span className="text-xs text-white font-bold">{formatPrice(web.price || 0)}</span>
                      </div>
                      <h4 className="text-lg font-display font-bold text-white leading-snug">{web.title}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-2 font-sans">{web.description}</p>
                      
                      <div className="text-[11px] text-neutral-500 space-y-1 font-mono">
                        <div>Date: {web.date} @ {web.start_time}</div>
                        <div>Attendees Capacity: {web.filled_seats || 0} / {web.max_attendees} Enrolled</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#1E1E1E] flex justify-between items-center mt-4">
                      <span className="text-xs text-neutral-500">{web.duration_minutes} Mins Duration</span>
                      <Link href={`/webinars/${web.id}/pro-live`} className="bg-[#8BE000] text-black font-bold text-xs px-4 py-2 hover:bg-[#9DFF00] transition flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-black" />
                        <span>Go Live as Host</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Hubs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#111111] border border-[#1E1E1E] p-8 space-y-4 hover:border-[#2E2E2E] transition-colors">
              <h3 className="text-xl font-display font-medium text-white tracking-tight">PUBLISH NEW CURRICULUM</h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Create video modules, upload Python backtesting engines, or add options financial models.
              </p>
              {isCertified ? (
                <Link href="/trader/courses/new" className="btn-lime px-6 py-3 text-xs font-bold inline-block text-black">
                  Create New Course
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 bg-[#0A0A0A] border border-[#1E1E1E] px-6 py-3 text-xs text-neutral-500 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Locked — Certification Required</span>
                </div>
              )}
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-8 space-y-4 hover:border-[#2E2E2E] transition-colors">
              <h3 className="text-xl font-display font-medium text-white tracking-tight">FINANCIAL SETTLEMENT</h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                View your automated 80/20 platform payout ledger and student subscriber growth.
              </p>
              <Link href="/trader/earnings" className="bg-[#181818] hover:bg-[#222] border border-[#2E2E2E] text-white px-6 py-3 text-xs font-mono inline-block transition">
                View Revenue Ledger
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
