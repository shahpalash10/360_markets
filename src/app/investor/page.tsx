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
  KeyRound,
  CheckCircle2,
  XCircle,
  Radio,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
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
  const { user, signalSubscription, redeemSignalCode, isUnlocked, unlockedCode } = useAuth();
  const { t, currency } = useLanguage();

  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [hoursLearned, setHoursLearned] = useState<number>(0);
  const [certificatesCount, setCertificatesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Invitation code redemption state
  const [redeemCodeInput, setRedeemCodeInput] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemFeedback, setRedeemFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showRedeemForm, setShowRedeemForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleRedeem = async (overrideCode?: string) => {
    const targetCode = (overrideCode || redeemCodeInput).trim();
    if (!targetCode) return;

    setIsRedeeming(true);
    setRedeemFeedback(null);
    try {
      // 1. First check single-use access code engine
      try {
        const itemRes = await fetch("/api/access-codes/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: targetCode,
            subscriberId: user?.id || "user-subscriber",
            subscriberEmail: user?.email || "investor@360markets.io",
            subscriberName: user?.displayName || user?.name || "Verified Investor",
          }),
        });
        const itemData = await itemRes.json();
        if (itemData.ok) {
          confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
          setRedeemFeedback({
            type: "success",
            message: itemData.message || `Code "${targetCode.toUpperCase()}" successfully redeemed!`,
          });
          setRedeemCodeInput("");
          setShowRedeemForm(false);
          return;
        } else if (itemData.error && itemData.error.includes("already been redeemed")) {
          setRedeemFeedback({
            type: "error",
            message: itemData.error,
          });
          return;
        }
      } catch (e) {}

      // 2. Fallback to legacy invitation code engine
      const res = await redeemSignalCode(targetCode);
      if (res.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setRedeemFeedback({
          type: "success",
          message: res.message || `Code "${targetCode.toUpperCase()}" successfully redeemed!`,
        });
        setRedeemCodeInput("");
        setShowRedeemForm(false);
      } else {
        setRedeemFeedback({
          type: "error",
          message: res.message || "Invalid or expired invitation code.",
        });
      }
    } catch (err: any) {
      setRedeemFeedback({
        type: "error",
        message: err.message || "Failed to process invitation code redemption.",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

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
              <span>{t.investorTerminalBadge}</span>
            </div>
            <SplitTextReveal
              lines={[`${t.investorWelcome}, ${user?.firstName?.toUpperCase() || "INVESTOR"}.`]}
              className="text-4xl sm:text-6xl font-display font-light text-white tracking-tight leading-none"
            />
            <p className="text-xs text-neutral-400">
              {t.investorSub}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border border-[#262626] bg-[#161616] p-6 space-y-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{t.investorEnrolledCourses}</span>
              <div className="text-4xl font-display font-bold text-white">{enrollments.length}</div>
            </div>
            <div className="border border-[#262626] bg-[#161616] p-6 space-y-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{t.investorTotalHours}</span>
              <div className="text-4xl font-display font-bold text-[#8BE000]">{hoursLearned} hrs</div>
            </div>
            <div className="border border-[#262626] bg-[#161616] p-6 space-y-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{t.statVerifiedCourses}</span>
              <div className="text-4xl font-display font-bold text-white">{certificatesCount}</div>
            </div>
          </div>

          {/* Technical Signals & Subscription Redemption Terminal */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#8BE000] animate-pulse" />
                <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight">
                  {t.investorSignalsAccess}
                </h2>
              </div>
              <Link
                href="/signals"
                className="text-xs text-[#8BE000] hover:underline flex items-center gap-1 font-mono"
              >
                <span>{t.investorLiveFeed}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Active Subscription Banner */}
            {signalSubscription?.active ? (
              <div className="border border-[#8BE000]/40 bg-[#0e140a] p-6 lg:p-8 space-y-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#8BE000]/20 pb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#8BE000] text-black font-bold text-[10px] px-2 py-0.5 tracking-wider uppercase">
                        {t.investorActiveSubscriber}
                      </span>
                      <span className="text-[11px] text-[#8BE000] font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified on 360° Network</span>
                      </span>
                    </div>
                    <h3 className="text-2xl font-display font-light text-white tracking-tight">
                      {signalSubscription.tier === "ALL_ACCESS"
                        ? "ALL-ACCESS PASS (SIGNALS + CURRICULUM)"
                        : "QUANTITATIVE TECHNICAL SIGNALS VIP"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href="/signals"
                      className="btn-lime text-black font-bold text-xs px-5 py-2.5 flex items-center gap-2 shadow-lg"
                    >
                      <Radio className="w-4 h-4 text-black animate-pulse" />
                      <span>{t.investorOpenSignals}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-black" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="bg-[#050804] border border-[#1f2e14] p-4 space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Access Tier</span>
                    <div className="text-white font-bold">{signalSubscription.tier}</div>
                  </div>

                  <div className="bg-[#050804] border border-[#1f2e14] p-4 space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">{t.investorIssuedVia}</span>
                    <div className="text-[#8BE000] font-bold flex items-center justify-between">
                      <span>{signalSubscription.code}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(signalSubscription.code);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="text-neutral-400 hover:text-white"
                        title="Copy code"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-[#8BE000]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#050804] border border-[#1f2e14] p-4 space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">{t.investorExpiration}</span>
                    <div className="text-white font-bold">
                      {signalSubscription.isLifetime
                        ? "Lifetime Unlimited"
                        : signalSubscription.expiresAt
                        ? `Expires ${new Date(signalSubscription.expiresAt).toLocaleDateString()}`
                        : `${signalSubscription.durationDays} Days`}
                    </div>
                  </div>

                  <div className="bg-[#050804] border border-[#1f2e14] p-4 space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Real-Time Alerts</span>
                    <div className="text-[#8BE000] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#8BE000] animate-pulse" />
                      <span>ntfy.sh Connected</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#8BE000]/15 text-xs">
                  <span className="text-neutral-400 text-[11px]">
                    Need to upgrade or apply an educator extension pass?
                  </span>
                  <button
                    onClick={() => setShowRedeemForm(!showRedeemForm)}
                    className="text-[#8BE000] hover:underline font-mono text-xs flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{showRedeemForm ? "Hide Voucher Input" : "Redeem Another Code"}</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Redeem Form (shown if not active OR if active and user toggled showRedeemForm) */}
            {(!signalSubscription?.active || showRedeemForm) && (
              <div className="border border-[#262626] bg-[#141414] p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#8BE000]" />
                      <h3 className="text-lg font-display font-medium text-white tracking-tight">
                        {t.investorRedeemVip}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-400 font-sans">
                      Enter an invitation voucher issued by an educator, community partner, or admin (TradingEasy study standard) to activate your Technical Signals subscription.
                    </p>
                  </div>

                  {!signalSubscription?.active && (
                    <span className="bg-amber-950/50 text-amber-400 border border-amber-800/60 text-[10px] font-mono px-2.5 py-1 uppercase tracking-wider self-start sm:self-auto">
                      SIGNALS LOCKED
                    </span>
                  )}
                </div>

                {redeemFeedback && (
                  <div
                    className={`p-4 text-xs font-mono flex items-center gap-2.5 border ${
                      redeemFeedback.type === "success"
                        ? "bg-[#8BE000]/10 border-[#8BE000] text-[#8BE000]"
                        : "bg-red-950/40 border-red-800 text-red-400"
                    }`}
                  >
                    {redeemFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{redeemFeedback.message}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="ENTER INVITATION CODE (e.g. TRADINGEASY, ALPHA2026)"
                      value={redeemCodeInput}
                      onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRedeem();
                        }
                      }}
                      className="flex-1 bg-[#0A0A0A] border border-[#333] focus:border-[#8BE000] px-4 py-3 text-sm font-mono text-white uppercase tracking-wider outline-none placeholder:text-neutral-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleRedeem()}
                      disabled={isRedeeming || !redeemCodeInput.trim()}
                      className="btn-lime text-black font-bold text-xs px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-40 shrink-0"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isRedeeming ? "Redeeming..." : t.investorRedeemBtn}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-neutral-500 font-sans pt-1">
                    Enter the voucher code given by your course educator or quantitative trading provider.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Enrolled Courses */}
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-white uppercase">{t.investorYourCourses}</h2>
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
