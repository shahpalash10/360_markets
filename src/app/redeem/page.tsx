"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import {
  KeyRound,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Radio,
  BookOpen,
  User,
  Clock,
  Layers,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

function RedeemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || "";

  const { user, isAuthenticated, redeemSignalCode } = useAuth();
  const { t, language } = useLanguage();

  const [inputCode, setInputCode] = useState(codeParam.toUpperCase());
  const [codeDetails, setCodeDetails] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [claimedData, setClaimedData] = useState<any | null>(null);

  // Fetch code metadata if codeParam is provided
  useEffect(() => {
    if (codeParam) {
      verifyCode(codeParam);
    }
  }, [codeParam]);

  const verifyCode = async (c: string) => {
    const clean = c.trim().toUpperCase();
    if (!clean) return;

    setIsVerifying(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/invitation-codes?code=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.ok && data.code) {
        setCodeDetails(data.code);
        // Persist pending code so if they register or login, it binds automatically
        localStorage.setItem("markets_pending_code", clean);
      } else {
        setCodeDetails(null);
        setFeedback({
          type: "error",
          message: data?.error || `Invitation code "${clean}" not recognized or expired.`,
        });
      }
    } catch (e: any) {
      console.error(e);
      setFeedback({ type: "error", message: "Failed to verify invitation code." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClaim = async () => {
    const targetCode = (codeDetails?.code || inputCode).trim().toUpperCase();
    if (!targetCode) return;

    if (!user) {
      localStorage.setItem("markets_pending_code", targetCode);
      router.push(`/register?code=${encodeURIComponent(targetCode)}`);
      return;
    }

    setIsClaiming(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: targetCode,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to redeem invitation code.");
      }

      // Also trigger AuthContext state update
      await redeemSignalCode(targetCode);

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setClaimedData(data);
      setFeedback({
        type: "success",
        message: data.message || `Code "${targetCode}" successfully redeemed! Access is now active on your account.`,
      });
      localStorage.removeItem("markets_pending_code");
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to claim voucher." });
    } finally {
      setIsClaiming(false);
    }
  };

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case "COURSE":
        return <span className="bg-blue-950/60 border border-blue-800 text-blue-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">Course Voucher</span>;
      case "ALL_ACCESS":
        return <span className="bg-purple-950/60 border border-purple-800 text-purple-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">All-Access Master Pass</span>;
      case "TRADER_BUNDLE":
        return <span className="bg-amber-950/60 border border-amber-800 text-amber-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">Trader Pass</span>;
      default:
        return <span className="bg-[#8BE000]/15 border border-[#8BE000]/40 text-[#8BE000] text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">Signals VIP Pass</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white py-16 px-4 font-mono relative selection:bg-[#8BE000] selection:text-black">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#8BE000]/10 border border-[#8BE000]/30 px-3 py-1 text-xs text-[#8BE000] font-bold uppercase tracking-wider">
            <KeyRound className="w-3.5 h-3.5" />
            <span>{t.redeemGatewayBadge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-light tracking-tight text-white">
            {t.redeemTitle}
          </h1>
          <p className="text-xs text-neutral-400 max-w-md mx-auto font-sans leading-relaxed">
            {t.redeemSub}
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 text-xs font-mono flex items-center gap-2.5 border ${
              feedback.type === "success"
                ? "bg-[#8BE000]/10 border-[#8BE000] text-[#8BE000]"
                : "bg-red-950/40 border-red-800 text-red-400"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Success Claim View */}
        {claimedData ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-[#8BE000] bg-[#0E150B] p-8 space-y-6 text-center"
          >
            <div className="w-12 h-12 bg-[#8BE000] text-black rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <span className="text-xs text-[#8BE000] font-bold uppercase tracking-wider block">
                {t.redeemAccessActive}
              </span>
              <h2 className="text-2xl font-display font-medium text-white">
                {claimedData.scope === "COURSE"
                  ? claimedData.targetCourseTitle || "Course Unlocked"
                  : claimedData.scope === "ALL_ACCESS"
                  ? "All-Access Master Pass Active"
                  : "Technical Signals VIP Active"}
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                Voucher <strong className="text-white">{claimedData.code}</strong> is now bound to your account ({user?.email}).
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              {claimedData.scope === "COURSE" && claimedData.targetCourseSlug ? (
                <Link
                  href={`/courses/${claimedData.targetCourseSlug}`}
                  className="btn-lime text-black font-bold text-xs py-3 px-6 flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t.redeemStartCourse}</span>
                </Link>
              ) : (
                <Link
                  href="/signals"
                  className="btn-lime text-black font-bold text-xs py-3 px-6 flex items-center justify-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>{t.redeemOpenSignals}</span>
                </Link>
              )}
              <Link
                href="/investor"
                className="bg-[#141414] hover:bg-[#202020] border border-[#333] text-white text-xs py-3 px-6 flex items-center justify-center gap-2 transition"
              >
                <span>{t.redeemDashboard}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Main Redemption Card */
          <div className="border border-[#1E1E1E] bg-[#111111] p-6 sm:p-8 space-y-6">
            {/* Input Form */}
            <div className="space-y-2">
              <label className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                {t.redeemInputLabel}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.redeemPlaceholder}
                  value={inputCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setInputCode(val);
                    if (val.trim()) {
                      localStorage.setItem("markets_pending_code", val.trim());
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      verifyCode(inputCode);
                    }
                  }}
                  className="flex-1 bg-[#0A0A0A] border border-[#2E2E2E] focus:border-[#8BE000] px-4 py-3 text-sm font-mono text-white uppercase tracking-wider outline-none placeholder:text-neutral-600 font-bold"
                />
                <button
                  type="button"
                  onClick={() => verifyCode(inputCode)}
                  disabled={isVerifying || !inputCode.trim()}
                  className="bg-[#1E1E1E] hover:bg-[#282828] text-white border border-[#333] px-5 py-3 text-xs font-bold transition disabled:opacity-40"
                >
                  {isVerifying ? t.redeemVerifying : t.redeemVerifyBtn}
                </button>
              </div>
            </div>

            {/* Verified Voucher Preview Card */}
            {codeDetails && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-[#2E2E2E] bg-[#0A0A0A] p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#8BE000] text-lg tracking-wider">
                      {codeDetails.code}
                    </span>
                    {getScopeBadge(codeDetails.scope)}
                  </div>
                  <span className="text-[10px] bg-green-950/60 text-green-400 border border-green-800/60 px-2 py-0.5 uppercase tracking-wider">
                    VALID VOUCHER
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Issued By</span>
                    <span className="text-white font-medium">{codeDetails.creatorName || "Verified Educator"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Validity</span>
                    <span className="text-white font-medium">
                      {codeDetails.durationDays >= 9999 || codeDetails.durationDays === 0
                        ? "Lifetime Access"
                        : `${codeDetails.durationDays} Days`}
                    </span>
                  </div>
                </div>

                {codeDetails.targetCourseTitle && (
                  <div className="bg-[#141414] border border-[#222] p-3 text-xs flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#8BE000] shrink-0" />
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Target Curriculum</span>
                      <strong className="text-white">{codeDetails.targetCourseTitle}</strong>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Account Binding State */}
            <div className="pt-2 border-t border-[#1E1E1E] space-y-4">
              {isAuthenticated && user ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-[#161616] border border-[#2E2E2E] p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#8BE000]" />
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Logged In Account</span>
                        <span className="text-white font-bold">{user.displayName || user.name}</span>
                        <span className="text-neutral-500 ml-1.5 font-mono text-[11px]">({user.email})</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#8BE000]/15 text-[#8BE000] px-2 py-0.5 font-bold">
                      READY TO BIND
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleClaim}
                    disabled={isClaiming || (!codeDetails && !inputCode.trim())}
                    className="w-full btn-lime text-black font-bold text-xs py-3.5 px-4 flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isClaiming ? t.redeemVerifying : t.redeemClaimBtn}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#16140A] border border-amber-800/40 p-4 text-xs space-y-2">
                    <span className="text-amber-400 font-bold uppercase tracking-wider block">
                      Authentication Required to Bind Access
                    </span>
                    <p className="text-neutral-400 font-sans leading-relaxed text-[11px]">
                      When you sign up or log in, your invitation voucher will be automatically connected to your profile so you can resume your courses and signals anytime.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                      href={`/register?code=${encodeURIComponent(codeDetails?.code || inputCode || "")}`}
                      className="btn-lime text-black font-bold text-xs py-3 px-4 flex items-center justify-center gap-2 text-center"
                    >
                      <span>Create Free Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      href={`/login?code=${encodeURIComponent(codeDetails?.code || inputCode || "")}`}
                      className="bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] text-white text-xs py-3 px-4 flex items-center justify-center gap-2 text-center transition"
                    >
                      <span>Sign In to Existing</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RedeemPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center font-mono text-xs">
          Loading invitation portal...
        </div>
      }
    >
      <RedeemContent />
    </Suspense>
  );
}
