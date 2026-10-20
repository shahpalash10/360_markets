"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Bell,
  Radio,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Clock,
  Zap,
  BookOpen,
} from "lucide-react";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { useLanguage } from "@/lib/language-context";
import { getTraderChannelHash } from "@/lib/channel-hash";
import { useAuth } from "@/lib/auth-context";
import { UnlockModal } from "@/components/modals/UnlockModal";
import { motion, AnimatePresence } from "framer-motion";

interface TechnicalSignal {
  id: string;
  symbol: string;
  market: "US" | "CN" | "HK" | "CRYPTO";
  action: "BUY" | "SELL" | "WATCH";
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  timeframe: "INTRADAY" | "SWING" | "POSITION";
  riskReward: string;
  notes: string;
  providerName: string;
  providerAvatar?: string;
  isVerified: boolean;
  status: "ACTIVE" | "TARGET_REACHED" | "STOPPED";
  createdAt: string;
  courseId?: string;
  courseSlug?: string;
  courseName?: string;
  channelTopic?: string;
  traderId?: string;
}

function SignalsContent() {
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const { user, role, isUnlocked, unlockedCode, signalSubscription } = useAuth();

  const [signals, setSignals] = useState<TechnicalSignal[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMarket, setFilterMarket] = useState<string>("ALL");
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [unlockedCourses, setUnlockedCourses] = useState<string[]>([]);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [liveNotification, setLiveNotification] = useState<string | null>(null);

  // Sync unlocked courses from localStorage
  const refreshUnlockedCourses = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("markets_unlocked_courses") || "[]");
        setUnlockedCourses(stored);
      } catch (e) {
        setUnlockedCourses([]);
      }
    }
  };

  useEffect(() => {
    refreshUnlockedCourses();
    const handleStorage = () => refreshUnlockedCourses();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [isUnlocked, unlockedCode]);

  // Pre-select channel from URL if provided (e.g. /signals?channel=stocks_the_beginning_to_the_end)
  useEffect(() => {
    const channelParam = searchParams.get("channel");
    if (channelParam) {
      setSelectedChannel(channelParam);
    }
  }, [searchParams]);

  // Fetch courses for channel tabs
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch("/api/courses");
        const data = await res.json();
        if (data.courses) {
          setCourses(
            data.courses.filter(
              (c: any) => c.title && c.title.toLowerCase() !== "test"
            )
          );
        }
      } catch (e) {
        console.warn("Failed to load courses for channel routing:", e);
      }
    }
    loadCourses();
  }, []);

  // Fetch signals from API
  const fetchSignals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/signals");
      const data = await res.json();
      if (data.ok && data.signals) {
        setSignals(data.signals);
      }
    } catch (e) {
      console.error("Failed to load signals:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  // Compute active ntfy topic based on selected channel (private non-readable hash channels)
  const activeTopic = useMemo(() => {
    if (selectedChannel && selectedChannel !== "ALL" && selectedChannel !== "GLOBAL") {
      const matched = signals.find((s) => s.channelTopic && (s.courseSlug === selectedChannel || s.courseId === selectedChannel));
      if (matched?.channelTopic) return matched.channelTopic;
      return getTraderChannelHash({ scopeId: selectedChannel });
    }
    const firstWithTopic = signals.find((s) => s.channelTopic);
    if (firstWithTopic?.channelTopic) return firstWithTopic.channelTopic;
    return getTraderChannelHash({ scopeId: "default" });
  }, [selectedChannel, signals]);

  // Listen to active ntfy.sh SSE stream for live real-time push events!
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`https://ntfy.sh/${activeTopic}/sse`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "message") {
            setLiveNotification(data.message || data.title);
            fetchSignals(); // auto-refresh list
            setTimeout(() => setLiveNotification(null), 8000);
          }
        } catch (err) {}
      };
    } catch (e) {
      console.warn("ntfy SSE listener notice:", e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [activeTopic]);

  // Check if a user has access to a specific course's signals
  const isCourseUnlocked = (courseId?: string, courseSlug?: string) => {
    if (role === "TRADER" || role === "ADMIN") return true;
    if (unlockedCourses.includes("ALL_ACCESS")) return true;
    if (signalSubscription?.tier === "ALL_ACCESS") return true;
    if (courseId && unlockedCourses.includes(courseId)) return true;
    if (courseSlug && unlockedCourses.includes(courseSlug)) return true;
    if (courseSlug) {
      const cleanSlug = courseSlug.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      if (unlockedCourses.some((c) => c.toLowerCase().replace(/[^a-z0-9_-]/g, "_") === cleanSlug)) {
        return true;
      }
    }
    return false;
  };

  // Determine if user can view the full trade parameters of a signal
  const canAccessSignal = (signal: TechnicalSignal) => {
    // 1. Providers and Admins always have full access
    if (role === "TRADER" || role === "ADMIN") return true;

    // 2. Course-specific signals require enrollment in that specific course
    if (signal.courseId || signal.courseSlug) {
      return isCourseUnlocked(signal.courseId, signal.courseSlug);
    }

    // 3. Global platform signals require unlocked code or active subscription
    return isUnlocked || (signalSubscription?.active ?? false);
  };

  // Filter signals by market and selected course channel
  const filteredSignals = signals.filter((s) => {
    // Market filter
    if (filterMarket !== "ALL" && s.market !== filterMarket) return false;

    // Course Channel filter
    if (selectedChannel !== "ALL") {
      if (selectedChannel === "GLOBAL") {
        return !s.courseSlug && !s.courseId;
      }
      const sSlugClean = (s.courseSlug || "").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const targetClean = selectedChannel.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      return (
        s.courseId === selectedChannel ||
        s.courseSlug === selectedChannel ||
        sSlugClean === targetClean
      );
    }

    return true;
  });

  const selectedCourseObj = courses.find((c) => {
    const cClean = (c.slug || c.id || "").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    return cClean === selectedChannel || c.id === selectedChannel || c.slug === selectedChannel;
  });

  return (
    <div className="min-h-screen bg-[#080808] text-white py-16 font-mono selection:bg-[#8BE000] selection:text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Live SSE Toast Notification */}
        <AnimatePresence>
          {liveNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#141414] border-2 border-[#8BE000] p-4 text-xs font-mono shadow-2xl flex items-center justify-between gap-4 sticky top-24 z-40"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8BE000] animate-ping shrink-0" />
                <div>
                  <strong className="text-[#8BE000] block uppercase tracking-wider">
                    NEW LIVE SIGNAL RECEIVED ON {activeTopic.toUpperCase()}:
                  </strong>
                  <span className="text-white font-sans">{liveNotification}</span>
                </div>
              </div>
              <button
                onClick={() => setLiveNotification(null)}
                className="text-neutral-400 hover:text-white px-2 py-1 text-xs"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="border-b border-[#222] pb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-mono text-[#8BE000] bg-[#141414] border border-[#262626] px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#8BE000] animate-pulse" />
              <span>{t.signalsTitle}</span>
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchSignals}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-[#141414] border border-[#262626] px-3 py-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.signalsSync}</span>
              </button>

              {/* Item 9: Restrict Provider Studio access to TRADER and ADMIN roles only */}
              {user && (role === "TRADER" || role === "ADMIN") && (
                <Link
                  href="/trader/signals"
                  className="btn-lime text-xs px-3.5 py-1.5 font-bold text-black flex items-center gap-1"
                >
                  <span>{t.signalsProviderStudio}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          <SplitTextReveal
            lines={[t.signalsTitle]}
            className="text-4xl lg:text-5xl font-display font-light tracking-tight text-white"
          />

          <p className="text-xs text-neutral-400 max-w-2xl font-sans leading-relaxed">
            {t.signalsSub}
          </p>
        </div>

        {/* Item 12: Course-Specific Notification Channels & ntfy.sh Hub */}
        <div className="bg-[#121212] border border-[#262626] p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#222]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Bell className="w-4 h-4 text-[#8BE000]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {t.signalsNtfyBanner}
                </span>
                <span className="bg-[#8BE000]/15 text-[#8BE000] border border-[#8BE000]/30 text-[10px] px-2 py-0.5 font-mono">
                  TOPIC: {activeTopic}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans max-w-2xl leading-relaxed">
                {selectedChannel === "ALL" || selectedChannel === "GLOBAL"
                  ? t.signalsNtfyDesc
                  : `Course-specific push notification channel for students subscribed to "${selectedCourseObj?.title || selectedChannel}". Only enrolled members receive these real-time alerts.`}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href={`https://ntfy.sh/${activeTopic}`}
                target="_blank"
                rel="noreferrer"
                className="btn-lime text-xs px-4 py-2.5 font-bold flex items-center gap-2 text-black shadow-lg"
              >
                <span>{t.signalsNtfyBtn}</span>
                <ExternalLink className="w-3.5 h-3.5 text-black" />
              </a>
            </div>
          </div>

          {/* Channel Selector Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-neutral-400">
                <Radio className="w-3.5 h-3.5 text-[#8BE000]" />
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  NOTIFICATION CHANNEL / COURSE STREAM:
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">
                Listening to: ntfy.sh/{activeTopic}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedChannel("ALL")}
                className={`px-3 py-1.5 text-xs font-mono transition ${
                  selectedChannel === "ALL"
                    ? "bg-[#8BE000] text-black font-bold shadow"
                    : "bg-[#181818] border border-[#333] text-neutral-400 hover:text-white"
                }`}
              >
                🌐 All Channels
              </button>

              <button
                onClick={() => setSelectedChannel("GLOBAL")}
                className={`px-3 py-1.5 text-xs font-mono transition ${
                  selectedChannel === "GLOBAL"
                    ? "bg-[#8BE000] text-black font-bold shadow"
                    : "bg-[#181818] border border-[#333] text-neutral-400 hover:text-white"
                }`}
              >
                🔒 Primary Private Channels
              </button>

              {courses.map((course) => {
                const cleanSlug = (course.slug || course.id)
                  .toLowerCase()
                  .replace(/[^a-z0-9_-]/g, "_")
                  .replace(/^_+|_+$/g, "");
                const isEnrolled = isCourseUnlocked(course.id, cleanSlug);
                const isSelected = selectedChannel === cleanSlug;

                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedChannel(cleanSlug)}
                    className={`px-3 py-1.5 text-xs font-mono transition flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#8BE000] text-black font-bold shadow"
                        : "bg-[#181818] border border-[#333] text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span>📚 {course.title}</span>
                    {isEnrolled ? (
                      <span className="text-[9px] bg-emerald-950/80 text-emerald-400 px-1 border border-emerald-700/50">
                        SUBSCRIBED
                      </span>
                    ) : (
                      <span className="text-[9px] text-amber-400">🔒</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Invitation Code Unlock Status or Callout */}
        {!isUnlocked && (
          <div className="bg-[#141414] border border-[#333] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#8BE000]/15 border border-[#8BE000] text-[#8BE000] flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-xs text-white block">
                  {t.signalsInviteTitle}
                </strong>
                <span className="text-[11px] text-neutral-400 font-sans">
                  {t.signalsInviteDesc}
                </span>
              </div>
            </div>

            <button
              onClick={() => setUnlockModalOpen(true)}
              className="btn-lime text-xs px-4 py-2 font-bold shrink-0 text-black"
            >
              {t.signalsInviteBtn}
            </button>
          </div>
        )}

        {/* Market Filter Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-[#222] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: t.signalsAllAssets },
              { id: "US", label: t.signalsUSEquities },
              { id: "HK", label: t.signalsHongKong },
              { id: "CN", label: t.signalsAShare },
              { id: "CRYPTO", label: t.signalsCrypto },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMarket(tab.id)}
                className={`px-3 py-1.5 text-xs font-mono transition ${
                  filterMarket === tab.id
                    ? "bg-[#8BE000] text-black font-bold"
                    : "bg-[#141414] border border-[#262626] text-neutral-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-neutral-500 font-mono hidden sm:inline">
            {filteredSignals.length} {t.commonActive.toUpperCase()}
          </span>
        </div>

        {/* Signals Feed Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#121212] border border-[#222] p-6 space-y-4 animate-pulse"
              >
                <div className="h-6 bg-[#222] w-1/3" />
                <div className="h-16 bg-[#181818]" />
                <div className="h-10 bg-[#161616]" />
              </div>
            ))}
          </div>
        ) : filteredSignals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSignals.map((signal) => {
              const isBuy = signal.action === "BUY";
              const hasAccess = canAccessSignal(signal);
              const isCourseSignal = Boolean(signal.courseId || signal.courseSlug);
              const signalTopic = signal.channelTopic || getTraderChannelHash({ traderId: signal.traderId, traderName: signal.providerName, scopeId: signal.courseSlug || signal.id });

              return (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-[#111111] border ${
                    hasAccess
                      ? "border-[#262626] hover:border-[#8BE000]"
                      : "border-amber-900/40 hover:border-amber-600/60"
                  } p-6 flex flex-col justify-between transition-all space-y-6 group`}
                >
                  <div className="space-y-4">
                    {/* Item 12: Course Channel Badge */}
                    {isCourseSignal && (
                      <div className="flex items-center justify-between text-[10px] bg-[#161616] border border-[#2a2a2a] px-2.5 py-1 text-neutral-300">
                        <div className="flex items-center gap-1.5 truncate">
                          <BookOpen className="w-3 h-3 text-[#8BE000] shrink-0" />
                          <span className="text-white font-bold truncate">
                            {signal.courseName || signal.courseSlug}
                          </span>
                        </div>
                        <a
                          href={`https://ntfy.sh/${signalTopic}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8BE000] hover:underline font-mono ml-2 shrink-0 flex items-center gap-0.5"
                        >
                          <span>ntfy/{signalTopic.length > 20 ? signalTopic.slice(0, 16) + "..." : signalTopic}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}

                    {/* Header: Asset + Action Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold font-display text-white tracking-tight">
                          {signal.symbol}
                        </span>
                        <span className="bg-[#1f1f1f] text-[10px] text-neutral-400 px-2 py-0.5 border border-[#333]">
                          {signal.market}
                        </span>
                      </div>

                      <div
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                          isBuy
                            ? "bg-[#8BE000] text-black"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {isBuy ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>{signal.action}</span>
                      </div>
                    </div>

                    {/* Pricing Matrix - Subscription-gated */}
                    <div className="grid grid-cols-3 gap-2 bg-[#161616] border border-[#262626] p-3 text-center relative overflow-hidden">
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase block">
                          {t.signalsEntry}
                        </span>
                        <span
                          className={`text-xs font-bold font-mono ${
                            hasAccess ? "text-white" : "text-neutral-500 blur-[2px]"
                          }`}
                        >
                          {hasAccess ? `$${signal.entryPrice.toFixed(2)}` : "$•••.••"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-red-400 uppercase block">
                          {t.signalsStopLoss}
                        </span>
                        <span
                          className={`text-xs font-bold font-mono ${
                            hasAccess ? "text-red-400" : "text-neutral-500 blur-[2px]"
                          }`}
                        >
                          {hasAccess ? `$${signal.stopLoss.toFixed(2)}` : "$•••.••"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#8BE000] uppercase block">
                          {t.signalsTarget}
                        </span>
                        <span
                          className={`text-xs font-bold font-mono ${
                            hasAccess ? "text-[#8BE000]" : "text-neutral-500 blur-[2px]"
                          }`}
                        >
                          {hasAccess ? `$${signal.targetPrice.toFixed(2)}` : "$•••.••"}
                        </span>
                      </div>
                    </div>

                    {/* R:R Ratio & Timeframe */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1e1e1e]">
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <span>{t.signalsRRRatio}</span>
                        <strong className="text-white font-mono">{signal.riskReward}</strong>
                      </div>
                      <span className="bg-[#1c1c1c] text-neutral-400 text-[10px] px-2 py-0.5 border border-[#333]">
                        {signal.timeframe}
                      </span>
                    </div>

                    {/* Analysis Notes / Gate Card */}
                    {hasAccess ? (
                      <p className="text-xs text-neutral-300 font-sans leading-relaxed line-clamp-3">
                        {signal.notes}
                      </p>
                    ) : (
                      <div className="bg-[#161616]/90 border border-amber-900/50 p-3 space-y-1.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-amber-400 text-[11px] font-bold">
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            {isCourseSignal
                              ? "Course Enrollment Required"
                              : "VIP Invitation Required"}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-sans">
                          {isCourseSignal
                            ? `This signal is restricted to students of "${signal.courseName || signal.courseSlug}". Enter your course invitation code to unlock.`
                            : "Enter a valid educator invitation code to unlock full quantitative entry parameters."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Provider & Action Footer */}
                  <div className="pt-4 border-t border-[#222] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {signal.providerAvatar && (
                        <img
                          src={signal.providerAvatar}
                          alt={signal.providerName}
                          className="w-6 h-6 rounded-full object-cover border border-[#444]"
                        />
                      )}
                      <div>
                        <span className="text-[11px] font-bold text-neutral-200 block line-clamp-1">
                          {signal.providerName}
                        </span>
                        <span className="text-[9px] text-[#8BE000] flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-[#8BE000]" />
                          <span>{t.signalsAuditedQuant}</span>
                        </span>
                      </div>
                    </div>

                    {!hasAccess ? (
                      <button
                        onClick={() => setUnlockModalOpen(true)}
                        className="text-[11px] bg-[#8BE000]/15 hover:bg-[#8BE000]/25 text-[#8BE000] border border-[#8BE000]/40 px-2.5 py-1 flex items-center gap-1 font-bold transition"
                      >
                        <Lock className="w-3 h-3" />
                        <span>{isCourseSignal ? "Unlock Course" : t.navUnlock}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {t.signalsActiveOrder}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 border border-[#222] bg-[#111] text-center space-y-3">
            <Radio className="w-10 h-10 text-neutral-600 mx-auto" />
            <h4 className="text-lg font-bold text-white uppercase">{t.signalsNoActive}</h4>
            <p className="text-xs text-neutral-400 font-sans">
              {t.signalsNoActiveDesc}
            </p>
          </div>
        )}
      </div>

      {/* Unlock Code Modal */}
      <UnlockModal
        isOpen={unlockModalOpen}
        onClose={() => {
          setUnlockModalOpen(false);
          refreshUnlockedCourses();
        }}
      />
    </div>
  );
}

export default function SignalsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center font-mono text-xs">
          Loading Signals Console...
        </div>
      }
    >
      <SignalsContent />
    </Suspense>
  );
}
