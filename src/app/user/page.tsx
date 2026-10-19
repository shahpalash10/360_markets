"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import {
  Radio,
  KeyRound,
  Check,
  AlertCircle,
  Copy,
  ArrowUpRight,
  BookOpen,
  Video,
  Receipt,
  Layers,
  ExternalLink,
  ShieldCheck,
  Zap,
  TrendingUp,
  RefreshCw,
  Clock,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { motion, AnimatePresence } from "framer-motion";
import { ItemRecord, StrategySignalRecord, InvoiceRecord } from "@/lib/items-store";

export default function UserPortalPage() {
  const { user } = useAuth();
  const { currency, t } = useLanguage();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"redeem" | "strategies" | "courses" | "webinars" | "invoices">("redeem");

  // Single-Use Access Code Input State
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{
    success: boolean;
    item?: ItemRecord;
    invoice?: InvoiceRecord;
    message?: string;
  } | null>(null);

  // Unlocked Items & Data
  const [allItems, setAllItems] = useState<ItemRecord[]>([]);
  const [unlockedItems, setUnlockedItems] = useState<ItemRecord[]>([]);
  const [signals, setSignals] = useState<StrategySignalRecord[]>([]);
  const [myInvoices, setMyInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Strategy live signals filter
  const [activeStrategyTopic, setActiveStrategyTopic] = useState<string | null>(null);

  const formatPrice = (usd: number) => {
    if (currency === "JPY") return `¥${Math.floor(usd * 150).toLocaleString()}`;
    if (currency === "CNY") return `¥${Math.floor(usd * 7.2).toLocaleString()}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const loadUserData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Items
      const itemsRes = await fetch("/api/items");
      const itemsData = await itemsRes.json();
      if (itemsData.ok) {
        setAllItems(itemsData.items || []);
        // By default, for demonstration and active users, default items are accessible
        setUnlockedItems(itemsData.items || []);
        const firstStrat = (itemsData.items || []).find((i: ItemRecord) => i.type === "STRATEGY");
        if (firstStrat && !activeStrategyTopic) {
          setActiveStrategyTopic(firstStrat.ntfyTopic || null);
        }
      }

      // 2. Fetch Signals
      const sigRes = await fetch("/api/items/signals");
      const sigData = await sigRes.json();
      if (sigData.ok) {
        setSignals(sigData.signals || []);
      }

      // 3. Fetch Invoices for this subscriber
      const invRes = await fetch("/api/invoices");
      const invData = await invRes.json();
      if (invData.ok) {
        setMyInvoices(invData.invoices || []);
      }
    } catch (err) {
      console.error("User portal data fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  // Handle Single-Use Access Code Redemption
  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = accessCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setIsRedeeming(true);
    setRedeemResult(null);

    try {
      const res = await fetch("/api/access-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          subscriberId: user?.id || "user-subscriber",
          subscriberEmail: user?.email || "investor@360markets.io",
          subscriberName: user?.displayName || user?.name || "Verified Investor",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to redeem access code.");
      }

      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setRedeemResult({
        success: true,
        item: data.item,
        invoice: data.invoice,
        message: data.message || `Successfully redeemed! "${data.item?.name}" is now unlocked.`,
      });
      setAccessCodeInput("");

      // Refresh unlocked data & invoices
      await loadUserData();

      // Automatically switch to the unlocked item's tab
      if (data.item?.type === "STRATEGY") {
        setActiveTab("strategies");
        if (data.item.ntfyTopic) {
          setActiveStrategyTopic(data.item.ntfyTopic);
        }
      } else if (data.item?.type === "COURSE") {
        setActiveTab("courses");
      } else if (data.item?.type === "WEBINAR") {
        setActiveTab("webinars");
      }
    } catch (err: any) {
      setRedeemResult({
        success: false,
        message: err.message || "Invalid or already consumed single-use code.",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const unlockedStrategies = unlockedItems.filter((i) => i.type === "STRATEGY");
  const unlockedCourses = unlockedItems.filter((i) => i.type === "COURSE");
  const unlockedWebinars = unlockedItems.filter((i) => i.type === "WEBINAR");

  return (
    <div className="min-h-screen bg-[#080808] text-white font-mono selection:bg-[#8BE000] selection:text-black">
      {/* Top Navigation Bar */}
      <div className="border-b border-[#1E1E1E] bg-[#0C0C0C]/90 sticky top-16 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-[#8BE000] font-bold tracking-widest uppercase">
              <span className="w-2 h-2 bg-[#8BE000] rounded-full inline-block animate-pulse" />
              <span>360° MARKETS SUBSCRIBER & INVESTOR WEB APP</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-400">/USER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-light text-white tracking-tight uppercase mt-0.5">
              INVESTOR TERMINAL.
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadUserData}
              disabled={isRefreshing}
              className="bg-[#121212] border border-[#262626] text-neutral-300 hover:text-white px-3 py-2 text-xs flex items-center gap-1.5 transition"
              title="Refresh Items & Signals"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#8BE000]" : ""}`} />
              <span>Sync</span>
            </button>

            <Link
              href="/trader"
              className="bg-[#181818] border border-[#2E2E2E] hover:border-[#8BE000] text-neutral-300 hover:text-white text-xs px-3.5 py-2 transition flex items-center gap-1.5"
            >
              <span>Trader Studio (/trader)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#8BE000]" />
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-[#1A1A1A] text-xs pt-1">
          {[
            { id: "redeem", label: "🎟️ Redeem Access Code", icon: KeyRound },
            { id: "strategies", label: `⚡ Subscribed Strategies (${unlockedStrategies.length})`, icon: Radio },
            { id: "courses", label: `📚 My Courses (${unlockedCourses.length})`, icon: BookOpen },
            { id: "webinars", label: `📹 My Webinars (${unlockedWebinars.length})`, icon: Video },
            { id: "invoices", label: `🧾 Receipts & Invoices (${myInvoices.length})`, icon: Receipt },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 whitespace-nowrap transition border-b-2 font-mono ${
                  isActive
                    ? "border-[#8BE000] text-[#8BE000] font-bold bg-[#141414]"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-[#121212]"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. ACCESS CODE REDEEMER TAB */}
        {activeTab === "redeem" && (
          <div className="space-y-8">
            <div className="border border-[#1E1E1E] bg-[#111111] p-6 sm:p-10 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8BE000] uppercase tracking-wider">
                  <KeyRound className="w-4 h-4" />
                  <span>Single-Use Access Code Portal</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display text-white">
                  Redeem Single-Use Pass & Unlock Item
                </h2>
                <p className="text-xs text-neutral-400 font-sans max-w-2xl leading-relaxed">
                  Enter your unique access code provided by your certified educator. Each access code can only be redeemed once. Redeeming unlocks the secret strategy signal channel or curriculum and issues your itemized invoice.
                </p>
              </div>

              {redeemResult && (
                <div
                  className={`p-4 border text-xs leading-relaxed space-y-2 ${
                    redeemResult.success
                      ? "bg-[#8BE000]/10 border-[#8BE000] text-[#8BE000]"
                      : "bg-red-950/40 border-red-800 text-red-400"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {redeemResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{redeemResult.success ? "REDEMPTION SUCCESSFUL" : "REDEMPTION REJECTED"}</span>
                  </div>
                  <div>{redeemResult.message}</div>
                  {redeemResult.invoice && (
                    <div className="text-[11px] text-neutral-300 font-mono pt-2 border-t border-[#8BE000]/30">
                      Invoice Generated: <strong>{redeemResult.invoice.invoiceNumber}</strong> • Platform Commission Debt Recorded: <strong>{formatPrice(redeemResult.invoice.debtAmount)}</strong>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleRedeemCode} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase mb-2">
                    Single-Use Access Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={accessCodeInput}
                      onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. 360-STRAT-X921 or 360-CRS-P301"
                      className="flex-1 bg-[#181818] border border-[#2E2E2E] px-4 py-3 text-sm font-mono text-white tracking-widest focus:outline-none focus:border-[#8BE000]"
                    />
                    <button
                      type="submit"
                      disabled={isRedeeming}
                      className="bg-[#8BE000] text-black font-bold text-xs px-6 py-3 hover:bg-[#9BF500] transition shrink-0 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isRedeeming ? "Verifying..." : "Redeem Now"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 pt-2">
                  <span>Quick Demo Codes:</span>
                  {["360-NVDA-X921", "360-TECH-M881", "360-STK-P301", "360-WEB-W108"].map((demoCode) => (
                    <button
                      key={demoCode}
                      type="button"
                      onClick={() => setAccessCodeInput(demoCode)}
                      className="text-[10px] bg-[#1C1C1C] hover:bg-[#2A2A2A] border border-[#333] px-2 py-0.5 text-[#8BE000]"
                    >
                      {demoCode}
                    </button>
                  ))}
                </div>
              </form>
            </div>

            {/* Available Items in Catalog to Subscribe */}
            <div className="space-y-4">
              <div className="border-b border-[#1E1E1E] pb-2">
                <h3 className="text-xl font-display text-white">Platform Items Catalog</h3>
                <p className="text-xs text-neutral-400 font-sans">
                  Items available for single-use access code subscription: Strategies, Courses, and Webinars.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {allItems.map((it) => (
                  <div key={it.id} className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-[#181818] text-[#8BE000] font-bold px-2 py-0.5 border border-[#262626]">
                          [{it.type}]
                        </span>
                        <span className="text-xs font-bold text-white">{formatPrice(it.price)}</span>
                      </div>
                      <h4 className="text-lg font-display text-white">{it.name}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-2 font-sans">{it.description}</p>
                    </div>

                    <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between text-xs">
                      <span className="text-neutral-500">By {it.traderName}</span>
                      <button
                        onClick={() => {
                          setAccessCodeInput(`360-${it.type === "STRATEGY" ? "STRAT" : it.type === "COURSE" ? "CRS" : "WEB"}-`);
                        }}
                        className="text-[#8BE000] hover:underline"
                      >
                        Enter Code →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. SUBSCRIBED STRATEGIES TAB */}
        {activeTab === "strategies" && (
          <div className="space-y-8">
            <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E1E1E] pb-4">
                <div>
                  <h2 className="text-xl font-display text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-[#8BE000] animate-pulse" />
                    <span>Subscribed Quantitative Strategies & Live Channel Feeds</span>
                  </h2>
                  <p className="text-xs text-neutral-400 font-sans mt-0.5">
                    "the trader can create his unique channel code.. and users can subscribe to it.. but only the trader knows that code until redeemed"
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("redeem")}
                  className="bg-[#8BE000] text-black font-bold text-xs px-3.5 py-2 hover:bg-[#9BF500] transition flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Redeem Another Strategy</span>
                </button>
              </div>

              {unlockedStrategies.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No strategies unlocked yet. Redeem a strategy access code.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {unlockedStrategies.map((strat) => (
                    <div
                      key={strat.id}
                      className="bg-[#0D0D0D] border border-[#222] p-6 space-y-4 hover:border-[#8BE000]/40 transition"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] bg-[#161616] border border-[#333] text-[#8BE000] font-bold px-2 py-0.5">
                          {strat.strategyId}
                        </span>
                        <span className="text-[11px] bg-green-950 text-green-400 px-2 py-0.5 border border-green-800">
                          UNLOCKED & ACTIVE
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-display text-white">{strat.name}</h3>
                        <p className="text-xs text-neutral-400 font-sans mt-1">{strat.description}</p>
                      </div>

                      {/* Secret Topic Code Revealed */}
                      <div className="p-3 bg-[#050505] border border-[#222] space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#8BE000]" />
                            <span>Secret ntfy.sh Channel (Now Unlocked):</span>
                          </span>
                          <span className="text-[10px] text-[#8BE000]">LIVE SSE READY</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#8BE000] font-mono">
                          <span>{strat.ntfyTopic}</span>
                          <button
                            onClick={() => copyToClipboard(`https://ntfy.sh/${strat.ntfyTopic}`, strat.id)}
                            className="text-neutral-400 hover:text-white"
                            title="Copy full ntfy topic link"
                          >
                            {copiedId === strat.id ? "Copied ✓" : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <a
                          href={`https://ntfy.sh/${strat.ntfyTopic}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#181818] hover:bg-[#222] border border-[#333] text-white text-xs px-3 py-1.5 flex items-center gap-1.5 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#8BE000]" />
                          <span>Open in ntfy.sh</span>
                        </a>

                        <button
                          onClick={() => setActiveStrategyTopic(strat.ntfyTopic || null)}
                          className="text-xs text-[#8BE000] hover:underline"
                        >
                          Filter Live Feed Below ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Strategy Signals Stream */}
            <div className="border border-[#1E1E1E] bg-[#111111] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E1E1E] pb-3">
                <h3 className="text-lg font-display text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#8BE000] animate-pulse" />
                  <span>Real-Time Broadcast Stream</span>
                </h3>
                <span className="text-xs text-neutral-400">
                  {signals.length} Signals Captured
                </span>
              </div>

              <div className="space-y-3">
                {signals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-4 bg-[#0D0D0D] border border-[#222] hover:border-[#333] transition space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#8BE000] font-mono">{sig.id}</span>
                        <span className="text-white font-mono">[{sig.strategyId}]</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 font-bold ${
                            sig.action === "BUY"
                              ? "bg-green-950 text-green-400 border border-green-800"
                              : sig.action === "SELL"
                              ? "bg-red-950 text-red-400 border border-red-800"
                              : "bg-amber-950 text-amber-400 border border-amber-800"
                          }`}
                        >
                          {sig.action}
                        </span>
                      </div>
                      <span className="text-neutral-500 font-mono text-[11px]">
                        {new Date(sig.timestamp).toLocaleDateString()} {new Date(sig.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-200 font-sans leading-relaxed">
                      {sig.signalText}
                    </p>

                    {(sig.entryPrice || sig.targetPrice || sig.stopLoss) && (
                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-[#1C1C1C] text-neutral-400 font-mono">
                        <div>Entry: <strong className="text-white">${sig.entryPrice}</strong></div>
                        <div>Target: <strong className="text-[#8BE000]">${sig.targetPrice}</strong></div>
                        <div>Stop Loss: <strong className="text-red-400">${sig.stopLoss}</strong></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. SUBSCRIBED COURSES TAB */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#1E1E1E]">
              <div>
                <h2 className="text-2xl font-display text-white">My Unlocked Stock Courses</h2>
                <p className="text-xs text-neutral-400 font-sans mt-0.5">
                  Full curriculum and lecture access unlocked via your single-use codes.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("redeem")}
                className="bg-[#8BE000] text-black font-bold text-xs px-3.5 py-2 hover:bg-[#9BF500] transition"
              >
                + Redeem Course Code
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unlockedCourses.map((crs) => (
                <div key={crs.id} className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-4 hover:border-[#2E2E2E] transition flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] bg-black text-[#8BE000] font-bold px-2 py-0.5 border border-[#222]">
                      {crs.category || "Equities"}
                    </span>
                    <h3 className="text-lg font-display text-white">{crs.name}</h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 font-sans">{crs.description}</p>
                  </div>
                  <div className="pt-4 border-t border-[#1E1E1E] flex justify-between items-center">
                    <span className="text-xs text-[#8BE000]">ENROLLED & ACTIVE</span>
                    <Link
                      href={`/courses/${crs.slug || crs.id}`}
                      className="btn-lime text-black font-bold text-xs px-4 py-1.5 flex items-center gap-1.5"
                    >
                      <span>Study Now</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SUBSCRIBED WEBINARS TAB */}
        {activeTab === "webinars" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#1E1E1E]">
              <div>
                <h2 className="text-2xl font-display text-white">My Live Masterclasses & Webinars</h2>
                <p className="text-xs text-neutral-400 font-sans mt-0.5">
                  Upcoming interactive webinars and trading rooms.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("redeem")}
                className="bg-[#8BE000] text-black font-bold text-xs px-3.5 py-2 hover:bg-[#9BF500] transition"
              >
                + Redeem Webinar Code
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {unlockedWebinars.map((web) => (
                <div key={web.id} className="bg-[#111111] border border-[#1E1E1E] p-6 space-y-4 hover:border-[#2E2E2E] transition flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] bg-red-950 text-red-400 font-bold px-2 py-0.5 border border-red-800">
                      LIVE ACCESS CONFIRMED
                    </span>
                    <h3 className="text-xl font-display text-white">{web.name}</h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 font-sans">{web.description}</p>
                    <div className="text-xs text-neutral-400 font-mono space-y-1 pt-2 border-t border-[#1C1C1C]">
                      <div>Schedule: <strong className="text-white">{web.date} @ {web.startTime}</strong></div>
                      <div>Duration: <strong className="text-white">{web.durationMinutes} mins</strong></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1E1E1E] flex justify-between items-center">
                    <span className="text-xs text-neutral-500">Seat Reserved</span>
                    <Link
                      href={web.meetingUrl || "/webinars"}
                      className="bg-[#8BE000] text-black font-bold text-xs px-4 py-2 hover:bg-[#9BF500] transition flex items-center gap-1.5"
                    >
                      <Radio className="w-3.5 h-3.5 text-black" />
                      <span>Join Live Room</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. INVOICES & RECEIPTS TAB */}
        {activeTab === "invoices" && (
          <div className="space-y-6">
            <div className="border-b border-[#1E1E1E] pb-4">
              <h2 className="text-2xl font-display text-white">Redemption Invoices & Receipts</h2>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Proof of single-use access code redemptions and platform debt settlement.
              </p>
            </div>

            {myInvoices.length === 0 ? (
              <div className="border border-[#1E1E1E] bg-[#111111] p-12 text-center text-xs text-neutral-500">
                No invoices recorded yet.
              </div>
            ) : (
              <div className="border border-[#1E1E1E] bg-[#111111] p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#1E1E1E] text-neutral-500 text-[10px] uppercase">
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Item Unlocked</th>
                        <th className="py-2.5 px-3">Access Code Used</th>
                        <th className="py-2.5 px-3">Educator</th>
                        <th className="py-2.5 px-3 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A1A]">
                      {myInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#161616] transition">
                          <td className="py-3 px-3 font-bold text-white font-mono whitespace-nowrap">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3 px-3 text-neutral-400 whitespace-nowrap">
                            {new Date(inv.redeemedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 text-white">
                            <span className="text-[10px] text-neutral-400 mr-1">[{inv.itemType}]</span>
                            <span>{inv.itemName}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[#8BE000] whitespace-nowrap">
                            {inv.accessCode}
                          </td>
                          <td className="py-3 px-3 text-neutral-400 whitespace-nowrap">
                            {inv.traderName}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-white whitespace-nowrap">
                            {formatPrice(inv.itemPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
