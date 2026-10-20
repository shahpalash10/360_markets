"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { getTraderChannelHash } from "@/lib/channel-hash";
import {
  Send,
  Radio,
  Bell,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function TraderSignalsStudioPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const { language } = useLanguage();

  const [symbol, setSymbol] = useState("NVDA");
  const [market, setMarket] = useState<"US" | "CN" | "HK" | "CRYPTO">("US");
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [entryPrice, setEntryPrice] = useState("128.50");
  const [stopLoss, setStopLoss] = useState("122.00");
  const [targetPrice, setTargetPrice] = useState("145.00");
  const [timeframe, setTimeframe] = useState<"INTRADAY" | "SWING" | "POSITION">("SWING");
  const [notes, setNotes] = useState("4-Hour chart breakout confirmation with 2.8x volume surge and institutional order flow support.");

  // Generator for custom provider invitation codes
  const [customInviteCode, setCustomInviteCode] = useState(`PROV-${user?.displayName?.replace(/\s+/g, "").toUpperCase() || "ALPHA"}-2026`);
  const [codeCopied, setCodeCopied] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("GLOBAL");

  // Non-readable unique hash channel derived from trader credentials (name & email)
  const activeHashChannel = useMemo(() => {
    return getTraderChannelHash({
      traderId: user?.id,
      traderEmail: user?.email,
      traderName: user?.displayName || user?.name || "Trader",
      scopeId: selectedCourseId,
    });
  }, [user, selectedCourseId]);

  // Load available courses for channel routing
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch("/api/courses");
        const data = await res.json();
        if (data.courses) {
          setCourses(data.courses.filter((c: any) => c.title && c.title.toLowerCase() !== "test"));
        }
      } catch (e) {}
    }
    loadCourses();
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(customInviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handlePublishSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessStatus(null);

    // Item 9: Restrict investors from publishing signals
    if (role !== "TRADER" && role !== "ADMIN") {
      setErrorMsg("Access Denied: You are signed in as an Investor. Signal publishing is restricted to certified Providers only.");
      return;
    }

    setSubmitting(true);

    try {
      const selectedCourse = courses.find((c) => c.id === selectedCourseId);
      const courseSlug = selectedCourse?.slug || (selectedCourseId !== "GLOBAL" ? selectedCourseId : undefined);
      const courseName = selectedCourse?.title;

      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          market,
          action,
          entryPrice: parseFloat(entryPrice),
          stopLoss: parseFloat(stopLoss),
          targetPrice: parseFloat(targetPrice),
          timeframe,
          notes,
          traderId: user?.id,
          traderEmail: user?.email,
          userRole: role,
          courseId: selectedCourseId !== "GLOBAL" ? selectedCourseId : undefined,
          courseSlug,
          courseName,
          channelTopic: activeHashChannel,
          providerName: user?.displayName || user?.name || "Verified Quantitative Trader",
          providerAvatar: user?.avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to broadcast signal");
      }

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setSuccessStatus(`Signal for ${symbol} successfully broadcasted to your private hash channel: ntfy.sh/${data.topic || activeHashChannel}`);

      // Register custom provider voucher directly into Database Ledger
      try {
        await fetch("/api/invitation-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: customInviteCode,
            scope: selectedCourseId !== "GLOBAL" ? "COURSE" : "SIGNALS",
            targetCourseId: selectedCourseId !== "GLOBAL" ? selectedCourseId : undefined,
            creatorRole: "TRADER",
            creatorId: user?.id,
            creatorName: user?.displayName || user?.name || "Verified Educator",
            durationDays: 30,
            maxUses: 100,
            notes: `Signals VIP voucher generated for ${symbol}`,
          }),
        });
      } catch (err) {}
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while publishing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["TRADER", "ADMIN"]}>
      <div className="min-h-screen bg-[#080808] text-white py-16 font-mono selection:bg-[#8BE000] selection:text-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Link href="/trader" className="hover:text-white">Trader Hub</Link>
          <span>/</span>
          <span className="text-white font-bold">Signal Publishing Studio</span>
        </div>

        {/* Studio Header */}
        <div className="border-b border-[#222] pb-6 space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#8BE000]/10 border border-[#8BE000]/30 px-3 py-1 text-xs text-[#8BE000] font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5" />
            <span>PROVIDER TECHNICAL SIGNAL BROADCASTER</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-light text-white tracking-tight">
            BROADCAST TECHNICAL <span className="text-[#8BE000] font-bold">TRADING SIGNAL.</span>
          </h1>

          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
            Publish precision entry, target, and stop-loss levels. Once submitted, your signal is recorded in the platform ledger and immediately dispatched as an instant high-priority push notification to all subscribers via <strong>ntfy.sh</strong>.
          </p>
        </div>

        {/* Provider Invitation Code Sharing Box */}
        <div className="bg-[#121212] border border-[#262626] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#8BE000]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                YOUR SUBSCRIBER INVITATION CODE
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              UNLIMITED SUBSCRIBERS
            </span>
          </div>

          <p className="text-xs text-neutral-400 font-sans">
            Share this invitation code with your followers, students, or community members to grant them instant free access to your signals and course materials.
          </p>

          <div className="flex items-center gap-2 max-w-md pt-1">
            <input
              type="text"
              readOnly
              value={customInviteCode}
              className="bg-[#181818] border border-[#333] px-3.5 py-2 text-xs font-mono font-bold text-[#8BE000] w-full focus:outline-none"
            />
            <button
              onClick={handleCopyCode}
              className="btn-lime px-4 py-2 text-xs font-bold text-black flex items-center gap-1.5 shrink-0"
            >
              {codeCopied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
              <span>{codeCopied ? "Copied" : "Copy Code"}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {successStatus && (
          <div className="bg-emerald-950/60 border border-emerald-600 p-4 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#8BE000]" />
              <span>{successStatus}</span>
            </div>
            <Link href="/signals" className="underline font-bold text-white ml-4 shrink-0">
              View Live Signals Feed →
            </Link>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-800 p-4 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Signal Publishing Form */}
        <form onSubmit={handlePublishSignal} className="bg-[#111111] border border-[#262626] p-6 sm:p-8 space-y-6">
          {/* Target Course Notification Channel */}
          <div className="space-y-2 pb-4 border-b border-[#222]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                TRADER PRIVATE HASH CHANNEL (NON-READABLE)
              </label>
              <span className="text-[10px] text-[#8BE000] font-mono flex items-center gap-1.5">
                <span className="text-neutral-500">Channel:</span>
                <span className="bg-[#181818] border border-[#333] px-2 py-0.5 text-[#8BE000] font-bold">
                  ntfy.sh/{activeHashChannel}
                </span>
              </span>
            </div>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-[#181818] border border-[#333] focus:border-[#8BE000] text-white p-3 font-mono text-xs focus:outline-none"
            >
              <option value="GLOBAL">
                🔒 Primary Private Hash Channel ({getTraderChannelHash({ traderId: user?.id, traderEmail: user?.email, traderName: user?.displayName || user?.name, scopeId: "GLOBAL" })})
              </option>
              {courses.map((course) => {
                const courseHash = getTraderChannelHash({
                  traderId: user?.id,
                  traderEmail: user?.email,
                  traderName: user?.displayName || user?.name,
                  scopeId: course.id || course.slug,
                });
                return (
                  <option key={course.id} value={course.id}>
                    📚 {course.title} (Channel: {courseHash})
                  </option>
                );
              })}
            </select>
            <p className="text-[10px] text-neutral-500 font-sans">
              Non-readable private channel generated uniquely from your trader credentials (name &amp; email). Only authorized subscribers who redeem your access code can receive signals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Asset Symbol */}
            <div className="space-y-2">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                TICKER / SYMBOL
              </label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. NVDA, 00700.HK, TSLA"
                className="w-full bg-[#181818] border border-[#333] focus:border-[#8BE000] text-white p-3 font-mono font-bold text-sm focus:outline-none"
              />
            </div>

            {/* Market Selection */}
            <div className="space-y-2">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                ASSET MARKET
              </label>
              <select
                value={market}
                onChange={(e: any) => setMarket(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] focus:border-[#8BE000] text-white p-3 font-mono text-sm focus:outline-none"
              >
                <option value="US">US Equities (NYSE / NASDAQ)</option>
                <option value="HK">Hong Kong Equities (HKEX)</option>
                <option value="CN">A-Share (SSE / SZSE)</option>
                <option value="CRYPTO">Crypto & Derivatives</option>
              </select>
            </div>
          </div>

          {/* Action Toggle (BUY vs SELL) & Timeframe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                SIGNAL ACTION
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAction("BUY")}
                  className={`p-3 text-xs font-bold font-mono transition flex items-center justify-center gap-2 border ${
                    action === "BUY"
                      ? "bg-[#8BE000] text-black border-[#8BE000]"
                      : "bg-[#161616] text-neutral-400 border-[#333] hover:text-white"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>LONG / BUY</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAction("SELL")}
                  className={`p-3 text-xs font-bold font-mono transition flex items-center justify-center gap-2 border ${
                    action === "SELL"
                      ? "bg-red-600 text-white border-red-500"
                      : "bg-[#161616] text-neutral-400 border-[#333] hover:text-white"
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>SHORT / SELL</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                SETUP TIMEFRAME
              </label>
              <select
                value={timeframe}
                onChange={(e: any) => setTimeframe(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] focus:border-[#8BE000] text-white p-3 font-mono text-sm focus:outline-none"
              >
                <option value="INTRADAY">Intraday (Day Trade)</option>
                <option value="SWING">Swing Trade (2 - 7 Days)</option>
                <option value="POSITION">Position Trade (Weeks/Months)</option>
              </select>
            </div>
          </div>

          {/* Pricing Parameters: Entry, Stop Loss, Target */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                ENTRY PRICE ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] focus:border-[#8BE000] text-white p-3 font-mono font-bold text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                STOP LOSS ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] focus:border-red-500 text-red-400 p-3 font-mono font-bold text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-[#8BE000] font-bold uppercase tracking-wider block">
                TARGET PRICE ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] focus:border-[#8BE000] text-[#8BE000] p-3 font-mono font-bold text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Rationale & Notes */}
          <div className="space-y-2">
            <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
              TECHNICAL RATIONALE & EXECUTION NOTES
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain the pattern, volume profile, catalyst, or quantitative indicator triggers..."
              className="w-full bg-[#181818] border border-[#333] focus:border-[#8BE000] text-white p-3 text-xs font-sans focus:outline-none placeholder:text-neutral-600"
            />
          </div>

          {/* Submit & Push to ntfy.sh */}
          <div className="pt-4 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-sans">
              <Bell className="w-4 h-4 text-[#8BE000]" />
              <span>
                Will push immediately to trader private hash channel:{" "}
                <strong className="text-[#8BE000] font-mono">
                  ntfy.sh/{activeHashChannel}
                </strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-lime w-full sm:w-auto px-8 py-3.5 text-xs font-bold text-black flex items-center justify-center gap-2 shadow-2xl transition disabled:opacity-50"
            >
              <span>{submitting ? "Broadcasting to ntfy.sh..." : "Publish Signal & Notify Subscribers"}</span>
              <Send className="w-4 h-4 text-black" />
            </button>
          </div>
        </form>
      </div>
    </div>
    </AuthGuard>
  );
}
