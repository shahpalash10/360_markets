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
  KeyRound,
  Copy,
  Check,
  Edit3,
  Share2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function TraderDashboardPage() {
  const { user } = useAuth();
  const { t, currency } = useLanguage();

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

  // Trader Invitation Codes State
  const [traderCodes, setTraderCodes] = useState<any[]>([]);
  const [traderCodeString, setTraderCodeString] = useState("");
  const [traderCodeScope, setTraderCodeScope] = useState<"COURSE" | "TRADER_BUNDLE" | "SIGNALS">("COURSE");
  const [traderCodeTargetCourseId, setTraderCodeTargetCourseId] = useState("");
  const [traderCodeDuration, setTraderCodeDuration] = useState<number>(30);
  const [traderCodeMaxUses, setTraderCodeMaxUses] = useState<number>(50);
  const [traderCodeNotes, setTraderCodeNotes] = useState("");
  const [isIssuingCode, setIsIssuingCode] = useState(false);
  const [issueMsg, setIssueMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Edit Trader Code State
  const [editingTraderCode, setEditingTraderCode] = useState<any | null>(null);
  const [editString, setEditString] = useState("");
  const [editScope, setEditScope] = useState<"COURSE" | "TRADER_BUNDLE" | "SIGNALS">("COURSE");
  const [editCourseId, setEditCourseId] = useState("");
  const [editDuration, setEditDuration] = useState(30);
  const [editMaxUses, setEditMaxUses] = useState(50);
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "REVOKED">("ACTIVE");
  const [editNotes, setEditNotes] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState("");

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

      // 4. Fetch courses & webinars strictly for this educator
      const traderProfileId = tpData?.id;
      let userCourses: any[] = [];
      let cCount = 0;

      if (traderProfileId) {
        const { data: coursesByProfile, count: cCountProfile } = await supabase
          .from("courses")
          .select("*", { count: "exact" })
          .eq("trader_id", traderProfileId);
        if (coursesByProfile && coursesByProfile.length > 0) {
          userCourses = coursesByProfile;
          cCount = cCountProfile || coursesByProfile.length;
        }
      }

      // Also check if trader_id in courses table was stored directly as user.id (profiles.id)
      if (userCourses.length === 0 && user?.id) {
        const { data: coursesByUserId, count: cCountUser } = await supabase
          .from("courses")
          .select("*", { count: "exact" })
          .eq("trader_id", user.id);
        if (coursesByUserId && coursesByUserId.length > 0) {
          userCourses = coursesByUserId;
          cCount = cCountUser || coursesByUserId.length;
        }
      }

      setTotalCourses(cCount);
      setCoursesList(userCourses);

      // Webinars
      let userWebinars: any[] = [];
      let wCount = 0;
      if (traderProfileId) {
        const { data: webinarsByProfile, count: wCountProfile } = await supabase
          .from("webinars")
          .select("*", { count: "exact" })
          .eq("trader_id", traderProfileId);
        if (webinarsByProfile) {
          userWebinars = webinarsByProfile;
          wCount = wCountProfile || webinarsByProfile.length;
        }
      }
      if (userWebinars.length === 0 && user?.id) {
        const { data: webinarsByUserId, count: wCountUser } = await supabase
          .from("webinars")
          .select("*", { count: "exact" })
          .eq("trader_id", user.id);
        if (webinarsByUserId) {
          userWebinars = webinarsByUserId;
          wCount = wCountUser || webinarsByUserId.length;
        }
      }
      setTotalWebinars(wCount);
      setWebinarsList(userWebinars);

      // 5. Calculate real enrollments & real revenue strictly for this educator's courses
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
    } catch (e) {
      console.error("Trader Hub fetch error:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchTraderCodes = async () => {
    try {
      const url = user?.id
        ? `/api/invitation-codes?creatorId=${encodeURIComponent(user.id)}&creatorRole=TRADER`
        : `/api/invitation-codes?creatorRole=TRADER`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok && data.codes) {
        setTraderCodes(data.codes);
      }
    } catch (e) {
      console.warn("Failed to load trader codes:", e);
    }
  };

  const handleIssueTraderCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traderCodeString.trim()) return;

    setIsIssuingCode(true);
    setIssueMsg(null);

    const selectedCourse = coursesList.find((c) => c.id === traderCodeTargetCourseId) || coursesList[0];

    try {
      const res = await fetch("/api/invitation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: traderCodeString.trim().toUpperCase(),
          scope: traderCodeScope,
          tier: traderCodeScope === "SIGNALS" ? "SIGNALS" : "ALL_ACCESS",
          targetCourseId: traderCodeScope === "COURSE" ? (traderCodeTargetCourseId || coursesList[0]?.id) : undefined,
          targetCourseTitle: traderCodeScope === "COURSE" ? (selectedCourse?.title || coursesList[0]?.title) : undefined,
          targetCourseSlug: traderCodeScope === "COURSE" ? (selectedCourse?.slug || coursesList[0]?.slug) : undefined,
          durationDays: traderCodeDuration,
          maxUses: traderCodeMaxUses,
          notes: traderCodeNotes,
          creatorRole: "TRADER",
          creatorId: user?.id || "trader",
          creatorName: user?.displayName || user?.name || "Verified Educator",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create code");
      }

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setIssueMsg({ success: true, text: `Code "${data.code.code}" successfully created!` });
      setTraderCodeString("");
      setTraderCodeNotes("");
      await fetchTraderCodes();
    } catch (err: any) {
      setIssueMsg({ success: false, text: err.message || "Failed to issue code." });
    } finally {
      setIsIssuingCode(false);
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyShareLink = (id: string, code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const link = `${origin}/redeem?code=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleToggleTraderCode = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "REVOKED" : "ACTIVE";
    try {
      await fetch("/api/invitation-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      await fetchTraderCodes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTraderCode = async (id: string) => {
    try {
      await fetch(`/api/invitation-codes?id=${id}`, { method: "DELETE" });
      await fetchTraderCodes();
    } catch (e) {
      console.error(e);
    }
  };

  const openTraderEdit = (code: any) => {
    setEditingTraderCode(code);
    setEditString(code.code);
    setEditScope(code.scope || "COURSE");
    setEditCourseId(code.targetCourseId || coursesList[0]?.id || "");
    setEditDuration(code.durationDays || 30);
    setEditMaxUses(code.maxUses || 50);
    setEditStatus(code.status || "ACTIVE");
    setEditNotes(code.notes || "");
    setEditErrorMsg("");
  };

  const handleSaveTraderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTraderCode) return;
    setIsSavingEdit(true);
    setEditErrorMsg("");

    const selectedCourse = coursesList.find((c) => c.id === editCourseId);

    try {
      const res = await fetch("/api/invitation-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTraderCode.id,
          code: editString.trim().toUpperCase(),
          scope: editScope,
          targetCourseId: editScope === "COURSE" ? editCourseId : null,
          targetCourseTitle: editScope === "COURSE" ? (selectedCourse?.title || editingTraderCode.targetCourseTitle) : null,
          targetCourseSlug: editScope === "COURSE" ? (selectedCourse?.slug || editingTraderCode.targetCourseSlug) : null,
          durationDays: editDuration,
          maxUses: editMaxUses,
          status: editStatus,
          notes: editNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update code");
      }

      setEditingTraderCode(null);
      await fetchTraderCodes();
    } catch (err: any) {
      setEditErrorMsg(err.message || "Failed to update code.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  useEffect(() => {
    fetchTraderData();
    fetchTraderCodes();
  }, [user]);

  useEffect(() => {
    if (coursesList.length > 0 && !traderCodeTargetCourseId) {
      setTraderCodeTargetCourseId(coursesList[0].id);
    }
  }, [coursesList, traderCodeTargetCourseId]);

  const educatorShare = grossRevenue * 0.7;

  return (
    <AuthGuard allowedRoles={["TRADER"]}>
      <div className="min-h-screen bg-[#080808] text-white py-12 lg:py-16 font-mono selection:bg-[#8BE000] selection:text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#1E1E1E]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-[#8BE000] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 bg-[#8BE000] rounded-full inline-block animate-pulse" />
                <span>{t.traderHubPortalBadge}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-light tracking-tight text-white uppercase">
                {t.traderHubTitle}
              </h1>
              <p className="text-xs text-neutral-400 font-sans max-w-xl leading-relaxed">
                {t.traderHubSub}
              </p>
            </div>

            <button
              onClick={fetchTraderData}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-[#121212] hover:bg-[#1A1A1A] border border-[#262626] px-3.5 py-2 text-xs text-neutral-300 transition focus:outline-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#8BE000]" : "text-neutral-400"}`} />
              <span>{isRefreshing ? t.traderHubSyncing : t.traderHubSyncBtn}</span>
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
                    {t.traderHubCertApproved} {certId ? `\u2022 ${certId}` : ""}
                  </span>
                  <p className="text-xs text-neutral-400 font-sans">
                    {t.traderHubCertApprovedDesc}
                  </p>
                </div>
              </div>
              <Link
                href="/trader/certification"
                className="bg-[#121212] hover:bg-[#1C1C1C] border border-[#2E2E2E] text-white px-4 py-2 font-mono text-xs shrink-0 transition"
              >
                {t.traderHubViewCert}
              </Link>
            </div>
          ) : certificationStatus === "pending" ? (
            <div className="border border-amber-600/40 bg-[#141005] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {t.traderHubCertPending}
                  </span>
                  <p className="text-xs text-neutral-300 font-sans">
                    {t.traderHubCertPendingDesc}
                  </p>
                </div>
              </div>
              <Link
                href="/trader/certification"
                className="bg-[#1A1A1A] hover:bg-[#262626] text-white px-4 py-2 font-mono text-xs shrink-0 transition"
              >
                {t.traderHubViewAppStatus}
              </Link>
            </div>
          ) : certificationStatus === "rejected" ? (
            <div className="border border-red-600/40 bg-[#160606] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs text-red-400 font-bold uppercase tracking-wider">
                  {t.traderHubCertRejected}
                </span>
                <p className="text-xs text-neutral-300 font-sans">
                  {t.traderHubCertRejectedDesc}
                </p>
              </div>
              <Link href="/trader/certification" className="bg-red-950 border border-red-700 text-white px-4 py-2 text-xs font-bold">
                {t.traderHubResubmitDossier}
              </Link>
            </div>
          ) : (
            /* certificationStatus === "none" — never submitted */
            <div className="border border-[#1E1E1E] bg-[#111111] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    {t.traderHubCertRequired}
                  </span>
                  <p className="text-xs text-neutral-400 font-sans">
                    {t.traderHubCertRequiredDesc}
                  </p>
                </div>
              </div>
              <Link
                href="/trader/certification"
                className="btn-lime text-black px-5 py-2.5 font-bold text-xs shrink-0"
              >
                {t.traderHubSubmitDossier}
              </Link>
            </div>
          )}

          {/* Technical Signals Studio Banner */}
          <div className="bg-[#141414] border border-[#262626] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#8BE000] animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {t.traderHubSignalsBannerTitle}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans max-w-xl">
                {t.traderHubSignalsBannerDesc}
              </p>
            </div>
            <Link
              href="/trader/signals"
              className="btn-lime text-xs px-5 py-2.5 font-bold text-black flex items-center gap-1.5 shrink-0"
            >
              <span>{t.traderHubOpenSignalStudio}</span>
              <ArrowUpRight className="w-4 h-4 text-black" />
            </Link>
          </div>

          {/* Revenue & Growth Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">{t.traderHubNetPayout}</span>
                <DollarSign className="w-4 h-4 text-[#8BE000]" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-[#8BE000]">
                {formatPrice(educatorShare)}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {t.traderHubGross}: {formatPrice(grossRevenue)}
              </div>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">{t.traderHubPaidEnrollments}</span>
                <Users className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-white">
                {totalSubscribers}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {t.traderHubActiveStudents}
              </div>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">{t.traderHubMyCourses}</span>
                <BookOpen className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-white">
                {totalCourses}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {t.traderHubPublishedCurriculum}
              </div>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 transition-colors hover:border-[#2E2E2E]">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="tracking-wider uppercase text-[10px]">{t.traderHubLiveWebinars}</span>
                <Video className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-display font-light tracking-tight text-white">
                {totalWebinars}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {t.traderHubScheduledSessions}
              </div>
            </div>
          </div>

          {/* Published Courses */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#1E1E1E]">
              <div>
                <h3 className="text-xl font-display font-medium text-white tracking-tight">
                  {t.traderHubMyCurriculum} ({coursesList.length})
                </h3>
                <p className="text-xs text-neutral-400 font-sans">
                  {t.traderHubCoursesAuthored}
                </p>
              </div>

              <Link href="/trader/courses/new" className="btn-lime px-4 py-2 text-xs font-bold text-black flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>{t.traderHubCreateNewCourse}</span>
              </Link>
            </div>

            {coursesList.length === 0 ? (
              <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center text-xs text-neutral-500 font-mono space-y-2">
                <div className="text-neutral-300 font-bold">{t.traderHubNoCoursesYet}</div>
                {isCertified ? (
                  <p>{t.traderHubCreateFirstCoursePrompt}</p>
                ) : (
                  <p>{t.traderHubCompleteCertPrompt}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesList.map((crs) => (
                  <div key={crs.id} className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-4 hover:border-[#2E2E2E] transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] bg-black text-[#8BE000] font-bold px-1.5 py-0.5 border border-[#222]">
                        {crs.category || t.commonStockTrading || "Stock Trading"}
                      </span>
                      <span className="text-xs text-white font-bold">{formatPrice(crs.price || 0)}</span>
                    </div>

                    <h4 className="text-lg font-display font-bold text-white leading-snug">{crs.title}</h4>
                    <p className="text-xs text-neutral-400 line-clamp-2 font-sans">{crs.description}</p>

                    <div className="pt-3 border-t border-[#1E1E1E] flex justify-between items-center text-xs text-neutral-500">
                      <span>{crs.published ? (t.commonActive || "Published") : "Pending QA"}</span>
                      <Link href={`/courses/${crs.slug || crs.id}`} className="text-[#8BE000] hover:underline flex items-center gap-1">
                        <span>{t.btnViewCourse?.replace(" →", "") || "View"}</span>
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
                  {t.traderHubMyLiveWebinars} ({webinarsList.length})
                </h3>
                <p className="text-xs text-neutral-400 font-sans">
                  {t.traderHubWebinarsDesc}
                </p>
              </div>

              {isCertified ? (
                <Link href="/trader/webinars/new" className="btn-lime px-4 py-2 text-xs font-bold text-black flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-black" />
                  <span>{t.traderHubScheduleProSession}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 bg-[#111111] border border-[#1E1E1E] px-4 py-2 text-xs text-neutral-500 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t.traderHubCertRequiredToSchedule}</span>
                </div>
              )}
            </div>

            {webinarsList.length === 0 ? (
              <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center text-xs text-neutral-500 font-mono space-y-2">
                <div className="text-neutral-300 font-bold">{t.traderHubNoWebinarsYet}</div>
                {isCertified ? (
                  <p>{t.traderHubScheduleFirstWebinarPrompt}</p>
                ) : (
                  <p>{t.traderHubCompleteCertToSchedulePrompt}</p>
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
                        <span>{t.traderHubGoLiveBtn}</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SUBSCRIBER INVITATION CODES & ACCESS ISSUANCE */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-[#1E1E1E]">
              <div>
                <h3 className="text-xl font-display font-medium text-white tracking-tight flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#8BE000]" />
                  <span>{t.traderHubIssueCodesTitle}</span>
                </h3>
                <p className="text-xs text-neutral-400 font-sans">
                  {t.traderHubIssueCodesDesc}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-[#111] px-3 py-1.5 border border-[#1E1E1E]">
                <span className="w-2 h-2 rounded-full bg-[#8BE000] animate-pulse" />
                <span>{traderCodes.length} {t.traderHubSubscriberCodesCount}</span>
              </div>
            </div>

            {/* Code Generator Form */}
            <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#8BE000]" />
                  <span>{t.traderHubIssueNewCode}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const rand = Math.floor(100 + Math.random() * 900);
                    const prefix = user?.firstName?.toUpperCase() || "TRD";
                    setTraderCodeString(`${prefix}-VIP-${rand}`);
                  }}
                  className="text-[11px] text-[#8BE000] hover:underline font-mono"
                >
                  {t.traderHubRandomizeCode}
                </button>
              </div>

              {issueMsg && (
                <div
                  className={`p-3 text-xs font-mono flex items-center gap-2 border ${
                    issueMsg.success
                      ? "bg-[#8BE000]/10 border-[#8BE000] text-[#8BE000]"
                      : "bg-red-950/40 border-red-800 text-red-400"
                  }`}
                >
                  {issueMsg.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{issueMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleIssueTraderCode} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                {/* Code String */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    {t.traderHubCodeStringLabel}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ALEX-VIP"
                    value={traderCodeString}
                    onChange={(e) => setTraderCodeString(e.target.value.toUpperCase())}
                    className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-white uppercase tracking-wider outline-none"
                  />
                </div>

                {/* Target Content / Scope */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    {t.traderHubCodeScopeLabel}
                  </label>
                  <select
                    value={traderCodeScope}
                    onChange={(e) => setTraderCodeScope(e.target.value as any)}
                    className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-white outline-none"
                  >
                    <option value="COURSE">{t.traderHubScopeCourse}</option>
                    <option value="TRADER_BUNDLE">{t.traderHubScopeBundle}</option>
                    <option value="SIGNALS">{t.traderHubScopeSignals}</option>
                  </select>
                </div>

                {/* Specific Course Select (if scope === COURSE) */}
                {traderCodeScope === "COURSE" ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                      {t.traderHubTargetCourseLabel}
                    </label>
                    <select
                      value={traderCodeTargetCourseId}
                      onChange={(e) => setTraderCodeTargetCourseId(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-white outline-none"
                    >
                      {coursesList.map((crs) => (
                        <option key={crs.id} value={crs.id}>
                          {crs.title}
                        </option>
                      ))}
                      {coursesList.length === 0 && (
                        <option value="c-1">Quantitative Stock Trading (Default)</option>
                      )}
                    </select>
                  </div>
                ) : (
                  /* Validity / Duration */
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                      {t.traderHubValidityLabel}
                    </label>
                    <select
                      value={traderCodeDuration}
                      onChange={(e) => setTraderCodeDuration(Number(e.target.value))}
                      className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-white outline-none"
                    >
                      <option value={30}>30 Days</option>
                      <option value={60}>60 Days</option>
                      <option value={90}>90 Days</option>
                      <option value={180}>180 Days</option>
                      <option value={365}>365 Days</option>
                      <option value={9999}>Lifetime Unlimited</option>
                    </select>
                  </div>
                )}

                {/* Max Uses */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    {t.traderHubMaxUsesLabel}
                  </label>
                  <select
                    value={traderCodeMaxUses}
                    onChange={(e) => setTraderCodeMaxUses(Number(e.target.value))}
                    className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-white outline-none"
                  >
                    <option value={5}>5 Uses (VIP Inner Circle)</option>
                    <option value={20}>20 Uses (Cohort)</option>
                    <option value={50}>50 Uses (Webinar Cohort)</option>
                    <option value={100}>100 Uses (Community)</option>
                    <option value={500}>500 Uses (Telegram Group)</option>
                    <option value={99999}>Unlimited Uses</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    {t.traderHubNotesLabel}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Free access voucher for Q4 quantitative workshop attendees"
                    value={traderCodeNotes}
                    onChange={(e) => setTraderCodeNotes(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-white outline-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-end md:col-span-2 lg:col-span-1">
                  <button
                    type="submit"
                    disabled={isIssuingCode || !traderCodeString.trim()}
                    className="w-full btn-lime text-black font-bold text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isIssuingCode ? t.traderHubCreatingCode : t.traderHubCreateCodeBtn}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Issued Codes Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white uppercase tracking-wider">{t.traderHubActiveCodesTitle}</span>
                <button
                  onClick={fetchTraderCodes}
                  className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t.traderHubRefreshCodes}</span>
                </button>
              </div>

              {traderCodes.length === 0 ? (
                <div className="border border-[#1E1E1E] bg-[#111111] p-10 text-center text-xs text-neutral-500 font-mono space-y-2">
                  <div className="text-neutral-300 font-bold">{t.traderHubNoCodesYet}</div>
                  <p>{t.traderHubNoCodesPrompt}</p>
                </div>
              ) : (
                <div className="border border-[#1E1E1E] bg-[#111111] overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono min-w-[700px]">
                    <thead className="bg-[#0B0B0B] border-b border-[#1E1E1E] text-neutral-400 uppercase text-[9px] tracking-wider">
                      <tr>
                        <th className="p-4">{t.traderHubColCode}</th>
                        <th className="p-4">{t.traderHubColAccess}</th>
                        <th className="p-4">{t.traderHubColValidity}</th>
                        <th className="p-4">{t.traderHubColRedemptions}</th>
                        <th className="p-4">{t.traderHubColStatus}</th>
                        <th className="p-4 text-right">{t.traderHubColActions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E1E1E]">
                      {traderCodes.map((item) => (
                        <tr key={item.id} className="hover:bg-[#161616] transition-colors">
                          {/* Code & Link */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#8BE000] text-sm tracking-wider bg-black px-2 py-0.5 border border-[#222]">
                                {item.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(item.id, item.code)}
                                className="text-neutral-500 hover:text-white transition p-1"
                                title="Copy code"
                              >
                                {copiedCodeId === item.id ? (
                                  <span className="text-[10px] text-[#8BE000] font-bold">COPIED!</span>
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyShareLink(item.id, item.code)}
                                className="text-neutral-500 hover:text-[#8BE000] transition p-1"
                                title="Copy Share Link (/redeem?code=...)"
                              >
                                {copiedLinkId === item.id ? (
                                  <span className="text-[10px] text-[#8BE000] font-bold">LINK COPIED!</span>
                                ) : (
                                  <Share2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            {item.notes && (
                              <p className="text-[10px] text-neutral-500 mt-1 max-w-xs truncate">
                                {item.notes}
                              </p>
                            )}
                          </td>

                          {/* Access Granted */}
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider inline-block ${
                                  item.scope === "COURSE"
                                    ? "bg-blue-950/60 text-blue-300 border border-blue-800/60"
                                    : item.scope === "TRADER_BUNDLE"
                                    ? "bg-purple-950/60 text-purple-300 border border-purple-800/60"
                                    : "bg-[#8BE000]/15 text-[#8BE000] border border-[#8BE000]/40"
                                }`}
                              >
                                {item.scope === "COURSE" ? t.traderHubScopeCourse : item.scope === "TRADER_BUNDLE" ? t.traderHubScopeBundle : t.traderHubScopeSignals}
                              </span>
                              {item.targetCourseTitle && (
                                <div className="text-[11px] text-neutral-300 max-w-xs truncate font-sans">
                                  {item.targetCourseTitle}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Validity */}
                          <td className="p-4 text-neutral-300 text-xs">
                            {item.durationDays >= 9999 || item.durationDays === 0 ? (
                              <span className="text-[#8BE000] font-bold">Lifetime</span>
                            ) : (
                              `${item.durationDays} Days`
                            )}
                          </td>

                          {/* Redemptions */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="text-[11px] text-neutral-300">
                                <strong className="text-white">{item.usedCount || 0}</strong>
                                <span className="text-neutral-500"> / {item.maxUses >= 99999 ? "∞" : item.maxUses}</span>
                              </div>
                              <div className="w-20 bg-[#222] h-1 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#8BE000] h-full"
                                  style={{
                                    width: `${Math.min(100, ((item.usedCount || 0) / (item.maxUses >= 99999 ? 100 : item.maxUses)) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1 w-max ${
                                item.status === "ACTIVE"
                                  ? "bg-green-950/60 text-green-400 border border-green-800/60"
                                  : "bg-red-950/60 text-red-400 border border-red-800/60"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.status === "ACTIVE" ? "bg-green-400" : "bg-red-400"
                                }`}
                              />
                              <span>{item.status}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => openTraderEdit(item)}
                              className="text-[11px] font-mono px-2 py-1 text-neutral-300 hover:text-white bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] transition inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3 text-[#8BE000]" />
                              <span>{t.traderHubEditBtn}</span>
                            </button>

                            <button
                              onClick={() => handleToggleTraderCode(item.id, item.status)}
                              className={`text-[11px] font-mono px-2 py-1 transition border ${
                                item.status === "ACTIVE"
                                  ? "text-amber-400 hover:text-amber-300 bg-amber-950/30 border-amber-900/40"
                                  : "text-green-400 hover:text-green-300 bg-green-950/30 border-green-900/40"
                              }`}
                            >
                              {item.status === "ACTIVE" ? t.traderHubRevokeBtn : t.traderHubReactivateBtn}
                            </button>

                            <button
                              onClick={() => handleDeleteTraderCode(item.id)}
                              className="text-neutral-500 hover:text-red-400 transition p-1 inline-block"
                              title="Delete code"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* EDIT TRADER CODE MODAL */}
          {editingTraderCode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-[#111111] border border-[#2E2E2E] p-6 text-white font-mono space-y-6 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b border-[#222] pb-3">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#8BE000]" />
                    <h4 className="text-base font-display font-bold">
                      MODIFY CODE: <span className="text-[#8BE000]">{editingTraderCode.code}</span>
                    </h4>
                  </div>
                  <button
                    onClick={() => setEditingTraderCode(null)}
                    className="text-neutral-500 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>

                {editErrorMsg && (
                  <div className="bg-red-950/40 border border-red-800 p-3 text-xs text-red-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{editErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveTraderEdit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase">Code String</label>
                      <input
                        type="text"
                        required
                        value={editString}
                        onChange={(e) => setEditString(e.target.value.toUpperCase())}
                        className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white font-bold uppercase focus:border-[#8BE000] outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase">What it Unlocks</label>
                      <select
                        value={editScope}
                        onChange={(e) => setEditScope(e.target.value as any)}
                        className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white focus:border-[#8BE000] outline-none"
                      >
                        <option value="COURSE">Specific Course</option>
                        <option value="TRADER_BUNDLE">All My Courses + Signals</option>
                        <option value="SIGNALS">Signals Only</option>
                      </select>
                    </div>
                  </div>

                  {editScope === "COURSE" && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase">Target Course</label>
                      <select
                        value={editCourseId}
                        onChange={(e) => setEditCourseId(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white focus:border-[#8BE000] outline-none"
                      >
                        {coursesList.map((crs) => (
                          <option key={crs.id} value={crs.id}>
                            {crs.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase">Duration (Days)</label>
                      <select
                        value={editDuration}
                        onChange={(e) => setEditDuration(Number(e.target.value))}
                        className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white focus:border-[#8BE000] outline-none"
                      >
                        <option value={30}>30 Days</option>
                        <option value={60}>60 Days</option>
                        <option value={90}>90 Days</option>
                        <option value={180}>180 Days</option>
                        <option value={365}>365 Days</option>
                        <option value={9999}>Lifetime Unlimited</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase">Max Redemptions</label>
                      <input
                        type="number"
                        min={1}
                        value={editMaxUses}
                        onChange={(e) => setEditMaxUses(Number(e.target.value))}
                        className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white focus:border-[#8BE000] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white focus:border-[#8BE000] outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="REVOKED">REVOKED</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Notes</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white focus:border-[#8BE000] outline-none"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-[#222]">
                    <button
                      type="button"
                      onClick={() => setEditingTraderCode(null)}
                      className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] text-neutral-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="btn-lime text-black font-bold px-5 py-2 flex items-center gap-1.5"
                    >
                      <span>{isSavingEdit ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Action Hubs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#111111] border border-[#1E1E1E] p-8 space-y-4 hover:border-[#2E2E2E] transition-colors">
              <h3 className="text-xl font-display font-medium text-white tracking-tight uppercase">{t.traderHubActionPublishTitle}</h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                {t.traderHubActionPublishDesc}
              </p>
              <Link href="/trader/courses/new" className="btn-lime px-6 py-3 text-xs font-bold inline-block text-black">
                {t.traderHubCreateNewCourse}
              </Link>
            </div>

            <div className="bg-[#111111] border border-[#1E1E1E] p-8 space-y-4 hover:border-[#2E2E2E] transition-colors">
              <h3 className="text-xl font-display font-medium text-white tracking-tight uppercase">{t.traderHubActionSettlementTitle}</h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                {t.traderHubActionSettlementDesc}
              </p>
              <Link href="/trader/earnings" className="bg-[#181818] hover:bg-[#222] border border-[#2E2E2E] text-white px-6 py-3 text-xs font-mono inline-block transition">
                {t.traderHubViewRevenueLedger}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
