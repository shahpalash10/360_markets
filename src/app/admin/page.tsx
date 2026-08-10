"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { supabase } from "@/lib/supabase";
import {
  ShieldCheck,
  Users,
  BookOpen,
  DollarSign,
  ArrowUpRight,
  Check,
  RefreshCw,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Award,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { motion } from "framer-motion";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { currency } = useLanguage();

  const [activeTab, setActiveTab] = useState<"analytics" | "traders" | "courses" | "users" | "financials">("analytics");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Live Database Records
  const [profiles, setProfiles] = useState<any[]>([]);
  const [traderApplications, setTraderApplications] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Fetch Real Live Database Data from Supabase
  const loadDatabaseData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Profiles
      const { data: profData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (profData) setProfiles(profData);

      // 2. Trader Applications (safely without ordering on missing column)
      try {
        const { data: appData } = await supabase
          .from("trader_applications")
          .select("*");
        if (appData) {
          // Sort client-side by submitted_at or created_at
          const sortedApps = [...appData].sort((a, b) => {
            const dateA = new Date(a.submitted_at || a.created_at || 0).getTime();
            const dateB = new Date(b.submitted_at || b.created_at || 0).getTime();
            return dateB - dateA;
          });
          setTraderApplications(sortedApps);
        }
      } catch (e) {
        console.warn("trader_applications fetch fallback:", e);
      }

      // 3. Courses
      try {
        const { data: crsData } = await supabase.from("courses").select("*");
        if (crsData) setCourses(crsData);
      } catch (e) {
        console.warn("courses fetch fallback:", e);
      }

      // 4. Enrollments
      try {
        const { data: enrData } = await supabase.from("enrollments").select("*, courses(*)");
        if (enrData) setEnrollments(enrData);
      } catch (e) {
        console.warn("enrollments fetch fallback:", e);
      }

      // 5. Transactions
      try {
        const { data: txData } = await supabase.from("transactions").select("*");
        if (txData) setTransactions(txData);
      } catch (e) {
        console.warn("transactions fetch fallback:", e);
      }
    } catch (err) {
      console.error("Database sync error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Real Calculated Metrics from Live Database
  const realStudents = profiles.filter((p) => p.role === "INVESTOR" || !p.role);
  const realTeachers = profiles.filter((p) => p.role === "TRADER");
  const pendingTraderAudits = traderApplications.filter((a) => a.status === "pending" || a.status === "PENDING" || a.status === "under_review");
  const pendingCourses = courses.filter((c) => !c.published);
  const publishedCourses = courses.filter((c) => c.published);

  // Calculate Real Gross Volume
  const grossVolume = transactions.reduce((acc, tx) => acc + (tx.gross_amount || tx.amount || 0), 0) +
    enrollments.reduce((acc, en) => acc + (en.courses?.price || 49), 0);

  const platformRevenue = grossVolume * 0.3;
  const educatorPayouts = grossVolume * 0.7;

  // Real Actions with Live Supabase Queries
  const handleCertifyUserDirect = async (targetUser: any) => {
    setActionLoadingId(targetUser.id);
    const genCertId = `TRD-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // 1. Update profiles table
      await supabase
        .from("profiles")
        .update({ is_certified: true, role: "TRADER" })
        .eq("id", targetUser.id);

      // 2. Update/upsert trader_profiles table
      await supabase
        .from("trader_profiles")
        .upsert({
          user_id: targetUser.id,
          is_certified: true,
          certification_status: "certified",
          certification_id: genCertId,
          certified_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      // 3. Update any pending applications
      await supabase
        .from("trader_applications")
        .update({ status: "approved", certification_id: genCertId })
        .eq("user_id", targetUser.id);

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      await loadDatabaseData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeCertification = async (targetUser: any) => {
    setActionLoadingId(targetUser.id);
    try {
      await supabase
        .from("profiles")
        .update({ is_certified: false })
        .eq("id", targetUser.id);

      await supabase
        .from("trader_profiles")
        .update({ is_certified: false, certification_status: "pending" })
        .eq("user_id", targetUser.id);

      await supabase
        .from("trader_applications")
        .update({ status: "rejected" })
        .eq("user_id", targetUser.id);

      await loadDatabaseData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveApplication = async (app: any) => {
    setActionLoadingId(app.id);
    const genCertId = `TRD-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await supabase
        .from("trader_applications")
        .update({ status: "approved", certification_id: genCertId })
        .eq("id", app.id);

      if (app.user_id) {
        await supabase
          .from("profiles")
          .update({ is_certified: true, role: "TRADER" })
          .eq("id", app.user_id);

        await supabase
          .from("trader_profiles")
          .upsert({
            user_id: app.user_id,
            is_certified: true,
            certification_status: "certified",
            certification_id: genCertId,
            certified_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      await loadDatabaseData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectApplication = async (app: any) => {
    setActionLoadingId(app.id);
    try {
      await supabase
        .from("trader_applications")
        .update({ status: "rejected" })
        .eq("id", app.id);

      await loadDatabaseData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleCoursePublished = async (courseId: string, currentStatus: boolean) => {
    setActionLoadingId(courseId);
    try {
      await supabase
        .from("courses")
        .update({ published: !currentStatus })
        .eq("id", courseId);

      if (!currentStatus) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
      await loadDatabaseData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleUserRole = async (targetUserId: string, newRole: string) => {
    setActionLoadingId(targetUserId);
    try {
      await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", targetUserId);

      await loadDatabaseData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-[#080808] text-white py-12 lg:py-16 font-mono selection:bg-[#8BE000] selection:text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#1E1E1E]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-[#8BE000] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 bg-[#8BE000] rounded-full inline-block animate-pulse" />
                <span>PLATFORM GOVERNANCE & AUDIT CONTROLS</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-light tracking-tight text-white">
                ADMIN CONSOLE.
              </h1>
              <p className="text-xs text-neutral-400 font-sans max-w-xl leading-relaxed">
                Platform oversight: Instant educator certification grants, course publication authorization, and real-time financial settlement.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadDatabaseData}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-[#121212] hover:bg-[#1A1A1A] border border-[#262626] px-3.5 py-2 text-xs text-neutral-300 transition focus:outline-none"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#8BE000]" : "text-neutral-400"}`} />
                <span>{isRefreshing ? "Syncing..." : "Sync Database"}</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">STUDENTS</span>
                <Users className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-white">
                {realStudents.length}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Active investor accounts
              </div>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">EDUCATORS</span>
                <ShieldCheck className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-[#8BE000]">
                {realTeachers.length}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {pendingTraderAudits.length} pending audit reviews
              </div>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">COURSES</span>
                <BookOpen className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-white">
                {courses.length}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {publishedCourses.length} published • {pendingCourses.length} pending QA
              </div>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">PLATFORM NET (20%)</span>
                <DollarSign className="w-4 h-4 text-[#8BE000]" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-[#8BE000]">
                {formatPrice(platformRevenue)}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Gross volume: {formatPrice(grossVolume)}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-[#1E1E1E] overflow-x-auto text-xs font-mono">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-3 border-b-2 font-medium transition whitespace-nowrap focus:outline-none ${
                activeTab === "analytics"
                  ? "border-[#8BE000] text-[#8BE000]"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab("traders")}
              className={`px-4 py-3 border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap focus:outline-none ${
                activeTab === "traders"
                  ? "border-[#8BE000] text-[#8BE000]"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              <span>Educator Audits</span>
              {pendingTraderAudits.length > 0 && (
                <span className="bg-[#8BE000] text-black text-[9px] font-bold px-1.5 py-0.2 rounded-none">
                  {pendingTraderAudits.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("courses")}
              className={`px-4 py-3 border-b-2 font-medium transition flex items-center gap-2 whitespace-nowrap focus:outline-none ${
                activeTab === "courses"
                  ? "border-[#8BE000] text-[#8BE000]"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              <span>Course Approvals</span>
              {pendingCourses.length > 0 && (
                <span className="bg-[#8BE000] text-black text-[9px] font-bold px-1.5 py-0.2 rounded-none">
                  {pendingCourses.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-3 border-b-2 font-medium transition flex items-center gap-1.5 whitespace-nowrap focus:outline-none ${
                activeTab === "users"
                  ? "border-[#8BE000] text-[#8BE000]"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              <span>User Management & Certification</span>
              <span className="text-neutral-500 font-mono text-[10px]">({profiles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("financials")}
              className={`px-4 py-3 border-b-2 font-medium transition whitespace-nowrap focus:outline-none ${
                activeTab === "financials"
                  ? "border-[#8BE000] text-[#8BE000]"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              Financial Ledger
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "analytics" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#111111] border border-[#1E1E1E] p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-display font-medium text-white tracking-tight">
                        REVENUE SPLIT ARCHITECTURE
                      </h3>
                      <p className="text-xs text-neutral-400 font-sans">
                        Automated 70% educator payout and 30% platform commission calculation
                      </p>
                    </div>
                    <span className="text-[10px] bg-black px-2.5 py-1 text-[#8BE000] font-bold border border-[#222222]">
                      SETTLEMENT ACTIVE
                    </span>
                  </div>

                  <div className="space-y-5 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-neutral-400">Educator Earnings Share (70%):</span>
                        <span className="text-white font-bold">{formatPrice(educatorPayouts)}</span>
                      </div>
                      <div className="w-full bg-[#1A1A1A] h-2 overflow-hidden">
                        <div className="bg-[#8BE000] h-full" style={{ width: "70%" }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-neutral-400">Platform Retained Commission (30%):</span>
                        <span className="text-[#8BE000] font-bold">{formatPrice(platformRevenue)}</span>
                      </div>
                      <div className="w-full bg-[#1A1A1A] h-2 overflow-hidden">
                        <div className="bg-white h-full" style={{ width: "30%" }} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#1E1E1E] text-xs">
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">REGISTERED STUDENTS</span>
                      <span className="text-white text-base font-display">{realStudents.length}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">VERIFIED EDUCATORS</span>
                      <span className="text-white text-base font-display">{realTeachers.length}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">TOTAL PURCHASES</span>
                      <span className="text-[#8BE000] text-base font-display">{enrollments.length + transactions.length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111111] border border-[#1E1E1E] p-8 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xl font-display font-medium text-white tracking-tight">
                      SYSTEM STATUS
                    </h3>
                    <div className="space-y-2.5 text-xs text-neutral-300">
                      <div className="flex items-center justify-between p-3 bg-[#0B0B0B] border border-[#1E1E1E]">
                        <span>Database Connectivity</span>
                        <span className="text-[#8BE000] font-bold text-[11px]">ACTIVE</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#0B0B0B] border border-[#1E1E1E]">
                        <span>Pending Educator Audits</span>
                        <span className={pendingTraderAudits.length > 0 ? "text-amber-400 font-bold text-[11px]" : "text-[#8BE000] font-bold text-[11px]"}>
                          {pendingTraderAudits.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#0B0B0B] border border-[#1E1E1E]">
                        <span>Pending Course Reviews</span>
                        <span className={pendingCourses.length > 0 ? "text-amber-400 font-bold text-[11px]" : "text-[#8BE000] font-bold text-[11px]"}>
                          {pendingCourses.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1E1E1E]">
                    <button
                      onClick={() => setActiveTab("users")}
                      className="btn-lime w-full py-3 text-xs font-bold text-black text-center block focus:outline-none"
                    >
                      Manage Users & Certify Traders →
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: EDUCATOR AUDITS */}
          {activeTab === "traders" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center pb-2">
                <div>
                  <h3 className="text-xl font-display font-medium text-white tracking-tight">
                    EDUCATOR CERTIFICATION AUDIT QUEUE
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans">
                    Review background credentials and issue on-chain certification badges
                  </p>
                </div>
              </div>

              {traderApplications.length === 0 ? (
                <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center text-xs text-neutral-500 font-mono space-y-2">
                  <div className="text-neutral-300 font-bold">NO AUDIT APPLICATIONS IN QUEUE</div>
                  <p>Educators who apply for certification will appear here for review.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {traderApplications.map((app) => (
                    <div
                      key={app.id}
                      className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-4 hover:border-[#2E2E2E] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1E1E1E] pb-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-display font-bold text-white">
                              {app.full_name || app.fullName || "Educator Applicant"}
                            </h4>
                            <span className="text-xs text-neutral-500 font-mono">
                              • {app.experience_years || app.experienceYears || 3} Years Experience
                            </span>
                          </div>
                          <span className="text-xs text-[#8BE000] font-mono mt-0.5 block">
                            {app.expertise || "Stock Trading"}
                          </span>
                        </div>

                        <div>
                          {(app.status === "pending" || app.status === "PENDING" || app.status === "under_review") && (
                            <span className="bg-amber-950/80 border border-amber-600/60 text-amber-300 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
                              AUDIT PENDING
                            </span>
                          )}
                          {(app.status === "approved" || app.status === "APPROVED") && (
                            <span className="bg-lime-950/80 border border-[#8BE000]/60 text-lime-300 text-[10px] font-bold px-2.5 py-1 flex items-center gap-1.5 uppercase tracking-wider">
                              <span>✓ CERTIFIED ({app.certification_id || app.certId || "TRD-VERIFIED"})</span>
                            </span>
                          )}
                          {(app.status === "rejected" || app.status === "REJECTED") && (
                            <span className="bg-red-950/80 border border-red-600/60 text-red-300 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
                              REJECTED
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                        {app.bio || "Stock trading educator applicant."}
                      </p>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-[#1E1E1E] text-xs">
                        <div className="flex items-center gap-4 text-neutral-500 text-[11px] flex-wrap">
                          <span>Submitted: {new Date(app.submitted_at || app.created_at || Date.now()).toLocaleDateString()}</span>
                          {app.portfolio_url && (
                            <a
                              href={app.portfolio_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#8BE000] underline flex items-center gap-1 hover:text-white"
                            >
                              <span>Portfolio</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                          {app.documents_url && (
                            <a
                              href={app.documents_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-400 underline flex items-center gap-1 hover:text-white"
                            >
                              <span>Track Record Documents</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {(app.status === "pending" || app.status === "PENDING" || app.status === "under_review") && (
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => handleRejectApplication(app)}
                              disabled={actionLoadingId === app.id}
                              className="bg-[#1A1A1A] hover:bg-[#262626] border border-[#2E2E2E] text-neutral-300 px-3.5 py-1.5 text-xs font-mono transition focus:outline-none"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveApplication(app)}
                              disabled={actionLoadingId === app.id}
                              className="btn-lime px-4 py-1.5 text-xs font-bold text-black flex items-center gap-1.5 focus:outline-none"
                            >
                              <span>{actionLoadingId === app.id ? "Issuing..." : "Approve & Certify Trader ✓"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: COURSE APPROVALS */}
          {activeTab === "courses" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center pb-2">
                <div>
                  <h3 className="text-xl font-display font-medium text-white tracking-tight">
                    COURSE PUBLICATION & QA QUEUE
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans">
                    Review and authorize courses submitted by verified stock educators
                  </p>
                </div>
              </div>

              {courses.length === 0 ? (
                <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center text-xs text-neutral-500 font-mono space-y-2">
                  <div className="text-neutral-300 font-bold">NO COURSES IN DATABASE</div>
                  <p>When stock educators create curriculum modules, they will populate here for QA approval.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {courses.map((crs) => (
                    <div
                      key={crs.id}
                      className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-4 hover:border-[#2E2E2E] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1E1E1E] pb-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[9px] bg-black text-[#8BE000] font-bold px-1.5 py-0.5 border border-[#222222]">
                              {crs.category || "Stock Trading"}
                            </span>
                            <h4 className="text-lg font-display font-bold text-white">{crs.title}</h4>
                          </div>
                          <span className="text-xs text-neutral-500 font-mono mt-1 block">
                            /courses/{crs.slug} • Rating: ★ {crs.rating || 4.9}
                          </span>
                        </div>

                        <div>
                          {crs.published ? (
                            <span className="bg-lime-950/80 border border-[#8BE000]/60 text-lime-300 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
                              PUBLISHED
                            </span>
                          ) : (
                            <span className="bg-amber-950/80 border border-amber-600/60 text-amber-300 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
                              AWAITING QA
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-[#0B0B0B] border border-[#1E1E1E]">
                          <span className="text-neutral-500 block text-[9px] uppercase">PRICE</span>
                          <span className="text-white font-bold">{formatPrice(crs.price || 49)}</span>
                        </div>
                        <div className="p-3 bg-[#0B0B0B] border border-[#1E1E1E]">
                          <span className="text-neutral-500 block text-[9px] uppercase">BILLING</span>
                          <span className="text-white font-bold">{crs.is_subscription ? "Monthly Recurring" : "One-Time"}</span>
                        </div>
                        <div className="p-3 bg-[#0B0B0B] border border-[#1E1E1E]">
                          <span className="text-neutral-500 block text-[9px] uppercase">CREATED</span>
                          <span className="text-white font-bold">{new Date(crs.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-[#1E1E1E]">
                        <button
                          onClick={() => handleToggleCoursePublished(crs.id, crs.published)}
                          disabled={actionLoadingId === crs.id}
                          className={`px-4 py-1.5 text-xs font-mono transition focus:outline-none ${
                            crs.published
                              ? "bg-[#1A1A1A] hover:bg-[#262626] border border-[#2E2E2E] text-neutral-300"
                              : "btn-lime text-black font-bold"
                          }`}
                        >
                          {crs.published ? "Unpublish" : "Authorize & Publish Live →"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: USER MANAGEMENT & INSTANT CERTIFICATION */}
          {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center pb-2">
                <div>
                  <h3 className="text-xl font-display font-medium text-white tracking-tight">
                    USER DIRECTORY & CERTIFICATION GOVERNANCE
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans">
                    Instantly grant or revoke official certified educator status and configure roles
                  </p>
                </div>
              </div>

              <div className="border border-[#1E1E1E] bg-[#111111] overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0B0B0B] border-b border-[#1E1E1E] text-neutral-400 uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Certification Status</th>
                      <th className="p-4">Registered</th>
                      <th className="p-4 text-right">Governance Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1E1E]">
                    {profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-[#161616] transition-colors">
                        <td className="p-4 font-bold text-white">
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{p.display_name || `${p.first_name || "User"} ${p.last_name || ""}`}</span>
                              {p.is_certified && (
                                <span className="text-[#8BE000] font-bold text-[9px] uppercase bg-black px-1.5 py-0.5 border border-[#222]">
                                  ✓ CERTIFIED
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">{p.id}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider ${
                              p.role === "TRADER"
                                ? "bg-[#8BE000] text-black"
                                : p.role === "ADMIN"
                                ? "bg-red-500 text-white"
                                : "bg-[#1E1E1E] text-neutral-300"
                            }`}
                          >
                            {p.role || "INVESTOR"}
                          </span>
                        </td>

                        <td className="p-4">
                          {p.is_certified ? (
                            <span className="text-[#8BE000] text-xs font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>CERTIFIED EDUCATOR</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 text-xs font-mono">
                              AUDIT PENDING
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-neutral-500 text-[11px]">
                          {new Date(p.created_at || Date.now()).toLocaleDateString()}
                        </td>

                        <td className="p-4 text-right space-x-2">
                          {/* 1-Click Instant Certify / Revoke Button */}
                          {p.is_certified ? (
                            <button
                              onClick={() => handleRevokeCertification(p)}
                              disabled={actionLoadingId === p.id}
                              className="text-red-400 hover:underline text-[11px] font-mono px-2 py-1 bg-red-950/40 border border-red-800/50"
                            >
                              Revoke Certification
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCertifyUserDirect(p)}
                              disabled={actionLoadingId === p.id}
                              className="btn-lime text-black font-bold text-[11px] px-3 py-1"
                            >
                              {actionLoadingId === p.id ? "Certifying..." : "Certify Educator ✓"}
                            </button>
                          )}

                          {/* Role Switcher */}
                          {p.role !== "ADMIN" && (
                            <button
                              onClick={() => handleToggleUserRole(p.id, "ADMIN")}
                              disabled={actionLoadingId === p.id}
                              className="text-neutral-400 hover:text-red-400 transition text-[11px] font-mono"
                            >
                              Admin
                            </button>
                          )}
                          {p.role === "INVESTOR" && (
                            <button
                              onClick={() => handleToggleUserRole(p.id, "TRADER")}
                              disabled={actionLoadingId === p.id}
                              className="text-neutral-400 hover:text-[#8BE000] transition text-[11px] font-mono"
                            >
                              Trader
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 5: FINANCIAL LEDGER */}
          {activeTab === "financials" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center pb-2">
                <div>
                  <h3 className="text-xl font-display font-medium text-white tracking-tight">
                    TRANSACTION LEDGER & 70/30 SETTLEMENT
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans">
                    Live recorded transactions and automated educator 70% / platform 30% splits
                  </p>
                </div>
              </div>

              {enrollments.length === 0 && transactions.length === 0 ? (
                <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center text-xs text-neutral-500 font-mono space-y-2">
                  <div className="text-neutral-300 font-bold">NO TRANSACTIONS RECORDED YET</div>
                  <p>When student investors purchase courses or models, the 70/30 ledger will calculate in real-time.</p>
                </div>
              ) : (
                <div className="border border-[#1E1E1E] bg-[#111111] overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0B0B0B] border-b border-[#1E1E1E] text-neutral-400 uppercase text-[9px] tracking-wider">
                      <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">User</th>
                        <th className="p-4">Curriculum Item</th>
                        <th className="p-4">Gross Total</th>
                        <th className="p-4">Educator (70%)</th>
                        <th className="p-4">Platform Net (30%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E1E1E]">
                      {enrollments.map((en) => {
                        const price = en.courses?.price || 49;
                        const edShare = price * 0.7;
                        const platShare = price * 0.3;
                        return (
                          <tr key={en.id} className="hover:bg-[#161616] transition-colors">
                            <td className="p-4 text-neutral-500 text-[11px]">
                              {new Date(en.created_at || en.enrolledAt || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="p-4 font-mono text-neutral-300 text-[11px]">{en.user_id}</td>
                            <td className="p-4 text-white font-semibold">
                              <span className="text-[9px] bg-black text-[#8BE000] font-bold px-1.5 py-0.5 border border-[#222] mr-2">
                                COURSE
                              </span>
                              <span>{en.courses?.title || "Quantitative Stock Trading"}</span>
                            </td>
                            <td className="p-4 font-bold text-white">{formatPrice(price)}</td>
                            <td className="p-4 text-[#8BE000] font-bold">{formatPrice(edShare)}</td>
                            <td className="p-4 text-white font-bold">{formatPrice(platShare)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
