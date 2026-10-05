"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Reveal } from "@/motion/components/Reveal";
import { SplitTextReveal } from "@/motion/components/SplitTextReveal";
import { useLanguage } from "@/lib/language-context";
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
}

export default function SignalsPage() {
  const { t, language } = useLanguage();
  const { isUnlocked, unlockedCode } = useAuth();

  const [signals, setSignals] = useState<TechnicalSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMarket, setFilterMarket] = useState<string>("ALL");
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [liveNotification, setLiveNotification] = useState<string | null>(null);

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

  // Listen to ntfy.sh SSE stream for live real-time push events!
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("https://ntfy.sh/360markets_signals/sse");
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
  }, []);

  const filteredSignals = signals.filter((s) => {
    if (filterMarket === "ALL") return true;
    return s.market === filterMarket;
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
                    NEW LIVE SIGNAL RECEIVED VIA NTFY.SH:
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

              <Link
                href="/trader/signals"
                className="btn-lime text-xs px-3.5 py-1.5 font-bold text-black flex items-center gap-1"
              >
                <span>{t.signalsProviderStudio}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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

        {/* ntfy.sh Push Notification Banner */}
        <div className="bg-[#121212] border border-[#262626] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#8BE000]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                {t.signalsNtfyBanner}
              </span>
              <span className="bg-[#8BE000]/15 text-[#8BE000] border border-[#8BE000]/30 text-[10px] px-2 py-0.2 font-mono">
                TOPIC: 360markets_signals
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-sans max-w-2xl leading-relaxed">
              {t.signalsNtfyDesc}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://ntfy.sh/360markets_signals"
              target="_blank"
              rel="noreferrer"
              className="btn-lime text-xs px-4 py-2.5 font-bold flex items-center gap-2 text-black shadow-lg"
            >
              <span>{t.signalsNtfyBtn}</span>
              <ExternalLink className="w-3.5 h-3.5 text-black" />
            </a>
          </div>
        </div>

        {/* Invitation Code Unlock Status or Callout */}
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
              <div key={n} className="bg-[#121212] border border-[#222] p-6 space-y-4 animate-pulse">
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
              return (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#111111] border border-[#262626] hover:border-[#8BE000] p-6 flex flex-col justify-between transition-all space-y-6 group"
                >
                  <div className="space-y-4">
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
                        {isBuy ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{signal.action}</span>
                      </div>
                    </div>

                    {/* Pricing Matrix */}
                    <div className="grid grid-cols-3 gap-2 bg-[#161616] border border-[#262626] p-3 text-center">
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase block">{t.signalsEntry}</span>
                        <span className="text-xs font-bold text-white font-mono">
                          {isUnlocked ? `$${signal.entryPrice.toFixed(2)}` : "$•••.••"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-red-400 uppercase block">{t.signalsStopLoss}</span>
                        <span className="text-xs font-bold text-red-400 font-mono">
                          {isUnlocked ? `$${signal.stopLoss.toFixed(2)}` : "$•••.••"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#8BE000] uppercase block">{t.signalsTarget}</span>
                        <span className="text-xs font-bold text-[#8BE000] font-mono">
                          {isUnlocked ? `$${signal.targetPrice.toFixed(2)}` : "$•••.••"}
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

                    {/* Analysis Notes */}
                    <p className="text-xs text-neutral-300 font-sans leading-relaxed line-clamp-3">
                      {signal.notes}
                    </p>
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

                    {!isUnlocked ? (
                      <button
                        onClick={() => setUnlockModalOpen(true)}
                        className="text-[11px] text-[#8BE000] hover:underline flex items-center gap-1 font-bold"
                      >
                        <Lock className="w-3 h-3" />
                        <span>{t.navUnlock}</span>
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
      <UnlockModal isOpen={unlockModalOpen} onClose={() => setUnlockModalOpen(false)} />
    </div>
  );
}
