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
  KeyRound,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  Edit3,
  Share2,
  Code2,
  Database,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { motion } from "framer-motion";

export default function AdminDashboardPage() {
  const { user, setRole } = useAuth();
  const { currency } = useLanguage();

  const [activeTab, setActiveTab] = useState<"analytics" | "traders" | "courses" | "users" | "financials" | "invitations">("analytics");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [roleFeedbackMsg, setRoleFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Live Database Records
  const [profiles, setProfiles] = useState<any[]>([]);
  const [traderApplications, setTraderApplications] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Single-Use Invoices & Trader Debt Ledger
  const [singleUseInvoices, setSingleUseInvoices] = useState<any[]>([]);
  const [singleUseCodes, setSingleUseCodes] = useState<any[]>([]);
  const [debtSummary, setDebtSummary] = useState({ totalGmv: 0, totalPlatformDebt: 0, totalRedemptions: 0 });

  // Invitation Codes Ledger State
  const [invitationCodes, setInvitationCodes] = useState<any[]>([]);
  const [newCodeString, setNewCodeString] = useState("");
  const [newCodeScope, setNewCodeScope] = useState<"ALL_ACCESS" | "SIGNALS" | "COURSE">("SIGNALS");
  const [newCodeTargetCourseId, setNewCodeTargetCourseId] = useState("");
  const [newCodeDuration, setNewCodeDuration] = useState<number>(30);
  const [newCodeMaxUses, setNewCodeMaxUses] = useState<number>(100);
  const [newCodeNotes, setNewCodeNotes] = useState("");
  const [isIssuingCode, setIsIssuingCode] = useState(false);
  const [issueSuccessMsg, setIssueSuccessMsg] = useState("");
  const [issueErrorMsg, setIssueErrorMsg] = useState("");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  // Edit Code Modal State
  const [editingCode, setEditingCode] = useState<any | null>(null);
  const [editCodeString, setEditCodeString] = useState("");
  const [editCodeScope, setEditCodeScope] = useState<"ALL_ACCESS" | "SIGNALS" | "COURSE">("SIGNALS");
  const [editCodeTargetCourseId, setEditCodeTargetCourseId] = useState("");
  const [editCodeDuration, setEditCodeDuration] = useState<number>(30);
  const [editCodeMaxUses, setEditCodeMaxUses] = useState<number>(100);
  const [editCodeStatus, setEditCodeStatus] = useState<"ACTIVE" | "REVOKED">("ACTIVE");
  const [editCodeNotes, setEditCodeNotes] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState("");

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Fetch Real Live Database Data (Prisma SQLite + Persistent Store + Supabase)
  const loadDatabaseData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Profiles & Users Directory (combines Prisma SQLite, Persistent Store, and Supabase)
      try {
        const uRes = await fetch("/api/admin/users");
        const uData = await uRes.json();
        if (uData.ok && uData.users && uData.users.length > 0) {
          setProfiles(uData.users);
        } else {
          const { data: profData } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });
          if (profData && profData.length > 0) setProfiles(profData);
        }
      } catch (err) {
        const { data: profData } = await supabase.from("profiles").select("*");
        if (profData && profData.length > 0) setProfiles(profData);
      }

      // 2. Trader Applications (safely without ordering on missing column)
      try {
        const { data: appData } = await supabase
          .from("trader_applications")
          .select("*");
        if (appData && appData.length > 0) {
          // Sort client-side by submitted_at or created_at
          const sortedApps = [...appData].sort((a, b) => {
            const dateA = new Date(a.submitted_at || a.created_at || 0).getTime();
            const dateB = new Date(b.submitted_at || b.created_at || 0).getTime();
            return dateB - dateA;
          });
          setTraderApplications(sortedApps);
        } else {
          // Fallback to Prisma applications via /api/certifications
          const certRes = await fetch("/api/certifications");
          const certData = await certRes.json();
          if (certData.success && certData.applications && certData.applications.length > 0) {
            setTraderApplications(certData.applications.map((a: any) => ({
              id: a.id,
              user_id: a.userId,
              full_name: a.fullName,
              expertise: a.expertise,
              experience_years: a.experienceYears,
              bio: a.bio,
              portfolio_url: a.portfolioUrl,
              documents_url: a.documentsUrl,
              status: a.status.toLowerCase(),
              created_at: a.createdAt,
            })));
          }
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

      // 6. Invitation Codes Ledger
      await fetchInvitationCodes();

      // 7. Single-Use Invoices & Trader Debt
      try {
        const invRes = await fetch("/api/invoices");
        const invData = await invRes.json();
        if (invData.ok) {
          setSingleUseInvoices(invData.invoices || []);
          setDebtSummary({
            totalGmv: invData.totalGmv || 0,
            totalPlatformDebt: invData.totalPlatformDebt || 0,
            totalRedemptions: invData.totalRedemptions || 0,
          });
        }
        const codesRes = await fetch("/api/access-codes");
        const codesData = await codesRes.json();
        if (codesData.ok) {
          setSingleUseCodes(codesData.codes || []);
        }
      } catch (e) {}
    } catch (err) {
      console.error("Database sync error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchInvitationCodes = async () => {
    try {
      const res = await fetch("/api/invitation-codes");
      const data = await res.json();
      if (data.ok && data.codes) {
        setInvitationCodes(data.codes);
      }
    } catch (e) {
      console.error("Failed to load invitation codes:", e);
    }
  };

  const handleIssueCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueSuccessMsg("");
    setIssueErrorMsg("");
    setIsIssuingCode(true);

    const selectedCourse = courses.find((c) => c.id === newCodeTargetCourseId);

    try {
      const res = await fetch("/api/invitation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCodeString,
          scope: newCodeScope,
          tier: newCodeScope === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS",
          targetCourseId: newCodeScope === "COURSE" ? newCodeTargetCourseId : undefined,
          targetCourseTitle: newCodeScope === "COURSE" ? selectedCourse?.title : undefined,
          targetCourseSlug: newCodeScope === "COURSE" ? selectedCourse?.slug : undefined,
          durationDays: newCodeDuration,
          maxUses: newCodeMaxUses,
          notes: newCodeNotes,
          creatorRole: "ADMIN",
          creatorId: user?.id || "admin",
          creatorName: user?.displayName || user?.name || "Platform Administrator",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to issue invitation code");
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setIssueSuccessMsg(`Code "${data.code.code}" issued successfully!`);
      setNewCodeString("");
      setNewCodeNotes("");
      await fetchInvitationCodes();
    } catch (err: any) {
      setIssueErrorMsg(err.message || "Failed to issue code");
    } finally {
      setIsIssuingCode(false);
    }
  };

  const openEditModal = (code: any) => {
    setEditingCode(code);
    setEditCodeString(code.code);
    setEditCodeScope(code.scope || (code.tier === "ALL_ACCESS" ? "ALL_ACCESS" : "SIGNALS"));
    setEditCodeTargetCourseId(code.targetCourseId || (courses[0]?.id || ""));
    setEditCodeDuration(code.durationDays || 30);
    setEditCodeMaxUses(code.maxUses || 100);
    setEditCodeStatus(code.status || "ACTIVE");
    setEditCodeNotes(code.notes || "");
    setEditErrorMsg("");
  };

  const handleSaveCodeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode) return;
    setIsSavingEdit(true);
    setEditErrorMsg("");

    const selectedCourse = courses.find((c) => c.id === editCodeTargetCourseId);

    try {
      const res = await fetch("/api/invitation-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCode.id,
          code: editCodeString,
          scope: editCodeScope,
          targetCourseId: editCodeScope === "COURSE" ? editCodeTargetCourseId : null,
          targetCourseTitle: editCodeScope === "COURSE" ? (selectedCourse?.title || editingCode.targetCourseTitle) : null,
          targetCourseSlug: editCodeScope === "COURSE" ? (selectedCourse?.slug || editingCode.targetCourseSlug) : null,
          durationDays: editCodeDuration,
          maxUses: editCodeMaxUses,
          status: editCodeStatus,
          notes: editCodeNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update code");
      }

      setEditingCode(null);
      await fetchInvitationCodes();
    } catch (err: any) {
      setEditErrorMsg(err.message || "Failed to update invitation code.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleCodeStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "REVOKED" : "ACTIVE";
    try {
      await fetch("/api/invitation-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      await fetchInvitationCodes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCode = async (id: string) => {
    try {
      await fetch(`/api/invitation-codes?id=${id}`, { method: "DELETE" });
      await fetchInvitationCodes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCode = (id: string, codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyShareLink = (id: string, codeStr: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const link = `${origin}/redeem?code=${codeStr}`;
    navigator.clipboard.writeText(link);
    setCopiedShareId(id);
    setTimeout(() => setCopiedShareId(null), 2000);
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

  // Real Actions with Multi-Layer Database Sync (Prisma SQLite + JSON Store + Supabase)
  const handleCertifyUserDirect = async (targetUser: any) => {
    setActionLoadingId(targetUser.id);
    const genCertId = `TRD-${Math.floor(100000 + Math.random() * 900000)}`;
    setRoleFeedbackMsg(null);

    // Optimistic UI update
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === targetUser.id
          ? { ...p, is_certified: true, certification_id: genCertId, role: "TRADER" }
          : p
      )
    );

    try {
      // 1. Persistent server-side update across Prisma SQLite, JSON store, and Supabase
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CERTIFY",
          userId: targetUser.id,
          certId: genCertId,
          email: targetUser.email,
        }),
      });

      // 2. Direct client Supabase update attempt (if session permits)
      try {
        await supabase
          .from("profiles")
          .update({ is_certified: true, role: "TRADER", certification_id: genCertId })
          .eq("id", targetUser.id);

        await supabase
          .from("trader_profiles")
          .upsert({
            user_id: targetUser.id,
            is_certified: true,
            certification_status: "certified",
            certification_id: genCertId,
            certified_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        await supabase
          .from("trader_applications")
          .update({ status: "approved", certification_id: genCertId })
          .eq("user_id", targetUser.id);
      } catch (e) {}

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setRoleFeedbackMsg({
        type: "success",
        text: `Successfully certified ${targetUser.display_name || targetUser.name || "Educator"} (${genCertId})! Database updated.`,
      });
      await loadDatabaseData();
    } catch (e: any) {
      console.error(e);
      setRoleFeedbackMsg({
        type: "error",
        text: e.message || "Failed to certify user in database.",
      });
      await loadDatabaseData();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeCertification = async (targetUser: any) => {
    setActionLoadingId(targetUser.id);
    setRoleFeedbackMsg(null);

    // Optimistic UI update
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === targetUser.id ? { ...p, is_certified: false } : p
      )
    );

    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVOKE_CERTIFICATION",
          userId: targetUser.id,
          email: targetUser.email,
        }),
      });

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
      } catch (e) {}

      setRoleFeedbackMsg({
        type: "success",
        text: `Revoked educator certification for ${targetUser.display_name || targetUser.name || "user"}.`,
      });
      await loadDatabaseData();
    } catch (e: any) {
      console.error(e);
      setRoleFeedbackMsg({
        type: "error",
        text: e.message || "Failed to revoke certification.",
      });
      await loadDatabaseData();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveApplication = async (app: any) => {
    setActionLoadingId(app.id);
    const genCertId = `TRD-${Math.floor(100000 + Math.random() * 900000)}`;
    setRoleFeedbackMsg(null);

    try {
      const targetUserId = app.user_id || app.userId || app.id;

      // 1. Persistent server update
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CERTIFY",
          userId: targetUserId,
          certId: genCertId,
          email: app.email,
        }),
      });

      // 2. Direct Supabase update
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
      } catch (e) {}

      // 3. Optimistic local update
      setTraderApplications((prev) =>
        prev.map((a) =>
          a.id === app.id
            ? { ...a, status: "approved", certification_id: genCertId }
            : a
        )
      );

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setRoleFeedbackMsg({
        type: "success",
        text: `Approved & certified educator ${app.full_name || app.fullName || "applicant"} (${genCertId})! Database updated.`,
      });
      await loadDatabaseData();
    } catch (e: any) {
      console.error(e);
      setRoleFeedbackMsg({
        type: "error",
        text: e.message || "Failed to approve application.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGrantAdminFromApplication = async (app: any) => {
    setActionLoadingId(app.id);
    const genCertId = `ADM-${Math.floor(100000 + Math.random() * 900000)}`;
    setRoleFeedbackMsg(null);

    try {
      const targetUserId = app.user_id || app.userId || app.id;

      // 1. Optimistic update
      setTraderApplications((prev) =>
        prev.map((a) =>
          a.id === app.id
            ? { ...a, status: "approved", certification_id: genCertId, role: "ADMIN" }
            : a
        )
      );

      // 2. Persistent server-side update to ADMIN
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ROLE",
          userId: targetUserId,
          newRole: "ADMIN",
          email: app.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to grant admin access in database");
      }

      // 3. Mark application approved
      try {
        await supabase
          .from("trader_applications")
          .update({ status: "approved", certification_id: genCertId })
          .eq("id", app.id);
      } catch (e) {}

      // 4. If current user, update session
      if (user && (user.id === targetUserId || (app.email && user.email === app.email))) {
        setRole("ADMIN");
      }

      confetti({ particleCount: 130, spread: 85, origin: { y: 0.6 } });
      setRoleFeedbackMsg({
        type: "success",
        text: `Granted platform ADMIN access to educator applicant ${app.full_name || app.fullName || "User"}! Active database updated.`,
      });
      await loadDatabaseData();
    } catch (e: any) {
      console.error(e);
      setRoleFeedbackMsg({
        type: "error",
        text: e.message || "Failed to grant admin access to applicant.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectApplication = async (app: any) => {
    setActionLoadingId(app.id);
    setRoleFeedbackMsg(null);
    try {
      await supabase
        .from("trader_applications")
        .update({ status: "rejected" })
        .eq("id", app.id);

      setTraderApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: "rejected" } : a))
      );

      setRoleFeedbackMsg({
        type: "success",
        text: `Application for ${app.full_name || app.fullName || "educator"} has been rejected.`,
      });
      await loadDatabaseData();
    } catch (e: any) {
      console.error(e);
      setRoleFeedbackMsg({
        type: "error",
        text: e.message || "Failed to reject application.",
      });
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

  const handleToggleUserRole = async (
    targetUserId: string,
    newRole: "ADMIN" | "TRADER" | "INVESTOR",
    email?: string,
    userName?: string
  ) => {
    setActionLoadingId(targetUserId);
    setRoleFeedbackMsg(null);

    // 1. Optimistic UI update so the badge changes IMMEDIATELY!
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === targetUserId || (email && p.email === email)
          ? { ...p, role: newRole }
          : p
      )
    );

    try {
      // 2. Persistent server-side update across Prisma SQLite, JSON store, and Supabase
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ROLE",
          userId: targetUserId,
          newRole,
          email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update role in database");
      }

      // 3. Client Supabase update attempt (if session permits)
      try {
        await supabase
          .from("profiles")
          .update({ role: newRole })
          .eq("id", targetUserId);
      } catch (sbErr) {
        console.warn("Client Supabase update notice:", sbErr);
      }

      // 4. If current logged-in user was modified, immediately update auth context
      if (user && (user.id === targetUserId || (email && user.email === email))) {
        setRole(newRole);
      }

      // 5. Confetti celebration for admin grant
      if (newRole === "ADMIN") {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }

      setRoleFeedbackMsg({
        type: "success",
        text: `Granted ${newRole} access to ${userName || email || targetUserId}! Active database updated.`,
      });

      await loadDatabaseData();
    } catch (e: any) {
      console.error("Error updating user role:", e);
      setRoleFeedbackMsg({
        type: "error",
        text: e.message || "Failed to update role. Please try again.",
      });
      await loadDatabaseData();
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

            <button
              onClick={() => setActiveTab("invitations")}
              className={`px-4 py-3 border-b-2 font-medium transition flex items-center gap-1.5 whitespace-nowrap focus:outline-none ${
                activeTab === "invitations"
                  ? "border-[#8BE000] text-[#8BE000]"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Invitation Codes</span>
              <span className="text-neutral-500 font-mono text-[10px]">({invitationCodes.length})</span>
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

              {/* Global Role / Action Feedback Banner */}
              {roleFeedbackMsg && (
                <div
                  className={`p-3 text-xs flex items-center gap-2 font-mono border ${
                    roleFeedbackMsg.type === "success"
                      ? "bg-[#8BE000]/10 border-[#8BE000] text-[#8BE000]"
                      : "bg-red-950/40 border-red-800 text-red-300"
                  }`}
                >
                  {roleFeedbackMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#8BE000]" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span>{roleFeedbackMsg.text}</span>
                  <button
                    onClick={() => setRoleFeedbackMsg(null)}
                    className="ml-auto text-[10px] text-neutral-400 hover:text-white"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              )}

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
                          <div className="flex items-center gap-2.5 flex-wrap">
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
                            <button
                              onClick={() => handleGrantAdminFromApplication(app)}
                              disabled={actionLoadingId === app.id}
                              className="bg-red-950/80 hover:bg-red-900 border border-red-700/70 text-red-200 px-3.5 py-1.5 text-xs font-mono transition flex items-center gap-1.5 focus:outline-none"
                              title="Approve applicant and grant platform Administrator access"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                              <span>{actionLoadingId === app.id ? "Granting..." : "Grant Admin Access"}</span>
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

              {/* Global Role / Action Feedback Banner */}
              {roleFeedbackMsg && (
                <div
                  className={`p-3 text-xs flex items-center gap-2 font-mono border ${
                    roleFeedbackMsg.type === "success"
                      ? "bg-[#8BE000]/10 border-[#8BE000] text-[#8BE000]"
                      : "bg-red-950/40 border-red-800 text-red-300"
                  }`}
                >
                  {roleFeedbackMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#8BE000]" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span>{roleFeedbackMsg.text}</span>
                  <button
                    onClick={() => setRoleFeedbackMsg(null)}
                    className="ml-auto text-[10px] text-neutral-400 hover:text-white"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              )}

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
                            <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">{p.email || p.id}</span>
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

                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
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

                          {/* Role Switcher: Admin Grant / Active State */}
                          {p.role !== "ADMIN" ? (
                            <button
                              onClick={() => handleToggleUserRole(p.id, "ADMIN", p.email, p.display_name || p.name)}
                              disabled={actionLoadingId === p.id}
                              className="bg-red-950/70 hover:bg-red-900 border border-red-700/70 text-red-200 hover:text-white transition text-[11px] font-mono px-2.5 py-1 inline-flex items-center gap-1.5 focus:outline-none"
                              title="Grant full platform Admin privileges"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                              <span>{actionLoadingId === p.id ? "Granting..." : "Admin"}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-red-400 font-mono bg-red-950/40 border border-red-800/40 px-2 py-0.5 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              ADMIN
                            </span>
                          )}

                          {p.role === "INVESTOR" && (
                            <button
                              onClick={() => handleToggleUserRole(p.id, "TRADER", p.email, p.display_name || p.name)}
                              disabled={actionLoadingId === p.id}
                              className="bg-[#1A1A1A] hover:bg-[#262626] border border-[#2E2E2E] text-neutral-300 hover:text-[#8BE000] transition text-[11px] font-mono px-2.5 py-1 focus:outline-none"
                            >
                              Trader
                            </button>
                          )}

                          {p.role === "ADMIN" && (
                            <button
                              onClick={() => handleToggleUserRole(p.id, "TRADER", p.email, p.display_name || p.name)}
                              disabled={actionLoadingId === p.id}
                              className="text-neutral-500 hover:text-neutral-300 transition text-[10px] font-mono underline ml-1 focus:outline-none"
                              title="Demote back to Trader role"
                            >
                              Set Trader
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

              {/* TRADER DEBT & SINGLE-USE REDEMPTIONS INVOICES */}
              <div className="pt-6 border-t border-[#1E1E1E] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                  <div>
                    <h3 className="text-xl font-display font-medium text-white tracking-tight flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>TRADER ACCOUNT DEBT & SINGLE-USE INVOICING</span>
                    </h3>
                    <p className="text-xs text-neutral-400 font-sans">
                      Redeem access code =&gt; Put a debt on the trader&apos;s account. Real-time platform receivables and invoicing.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-amber-400">
                    Platform Receivables: <strong className="text-white">{formatPrice(debtSummary.totalPlatformDebt)}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                  <div className="bg-[#111111] border border-[#1E1E1E] p-4 space-y-1">
                    <div className="text-[10px] text-neutral-400 uppercase">Total Redemptions GMV</div>
                    <div className="text-2xl font-display text-white">{formatPrice(debtSummary.totalGmv)}</div>
                    <div className="text-[10px] text-neutral-500">{debtSummary.totalRedemptions} Single-Use Codes Consumed</div>
                  </div>
                  <div className="bg-[#111111] border border-amber-900/40 p-4 space-y-1">
                    <div className="text-[10px] text-amber-400 uppercase">Outstanding Platform Debt</div>
                    <div className="text-2xl font-display text-amber-400">{formatPrice(debtSummary.totalPlatformDebt)}</div>
                    <div className="text-[10px] text-neutral-500">20% Platform Commission Debt on Trader Accounts</div>
                  </div>
                  <div className="bg-[#111111] border border-[#1E1E1E] p-4 space-y-1">
                    <div className="text-[10px] text-neutral-400 uppercase">Trader Net Invoiced</div>
                    <div className="text-2xl font-display text-[#8BE000]">
                      {formatPrice(debtSummary.totalGmv - debtSummary.totalPlatformDebt)}
                    </div>
                    <div className="text-[10px] text-neutral-500">80% Net Realized to Educators</div>
                  </div>
                </div>

                {singleUseInvoices.length > 0 && (
                  <div className="border border-[#1E1E1E] bg-[#111111] overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#0B0B0B] border-b border-[#1E1E1E] text-neutral-400 uppercase text-[9px] tracking-wider">
                        <tr>
                          <th className="p-4">Invoice #</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Item &amp; Type</th>
                          <th className="p-4">Trader Name</th>
                          <th className="p-4">Subscriber</th>
                          <th className="p-4">Access Code</th>
                          <th className="p-4">Value</th>
                          <th className="p-4">Trader Debt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E1E1E]">
                        {singleUseInvoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-[#161616] transition-colors">
                            <td className="p-4 text-white font-bold">{inv.invoiceNumber}</td>
                            <td className="p-4 text-neutral-400 text-[11px]">{new Date(inv.redeemedAt).toLocaleDateString()}</td>
                            <td className="p-4 text-white">[{inv.itemType}] {inv.itemName}</td>
                            <td className="p-4 text-neutral-300">{inv.traderName}</td>
                            <td className="p-4 text-neutral-400">{inv.subscriberEmail}</td>
                            <td className="p-4 font-mono text-[#8BE000]">{inv.accessCode}</td>
                            <td className="p-4 text-white font-bold">{formatPrice(inv.itemPrice)}</td>
                            <td className="p-4 text-amber-400 font-bold">{formatPrice(inv.debtAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 6: INVITATION CODES & ACCESS LEDGER */}
          {activeTab === "invitations" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-[#1E1E1E]">
                <div>
                  <h3 className="text-xl font-display font-medium text-white tracking-tight flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-[#8BE000]" />
                    <span>INVITATION CODE GENERATOR & ACCESS ISSUANCE</span>
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans">
                    Admin Master Authority: Issue, modify, or revoke vouchers granting access to any curriculum, signals, or all-access passes.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-neutral-400 bg-[#111] px-3 py-1.5 border border-[#1E1E1E]">
                    <span className="w-2 h-2 rounded-full bg-[#8BE000] animate-pulse" />
                    <span>{invitationCodes.length} Codes in Ledger</span>
                  </div>
                </div>
              </div>

              {/* Code Issuance Form */}
              <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#8BE000]" />
                    <span>Issue New Access Code</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      const prefixes = ["VIP", "ALPHA", "QUANT", "SIG", "PRO"];
                      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
                      setNewCodeString(`${prefix}-${rand}`);
                    }}
                    className="text-[11px] text-[#8BE000] hover:underline font-mono"
                  >
                    ⚡ Randomize Code
                  </button>
                </div>

                {issueSuccessMsg && (
                  <div className="bg-[#8BE000]/10 border border-[#8BE000] p-3 text-xs text-[#8BE000] flex items-center gap-2 font-mono">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{issueSuccessMsg}</span>
                  </div>
                )}

                {issueErrorMsg && (
                  <div className="bg-red-950/40 border border-red-800 p-3 text-xs text-red-400 flex items-center gap-2 font-mono">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{issueErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleIssueCode} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Code Input */}
                  <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                      Code String *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ALPHA2026"
                      value={newCodeString}
                      onChange={(e) => setNewCodeString(e.target.value.toUpperCase())}
                      className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-xs font-mono text-white uppercase tracking-wider outline-none"
                    />
                  </div>

                  {/* Access Scope */}
                  <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                      Access Scope
                    </label>
                    <select
                      value={newCodeScope}
                      onChange={(e) => setNewCodeScope(e.target.value as any)}
                      className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-xs font-mono text-white outline-none"
                    >
                      <option value="SIGNALS">Technical Signals VIP</option>
                      <option value="ALL_ACCESS">All-Access (Signals + All Courses)</option>
                      <option value="COURSE">Specific Course Access</option>
                    </select>
                  </div>

                  {/* If Scope === COURSE, select course */}
                  {newCodeScope === "COURSE" ? (
                    <div className="space-y-1.5 lg:col-span-1">
                      <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                        Select Target Course *
                      </label>
                      <select
                        required
                        value={newCodeTargetCourseId}
                        onChange={(e) => setNewCodeTargetCourseId(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-xs font-mono text-white outline-none"
                      >
                        <option value="">-- Choose Course --</option>
                        {courses.map((crs) => (
                          <option key={crs.id} value={crs.id}>
                            {crs.title} ({crs.category || "Stock"})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    /* Validity / Duration */
                    <div className="space-y-1.5 lg:col-span-1">
                      <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                        Validity Period
                      </label>
                      <select
                        value={newCodeDuration}
                        onChange={(e) => setNewCodeDuration(Number(e.target.value))}
                        className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-xs font-mono text-white outline-none"
                      >
                        <option value={30}>30 Days (Monthly)</option>
                        <option value={60}>60 Days (Bi-Monthly)</option>
                        <option value={90}>90 Days (Quarterly)</option>
                        <option value={180}>180 Days (Semi-Annual)</option>
                        <option value={365}>365 Days (Annual VIP)</option>
                        <option value={9999}>Lifetime Unlimited</option>
                      </select>
                    </div>
                  )}

                  {/* Max Uses */}
                  <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                      Max Redemptions
                    </label>
                    <select
                      value={newCodeMaxUses}
                      onChange={(e) => setNewCodeMaxUses(Number(e.target.value))}
                      className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-xs font-mono text-white outline-none"
                    >
                      <option value={1}>1 Use (Single Subscriber)</option>
                      <option value={10}>10 Uses</option>
                      <option value={50}>50 Uses (Cohort)</option>
                      <option value={100}>100 Uses (Standard)</option>
                      <option value={500}>500 Uses (Community)</option>
                      <option value={1000}>1,000 Uses (Partner)</option>
                      <option value={99999}>Unlimited Uses</option>
                    </select>
                  </div>

                  {/* Duration if COURSE scope was selected */}
                  {newCodeScope === "COURSE" && (
                    <div className="space-y-1.5 lg:col-span-1">
                      <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                        Enrollment Access Duration
                      </label>
                      <select
                        value={newCodeDuration}
                        onChange={(e) => setNewCodeDuration(Number(e.target.value))}
                        className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-xs font-mono text-white outline-none"
                      >
                        <option value={9999}>Lifetime Unlimited Access</option>
                        <option value={365}>1 Year Access</option>
                        <option value={180}>6 Months Access</option>
                        <option value={90}>90 Days Access</option>
                      </select>
                    </div>
                  )}

                  {/* Notes */}
                  <div className={`space-y-1.5 ${newCodeScope === "COURSE" ? "md:col-span-2 lg:col-span-2" : "md:col-span-2 lg:col-span-3"}`}>
                    <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                      Internal Notes / Audience (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VIP student cohort for quantitative trading course"
                      value={newCodeNotes}
                      onChange={(e) => setNewCodeNotes(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-3 py-2 text-xs font-mono text-white outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-end md:col-span-2 lg:col-span-1">
                    <button
                      type="submit"
                      disabled={isIssuingCode || !newCodeString.trim() || (newCodeScope === "COURSE" && !newCodeTargetCourseId)}
                      className="w-full btn-lime text-black font-bold text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isIssuingCode ? "Issuing..." : "Issue Code"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Table of Issued Invitation Codes */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white uppercase tracking-wider">Active Issued Codes</span>
                  <button
                    onClick={fetchInvitationCodes}
                    className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh Ledger</span>
                  </button>
                </div>

                {invitationCodes.length === 0 ? (
                  <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center text-xs text-neutral-500 font-mono space-y-2">
                    <div className="text-neutral-300 font-bold">NO INVITATION CODES ISSUED</div>
                    <p>Use the generator above to create your first voucher code for Technical Signals or Courses.</p>
                  </div>
                ) : (
                  <div className="border border-[#1E1E1E] bg-[#111111] overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono min-w-[760px]">
                      <thead className="bg-[#0B0B0B] border-b border-[#1E1E1E] text-neutral-400 uppercase text-[9px] tracking-wider">
                        <tr>
                          <th className="p-4">Invitation Code</th>
                          <th className="p-4">Scope / Curriculum</th>
                          <th className="p-4">Validity</th>
                          <th className="p-4">Redemptions</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Issuer</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E1E1E]">
                        {invitationCodes.map((item) => (
                          <tr key={item.id} className="hover:bg-[#161616] transition-colors">
                            {/* Code */}
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
                                  title="Copy invite URL (/redeem?code=...)"
                                >
                                  {copiedShareId === item.id ? (
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

                            {/* Scope / Course */}
                            <td className="p-4">
                              <div className="space-y-1">
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider inline-block ${
                                    item.scope === "COURSE"
                                      ? "bg-blue-950/60 text-blue-300 border border-blue-800/60"
                                      : item.scope === "ALL_ACCESS"
                                      ? "bg-purple-950/60 text-purple-300 border border-purple-800/60"
                                      : "bg-[#8BE000]/15 text-[#8BE000] border border-[#8BE000]/40"
                                  }`}
                                >
                                  {item.scope === "COURSE"
                                    ? "COURSE VOUCHER"
                                    : item.scope === "ALL_ACCESS"
                                    ? "ALL-ACCESS PASS"
                                    : "SIGNALS VIP"}
                                </span>
                                {item.targetCourseTitle && (
                                  <div className="text-[11px] text-neutral-300 max-w-xs truncate font-sans">
                                    {item.targetCourseTitle}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Duration */}
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

                            {/* Issuer */}
                            <td className="p-4 text-neutral-500 text-[11px]">
                              <div>{item.creatorName || item.createdBy || "System Admin"}</div>
                              <div className="text-[10px] text-neutral-600">
                                {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              {/* Edit Button */}
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-[11px] font-mono px-2 py-1 text-neutral-300 hover:text-white bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] transition inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3 text-[#8BE000]" />
                                <span>Edit</span>
                              </button>

                              {/* Revoke / Reactivate Button */}
                              <button
                                onClick={() => handleToggleCodeStatus(item.id, item.status)}
                                className={`text-[11px] font-mono px-2 py-1 transition border ${
                                  item.status === "ACTIVE"
                                    ? "text-amber-400 hover:text-amber-300 bg-amber-950/30 border-amber-900/40"
                                    : "text-green-400 hover:text-green-300 bg-green-950/30 border-green-900/40"
                                }`}
                              >
                                {item.status === "ACTIVE" ? "Revoke" : "Reactivate"}
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteCode(item.id)}
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
            </motion.div>
          )}

          {/* EDIT CODE MODAL */}
          {editingCode && (
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
                      MODIFY INVITATION CODE: <span className="text-[#8BE000]">{editingCode.code}</span>
                    </h4>
                  </div>
                  <button
                    onClick={() => setEditingCode(null)}
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

                <form onSubmit={handleSaveCodeEdit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase">Code String</label>
                      <input
                        type="text"
                        required
                        value={editCodeString}
                        onChange={(e) => setEditCodeString(e.target.value.toUpperCase())}
                        className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white font-bold uppercase focus:border-[#8BE000] outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase">Access Scope</label>
                      <select
                        value={editCodeScope}
                        onChange={(e) => setEditCodeScope(e.target.value as any)}
                        className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white focus:border-[#8BE000] outline-none"
                      >
                        <option value="SIGNALS">Technical Signals VIP</option>
                        <option value="ALL_ACCESS">All-Access (Signals + Courses)</option>
                        <option value="COURSE">Specific Course Access</option>
                      </select>
                    </div>
                  </div>

                  {editCodeScope === "COURSE" && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase">Target Course</label>
                      <select
                        value={editCodeTargetCourseId}
                        onChange={(e) => setEditCodeTargetCourseId(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white focus:border-[#8BE000] outline-none"
                      >
                        {courses.map((crs) => (
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
                        value={editCodeDuration}
                        onChange={(e) => setEditCodeDuration(Number(e.target.value))}
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
                        value={editCodeMaxUses}
                        onChange={(e) => setEditCodeMaxUses(Number(e.target.value))}
                        className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white focus:border-[#8BE000] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Status</label>
                    <select
                      value={editCodeStatus}
                      onChange={(e) => setEditCodeStatus(e.target.value as any)}
                      className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white focus:border-[#8BE000] outline-none"
                    >
                      <option value="ACTIVE">ACTIVE (Accepting Redemptions)</option>
                      <option value="REVOKED">REVOKED (Block Access)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 uppercase">Internal Notes</label>
                    <input
                      type="text"
                      value={editCodeNotes}
                      onChange={(e) => setEditCodeNotes(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#333] px-3 py-2 text-white focus:border-[#8BE000] outline-none"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-[#222]">
                    <button
                      type="button"
                      onClick={() => setEditingCode(null)}
                      className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] text-neutral-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="btn-lime text-black font-bold px-5 py-2 flex items-center gap-1.5"
                    >
                      <span>{isSavingEdit ? "Saving..." : "Save Modifications"}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
